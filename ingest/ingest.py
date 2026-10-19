#!/usr/bin/env python3
"""Woodpecker PDF ingestion: text extraction + DeepSeek-OCR fallback + local embeddings -> MongoDB (database: pigeon)."""

import argparse
import base64
import hashlib
import os
import re
from datetime import datetime, timezone
from pathlib import Path

import fitz  # PyMuPDF
import requests
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("MONGODB_DATABASE", "pigeon")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
OCR_MODEL = os.getenv("OLLAMA_OCR_MODEL", "deepseek-ocr")
EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
MIN_TEXT_CHARS = 80
CHUNK_SIZE = 2500


def clean(t):
    if not t:
        return ""
    return re.sub(r"\n{3,}", "\n\n", re.sub(r"[ \t]+", " ", t.replace("\x00", " "))).strip()


def chunk_text(text, size=CHUNK_SIZE):
    text = clean(text)
    if not text:
        return []
    if len(text) <= max(size, 15000):
        return [text] if len(text) >= 60 else []
    parts, cur = [], ""
    for para in re.split(r"\n\s*\n", text):
        para = clean(para)
        if not para:
            continue
        if len(para) > size:
            if cur:
                parts.append(cur)
                cur = ""
            for i in range(0, len(para), size):
                parts.append(clean(para[i:i + size]))
            continue
        if len(cur) + len(para) + 1 <= size:
            cur = (cur + "\n" + para) if cur else para
        else:
            parts.append(cur)
            cur = para
    if cur:
        parts.append(cur)
    return [p for p in parts if len(p) >= 100]


def embed_batch(texts, batch=16):
    vectors = []
    for i in range(0, len(texts), batch):
        r = requests.post(f"{OLLAMA_URL}/api/embed", json={"model": EMBED_MODEL, "input": texts[i:i + batch]}, timeout=600)
        r.raise_for_status()
        vectors.extend(r.json().get("embeddings", []))
    return vectors


def ocr_page(page, dpi=150):
    img = base64.b64encode(page.get_pixmap(dpi=dpi).tobytes("png")).decode()
    r = requests.post(f"{OLLAMA_URL}/api/generate", json={
        "model": OCR_MODEL,
        "prompt": "Extract the text in the image.",
        "images": [img],
        "stream": False,
        "options": {"temperature": 0},
    }, timeout=900)
    r.raise_for_status()
    return clean(r.json().get("response", ""))


def guess_category(t):
    t = t.lower()
    for cat, words in [("law", ["act", "regulation", "license", "permit", "compliance"]),
                       ("incentive", ["grant", "incentive", "tax", "financing", "subsidy"]),
                       ("guideline", ["guideline", "procedure", "standard", "checklist"]),
                       ("market_report", ["market", "customer", "competitor", "industry"])]:
        if any(w in t for w in words):
            return cat
    return "document"


def process_pdf(path, live):
    path = Path(path).resolve()
    doc = fitz.open(path)
    pages = []
    for i in range(doc.page_count):
        page = doc.load_page(i)
        text = clean(page.get_text("text", sort=True))
        method = "parser"
        if len(text) < MIN_TEXT_CHARS:
            try:
                ocr = ocr_page(page)
                if len(ocr) >= len(text):
                    text, method = ocr, "deepseek-ocr"
            except Exception as e:
                print(f"  page {i + 1} OCR failed: {e}")
        if text:
            pages.append((i + 1, text, method))
    doc.close()

    chunks = []
    for pno, ptext, method in pages:
        for c in chunk_text(ptext):
            chunks.append({
                "_id": f"{hashlib.sha256(path.name.encode()).hexdigest()[:16]}-p{pno}-{hashlib.sha256(c.encode()).hexdigest()[:16]}",
                "title": path.stem,
                "chunk_text": c,
                "source_type": "pdf",
                "source_name": path.name,
                "page": pno,
                "page_method": method,
                "category": guess_category(c),
                "status": "active",
                "createdAt": datetime.now(timezone.utc).isoformat(),
            })

    if live and chunks:
        vecs = embed_batch([c["chunk_text"] for c in chunks])
        if len(vecs) == len(chunks):
            for c, v in zip(chunks, vecs):
                c["embedding"], c["embed_model"] = v, EMBED_MODEL
        coll = MongoClient(MONGO_URI)[DB_NAME]["document_chunks"]
        coll.delete_many({"source_name": path.name})
        coll.bulk_write([UpdateOne({"_id": c["_id"]}, {"$set": c}, upsert=True) for c in chunks], ordered=False)
    return len(chunks)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--folder", default="./documents")
    ap.add_argument("--live-ingest", action="store_true")
    args = ap.parse_args()

    target = Path(args.folder)
    pdfs = [target] if target.is_file() else sorted(target.rglob("*.pdf"))
    print(f"Found {len(pdfs)} PDF(s). live_ingest={args.live_ingest}")
    for p in pdfs:
        n = process_pdf(p, args.live_ingest)
        print(f"  {p.name}: {n} chunks" + (" ingested" if args.live_ingest else " (dry run)"))


if __name__ == "__main__":
    main()
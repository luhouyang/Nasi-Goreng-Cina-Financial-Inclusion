# Woodpecker

**Prompt your way to business success.** Stream live business plans with SWOT, Porter's Five Forces, Business Model Canvas, financial charts and linked citations.

**Stack:** Next.js · MongoDB Atlas (vector search) · Qwen · Ollama (`nomic-embed-text` embeddings, `deepseek-ocr` for PDFs).

## Install

```powershell
.\setup.ps1
```

One-shot: installs npm packages, pulls Ollama models, creates `.env` + `web/.env.local`. Edit the file with your real keys:

```env
MONGO_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/
QWEN_API_KEY=sk-your-qwen-key
```

## Run

```powershell
npm run dev
# → http://localhost:3000
```

To ingest PDFs into your document store:

```powershell
pip install -r ingest/requirements.txt
python ingest/ingest.py --folder ./documents --live-ingest
```

## Make public with ngrok

```powershell
winget install ngrok.ngrok
ngrok config add-authtoken YOUR_AUTHTOKEN   # from dashboard.ngrok.com
ngrok http 3000
```

Share the printed `https://xxxx.ngrok-free.app` URL.

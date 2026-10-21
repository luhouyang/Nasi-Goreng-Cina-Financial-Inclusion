import { NextResponse } from 'next/server';
import { who } from '@/lib/auth';
import { embed, vectorSearch, qwenStream } from '@/lib/qwen';
import { langInstruction } from '@/lib/lang';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const user = await who();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  const { task, context, lang } = await req.json();
  const L = langInstruction(lang);

  // 1. Get context (embed + search)
  const vector = await embed(task).catch(() => null);
  const evidence = await vectorSearch(vector, 3).catch(() => []);

  // 2. Create a streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event, data) => {
        try { controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)); } catch {}
      };

      try {
        let fullText = '';
        
        // Stream tokens from Qwen
        for await (const tok of qwenStream({
          system: 'You are a focused, human-friendly business assistant. Return STRICT JSON ONLY. No markdown formatting, no bolding, no conversational filler, no code blocks.' + L,
          user: `TASK: ${task}\nCONTEXT: ${context || ''}\nEVIDENCE: ${JSON.stringify(evidence.map((x) => ({ title: x.title, text: (x.chunk_text || '').slice(0, 800) })))}`,
          search: true,
        })) {
          fullText += tok;
          send('token', { text: tok });
        }
        
        send('done', { text: fullText });
      } catch (e) {
        send('error', { message: e.message });
      } finally {
        try { controller.close(); } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
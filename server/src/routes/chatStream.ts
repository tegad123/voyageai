import { Router } from 'express';
import axios from 'axios';
import { ChatRequestSchema } from '../schemas';
import { validateRequest } from '../middleware/validate';
import { AI_SYSTEM_PROMPT } from './chat';

const router = Router();

/**
 * POST /chat/stream  – Returns a text/event-stream (SSE) where each event
 * contains the incremental `delta.content` from OpenAI. Terminates with
 * a single event whose data is "[DONE]".
 */
router.post('/', validateRequest(ChatRequestSchema), async (req, res) => {
  // Setup SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  console.log('▶️  [CHAT/STREAM] Incoming model override:', req.body.model);

  const key = process.env.OPENAI_API_KEY;

  try {
    const openaiResp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: (() => {
          let m = req.body.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
          const lastMsg = req.body.messages?.slice(-1)[0];
          if (lastMsg?.role === 'user' && /final detailed itinerary/i.test(lastMsg.content)) {
            m = 'gpt-4o';
          }
          if (process.env.USE_CHEAP_MODEL === 'true') m = 'gpt-3.5-turbo-0125';
          return m;
        })(),
        messages: [{ role: 'system', content: AI_SYSTEM_PROMPT }, ...req.body.messages],
        temperature: 0.7,
        max_tokens: 3000,
        stream: true,
      },
      {
        responseType: 'stream',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      },
    );

    // Pipe OpenAI stream -> SSE
    openaiResp.data.on('data', (chunk: Buffer) => {
      // The stream is batches of lines like: "data: {json}\n\n"
      const lines = chunk.toString('utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.replace(/^data:\s*/, '');
        if (payload === '[DONE]') {
          res.write(`data: [DONE]\n\n`);
          res.end();
          return;
        }
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            // Send only the incremental text to the client
            res.write(`data: ${delta}\n\n`);
          }
        } catch {
          // ignore malformed JSON chunks
        }
      }
    });

    openaiResp.data.on('end', () => {
      res.end();
    });

    openaiResp.data.on('error', (err: any) => {
      console.error('OpenAI stream error', err);
      if (!res.headersSent) res.status(500);
      res.write(`data: [ERROR]\n\n`);
      res.end();
    });
  } catch (error: any) {
    console.error('[CHAT/STREAM] error', error?.message);
    if (!res.headersSent) {
      res.status(500).json({ error: error?.message || 'stream init failed' });
    }
  }
});

export default router; 
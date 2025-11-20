import { Router } from 'express';
import axios from 'axios';
import { ChatRequestSchema } from '../schemas';
import { validateRequest } from '../middleware/validate';
import http from 'http';
import https from 'https';

const router = Router();

const keepAliveAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });

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

  let key = process.env.OPENAI_API_KEY || '';
  key = key.replace(/[^A-Za-z0-9_\-]/g, '');
  console.log('   • Sanitized OpenAI key length:', key.length);
  const authHeader = `Bearer ${key}`;
  console.log('   • Auth header preview to OpenAI:', JSON.stringify(authHeader).slice(0,30));
  // Debug: log char codes of first 10 chars
  const debugCodes = authHeader.split('').map(c=>c.charCodeAt(0)).slice(0,20);
  console.log('   • Header char codes first20:', debugCodes);

  try {
    const openaiResp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: (() => {
          let m = req.body.model || process.env.OPENAI_MODEL || 'gpt-5-mini';
          const lastMsg = req.body.messages?.slice(-1)[0];
          if (lastMsg?.role === 'user' && /final detailed itinerary/i.test(lastMsg.content)) {
            m = 'gpt-5';
          }
          if (process.env.USE_CHEAP_MODEL === 'true') m = 'gpt-3.5-turbo-0125';
          return m;
        })(),
        messages: [{ role: 'system', content: require('./chat').AI_SYSTEM_PROMPT }, ...req.body.messages],
        temperature: 0.7,
        max_tokens: 3000,
        stream: true,
      },
      {
        responseType: 'stream',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
        httpAgent: keepAliveAgent as unknown as http.Agent,
        httpsAgent: keepAliveAgent,
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
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const connection = new IORedis(process.env.REDIS_URL!);

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

new Worker(
  'notes',
  async (job) => {
    const { noteId, content, userId } = job.data;

    const completion =
      await client.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'user',
            content: `Summarize this note:\n${content}`,
          },
        ],
      });

    const summary =
      completion.choices[0].message.content;

    // save updated note
    const updatedNote =
      await prisma.note.update({
        where: { id: noteId },
        data: { summary },
      });

    // notify backend websocket gateway
    await fetch(
      'http://localhost:3001/notes/realtime-update',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          note: updatedNote,
        }),
      }
    );
  },
  { connection }
);

console.log('Worker running...');
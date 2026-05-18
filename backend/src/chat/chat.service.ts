import { Injectable } from '@nestjs/common';
import { Response } from 'express';

import Groq from 'groq-sdk';

import { NotesService }
  from '../notes/notes.service';

@Injectable()
export class ChatService {
  private groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });


  constructor(
    private notesService: NotesService,
  ) {}

  async chatWithNotes(
  userId: string,
  question: string,
) {
  if (!question?.trim()) {
    throw new Error(
      'Question is required',
    );
  }

  const notes =
    await this.notesService.searchNotes(
      userId,
      question,
    );

  const topNotes = notes.slice(0, 5);

  const context = topNotes
    .map(
      (note, index) =>
        `Note ${index + 1}:
Title: ${note.title}

Content:
${note.content}`,
    )
    .join('\n\n');

  const systemPrompt = `
You are an AI assistant.

Answer the user's question
using ONLY the provided notes.
`;

  const completion =
    await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',

      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },

        {
          role: 'user',
          content: `
QUESTION:
${question}

NOTES:
${context}
`,
        },
      ],

      temperature: 0.3,
    });

  return {
    answer:
      completion.choices[0]
        ?.message?.content || '',

    notesUsed: topNotes,
  };
}
  async streamChat(
  userId: string,
  question: string,
  messages: {
    role: 'user' | 'assistant';

    content: string;
  }[],
  res: Response,
) {
  const notes =
    await this.notesService.searchNotes(
      userId,
      question,
    );

  const context = notes
    .map(
      (n) =>
        `Title: ${n.title}\n${n.content}`,
    )
    .join('\n\n');

  const systemPrompt = `
You are an AI assistant.

Answer using ONLY the provided notes.
`;

  const stream =
    await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',

      stream: true,

      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },

        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),

        {
          role: 'user',
          content: `
QUESTION:
${question}

NOTES:
${context}
`,
        },
      ],
    });

  for await (const chunk of stream) {
    const content =
      chunk.choices?.[0]?.delta
        ?.content;

    if (content) {
      res.write(content);
    }
  }

  res.end();
}
}
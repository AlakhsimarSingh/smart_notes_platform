import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,

  baseURL:
    'https://api.groq.com/openai/v1',
});

export async function generateSummary(
  content: string,
) {
  const response =
            await client.chat.completions.create({
            model: 'llama-3.1-8b-instant',

            messages: [
        {
            role: 'system',
            content: `
        You are an expert note summarizer.

        Write a short natural summary of the note.

        Requirements:
        - Maximum 2 sentences
        - No introductory phrases
        - No "this note discusses"
        - No bullet points
        - No meta commentary
        - Human-sounding
        - Crisp and informative
        - Keep it under 40 words
        `,
        },

        {
            role: 'user',
            content,
        },
        ],

      temperature: 0.3,
    });

  return (
    response.choices[0].message.content ??
    'No summary generated'
  );
}
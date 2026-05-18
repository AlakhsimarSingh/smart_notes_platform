import { z } from 'zod';

export const createNoteSchema =
  z.object({
    title: z
      .string()
      .min(1, 'Title required')
      .max(120),

    content: z
      .string()
      .min(1, 'Content required')
      .max(5000),
  });
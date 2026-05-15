import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { QueueService } from '../queue/queue.service';

import { generateEmbedding }
  from '../ai/embedding.ai.service';

import { cosineSimilarity }
  from '../ai/similarity';

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private queueService: QueueService,
  ) {}

  // ===================================
  // CREATE NOTE
  // ===================================

  async createNote(userId: string, data: any) {
  console.log('CREATE NOTE START');

  try {
    console.log('Generating embedding...');

    const embedding = await generateEmbedding(
      `${data.title} ${data.content}`,
    );

    console.log('Embedding generated');

    console.log('Creating prisma note...');

    const note = await this.prisma.note.create({
      data: {
        ...data,
        userId,
        embedding,
      },
    });

    console.log('Prisma note created');

    console.log('Adding queue job...');

    await this.queueService.addNoteJob({
      noteId: note.id,
      content: note.content,
      userId,
    });

    console.log('Queue job added');

    console.log('Deleting cache...');

    await this.cacheService.del(
      `notes:${userId}`,
    );

    console.log('Cache deleted');

    return note;
  } catch (error) {
    console.error(
      'CREATE NOTE ERROR:',
      error,
    );

    throw error;
  }
}

  // ===================================
  // GET USER NOTES
  // ===================================

  async getUserNotes(userId: string) {
    const cacheKey = `notes:${userId}`;

    try {
      const cached =
        await this.cacheService.get(cacheKey);

      if (cached) {
        console.log('CACHE HIT');

        // already object

        if (typeof cached === 'object') {
          return cached;
        }

        // stringified JSON

        if (
          typeof cached === 'string' &&
          cached.trim() !== ''
        ) {
          return JSON.parse(cached);
        }
      }

      console.log('CACHE MISS');

      const notes =
        await this.prisma.note.findMany({
          where: {
            userId,
            isArchived: false,
          },

          orderBy: {
            createdAt: 'desc',
          },
        });

      await this.cacheService.set(
        cacheKey,
        JSON.stringify(notes),
      );

      return notes;
    } catch (error) {
      console.error(
        'Cache error:',
        error,
      );

      return this.prisma.note.findMany({
        where: {
          userId,
          isArchived: false,
        },

        orderBy: {
          createdAt: 'desc',
        },
      });
    }
  }

  // ===================================
  // UPDATE NOTE
  // ===================================

  async updateNote(
    userId: string,
    noteId: string,
    data: any,
  ) {
    const updated =
      await this.prisma.note.updateMany({
        where: {
          id: noteId,
          userId,
        },

        data,
      });

    // clear cache

    await this.cacheService.del(
      `notes:${userId}`,
    );

    return updated;
  }

  // ===================================
  // DELETE NOTE
  // ===================================

  async deleteNote(
    userId: string,
    noteId: string,
  ) {
    const deleted =
      await this.prisma.note.deleteMany({
        where: {
          id: noteId,
          userId,
        },
      });

    // clear cache

    await this.cacheService.del(
      `notes:${userId}`,
    );

    return deleted;
  }

  // ===================================
  // ARCHIVE NOTE
  // ===================================

  async archiveNote(
    userId: string,
    noteId: string,
  ) {
    const archived =
      await this.prisma.note.updateMany({
        where: {
          id: noteId,
          userId,
        },

        data: {
          isArchived: true,
        },
      });

    // clear cache

    await this.cacheService.del(
      `notes:${userId}`,
    );

    return archived;
  }

  // ===================================
  // SEMANTIC SEARCH
  // ===================================

  async searchNotes(
    userId: string,
    query: string,
  ) {
    const queryEmbedding =
      await generateEmbedding(query);

    const notes =
      await this.prisma.note.findMany({
        where: {
          userId,
          isArchived: false,
        },
      });

    const scored = notes.map((note) => {
      const embedding =
        Array.isArray(note.embedding)
          ? note.embedding.filter(
              (x): x is number =>
                typeof x === 'number',
            )
          : [];

      const score =
        cosineSimilarity(
          queryEmbedding,
          embedding,
        );

      return {
        note,
        score,
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .map((x) => x.note);
  }

  // ===================================
  // TEXT SEARCH + CACHE
  // ===================================

  async searchUserNotes(
    userId: string,
    query: string,
  ) {
    const cacheKey =
      `search:${userId}:${query}`;

    try {
      const cached =
        await this.cacheService.get(cacheKey);

      if (cached) {
        console.log(
          'CACHE HIT (SEARCH)',
        );

        // already parsed object

        if (typeof cached === 'object') {
          return cached;
        }

        // JSON string

        if (
          typeof cached === 'string' &&
          cached.trim() !== ''
        ) {
          return JSON.parse(cached);
        }
      }

      console.log(
        'CACHE MISS (SEARCH)',
      );

      const results =
        await this.prisma.note.findMany({
          where: {
            userId,
            isArchived: false,

            OR: [
              {
                title: {
                  contains: query,
                  mode: 'insensitive',
                },
              },

              {
                content: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            ],
          },
        });

      await this.cacheService.set(
        cacheKey,
        JSON.stringify(results),
      );

      return results;
    } catch (error) {
      console.error(
        'Search cache error:',
        error,
      );

      return this.prisma.note.findMany({
        where: {
          userId,
          isArchived: false,

          OR: [
            {
              title: {
                contains: query,
                mode: 'insensitive',
              },
            },

            {
              content: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
      });
    }
  }
}
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async getUserNotes(userId: string) {
    const cacheKey = `notes:${userId}`;

    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      console.log('CACHE HIT');
      return cached;
    }

    console.log('CACHE MISS');

    // const notes = await this.prisma.note.findMany({
    //   where: {
    //     userId,
    //   },
    // });
    const notes = await this.prisma.note.findMany();

    await this.cacheService.set(cacheKey, notes);

    return notes;
  }
}
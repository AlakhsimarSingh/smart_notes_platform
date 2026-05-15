import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bull';
import IORedis from 'ioredis';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('notes')
    private notesQueue: Queue,
  ) {}

  async addNoteJob(data: any) {
    console.log('QUEUE: Adding job');

    await this.notesQueue.add(
      'generate-summary',
      data,
    );

    console.log('QUEUE: Job added');
  }
}
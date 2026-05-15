import { Module } from '@nestjs/common';

import { BullModule } from '@nestjs/bull';

import { QueueService } from './queue.service';
import { NotesProcessor } from './notes.processor';

import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    PrismaModule,
    RealtimeModule,

    BullModule.registerQueue({
      name: 'notes',
    }),
  ],

  providers: [
    QueueService,
    NotesProcessor,
  ],

  exports: [QueueService],
})
export class QueueModule {}
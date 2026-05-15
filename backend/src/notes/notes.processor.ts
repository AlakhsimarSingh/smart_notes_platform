import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';

import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Processor('notes')
export class NotesProcessor {
  constructor(
    private prisma: PrismaService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  @Process('generate-summary')
  async handleSummary(job: Job) {
    console.log('========================');
    console.log('QUEUE JOB STARTED');
    console.log(job.data);

    try {
      const { noteId, content, userId } = job.data;

      // -----------------------------------
      // GENERATE SUMMARY
      // -----------------------------------

      console.log('Generating summary...');

      // TEMP MOCK SUMMARY
      // replace later with OpenAI call

      const summary =
        content.length > 100
          ? content.slice(0, 100) + '...'
          : content;

      console.log('Summary generated:', summary);

      // -----------------------------------
      // UPDATE DATABASE
      // -----------------------------------

      console.log('Updating note in database...');

      const updatedNote =
        await this.prisma.note.update({
          where: {
            id: noteId,
          },

          data: {
            summary,
          },
        });

      console.log('Database updated');

      // -----------------------------------
      // REALTIME SOCKET UPDATE
      // -----------------------------------

      console.log('Sending realtime update...');

      this.realtimeGateway.sendNoteUpdate(
        userId,
        updatedNote,
      );

      console.log('Realtime update sent');

      console.log('QUEUE JOB COMPLETED');
      console.log('========================');
    } catch (error) {
      console.error(
        'PROCESSOR ERROR:',
        error,
      );
    }
  }
}
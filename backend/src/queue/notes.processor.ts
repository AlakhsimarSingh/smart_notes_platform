import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { generateSummary }
  from '../ai/summary.ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { htmlToText }
  from 'html-to-text';
@Processor('notes')
export class NotesProcessor {
  constructor(
    private prisma: PrismaService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  @Process('generate-summary')
  async handleSummary(job: Job) {
    console.log('PROCESSOR RUNNING');

    const { noteId, content, userId } =
      job.data;
    const cleanText = htmlToText(
      content,
    );
      const summary =
    await generateSummary(cleanText,);

    const updatedNote =
      await this.prisma.note.update({
        where: {
          id: noteId,
        },

        data: {
          summary,
        },
      });

    console.log('SUMMARY GENERATED');

    // realtime emit

    this.realtimeGateway.sendNoteUpdate(
      userId,
      updatedNote,
    );

    return updatedNote;
  }
}


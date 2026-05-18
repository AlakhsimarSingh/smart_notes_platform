import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { NotesModule } from './notes/notes.module';
import { CacheModule } from './cache/cache.module';
import { QueueModule } from './queue/queue.module';
import { RealtimeModule } from './realtime/realtime.module';
import { BullModule } from '@nestjs/bull';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: '127.0.0.1',
        port: 6379,
      },
    }),
    PrismaModule,
    AuthModule,
    NotesModule,
    CacheModule,
    QueueModule,
    RealtimeModule,
    ChatModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
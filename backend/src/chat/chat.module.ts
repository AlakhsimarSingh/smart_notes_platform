import { Module } from '@nestjs/common';

import { ChatController }
  from './chat.controller';

import { ChatService }
  from './chat.service';

import { NotesModule }
  from '../notes/notes.module';

@Module({
  imports: [NotesModule],

  controllers: [ChatController],

  providers: [ChatService],
})
export class ChatModule {}
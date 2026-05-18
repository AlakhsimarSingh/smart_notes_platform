import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard }
  from '../auth/jwt-auth.guard';

import { ChatService }
  from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService:
      ChatService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async chat(
    @Req() req: any,
        @Body()
    body: {
      question: string;
    },
  ) {
    return this.chatService.chatWithNotes(
    req.user.sub,
    body.question,
    );
  }

@Post('stream')
@UseGuards(JwtAuthGuard)
async streamChat(
  @Req() req,
  @Body()
  body: {
    question: string;

    messages: {
      role: 'user' | 'assistant';

      content: string;
    }[];
  },
  @Res() res,
) {
  res.setHeader(
    'Content-Type',
    'text/plain; charset=utf-8',
  );

  res.setHeader(
    'Transfer-Encoding',
    'chunked',
  );

  await this.chatService.streamChat(
    req.user.sub,
    body.question,
    body.messages,
    res,
  );
}
}
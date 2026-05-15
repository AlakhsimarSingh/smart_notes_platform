import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { NotesService } from './notes.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';

@Controller('notes')
@UseGuards(AuthGuard('jwt'))
export class NotesController {
  constructor(
    private notesService: NotesService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  // -----------------------------------
  // CREATE NOTE
  // -----------------------------------

  @Post()
  createNote(
    @Body() dto: any,
    @Req() req,
  ) {
    return this.notesService.createNote(
      req.user.sub,
      dto,
    );
  }

  // -----------------------------------
  // GET NOTES
  // -----------------------------------

  @Get()
  getNotes(@Req() req) {
    return this.notesService.getUserNotes(
      req.user.sub,
    );
  }

  // -----------------------------------
  // UPDATE NOTE
  // -----------------------------------

  @Patch(':id')
  updateNote(
    @Param('id') noteId: string,
    @Body() dto: any,
    @Req() req,
  ) {
    return this.notesService.updateNote(
      req.user.sub,
      noteId,
      dto,
    );
  }

  // -----------------------------------
  // DELETE NOTE
  // -----------------------------------

  @Delete(':id')
  deleteNote(
    @Param('id') noteId: string,
    @Req() req,
  ) {
    return this.notesService.deleteNote(
      req.user.sub,
      noteId,
    );
  }

  // -----------------------------------
  // ARCHIVE NOTE
  // -----------------------------------

  @Patch(':id/archive')
  archiveNote(
    @Param('id') noteId: string,
    @Req() req,
  ) {
    return this.notesService.archiveNote(
      req.user.sub,
      noteId,
    );
  }

  // -----------------------------------
  // SEARCH NOTES
  // -----------------------------------

  @Get('search')
  search(
    @Req() req,
    @Query('q') q: string,
  ) {
    return this.notesService.searchUserNotes(
      req.user.sub,
      q,
    );
  }

  // -----------------------------------
  // REALTIME UPDATE TEST
  // -----------------------------------

  @Post('realtime-update')
  sendUpdate(@Body() body: any) {
    return this.realtimeGateway.sendNoteUpdate(
      body.userId,
      body.note,
    );
  }
}
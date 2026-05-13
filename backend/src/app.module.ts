import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { NotesModule } from './notes/notes.module';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [PrismaModule, AuthModule, NotesModule, CacheModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

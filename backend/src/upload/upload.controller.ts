import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';

@Controller('api/upload')
export class UploadController {
  private uploadsDir = process.env.UPLOADS_DIR || join(process.cwd(), 'uploads');

  constructor() {
    mkdirSync(this.uploadsDir, { recursive: true });
  }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => cb(null, process.env.UPLOADS_DIR || join(process.cwd(), 'uploads')),
        filename: (req, file, cb) => {
          const ext = extname(file.originalname);
          const filename = `${randomUUID()}${ext}`;
          cb(null, filename);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return { url: `/uploads/${file.filename}` };
  }
}

import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from './auth.guard';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

@Controller('api/upload')
export class UploadController {
  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.cwd(), '..', 'public', 'uploads'),
      filename: (req, file, cb) => {
        const ext = extname(file.originalname);
        const filename = `${randomUUID()}${ext}`;
        cb(null, filename);
      },
    }),
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return { url: `/uploads/${file.filename}` };
  }
}

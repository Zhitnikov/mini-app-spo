import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { ok: true } {
    return { ok: true };
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth(): { ok: true } {
    return { ok: true };
  }
}

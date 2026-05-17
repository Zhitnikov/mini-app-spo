import { mkdirSync } from 'fs';
import { join } from 'path';

export function resolveLottieDir(): string {
  const override = process.env.LOTTIE_DIR?.trim();
  if (override) {
    const isAbsolute =
      override.startsWith('/') ||
      /^[A-Za-z]:[\\/]/.test(override);
    return isAbsolute ? override : join(process.cwd(), override);
  }

  const segment =
    process.env.NODE_ENV === 'production' ? 'dist' : 'public';

  return join(process.cwd(), '..', 'front', segment, 'lottie');
}

export function ensureLottieDir(): string {
  const dir = resolveLottieDir();
  mkdirSync(dir, { recursive: true });
  return dir;
}

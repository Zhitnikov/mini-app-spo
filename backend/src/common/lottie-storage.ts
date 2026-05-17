import { mkdirSync } from 'fs';
import { join } from 'path';

function resolvePathFromEnv(value: string): string {
  const trimmed = value.trim();
  const isAbsolute =
    trimmed.startsWith('/') || /^[A-Za-z]:[\\/]/.test(trimmed);
  return isAbsolute ? trimmed : join(process.cwd(), trimmed);
}

export function resolveLottieDir(): string {
  const lottieDir = process.env.LOTTIE_DIR?.trim();
  if (lottieDir) {
    return resolvePathFromEnv(lottieDir);
  }

  const webRoot = process.env.STATIC_WEB_ROOT?.trim();
  if (webRoot) {
    return join(resolvePathFromEnv(webRoot), 'lottie');
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

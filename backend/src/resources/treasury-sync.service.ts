import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_SHEET_ID = '1DWRFOtNXhBvgl56MKQFQMkCEZJpTc7S-k00S_9aB0X8';
const DEFAULT_GID = '544888957';
const MAX_COLUMNS = 15; // A–O

/** Простой CSV-парсер с учётом кавычек. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
      row.push(cell);
      cell = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
      if (ch === '\r') i++;
    } else if (ch !== '\r') {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((c) => c.trim() !== '')) rows.push(row);
  }

  return rows;
}

function trimRowsToColumns(rows: string[][], maxCols: number): string[][] {
  return rows.map((r) => {
    const slice = r.slice(0, maxCols);
    while (slice.length < maxCols) slice.push('');
    return slice.map((c) => c.trim());
  });
}

function rowHasData(row: string[]): boolean {
  return row.some((c) => c.trim() !== '');
}

@Injectable()
export class TreasurySyncService implements OnModuleInit {
  private readonly logger = new Logger(TreasurySyncService.name);
  private syncing = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    void this.syncFromGoogleSheet();
    setInterval(
      () => {
        void this.syncFromGoogleSheet();
      },
      60 * 60 * 1000,
    );
  }

  private sheetExportUrl(): string {
    const sheetId =
      process.env.SQUAD_TREASURY_SHEET_ID?.trim() || DEFAULT_SHEET_ID;
    const gid = process.env.SQUAD_TREASURY_GID?.trim() || DEFAULT_GID;
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }

  async syncFromGoogleSheet(): Promise<{ ok: boolean; rowCount?: number }> {
    if (this.syncing) return { ok: false };
    this.syncing = true;

    try {
      const res = await fetch(this.sheetExportUrl(), {
        headers: { 'User-Agent': 'spo-mini-app/1.0' },
      });
      if (!res.ok) {
        this.logger.warn(`Treasury sheet fetch failed: ${res.status}`);
        return { ok: false };
      }

      const text = await res.text();
      const parsed = trimRowsToColumns(parseCsv(text), MAX_COLUMNS);
      if (parsed.length === 0) {
        this.logger.warn('Treasury sheet empty');
        return { ok: false };
      }

      const headers = parsed[0] ?? [];
      const dataRows = parsed.slice(1);
      let lastFilled = -1;
      for (let i = 0; i < dataRows.length; i++) {
        if (rowHasData(dataRows[i] ?? [])) lastFilled = i;
      }
      const rows = lastFilled >= 0 ? dataRows.slice(0, lastFilled + 1) : [];

      await this.prisma.squadTreasuryCache.upsert({
        where: { id: 'default' },
        create: {
          id: 'default',
          headers,
          rows,
          syncedAt: new Date(),
        },
        update: {
          headers,
          rows,
          syncedAt: new Date(),
        },
      });

      this.logger.log(`Treasury synced: ${rows.length} data rows`);
      return { ok: true, rowCount: rows.length };
    } catch (e) {
      this.logger.error('Treasury sync error', e);
      return { ok: false };
    } finally {
      this.syncing = false;
    }
  }

  async getCached() {
    return this.prisma.squadTreasuryCache.findUnique({
      where: { id: 'default' },
    });
  }
}

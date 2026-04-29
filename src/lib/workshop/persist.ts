import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_FILE = join(process.cwd(), 'workshop-data.json');

// Skip file persistence on read-only filesystems (e.g. Vercel)
function isWritable(): boolean {
  try {
    writeFileSync(DATA_FILE + '.test', '');
    return true;
  } catch {
    return false;
  }
}

let _canWrite: boolean | null = null;

export function saveToFile(data: object) {
  if (_canWrite === null) _canWrite = isWritable();
  if (!_canWrite) return;
  try {
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch {
    _canWrite = false;
  }
}

export function loadFromFile(): any {
  try {
    if (!existsSync(DATA_FILE)) return null;
    const raw = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Persist] Failed to load:', err);
    return null;
  }
}

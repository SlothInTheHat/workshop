import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_FILE = join(process.cwd(), 'workshop-data.json');

export function saveToFile(data: object) {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[Persist] Failed to save:', err);
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

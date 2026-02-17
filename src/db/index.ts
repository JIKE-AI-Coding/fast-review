import Dexie, { Table } from 'dexie';
import type { File, Note, ReviewRecord, UserSettings } from '../types';

class ReviewDatabase extends Dexie {
  files!: Table<File>;
  notes!: Table<Note>;
  reviewRecords!: Table<ReviewRecord>;
  settings!: Table<UserSettings>;

  constructor() {
    super('ReviewDatabase');

    this.version(1).stores({
      files: 'id, path, name, nextReviewAt, lastReviewedAt',
      notes: 'id, fileId, createdAt',
      reviewRecords: 'id, fileId, reviewedAt',
      settings: 'key'
    });
  }
}

export const db = new ReviewDatabase();

export async function initializeSettings() {
  const existing = await db.settings.get('user');
  if (!existing) {
    await db.settings.put({
      key: 'user',
      theme: 'light',
      fontSize: 16,
      contentWidth: 800,
      reviewInterval: [5, 30, 720, 1440, 2880, 5760, 10080, 21600]
    });
  }
}

export default db;

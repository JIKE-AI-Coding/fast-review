import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNote } from './noteService';

vi.mock('../db', () => ({
  default: {
    notes: {
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import db from '../db';

describe('noteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a note', async () => {
    vi.mocked(db.notes.add).mockResolvedValue('note-id' as any);

    const note = await createNote('file-id', 'test content');

    expect(note.fileId).toBe('file-id');
    expect(note.content).toBe('test content');
    expect(db.notes.add).toHaveBeenCalled();
  });
});

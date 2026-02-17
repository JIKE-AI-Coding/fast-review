import { describe, it, expect, vi, beforeEach } from 'vitest';
import { markAsLearned } from './reviewService';

vi.mock('../db', () => ({
  default: {
    files: {
      get: vi.fn(),
      update: vi.fn(),
    },
    reviewRecords: {
      add: vi.fn(),
    },
  },
}));

import db from '../db';

describe('reviewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark file as learned', async () => {
    const mockFile = {
      id: 'test-file',
      reviewLevel: 0,
    };

    vi.mocked(db.files.get).mockResolvedValue(mockFile as any);

    await markAsLearned('test-file');

    expect(db.files.update).toHaveBeenCalledWith(
      'test-file',
      expect.objectContaining({
        reviewLevel: 1,
        lastReviewedAt: expect.any(Number),
        nextReviewAt: expect.any(Number),
      })
    );
  });
});

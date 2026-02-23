import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { recordReadingHistory, getRecentReadingFiles } from './readingHistoryService';
import db from '../db';

// Mock the database
vi.mock('../db', () => ({
  default: {
    readingHistory: {
      add: vi.fn(),
      orderBy: vi.fn(() => ({
        reverse: vi.fn(() => ({
          toArray: vi.fn()
        }))
      }))
    },
    files: {
      bulkGet: vi.fn()
    }
  }
}));

describe('Reading History Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('recordReadingHistory', () => {
    it('should record reading history with correct data', async () => {
      const mockAdd = vi.mocked(db.readingHistory.add);
      mockAdd.mockResolvedValue(undefined);

      const fileId = 'test-file-1';
      const readingDuration = 120;
      const readingProgress = 0.5;

      await recordReadingHistory(fileId, readingDuration, readingProgress);

      expect(mockAdd).toHaveBeenCalledTimes(1);
      const callArgs = mockAdd.mock.calls[0][0];
      expect(callArgs).toHaveProperty('fileId', fileId);
      expect(callArgs).toHaveProperty('readingDuration', readingDuration);
      expect(callArgs).toHaveProperty('readingProgress', readingProgress);
      expect(callArgs.id).toMatch(new RegExp(`^reading_\\d+_${fileId}$`));
      expect(typeof callArgs.readAt).toBe('number');
    });

    it('should record reading history with optional parameters', async () => {
      const mockAdd = vi.mocked(db.readingHistory.add);
      mockAdd.mockResolvedValue(undefined);

      const fileId = 'test-file-2';

      await recordReadingHistory(fileId);

      expect(mockAdd).toHaveBeenCalledTimes(1);
      const callArgs = mockAdd.mock.calls[0][0];
      expect(callArgs).toHaveProperty('fileId', fileId);
      expect(callArgs.id).toMatch(new RegExp(`^reading_\\d+_${fileId}$`));
      expect(typeof callArgs.readAt).toBe('number');
      expect(callArgs.readingDuration).toBeUndefined();
      expect(callArgs.readingProgress).toBeUndefined();
    });
  });

  describe('getRecentReadingFiles', () => {
    it('should return recent reading files with correct structure', async () => {
      const mockHistory = [
        { id: '1', fileId: 'file1', readAt: Date.now() - 1000 },
        { id: '2', fileId: 'file2', readAt: Date.now() - 2000 },
        { id: '3', fileId: 'file1', readAt: Date.now() - 3000 }, // Duplicate file
        { id: '4', fileId: 'file3', readAt: Date.now() - 4000 }
      ];

      const mockFiles = [
        { 
          id: 'file1', 
          name: 'File 1.md',
          path: '/path/to/File 1.md',
          content: '# File 1',
          size: 100,
          modifiedAt: Date.now(),
          createdAt: Date.now(),
          reviewLevel: 0,
          lastReviewedAt: 0,
          nextReviewAt: 0,
          readingProgress: 0
        },
        { 
          id: 'file2', 
          name: 'File 2.md',
          path: '/path/to/File 2.md',
          content: '# File 2',
          size: 200,
          modifiedAt: Date.now(),
          createdAt: Date.now(),
          reviewLevel: 0,
          lastReviewedAt: 0,
          nextReviewAt: 0,
          readingProgress: 0
        },
        { 
          id: 'file3', 
          name: 'File 3.md',
          path: '/path/to/File 3.md',
          content: '# File 3',
          size: 300,
          modifiedAt: Date.now(),
          createdAt: Date.now(),
          reviewLevel: 0,
          lastReviewedAt: 0,
          nextReviewAt: 0,
          readingProgress: 0
        }
      ];

      const mockOrderBy = vi.mocked(db.readingHistory.orderBy);
      const mockReverse = vi.fn();
      const mockToArray = vi.fn().mockResolvedValue(mockHistory);
      
      mockOrderBy.mockReturnValue({
        reverse: () => ({
          toArray: mockToArray
        })
      } as any);

      const mockBulkGet = vi.mocked(db.files.bulkGet);
      mockBulkGet.mockResolvedValue(mockFiles);

      const result = await getRecentReadingFiles(3);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        fileId: 'file1',
        fileName: 'File 1.md',
        readCount: 2,
        lastReadAt: expect.any(Number)
      });
      expect(result[1]).toMatchObject({
        fileId: 'file2',
        fileName: 'File 2.md',
        readCount: 1,
        lastReadAt: expect.any(Number)
      });
    });

    it('should handle missing file names', async () => {
      const mockHistory = [
        { id: '1', fileId: 'unknown-file', readAt: Date.now() }
      ];

      const mockOrderBy = vi.mocked(db.readingHistory.orderBy);
      const mockToArray = vi.fn().mockResolvedValue(mockHistory);
      
      mockOrderBy.mockReturnValue({
        reverse: () => ({
          toArray: mockToArray
        })
      } as any);

      const mockBulkGet = vi.mocked(db.files.bulkGet);
      mockBulkGet.mockResolvedValue([null]); // File not found

      const result = await getRecentReadingFiles(3);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        fileId: 'unknown-file',
        fileName: '未知文件',
        readCount: 1
      });
    });

    it('should limit results correctly', async () => {
      const mockHistory = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        fileId: `file${i}`,
        readAt: Date.now() - i * 1000
      }));

      const mockOrderBy = vi.mocked(db.readingHistory.orderBy);
      const mockToArray = vi.fn().mockResolvedValue(mockHistory);
      
      mockOrderBy.mockReturnValue({
        reverse: () => ({
          toArray: mockToArray
        })
      } as any);

      const mockBulkGet = vi.mocked(db.files.bulkGet);
      mockBulkGet.mockResolvedValue(mockHistory.map(h => ({
        id: h.fileId,
        name: `File ${h.fileId}.md`,
        path: `/path/to/File ${h.fileId}.md`,
        content: `# File ${h.fileId}`,
        size: 100,
        modifiedAt: Date.now(),
        createdAt: Date.now(),
        reviewLevel: 0,
        lastReviewedAt: 0,
        nextReviewAt: 0,
        readingProgress: 0
      })));

      const result = await getRecentReadingFiles(5);

      expect(result).toHaveLength(5);
    });
  });
});
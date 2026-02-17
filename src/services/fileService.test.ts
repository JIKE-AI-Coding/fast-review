import { describe, it, expect } from 'vitest';
import { generateFileId } from './fileService';

const mockFileService = {
  generateFileId
};

describe('generateFileId', () => {
  it('should generate consistent ID for same path', () => {
    const path = '/test/file.md';
    const id1 = mockFileService.generateFileId(path);
    const id2 = mockFileService.generateFileId(path);
    expect(id1).toBe(id2);
  });

  it('should generate different IDs for different paths', () => {
    const id1 = mockFileService.generateFileId('/test/file1.md');
    const id2 = mockFileService.generateFileId('/test/file2.md');
    expect(id1).not.toBe(id2);
  });
});

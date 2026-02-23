import type { ReadingHistory, FileEntity } from '../types';
import db from '../db';

/**
 * 记录阅读历史
 */
let historyIdCounter = 0;

export async function recordReadingHistory(
  fileId: string,
  readingDuration?: number,
  readingProgress?: number
): Promise<void> {
  const now = Date.now();
  const uniqueId = `reading_${now}_${fileId}_${++historyIdCounter}`;
  await db.readingHistory.add({
    id: uniqueId,
    fileId,
    readAt: now,
    readingDuration,
    readingProgress,
  });
}

/**
 * 获取最近阅读的文件（去重）
 */
export async function getRecentReadingFiles(limit: number = 3): Promise<Array<{
  fileId: string;
  fileName: string;
  lastReadAt: number;
  readCount: number;
}>> {
  const allHistory = await db.readingHistory
    .orderBy('readAt')
    .reverse()
    .toArray();

  if (allHistory.length === 0) {
    return [];
  }

  const latestReadMap = new Map<string, ReadingHistory>();
  
  for (const record of allHistory) {
    if (!latestReadMap.has(record.fileId)) {
      latestReadMap.set(record.fileId, record);
    }
  }

  // 获取文件信息
  const recentFiles = Array.from(latestReadMap.values())
    .slice(0, limit);

  const fileIds = recentFiles.map(record => record.fileId);
  const files = await db.files.bulkGet(fileIds);

  // 统计每个文件的总阅读次数
  const readCounts = new Map<string, number>();
  for (const record of allHistory) {
    readCounts.set(record.fileId, (readCounts.get(record.fileId) || 0) + 1);
  }

  return recentFiles.map(record => {
    const file = files.find(f => f?.id === record.fileId);
    return {
      fileId: record.fileId,
      fileName: file?.name || '未知文件',
      lastReadAt: record.readAt,
      readCount: readCounts.get(record.fileId) || 1,
    };
  });
}

/**
 * 获取文件的所有阅读历史
 */
export async function getFileReadingHistory(fileId: string): Promise<ReadingHistory[]> {
  return await db.readingHistory
    .where('fileId')
    .equals(fileId)
    .toArray();
}

export interface PaginatedReadingHistory {
  items: Array<{
    fileId: string;
    fileName: string;
    filePath: string;
    lastReadAt: number;
    readCount: number;
    readingDuration?: number;
    readingProgress: number;
  }>;
  total: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

export async function getAllReadingHistoryPaginated(
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedReadingHistory> {
  const allHistory = await db.readingHistory
    .orderBy('readAt')
    .reverse()
    .toArray();

  const latestReadMap = new Map<string, ReadingHistory>();
  for (const record of allHistory) {
    if (!latestReadMap.has(record.fileId)) {
      latestReadMap.set(record.fileId, record);
    }
  }

  const readCounts = new Map<string, number>();
  for (const record of allHistory) {
    readCounts.set(record.fileId, (readCounts.get(record.fileId) || 0) + 1);
  }

  const allFiles = Array.from(latestReadMap.values());
  const total = allFiles.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = allFiles.slice(startIndex, endIndex);

  const fileIds = paginatedRecords.map(record => record.fileId);
  const files = await db.files.bulkGet(fileIds);

  const items = paginatedRecords.map(record => {
    const file = files.find(f => f?.id === record.fileId);
    return {
      fileId: record.fileId,
      fileName: file?.name || '未知文件',
      filePath: file?.path || '',
      lastReadAt: record.readAt,
      readCount: readCounts.get(record.fileId) || 1,
      readingDuration: record.readingDuration,
      readingProgress: file?.readingProgress || 0,
    };
  });

  return {
    items,
    total,
    hasMore: endIndex < total,
    page,
    pageSize,
  };
}

export async function getTotalReadingCount(): Promise<number> {
  const allHistory = await db.readingHistory.toArray();
  const uniqueFiles = new Set(allHistory.map(h => h.fileId));
  return uniqueFiles.size;
}

export async function updateFileReadingProgress(
  fileId: string,
  progress: number,
  scrollPosition?: number
): Promise<void> {
  await db.files.update(fileId, {
    readingProgress: Math.min(100, Math.max(0, progress)),
    scrollPosition,
  });
}

export async function getFileReadingProgress(fileId: string): Promise<{
  progress: number;
  scrollPosition?: number;
} | null> {
  const file = await db.files.get(fileId);
  if (!file) return null;
  
  return {
    progress: file.readingProgress || 0,
    scrollPosition: file.scrollPosition,
  };
}

export async function getLatestReadingProgress(fileId: string): Promise<number> {
  const history = await db.readingHistory
    .where('fileId')
    .equals(fileId)
    .reverse()
    .first();
  
  return history?.readingProgress || 0;
}
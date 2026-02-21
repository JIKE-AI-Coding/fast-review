import type { ReadingHistory, FileEntity } from '../types';
import db from '../db';

/**
 * 记录阅读历史
 */
export async function recordReadingHistory(
  fileId: string,
  readingDuration?: number,
  readingProgress?: number
): Promise<void> {
  const now = Date.now();
  
  await db.readingHistory.add({
    id: `reading_${now}_${fileId}`,
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
  // 获取所有阅读历史，按时间倒序
  const allHistory = await db.readingHistory
    .orderBy('readAt')
    .reverse()
    .toArray();

  // 按文件去重，保留最近的一次阅读记录
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
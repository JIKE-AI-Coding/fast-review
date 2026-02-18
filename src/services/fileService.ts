import type { FileEntity } from '../types';
import db from '../db';

/**
 * 生成文件ID（路径的哈希值）
 */
export function generateFileId(path: string): string {
  let hash = 0;
  for (let i = 0; i < path.length; i++) {
    const char = path.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `file_${Math.abs(hash)}`;
}

/**
 * 保存多个文件到数据库
 */
export async function saveFilesToDatabase(files: Array<{
  id: string;
  path: string;
  name: string;
  content: string;
  size: number;
  modifiedAt: number;
  createdAt: number;
  reviewLevel: number;
  lastReviewedAt: number;
  nextReviewAt: number;
  readingProgress: number;
}>): Promise<void> {
  await db.files.bulkPut(files);
}

/**
 * 删除文件
 */
export async function deleteFile(fileId: string): Promise<void> {
  await db.files.delete(fileId);
}

/**
 * 批量删除文件
 */
export async function deleteFiles(fileIds: string[]): Promise<void> {
  await db.files.bulkDelete(fileIds);
}

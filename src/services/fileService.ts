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

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
 * 扫描目录中的所有markdown文件
 */
export async function scanDirectory(directoryHandle: FileSystemDirectoryHandle): Promise<FileEntity[]> {
  const files: FileEntity[] = [];

  async function scan(dir: FileSystemDirectoryHandle, basePath = '') {
    for await (const entry of dir as any) {
      const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name;

      if (entry.kind === 'directory') {
        await scan(entry, entryPath);
      } else if (entry.kind === 'file' && entry.name.endsWith('.md')) {
        const file = await entry.getFile();
        const content = await file.text();
        const id = generateFileId(entryPath);

        files.push({
          id,
          path: entryPath,
          name: entry.name,
          content,
          size: file.size,
          modifiedAt: file.lastModified,
          createdAt: file.lastModified, // 使用修改时间作为创建时间
          reviewLevel: 0,
          lastReviewedAt: 0,
          nextReviewAt: 0,
          readingProgress: 0,
        });
      }
    }
  }

  await scan(directoryHandle);
  return files;
}

export async function saveFilesToDatabase(files: File[]): Promise<void> {
  await db.transaction('rw', db.files, async () => {
    // 获取已存在的文件
    const existingFiles = await db.files.toArray();
    const existingMap = new Map(existingFiles.map(f => [f.id, f]));

    for (const file of files) {
      const existing = existingMap.get(file.id);

      if (!existing) {
        // 新文件，直接插入
        await db.files.add(file);
      } else if (existing.modifiedAt !== file.modifiedAt) {
        // 文件已修改，更新内容
        await db.files.update(file.id, {
          content: file.content,
          size: file.size,
          modifiedAt: file.modifiedAt,
        });
      }
    }

    // 删除不存在的文件
    const fileIds = new Set(files.map(f => f.id));
    for (const file of existingFiles) {
      if (!fileIds.has(file.id)) {
        await db.files.delete(file.id);
      }
    }
  });
}

export async function getAllFiles(): Promise<FileEntity[]> {
  return await db.files.toArray();
}

/**
 * 根据ID获取文件
 */
export async function getFileById(id: string): Promise<FileEntity | undefined> {
  return await db.files.get(id);
}

/**
 * 搜索文件
 */
export async function searchFiles(query: string): Promise<FileEntity[]> {
  const files = await db.files.toArray();
  const lowerQuery = query.toLowerCase();

  return files.filter(file =>
    file.name.toLowerCase().includes(lowerQuery) ||
    file.content.toLowerCase().includes(lowerQuery) ||
    file.path.toLowerCase().includes(lowerQuery)
  );
}

export async function getFileById(id: string): Promise<File | undefined> {
  return await db.files.get(id);
}

export async function searchFiles(query: string): Promise<File[]> {
  const files = await db.files.toArray();
  const lowerQuery = query.toLowerCase();

  return files.filter(file =>
    file.name.toLowerCase().includes(lowerQuery) ||
    file.content.toLowerCase().includes(lowerQuery) ||
    file.path.toLowerCase().includes(lowerQuery)
  );
}

import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';
import type { FileEntity } from '../types';

export function useFiles() {
  const files = useLiveQuery(
    () => db.files.toArray(),
    []
  );

  const filesMap = useLiveQuery(
    async () => {
      const allFiles = await db.files.toArray();
      return new Map(allFiles.map(f => [f.id, f]));
    },
    []
  );

  return { files, filesMap };
}

export function useFile(fileId: string) {
  return useLiveQuery(
    () => db.files.get(fileId),
    [fileId]
  );
}

export function useFileSearch(query: string) {
  return useLiveQuery(
    async () => {
      if (!query.trim()) return db.files.toArray();
      const allFiles = await db.files.toArray();
      const lowerQuery = query.toLowerCase();
      return allFiles.filter(file =>
        file.name.toLowerCase().includes(lowerQuery) ||
        file.path.toLowerCase().includes(lowerQuery) ||
        file.content.toLowerCase().includes(lowerQuery)
      );
    },
    [query]
  );
}

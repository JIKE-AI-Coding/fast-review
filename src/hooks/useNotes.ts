import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';
import type { Note } from '../types';

export function useNotes(fileId?: string) {
  return useLiveQuery(
    async () => {
      if (fileId) {
        return db.notes.where('fileId').equals(fileId).reverse().toArray();
      }
      return db.notes.reverse().toArray();
    },
    [fileId]
  );
}

import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';
import type { UserSettings } from '../types';

export function useSettings() {
  const settings = useLiveQuery(
    () => db.settings.get('user'),
    [],
    100
  );

  const updateSettings = async (updates: Partial<UserSettings>) => {
    await db.settings.update('user', updates);
  };

  return { settings, updateSettings };
}

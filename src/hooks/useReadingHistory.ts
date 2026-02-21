import { useEffect, useState } from 'react';
import { getRecentReadingFiles } from '../services/readingHistoryService';

export interface RecentReadingFile {
  fileId: string;
  fileName: string;
  lastReadAt: number;
  readCount: number;
}

export function useRecentReading(limit: number = 3) {
  const [recentFiles, setRecentFiles] = useState<RecentReadingFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecentFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const files = await getRecentReadingFiles(limit);
      setRecentFiles(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecentFiles();
  }, [limit]);

  return { recentFiles, loading, error, refetch: loadRecentFiles };
}
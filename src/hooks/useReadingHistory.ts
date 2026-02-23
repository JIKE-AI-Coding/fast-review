import { useState, useCallback, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';
import { getRecentReadingFiles, getAllReadingHistoryPaginated, getTotalReadingCount } from '../services/readingHistoryService';

export interface RecentReadingFile {
  fileId: string;
  fileName: string;
  filePath: string;
  lastReadAt: number;
  readCount: number;
  readingProgress: number;
}

export interface PaginatedReadingFile extends RecentReadingFile {
  readingDuration?: number;
}

export function useRecentReading(limit: number = 3) {
  const allHistory = useLiveQuery(
    () => db.readingHistory.orderBy('readAt').reverse().toArray(),
    []
  );

  const fileIds = useMemo(() => {
    if (!allHistory || allHistory.length === 0) return [];
    
    const uniqueFileMap = new Map();
    for (const record of allHistory) {
      if (!uniqueFileMap.has(record.fileId)) {
        uniqueFileMap.set(record.fileId, record);
      }
    }
    
    return Array.from(uniqueFileMap.values())
      .slice(0, limit)
      .map(record => record.fileId);
  }, [allHistory, limit]);

  const files = useLiveQuery(
    () => {
      if (fileIds.length === 0) return [];
      return db.files.where('id').anyOf(fileIds).toArray();
    },
    [fileIds]
  );

  const recentFiles = useMemo(() => {
    if (!allHistory || allHistory.length === 0 || !files) {
      return [];
    }

    const latestReadMap = new Map<string, typeof allHistory[0]>();
    for (const record of allHistory) {
      if (!latestReadMap.has(record.fileId)) {
        latestReadMap.set(record.fileId, record);
      }
    }

    const recentRecords = Array.from(latestReadMap.values()).slice(0, limit);

    const readCounts = new Map<string, number>();
    for (const record of allHistory) {
      readCounts.set(record.fileId, (readCounts.get(record.fileId) || 0) + 1);
    }

    return recentRecords.map(record => {
      const file = files.find(f => f.id === record.fileId);
      return {
        fileId: record.fileId,
        fileName: file?.name || '未知文件',
        filePath: file?.path || '',
        lastReadAt: record.readAt,
        readCount: readCounts.get(record.fileId) || 1,
        readingProgress: file?.readingProgress || 0,
      };
    });
  }, [allHistory, files, limit]);

  return { recentFiles, loading: allHistory === undefined, error: null };
}

export function usePaginatedReadingHistory(pageSize: number = 10) {
  const [data, setData] = useState<{
    items: PaginatedReadingFile[];
    total: number;
    hasMore: boolean;
  }>({ items: [], total: 0, hasMore: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadPage = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAllReadingHistoryPaginated(pageNum, pageSize);
      setData({
        items: result.items,
        total: result.total,
        hasMore: result.hasMore,
      });
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const loadMore = useCallback(async () => {
    if (loading || !data.hasMore) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await getAllReadingHistoryPaginated(page + 1, pageSize);
      setData(prev => ({
        items: [...prev.items, ...result.items],
        total: result.total,
        hasMore: result.hasMore,
      }));
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, loading, data.hasMore]);

  const refresh = useCallback(() => {
    loadPage(1);
  }, [loadPage]);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  return {
    ...data,
    loading,
    error,
    page,
    loadPage,
    loadMore,
    refresh,
  };
}

export function useTotalReadingCount() {
  const allHistory = useLiveQuery(
    () => db.readingHistory.toArray(),
    []
  );

  if (!allHistory) {
    return { count: 0, loading: true };
  }

  const uniqueFiles = new Set(allHistory.map(h => h.fileId));
  return { count: uniqueFiles.size, loading: false };
}
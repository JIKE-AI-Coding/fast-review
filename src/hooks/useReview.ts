import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { ReviewTask } from '../types';
import { getTodayReviewTasks, getMemoryRetentionRate } from '../services/reviewService';
import db from '../db';

export function useTodayReviewTasks() {
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadTasks() {
      setLoading(true);
      const data = await getTodayReviewTasks();
      if (mounted) {
        setTasks(data);
        setLoading(false);
      }
    }

    loadTasks();

    return () => {
      mounted = false;
    };
  }, []);

  return { tasks, loading };
}

export function useMemoryStats() {
  const retentionRate = useLiveQuery(
    () => getMemoryRetentionRate(),
    [],
    100
  );

  const totalReviews = useLiveQuery(
    () => db.reviewRecords.count(),
    [],
    100
  );

  return { retentionRate, totalReviews };
}

export function useReviewHistory(fileId?: string) {
  return useLiveQuery(
    async () => {
      if (fileId) {
        return db.reviewRecords.where('fileId').equals(fileId).reverse().toArray();
      }
      return db.reviewRecords.reverse().toArray();
    },
    [fileId]
  );
}

import type { FileEntity, ReviewRecord, ReviewTask } from '../types';
import { calculateNextReview } from '../utils/ebbinghaus';
import db from '../db';

/**
 * 标记文件为已学习（首次阅读）
 */
export async function markAsLearned(fileId: string): Promise<void> {
  const file = await db.files.get(fileId);
  if (!file) throw new Error('File not found');

  const now = Date.now();
  const nextReviewAt = calculateNextReview(0, 'remembered', now);

  await db.files.update(fileId, {
    lastReviewedAt: now,
    nextReviewAt,
    reviewLevel: 1,
  });
}

/**
 * 提交复习结果
 */
export async function submitReview(
  fileId: string,
  result: 'remembered' | 'forgotten'
): Promise<void> {
  const file = await db.files.get(fileId);
  if (!file) throw new Error('File not found');

  const now = Date.now();
  const nextReviewAt = calculateNextReview(file.reviewLevel, result, now);
  const newReviewLevel = result === 'remembered'
    ? Math.min(file.reviewLevel + 1, 8)
    : 0;

  // 更新文件
  await db.files.update(fileId, {
    lastReviewedAt: now,
    nextReviewAt,
    reviewLevel: newReviewLevel,
  });

  // 记录复习历史
  await db.reviewRecords.add({
    id: `review_${now}_${fileId}`,
    fileId,
    reviewedAt: now,
    result,
    reviewLevel: file.reviewLevel,
  });
}

/**
 * 获取今天的复习任务
 */
export async function getTodayReviewTasks(): Promise<ReviewTask[]> {
  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const files = await db.files
    .where('nextReviewAt')
    .between(startOfDay.getTime(), endOfDay.getTime())
    .toArray();

  // 添加逾期任务
  const overdueFiles = await db.files
    .where('nextReviewAt')
    .below(startOfDay.getTime())
    .and(file => file.reviewLevel > 0) // 排除未学习的文件
    .toArray();

  const allFiles = [...overdueFiles, ...files];

  return allFiles.map(file => ({
    fileId: file.id,
    fileName: file.name,
    lastReviewedAt: file.lastReviewedAt,
    nextReviewAt: file.nextReviewAt,
    reviewLevel: file.reviewLevel,
    overdue: file.nextReviewAt < startOfDay.getTime(),
  })).sort((a, b) => a.nextReviewAt - b.nextReviewAt);
}

/**
 * 获取复习历史
 */
export async function getReviewHistory(fileId?: string): Promise<ReviewRecord[]> {
  if (fileId) {
    return await db.reviewRecords
      .where('fileId')
      .equals(fileId)
      .reverse()
      .toArray();
  }
  return await db.reviewRecords.reverse().toArray();
}

/**
 * 获取记忆保持率
 */
export async function getMemoryRetentionRate(): Promise<number> {
  const records = await db.reviewRecords.toArray();
  if (records.length === 0) return 100;

  const rememberedCount = records.filter(r => r.result === 'remembered').length;
  return Math.round((rememberedCount / records.length) * 100);
}

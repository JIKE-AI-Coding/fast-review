import { REVIEW_INTERVALS, type ReviewResult } from '../types';

/**
 * 计算下次复习时间
 * @param currentLevel 当前复习级别（0-8）
 * @param result 复习结果（记住/忘记）
 * @param lastReviewedAt 上次复习时间戳（可选，默认为当前时间）
 * @returns 下次复习时间戳
 */
export function calculateNextReview(
  currentLevel: number,
  result: ReviewResult,
  lastReviewedAt?: number
): number {
  const baseTime = lastReviewedAt || Date.now();

  if (result === 'forgotten') {
    // 忘记了，重置到第1级（5分钟后）
    return baseTime + REVIEW_INTERVALS[0] * 60 * 1000;
  }

  // 记住了，进入下一级
  const nextLevel = Math.min(currentLevel + 1, REVIEW_INTERVALS.length - 1);
  return baseTime + REVIEW_INTERVALS[nextLevel] * 60 * 1000;
}

/**
 * 检查文件是否需要复习
 * @param nextReviewAt 下次复习时间戳
 * @returns 是否需要复习
 */
export function needsReview(nextReviewAt: number): boolean {
  return Date.now() >= nextReviewAt;
}

/**
 * 计算复习进度（百分比）
 * @param currentLevel 当前复习级别
 * @returns 0-100的进度值
 */
export function getReviewProgress(currentLevel: number): number {
  return Math.round((currentLevel / (REVIEW_INTERVALS.length - 1)) * 100);
}

/**
 * 获取下次复习时间的描述
 * @param nextReviewAt 下次复习时间戳
 * @returns 时间描述（如"5分钟后"、"2天后"）
 */
export function getReviewTimeDescription(nextReviewAt: number): string {
  const now = Date.now();
  const diff = nextReviewAt - now;

  if (diff <= 0) return '已逾期';

  const minutes = Math.floor(diff / (60 * 1000));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天后`;
  if (hours > 0) return `${hours}小时后`;
  if (minutes > 0) return `${minutes}分钟后`;
  return '现在';
}

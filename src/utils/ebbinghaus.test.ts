import { describe, it, expect } from 'vitest';
import { calculateNextReview, needsReview, getReviewProgress, getReviewTimeDescription } from './ebbinghaus';

describe('calculateNextReview', () => {
  it('should reset to first level when forgotten', () => {
    const baseTime = Date.now();
    const nextReview = calculateNextReview(5, 'forgotten', baseTime);
    const expected = baseTime + 5 * 60 * 1000; // 5分钟
    expect(nextReview).toBe(expected);
  });

  it('should advance to next level when remembered', () => {
    const baseTime = Date.now();
    const nextReview = calculateNextReview(2, 'remembered', baseTime);
    const expected = baseTime + 1440 * 60 * 1000; // 24小时（下一级）
    expect(nextReview).toBe(expected);
  });

  it('should cap at maximum level', () => {
    const baseTime = Date.now();
    const nextReview = calculateNextReview(8, 'remembered', baseTime);
    const expected = baseTime + 21600 * 60 * 1000; // 15天（最大）
    expect(nextReview).toBe(expected);
  });
});

describe('needsReview', () => {
  it('should return true when time is past', () => {
    const pastTime = Date.now() - 1000;
    expect(needsReview(pastTime)).toBe(true);
  });

  it('should return false when time is in future', () => {
    const futureTime = Date.now() + 1000;
    expect(needsReview(futureTime)).toBe(false);
  });
});

describe('getReviewProgress', () => {
  it('should calculate progress correctly', () => {
    expect(getReviewProgress(0)).toBe(0);
    expect(getReviewProgress(3)).toBe(43); // 3/7
    expect(getReviewProgress(7)).toBe(100);
  });
});

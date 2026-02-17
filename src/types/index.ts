// 艾宾浩斯复习间隔（分钟）
export const REVIEW_INTERVALS = [5, 30, 720, 1440, 2880, 5760, 10080, 21600] as const;

export type ReviewResult = 'remembered' | 'forgotten';
export type Theme = 'light' | 'dark';

export interface File {
  id: string;
  path: string;
  name: string;
  content: string;
  size: number;
  modifiedAt: number;
  createdAt: number;
  reviewLevel: number;
  lastReviewedAt: number;
  nextReviewAt: number;
  readingProgress: number;
}

export interface Note {
  id: string;
  fileId: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface ReviewRecord {
  id: string;
  fileId: string;
  reviewedAt: number;
  result: ReviewResult;
  reviewLevel: number;
}

export interface UserSettings {
  key: string;
  theme: Theme;
  fontSize: number;
  contentWidth: number;
  reviewInterval: number[];
}

export interface ReviewTask {
  fileId: string;
  fileName: string;
  lastReviewedAt: number;
  nextReviewAt: number;
  reviewLevel: number;
  overdue: boolean;
}

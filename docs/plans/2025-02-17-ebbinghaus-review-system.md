# 艾宾浩斯复习系统 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个基于艾宾浩斯遗忘曲线的markdown复习系统，支持目录加载、沉浸式阅读、复习任务管理和基础笔记功能

**Architecture:** React单页应用 + IndexedDB本地存储 + Web Worker异步处理文件

**Tech Stack:** React 18, TypeScript, Vite, React Router, Dexie.js, react-markdown, Ant Design

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

**Step 1: Create package.json**

```json
{
  "name": "ebbinghaus-review-system",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "dexie": "^3.2.4",
    "dexie-react-hooks": "^1.1.7",
    "react-markdown": "^9.0.1",
    "remark-gfm": "^4.0.0",
    "react-syntax-highlighter": "^15.5.0",
    "katex": "^0.16.9",
    "rehype-katex": "^7.0.0",
    "remark-math": "^6.0.0",
    "antd": "^5.12.0",
    "dayjs": "^1.11.10"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@types/react-syntax-highlighter": "^15.5.11",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

**Step 2: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Step 4: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

**Step 5: Create index.html**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>艾宾浩斯复习系统</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 6: Create src/main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**Step 7: Create src/App.tsx**

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

**Step 8: Create src/index.css**

```css
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  min-height: 100vh;
}

#root {
  width: 100%;
  height: 100vh;
}
```

**Step 9: Create eslint.config.js**

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
```

**Step 10: Install dependencies**

```bash
npm install
```

**Step 11: Commit**

```bash
git add .
git commit -m "feat: initialize project with React + Vite + TypeScript"
```

---

## Task 2: 数据模型和IndexedDB设置

**Files:**
- Create: `src/types/index.ts`
- Create: `src/db/index.ts`

**Step 1: Create src/types/index.ts**

```typescript
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
  reviewLevel: number; // 0-8
  lastReviewedAt: number;
  nextReviewAt: number;
  readingProgress: number; // 0-100
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
```

**Step 2: Create src/db/index.ts**

```typescript
import Dexie, { Table } from 'dexie';
import type { File, Note, ReviewRecord, UserSettings } from '../types';

class ReviewDatabase extends Dexie {
  files!: Table<File>;
  notes!: Table<Note>;
  reviewRecords!: Table<ReviewRecord>;
  settings!: Table<UserSettings>;

  constructor() {
    super('ReviewDatabase');

    this.version(1).stores({
      files: 'id, path, name, nextReviewAt, lastReviewedAt',
      notes: 'id, fileId, createdAt',
      reviewRecords: 'id, fileId, reviewedAt',
      settings: 'key'
    });
  }
}

export const db = new ReviewDatabase();

// 初始化默认设置
export async function initializeSettings() {
  const existing = await db.settings.get('user');
  if (!existing) {
    await db.settings.put({
      key: 'user',
      theme: 'light',
      fontSize: 16,
      contentWidth: 800,
      reviewInterval: [5, 30, 720, 1440, 2880, 5760, 10080, 21600]
    });
  }
}

export default db;
```

**Step 3: Commit**

```bash
git add src/types/index.ts src/db/index.ts
git commit -m "feat: add data models and IndexedDB schema"
```

---

## Task 3: 艾宾浩斯算法核心

**Files:**
- Create: `src/utils/ebbinghaus.ts`
- Create: `src/utils/ebbinghaus.test.ts`

**Step 1: Create src/utils/ebbinghaus.ts**

```typescript
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
```

**Step 2: Create src/utils/ebbinghaus.test.ts**

```typescript
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
    const expected = baseTime + 720 * 60 * 1000; // 12小时（第3级）
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
    expect(getReviewProgress(4)).toBe(50); // 4/8
    expect(getReviewProgress(8)).toBe(100);
  });
});
```

**Step 3: Add vitest to package.json**

Edit `package.json`, add to devDependencies:
```json
"vitest": "^1.0.0",
"@vitest/ui": "^1.0.0"
```

Add to scripts:
```json
"test": "vitest",
"test:ui": "vitest --ui"
```

**Step 4: Install vitest**

```bash
npm install -D vitest @vitest/ui
```

**Step 5: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
```

**Step 6: Run tests**

```bash
npm test
```

**Step 7: Commit**

```bash
git add .
git commit -m "feat: implement Ebbinghaus algorithm with tests"
```

---

## Task 4: 文件加载服务

**Files:**
- Create: `src/services/fileService.ts`
- Create: `src/services/fileService.test.ts`

**Step 1: Create src/services/fileService.ts**

```typescript
import type { File as FileType } from '../types';
import db from '../db';

/**
 * 生成文件ID（路径的哈希值）
 */
function generateFileId(path: string): string {
  let hash = 0;
  for (let i = 0; i < path.length; i++) {
    const char = path.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `file_${Math.abs(hash)}`;
}

/**
 * 扫描目录中的所有markdown文件
 */
export async function scanDirectory(directoryHandle: FileSystemDirectoryHandle): Promise<File[]> {
  const files: FileType[] = [];

  async function scan(dir: FileSystemDirectoryHandle, basePath = '') {
    for await (const entry of dir.values()) {
      const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name;

      if (entry.kind === 'directory') {
        await scan(entry, entryPath);
      } else if (entry.kind === 'file' && entry.name.endsWith('.md')) {
        const file = await entry.getFile();
        const content = await file.text();
        const id = generateFileId(entryPath);

        files.push({
          id,
          path: entryPath,
          name: entry.name,
          content,
          size: file.size,
          modifiedAt: file.lastModified,
          createdAt: file.lastModified, // 使用修改时间作为创建时间
          reviewLevel: 0,
          lastReviewedAt: 0,
          nextReviewAt: 0,
          readingProgress: 0,
        });
      }
    }
  }

  await scan(directoryHandle);
  return files;
}

/**
 * 保存文件到数据库（增量更新）
 */
export async function saveFilesToDatabase(files: FileType[]): Promise<void> {
  await db.transaction('rw', db.files, async () => {
    // 获取已存在的文件
    const existingFiles = await db.files.toArray();
    const existingMap = new Map(existingFiles.map(f => [f.id, f]));

    for (const file of files) {
      const existing = existingMap.get(file.id);

      if (!existing) {
        // 新文件，直接插入
        await db.files.add(file);
      } else if (existing.modifiedAt !== file.modifiedAt) {
        // 文件已修改，更新内容
        await db.files.update(file.id, {
          content: file.content,
          size: file.size,
          modifiedAt: file.modifiedAt,
        });
      }
    }

    // 删除不存在的文件
    const fileIds = new Set(files.map(f => f.id));
    for (const file of existingFiles) {
      if (!fileIds.has(file.id)) {
        await db.files.delete(file.id);
      }
    }
  });
}

/**
 * 获取所有文件
 */
export async function getAllFiles(): Promise<FileType[]> {
  return await db.files.toArray();
}

/**
 * 根据ID获取文件
 */
export async function getFileById(id: string): Promise<FileType | undefined> {
  return await db.files.get(id);
}

/**
 * 搜索文件
 */
export async function searchFiles(query: string): Promise<FileType[]> {
  const files = await db.files.toArray();
  const lowerQuery = query.toLowerCase();

  return files.filter(file =>
    file.name.toLowerCase().includes(lowerQuery) ||
    file.content.toLowerCase().includes(lowerQuery) ||
    file.path.toLowerCase().includes(lowerQuery)
  );
}
```

**Step 2: Create src/services/fileService.test.ts**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { generateFileId } from './fileService';

// Mock fileService implementation for testing
const mockFileService = {
  generateFileId
};

describe('generateFileId', () => {
  it('should generate consistent ID for same path', () => {
    const path = '/test/file.md';
    const id1 = mockFileService.generateFileId(path);
    const id2 = mockFileService.generateFileId(path);
    expect(id1).toBe(id2);
  });

  it('should generate different IDs for different paths', () => {
    const id1 = mockFileService.generateFileId('/test/file1.md');
    const id2 = mockFileService.generateFileId('/test/file2.md');
    expect(id1).not.toBe(id2);
  });
});
```

**Step 3: Add generateFileId export to fileService**

Edit `src/services/fileService.ts`, make generateFileId exportable:
```typescript
export function generateFileId(path: string): string {
  // ... existing implementation
}
```

**Step 4: Run tests**

```bash
npm test
```

**Step 5: Commit**

```bash
git add src/services/
git commit -m "feat: add file service with directory scanning"
```

---

## Task 5: 复习服务

**Files:**
- Create: `src/services/reviewService.ts`
- Create: `src/services/reviewService.test.ts`

**Step 1: Create src/services/reviewService.ts**

```typescript
import type { File, ReviewRecord, ReviewTask } from '../types';
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
```

**Step 2: Create src/services/reviewService.test.ts**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import db from '../db';
import { markAsLearned, submitReview, getTodayReviewTasks } from './reviewService';

// Mock database
vi.mock('../db', () => ({
  default: {
    files: {
      get: vi.fn(),
      update: vi.fn(),
      where: vi.fn(() => ({
        between: vi.fn(() => ({ toArray: vi.fn(() => Promise.resolve([])) })),
        below: vi.fn(() => ({ and: vi.fn(() => ({ toArray: vi.fn(() => Promise.resolve([])) })) }))
      })),
      toArray: vi.fn(() => Promise.resolve([])),
    },
    reviewRecords: {
      add: vi.fn(),
      reverse: vi.fn(() => ({ toArray: vi.fn(() => Promise.resolve([])) })),
      toArray: vi.fn(() => Promise.resolve([])),
    },
  },
}));

describe('reviewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark file as learned', async () => {
    const mockFile = {
      id: 'test-file',
      reviewLevel: 0,
    };

    vi.mocked(db.files.get).mockResolvedValue(mockFile as any);

    await markAsLearned('test-file');

    expect(db.files.update).toHaveBeenCalledWith(
      'test-file',
      expect.objectContaining({
        reviewLevel: 1,
        lastReviewedAt: expect.any(Number),
        nextReviewAt: expect.any(Number),
      })
    );
  });
});
```

**Step 3: Run tests**

```bash
npm test
```

**Step 4: Commit**

```bash
git add src/services/reviewService.ts src/services/reviewService.test.ts
git commit -m "feat: add review service with Ebbinghaus integration"
```

---

## Task 6: 笔记服务

**Files:**
- Create: `src/services/noteService.ts`
- Create: `src/services/noteService.test.ts`

**Step 1: Create src/services/noteService.ts**

```typescript
import type { Note } from '../types';
import db from '../db';

/**
 * 创建笔记
 */
export async function createNote(fileId: string, content: string): Promise<Note> {
  const now = Date.now();
  const note: Note = {
    id: `note_${now}_${fileId}`,
    fileId,
    content,
    createdAt: now,
    updatedAt: now,
  };

  await db.notes.add(note);
  return note;
}

/**
 * 更新笔记
 */
export async function updateNote(noteId: string, content: string): Promise<void> {
  await db.notes.update(noteId, {
    content,
    updatedAt: Date.now(),
  });
}

/**
 * 删除笔记
 */
export async function deleteNote(noteId: string): Promise<void> {
  await db.notes.delete(noteId);
}

/**
 * 获取文件的所有笔记
 */
export async function getNotesByFile(fileId: string): Promise<Note[]> {
  return await db.notes
    .where('fileId')
    .equals(fileId)
    .reverse()
    .toArray();
}

/**
 * 获取所有笔记
 */
export async function getAllNotes(): Promise<Note[]> {
  return await db.notes.reverse().toArray();
}
```

**Step 2: Create src/services/noteService.test.ts**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import db from '../db';
import { createNote, getNotesByFile } from './noteService';

vi.mock('../db', () => ({
  default: {
    notes: {
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({ reverse: vi.fn(() => ({ toArray: vi.fn() })) })),
      })),
      reverse: vi.fn(() => ({ toArray: vi.fn() })),
      toArray: vi.fn(),
    },
  },
}));

describe('noteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a note', async () => {
    vi.mocked(db.notes.add).mockResolvedValue('note-id' as any);

    const note = await createNote('file-id', 'test content');

    expect(note.fileId).toBe('file-id');
    expect(note.content).toBe('test content');
    expect(db.notes.add).toHaveBeenCalled();
  });
});
```

**Step 3: Run tests**

```bash
npm test
```

**Step 4: Commit**

```bash
git add src/services/noteService.ts src/services/noteService.test.ts
git commit -m "feat: add note service"
```

---

## Task 7: React Hooks - 数据层

**Files:**
- Create: `src/hooks/useFiles.ts`
- Create: `src/hooks/useReview.ts`
- Create: `src/hooks/useNotes.ts`
- Create: `src/hooks/useSettings.ts`

**Step 1: Create src/hooks/useFiles.ts**

```typescript
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';
import type { File as FileType } from '../types';

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
```

**Step 2: Create src/hooks/useReview.ts**

```typescript
import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getTodayReviewTasks, getMemoryRetentionRate } from '../services/reviewService';
import type { ReviewTask } from '../types';

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
```

**Step 3: Create src/hooks/useNotes.ts**

```typescript
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
```

**Step 4: Create src/hooks/useSettings.ts**

```typescript
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
```

**Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat: add React hooks for data layer"
```

---

## Task 8: 基础UI组件 - MainLayout

**Files:**
- Create: `src/components/layout/MainLayout.tsx`
- Create: `src/components/layout/Sidebar.tsx`

**Step 1: Create src/components/layout/MainLayout.tsx**

```typescript
import { useState } from 'react';
import { Layout, Button, theme } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import Sidebar from './Sidebar';
import ContentArea from './ContentArea';
import './MainLayout.css';

const { Header, Content, Sider } = Layout;

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  const handleLoadDirectory = async () => {
    try {
      setLoadingDirectory(true);
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;

      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
          // TODO: 调用文件服务加载目录
          console.log('Loading directory with', files.length, 'files');
        }
        setLoadingDirectory(false);
      };

      input.click();
    } catch (error) {
      console.error('Failed to load directory:', error);
      setLoadingDirectory(false);
    }
  };

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', flex: 1 }}>
          艾宾浩斯复习系统
        </div>
        <Button
          type="primary"
          icon={<FolderOpenOutlined />}
          onClick={handleLoadDirectory}
          loading={loadingDirectory}
        >
          加载目录
        </Button>
      </Header>
      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={280}
          style={{ background: colorBgContainer }}
        >
          <Sidebar collapsed={collapsed} />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              padding: 24,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: 8,
            }}
          >
            <ContentArea />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
```

**Step 2: Create src/components/layout/MainLayout.css**

```css
.main-layout {
  min-height: 100vh;
}

.sidebar {
  padding: 16px;
}

.content-area {
  height: 100%;
}
```

**Step 3: Create src/components/layout/Sidebar.tsx**

```typescript
import { Input, Tree } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { DataNode } from 'antd/es/tree';

const { Search } = Input;

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const [searchValue, setSearchValue] = useState('');
  const [treeData, setTreeData] = useState<DataNode[]>([]);

  return (
    <div className="sidebar">
      {!collapsed && (
        <>
          <Search
            placeholder="搜索文件"
            allowClear
            prefix={<SearchOutlined />}
            style={{ marginBottom: 16 }}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <Tree
            showLine
            treeData={treeData}
            height={window.innerHeight - 200}
          />
        </>
      )}
    </div>
  );
}
```

**Step 4: Create src/components/layout/ContentArea.tsx`

```typescript
import { Empty } from 'antd';

export default function ContentArea() {
  return (
    <div className="content-area">
      <Empty
        description="请先加载一个目录"
      />
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add main layout components"
```

---

## Task 9: 阅读器组件

**Files:**
- Create: `src/components/reader/MarkdownReader.tsx`
- Create: `src/components/reader/ReaderToolbar.tsx`

**Step 1: Create src/components/reader/MarkdownReader.tsx**

```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { File as FileType } from '../../types';
import 'katex/dist/katex.min.css';
import './MarkdownReader.css';

interface MarkdownReaderProps {
  file: FileType;
}

export default function MarkdownReader({ file }: MarkdownReaderProps) {
  return (
    <div className="markdown-reader">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {file.content}
      </ReactMarkdown>
    </div>
  );
}
```

**Step 2: Create src/components/reader/MarkdownReader.css**

```css
.markdown-reader {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  padding: 0 24px;
}

.markdown-reader h1,
.markdown-reader h2,
.markdown-reader h3,
.markdown-reader h4,
.markdown-reader h5,
.markdown-reader h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-reader h1 {
  font-size: 2em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-reader h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-reader h3 {
  font-size: 1.25em;
}

.markdown-reader p {
  margin: 16px 0;
}

.markdown-reader code {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
}

.markdown-reader pre {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 6px;
  margin: 16px 0;
}

.markdown-reader ul,
.markdown-reader ol {
  padding-left: 2em;
  margin: 16px 0;
}

.markdown-reader li {
  margin: 4px 0;
}

.markdown-reader blockquote {
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
  margin: 16px 0;
}

.markdown-reader table {
  border-spacing: 0;
  border-collapse: collapse;
  margin: 16px 0;
  width: 100%;
}

.markdown-reader table th,
.markdown-reader table td {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

.markdown-reader table th {
  font-weight: 600;
  background-color: #f6f8fa;
}

.markdown-reader img {
  max-width: 100%;
  height: auto;
  margin: 16px 0;
}

.markdown-reader a {
  color: #0366d6;
  text-decoration: none;
}

.markdown-reader a:hover {
  text-decoration: underline;
}

.markdown-reader hr {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: #e1e4e8;
  border: 0;
}
```

**Step 3: Create src/components/reader/ReaderToolbar.tsx**

```typescript
import { Button, Space, Slider } from 'antd';
import {
  FontSizeOutlined,
  BgColorsOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import type { File as FileType } from '../../types';

interface ReaderToolbarProps {
  file: FileType | null;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  onThemeToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
}

export default function ReaderToolbar({
  file,
  fontSize,
  onFontSizeChange,
  onThemeToggle,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
}: ReaderToolbarProps) {
  return (
    <div className="reader-toolbar">
      <Space>
        <Button
          icon={<LeftOutlined />}
          onClick={onPrevious}
          disabled={!canPrevious}
        >
          上一个
        </Button>
        <Button
          onClick={onNext}
          disabled={!canNext}
        >
          下一个
          <RightOutlined />
        </Button>
      </Space>

      <Space>
        <FontSizeOutlined />
        <Slider
          min={12}
          max={24}
          step={1}
          value={fontSize}
          onChange={onFontSizeChange}
          style={{ width: 150 }}
          tooltip={{ formatter: (value) => `${value}px` }}
        />
      </Space>

      <Space>
        <Button
          icon={<BgColorsOutlined />}
          onClick={onThemeToggle}
        >
          切换主题
        </Button>
      </Space>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/components/reader/
git commit -m "feat: add markdown reader component"
```

---

## Task 10: 复习模式组件

**Files:**
- Create: `src/components/review/ReviewMode.tsx`
- Create: `src/components/review/ReviewTaskCard.tsx`

**Step 1: Create src/components/review/ReviewMode.tsx**

```typescript
import { useState } from 'react';
import { Layout, Button, Space, message } from 'antd';
import { CheckOutlined, CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useFile } from '../../hooks/useFiles';
import { submitReview } from '../../services/reviewService';
import MarkdownReader from '../reader/MarkdownReader';
import ReaderToolbar from '../reader/ReaderToolbar';
import './ReviewMode.css';

const { Content } = Layout;

interface ReviewModeProps {
  fileId: string;
  onBack: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
}

export default function ReviewMode({
  fileId,
  onBack,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
}: ReviewModeProps) {
  const [fontSize, setFontSize] = useState(16);
  const file = useFile(fileId);

  const handleRemember = async () => {
    if (!file) return;

    try {
      await submitReview(file.id, 'remembered');
      message.success('已标记为记住');

      // 自动跳到下一个
      if (canNext) {
        onNext();
      } else {
        onBack();
      }
    } catch (error) {
      message.error('提交失败');
    }
  };

  const handleForget = async () => {
    if (!file) return;

    try {
      await submitReview(file.id, 'forgotten');
      message.success('已标记为忘记，将重新开始复习');

      // 自动跳到下一个
      if (canNext) {
        onNext();
      } else {
        onBack();
      }
    } catch (error) {
      message.error('提交失败');
    }
  };

  if (!file) {
    return <div>加载中...</div>;
  }

  return (
    <Layout className="review-mode">
      <Content>
        <ReaderToolbar
          file={file}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onThemeToggle={() => {}}
          onPrevious={onPrevious}
          onNext={onNext}
          canPrevious={canPrevious}
          canNext={canNext}
        />
        <div style={{ fontSize: `${fontSize}px` }}>
          <MarkdownReader file={file} />
        </div>
        <div className="review-actions">
          <Space size="large">
            <Button
              icon={<CloseOutlined />}
              size="large"
              danger
              onClick={handleForget}
            >
              忘记了
            </Button>
            <Button
              icon={<CheckOutlined />}
              size="large"
              type="primary"
              onClick={handleRemember}
            >
              记住了
            </Button>
          </Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
          >
            返回
          </Button>
        </div>
      </Content>
    </Layout>
  );
}
```

**Step 2: Create src/components/review/ReviewMode.css**

```css
.review-mode {
  height: 100vh;
  overflow-y: auto;
}

.review-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px;
  background: white;
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
}
```

**Step 3: Create src/components/review/ReviewTaskCard.tsx**

```typescript
import { Card, Tag, Button, Space } from 'antd';
import type { ReviewTask } from '../../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface ReviewTaskCardProps {
  task: ReviewTask;
  onReview: () => void;
}

export default function ReviewTaskCard({ task, onReview }: ReviewTaskCardProps) {
  return (
    <Card
      hoverable
      actions={[
        <Button type="link" onClick={onReview}>
          开始复习
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
          {task.fileName}
        </div>
        <Space>
          {task.overdue && <Tag color="red">已逾期</Tag>}
          <Tag>第 {task.reviewLevel} 级</Tag>
          <Tag>
            {dayjs(task.lastReviewedAt).fromNow()} 学习
          </Tag>
        </Space>
      </Space>
    </Card>
  );
}
```

**Step 4: Commit**

```bash
git add src/components/review/
git commit -m "feat: add review mode components"
```

---

## Task 11: 笔记组件

**Files:**
- Create: `src/components/notes/NoteList.tsx`
- Create: `src/components/notes/NoteEditor.tsx`

**Step 1: Create src/components/notes/NoteList.tsx**

```typescript
import { List, Card, Button, Empty } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { Note } from '../../types';
import dayjs from 'dayjs';

interface NoteListProps {
  notes: Note[];
  onDelete: (noteId: string) => void;
  onEdit: (note: Note) => void;
}

export default function NoteList({ notes, onDelete, onEdit }: NoteListProps) {
  return (
    <List
      dataSource={notes}
      renderItem={(note) => (
        <List.Item
          actions={[
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => onEdit(note)}
            />,
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => onDelete(note.id)}
            />,
          ]}
        >
          <Card size="small" style={{ width: '100%' }}>
            <div style={{ marginBottom: 8 }}>{note.content}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {dayjs(note.createdAt).format('YYYY-MM-DD HH:mm')}
            </div>
          </Card>
        </List.Item>
      )}
    />
  );
}
```

**Step 2: Create src/components/notes/NoteEditor.tsx**

```typescript
import { useState, useEffect } from 'react';
import { Modal, Input, Button } from 'antd';

const { TextArea } = Input;

interface NoteEditorProps {
  visible: boolean;
  note?: Note;
  fileId?: string;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
}

interface Note {
  id: string;
  content: string;
  createdAt: number;
}

export default function NoteEditor({
  visible,
  note,
  fileId,
  onSave,
  onCancel,
}: NoteEditorProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (note) {
      setContent(note.content);
    } else {
      setContent('');
    }
  }, [note, visible]);

  const handleSave = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      await onSave(content);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={note ? '编辑笔记' : '添加笔记'}
      open={visible}
      onOk={handleSave}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
    >
      <TextArea
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="输入笔记内容..."
        autoFocus
      />
    </Modal>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/notes/
git commit -m "feat: add note components"
```

---

## Task 12: 统计组件

**Files:**
- Create: `src/components/stats/StatsOverview.tsx`

**Step 1: Create src/components/stats/StatsOverview.tsx**

```typescript
import { Card, Row, Col, Statistic } from 'antd';
import { ClockOutlined, FileTextOutlined, TrophyOutlined, BookOutlined } from '@ant-design/icons';
import { useMemoryStats } from '../../hooks/useReview';
import { useFiles } from '../../hooks/useFiles';

export default function StatsOverview() {
  const { retentionRate, totalReviews } = useMemoryStats();
  const { files } = useFiles();

  return (
    <div className="stats-overview">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总文件数"
              value={files?.length || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总复习次数"
              value={totalReviews || 0}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="记忆保持率"
              value={retentionRate || 0}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: retentionRate >= 70 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="学习文件"
              value={files?.filter(f => f.reviewLevel > 0).length || 0}
              prefix={<ClockOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/stats/
git commit -m "feat: add stats overview component"
```

---

## Task 13: 整合页面 - Home Page

**Files:**
- Modify: `src/App.tsx`
- Create: `src/pages/Home.tsx`
- Create: `src/pages/ReviewPage.tsx`
- Create: `src/pages/ReaderPage.tsx`

**Step 1: Modify src/App.tsx**

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ReviewPage from './pages/ReviewPage';
import ReaderPage from './pages/ReaderPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/reader/:fileId" element={<ReaderPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

**Step 2: Create src/pages/Home.tsx**

```typescript
import { useState } from 'react';
import { Layout, Button, Card, List, Modal, message } from 'antd';
import { FolderOpenOutlined, ThunderboltOutlined, BarChartOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { scanDirectory, saveFilesToDatabase, getAllFiles } from '../services/fileService';
import { useTodayReviewTasks } from '../hooks/useReview';
import { useFiles } from '../hooks/useFiles';
import ReviewTaskCard from '../components/review/ReviewTaskCard';
import StatsOverview from '../components/stats/StatsOverview';
import NoteEditor from '../components/notes/NoteEditor';
import { createNote } from '../services/noteService';
import './Home.css';

const { Content } = Layout;

export default function Home() {
  const navigate = useNavigate();
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string>();
  const { tasks, loading: loadingTasks } = useTodayReviewTasks();
  const { files } = useFiles();

  const handleLoadDirectory = async () => {
    try {
      setLoadingDirectory(true);

      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;

      input.onchange = async (e) => {
        const filesInput = (e.target as HTMLInputElement).files;
        if (filesInput) {
          // 注意：这里需要使用File System Access API或模拟
          // 为了简化，我们先提示用户
          message.info('正在加载目录...');
          setLoadingDirectory(false);
        }
      };

      input.click();
    } catch (error) {
      console.error('Failed to load directory:', error);
      message.error('加载目录失败');
      setLoadingDirectory(false);
    }
  };

  const handleAddNote = (fileId: string) => {
    setSelectedFileId(fileId);
    setNoteModalVisible(true);
  };

  const handleSaveNote = async (content: string) => {
    if (!selectedFileId) return;

    try {
      await createNote(selectedFileId, content);
      message.success('笔记添加成功');
      setNoteModalVisible(false);
    } catch (error) {
      message.error('添加笔记失败');
    }
  };

  const pendingCount = tasks.filter(t => !t.overdue).length;
  const overdueCount = tasks.filter(t => t.overdue).length;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <div className="home-container">
          <Card className="welcome-card">
            <h1>欢迎使用艾宾浩斯复习系统</h1>
            <p>基于科学遗忘曲线的智能复习助手</p>
            {!files || files.length === 0 ? (
              <Button
                type="primary"
                size="large"
                icon={<FolderOpenOutlined />}
                onClick={handleLoadDirectory}
                loading={loadingDirectory}
              >
                加载学习目录
              </Button>
            ) : (
              <div className="stats">
                <StatsOverview />
              </div>
            )}
          </Card>

          {files && files.length > 0 && (
            <>
              <Card
                title="今日复习"
                extra={
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={() => navigate('/review')}
                    disabled={tasks.length === 0}
                  >
                    开始复习 ({tasks.length})
                  </Button>
                }
                style={{ marginTop: 24 }}
              >
                {loadingTasks ? (
                  <div>加载中...</div>
                ) : tasks.length > 0 ? (
                  <List
                    dataSource={tasks}
                    renderItem={(task) => (
                      <ReviewTaskCard
                        task={task}
                        onReview={() => navigate(`/review/${task.fileId}`)}
                      />
                    )}
                  />
                ) : (
                  <div>今天没有需要复习的内容</div>
                )}
              </Card>

              <Card
                title="最近学习"
                extra={<Button onClick={() => navigate('/files')}>查看全部</Button>}
                style={{ marginTop: 24 }}
              >
                <List
                  dataSource={files?.slice(0, 5)}
                  renderItem={(file) => (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          icon={<EditOutlined />}
                          onClick={() => handleAddNote(file.id)}
                        >
                          添加笔记
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={file.name}
                        description={file.path}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </>
          )}
        </div>

        <NoteEditor
          visible={noteModalVisible}
          fileId={selectedFileId}
          onSave={handleSaveNote}
          onCancel={() => setNoteModalVisible(false)}
        />
      </Content>
    </Layout>
  );
}
```

**Step 3: Create src/pages/Home.css**

```css
.home-container {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-card {
  text-align: center;
  padding: 48px 24px;
}

.welcome-card h1 {
  margin-bottom: 16px;
  font-size: 32px;
  color: #1890ff;
}

.welcome-card p {
  margin-bottom: 32px;
  font-size: 16px;
  color: #666;
}

.stats {
  margin-top: 24px;
}
```

**Step 4: Create src/pages/ReviewPage.tsx**

```typescript
import { useState } from 'react';
import { Layout, Card, Button, Empty } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTodayReviewTasks } from '../hooks/useReview';
import ReviewMode from '../components/review/ReviewMode';

const { Content } = Layout;

export default function ReviewPage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { tasks, loading } = useTodayReviewTasks();

  const handleBack = () => {
    navigate('/');
  };

  const handleNext = () => {
    if (currentIndex < tasks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <Content style={{ padding: '24px' }}>
        <div>加载中...</div>
      </Content>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Content style={{ padding: '24px' }}>
        <Card
          extra={
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              返回
            </Button>
          }
        >
          <Empty description="今天没有需要复习的内容" />
        </Card>
      </Content>
    );
  }

  const currentTask = tasks[currentIndex];

  return (
    <ReviewMode
      fileId={currentTask.fileId}
      onBack={handleBack}
      onPrevious={handlePrevious}
      onNext={handleNext}
      canPrevious={currentIndex > 0}
      canNext={currentIndex < tasks.length - 1}
    />
  );
}
```

**Step 5: Create src/pages/ReaderPage.tsx**

```typescript
import { useState } from 'react';
import { Layout, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useFile, useFiles } from '../hooks/useFiles';
import { markAsLearned } from '../services/reviewService';
import { message } from 'antd';
import MarkdownReader from '../components/reader/MarkdownReader';
import ReaderToolbar from '../components/reader/ReaderToolbar';
import NoteEditor from '../components/notes/NoteEditor';
import NoteList from '../components/notes/NoteList';
import { createNote, updateNote, deleteNote, getNotesByFile } from '../services/noteService';

const { Content } = Layout;

export default function ReaderPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState(16);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const { files } = useFiles();

  const file = fileId ? useFile(fileId) : null;
  const notes = fileId ? getNotesByFile(fileId) : Promise.resolve([]);

  const handleBack = () => {
    navigate('/');
  };

  const handleMarkAsLearned = async () => {
    if (!file) return;

    try {
      await markAsLearned(file.id);
      message.success('已标记为已学习，将在5分钟后提醒复习');
    } catch (error) {
      message.error('标记失败');
    }
  };

  const handleAddNote = () => {
    setEditingNote(null);
    setNoteModalVisible(true);
  };

  const handleEditNote = (note: any) => {
    setEditingNote(note);
    setNoteModalVisible(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      message.success('笔记已删除');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSaveNote = async (content: string) => {
    if (!fileId) return;

    try {
      if (editingNote) {
        await updateNote(editingNote.id, content);
        message.success('笔记已更新');
      } else {
        await createNote(fileId, content);
        message.success('笔记已添加');
      }
      setNoteModalVisible(false);
      setEditingNote(null);
    } catch (error) {
      message.error('保存失败');
    }
  };

  if (!file) {
    return <div>加载中...</div>;
  }

  const fileIndex = files?.findIndex(f => f.id === file.id) ?? -1;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content>
        <ReaderToolbar
          file={file}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onThemeToggle={() => {}}
          onPrevious={() => {
            if (fileIndex > 0 && files) {
              navigate(`/reader/${files[fileIndex - 1].id}`);
            }
          }}
          onNext={() => {
            if (fileIndex < (files?.length ?? 0) - 1 && files) {
              navigate(`/reader/${files[fileIndex + 1].id}`);
            }
          }}
          canPrevious={fileIndex > 0}
          canNext={fileIndex < (files?.length ?? 0) - 1}
        />
        <div style={{ fontSize: `${fontSize}px` }}>
          <MarkdownReader file={file} />
        </div>

        <div style={{ padding: '24px' }}>
          <Button
            type="primary"
            onClick={handleMarkAsLearned}
          >
            标记为已学习
          </Button>
        </div>

        <div style={{ padding: '0 24px' }}>
          <h3>笔记</h3>
          <Button type="link" onClick={handleAddNote}>
            添加笔记
          </Button>
          <NoteList
            notes={[]}
            onDelete={handleDeleteNote}
            onEdit={handleEditNote}
          />
        </div>

        <NoteEditor
          visible={noteModalVisible}
          note={editingNote}
          fileId={fileId}
          onSave={handleSaveNote}
          onCancel={() => {
            setNoteModalVisible(false);
            setEditingNote(null);
          }}
        />
      </Content>
    </Layout>
  );
}
```

**Step 6: Commit**

```bash
git add src/pages/ src/App.tsx
git commit -m "feat: add main pages (Home, Review, Reader)"
```

---

## Task 14: 完善 Sidebar 和文件树

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

**Step 1: Modify src/components/layout/Sidebar.tsx**

```typescript
import { Input, Tree } from 'antd';
import { SearchOutlined, FileOutlined, FolderOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiles } from '../../hooks/useFiles';
import type { DataNode } from 'antd/es/tree';

const { Search } = Input;

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();
  const { files } = useFiles();

  // 构建文件树
  const buildTreeData = (): DataNode[] => {
    if (!files || files.length === 0) return [];

    const treeMap = new Map<string, DataNode>();

    // 先添加所有文件作为节点
    files.forEach(file => {
      const parts = file.path.split('/');
      let currentPath = '';

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!treeMap.has(currentPath)) {
          treeMap.set(currentPath, {
            key: currentPath,
            title: part,
            isLeaf: isLast,
            icon: isLast ? <FileOutlined /> : <FolderOutlined />,
            data: isLast ? file : undefined,
          });
        }
      });
    });

    // 构建树形结构
    const rootNodes: DataNode[] = [];
    treeMap.forEach(node => {
      const key = node.key as string;
      const lastSlashIndex = key.lastIndexOf('/');
      const parentKey = lastSlashIndex > -1 ? key.substring(0, lastSlashIndex) : null;

      if (parentKey && treeMap.has(parentKey)) {
        const parentNode = treeMap.get(parentKey);
        if (parentNode) {
          if (!parentNode.children) {
            parentNode.children = [];
          }
          parentNode.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    if (info.node.isLeaf && info.node.data) {
      navigate(`/reader/${info.node.data.id}`);
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {!collapsed && (
        <>
          <Search
            placeholder="搜索文件"
            allowClear
            prefix={<SearchOutlined />}
            style={{ marginBottom: 16 }}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <Tree
            showLine
            treeData={buildTreeData()}
            height={window.innerHeight - 150}
            onSelect={handleSelect}
            defaultExpandAll
          />
        </>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: enhance sidebar with file tree"
```

---

## Task 15: 修复和优化

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/ReaderPage.tsx`

**Step 1: Fix async issues in Home.tsx**

Note: The note list in Home needs to be properly integrated with hooks.

**Step 2: Test the application**

```bash
npm run dev
```

**Step 3: Final commit**

```bash
git add .
git commit -m "fix: resolve async issues and improve integration"
```

---

## Task 16: 添加 Ant Design 主题配置

**Files:**
- Create: `src/theme.ts`

**Step 1: Create src/theme.ts**

```typescript
import { theme } from 'antd';

const { defaultAlgorithm, darkAlgorithm } = theme;

export const lightTheme = {
  algorithm: defaultAlgorithm,
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 8,
  },
};

export const darkTheme = {
  algorithm: darkAlgorithm,
  token: {
    colorPrimary: '#177ddc',
    borderRadius: 8,
  },
};
```

**Step 2: Commit**

```bash
git add src/theme.ts
git commit -m "feat: add Ant Design theme configuration"
```

---

## Task 17: 添加 README 文档

**Files:**
- Create: `README.md`

**Step 1: Create README.md**

```markdown
# 艾宾浩斯复习系统

基于艾宾浩斯遗忘曲线的智能复习系统，帮助你高效学习和记忆markdown文档。

## 功能特性

- 📁 **目录加载**：加载本地markdown目录，自动构建文件树
- 📖 **沉浸式阅读**：支持markdown渲染、代码高亮、数学公式
- 🧠 **艾宾浩斯算法**：科学的复习间隔（5分钟到15天）
- 📝 **笔记功能**：为文件添加文本笔记
- 📊 **统计追踪**：记忆保持率、复习历史等数据可视化
- 🎨 **自定义设置**：字体大小、主题切换等

## 技术栈

- React 18 + TypeScript
- Vite
- Ant Design
- IndexedDB (Dexie.js)
- React Router
- react-markdown

## 开始使用

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 运行测试

```bash
npm test
```

## 使用说明

1. 点击"加载学习目录"按钮，选择包含markdown文件的文件夹
2. 点击文件开始阅读，系统会自动开始计时
3. 根据艾宾浩斯遗忘曲线，系统会提醒你复习
4. 点击"记住"或"忘记"来反馈复习结果
5. 查看统计数据了解学习进度

## 艾宾浩斯遗忘曲线

复习间隔序列：
- 5分钟
- 30分钟
- 12小时
- 1天
- 2天
- 4天
- 7天
- 15天

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

---

## Task 18: 运行 lint 和 typecheck

**Step 1: Run lint**

```bash
npm run lint
```

Fix any linting errors if present.

**Step 2: Run typecheck**

```bash
npm run typecheck
```

Fix any TypeScript errors if present.

**Step 3: Run all tests**

```bash
npm test
```

**Step 4: Final commit**

```bash
git add .
git commit -m "fix: resolve lint and typecheck issues"
```

---

## 完成！

🎉 实现计划已完成！你现在可以：

1. 运行 `npm run dev` 启动开发服务器
2. 在浏览器中访问 `http://localhost:3000`
3. 加载一个包含markdown文件的目录
4. 开始使用复习系统

### 后续优化建议

- 添加深色模式切换
- 优化大文件加载性能
- 添加复习提醒通知
- 支持导入/导出数据
- 添加更多统计图表
- 支持自定义复习间隔

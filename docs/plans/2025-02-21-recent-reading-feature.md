# 最近阅读功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 为艾宾浩斯复习系统添加"最近阅读"功能，记录用户的文件阅读历史并在首页展示最近3个阅读过的文件

**架构：** 使用 IndexedDB 存储阅读历史记录，通过服务层提供数据访问，在首页添加新卡片展示最近阅读的文件

**技术栈：** React, TypeScript, Dexie (IndexedDB), Ant Design

---

## Task 1: 更新类型定义

**Files:**
- Modify: `src/types/index.ts`

**Step 1: 添加 ReadingHistory 接口定义**

在文件末尾添加以下代码：

```typescript
export interface ReadingHistory {
  id: string;
  fileId: string;
  readAt: number;  // 阅读时间戳
  readingDuration?: number;  // 阅读时长（秒）
  readingProgress?: number;  // 阅读进度（0-100）
}
```

**Step 2: 运行类型检查**

Run: `npm run typecheck`
Expected: PASS - 类型定义正确添加

**Step 3: 提交更改**

```bash
git add src/types/index.ts
git commit -m "feat: add ReadingHistory type definition"
```

---

## Task 2: 更新数据库架构

**Files:**
- Modify: `src/db/index.ts`

**Step 1: 添加 readingHistory 表定义**

在 ReviewDatabase 类中添加：

```typescript
readingHistory!: Table<ReadingHistory>;
```

**Step 2: 更新数据库版本**

修改 version 方法，从 version(1) 改为 version(2)，并在 stores 对象中添加：

```typescript
this.version(2).stores({
  files: 'id, path, name, nextReviewAt, lastReviewedAt',
  notes: 'id, fileId, createdAt',
  reviewRecords: 'id, fileId, reviewedAt',
  settings: 'key',
  readingHistory: 'id, fileId, readAt'
});
```

**Step 3: 添加导入类型**

在文件顶部导入 ReadingHistory：

```typescript
import type { File, Note, ReviewRecord, UserSettings, ReadingHistory } from '../types';
```

**Step 4: 运行类型检查**

Run: `npm run typecheck`
Expected: PASS - 数据库架构更新正确

**Step 5: 提交更改**

```bash
git add src/db/index.ts
git commit -m "feat: add readingHistory table to database schema"
```

---

## Task 3: 创建阅读历史服务

**Files:**
- Create: `src/services/readingHistoryService.ts`

**Step 1: 创建服务文件**

```typescript
import type { ReadingHistory, FileEntity } from '../types';
import db from '../db';

/**
 * 记录阅读历史
 */
export async function recordReadingHistory(
  fileId: string,
  readingDuration?: number,
  readingProgress?: number
): Promise<void> {
  const now = Date.now();
  
  await db.readingHistory.add({
    id: `reading_${now}_${fileId}`,
    fileId,
    readAt: now,
    readingDuration,
    readingProgress,
  });
}

/**
 * 获取最近阅读的文件（去重）
 */
export async function getRecentReadingFiles(limit: number = 3): Promise<Array<{
  fileId: string;
  fileName: string;
  lastReadAt: number;
  readCount: number;
}>> {
  // 获取所有阅读历史，按时间倒序
  const allHistory = await db.readingHistory
    .orderBy('readAt')
    .reverse()
    .toArray();

  // 按文件去重，保留最近的一次阅读记录
  const latestReadMap = new Map<string, ReadingHistory>();
  
  for (const record of allHistory) {
    if (!latestReadMap.has(record.fileId)) {
      latestReadMap.set(record.fileId, record);
    }
  }

  // 获取文件信息
  const recentFiles = Array.from(latestReadMap.values())
    .slice(0, limit);

  const fileIds = recentFiles.map(record => record.fileId);
  const files = await db.files.bulkGet(fileIds);

  // 统计每个文件的总阅读次数
  const readCounts = new Map<string, number>();
  for (const record of allHistory) {
    readCounts.set(record.fileId, (readCounts.get(record.fileId) || 0) + 1);
  }

  return recentFiles.map(record => {
    const file = files.find(f => f?.id === record.fileId);
    return {
      fileId: record.fileId,
      fileName: file?.name || '未知文件',
      lastReadAt: record.readAt,
      readCount: readCounts.get(record.fileId) || 1,
    };
  });
}

/**
 * 获取文件的所有阅读历史
 */
export async function getFileReadingHistory(fileId: string): Promise<ReadingHistory[]> {
  return await db.readingHistory
    .where('fileId')
    .equals(fileId)
    .orderBy('readAt')
    .reverse()
    .toArray();
}
```

**Step 2: 运行类型检查**

Run: `npm run typecheck`
Expected: PASS - 服务代码类型正确

**Step 3: 提交更改**

```bash
git add src/services/readingHistoryService.ts
git commit -m "feat: create reading history service"
```

---

## Task 4: 创建自定义Hook

**Files:**
- Create: `src/hooks/useReadingHistory.ts`

**Step 1: 创建Hook文件**

```typescript
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

  useEffect(() => {
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

    loadRecentFiles();
  }, [limit]);

  return { recentFiles, loading, error, refetch: loadRecentFiles };
}
```

**Step 2: 运行类型检查**

Run: `npm run typecheck`
Expected: PASS - Hook代码类型正确

**Step 3: 提交更改**

```bash
git add src/hooks/useReadingHistory.ts
git commit -m "feat: create useReadingHistory hook"
```

---

## Task 5: 创建最近阅读组件

**Files:**
- Create: `src/components/reading-history/RecentReading.tsx`
- Create: `src/components/reading-history/RecentReading.css`

**Step 1: 创建组件文件**

```typescript
import { List, Card, Button, Typography, Empty, Skeleton } from 'antd';
import { FileOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useRecentReading } from '../../hooks/useReadingHistory';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import './RecentReading.css';

dayjs.extend(relativeTime);

const { Text } = Typography;

export default function RecentReading() {
  const navigate = useNavigate();
  const { recentFiles, loading, error } = useRecentReading(3);

  const handleFileClick = (fileId: string) => {
    navigate(`/reader/${fileId}`);
  };

  const formatReadTime = (timestamp: number) => {
    return dayjs(timestamp).fromNow();
  };

  if (loading) {
    return (
      <Card title="最近阅读" style={{ marginTop: 24 }}>
        <Skeleton active />
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="最近阅读" style={{ marginTop: 24 }}>
        <div>加载失败: {error}</div>
      </Card>
    );
  }

  return (
    <Card
      title="最近阅读"
      className="recent-reading-card"
      style={{ marginTop: 24 }}
      extra={
        <Button 
          type="text" 
          icon={<HistoryOutlined />}
          size="small"
        >
          历史
        </Button>
      }
    >
      {recentFiles.length === 0 ? (
        <Empty 
          description="暂无阅读记录" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          dataSource={recentFiles}
          renderItem={(file) => (
            <List.Item
              className="recent-reading-item"
              onClick={() => handleFileClick(file.fileId)}
            >
              <List.Item.Meta
                avatar={<FileOutlined className="file-icon" />}
                title={file.fileName}
                description={
                  <Text type="secondary" className="read-time">
                    {formatReadTime(file.lastReadAt)}
                    {file.readCount > 1 && ` · 已阅读${file.readCount}次`}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
```

**Step 2: 创建样式文件**

```css
.recent-reading-card .ant-card-head-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recent-reading-item {
  cursor: pointer;
  transition: background-color 0.2s;
  padding: 12px 16px;
  border-radius: 6px;
}

.recent-reading-item:hover {
  background-color: #f5f5f5;
}

.recent-reading-item .file-icon {
  font-size: 16px;
  color: #1890ff;
}

.recent-reading-item .read-time {
  font-size: 12px;
}

.recent-reading-item .ant-list-item-meta-title {
  margin-bottom: 4px;
  font-weight: 500;
}
```

**Step 3: 运行类型检查**

Run: `npm run typecheck`
Expected: PASS - 组件代码类型正确

**Step 4: 提交更改**

```bash
git add src/components/reading-history/RecentReading.tsx src/components/reading-history/RecentReading.css
git commit -m "feat: create RecentReading component"
```

---

## Task 6: 修改阅读页面记录历史

**Files:**
- Modify: `src/pages/ReaderPage.tsx`

**Step 1: 添加导入和状态**

在文件顶部添加导入：

```typescript
import { recordReadingHistory } from '../services/readingHistoryService';
import { useEffect, useRef } from 'react';
```

**Step 2: 在 ReaderPage 组件中添加阅读时间追踪**

在组件内部添加：

```typescript
const startTimeRef = useRef<number>(Date.now());

// 组件卸载时记录阅读历史
useEffect(() => {
  return () => {
    if (file) {
      const endTime = Date.now();
      const readingDuration = Math.round((endTime - startTimeRef.current) / 1000); // 转换为秒
      recordReadingHistory(file.id, readingDuration);
    }
  };
}, [file]);
```

**Step 3: 运行类型检查**

Run: `npm run typecheck`
Expected: PASS - 页面修改类型正确

**Step 4: 提交更改**

```bash
git add src/pages/ReaderPage.tsx
git commit -m "feat: add reading history tracking to ReaderPage"
```

---

## Task 7: 在首页集成最近阅读组件

**Files:**
- Modify: `src/pages/Home.tsx`

**Step 1: 导入组件**

在文件顶部添加导入：

```typescript
import RecentReading from '../components/reading-history/RecentReading';
```

**Step 2: 在适当位置添加组件**

在"我的文件"卡片之后，`} else {` 之前添加：

```typescript
<RecentReading />
```

**Step 3: 运行类型检查**

Run: `npm run typecheck`
Expected: PASS - 首页集成类型正确

**Step 4: 运行应用测试**

Run: `npm run dev`
Expected: 应用启动成功，首页显示"最近阅读"卡片

**Step 5: 提交更改**

```bash
git add src/pages/Home.tsx
git commit -m "feat: integrate RecentReading component in Home page"
```

---

## Task 8: 功能测试

**Files:**
- No file changes (testing)

**Step 1: 测试阅读历史记录**

1. 启动应用: `npm run dev`
2. 加载一些markdown文件
3. 点击进入阅读页面
4. 等待几秒后返回首页
5. 验证"最近阅读"卡片是否显示刚阅读的文件

**Step 2: 测试重复阅读**

1. 再次进入同一个文件阅读
2. 返回首页验证阅读次数显示
3. 验证文件仍在最近阅读列表中

**Step 3: 测试文件跳转**

1. 点击最近阅读卡片中的文件
2. 验证是否正确跳转到阅读页面
3. 验证文件内容是否正确显示

**Step 4: 测试数据持久化**

1. 刷新页面
2. 验证最近阅读数据是否仍然存在

**Step 5: 运行代码检查**

Run: `npm run lint`
Expected: PASS - 无代码质量问题

**Step 6: 提交最终更改**

```bash
git add .
git commit -m "feat: complete recent reading feature implementation"
```

---

## 测试和验证

完成实现后，请运行以下命令确保代码质量：

```bash
npm run typecheck  # 确保类型正确
npm run lint       # 确保代码风格一致
npm test          # 运行所有测试
```

## 验收标准

1. ✅ 用户进入阅读页面时自动记录阅读历史
2. ✅ 首页显示"最近阅读"卡片，展示最近3个不重复的文件
3. ✅ 显示阅读时间和阅读次数
4. ✅ 点击最近阅读的文件能正确跳转到阅读页面
5. ✅ 数据在页面刷新后仍然存在
6. ✅ 代码通过类型检查和代码风格检查

实现完成后，"最近阅读"功能将完全集成到艾宾浩斯复习系统中，为用户提供便捷的文件访问入口。

import db from '../db';
import type { File as FileEntity, Note, ReviewRecord, UserSettings } from '../types';

interface ExportData {
  version: number;
  exportedAt: number;
  files: FileEntity[];
  notes: Note[];
  reviewRecords: ReviewRecord[];
  settings: UserSettings | null;
}

export async function exportData(): Promise<void> {
  const [files, notes, reviewRecords, settings] = await Promise.all([
    db.files.toArray(),
    db.notes.toArray(),
    db.reviewRecords.toArray(),
    db.settings.get('user'),
  ]);

  const data: ExportData = {
    version: 1,
    exportedAt: Date.now(),
    files,
    notes,
    reviewRecords,
    settings: settings || null,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `fuxi-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importData(file: File): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data: ExportData = JSON.parse(text);

        if (!data.version || !Array.isArray(data.files)) {
          resolve({ success: false, message: '无效的备份文件格式' });
          return;
        }

        await db.transaction('rw', [db.files, db.notes, db.reviewRecords, db.settings], async () => {
          await db.files.clear();
          await db.notes.clear();
          await db.reviewRecords.clear();

          if (data.files.length > 0) {
            await db.files.bulkPut(data.files);
          }
          if (data.notes.length > 0) {
            await db.notes.bulkPut(data.notes);
          }
          if (data.reviewRecords.length > 0) {
            await db.reviewRecords.bulkPut(data.reviewRecords);
          }
          if (data.settings) {
            await db.settings.put(data.settings);
          }
        });

        resolve({ success: true, message: `成功导入 ${data.files.length} 个文件` });
      } catch (error) {
        console.error('Import error:', error);
        resolve({ success: false, message: '导入失败，请检查文件格式' });
      }
    };
    reader.onerror = () => {
      resolve({ success: false, message: '读取文件失败' });
    };
    reader.readAsText(file);
  });
}

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

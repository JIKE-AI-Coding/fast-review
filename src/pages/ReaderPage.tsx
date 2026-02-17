import { useState } from 'react';
import { Layout, Button, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useFile, useFiles } from '../hooks/useFiles';
import { markAsLearned } from '../services/reviewService';
import MarkdownReader from '../components/reader/MarkdownReader';
import ReaderToolbar from '../components/reader/ReaderToolbar';
import NoteEditor from '../components/notes/NoteEditor';
import NoteList from '../components/notes/NoteList';
import { createNote, updateNote, deleteNote } from '../services/noteService';
import type { Note } from '../types';

const { Content } = Layout;

export default function ReaderPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState(16);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const { files } = useFiles();

  const file = fileId ? useFile(fileId) : null;
  const notes = fileId ? [] : [];

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
            notes={notes}
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

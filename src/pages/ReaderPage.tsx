import { useState, useEffect, useRef } from 'react';
import { Layout, Button, message, Layout as AntLayout, Tree, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useFile, useFiles } from '../hooks/useFiles';
import { markAsLearned } from '../services/reviewService';
import { recordReadingHistory } from '../services/readingHistoryService';
import MarkdownReader from '../components/reader/MarkdownReader';
import ReaderToolbar from '../components/reader/ReaderToolbar';
import NoteEditor from '../components/notes/NoteEditor';
import NoteList from '../components/notes/NoteList';
import { createNote, updateNote, deleteNote } from '../services/noteService';
import type { Note } from '../types';

const { Content, Sider } = AntLayout;
const { Text } = Typography;

export default function ReaderPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState(16);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const { files } = useFiles();

  const file = fileId ? useFile(fileId) : null;
  const notes = fileId ? [] : [];

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

  const parseMarkdownHeadings = (content: string): Array<{ level: number; text: string; id: string }> => {
    const headings: Array<{ level: number; text: string; id: string }> = [];
    if (!content) return headings;

    const lines = content.split('\n');
    const headingRegex = /^(#{1,6})\s+(.+)$/;

    lines.forEach((line) => {
      const match = line.match(headingRegex);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '');
        headings.push({ level, text, id });
      }
    });

    return headings;
  };

  const buildHeadingTree = (headings: Array<{ level: number; text: string; id: string }>): any[] => {
    if (headings.length === 0) return [];

    const tree: any[] = [];
    const stack: any[] = [{ children: tree, level: 0 }];

    headings.forEach((heading, index) => {
      const node = {
        key: `heading-${index}`,
        title: heading.text,
        isLeaf: false,
        children: [],
        style: { fontWeight: heading.level <= 2 ? '600' : '400' },
      };

      while (stack.length > 1 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }

      const parent = stack[stack.length - 1];
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(node);

      if (heading.level < 6) {
        stack.push({ children: node.children, level: heading.level });
      }
    });

    const markLeaves = (nodes: any[]): any[] => {
      return nodes.map(node => ({
        ...node,
        isLeaf: !node.children || node.children.length === 0,
        children: node.children && node.children.length > 0 ? markLeaves(node.children) : undefined,
      }));
    };

    return markLeaves(tree);
  };

  const handleHeadingClick = (headingId: string) => {
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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

  const headings = file?.content ? parseMarkdownHeadings(file.content) : [];
  const headingTree = buildHeadingTree(headings);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {headingTree.length > 0 && (
        <Sider width={280} theme="light" style={{ overflow: 'auto', height: '100vh', position: 'fixed', right: 0, top: 0, paddingTop: '60px' }}>
          <div style={{ padding: '16px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>目录</h3>
            <Tree
              showLine
              treeData={headingTree}
              onSelect={(_, info: any) => {
                if (info.node) {
                  const headings = parseMarkdownHeadings(file?.content || '');
                  const index = parseInt(info.node.key.replace('heading-', ''));
                  if (headings[index]) {
                    handleHeadingClick(headings[index].id);
                  }
                }
              }}
              defaultExpandAll
              style={{ fontSize: '13px' }}
            />
          </div>
        </Sider>
      )}
      <Content style={{ marginRight: headingTree.length > 0 ? '280px' : '0' }}>
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

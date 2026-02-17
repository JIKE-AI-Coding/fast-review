import { useState, useEffect } from 'react';
import { Modal, Input } from 'antd';

const { TextArea } = Input;

interface Note {
  id: string;
  content: string;
  createdAt: number;
}

interface NoteEditorProps {
  visible: boolean;
  note?: Note;
  fileId?: string;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
}

export default function NoteEditor({
  visible,
  note,
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
        onChange={(e) => setContent((e.target as HTMLTextAreaElement).value)}
        placeholder="输入笔记内容..."
        autoFocus
      />
    </Modal>
  );
}

// Suppress unused variable warning for fileId - it's passed by parent but not used here
export {};

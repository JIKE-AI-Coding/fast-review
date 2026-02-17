import { List, Card, Button } from 'antd';
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

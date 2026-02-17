import { useState } from 'react';
import { Layout, Button, Card, List, Modal, message } from 'antd';
import { FolderOpenOutlined, ThunderboltOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTodayReviewTasks } from '../hooks/useReview';
import { useFiles } from '../hooks/useFiles';
import { useNotes } from '../hooks/useNotes';
import type { ReviewTask } from '../types';
import ReviewTaskCard from '../components/review/ReviewTaskCard';
import StatsOverview from '../components/stats/StatsOverview';
import NoteEditor from '../components/notes/NoteEditor';
import { createNote } from '../services/noteService';
import type { Note } from '../types';
import './Home.css';

const { Content } = Layout;

export default function Home() {
  const navigate = useNavigate();
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string>();
  const { tasks, loading: loadingTasks } = useTodayReviewTasks();
  const { files } = useFiles();
  const notes = useNotes();

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

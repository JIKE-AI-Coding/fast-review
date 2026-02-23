import { useState, useMemo, useRef } from 'react';
import { Layout, Button, Card, List, message, Popconfirm, Space, Typography } from 'antd';
import { FolderOpenOutlined, ThunderboltOutlined, DeleteOutlined, FolderOutlined, PlusOutlined, DownloadOutlined, UploadOutlined, BarChartOutlined, FileTextOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTodayReviewTasks } from '../hooks/useReview';
import { useFiles } from '../hooks/useFiles';
import ReviewTaskCard from '../components/review/ReviewTaskCard';
import RecentReading from '../components/reading-history/RecentReading';
import { deleteFiles } from '../services/fileService';
import { exportData, importData } from '../services/syncService';
import './Home.css';

const { Content } = Layout;
const { Text } = Typography;

interface Directory {
  path: string;
  name: string;
  fileCount: number;
}

export default function Home() {
  const navigate = useNavigate();
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { tasks, loading: loadingTasks } = useTodayReviewTasks();
  const { files } = useFiles();

  const directories = useMemo((): Directory[] => {
    if (!files || files.length === 0) return [];

    const dirMap = new Map<string, { name: string; count: number }>();

    files.forEach(file => {
      const parts = file.path.split('/');
      if (parts.length > 0) {
        const rootDir = parts[0];
        const existing = dirMap.get(rootDir);
        if (existing) {
          existing.count++;
        } else {
          dirMap.set(rootDir, { name: rootDir, count: 1 });
        }
      }
    });

    return Array.from(dirMap.entries()).map(([path, data]) => ({
      path,
      name: data.name,
      fileCount: data.count,
    }));
  }, [files]);

  const handleLoadDirectory = async () => {
    try {
      setLoadingDirectory(true);

      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;

      input.onchange = async (e) => {
        try {
          const filesInput = (e.target as HTMLInputElement).files;
          if (!filesInput || filesInput.length === 0) return;

          message.info(`开始加载 ${filesInput.length} 个文件...`);

          const filePromises: Array<Promise<{ name: string; content: string; path: string; size: number }>> = [];

          for (let i = 0; i < filesInput.length; i++) {
            const file = filesInput[i];
            if (!file.name.endsWith('.md')) continue;

            const filePromise = new Promise<{ name: string; content: string; path: string; size: number }>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  name: file.name,
                  content: reader.result as string,
                  path: file.webkitRelativePath,
                  size: file.size
                });
              };
              reader.onerror = () => {
                reject(new Error(`无法读取文件: ${file.name}`));
              };
              reader.readAsText(file);
            });

            filePromises.push(filePromise);
          }

          const scanResults = await Promise.all(filePromises);

          if (scanResults.length === 0) {
            message.warning('未找到markdown文件');
            setLoadingDirectory(false);
            return;
          }

          message.success(`成功加载 ${scanResults.length} 个markdown文件`);

          const fileService = await import('../services/fileService');
          const now = Date.now();

          await fileService.saveFilesToDatabase(scanResults.map(f => ({
            id: fileService.generateFileId(f.path),
            path: f.path,
            name: f.name,
            content: f.content,
            size: f.size,
            modifiedAt: now,
            createdAt: now,
            reviewLevel: 0,
            lastReviewedAt: 0,
            nextReviewAt: 0,
            readingProgress: 0,
          })));

          setLoadingDirectory(false);
        } catch (error) {
          console.error('Failed to load directory:', error);
          message.error('加载目录失败');
          setLoadingDirectory(false);
        }
      };

      input.click();
    } catch (error) {
      console.error('Failed to setup directory input:', error);
      message.error('无法创建目录选择器');
      setLoadingDirectory(false);
    }
  };

  const handleDeleteDirectory = async (directoryPath: string) => {
    if (!files || files.length === 0) return;

    const filesInDirectory = files.filter(f => f.path.startsWith(directoryPath + '/') || f.path === directoryPath);

    if (filesInDirectory.length === 0) {
      message.info('该目录下没有文件');
      return;
    }

    try {
      await deleteFiles(filesInDirectory.map(f => f.id));
      message.success(`已删除 ${filesInDirectory.length} 个文件`);
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleOpenDirectory = (dirPath: string) => {
    navigate(`/directory/${encodeURIComponent(dirPath)}`);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportData();
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const result = await importData(file);
      if (result.success) {
        message.success(result.message);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('导入失败');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <div className="home-container">
          {!files || files.length === 0 ? (
            <Card className="welcome-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <h1 style={{ marginBottom: 16, fontSize: 32, color: '#1890ff' }}>欢迎使用艾宾浩斯复习系统</h1>
              <p style={{ marginBottom: 32, fontSize: 16, color: '#666' }}>基于科学遗忘曲线的智能复习助手</p>
              <Space direction="vertical" size="middle">
                <Button
                  type="primary"
                  size="large"
                  icon={<FolderOpenOutlined />}
                  onClick={handleLoadDirectory}
                  loading={loadingDirectory}
                >
                  加载学习目录
                </Button>
                <Button
                  size="large"
                  icon={<UploadOutlined />}
                  onClick={handleImportClick}
                  loading={importing}
                >
                  导入备份数据
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleImport}
                />
              </Space>
            </Card>
          ) : (
            <>
              <div className="welcome-banner">
                <div className="welcome-banner-text">
                  Hi 👋 欢迎回来
                </div>
                <div className="welcome-banner-stats">
                  <span><FileTextOutlined /> {files.length} 个文件</span>
                  <span style={{ cursor: 'pointer' }} onClick={() => navigate('/stats')}>
                    <BarChartOutlined /> 查看统计
                  </span>
                </div>
              </div>

              <Card className="review-hero-card">
                <div className="review-hero-content">
                  <div className="review-hero-info">
                    <div className="review-hero-title">今天你要做什么？</div>
                    <div className="review-hero-subtitle">
                      {loadingTasks ? '加载中...' : tasks.length > 0 ? (
                        <>有 <ClockCircleOutlined /> {tasks.length} 项内容等待复习</>
                      ) : (
                        '太棒了！今天没有需要复习的内容'
                      )}
                    </div>
                  </div>
                  <Button
                    className="review-hero-btn"
                    size="large"
                    icon={<ThunderboltOutlined />}
                    onClick={() => navigate('/review')}
                    disabled={tasks.length === 0}
                  >
                    开始复习
                  </Button>
                </div>
                {!loadingTasks && tasks.length > 0 && (
                  <div className="review-tasks-preview">
                    <List
                      dataSource={tasks.slice(0, 3)}
                      renderItem={(task) => (
                        <ReviewTaskCard
                          task={task}
                          onReview={() => navigate(`/review/${task.fileId}`)}
                        />
                      )}
                    />
                    {tasks.length > 3 && (
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8, display: 'block', textAlign: 'center' }}>
                        还有 {tasks.length - 3} 项...
                      </Text>
                    )}
                  </div>
                )}
              </Card>
            </>
          )}

          {files && files.length > 0 && (
            <>
              <Card
                title="我的文件"
                extra={
                  <Space>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={handleExport}
                      loading={exporting}
                    >
                      导出
                    </Button>
                    <Button
                      icon={<UploadOutlined />}
                      onClick={handleImportClick}
                      loading={importing}
                    >
                      导入
                    </Button>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleLoadDirectory}
                      loading={loadingDirectory}
                    >
                      导入目录
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      style={{ display: 'none' }}
                      onChange={handleImport}
                    />
                  </Space>
                }
                style={{ marginTop: 24 }}
              >
                <List
                  dataSource={directories}
                  renderItem={(dir) => (
                    <List.Item
                      actions={[
                        <Popconfirm
                          key="delete"
                          title="确定删除该目录及所有文件？"
                          onConfirm={() => handleDeleteDirectory(dir.path)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                        </Popconfirm>,
                      ]}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleOpenDirectory(dir.path)}
                    >
                      <List.Item.Meta
                        avatar={<FolderOutlined style={{ fontSize: 24, color: '#faad14' }} />}
                        title={dir.name}
                        description={`${dir.fileCount} 个文件`}
                      />
                    </List.Item>
                  )}
                />
              </Card>

              <RecentReading />
            </>
          )}
        </div>
      </Content>
    </Layout>
  );
}

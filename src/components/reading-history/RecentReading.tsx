import { useState } from 'react';
import { List, Card, Button, Typography, Empty, Skeleton, Progress } from 'antd';
import { FileOutlined, HistoryOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRecentReading, useTotalReadingCount } from '../../hooks/useReadingHistory';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import './RecentReading.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

function getDirectoryPath(filePath: string): string {
  if (!filePath) return '';
  const parts = filePath.split('/');
  if (parts.length <= 1) return '';
  return parts[0];
}

export default function RecentReading() {
  const navigate = useNavigate();
  const { recentFiles, loading, error } = useRecentReading(3);
  const { count: totalCount } = useTotalReadingCount();

  const handleFileClick = (file: { fileId: string; filePath: string }) => {
    const dirPath = getDirectoryPath(file.filePath);
    if (dirPath) {
      navigate(`/directory/${encodeURIComponent(dirPath)}?fileId=${file.fileId}`);
    } else {
      navigate(`/reader/${file.fileId}`);
    }
  };

  const handleViewMore = () => {
    navigate('/history');
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
        totalCount > 3 && (
          <Button 
            type="text" 
            icon={<HistoryOutlined />}
            size="small"
            onClick={handleViewMore}
          >
            更多 ({totalCount})
          </Button>
        )
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
              onClick={() => handleFileClick(file)}
            >
              <List.Item.Meta
                avatar={<FileOutlined className="file-icon" />}
                title={file.fileName}
                description={
                  <div className="item-content">
                    <Text type="secondary" className="read-time">
                      {formatReadTime(file.lastReadAt)}
                      {file.readCount > 1 && ` · 已阅读${file.readCount}次`}
                    </Text>
                    {file.readingProgress > 0 && (
                      <div className="progress-wrapper">
                        <Progress 
                          percent={file.readingProgress} 
                          size="small"
                          showInfo={false}
                          strokeColor={{
                            '0%': '#1890ff',
                            '100%': '#52c41a',
                          }}
                        />
                        <Text type="secondary" className="progress-text">{file.readingProgress}%</Text>
                      </div>
                    )}
                  </div>
                }
              />
              <RightOutlined className="arrow-icon" />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
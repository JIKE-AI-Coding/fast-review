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
import { useEffect, useCallback } from 'react';
import { Modal, List, Typography, Empty, Skeleton, Button, Spin } from 'antd';
import { FileOutlined, ClockCircleOutlined, ReadOutlined } from '@ant-design/icons';
import { usePaginatedReadingHistory, type PaginatedReadingFile } from '../../hooks/useReadingHistory';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import './ReadingHistoryModal.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

interface ReadingHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  onFileClick: (file: PaginatedReadingFile) => void;
}

const formatDuration = (seconds?: number): string => {
  if (!seconds) return '';
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}`;
};

export default function ReadingHistoryModal({
  visible,
  onClose,
  onFileClick,
}: ReadingHistoryModalProps) {
  const { items, total, hasMore, loading, loadMore, refresh } = usePaginatedReadingHistory(
    window.innerWidth < 768 ? 5 : 10
  );

  useEffect(() => {
    if (visible) {
      refresh();
    }
  }, [visible, refresh]);

  const handleFileClick = (file: PaginatedReadingFile) => {
    onFileClick(file);
    onClose();
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  const formatReadTime = (timestamp: number) => {
    return dayjs(timestamp).fromNow();
  };

  const renderItem = (file: PaginatedReadingFile) => (
    <List.Item
      className="history-item"
      onClick={() => handleFileClick(file)}
    >
      <List.Item.Meta
        avatar={<FileOutlined className="file-icon" />}
        title={file.fileName}
        description={
          <div className="item-meta">
            <Text type="secondary">
              <ClockCircleOutlined /> {formatReadTime(file.lastReadAt)}
            </Text>
            {file.readCount > 1 && (
              <Text type="secondary">
                <ReadOutlined /> 阅读{file.readCount}次
              </Text>
            )}
          </div>
        }
      />
    </List.Item>
  );

  return (
    <Modal
      title={`阅读历史 (${total}篇)`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={window.innerWidth < 768 ? '95%' : 600}
      centered
      className="reading-history-modal"
      styles={{
        body: {
          maxHeight: window.innerWidth < 768 ? '60vh' : '70vh',
          overflowY: 'auto',
          padding: '12px 24px',
        },
      }}
    >
      <div onScroll={handleScroll} className="history-list-container">
        {loading && items.length === 0 ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : items.length === 0 ? (
          <Empty description="暂无阅读记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <>
            <List
              dataSource={items}
              renderItem={renderItem}
              split
            />
            {loading && items.length > 0 && (
              <div className="loading-more">
                <Spin />
              </div>
            )}
            {!loading && !hasMore && items.length > 0 && (
              <div className="no-more">
                <Text type="secondary">已加载全部</Text>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

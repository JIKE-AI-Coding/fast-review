import { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, List, Typography, Empty, Spin, Pagination, Button, Progress } from 'antd';
import { FileOutlined, ClockCircleOutlined, ReadOutlined, ArrowLeftOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getAllReadingHistoryPaginated } from '../services/readingHistoryService';
import db from '../db';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import './ReadingHistoryPage.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text, Title } = Typography;
const { Content } = Layout;

interface ReadingHistoryItem {
  fileId: string;
  fileName: string;
  filePath: string;
  lastReadAt: number;
  readCount: number;
  readingDuration?: number;
  readingProgress: number;
}

const DESKTOP_PAGE_SIZE = 15;
const MOBILE_PAGE_SIZE = 10;
const MOBILE_BREAKPOINT = 768;

function getDirectoryPath(filePath: string): string {
  if (!filePath) return '';
  const parts = filePath.split('/');
  if (parts.length <= 1) return '';
  return parts[0];
}

export default function ReadingHistoryPage() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [items, setItems] = useState<ReadingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const pageSize = isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadPage = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const result = await getAllReadingHistoryPaginated(pageNum, pageSize);
      
      if (append) {
        setItems(prev => [...prev, ...result.items]);
      } else {
        setItems(result.items);
      }
      setTotal(result.total);
      setHasMore(result.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error('加载阅读历史失败:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [pageSize]);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const handleFileClick = (file: ReadingHistoryItem) => {
    const dirPath = getDirectoryPath(file.filePath);
    if (dirPath) {
      navigate(`/directory/${encodeURIComponent(dirPath)}?fileId=${file.fileId}`);
    } else {
      navigate(`/reader/${file.fileId}`);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handlePageChange = (newPage: number) => {
    loadPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadPage(page + 1, true);
    }
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 200 && hasMore && !loadingMore) {
      loadPage(page + 1, true);
    }
  }, [isMobile, hasMore, loadingMore, page, loadPage]);

  const formatReadTime = (timestamp: number) => {
    return dayjs(timestamp).fromNow();
  };

  const renderItem = (file: ReadingHistoryItem) => (
    <List.Item
      className="history-item"
      onClick={() => handleFileClick(file)}
    >
      <List.Item.Meta
        avatar={<FileOutlined className="file-icon" />}
        title={file.fileName}
        description={
          <div className="item-meta">
            <div className="meta-row">
              <Text type="secondary">
                <ClockCircleOutlined /> {formatReadTime(file.lastReadAt)}
              </Text>
              {file.readCount > 1 && (
                <Text type="secondary">
                  <ReadOutlined /> 阅读{file.readCount}次
                </Text>
              )}
            </div>
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
    </List.Item>
  );

  return (
    <Layout className="reading-history-page">
      <div className="page-header">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          className="back-button"
        />
        <Title level={4} className="page-title">阅读历史</Title>
        <Text type="secondary" className="total-count">共 {total} 篇</Text>
      </div>
      
      <Content 
        ref={listRef}
        className="page-content"
        onScroll={handleScroll}
      >
        {loading ? (
          <div className="loading-container">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          </div>
        ) : items.length === 0 ? (
          <Empty description="暂无阅读记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <>
            <List
              dataSource={items}
              renderItem={renderItem}
              split
            />
            
            {isMobile ? (
              <>
                {loadingMore && (
                  <div className="loading-more">
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 20 }} spin />} />
                    <Text type="secondary" style={{ marginLeft: 8 }}>加载中...</Text>
                  </div>
                )}
                {!loadingMore && hasMore && (
                  <div className="load-more-container">
                    <Button onClick={handleLoadMore} block>
                      加载更多
                    </Button>
                  </div>
                )}
                {!hasMore && items.length > 0 && (
                  <div className="no-more">
                    <Text type="secondary">已加载全部</Text>
                  </div>
                )}
              </>
            ) : (
              <div className="pagination-container">
                <Pagination
                  current={page}
                  total={total}
                  pageSize={pageSize}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  showTotal={(total) => `共 ${total} 条`}
                />
              </div>
            )}
          </>
        )}
      </Content>
    </Layout>
  );
}

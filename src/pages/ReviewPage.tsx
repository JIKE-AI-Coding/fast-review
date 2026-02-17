import { useState } from 'react';
import { Layout, Card, Button, Empty } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTodayReviewTasks } from '../hooks/useReview';
import type { ReviewTask } from '../types';
import ReviewMode from '../components/review/ReviewMode';

const { Content } = Layout;

export default function ReviewPage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { tasks, loading } = useTodayReviewTasks();

  const handleBack = () => {
    navigate('/');
  };

  const handleNext = () => {
    if (currentIndex < tasks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <Content style={{ padding: '24px' }}>
        <div>加载中...</div>
      </Content>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Content style={{ padding: '24px' }}>
        <Card
          extra={
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              返回
            </Button>
          }
        >
          <Empty description="今天没有需要复习的内容" />
        </Card>
      </Content>
    );
  }

  const currentTask = tasks[currentIndex];

  return (
    <ReviewMode
      fileId={currentTask.fileId}
      onBack={handleBack}
      onPrevious={handlePrevious}
      onNext={handleNext}
      canPrevious={currentIndex > 0}
      canNext={currentIndex < tasks.length - 1}
    />
  );
}

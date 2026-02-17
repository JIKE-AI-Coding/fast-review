import { useState } from 'react';
import { Layout, Button, Space, message } from 'antd';
import { CheckOutlined, CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useFile } from '../../hooks/useFiles';
import { submitReview } from '../../services/reviewService';
import MarkdownReader from '../reader/MarkdownReader';
import ReaderToolbar from '../reader/ReaderToolbar';
import './ReviewMode.css';

const { Content } = Layout;

interface ReviewModeProps {
  fileId: string;
  onBack: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
}

export default function ReviewMode({
  fileId,
  onBack,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
}: ReviewModeProps) {
  const [fontSize, setFontSize] = useState(16);
  const file = useFile(fileId);

  const handleRemember = async () => {
    if (!file) return;

    try {
      await submitReview(file.id, 'remembered');
      message.success('已标记为记住');

      if (canNext) {
        onNext();
      } else {
        onBack();
      }
    } catch (error) {
      message.error('提交失败');
    }
  };

  const handleForget = async () => {
    if (!file) return;

    try {
      await submitReview(file.id, 'forgotten');
      message.success('已标记为忘记，将重新开始复习');

      if (canNext) {
        onNext();
      } else {
        onBack();
      }
    } catch (error) {
      message.error('提交失败');
    }
  };

  if (!file) {
    return <div>加载中...</div>;
  }

  return (
    <Layout className="review-mode">
      <Content>
        <ReaderToolbar
          file={file}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onThemeToggle={() => {}}
          onPrevious={onPrevious}
          onNext={onNext}
          canPrevious={canPrevious}
          canNext={canNext}
        />
        <div style={{ fontSize: `${fontSize}px` }}>
          <MarkdownReader file={file} />
        </div>
        <div className="review-actions">
          <Space size="large">
            <Button
              icon={<CloseOutlined />}
              size="large"
              danger
              onClick={handleForget}
            >
              忘记了
            </Button>
            <Button
              icon={<CheckOutlined />}
              size="large"
              type="primary"
              onClick={handleRemember}
            >
              记住了
            </Button>
          </Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
          >
            返回
          </Button>
        </div>
      </Content>
    </Layout>
  );
}

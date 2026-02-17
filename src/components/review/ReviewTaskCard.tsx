import { Card, Tag, Button } from 'antd';
import type { ReviewTask } from '../../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface ReviewTaskCardProps {
  task: ReviewTask;
  onReview: () => void;
}

export default function ReviewTaskCard({ task, onReview }: ReviewTaskCardProps) {
  return (
    <Card
      hoverable
      actions={[
        <Button type="link" onClick={onReview}>
          开始复习
        </Button>,
      ]}
    >
      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
        {task.fileName}
      </div>
      <div style={{ marginTop: 8 }}>
        {task.overdue && <Tag color="red">已逾期</Tag>}
        <Tag>第 {task.reviewLevel} 级</Tag>
        <Tag>
          {dayjs(task.lastReviewedAt).fromNow()} 学习
        </Tag>
      </div>
    </Card>
  );
}

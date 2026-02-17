import { Card, Row, Col, Statistic } from 'antd';
import { FileTextOutlined, TrophyOutlined } from '@ant-design/icons';
import { useMemoryStats } from '../../hooks/useReview';
import { useFiles } from '../../hooks/useFiles';

export default function StatsOverview() {
  const { retentionRate, totalReviews } = useMemoryStats();
  const { files } = useFiles();

  return (
    <div className="stats-overview">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总文件数"
              value={files?.length || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总复习次数"
              value={totalReviews || 0}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="记忆保持率"
              value={retentionRate || 0}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: retentionRate && retentionRate >= 70 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="学习文件"
              value={files?.filter(f => f.reviewLevel > 0).length || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

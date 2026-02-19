import { Card, Row, Col, Statistic, Progress, Typography, Empty } from 'antd';
import { FileTextOutlined, TrophyOutlined, BarChartOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useMemoryStats } from '../hooks/useReview';
import { useFiles } from '../hooks/useFiles';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Layout } from 'antd';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function StatsPage() {
  const navigate = useNavigate();
  const { retentionRate, totalReviews } = useMemoryStats();
  const { files } = useFiles();

  const learnedFiles = files?.filter(f => f.reviewLevel > 0).length || 0;
  const totalFiles = files?.length || 0;

  const getLevelDistribution = () => {
    if (!files) return [];
    const distribution = [0, 0, 0, 0, 0, 0, 0, 0];
    files.forEach(f => {
      if (f.reviewLevel >= 0 && f.reviewLevel < 8) {
        distribution[f.reviewLevel]++;
      }
    });
    return distribution;
  };

  const levelDistribution = getLevelDistribution();

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} />
          <Title level={3} style={{ margin: 0 }}>学习统计</Title>
        </div>

        {!files || files.length === 0 ? (
          <Card>
            <Empty description="暂无学习数据" />
          </Card>
        ) : (
          <>
            <Card style={{ marginBottom: 16 }}>
              <Row gutter={[24, 24]}>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="总文件数"
                    value={totalFiles}
                    prefix={<FileTextOutlined />}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="已学习"
                    value={learnedFiles}
                    prefix={<BarChartOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="总复习次数"
                    value={totalReviews || 0}
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="记忆保持率"
                    value={retentionRate || 0}
                    suffix="%"
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: retentionRate && retentionRate >= 70 ? '#3f8600' : '#cf1322' }}
                  />
                </Col>
              </Row>
            </Card>

            <Card title="学习进度" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>总体进度</Text>
                  <Text type="secondary">{learnedFiles} / {totalFiles} 文件</Text>
                </div>
                <Progress percent={totalFiles > 0 ? Math.round((learnedFiles / totalFiles) * 100) : 0} />
              </div>
            </Card>

            <Card title="复习等级分布">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {levelDistribution.map((count, level) => (
                  <div key={level}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text>Lv.{level} {level === 0 ? '(未学习)' : ''}</Text>
                      <Text type="secondary">{count} 个文件</Text>
                    </div>
                    <Progress 
                      percent={totalFiles > 0 ? Math.round((count / totalFiles) * 100) : 0} 
                      showInfo={false}
                      strokeColor={level === 0 ? '#d9d9d9' : '#1890ff'}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </Content>
    </Layout>
  );
}

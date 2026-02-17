import { useState } from 'react';
import { Layout, Button, theme } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import Sidebar from './Sidebar';
import ContentArea from './ContentArea';
import './MainLayout.css';

const { Header, Content, Sider } = Layout;

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  const handleLoadDirectory = async () => {
    try {
      setLoadingDirectory(true);
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;

      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
          // TODO: 调用文件服务加载目录
          console.log('Loading directory with', files.length, 'files');
        }
        setLoadingDirectory(false);
      };

      input.click();
    } catch (error) {
      console.error('Failed to load directory:', error);
      setLoadingDirectory(false);
    }
  };

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', flex: 1 }}>
          艾宾浩斯复习系统
        </div>
        <Button
          type="primary"
          icon={<FolderOpenOutlined />}
          onClick={handleLoadDirectory}
          loading={loadingDirectory}
        >
          加载目录
        </Button>
      </Header>
      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={280}
          style={{ background: colorBgContainer }}
        >
          <Sidebar collapsed={collapsed} />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              padding: 24,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: 8,
            }}
          >
            <ContentArea />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
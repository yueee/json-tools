import React from 'react';
import { Layout as AntLayout, Menu, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CodeOutlined, 
  SwapOutlined, 
  FileTextOutlined 
} from '@ant-design/icons';
import styles from './Layout.module.css';

const { Sider, Content, Header } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <CodeOutlined />,
      label: 'Format',
    },
    {
      key: '/converter',
      icon: <SwapOutlined />,
      label: 'Converter',
    },
    {
      key: '/generator',
      icon: <FileTextOutlined />,
      label: 'Generator',
    },
  ];

  return (
    <AntLayout className={styles.layout}>
      <Sider 
        className={styles.sider}
        width={200}
        theme="dark"
      >
        <div className={styles.logo}>
          <Title level={4} className={styles.title}>
            JSON Tools
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout className={styles.main}>
        <Header className={styles.header}>
          <Title level={4} className={styles.headerTitle}>
            {menuItems.find(item => item.key === location.pathname)?.label || 'JSON Tools'}
          </Title>
        </Header>
        <Content className={styles.content}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;

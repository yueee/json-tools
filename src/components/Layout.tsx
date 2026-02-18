import React from 'react';
import { Layout as AntLayout, Menu, Typography, Button, Space, Dropdown } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  CodeOutlined, 
  SwapOutlined, 
  FileTextOutlined,
  GlobalOutlined,
  CheckOutlined
} from '@ant-design/icons';
import styles from './Layout.module.css';

const { Sider, Content, Header } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <CodeOutlined />,
      label: t('nav.format'),
    },
    {
      key: '/converter',
      icon: <SwapOutlined />,
      label: t('nav.converter'),
    },
    {
      key: '/generator',
      icon: <FileTextOutlined />,
      label: t('nav.generator'),
    },
  ];

  const languageItems = [
    {
      key: 'en',
      label: (
        <Space>
          {i18n.language === 'en' && <CheckOutlined />}
          English
        </Space>
      ),
      onClick: () => i18n.changeLanguage('en'),
    },
    {
      key: 'zh',
      label: (
        <Space>
          {i18n.language === 'zh' && <CheckOutlined />}
          中文
        </Space>
      ),
      onClick: () => i18n.changeLanguage('zh'),
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
            {t('app.title')}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
        <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, padding: '0 16px' }}>
          <Dropdown menu={{ items: languageItems }} placement="topLeft">
            <Button icon={<GlobalOutlined />} block>
              {t('language.switch')}
            </Button>
          </Dropdown>
        </div>
      </Sider>
      <AntLayout className={styles.main}>
        <Header className={styles.header}>
          <Title level={4} className={styles.headerTitle}>
            {menuItems.find(item => item.key === location.pathname)?.label || t('app.title')}
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

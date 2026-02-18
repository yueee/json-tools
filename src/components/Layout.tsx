import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Button, Space, Dropdown, Drawer } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  CodeOutlined, 
  SwapOutlined, 
  FileTextOutlined,
  GlobalOutlined,
  CheckOutlined,
  MenuOutlined,
  SunOutlined,
  MoonOutlined,
  DiffOutlined,
  SearchOutlined,
  ToolOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import styles from './Layout.module.css';

const { Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
  isDark: boolean;
  onToggleTheme: () => void;
  themeMode: 'auto' | 'light' | 'dark';
}

const Layout: React.FC<LayoutProps> = ({ children, isDark, onToggleTheme, themeMode }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    {
      key: '/diff',
      icon: <DiffOutlined />,
      label: t('nav.diff'),
    },
    {
      key: '/path',
      icon: <SearchOutlined />,
      label: 'JSONPath',
    },
    {
      key: '/escape',
      icon: <ToolOutlined />,
      label: t('nav.escape'),
    },
    {
      key: '/mock',
      icon: <DatabaseOutlined />,
      label: t('nav.mock'),
    },
  ];

  const languageItems = [
    {
      key: 'en',
      label: (
        <Space>
          {i18n.language === 'en' && <CheckOutlined style={{ color: '#f43f5e' }} />}
          English
        </Space>
      ),
      onClick: () => i18n.changeLanguage('en'),
    },
    {
      key: 'zh',
      label: (
        <Space>
          {i18n.language === 'zh' && <CheckOutlined style={{ color: '#f43f5e' }} />}
          中文
        </Space>
      ),
      onClick: () => i18n.changeLanguage('zh'),
    },
  ];

  const getThemeIcon = () => {
    if (themeMode === 'auto') {
      return <GlobalOutlined />;
    } else if (isDark) {
      return <MoonOutlined />;
    } else {
      return <SunOutlined />;
    }
  };

  const getThemeTitle = () => {
    if (themeMode === 'auto') {
      return t('theme.auto');
    } else if (isDark) {
      return t('theme.dark');
    } else {
      return t('theme.light');
    }
  };

  const handleMenuClick = (key: string) => {
    navigate(key);
    setMobileMenuOpen(false);
  };

  return (
    <AntLayout className={styles.layout}>
      {/* Top Navigation Bar */}
      <header className={styles.topNav}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            {'{ }'}
          </div>
          <span className={styles.logoText}>JSON Tools</span>
        </div>

        {/* Desktop Menu */}
        <nav className={styles.desktopMenu}>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            className={styles.menu}
          />
        </nav>

        {/* Right Actions */}
        <div className={styles.rightActions}>
          <Button
            type="text"
            icon={getThemeIcon()}
            onClick={onToggleTheme}
            className={styles.themeBtn}
            title={getThemeTitle()}
          />
          <Dropdown menu={{ items: languageItems }} placement="bottomRight">
            <Button icon={<GlobalOutlined />} type="text" className={styles.langBtn}>
              {i18n.language === 'zh' ? '中文' : 'EN'}
            </Button>
          </Dropdown>
        </div>

        {/* Mobile Menu Button */}
        <Button
          className={styles.mobileMenuBtn}
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setMobileMenuOpen(true)}
        />
      </header>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        className={styles.drawer}
        width={280}
        title={
          <div className={styles.logo}>
            <div className={styles.logoIcon}>{'{ }'}</div>
            <span className={styles.logoText}>JSON Tools</span>
          </div>
        }
      >
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
          className={styles.drawerMenu}
        />
        <div className={styles.drawerFooter}>
          <Button
            icon={getThemeIcon()}
            onClick={() => { onToggleTheme(); }}
            block
            style={{ marginBottom: 8 }}
          >
            {getThemeTitle()}
          </Button>
          <Dropdown menu={{ items: languageItems }} placement="topLeft">
            <Button icon={<GlobalOutlined />} block>
              {t('language.switch')}
            </Button>
          </Dropdown>
        </div>
      </Drawer>

      {/* Main Content */}
      <AntLayout className={styles.main}>
        <Content className={styles.content}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;

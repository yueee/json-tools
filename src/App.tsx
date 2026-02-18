import './i18n';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import Layout from './components/Layout';
import Format from './pages/Format';
import Converter from './pages/Converter';
import Generator from './pages/Generator';
import './App.css';

function App() {
  const [isDark, setIsDark] = useState(() => {
    // 优先读取用户设置，否则使用系统设置
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('theme');
      if (!saved) setIsDark(e.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    // 保存用户设置
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: isDark ? {
          colorPrimary: '#6366f1',
          colorBgContainer: '#16162a',
          colorBgElevated: '#1e1e3a',
          colorBorder: '#2a2a4a',
          colorText: '#fff',
          colorTextSecondary: '#888',
        } : {
          colorPrimary: '#6366f1',
          colorBgContainer: '#ffffff',
          colorBgElevated: '#f5f5f5',
          colorBorder: '#e0e0e0',
          colorText: '#1a1a1a',
          colorTextSecondary: '#666',
        },
      }}
    >
      <BrowserRouter>
        <Layout isDark={isDark} onToggleTheme={toggleTheme}>
          <Routes>
            <Route path="/" element={<Format />} />
            <Route path="/converter" element={<Converter />} />
            <Route path="/generator" element={<Generator />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;

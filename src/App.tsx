import './i18n';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Format from './pages/Format';
import Converter from './pages/Converter';
import Generator from './pages/Generator';
import Diff from './pages/Diff';
import Path from './pages/Path';
import Escape from './pages/Escape';
import Mock from './pages/Mock';
import './App.css';
import './styles/design-system.css';

function App() {
  const [isDark, setIsDark] = useState(true);
  const [themeMode, setThemeMode] = useState<'auto' | 'light' | 'dark'>('auto');

  // Check theme preference on mount and listen to system changes
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'auto' | 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'light') {
      setIsDark(false);
      setThemeMode('light');
    } else if (savedTheme === 'dark') {
      setIsDark(true);
      setThemeMode('dark');
    } else {
      // Auto mode - follow system
      setIsDark(prefersDark);
      setThemeMode('auto');
    }

    // Listen to system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (themeMode === 'auto') {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // Handle theme toggle
  const handleToggleTheme = () => {
    // Cycle: auto -> light -> dark -> auto
    if (themeMode === 'auto') {
      setThemeMode('light');
      setIsDark(false);
      localStorage.setItem('theme', 'light');
    } else if (themeMode === 'light') {
      setThemeMode('dark');
      setIsDark(true);
      localStorage.setItem('theme', 'dark');
    } else {
      setThemeMode('auto');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      localStorage.setItem('theme', 'auto');
    }
  };

  const themeConfig = {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#6366f1',
      colorBgContainer: isDark ? '#12121a' : '#ffffff',
      colorBgElevated: isDark ? '#1a1a25' : '#f8f8fa',
      colorBorder: isDark ? '#2a2a4a' : '#e0e0e0',
      colorText: isDark ? '#ffffff' : '#0a0a0f',
      colorTextSecondary: isDark ? '#888' : '#52525b',
      borderRadius: 10,
    },
  };

  return (
    <ConfigProvider theme={themeConfig}>
      <BrowserRouter>
        <Layout isDark={isDark} onToggleTheme={handleToggleTheme} themeMode={themeMode}>
          <Routes>
            <Route path="/" element={<Format />} />
            <Route path="/converter" element={<Converter />} />
            <Route path="/generator" element={<Generator />} />
            <Route path="/diff" element={<Diff />} />
            <Route path="/path" element={<Path />} />
            <Route path="/escape" element={<Escape />} />
            <Route path="/mock" element={<Mock />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;

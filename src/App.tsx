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

    let newIsDark = true;
    let newThemeMode: 'auto' | 'light' | 'dark' = 'auto';

    if (savedTheme === 'light') {
      newIsDark = false;
      newThemeMode = 'light';
    } else if (savedTheme === 'dark') {
      newIsDark = true;
      newThemeMode = 'dark';
    } else {
      // Auto mode - follow system
      newIsDark = prefersDark;
      newThemeMode = 'auto';
    }

    setIsDark(newIsDark);
    setThemeMode(newThemeMode);
    
    // Update data-theme attribute for CSS variables
    document.documentElement.setAttribute('data-theme', newIsDark ? 'dark' : 'light');
  }, []);

  // Listen to system theme changes when in auto mode
  useEffect(() => {
    if (themeMode !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
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
      document.documentElement.setAttribute('data-theme', 'light');
    } else if (themeMode === 'light') {
      setThemeMode('dark');
      setIsDark(true);
      localStorage.setItem('theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      setThemeMode('auto');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      localStorage.setItem('theme', 'auto');
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  };

  const themeConfig = {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#fda4af',
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

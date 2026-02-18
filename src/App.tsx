import './i18n';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import Layout from './components/Layout';
import Format from './pages/Format';
import Converter from './pages/Converter';
import Generator from './pages/Generator';
import Diff from './pages/Diff';
import Path from './pages/Path';
import Escape from './pages/Escape';
import Mock from './pages/Mock';
import './App.css';

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          colorBgContainer: '#16162a',
          colorBgElevated: '#1e1e3a',
          colorBorder: '#2a2a4a',
          colorText: '#fff',
          colorTextSecondary: '#888',
        },
      }}
    >
      <BrowserRouter>
        <Layout>
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

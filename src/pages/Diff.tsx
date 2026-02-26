import React, { useState, useMemo } from 'react';
import { Button, Space, message, Card, Statistic, Row, Col, Tag, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  DiffOutlined,
  SwapOutlined,
  CopyOutlined,
  ClearOutlined,
  PlusOutlined,
  MinusOutlined,
  EditOutlined
} from '@ant-design/icons';
import CodeEditor from '../components/Editor';
import { parseJson } from '../utils/json';
import { useTheme } from '../ThemeContext';
import * as Diff from 'diff';
import styles from './Diff.module.css';

interface DiffResult {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  value: string;
  count?: number;
}

const DiffPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [leftInput, setLeftInput] = useState('');
  const [rightInput, setRightInput] = useState('');
  const [diffResult, setDiffResult] = useState<DiffResult[]>([]);

  const leftStats = useMemo(() => {
    const result = parseJson(leftInput);
    if (!result.success) return { valid: false, size: leftInput.length, lines: leftInput.split('\n').length };
    return {
      valid: true,
      size: leftInput.length,
      lines: leftInput.split('\n').length,
      type: Array.isArray(result.data) ? 'array' : typeof result.data
    };
  }, [leftInput]);

  const rightStats = useMemo(() => {
    const result = parseJson(rightInput);
    if (!result.success) return { valid: false, size: rightInput.length, lines: rightInput.split('\n').length };
    return {
      valid: true,
      size: rightInput.length,
      lines: rightInput.split('\n').length,
      type: Array.isArray(result.data) ? 'array' : typeof result.data
    };
  }, [rightInput]);

  const handleCompare = () => {
    if (!leftInput && !rightInput) {
      message.warning(t('diff.inputRequired'));
      return;
    }

    try {
      // Parse both JSON inputs
      const leftParsed = leftInput ? JSON.parse(leftInput) : null;
      const rightParsed = rightInput ? JSON.parse(rightInput) : null;

      // Convert to formatted strings for diff
      const leftFormatted = JSON.stringify(leftParsed, null, 2);
      const rightFormatted = JSON.stringify(rightParsed, null, 2);

      // Compute diff
      const changes = Diff.diffLines(leftFormatted, rightFormatted);
      const results: DiffResult[] = changes.map(change => ({
        type: change.added ? 'added' : change.removed ? 'removed' : 'unchanged',
        value: change.value,
        count: change.count
      }));

      setDiffResult(results);
      message.success(t('diff.compareSuccess'));
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Unknown error';
      message.error(`${t('diff.compareFailed')}: ${error}`);
    }
  };

  const handleSwap = () => {
    const temp = leftInput;
    setLeftInput(rightInput);
    setRightInput(temp);
    message.success(t('diff.swapped'));
  };

  const handleCopy = () => {
    const text = diffResult.map(d => d.value).join('');
    navigator.clipboard.writeText(text);
    message.success(t('common.copied'));
  };

  const handleClear = () => {
    setLeftInput('');
    setRightInput('');
    setDiffResult([]);
    message.success(t('common.cleared'));
  };

  const handleLoadSample = () => {
    setLeftInput(JSON.stringify({ name: "John", age: 30, city: "New York", skills: ["JS", "React"] }, null, 2));
    setRightInput(JSON.stringify({ name: "John", age: 31, country: "USA", skills: ["JS", "React", "TypeScript"] }, null, 2));
    message.success(t('diff.sampleLoaded'));
  };

  const stats = useMemo(() => {
    const added = diffResult.filter(d => d.type === 'added').reduce((acc, d) => acc + (d.value.split('\n').length - 1), 0);
    const removed = diffResult.filter(d => d.type === 'removed').reduce((acc, d) => acc + (d.value.split('\n').length - 1), 0);
    const modified = diffResult.filter(d => d.type === 'modified').length;
    return { added, removed, modified };
  }, [diffResult]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap>
          <Button
            type="primary"
            icon={<DiffOutlined />}
            onClick={handleCompare}
          >
            {t('diff.compareBtn')}
          </Button>
          <Button
            icon={<SwapOutlined />}
            onClick={handleSwap}
          >
            {t('diff.swapBtn')}
          </Button>
          <Button
            icon={<CopyOutlined />}
            onClick={handleCopy}
            disabled={diffResult.length === 0}
          >
            {t('common.copyResult')}
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={handleClear}
            danger
          >
            {t('common.clear')}
          </Button>
          <Button
            onClick={handleLoadSample}
          >
            {t('diff.loadSample')}
          </Button>
        </Space>
      </div>

      {diffResult.length > 0 && (
        <Card className={styles.stats} size="small">
          <Row gutter={24}>
            <Col span={6}>
              <Statistic
                title={<><PlusOutlined style={{ color: '#52c41a' }} /> {t('diff.added')}</>}
                value={stats.added}
                valueStyle={{ color: '#52c41a' }}
                suffix={t('diff.lines')}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={<><MinusOutlined style={{ color: '#ff4d4f' }} /> {t('diff.removed')}</>}
                value={stats.removed}
                valueStyle={{ color: '#ff4d4f' }}
                suffix={t('diff.lines')}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={<><EditOutlined style={{ color: '#faad14' }} /> {t('diff.modified')}</>}
                value={stats.modified}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={t('diff.totalChanges')}
                value={stats.added + stats.removed + stats.modified}
              />
            </Col>
          </Row>
        </Card>
      )}

      <div className={styles.editors}>
        <div className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <span>{t('diff.leftPanel')}</span>
            <Tag color={leftStats.valid ? 'success' : 'error'}>
              {leftStats.valid ? t('format.stats.valid') : t('format.stats.invalid')}
            </Tag>
          </div>
          <CodeEditor
            value={leftInput}
            onChange={setLeftInput}
            language="json"
            isDark={isDark}
          />
        </div>
        <div className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <span>{t('diff.rightPanel')}</span>
            <Tag color={rightStats.valid ? 'success' : 'error'}>
              {rightStats.valid ? t('format.stats.valid') : t('format.stats.invalid')}
            </Tag>
          </div>
          <CodeEditor
            value={rightInput}
            onChange={setRightInput}
            language="json"
            isDark={isDark}
          />
        </div>
      </div>

      {diffResult.length > 0 && (
        <div className={styles.diffResult}>
          <div className={styles.diffHeader}>
            <span>{t('diff.diffResult')}</span>
            <Tooltip title={t('diff.legendHelp')}>
              <Space>
                <Tag color="success"><PlusOutlined /> {t('diff.added')}</Tag>
                <Tag color="error"><MinusOutlined /> {t('diff.removed')}</Tag>
                <Tag><span style={{ opacity: 0.5 }}>{t('diff.unchanged')}</span></Tag>
              </Space>
            </Tooltip>
          </div>
          <div className={styles.diffContent}>
            <pre>
              {diffResult.map((diff, index) => (
                <div
                  key={index}
                  className={`${styles.diffLine} ${styles[diff.type]}`}
                >
                  {diff.value.split('\n').map((line, lineIndex) => (
                    line && <div key={lineIndex} className={styles.line}>
                      <span className={styles.linePrefix}>
                        {diff.type === 'added' ? '+' : diff.type === 'removed' ? '-' : ' '}
                      </span>
                      <span className={styles.lineContent}>{line}</span>
                    </div>
                  ))}
                </div>
              ))}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiffPage;

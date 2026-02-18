import React, { useState, useMemo } from 'react';
import { Button, Space, message, Card, Input, Select, Tag, Alert, Collapse, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  SearchOutlined,
  CopyOutlined,
  ClearOutlined,
  BulbOutlined,
  BookOutlined
} from '@ant-design/icons';
import CodeEditor from '../components/Editor';
import { parseJson } from '../utils/json';
import { JSONPath } from 'jsonpath-plus';
import styles from './Path.module.css';

const { Text } = Typography;
const { Panel } = Collapse;

const EXAMPLE_PATHS = [
  { label: '$', desc: 'Root object' },
  { label: '$.store', desc: 'Store property' },
  { label: '$.store.book[*]', desc: 'All books' },
  { label: '$.store.book[*].author', desc: 'All authors' },
  { label: '$..author', desc: 'All authors (recursive)' },
  { label: '$.store.book[-1:]', desc: 'Last book' },
  { label: '$.store.book[0,1]', desc: 'First two books' },
  { label: '$.store.book[?(@.price<10)]', desc: 'Books cheaper than 10' },
  { label: '$.store.book[?(@.category=="fiction")]', desc: 'Fiction books' },
  { label: '$..*', desc: 'All values (recursive)' },
];

const SAMPLE_JSON = {
  store: {
    book: [
      { category: "reference", author: "Nigel Rees", title: "Sayings of the Century", price: 8.95 },
      { category: "fiction", author: "Evelyn Waugh", title: "Sword of Honour", price: 12.99 },
      { category: "fiction", author: "Herman Melville", title: "Moby Dick", isbn: "0-553-21311-3", price: 8.99 },
      { category: "fiction", author: "J. R. R. Tolkien", title: "The Lord of the Rings", isbn: "0-395-19395-8", price: 22.99 }
    ],
    bicycle: { color: "red", price: 19.95 }
  },
  expensive: 10
};

const PathPage: React.FC = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState(JSON.stringify(SAMPLE_JSON, null, 2));
  const [pathExpr, setPathExpr] = useState('$');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const jsonValid = useMemo(() => {
    const parsed = parseJson(input);
    return parsed.success;
  }, [input]);

  const handleQuery = () => {
    setError('');
    if (!input.trim()) {
      setError(t('path.inputRequired'));
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const queryResult = JSONPath({
        path: pathExpr,
        json: parsed,
        wrap: true
      });

      setResult(JSON.stringify(queryResult, null, 2));
      message.success(t('path.querySuccess'));
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      setError(`${t('path.queryFailed')}: ${errorMsg}`);
      setResult('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    message.success(t('common.copied'));
  };

  const handleClear = () => {
    setInput('');
    setPathExpr('$');
    setResult('');
    setError('');
    message.success(t('common.cleared'));
  };

  const handleLoadSample = () => {
    setInput(JSON.stringify(SAMPLE_JSON, null, 2));
    message.success(t('path.sampleLoaded'));
  };

  const handleSelectExample = (value: string) => {
    setPathExpr(value);
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleQuery}
          >
            {t('path.queryBtn')}
          </Button>
          <Button
            icon={<CopyOutlined />}
            onClick={handleCopy}
            disabled={!result}
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
            icon={<BulbOutlined />}
            onClick={handleLoadSample}
          >
            {t('path.loadSample')}
          </Button>
        </Space>
      </div>

      <Card className={styles.pathCard} size="small">
        <div className={styles.pathInput}>
          <Text strong className={styles.label}>{t('path.expressionLabel')}</Text>
          <div className={styles.inputRow}>
            <Input
              value={pathExpr}
              onChange={(e) => setPathExpr(e.target.value)}
              placeholder="$.store.book[*]"
              className={styles.pathInputField}
              onPressEnter={handleQuery}
            />
            <Select
              placeholder={t('path.examples')}
              onChange={handleSelectExample}
              style={{ minWidth: 200 }}
              dropdownMatchSelectWidth={300}
            >
              {EXAMPLE_PATHS.map((ex, i) => (
                <Select.Option key={i} value={ex.label}>
                  <div className={styles.exampleOption}>
                    <code>{ex.label}</code>
                    <span className={styles.exampleDesc}>{ex.desc}</span>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {error && (
        <Alert
          message={t('path.queryError')}
          description={error}
          type="error"
          showIcon
          className={styles.alert}
        />
      )}

      <div className={styles.editors}>
        <div className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <span>{t('common.input')}</span>
            <Tag color={jsonValid ? 'success' : 'error'}>
              {jsonValid ? t('format.stats.valid') : t('format.stats.invalid')}
            </Tag>
          </div>
          <CodeEditor
            value={input}
            onChange={setInput}
            language="json"
          />
        </div>
        <div className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <span>{t('path.queryResult')}</span>
            {result && (
              <Tag color="processing">
                {t('path.resultCount')}: {JSON.parse(result).length}
              </Tag>
            )}
          </div>
          <CodeEditor
            value={result}
            language="json"
            readOnly
          />
        </div>
      </div>

      <Collapse className={styles.helpCollapse} defaultActiveKey={[]}>
        <Panel
          header={<><BookOutlined /> {t('path.syntaxHelp')}</>}
          key="1"
        >
          <div className={styles.syntaxHelp}>
            <div className={styles.syntaxRow}>
              <code>$</code>
              <span>{t('path.syntax.root')}</span>
            </div>
            <div className={styles.syntaxRow}>
              <code>$.property</code>
              <span>{t('path.syntax.property')}</span>
            </div>
            <div className={styles.syntaxRow}>
              <code>$['property']</code>
              <span>{t('path.syntax.bracket')}</span>
            </div>
            <div className={styles.syntaxRow}>
              <code>$[0]</code>
              <span>{t('path.syntax.index')}</span>
            </div>
            <div className={styles.syntaxRow}>
              <code>$[*]</code>
              <span>{t('path.syntax.wildcard')}</span>
            </div>
            <div className={styles.syntaxRow}>
              <code>$..property</code>
              <span>{t('path.syntax.recursive')}</span>
            </div>
            <div className={styles.syntaxRow}>
              <code>$[start:end]</code>
              <span>{t('path.syntax.slice')}</span>
            </div>
            <div className={styles.syntaxRow}>
              <code>$[?(expression)]</code>
              <span>{t('path.syntax.filter')}</span>
            </div>
          </div>
        </Panel>
      </Collapse>
    </div>
  );
};

export default PathPage;

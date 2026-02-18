import React, { useState, useMemo } from 'react';
import { Button, Space, message, Statistic, Row, Col, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  FormatPainterOutlined,
  CompressOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  ClearOutlined
} from '@ant-design/icons';
import CodeEditor from '../components/Editor';
import { formatJson, minifyJson, validateJson, getJsonStats } from '../utils/json';
import styles from './Format.module.css';

const Format: React.FC = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const stats = useMemo(() => getJsonStats(input), [input]);

  const handleFormat = () => {
    const result = formatJson(input);
    if (result.success) {
      setOutput(result.data as string);
      message.success(t('format.formatSuccess'));
    } else {
      message.error(`${t('format.formatFailed')}: ${result.error}`);
    }
  };

  const handleMinify = () => {
    const result = minifyJson(input);
    if (result.success) {
      setOutput(result.data as string);
      message.success(t('format.minifySuccess'));
    } else {
      message.error(`${t('format.minifyFailed')}: ${result.error}`);
    }
  };

  const handleValidate = () => {
    const result = validateJson(input);
    if (result.valid) {
      message.success(t('format.validJson'));
    } else {
      message.error(`${t('format.invalidJson')}: ${result.error}`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    message.success(t('common.copied'));
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    message.success(t('common.cleared'));
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space>
          <Button
            type="primary"
            icon={<FormatPainterOutlined />}
            onClick={handleFormat}
            className={styles.btnPrimary}
          >
            {t('format.formatBtn')}
          </Button>
          <Button
            icon={<CompressOutlined />}
            onClick={handleMinify}
            className={styles.btnSecondary}
          >
            {t('format.minifyBtn')}
          </Button>
          <Button
            icon={<CheckCircleOutlined />}
            onClick={handleValidate}
            className={styles.btnSecondary}
          >
            {t('format.validateBtn')}
          </Button>
          <Button
            icon={<CopyOutlined />}
            onClick={handleCopy}
            disabled={!output}
            className={styles.btnSecondary}
          >
            {t('common.copyResult')}
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={handleClear}
            danger
            className={styles.btnSecondary}
          >
            {t('common.clear')}
          </Button>
        </Space>
      </div>

      {input && (
        <div className={styles.stats}>
          <Row gutter={24}>
            <Col span={4}>
              <Statistic
                title={t('format.stats.status')}
                value={stats.valid ? t('format.stats.valid') : t('format.stats.invalid')}
                valueStyle={{ color: stats.valid ? '#52c41a' : '#ff4d4f' }}
              />
            </Col>
            <Col span={4}>
              <Statistic title={t('format.stats.size')} value={stats.size} suffix="bytes" />
            </Col>
            <Col span={4}>
              <Statistic title={t('format.stats.lines')} value={stats.lines} />
            </Col>
            {stats.type && (
              <Col span={4}>
                <Statistic title={t('format.stats.type')} value={stats.type} />
              </Col>
            )}
            {stats.keys !== undefined && (
              <Col span={4}>
                <Statistic title={t('format.stats.keys')} value={stats.keys} />
              </Col>
            )}
            {stats.items !== undefined && (
              <Col span={4}>
                <Statistic title={t('format.stats.items')} value={stats.items} />
              </Col>
            )}
          </Row>
        </div>
      )}

      {!stats.valid && input && (
        <Alert
          message={t('format.jsonError')}
          description={stats.valid ? undefined : t('format.checkFormat')}
          type="error"
          showIcon
          className={styles.alert}
        />
      )}

      <div className={styles.editors}>
        <div className={styles.editorPanel}>
          <CodeEditor
            value={input}
            onChange={setInput}
            language="json"
            title={t('common.input')}
          />
        </div>
        <div className={styles.editorPanel}>
          <CodeEditor
            value={output}
            language="json"
            readOnly
            title={t('common.outputResult')}
          />
        </div>
      </div>
    </div>
  );
};

export default Format;

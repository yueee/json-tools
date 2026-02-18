import React, { useState } from 'react';
import { Button, Space, message, Card, Radio, Input, Typography, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CopyOutlined,
  ClearOutlined,
  SwapOutlined
} from '@ant-design/icons';
import CodeEditor from '../components/Editor';
import styles from './Escape.module.css';

const { Text } = Typography;

type EscapeMode = 'json' | 'unicode' | 'base64';

const EscapePage: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<EscapeMode>('json');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isEscape, setIsEscape] = useState(true);

  const escapeJson = (str: string): string => {
    return JSON.stringify(str);
  };

  const unescapeJson = (str: string): string => {
    try {
      return JSON.parse(str);
    } catch {
      throw new Error(t('escape.invalidJsonString'));
    }
  };

  const escapeUnicode = (str: string): string => {
    return str.split('').map(char => {
      const code = char.charCodeAt(0);
      if (code > 127) {
        return '\\u' + code.toString(16).padStart(4, '0');
      }
      return char;
    }).join('');
  };

  const unescapeUnicode = (str: string): string => {
    return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
  };

  const escapeBase64 = (str: string): string => {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch {
      throw new Error(t('escape.base64EncodeError'));
    }
  };

  const unescapeBase64 = (str: string): string => {
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch {
      throw new Error(t('escape.base64DecodeError'));
    }
  };

  const handleConvert = () => {
    if (!input.trim()) {
      message.warning(t('escape.inputRequired'));
      return;
    }

    try {
      let result: string;

      if (isEscape) {
        switch (mode) {
          case 'json':
            result = escapeJson(input);
            break;
          case 'unicode':
            result = escapeUnicode(input);
            break;
          case 'base64':
            result = escapeBase64(input);
            break;
        }
      } else {
        switch (mode) {
          case 'json':
            result = unescapeJson(input);
            break;
          case 'unicode':
            result = unescapeUnicode(input);
            break;
          case 'base64':
            result = unescapeBase64(input);
            break;
        }
      }

      setOutput(result);
      message.success(t('escape.convertSuccess'));
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Unknown error';
      message.error(`${t('escape.convertFailed')}: ${error}`);
    }
  };

  const handleSwap = () => {
    const temp = input;
    setInput(output);
    setOutput(temp);
    setIsEscape(!isEscape);
    message.success(t('escape.swapped'));
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

  const handleModeChange = (newMode: EscapeMode) => {
    setMode(newMode);
    setOutput('');
  };

  const modeDescriptions: Record<EscapeMode, { escape: string; unescape: string }> = {
    json: {
      escape: t('escape.jsonEscape'),
      unescape: t('escape.jsonUnescape')
    },
    unicode: {
      escape: t('escape.unicodeEncode'),
      unescape: t('escape.unicodeDecode')
    },
    base64: {
      escape: t('escape.base64Encode'),
      unescape: t('escape.base64Decode')
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap>
          <Button
            type="primary"
            icon={isEscape ? <ArrowRightOutlined /> : <ArrowLeftOutlined />}
            onClick={handleConvert}
          >
            {isEscape ? modeDescriptions[mode].escape : modeDescriptions[mode].unescape}
          </Button>
          <Button
            icon={<SwapOutlined />}
            onClick={handleSwap}
            disabled={!output}
          >
            {t('escape.swapBtn')}
          </Button>
          <Button
            icon={<CopyOutlined />}
            onClick={handleCopy}
            disabled={!output}
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
        </Space>
      </div>

      <Card className={styles.modeCard} size="small">
        <div className={styles.modeRow}>
          <Text strong className={styles.modeLabel}>{t('escape.modeLabel')}</Text>
          <Radio.Group value={mode} onChange={(e) => handleModeChange(e.target.value)} buttonStyle="solid">
            <Radio.Button value="json">JSON</Radio.Button>
            <Radio.Button value="unicode">Unicode</Radio.Button>
            <Radio.Button value="base64">Base64</Radio.Button>
          </Radio.Group>
          <div className={styles.modeDescription}>
            {mode === 'json' && t('escape.jsonDesc')}
            {mode === 'unicode' && t('escape.unicodeDesc')}
            {mode === 'base64' && t('escape.base64Desc')}
          </div>
        </div>
      </Card>

      <div className={styles.editors}>
        <div className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <span>{isEscape ? t('escape.original') : t('escape.encoded')}</span>
          </div>
          <CodeEditor
            value={input}
            onChange={setInput}
            language={mode === 'json' ? 'json' : 'plaintext'}
          />
        </div>
        <div className={styles.arrowContainer}>
          <div className={styles.arrow}>
            {isEscape ? <ArrowRightOutlined /> : <ArrowLeftOutlined />}
          </div>
        </div>
        <div className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <span>{isEscape ? t('escape.encoded') : t('escape.original')}</span>
          </div>
          <CodeEditor
            value={output}
            language={mode === 'json' ? 'json' : 'plaintext'}
            readOnly
          />
        </div>
      </div>

      <div className={styles.quickActions}>
        <Card size="small" title={t('escape.quickExamples')}>
          <Tabs defaultActiveKey="json">
            <Tabs.TabPane tab="JSON" key="json">
              <div className={styles.examples}>
                <div className={styles.example}>
                  <Text code>{`{"name":"测试"}`}</Text>
                  <span>→</span>
                  <Text code type="secondary">{`"{\\"name\\":\\"测试\\"}"`}</Text>
                </div>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Unicode" key="unicode">
              <div className={styles.examples}>
                <div className={styles.example}>
                  <Text code>你好世界</Text>
                  <span>→</span>
                  <Text code type="secondary">\u4f60\u597d\u4e16\u754c</Text>
                </div>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Base64" key="base64">
              <div className={styles.examples}>
                <div className={styles.example}>
                  <Text code>Hello World</Text>
                  <span>→</span>
                  <Text code type="secondary">SGVsbG8gV29ybGQ=</Text>
                </div>
              </div>
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default EscapePage;

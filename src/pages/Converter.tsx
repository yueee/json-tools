import React, { useState } from 'react';
import { Button, Space, message, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { SwapOutlined, CopyOutlined } from '@ant-design/icons';
import CodeEditor from '../components/Editor';
import { jsonToYaml, jsonToXml, jsonToUrlParams } from '../utils/converters';
import type { ConverterFormat } from '../utils/converters';
import { useTheme } from '../ThemeContext';
import styles from './Converter.module.css';

const Converter: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [format, setFormat] = useState<ConverterFormat | 'urlparams'>('yaml');
  
  const converterOptions = [
    { label: t('converter.jsonToYaml'), value: 'yaml' },
    { label: t('converter.jsonToXml'), value: 'xml' },
    { label: t('converter.jsonToUrlParams'), value: 'urlparams' },
  ];
  
  const handleConvert = () => {
    let result;
    switch (format) {
      case 'yaml':
        result = jsonToYaml(input);
        break;
      case 'xml':
        result = jsonToXml(input);
        break;
      case 'urlparams':
        result = jsonToUrlParams(input);
        break;
      default:
        result = { success: false, error: 'Unknown format' };
    }
    
    if (result.success) {
      setOutput(result.data as string);
      message.success(t('converter.convertSuccess'));
    } else {
      message.error(`${t('converter.convertFailed')}: ${result.error}`);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    message.success(t('common.copied'));
  };
  
  const getOutputLanguage = (): string => {
    switch (format) {
      case 'yaml':
        return 'yaml';
      case 'xml':
        return 'xml';
      case 'urlparams':
        return 'plaintext';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space>
          <Select
            value={format}
            onChange={setFormat}
            options={converterOptions}
            style={{ width: 180 }}
          />
          <Button 
            type="primary" 
            icon={<SwapOutlined />}
            onClick={handleConvert}
          >
            {t('converter.convertBtn')}
          </Button>
          <Button 
            icon={<CopyOutlined />}
            onClick={handleCopy}
            disabled={!output}
          >
            {t('common.copyResult')}
          </Button>
        </Space>
      </div>
      
      <div className={styles.editors}>
        <div className={styles.editorPanel}>
          <CodeEditor
            value={input}
            onChange={setInput}
            language="json"
            title={t('common.input')}
            isDark={isDark}
          />
        </div>
        <div className={styles.editorPanel}>
          <CodeEditor
            value={output}
            language={getOutputLanguage()}
            readOnly
            title={t('converter.outputCode')}
            isDark={isDark}
          />
        </div>
      </div>
    </div>
  );
};

export default Converter;

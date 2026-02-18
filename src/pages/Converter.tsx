import React, { useState } from 'react';
import { Button, Space, message, Select } from 'antd';
import { SwapOutlined, CopyOutlined } from '@ant-design/icons';
import CodeEditor from '../components/Editor';
import { jsonToYaml, jsonToXml, jsonToUrlParams } from '../utils/converters';
import type { ConverterFormat } from '../utils/converters';
import styles from './Converter.module.css';

const converterOptions = [
  { label: 'JSON → YAML', value: 'yaml' },
  { label: 'JSON → XML', value: 'xml' },
  { label: 'JSON → URL Params', value: 'urlparams' },
];

const Converter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [format, setFormat] = useState<ConverterFormat | 'urlparams'>('yaml');
  
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
      message.success('转换成功');
    } else {
      message.error(`转换失败: ${result.error}`);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    message.success('已复制到剪贴板');
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
            转换
          </Button>
          <Button 
            icon={<CopyOutlined />}
            onClick={handleCopy}
            disabled={!output}
          >
            复制结果
          </Button>
        </Space>
      </div>
      
      <div className={styles.editors}>
        <div className={styles.editorPanel}>
          <CodeEditor 
            value={input}
            onChange={setInput}
            language="json"
            title="输入 JSON"
          />
        </div>
        <div className={styles.editorPanel}>
          <CodeEditor 
            value={output}
            language={getOutputLanguage()}
            readOnly
            title="输出结果"
          />
        </div>
      </div>
    </div>
  );
};

export default Converter;

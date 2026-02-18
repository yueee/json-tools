import React, { useState } from 'react';
import { Button, Space, message, Select, Input } from 'antd';
import { CodeOutlined, CopyOutlined } from '@ant-design/icons';
import CodeEditor from '../components/Editor';
import { 
  generateTypeScript, 
  generateGo, 
  generatePython, 
  generateJava,
  generateCSharp
} from '../utils/generators';
import type { GeneratorLanguage } from '../utils/generators';
import styles from './Generator.module.css';

const generatorOptions = [
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Go', value: 'go' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C#', value: 'csharp' },
];

const languageMap: Record<GeneratorLanguage, string> = {
  typescript: 'typescript',
  go: 'go',
  python: 'python',
  java: 'java',
  csharp: 'csharp',
};

const Generator: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState<GeneratorLanguage>('typescript');
  const [rootName, setRootName] = useState('RootObject');
  
  const handleGenerate = () => {
    let result;
    const options = { rootName };
    
    switch (language) {
      case 'typescript':
        result = generateTypeScript(input, options);
        break;
      case 'go':
        result = generateGo(input, options);
        break;
      case 'python':
        result = generatePython(input, options);
        break;
      case 'java':
        result = generateJava(input, options);
        break;
      case 'csharp':
        result = generateCSharp(input, options);
        break;
      default:
        result = { success: false, error: 'Unknown language' };
    }
    
    if (result.success) {
      setOutput(result.data as string);
      message.success('生成成功');
    } else {
      message.error(`生成失败: ${result.error}`);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    message.success('已复制到剪贴板');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space>
          <Select
            value={language}
            onChange={setLanguage}
            options={generatorOptions}
            style={{ width: 140 }}
          />
          <Input
            placeholder="类名/类型名"
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            style={{ width: 150 }}
          />
          <Button 
            type="primary" 
            icon={<CodeOutlined />}
            onClick={handleGenerate}
          >
            生成代码
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
            language={languageMap[language]}
            readOnly
            title="输出代码"
          />
        </div>
      </div>
    </div>
  );
};

export default Generator;

import React from 'react';
import Editor from '@monaco-editor/react';
import { Spin } from 'antd';
import styles from './Editor.module.css';

interface EditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  title?: string;
}

const CodeEditor: React.FC<EditorProps> = ({
  value,
  onChange,
  language = 'json',
  readOnly = false,
  title,
}) => {
  return (
    <div className={styles.container}>
      {title && <div className={styles.title}>{title}</div>}
      <div className={styles.editorWrapper}>
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={(v) => onChange?.(v || '')}
          theme="vs-dark"
          loading={<Spin tip="Loading editor..." />}
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 10 },
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;

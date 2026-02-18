import React, { useState, useMemo } from 'react';
import { Button, Space, message, Card, Statistic, Row, Col, Alert } from 'antd';
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
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  
  const stats = useMemo(() => getJsonStats(input), [input]);
  
  const handleFormat = () => {
    const result = formatJson(input);
    if (result.success) {
      setOutput(result.data as string);
      message.success('格式化成功');
    } else {
      message.error(`格式化失败: ${result.error}`);
    }
  };
  
  const handleMinify = () => {
    const result = minifyJson(input);
    if (result.success) {
      setOutput(result.data as string);
      message.success('压缩成功');
    } else {
      message.error(`压缩失败: ${result.error}`);
    }
  };
  
  const handleValidate = () => {
    const result = validateJson(input);
    if (result.valid) {
      message.success('JSON 格式有效');
    } else {
      message.error(`JSON 格式无效: ${result.error}`);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    message.success('已复制到剪贴板');
  };
  
  const handleClear = () => {
    setInput('');
    setOutput('');
    message.success('已清空');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space>
          <Button 
            type="primary" 
            icon={<FormatPainterOutlined />}
            onClick={handleFormat}
          >
            格式化
          </Button>
          <Button 
            icon={<CompressOutlined />}
            onClick={handleMinify}
          >
            压缩
          </Button>
          <Button 
            icon={<CheckCircleOutlined />}
            onClick={handleValidate}
          >
            验证
          </Button>
          <Button 
            icon={<CopyOutlined />}
            onClick={handleCopy}
            disabled={!output}
          >
            复制结果
          </Button>
          <Button 
            icon={<ClearOutlined />}
            onClick={handleClear}
            danger
          >
            清空
          </Button>
        </Space>
      </div>
      
      {input && (
        <Card className={styles.stats} size="small">
          <Row gutter={24}>
            <Col span={4}>
              <Statistic 
                title="状态" 
                value={stats.valid ? '有效' : '无效'} 
                valueStyle={{ color: stats.valid ? '#52c41a' : '#ff4d4f' }}
              />
            </Col>
            <Col span={4}>
              <Statistic title="大小" value={stats.size} suffix="bytes" />
            </Col>
            <Col span={4}>
              <Statistic title="行数" value={stats.lines} />
            </Col>
            {stats.type && (
              <Col span={4}>
                <Statistic title="类型" value={stats.type} />
              </Col>
            )}
            {stats.keys !== undefined && (
              <Col span={4}>
                <Statistic title="键数" value={stats.keys} />
              </Col>
            )}
            {stats.items !== undefined && (
              <Col span={4}>
                <Statistic title="元素数" value={stats.items} />
              </Col>
            )}
          </Row>
        </Card>
      )}
      
      {!stats.valid && input && (
        <Alert 
          message="JSON 格式错误" 
          description={stats.valid ? undefined : '请检查输入的 JSON 格式'}
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
            title="输入 JSON"
          />
        </div>
        <div className={styles.editorPanel}>
          <CodeEditor 
            value={output}
            language="json"
            readOnly
            title="输出结果"
          />
        </div>
      </div>
    </div>
  );
};

export default Format;

import React, { useState } from 'react';
import { Button, Space, message, Card, Select, InputNumber, Switch, Row, Col, Tag, Collapse, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  ThunderboltOutlined,
  CopyOutlined,
  ClearOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import CodeEditor from '../components/Editor';
import { useTheme } from '../ThemeContext';
import styles from './Mock.module.css';

const { Panel } = Collapse;

interface FieldConfig {
  key: string;
  name: string;
  type: string;
  options?: string;
}

const FIELD_TYPES = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'email', label: 'Email' },
  { value: 'name', label: 'Name' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'phone', label: 'Phone' },
  { value: 'address', label: 'Address' },
  { value: 'city', label: 'City' },
  { value: 'country', label: 'Country' },
  { value: 'company', label: 'Company' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'DateTime' },
  { value: 'uuid', label: 'UUID' },
  { value: 'url', label: 'URL' },
  { value: 'ip', label: 'IP Address' },
  { value: 'color', label: 'Color' },
  { value: 'id', label: 'ID' },
  { value: 'price', label: 'Price' },
  { value: 'sentence', label: 'Sentence' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'array', label: 'Array' },
];

// Random data generators
const generators: Record<string, () => unknown> = {
  string: () => {
    const words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit'];
    return words[Math.floor(Math.random() * words.length)];
  },
  number: () => Math.floor(Math.random() * 1000),
  boolean: () => Math.random() > 0.5,
  email: () => {
    const names = ['john', 'jane', 'bob', 'alice', 'mike'];
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'example.com'];
    return `${names[Math.floor(Math.random() * names.length)]}${Math.floor(Math.random() * 100)}@${domains[Math.floor(Math.random() * domains.length)]}`;
  },
  name: () => {
    const first = ['John', 'Jane', 'Bob', 'Alice', 'Mike', 'Sarah', 'Tom', 'Emily'];
    const last = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`;
  },
  firstName: () => {
    const names = ['John', 'Jane', 'Bob', 'Alice', 'Mike', 'Sarah', 'Tom', 'Emily', 'David', 'Lisa'];
    return names[Math.floor(Math.random() * names.length)];
  },
  lastName: () => {
    const names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore'];
    return names[Math.floor(Math.random() * names.length)];
  },
  phone: () => {
    const area = Math.floor(Math.random() * 900) + 100;
    const exchange = Math.floor(Math.random() * 900) + 100;
    const subscriber = Math.floor(Math.random() * 9000) + 1000;
    return `${area}-${exchange}-${subscriber}`;
  },
  address: () => {
    const num = Math.floor(Math.random() * 9999) + 1;
    const streets = ['Main St', 'Oak Ave', 'Pine Rd', 'Maple Dr', 'Cedar Ln', 'Elm Way'];
    return `${num} ${streets[Math.floor(Math.random() * streets.length)]}`;
  },
  city: () => {
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];
    return cities[Math.floor(Math.random() * cities.length)];
  },
  country: () => {
    const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Japan', 'China'];
    return countries[Math.floor(Math.random() * countries.length)];
  },
  company: () => {
    const companies = ['Acme Corp', 'Tech Solutions', 'Global Industries', 'Digital Dynamics', 'Innovative Systems', 'Future Tech'];
    return companies[Math.floor(Math.random() * companies.length)];
  },
  date: () => {
    const start = new Date(2020, 0, 1);
    const end = new Date();
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
  },
  datetime: () => {
    const start = new Date(2020, 0, 1);
    const end = new Date();
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString();
  },
  uuid: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
  url: () => {
    const domains = ['example.com', 'test.org', 'sample.net', 'demo.io'];
    const paths = ['', '/api', '/users', '/products', '/data'];
    return `https://${domains[Math.floor(Math.random() * domains.length)]}${paths[Math.floor(Math.random() * paths.length)]}`;
  },
  ip: () => {
    return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  },
  color: () => {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  },
  id: () => Math.floor(Math.random() * 100000),
  price: () => parseFloat((Math.random() * 1000).toFixed(2)),
  sentence: () => {
    const sentences = [
      'The quick brown fox jumps over the lazy dog.',
      'A journey of a thousand miles begins with a single step.',
      'To be or not to be, that is the question.',
      'All that glitters is not gold.',
      'The early bird catches the worm.'
    ];
    return sentences[Math.floor(Math.random() * sentences.length)];
  },
  paragraph: () => {
    const paragraphs = [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
    ];
    return paragraphs[Math.floor(Math.random() * paragraphs.length)];
  },
  array: () => {
    const items = ['item1', 'item2', 'item3'];
    return items.slice(0, Math.floor(Math.random() * 3) + 1);
  },
};

const MockPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [fields, setFields] = useState<FieldConfig[]>([
    { key: '1', name: 'id', type: 'id' },
    { key: '2', name: 'name', type: 'name' },
    { key: '3', name: 'email', type: 'email' },
  ]);
  const [count, setCount] = useState(5);
  const [wrapInArray, setWrapInArray] = useState(true);
  const [output, setOutput] = useState('');

  const generateValue = (type: string, options?: string): unknown => {
    if (type === 'number' && options) {
      const [min, max] = options.split(',').map(Number);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    if (type === 'string' && options) {
      const values = options.split(',').map(s => s.trim());
      return values[Math.floor(Math.random() * values.length)];
    }
    const generator = generators[type];
    return generator ? generator() : null;
  };

  const generateMockData = () => {
    if (fields.length === 0) {
      message.warning(t('mock.noFields'));
      return;
    }

    try {
      const generateObject = (): Record<string, unknown> => {
        const obj: Record<string, unknown> = {};
        fields.forEach(field => {
          if (field.name.trim()) {
            obj[field.name] = generateValue(field.type, field.options);
          }
        });
        return obj;
      };

      let result: unknown;
      if (wrapInArray) {
        result = Array.from({ length: count }, generateObject);
      } else {
        result = generateObject();
      }

      setOutput(JSON.stringify(result, null, 2));
      message.success(t('mock.generateSuccess'));
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Unknown error';
      message.error(`${t('mock.generateFailed')}: ${error}`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    message.success(t('common.copied'));
  };

  const handleClear = () => {
    setFields([]);
    setOutput('');
    message.success(t('common.cleared'));
  };

  const addField = () => {
    const newKey = String(Date.now());
    setFields([...fields, { key: newKey, name: '', type: 'string' }]);
  };

  const removeField = (key: string) => {
    setFields(fields.filter(f => f.key !== key));
  };

  const updateField = (key: string, updates: Partial<FieldConfig>) => {
    setFields(fields.map(f => f.key === key ? { ...f, ...updates } : f));
  };

  const loadTemplate = (template: 'user' | 'product' | 'order') => {
    const templates: Record<string, FieldConfig[]> = {
      user: [
        { key: '1', name: 'id', type: 'id' },
        { key: '2', name: 'name', type: 'name' },
        { key: '3', name: 'email', type: 'email' },
        { key: '4', name: 'phone', type: 'phone' },
        { key: '5', name: 'address', type: 'address' },
      ],
      product: [
        { key: '1', name: 'id', type: 'id' },
        { key: '2', name: 'name', type: 'string', options: 'Product A, Product B, Product C' },
        { key: '3', name: 'price', type: 'price' },
        { key: '4', name: 'category', type: 'string', options: 'Electronics, Clothing, Books' },
        { key: '5', name: 'inStock', type: 'boolean' },
      ],
      order: [
        { key: '1', name: 'orderId', type: 'uuid' },
        { key: '2', name: 'customerId', type: 'id' },
        { key: '3', name: 'total', type: 'price' },
        { key: '4', name: 'status', type: 'string', options: 'pending, processing, shipped, delivered' },
        { key: '5', name: 'createdAt', type: 'datetime' },
      ],
    };
    setFields(templates[template]);
    message.success(t('mock.templateLoaded'));
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={generateMockData}
          >
            {t('mock.generateBtn')}
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

      <div className={styles.mainContent}>
        <div className={styles.configPanel}>
          <Card
            className={styles.configCard}
            title={t('mock.fieldConfig')}
            extra={
              <Button type="link" icon={<PlusOutlined />} onClick={addField}>
                {t('mock.addField')}
              </Button>
            }
          >
            <div className={styles.settings}>
              <Row gutter={16}>
                <Col span={8}>
                  <div className={styles.settingItem}>
                    <span>{t('mock.countLabel')}</span>
                    <InputNumber
                      min={1}
                      max={100}
                      value={count}
                      onChange={(v) => setCount(v || 1)}
                    />
                  </div>
                </Col>
                <Col span={8}>
                  <div className={styles.settingItem}>
                    <span>{t('mock.wrapArray')}</span>
                    <Switch checked={wrapInArray} onChange={setWrapInArray} />
                  </div>
                </Col>
              </Row>
            </div>

            <div className={styles.fieldList}>
              {fields.map((field) => (
                <div key={field.key} className={styles.fieldRow}>
                  <Input
                    placeholder={t('mock.fieldName')}
                    value={field.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField(field.key, { name: e.target.value })}
                    className={styles.fieldName}
                  />
                  <Select
                    value={field.type}
                    onChange={(v: string) => updateField(field.key, { type: v })}
                    className={styles.fieldType}
                    options={FIELD_TYPES}
                  />
                  <Input
                    placeholder={t('mock.optionsPlaceholder')}
                    value={field.options}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField(field.key, { options: e.target.value })}
                    className={styles.fieldOptions}
                  />
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => removeField(field.key)}
                  />
                </div>
              ))}
            </div>

            <Collapse className={styles.templatesCollapse} ghost>
              <Panel header={t('mock.templates')} key="1">
                <Space wrap>
                  <Button size="small" onClick={() => loadTemplate('user')}>
                    {t('mock.userTemplate')}
                  </Button>
                  <Button size="small" onClick={() => loadTemplate('product')}>
                    {t('mock.productTemplate')}
                  </Button>
                  <Button size="small" onClick={() => loadTemplate('order')}>
                    {t('mock.orderTemplate')}
                  </Button>
                </Space>
              </Panel>
            </Collapse>
          </Card>
        </div>

        <div className={styles.outputPanel}>
          <div className={styles.editorHeader}>
            <span>{t('mock.outputLabel')}</span>
            {output && (
              <Tag color="processing">
                {wrapInArray ? `${count} ${t('mock.items')}` : '1 object'}
              </Tag>
            )}
          </div>
          <CodeEditor
            value={output}
            language="json"
            readOnly
            isDark={isDark}
          />
        </div>
      </div>
    </div>
  );
};

export default MockPage;

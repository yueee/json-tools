/**
 * JSON to TOML Converter (双向转换)
 * 纯前端实现，支持中文字符和嵌套结构
 */

/**
 * TOML 键转义
 */
function tomlEscapeKey(key: string): string {
  // 如果键只包含字母、数字、下划线和连字符，不需要引号
  if (/^[a-zA-Z0-9_-]+$/.test(key)) {
    return key;
  }
  // 否则需要用引号包裹
  return `"${key.replace(/"/g, '\\"')}"`;
}

/**
 * TOML 字符串转义
 */
function tomlEscapeString(str: string): string {
  // 检查是否包含特殊字符
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(str)) {
    // 需要使用基本字符串并转义
    return `"${str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
    }"`;
  }

  // 如果包含换行，使用多行字符串
  if (str.includes('\n')) {
    return `"""
${str}"""`;
  }

  // 简单字符串
  return `"${str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
  }"`;
}

/**
 * 将值转换为 TOML 格式
 */
function toTomlValue(value: unknown, indent: number = 0): string {
  const spaces = '  '.repeat(indent);

  if (value === null || value === undefined) {
    return '""';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      return '"nan"';
    }
    if (!Number.isFinite(value)) {
      return value > 0 ? '"inf"' : '"-inf"';
    }
    return String(value);
  }

  if (typeof value === 'string') {
    return tomlEscapeString(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }

    // 检查是否是简单数组（所有元素都是原始类型）
    const isSimpleArray = value.every(v =>
      v === null ||
      typeof v === 'boolean' ||
      typeof v === 'number' ||
      typeof v === 'string'
    );

    if (isSimpleArray) {
      const items = value.map(v => toTomlValue(v, 0));
      return `[${items.join(', ')}]`;
    }

    // 复杂数组（数组中的表）
    let result = '[\n';
    value.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        result += `${spaces}  { `;
        const entries = Object.entries(item);
        const parts = entries.map(([k, v]) => `${tomlEscapeKey(k)} = ${toTomlValue(v, 0)}`);
        result += parts.join(', ');
        result += ' },\n';
      } else {
        result += `${spaces}  ${toTomlValue(item, 0)},\n`;
      }
    });
    result += `${spaces}]`;
    return result;
  }

  if (typeof value === 'object') {
    // 对象不能直接作为值
    throw new Error('嵌套对象应该通过表节处理');
  }

  return tomlEscapeString(String(value));
}

/**
 * 将对象转换为 TOML 行
 */
function objectToToml(
  obj: Record<string, unknown>,
  prefix: string = '',
  indent: number = 0
): string {
  const lines: string[] = [];
  const spaces = '  '.repeat(indent);
  const nestedObjects: { key: string; value: Record<string, unknown> }[] = [];
  const nestedArrays: { key: string; value: unknown[] }[] = [];

  // 首先处理简单键值对
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) {
        lines.push(`${spaces}${tomlEscapeKey(key)} = ""`);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        nestedObjects.push({ key: fullKey, value: value as Record<string, unknown> });
      } else if (Array.isArray(value)) {
        // 检查是否是对象数组（需要使用 [[array.of.tables]]）
        const isArrayOfObjects = value.every(item =>
          typeof item === 'object' && item !== null && !Array.isArray(item)
        );

        if (isArrayOfObjects && value.length > 0) {
          nestedArrays.push({ key: fullKey, value });
        } else {
          lines.push(`${spaces}${tomlEscapeKey(key)} = ${toTomlValue(value, indent)}`);
        }
      } else {
        lines.push(`${spaces}${tomlEscapeKey(key)} = ${toTomlValue(value, indent)}`);
      }
    }
  }

  let result = lines.join('\n');

  // 处理嵌套对象（作为表节）
  nestedObjects.forEach(({ key, value }) => {
    if (result) result += '\n';
    result += `\n[${tomlEscapeKey(key)}]\n`;
    result += objectToToml(value, '', 0);
  });

  // 处理对象数组（作为数组表）
  nestedArrays.forEach(({ key, value }) => {
    (value as Record<string, unknown>[]).forEach(item => {
      if (result) result += '\n';
      result += `\n[[${tomlEscapeKey(key)}]]\n`;
      result += objectToToml(item, '', 0);
    });
  });

  return result;
}

/**
 * JSON 转 TOML
 * @param json JSON 字符串
 * @returns TOML 字符串
 */
export function jsonToToml(json: string): string {
  try {
    const parsed: unknown = JSON.parse(json);

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('JSON 根元素必须是一个对象');
    }

    return objectToToml(parsed as Record<string, unknown>).trim();
  } catch (error) {
    throw new Error(`JSON 解析失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ============ TOML 转 JSON ============

interface TomlValue {
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'null';
  value: unknown;
}

/**
 * 解析 TOML 值
 */
function parseTomlValue(str: string): TomlValue {
  str = str.trim();

  // 空值
  if (str === '""' || str === "''" || str === '') {
    return { type: 'string', value: '' };
  }

  // 布尔值
  if (str === 'true') {
    return { type: 'boolean', value: true };
  }
  if (str === 'false') {
    return { type: 'boolean', value: false };
  }

  // 数字
  if (/^-?\d+$/.test(str)) {
    return { type: 'number', value: parseInt(str, 10) };
  }
  if (/^-?\d+\.\d+$/.test(str)) {
    return { type: 'number', value: parseFloat(str) };
  }
  if (/^\+?inf$/.test(str)) {
    return { type: 'number', value: Infinity };
  }
  if (/^-inf$/.test(str)) {
    return { type: 'number', value: -Infinity };
  }
  if (/^\+?nan$/i.test(str)) {
    return { type: 'number', value: NaN };
  }

  // 日期时间
  if (/^\d{4}-\d{2}-\d{2}(T[\d:TZ.+-]+)?$/.test(str)) {
    return { type: 'date', value: new Date(str) };
  }

  // 多行字符串
  if (str.startsWith('"""') && str.endsWith('"""')) {
    return { type: 'string', value: str.slice(3, -3) };
  }
  if (str.startsWith("'''") && str.endsWith("'''")) {
    return { type: 'string', value: str.slice(3, -3) };
  }

  // 字面字符串（不转义）
  if (str.startsWith("'") && str.endsWith("'")) {
    return { type: 'string', value: str.slice(1, -1) };
  }

  // 基本字符串
  if (str.startsWith('"') && str.endsWith('"')) {
    let value = str.slice(1, -1);
    // 处理转义
    value = value
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
    return { type: 'string', value };
  }

  // 数组
  if (str.startsWith('[') && str.endsWith(']')) {
    const inner = str.slice(1, -1).trim();
    if (inner === '') {
      return { type: 'array', value: [] };
    }
    // 简单数组解析
    const items: unknown[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < inner.length; i++) {
      const char = inner[i];

      if ((char === '"' || char === "'") && depth === 0 && !inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar && inString) {
        if (inner[i - 1] !== '\\') {
          inString = false;
        }
        current += char;
      } else if (char === '{' || char === '[') {
        depth++;
        current += char;
      } else if (char === '}' || char === ']') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0 && !inString) {
        items.push(parseTomlValue(current.trim()).value);
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      items.push(parseTomlValue(current.trim()).value);
    }

    return { type: 'array', value: items };
  }

  // 内联表
  if (str.startsWith('{') && str.endsWith('}')) {
    const inner = str.slice(1, -1).trim();
    if (inner === '') {
      return { type: 'object', value: {} };
    }
    // 简单解析
    const obj: Record<string, unknown> = {};
    const pairs = splitTomlPairs(inner);
    pairs.forEach(pair => {
      const eqIndex = pair.indexOf('=');
      if (eqIndex > 0) {
        const key = pair.slice(0, eqIndex).trim();
        const value = pair.slice(eqIndex + 1).trim();
        // 去除键的引号
        const cleanKey = key.startsWith('"') ? key.slice(1, -1) : key;
        obj[cleanKey] = parseTomlValue(value).value;
      }
    });
    return { type: 'object', value: obj };
  }

  return { type: 'string', value: str };
}

/**
 * 分割 TOML 键值对
 */
function splitTomlPairs(str: string): string[] {
  const pairs: string[] = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if ((char === '"' || char === "'") && depth === 0 && !inString) {
      inString = true;
      stringChar = char;
    } else if (char === stringChar && inString) {
      if (str[i - 1] !== '\\') {
        inString = false;
      }
      current += char;
    } else if (char === '{' || char === '[') {
      depth++;
      current += char;
    } else if (char === '}' || char === ']') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0 && !inString) {
      pairs.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    pairs.push(current.trim());
  }

  return pairs;
}

/**
 * 解析 TOML 键
 */
function parseTomlKey(keyStr: string): string[] {
  const keys: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < keyStr.length; i++) {
    const char = keyStr[i];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      inQuotes = false;
    } else if (char === '.' && !inQuotes) {
      if (current.trim()) {
        keys.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    keys.push(current.trim());
  }

  return keys;
}

/**
 * 设置嵌套属性
 */
function setNestedProperty(
  obj: Record<string, unknown>,
  keys: string[],
  value: unknown,
  isArrayTable: boolean = false
): void {
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1];

  if (isArrayTable) {
    if (!(lastKey in current)) {
      current[lastKey] = [];
    }
    (current[lastKey] as unknown[]).push(value);
  } else {
    current[lastKey] = value;
  }
}

/**
 * 获取或创建嵌套对象
 */
function getOrCreateNested(
  obj: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  let current = obj;

  for (const key of keys) {
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  return current;
}

/**
 * TOML 转 JSON
 * @param toml TOML 字符串
 * @returns JSON 字符串
 */
export function tomlToJson(toml: string): string {
  const result: Record<string, unknown> = {};
  const lines = toml.split('\n');

  let currentSection: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // 跳过空行和注释
    if (!line || line.startsWith('#')) {
      continue;
    }

    // 表节 [section] 或 [section.subsection]
    const tableMatch = line.match(/^\[([^\]]+)\]$/);
    if (tableMatch) {
      currentSection = parseTomlKey(tableMatch[1]);
      getOrCreateNested(result, currentSection);
      continue;
    }

    // 数组表 [[section]]
    const arrayTableMatch = line.match(/^\[\[([^\]]+)\]\]$/);
    if (arrayTableMatch) {
      const keys = parseTomlKey(arrayTableMatch[1]);
      const parentKeys = keys.slice(0, -1);
      const arrayKey = keys[keys.length - 1];

      const parent = parentKeys.length > 0
        ? getOrCreateNested(result, parentKeys)
        : result;

      if (!(arrayKey in parent)) {
        parent[arrayKey] = [];
      }

      const newArrayItem: Record<string, unknown> = {};
      (parent[arrayKey] as unknown[]).push(newArrayItem);
      currentSection = [...parentKeys, arrayKey, String((parent[arrayKey] as unknown[]).length - 1)];
      continue;
    }

    // 键值对
    const eqIndex = line.indexOf('=');
    if (eqIndex > 0) {
      const keyStr = line.slice(0, eqIndex).trim();
      const valueStr = line.slice(eqIndex + 1).trim();

      const keys = parseTomlKey(keyStr);
      const parsedValue = parseTomlValue(valueStr).value;

      if (currentSection.length > 0) {
        const target = getOrCreateNested(result, currentSection);
        if (keys.length === 1) {
          target[keys[0]] = parsedValue;
        } else {
          setNestedProperty(target, keys, parsedValue);
        }
      } else {
        setNestedProperty(result, keys, parsedValue);
      }
    }
  }

  return JSON.stringify(result, null, 2);
}
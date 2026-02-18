import { parseJson } from '../json';

export type ConverterFormat = 'yaml' | 'xml' | 'urlparams';

export const jsonToYaml = (jsonText: string): { success: boolean; data?: string; error?: string } => {
  const result = parseJson(jsonText);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  try {
    const yaml = convertToYaml(result.data, 0);
    return { success: true, data: yaml };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Conversion failed' };
  }
};

const convertToYaml = (data: unknown, indent: number): string => {
  const spaces = '  '.repeat(indent);
  
  if (data === null || data === undefined) {
    return 'null';
  }
  
  const type = typeof data;
  
  if (type === 'string') {
    if ((data as string).includes('\n') || (data as string).includes(':')) {
      return `"${(data as string).replace(/"/g, '\\"')}"`;
    }
    return data as string;
  }
  if (type === 'number' || type === 'boolean') {
    return String(data);
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) return '[]';
    return data.map(item => {
      const value = convertToYaml(item, indent + 1);
      if (typeof item === 'object' && item !== null) {
        return `\n${spaces}- ${value.trim().split('\n').join(`\n${spaces}  `)}`;
      }
      return `\n${spaces}- ${value}`;
    }).join('');
  }
  
  if (type === 'object') {
    const obj = data as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    
    return keys.map(key => {
      const value = obj[key];
      const yamlValue = convertToYaml(value, indent + 1);
      
      if (typeof value === 'object' && value !== null) {
        return `${key}:${yamlValue}`;
      }
      return `${key}: ${yamlValue}`;
    }).join(`\n${spaces}`);
  }
  
  return String(data);
};

export const jsonToXml = (jsonText: string): { success: boolean; data?: string; error?: string } => {
  const result = parseJson(jsonText);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  try {
    const xml = convertToXml(result.data, 'root');
    return { success: true, data: `<?xml version="1.0" encoding="UTF-8"?>\n${xml}` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Conversion failed' };
  }
};

const convertToXml = (data: unknown, tagName: string): string => {
  if (data === null || data === undefined) {
    return `<${tagName}/>`;
  }
  
  const type = typeof data;
  
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return `<${tagName}>${escapeXml(String(data))}</${tagName}>`;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => convertToXml(item, 'item')).join('\n');
  }
  
  if (type === 'object') {
    const obj = data as Record<string, unknown>;
    const inner = Object.keys(obj)
      .map(key => convertToXml(obj[key], key))
      .join('\n');
    return `<${tagName}>\n${indentXml(inner)}\n</${tagName}>`;
  }
  
  return `<${tagName}/>`;
};

const escapeXml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const indentXml = (xml: string): string => {
  return xml.split('\n').map(line => '  ' + line).join('\n');
};

export const jsonToUrlParams = (jsonText: string): { success: boolean; data?: string; error?: string } => {
  const result = parseJson(jsonText);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  try {
    const params = flattenToParams(result.data as Record<string, unknown>);
    return { success: true, data: params };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Conversion failed' };
  }
};

const flattenToParams = (obj: Record<string, unknown>, prefix: string = ''): string => {
  const params: string[] = [];
  
  for (const key of Object.keys(obj)) {
    const paramKey = prefix ? `${prefix}[${key}]` : key;
    const value = obj[key];
    
    if (value === null || value === undefined) {
      continue;
    }
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      params.push(flattenToParams(value as Record<string, unknown>, paramKey));
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          params.push(flattenToParams(item as Record<string, unknown>, `${paramKey}[${index}]`));
        } else {
          params.push(`${paramKey}[${index}]=${encodeURIComponent(String(item))}`);
        }
      });
    } else {
      params.push(`${paramKey}=${encodeURIComponent(String(value))}`);
    }
  }
  
  return params.join('&');
};

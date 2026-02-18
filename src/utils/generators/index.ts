import { parseJson } from '../json';

export type GeneratorLanguage = 'typescript' | 'go' | 'python' | 'java' | 'csharp';

interface GeneratorOptions {
  rootName?: string;
}

export const generateTypeScript = (
  jsonText: string, 
  options: GeneratorOptions = {}
): { success: boolean; data?: string; error?: string } => {
  const result = parseJson(jsonText);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  try {
    const typeName = options.rootName || 'RootObject';
    const interfaces = generateTsInterfaces(result.data, typeName);
    return { success: true, data: interfaces };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Generation failed' };
  }
};

const generateTsInterfaces = (data: unknown, typeName: string, generated: Set<string> = new Set()): string => {
  if (generated.has(typeName)) {
    return '';
  }
  generated.add(typeName);
  
  if (data === null) {
    return `export type ${typeName} = null;\n`;
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return `export type ${typeName} = unknown[];\n`;
    }
    const itemType = inferTsType(data[0], typeName + 'Item', generated);
    return `export type ${typeName} = ${itemType}[];\n`;
  }
  
  if (typeof data !== 'object') {
    return `export type ${typeName} = ${typeof data};\n`;
  }
  
  const obj = data as Record<string, unknown>;
  const interfaces: string[] = [];
  const properties: string[] = [];
  
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
    const propType = inferTsType(value, typeName + '_' + sanitizeTypeName(key), generated);
    properties.push(`  ${safeKey}: ${propType};`);
  }
  
  interfaces.push(`export interface ${typeName} {\n${properties.join('\n')}\n}`);
  return interfaces.join('\n\n');
};

const inferTsType = (value: unknown, typeName: string, generated: Set<string>): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  const type = typeof value;
  
  if (type === 'string') return 'string';
  if (type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';
  
  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]';
    const itemType = inferTsType(value[0], typeName + 'Item', generated);
    return `(${itemType})[]`;
  }
  
  if (type === 'object') {
    return typeName;
  }
  
  return 'unknown';
};

const sanitizeTypeName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9_$]/g, '_')
    .replace(/^([0-9])/, '_$1')
    .replace(/_+/g, '_');
};

export const generateGo = (
  jsonText: string,
  options: GeneratorOptions = {}
): { success: boolean; data?: string; error?: string } => {
  const result = parseJson(jsonText);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  try {
    const typeName = options.rootName || 'RootObject';
    const struct = generateGoStruct(result.data, typeName);
    return { success: true, data: struct };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Generation failed' };
  }
};

const generateGoStruct = (data: unknown, typeName: string, generated: Set<string> = new Set()): string => {
  if (generated.has(typeName)) {
    return '';
  }
  generated.add(typeName);
  
  if (data === null || typeof data !== 'object') {
    return '';
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return `type ${typeName} []interface{}\n`;
    }
    const itemType = inferGoType(data[0], typeName + 'Item', generated);
    return `type ${typeName} []${itemType}\n`;
  }
  
  const obj = data as Record<string, unknown>;
  const structs: string[] = [];
  const fields: string[] = [];
  
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const fieldName = capitalize(key);
    const fieldType = inferGoType(value, typeName + fieldName, generated);
    const jsonTag = '`json:"' + key + '"`';
    fields.push(`\t${fieldName} ${fieldType} ${jsonTag}`);
  }
  
  structs.push(`type ${typeName} struct {\n${fields.join('\n')}\n}`);
  return structs.join('\n\n');
};

const inferGoType = (value: unknown, typeName: string, generated: Set<string>): string => {
  if (value === null) return 'interface{}';
  
  const type = typeof value;
  
  if (type === 'string') return 'string';
  if (type === 'number') {
    if (Number.isInteger(value)) return 'int64';
    return 'float64';
  }
  if (type === 'boolean') return 'bool';
  
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]interface{}';
    const itemType = inferGoType(value[0], typeName + 'Item', generated);
    return `[]${itemType}`;
  }
  
  if (type === 'object') {
    return '*' + typeName;
  }
  
  return 'interface{}';
};

const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const generatePython = (
  jsonText: string,
  options: GeneratorOptions = {}
): { success: boolean; data?: string; error?: string } => {
  const result = parseJson(jsonText);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  try {
    const className = options.rootName || 'RootObject';
    const dataclass = generatePythonDataclass(result.data, className);
    return { success: true, data: dataclass };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Generation failed' };
  }
};

const generatePythonDataclass = (data: unknown, className: string, generated: Set<string> = new Set()): string => {
  if (generated.has(className)) {
    return '';
  }
  generated.add(className);
  
  const imports = new Set<string>();
  imports.add('from dataclasses import dataclass');
  imports.add('from typing import Any, Optional');
  
  if (data === null || typeof data !== 'object') {
    return `${Array.from(imports).join('\n')}\n\n${className} = Any\n`;
  }
  
  if (Array.isArray(data)) {
    imports.add('from typing import List');
    if (data.length === 0) {
      return `${Array.from(imports).join('\n')}\n\n${className} = List[Any]\n`;
    }
    const itemType = inferPythonType(data[0], className + 'Item', imports, generated);
    return `${Array.from(imports).join('\n')}\n\n${className} = List[${itemType}]\n`;
  }
  
  const obj = data as Record<string, unknown>;
  const classes: string[] = [];
  const fields: string[] = [];
  
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const safeName = key.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^([0-9])/, '_$1');
    const fieldType = inferPythonType(value, className + '_' + safeName, imports, generated);
    fields.push(`    ${safeName}: ${fieldType}`);
  }
  
  classes.push(`@dataclass\nclass ${className}:\n${fields.join('\n')}`);
  
  return `${Array.from(imports).join('\n')}\n\n${classes.join('\n\n')}\n`;
};

const inferPythonType = (
  value: unknown, 
  className: string, 
  imports: Set<string>, 
  generated: Set<string>
): string => {
  if (value === null) return 'Optional[Any]';
  
  const type = typeof value;
  
  if (type === 'string') return 'str';
  if (type === 'number') {
    if (Number.isInteger(value)) return 'int';
    return 'float';
  }
  if (type === 'boolean') return 'bool';
  
  if (Array.isArray(value)) {
    imports.add('from typing import List');
    if (value.length === 0) return 'List[Any]';
    const itemType = inferPythonType(value[0], className + 'Item', imports, generated);
    return `List[${itemType}]`;
  }
  
  if (type === 'object') {
    return className;
  }
  
  return 'Any';
};

export const generateJava = (
  jsonText: string,
  options: GeneratorOptions = {}
): { success: boolean; data?: string; error?: string } => {
  const result = parseJson(jsonText);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  try {
    const className = options.rootName || 'RootObject';
    const pojo = generateJavaPojo(result.data, className);
    return { success: true, data: pojo };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Generation failed' };
  }
};

const generateJavaPojo = (data: unknown, className: string, generated: Set<string> = new Set()): string => {
  if (generated.has(className)) {
    return '';
  }
  generated.add(className);
  
  if (data === null || typeof data !== 'object') {
    return `public class ${className} {\n    private Object value;\n}\n`;
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return `public class ${className} extends ArrayList<Object> {}\n`;
    }
    const itemType = inferJavaType(data[0], className + 'Item', generated);
    return `public class ${className} extends ArrayList<${itemType}> {}\n`;
  }
  
  const obj = data as Record<string, unknown>;
  const classes: string[] = [];
  const fields: string[] = [];
  const gettersSetters: string[] = [];
  
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const fieldName = sanitizeJavaFieldName(key);
    const fieldType = inferJavaType(value, className + capitalize(fieldName), generated);
    
    fields.push(`    private ${fieldType} ${fieldName};`);
    
    const capitalized = capitalize(fieldName);
    gettersSetters.push(`    public ${fieldType} get${capitalized}() { return ${fieldName}; }`);
    gettersSetters.push(`    public void set${capitalized}(${fieldType} ${fieldName}) { this.${fieldName} = ${fieldName}; }`);
  }
  
  classes.push(`public class ${className} {\n${fields.join('\n')}\n\n${gettersSetters.join('\n')}\n}`);
  
  return classes.join('\n\n');
};

const inferJavaType = (value: unknown, className: string, generated: Set<string>): string => {
  if (value === null) return 'Object';
  
  const type = typeof value;
  
  if (type === 'string') return 'String';
  if (type === 'number') {
    if (Number.isInteger(value)) return 'Long';
    return 'Double';
  }
  if (type === 'boolean') return 'Boolean';
  
  if (Array.isArray(value)) {
    if (value.length === 0) return 'List<Object>';
    const itemType = inferJavaType(value[0], className + 'Item', generated);
    return `List<${itemType}>`;
  }
  
  if (type === 'object') {
    return className;
  }
  
  return 'Object';
};

const sanitizeJavaFieldName = (name: string): string => {
  const sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
  if (/^[0-9]/.test(sanitized)) {
    return '_' + sanitized;
  }
  return sanitized;
};

export const generateCSharp = (
  jsonText: string,
  options: GeneratorOptions = {}
): { success: boolean; data?: string; error?: string } => {
  const result = parseJson(jsonText);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  try {
    const className = options.rootName || 'RootObject';
    const csharp = generateCSharpClass(result.data, className);
    return { success: true, data: csharp };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Generation failed' };
  }
};

const generateCSharpClass = (data: unknown, className: string, generated: Set<string> = new Set()): string => {
  if (generated.has(className)) {
    return '';
  }
  generated.add(className);
  
  if (data === null || typeof data !== 'object') {
    return `public class ${className}\n{\n    public object Value { get; set; }\n}\n`;
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return `public class ${className} : List<object> {}\n`;
    }
    const itemType = inferCSharpType(data[0], className + 'Item', generated);
    return `public class ${className} : List<${itemType}> {}\n`;
  }
  
  const obj = data as Record<string, unknown>;
  const classes: string[] = [];
  const properties: string[] = [];
  
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const propName = capitalize(sanitizeJavaFieldName(key));
    const propType = inferCSharpType(value, className + propName, generated);
    
    const jsonProperty = `[JsonPropertyName("${key}")]`;
    properties.push(`    ${jsonProperty}`);
    properties.push(`    public ${propType} ${propName} { get; set; }`);
  }
  
  classes.push(`using System.Text.Json.Serialization;\n\npublic class ${className}\n{\n${properties.join('\n')}\n}`);
  
  return classes.join('\n\n');
};

const inferCSharpType = (value: unknown, className: string, generated: Set<string>): string => {
  if (value === null) return 'object?';
  
  const type = typeof value;
  
  if (type === 'string') return 'string';
  if (type === 'number') {
    if (Number.isInteger(value)) return 'long';
    return 'double';
  }
  if (type === 'boolean') return 'bool';
  
  if (Array.isArray(value)) {
    if (value.length === 0) return 'List<object>';
    const itemType = inferCSharpType(value[0], className + 'Item', generated);
    return `List<${itemType}>`;
  }
  
  if (type === 'object') {
    return className;
  }
  
  return 'object';
};

/**
 * JSON to Go Struct Generator
 */

import { 
  parseJson, 
  inferType, 
  ParsedType, 
  toPascalCase,
  toValidIdentifier,
  JsonValue
} from './json-helpers';

export interface JsonToGoOptions {
  rootName?: string;
  packageName?: string;
  useJsonTags?: boolean;
  useOmitempty?: boolean;
}

/**
 * Convert JSON to Go struct
 */
export function jsonToGo(json: string, options?: JsonToGoOptions): string {
  const parsed = parseJson(json);
  const rootName = options?.rootName || 'RootObject';
  const packageName = options?.packageName || 'models';
  const useJsonTags = options?.useJsonTags !== false;
  const useOmitempty = options?.useOmitempty !== false;
  
  const structs: string[] = [];
  const processedStructs = new Set<string>();
  
  generateGoStruct(rootName, parsed, structs, processedStructs, {
    useJsonTags,
    useOmitempty
  });
  
  return `package ${packageName}\n\n` + structs.join('\n\n');
}

interface GoStructOptions {
  useJsonTags: boolean;
  useOmitempty: boolean;
}

function generateGoStruct(
  name: string,
  value: JsonValue,
  structs: string[],
  processed: Set<string>,
  options: GoStructOptions
): void {
  const type = inferType(value);
  
  if (type.type !== 'object' || !type.objectFields) {
    return;
  }
  
  const structName = toPascalCase(name);
  
  if (processed.has(structName)) {
    return;
  }
  processed.add(structName);
  
  const fields: string[] = [];
  const nestedStructs: Array<{ name: string; value: JsonValue }> = [];
  
  for (const [key, fieldType] of Object.entries(type.objectFields)) {
    const fieldName = toPascalCase(toValidIdentifier(key));
    const goType = getGoType(fieldType, fieldName, nestedStructs, value as any, key);
    
    // JSON tag
    const jsonTag = options.useJsonTags 
      ? `\`json:"${key}${options.useOmitempty && fieldType.type === 'null' ? ',omitempty' : ''}"\`` 
      : '';
    
    fields.push(`\t${fieldName} ${goType} ${jsonTag}`);
    
    // Handle nested structs
    if (fieldType.type === 'object' && fieldType.objectFields) {
      nestedStructs.push({ name: fieldName, value: (value as any)[key] });
    }
    
    // Handle arrays of objects
    if (fieldType.type === 'array' && fieldType.arrayType?.type === 'object') {
      if (Array.isArray((value as any)[key]) && (value as any)[key].length > 0) {
        const nestedStructName = fieldName;
        nestedStructs.push({ name: nestedStructName, value: (value as any)[key][0] });
      }
    }
  }
  
  const structDef = `type ${structName} struct {
${fields.join('\n')}
}`;
  
  structs.push(structDef);
  
  // Process nested structs
  for (const nested of nestedStructs) {
    generateGoStruct(nested.name, nested.value, structs, processed, options);
  }
}

function getGoType(
  type: ParsedType, 
  fieldName: string, 
  nestedStructs: Array<{ name: string; value: JsonValue }>,
  parentValue: any,
  key: string
): string {
  switch (type.type) {
    case 'string':
      return 'string';
    case 'number':
      return 'float64';
    case 'boolean':
      return 'bool';
    case 'null':
      return 'interface{}';
    case 'array':
      const arrayType = type.arrayType;
      if (!arrayType) return '[]interface{}';
      
      if (arrayType.type === 'object') {
        const nestedStructName = fieldName;
        return `[]${nestedStructName}`;
      }
      return `[]${getGoPrimitiveType(arrayType)}`;
    case 'object':
      return fieldName; // Use the field name as the struct name
    default:
      return 'interface{}';
  }
}

function getGoPrimitiveType(type: ParsedType): string {
  switch (type.type) {
    case 'string':
      return 'string';
    case 'number':
      return 'float64';
    case 'boolean':
      return 'bool';
    default:
      return 'interface{}';
  }
}

export default jsonToGo;
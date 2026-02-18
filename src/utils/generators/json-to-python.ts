/**
 * JSON to Python Dataclass Generator
 */

import { 
  parseJson, 
  inferType, 
  ParsedType, 
  toSnakeCase,
  toPascalCase,
  toValidIdentifier,
  JsonValue
} from './json-helpers';

export interface JsonToPythonOptions {
  rootName?: string;
  useDataclass?: boolean;
  usePydantic?: boolean;
  useTyping?: boolean;
}

/**
 * Convert JSON to Python dataclass
 */
export function jsonToPython(json: string, options?: JsonToPythonOptions): string {
  const parsed = parseJson(json);
  const rootName = options?.rootName || 'RootObject';
  const useDataclass = options?.useDataclass !== false;
  const usePydantic = options?.usePydantic || false;
  const useTyping = options?.useTyping !== false;
  
  const classes: string[] = [];
  const processedClasses = new Set<string>();
  
  // Add imports
  const imports: string[] = [];
  if (usePydantic) {
    imports.push('from pydantic import BaseModel');
  } else if (useDataclass) {
    imports.push('from dataclasses import dataclass');
    if (useTyping) {
      imports.push('from typing import Any, List, Optional');
    }
  }
  
  generatePythonClass(rootName, parsed, classes, processedClasses, {
    useDataclass,
    usePydantic,
    useTyping
  });
  
  const importsStr = imports.length > 0 ? imports.join('\n') + '\n\n' : '';
  return importsStr + classes.join('\n\n');
}

interface PythonClassOptions {
  useDataclass: boolean;
  usePydantic: boolean;
  useTyping: boolean;
}

function generatePythonClass(
  name: string,
  value: JsonValue,
  classes: string[],
  processed: Set<string>,
  options: PythonClassOptions
): void {
  const type = inferType(value);
  
  if (type.type !== 'object' || !type.objectFields) {
    return;
  }
  
  const className = toPascalCase(name);
  
  if (processed.has(className)) {
    return;
  }
  processed.add(className);
  
  const fields: string[] = [];
  const nestedClasses: Array<{ name: string; value: JsonValue }> = [];
  
  for (const [key, fieldType] of Object.entries(type.objectFields)) {
    const fieldName = toSnakeCase(toValidIdentifier(key));
    const pythonType = getPythonType(fieldType, fieldName, options);
    const defaultValue = getPythonDefaultValue(fieldType, (value as any)[key], options);
    
    if (options.usePydantic) {
      fields.push(`    ${fieldName}: ${pythonType}`);
    } else {
      fields.push(`    ${fieldName}: ${pythonType} = ${defaultValue}`);
    }
    
    // Track nested classes
    if (fieldType.type === 'object' && fieldType.objectFields) {
      const nestedClassName = toPascalCase(fieldName);
      nestedClasses.push({ name: nestedClassName, value: (value as any)[key] });
    }
    
    // Handle arrays of objects
    if (fieldType.type === 'array' && fieldType.arrayType?.type === 'object') {
      if (Array.isArray((value as any)[key]) && (value as any)[key].length > 0) {
        const nestedClassName = toPascalCase(fieldName);
        nestedClasses.push({ name: nestedClassName, value: (value as any)[key][0] });
      }
    }
  }
  
  // Class decorators
  const decorator = options.usePydantic ? '' : '@dataclass\n';
  const baseClass = options.usePydantic ? '(BaseModel)' : '';
  
  const classDef = `${decorator}class ${className}${baseClass}:
${fields.join('\n')}
`;
  
  classes.push(classDef);
  
  // Process nested classes
  for (const nested of nestedClasses) {
    generatePythonClass(nested.name, nested.value, classes, processed, options);
  }
}

function getPythonType(type: ParsedType, fieldName: string, options: PythonClassOptions): string {
  const useTyping = options.useTyping;
  
  switch (type.type) {
    case 'string':
      return 'str';
    case 'number':
      return 'float';
    case 'boolean':
      return 'bool';
    case 'null':
      return 'Any' if useTyping else 'object';
    case 'array':
      const arrayType = type.arrayType;
      if (!arrayType) return useTyping ? 'List[Any]' : 'list';
      
      if (arrayType.type === 'object') {
        const nestedClassName = toPascalCase(fieldName);
        return useTyping ? `List['${nestedClassName}']` : 'list';
      }
      const elementType = getPythonPrimitiveType(arrayType);
      return useTyping ? `List[${elementType}]` : 'list';
    case 'object':
      const className = toPascalCase(fieldName);
      return useTyping ? `'${className}'` : 'dict';
    default:
      return 'Any' if useTyping else 'object';
  }
}

function getPythonPrimitiveType(type: ParsedType): string {
  switch (type.type) {
    case 'string':
      return 'str';
    case 'number':
      return 'float';
    case 'boolean':
      return 'bool';
    default:
      return 'Any';
  }
}

function getPythonDefaultValue(type: ParsedType, actualValue: JsonValue, options: PythonClassOptions): string {
  if (actualValue !== undefined && actualValue !== null) {
    return JSON.stringify(actualValue);
  }
  
  switch (type.type) {
    case 'string':
      return "''";
    case 'number':
      return '0.0';
    case 'boolean':
      return 'False';
    case 'null':
      return 'None';
    case 'array':
      return 'field(default_factory=list)' if options.useDataclass else '[]';
    case 'object':
      return 'field(default_factory=dict)' if options.useDataclass else '{}';
    default:
      return 'None';
  }
}

export default jsonToPython;
/**
 * JSON to Java Entity Class Generator
 */

import { 
  parseJson, 
  inferType, 
  ParsedType, 
  toPascalCase,
  toCamelCase,
  toValidIdentifier,
  JsonValue,
  capitalize
} from './json-helpers';

export interface JsonToJavaOptions {
  rootName?: string;
  packageName?: string;
  useLombok?: boolean;
  useJackson?: boolean;
  useGson?: boolean;
}

/**
 * Convert JSON to Java entity class
 */
export function jsonToJava(json: string, options?: JsonToJavaOptions): string {
  const parsed = parseJson(json);
  const rootName = options?.rootName || 'RootObject';
  const packageName = options?.packageName || 'com.example.model';
  const useLombok = options?.useLombok || false;
  const useJackson = options?.useJackson !== false;
  const useGson = options?.useGson || false;
  
  const classes: string[] = [];
  const processedClasses = new Set<string>();
  
  generateJavaClass(rootName, parsed, classes, processedClasses, {
    packageName,
    useLombok,
    useJackson,
    useGson
  });
  
  return classes.join('\n\n');
}

interface JavaClassOptions {
  packageName: string;
  useLombok: boolean;
  useJackson: boolean;
  useGson: boolean;
}

function generateJavaClass(
  name: string,
  value: JsonValue,
  classes: string[],
  processed: Set<string>,
  options: JavaClassOptions
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
  
  const imports: Set<string> = new Set();
  
  for (const [key, fieldType] of Object.entries(type.objectFields)) {
    const fieldName = toCamelCase(toValidIdentifier(key));
    const javaType = getJavaType(fieldType, fieldName, options);
    const capitalizedName = capitalize(fieldName);
    
    // Add annotation for JSON mapping
    let annotations = '';
    if (options.useJackson && key !== fieldName) {
      annotations = `  @JsonProperty("${key}")\n`;
      imports.add('com.fasterxml.jackson.annotation.JsonProperty');
    }
    if (options.useGson && key !== fieldName) {
      annotations = `  @SerializedName("${key}")\n`;
      imports.add('com.google.gson.annotations.SerializedName');
    }
    
    fields.push(`${annotations}  private ${javaType} ${fieldName};`);
    
    // Track nested objects for class generation
    if (fieldType.type === 'object' && fieldType.objectFields) {
      const nestedClassName = toPascalCase(fieldName);
      nestedClasses.push({ name: nestedClassName, value: (value as any)[key] });
    }
    
    // Handle arrays of objects
    if (fieldType.type === 'array' && fieldType.arrayType?.type === 'object') {
      const nestedClassName = toPascalCase(fieldName.replace(/s$/, ''));
      if (Array.isArray((value as any)[key]) && (value as any)[key].length > 0) {
        nestedClasses.push({ name: nestedClassName, value: (value as any)[key][0] });
      }
    }
  }
  
  // Generate getters and setters
  const gettersSetters: string[] = [];
  for (const [key, fieldType] of Object.entries(type.objectFields)) {
    const fieldName = toCamelCase(toValidIdentifier(key));
    const javaType = getJavaType(fieldType, fieldName, options);
    const capitalizedName = capitalize(fieldName);
    
    gettersSetters.push(`  public ${javaType} get${capitalizedName}() {
    return ${fieldName};
  }
  
  public void set${capitalizedName}(${javaType} ${fieldName}) {
    this.${fieldName} = ${fieldName};
  }`);
  }
  
  // Build imports
  const importLines = Array.from(imports).map(i => `import ${i};`);
  if (options.useLombok) {
    importLines.unshift('import lombok.*;');
  }
  
  // Class annotations for Lombok
  const classAnnotations = options.useLombok ? '@Data\n@Builder\n@NoArgsConstructor\n@AllArgsConstructor\n' : '';
  
  const classCode = `package ${options.packageName};

${importLines.length > 0 ? importLines.join('\n') + '\n' : ''}
${classAnnotations}public class ${className} {
${fields.join('\n\n')}
  
${gettersSetters.join('\n\n')}
}`;
  
  classes.push(classCode);
  
  // Process nested classes
  for (const nested of nestedClasses) {
    generateJavaClass(nested.name, nested.value, classes, processed, options);
  }
}

function getJavaType(type: ParsedType, fieldName: string, options: JavaClassOptions): string {
  switch (type.type) {
    case 'string':
      return 'String';
    case 'number':
      return 'Double'; // Use Double to handle both int and float
    case 'boolean':
      return 'Boolean';
    case 'null':
      return 'Object';
    case 'array':
      const arrayType = type.arrayType;
      if (!arrayType) return 'List<Object>';
      
      if (arrayType.type === 'object') {
        const nestedClassName = toPascalCase(fieldName.replace(/s$/, ''));
        return `List<${nestedClassName}>`;
      }
      return `List<${getJavaPrimitiveType(arrayType)}>`;
    case 'object':
      return toPascalCase(fieldName);
    default:
      return 'Object';
  }
}

function getJavaPrimitiveType(type: ParsedType): string {
  switch (type.type) {
    case 'string':
      return 'String';
    case 'number':
      return 'Double';
    case 'boolean':
      return 'Boolean';
    default:
      return 'Object';
  }
}

export default jsonToJava;
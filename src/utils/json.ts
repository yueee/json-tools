export interface JsonParseResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export const parseJson = (text: string): JsonParseResult => {
  try {
    const data = JSON.parse(text);
    return { success: true, data };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error';
    return { success: false, error };
  }
};

export const formatJson = (text: string, indent: number = 2): JsonParseResult => {
  const result = parseJson(text);
  if (!result.success) {
    return result;
  }
  try {
    const formatted = JSON.stringify(result.data, null, indent);
    return { success: true, data: formatted };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error';
    return { success: false, error };
  }
};

export const minifyJson = (text: string): JsonParseResult => {
  const result = parseJson(text);
  if (!result.success) {
    return result;
  }
  try {
    const minified = JSON.stringify(result.data);
    return { success: true, data: minified };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error';
    return { success: false, error };
  }
};

export const validateJson = (text: string): { valid: boolean; error?: string } => {
  const result = parseJson(text);
  return { valid: result.success, error: result.error };
};

export const getJsonType = (data: unknown): string => {
  if (data === null) return 'null';
  if (Array.isArray(data)) return 'array';
  if (typeof data === 'object') return 'object';
  return typeof data;
};

export const getJsonStats = (text: string): { 
  valid: boolean; 
  size: number; 
  lines: number;
  type?: string;
  keys?: number;
  items?: number;
} => {
  const result = parseJson(text);
  const lines = text.split('\n').length;
  const size = new Blob([text]).size;
  
  if (!result.success) {
    return { valid: false, size, lines };
  }

  const type = getJsonType(result.data);
  let keys: number | undefined;
  let items: number | undefined;

  if (type === 'object' && result.data && typeof result.data === 'object') {
    keys = Object.keys(result.data as object).length;
  }
  if (type === 'array' && Array.isArray(result.data)) {
    items = result.data.length;
  }

  return { valid: true, size, lines, type, keys, items };
};

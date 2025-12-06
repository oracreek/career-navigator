/**
 * Database utility functions for D1
 */

/**
 * Execute a query and return results
 */
export async function query(db, sql, params = []) {
  try {
    const result = await db.prepare(sql).bind(...params).all();
    return result.results || [];
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error(`Database error: ${error.message}`);
  }
}

/**
 * Execute a query and return first result
 */
export async function queryOne(db, sql, params = []) {
  try {
    const result = await db.prepare(sql).bind(...params).first();
    return result;
  } catch (error) {
    console.error('Database queryOne error:', error);
    throw new Error(`Database error: ${error.message}`);
  }
}

/**
 * Execute an insert/update/delete and return info
 */
export async function execute(db, sql, params = []) {
  try {
    const result = await db.prepare(sql).bind(...params).run();
    return result;
  } catch (error) {
    console.error('Database execute error:', error);
    throw new Error(`Database error: ${error.message}`);
  }
}

/**
 * Generate a UUID (for compatibility)
 */
export function generateId() {
  return crypto.randomUUID().replace(/-/g, '');
}

/**
 * Parse JSON safely
 */
export function parseJSON(value, defaultValue = null) {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
}

/**
 * Serialize to JSON safely
 */
export function toJSON(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

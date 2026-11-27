import type {
  AnalyzeQueryRequest,
  AnalyzeQueryResponse,
  DatasetSchema,
  DatasetSummary,
  EvaluateQueryRequest,
  EvaluateQueryResponse,
  QueryBreakdownItem,
  QueryConcept,
  QueryDiagnostic,
  ResultCell,
  ResultColumn,
  SqlDialect,
  TopicDetail,
  TopicSummary,
} from '../types/api';
import {
  DEFAULT_DATASET_ID,
  MOCK_DATASETS,
  MOCK_DATASET_SCHEMA,
  MOCK_TABLES,
  MOCK_TOPICS,
} from './mockData';

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(new DOMException('Request aborted', 'AbortError'));
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException('Request aborted', 'AbortError'));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function mockGetTopics(): Promise<TopicSummary[]> {
  await delay(50);
  return MOCK_TOPICS.map(({ slug, title, category, difficulty, summary, prerequisites }) => ({
    slug,
    title,
    category,
    difficulty,
    summary,
    prerequisites,
  }));
}

export async function mockGetTopicBySlug(slug: string): Promise<TopicDetail> {
  await delay(50);
  const topic = MOCK_TOPICS.find((t) => t.slug === slug);
  if (!topic) {
    throw new Error(`Topic "${slug}" not found.`);
  }
  return topic;
}

export async function mockGetDatasets(): Promise<DatasetSummary[]> {
  await delay(40);
  return MOCK_DATASETS;
}

export async function mockGetDatasetSchema(datasetId: string): Promise<DatasetSchema> {
  await delay(40);
  if (datasetId !== DEFAULT_DATASET_ID) {
    throw new Error(`Unknown dataset "${datasetId}".`);
  }
  return MOCK_DATASET_SCHEMA;
}

type TableStore = Record<string, Record<string, ResultCell>[]>;

interface ParsedJoin {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS';
  table: string;
  alias: string;
  leftKey?: string;
  rightKey?: string;
}

interface ParsedSelectQuery {
  raw: string;
  normalized: string;
  dialect: SqlDialect;
  datasetId: string;
  isExplain: boolean;
  distinct: boolean;
  topCount: number | null;
  limitCount: number | null;
  selectExprs: string[];
  baseTable: string;
  baseAlias: string;
  joins: ParsedJoin[];
  whereClause: string | null;
  groupByCols: string[];
  havingClause: string | null;
  orderBy: { column: string; direction: 'ASC' | 'DESC' } | null;
}

function stripTrailingSemicolon(sql: string): string {
  return sql.trim().replace(/;+\s*$/, '').trim();
}

function splitTopLevelCommas(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inSingleQuote = false;
  let current = '';

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (ch === "'" && input[i - 1] !== '\\') {
      inSingleQuote = !inSingleQuote;
      current += ch;
      continue;
    }
    if (!inSingleQuote) {
      if (ch === '(') depth += 1;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      else if (ch === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function findTopLevelKeyword(sql: string, keyword: string): number {
  let depth = 0;
  let inSingleQuote = false;
  const upperSql = sql.toUpperCase();
  const upperKw = keyword.toUpperCase();

  for (let i = 0; i <= sql.length - upperKw.length; i += 1) {
    const ch = sql[i];
    if (ch === "'" && sql[i - 1] !== '\\') {
      inSingleQuote = !inSingleQuote;
      continue;
    }
    if (inSingleQuote) continue;
    if (ch === '(') {
      depth += 1;
      continue;
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth === 0 && upperSql.startsWith(upperKw, i)) {
      const before = i === 0 ? ' ' : upperSql[i - 1];
      const after = i + upperKw.length >= upperSql.length ? ' ' : upperSql[i + upperKw.length];
      if (!/[A-Z0-9_]/.test(before) && !/[A-Z0-9_]/.test(after)) {
        return i;
      }
    }
  }
  return -1;
}

function buildTableLookups(store: TableStore) {
  const tableLookup = new Map<string, string>(
    Object.keys(store).map((name) => [name.toLowerCase(), name])
  );
  const columnLookup = new Map<string, Map<string, string>>();
  for (const [tableName, rows] of Object.entries(store)) {
    const colMap = new Map<string, string>();
    const sample = rows[0] ?? {};
    for (const col of Object.keys(sample)) {
      colMap.set(col.toLowerCase(), col);
    }
    columnLookup.set(tableName, colMap);
  }
  return { tableLookup, columnLookup };
}

function resolveTableName(rawName: string, tableLookup: Map<string, string>): string | null {
  const cleaned = rawName.replace(/[`\[\]]/g, '').trim().toLowerCase();
  return tableLookup.get(cleaned) ?? null;
}

function resolveColumnReference(
  ref: string,
  activeTables: { table: string; alias: string }[],
  columnLookup: Map<string, Map<string, string>>
): { key: string; displayName: string } | null {
  const cleaned = ref.replace(/[`\[\]]/g, '').trim();
  if (cleaned === '*') return { key: '*', displayName: '*' };

  const dotIdx = cleaned.indexOf('.');
  if (dotIdx !== -1) {
    const qualifier = cleaned.slice(0, dotIdx).trim().toLowerCase();
    const colPart = cleaned.slice(dotIdx + 1).trim().toLowerCase();
    const target = activeTables.find(
      (t) => t.alias.toLowerCase() === qualifier || t.table.toLowerCase() === qualifier
    );
    if (!target) return null;
    const actualCol = columnLookup.get(target.table)?.get(colPart);
    if (!actualCol) return null;
    return {
      key: `${target.alias}.${actualCol}`,
      displayName: actualCol,
    };
  }

  const colLower = cleaned.toLowerCase();
  for (const t of activeTables) {
    const actualCol = columnLookup.get(t.table)?.get(colLower);
    if (actualCol) {
      return {
        key: `${t.alias}.${actualCol}`,
        displayName: actualCol,
      };
    }
  }
  return null;
}

function buildDiagnosticsResponse(
  request: AnalyzeQueryRequest,
  status: AnalyzeQueryResponse['status'],
  diagnostics: QueryDiagnostic[],
  explanation: string,
  concepts: QueryConcept[] = [],
  breakdown: QueryBreakdownItem[] = []
): AnalyzeQueryResponse {
  return {
    status,
    queryId: `q-${Date.now()}`,
    datasetId: request.datasetId,
    dialect: request.dialect,
    concepts,
    explanation,
    breakdown,
    diagnostics,
  };
}

function parseLiteral(token: string): ResultCell {
  const t = token.trim();
  if (/^NULL$/i.test(t)) return null;
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
    return t.slice(1, -1);
  }
  const num = Number(t);
  if (!Number.isNaN(num)) return num;
  return t;
}

function evaluateScalarExpr(
  expr: string,
  row: Record<string, ResultCell>,
  activeTables: { table: string; alias: string }[],
  columnLookup: Map<string, Map<string, string>>
): ResultCell {
  const trimmed = expr.trim();

  // CASE WHEN ... THEN ... ELSE ... END
  const caseMatch = trimmed.match(/^CASE\s+(.+?)\s+END$/i);
  if (caseMatch) {
    const body = caseMatch[1].trim();
    const elseSplit = body.split(/\bELSE\b/i);
    const whenPart = elseSplit[0] ?? '';
    const elseVal = elseSplit[1] ? parseLiteral(elseSplit[1].trim()) : null;
    const branches = whenPart.split(/\bWHEN\b/i).map((b) => b.trim()).filter(Boolean);
    for (const branch of branches) {
      const thenSplit = branch.split(/\bTHEN\b/i);
      if (thenSplit.length === 2) {
        const cond = thenSplit[0].trim();
        const resultExpr = thenSplit[1].trim();
        if (evaluateWhere(cond, row, activeTables, columnLookup, MOCK_TABLES)) {
          return parseLiteral(resultExpr);
        }
      }
    }
    return elseVal;
  }

  // Scalar functions: UPPER, LOWER, LENGTH, LEN, ROUND, YEAR, MONTH, DAY, COALESCE, IFNULL, ISNULL, CONCAT
  const fnMatch = trimmed.match(/^([a-zA-Z_]+)\s*\((.+)\)$/);
  if (fnMatch) {
    const fn = fnMatch[1].toUpperCase();
    const args = splitTopLevelCommas(fnMatch[2]);
    const evalArg = (a: string): ResultCell => {
      const s = a.trim();
      if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"')) || /^NULL$/i.test(s) || !Number.isNaN(Number(s))) {
        return parseLiteral(s);
      }
      // Simple division like Salary / 1000
      const divMatch = s.match(/^([a-zA-Z0-9_.]+)\s*\/\s*(\d+(?:\.\d+)?)$/);
      if (divMatch) {
        const res = resolveColumnReference(divMatch[1], activeTables, columnLookup);
        const v = res ? Number(row[res.key]) : NaN;
        return Number.isNaN(v) ? null : v / Number(divMatch[2]);
      }
      const resolved = resolveColumnReference(s, activeTables, columnLookup);
      if (resolved) return row[resolved.key] ?? null;
      return evaluateScalarExpr(s, row, activeTables, columnLookup);
    };

    const vals = args.map(evalArg);
    if (fn === 'UPPER') return vals[0] !== null ? String(vals[0]).toUpperCase() : null;
    if (fn === 'LOWER') return vals[0] !== null ? String(vals[0]).toLowerCase() : null;
    if (fn === 'LENGTH' || fn === 'LEN') return vals[0] !== null ? String(vals[0]).length : null;
    if (fn === 'CONCAT') return vals.map((v) => (v === null ? '' : String(v))).join('');
    if (fn === 'ROUND') {
      const num = Number(vals[0]);
      const digits = Number(vals[1] ?? 0);
      return Number.isNaN(num) ? null : Number(num.toFixed(digits));
    }
    if (fn === 'YEAR' && vals[0]) {
      const m = String(vals[0]).match(/^(\d{4})-/);
      return m ? Number(m[1]) : null;
    }
    if (fn === 'MONTH' && vals[0]) {
      const m = String(vals[0]).match(/^\d{4}-(\d{2})-/);
      return m ? Number(m[1]) : null;
    }
    if (fn === 'DAY' && vals[0]) {
      const m = String(vals[0]).match(/^\d{4}-\d{2}-(\d{2})/);
      return m ? Number(m[1]) : null;
    }
    if (fn === 'COALESCE' || fn === 'IFNULL' || fn === 'ISNULL') {
      for (const v of vals) {
        if (v !== null && v !== undefined) return v;
      }
      return null;
    }
  }

  // Literal or column reference
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || !Number.isNaN(Number(trimmed))) {
    return parseLiteral(trimmed);
  }
  const resolved = resolveColumnReference(trimmed, activeTables, columnLookup);
  if (resolved) return row[resolved.key] ?? null;
  return null;
}

function evaluateSinglePredicate(
  pred: string,
  row: Record<string, ResultCell>,
  activeTables: { table: string; alias: string }[],
  columnLookup: Map<string, Map<string, string>>,
  store: TableStore
): boolean {
  const p = pred.trim();

  // EXISTS / NOT EXISTS (SELECT ...)
  const existsMatch = p.match(/^(NOT\s+)?EXISTS\s*\((SELECT\s+.+)\)$/i);
  if (existsMatch) {
    const innerSql = existsMatch[2].trim();
    // Substitute outer references like s.StudentID with current row's literal value
    let substituted = innerSql;
    for (const [k, v] of Object.entries(row)) {
      const escapedKey = k.replace('.', '\\.');
      const literalVal = typeof v === 'string' ? `'${v}'` : v === null ? 'NULL' : String(v);
      substituted = substituted.replace(new RegExp(`\\b${escapedKey}\\b`, 'gi'), literalVal);
    }
    const innerResult = executeSelectQuery(substituted, 'mysql', DEFAULT_DATASET_ID, store);
    const hasRows = (innerResult?.rows.length ?? 0) > 0;
    return existsMatch[1] ? !hasRows : hasRows;
  }

  const nullMatch = p.match(/^([a-zA-Z0-9_.]+)\s+IS\s+(NOT\s+)?NULL$/i);
  if (nullMatch) {
    const resolved = resolveColumnReference(nullMatch[1], activeTables, columnLookup);
    if (!resolved) return false;
    const val = row[resolved.key];
    return nullMatch[2] ? val !== null && val !== undefined : val === null || val === undefined;
  }

  const betweenMatch = p.match(/^([a-zA-Z0-9_.]+)\s+BETWEEN\s+(.+?)\s+AND\s+(.+)$/i);
  if (betweenMatch) {
    const resolved = resolveColumnReference(betweenMatch[1], activeTables, columnLookup);
    if (!resolved) return false;
    const val = row[resolved.key];
    const low = parseLiteral(betweenMatch[2]);
    const high = parseLiteral(betweenMatch[3]);
    if (typeof val === 'number' && typeof low === 'number' && typeof high === 'number') {
      return val >= low && val <= high;
    }
    return String(val) >= String(low) && String(val) <= String(high);
  }

  // IN (SELECT ...) or IN (10, 20)
  const inSubMatch = p.match(/^([a-zA-Z0-9_.]+)\s+(NOT\s+)?IN\s*\((SELECT\s+.+)\)$/i);
  if (inSubMatch) {
    const resolved = resolveColumnReference(inSubMatch[1], activeTables, columnLookup);
    if (!resolved) return false;
    const val = row[resolved.key];
    const subRes = executeSelectQuery(inSubMatch[3], 'mysql', DEFAULT_DATASET_ID, store);
    const items = (subRes?.rows ?? []).map((r) => r[0]);
    const matched = items.some((item) => item === val);
    return inSubMatch[2] ? !matched : matched;
  }

  const inMatch = p.match(/^([a-zA-Z0-9_.]+)\s+(NOT\s+)?IN\s*\((.+)\)$/i);
  if (inMatch) {
    const resolved = resolveColumnReference(inMatch[1], activeTables, columnLookup);
    if (!resolved) return false;
    const val = row[resolved.key];
    const items = splitTopLevelCommas(inMatch[3]).map(parseLiteral);
    const matched = items.some((item) => item === val);
    return inMatch[2] ? !matched : matched;
  }

  const likeMatch = p.match(/^([a-zA-Z0-9_.]+)\s+(NOT\s+)?LIKE\s+(['"].+['"])$/i);
  if (likeMatch) {
    const resolved = resolveColumnReference(likeMatch[1], activeTables, columnLookup);
    if (!resolved) return false;
    const val = row[resolved.key];
    if (val === null || val === undefined) return false;
    const pattern = String(parseLiteral(likeMatch[3]));
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexStr = '^' + escaped.replace(/%/g, '.*').replace(/_/g, '.') + '$';
    const matched = new RegExp(regexStr, 'i').test(String(val));
    return likeMatch[2] ? !matched : matched;
  }

  // Scalar subquery comparison: col > (SELECT AVG(CGPA) FROM Student)
  const scalarSubCmp = p.match(/^([a-zA-Z0-9_.]+)\s*(=|!=|<>|>=|<=|>|<)\s*\((SELECT\s+.+)\)$/i);
  if (scalarSubCmp) {
    const resolved = resolveColumnReference(scalarSubCmp[1], activeTables, columnLookup);
    if (!resolved) return false;
    const leftVal = row[resolved.key];
    const subRes = executeSelectQuery(scalarSubCmp[3], 'mysql', DEFAULT_DATASET_ID, store);
    const rightVal = subRes?.rows[0]?.[0] ?? null;
    if (leftVal === null || leftVal === undefined || rightVal === null) return false;
    const op = scalarSubCmp[2];
    if (op === '=') return leftVal === rightVal;
    if (op === '!=' || op === '<>') return leftVal !== rightVal;
    if (op === '>') return leftVal > rightVal;
    if (op === '>=') return leftVal >= rightVal;
    if (op === '<') return leftVal < rightVal;
    if (op === '<=') return leftVal <= rightVal;
  }

  const cmpMatch = p.match(/^([a-zA-Z0-9_.]+)\s*(=|!=|<>|>=|<=|>|<)\s*(.+)$/);
  if (cmpMatch) {
    const resolved = resolveColumnReference(cmpMatch[1], activeTables, columnLookup);
    if (!resolved) return false;
    const leftVal = row[resolved.key];
    const op = cmpMatch[2];
    const rightVal = parseLiteral(cmpMatch[3]);

    if (leftVal === null || leftVal === undefined || rightVal === null) return false;
    switch (op) {
      case '=':
        return leftVal === rightVal;
      case '!=':
      case '<>':
        return leftVal !== rightVal;
      case '>':
        return leftVal > rightVal;
      case '>=':
        return leftVal >= rightVal;
      case '<':
        return leftVal < rightVal;
      case '<=':
        return leftVal <= rightVal;
      default:
        return false;
    }
  }

  return true;
}

function evaluateWhere(
  whereClause: string,
  row: Record<string, ResultCell>,
  activeTables: { table: string; alias: string }[],
  columnLookup: Map<string, Map<string, string>>,
  store: TableStore
): boolean {
  const orBranches = whereClause.split(/\s+OR\s+/i);
  return orBranches.some((branch) => {
    const protectedBranch = branch.replace(
      /\bBETWEEN\s+([^\s]+)\s+AND\s+([^\s]+)/gi,
      'BETWEEN $1__BETWEEN_AND__$2'
    );
    const andParts = protectedBranch
      .split(/\s+AND\s+/i)
      .map((part) => part.replace('__BETWEEN_AND__', ' AND '));
    return andParts.every((p) => evaluateSinglePredicate(p, row, activeTables, columnLookup, store));
  });
}

function computeAggregate(
  fn: string,
  colRef: string,
  rows: Record<string, ResultCell>[],
  activeTables: { table: string; alias: string }[],
  columnLookup: Map<string, Map<string, string>>
): ResultCell {
  const upperFn = fn.toUpperCase();
  if (upperFn === 'COUNT' && colRef.trim() === '*') {
    return rows.length;
  }
  const resolved = resolveColumnReference(colRef, activeTables, columnLookup);
  if (!resolved) return null;

  const nonNullVals = rows
    .map((r) => r[resolved.key])
    .filter((v): v is string | number | boolean => v !== null && v !== undefined);

  if (upperFn === 'COUNT') return nonNullVals.length;
  if (nonNullVals.length === 0) return null;

  const numericVals = nonNullVals.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
  if (upperFn === 'SUM') {
    const sum = numericVals.reduce((acc, n) => acc + n, 0);
    return Number(sum.toFixed(2));
  }
  if (upperFn === 'AVG') {
    const avg = numericVals.reduce((acc, n) => acc + n, 0) / numericVals.length;
    return Number(avg.toFixed(2));
  }
  if (upperFn === 'MIN') {
    return numericVals.length === nonNullVals.length
      ? Math.min(...numericVals)
      : nonNullVals.map(String).sort()[0];
  }
  if (upperFn === 'MAX') {
    return numericVals.length === nonNullVals.length
      ? Math.max(...numericVals)
      : nonNullVals.map(String).sort().slice(-1)[0];
  }
  return null;
}

// Resolve CTEs (including WITH RECURSIVE) into an augmented TableStore
function resolveCtesIfPresent(
  sql: string,
  dialect: SqlDialect,
  datasetId: string
): { mainQuery: string; store: TableStore; cteNames: string[]; isRecursive: boolean } {
  const store: TableStore = { ...MOCK_TABLES };
  const trimmed = stripTrailingSemicolon(sql);
  if (!/^WITH\b/i.test(trimmed)) {
    return { mainQuery: trimmed, store, cteNames: [], isRecursive: false };
  }

  let cursor = trimmed.replace(/^WITH\s+/i, '').trim();
  let isRecursive = false;
  if (/^RECURSIVE\b/i.test(cursor)) {
    isRecursive = true;
    cursor = cursor.replace(/^RECURSIVE\s+/i, '').trim();
  }

  const cteNames: string[] = [];
  while (true) {
    const nameMatch = cursor.match(/^([a-zA-Z0-9_]+)\s+AS\s*\(/i);
    if (!nameMatch) break;
    const cteName = nameMatch[1];
    let depth = 0;
    let openIdx = cursor.indexOf('(');
    let closeIdx = -1;
    for (let i = openIdx; i < cursor.length; i += 1) {
      if (cursor[i] === '(') depth += 1;
      else if (cursor[i] === ')') {
        depth -= 1;
        if (depth === 0) {
          closeIdx = i;
          break;
        }
      }
    }
    if (closeIdx === -1) break;
    const cteBody = cursor.slice(openIdx + 1, closeIdx).trim();
    cteNames.push(cteName);

    // Check if recursive (UNION ALL referencing cteName)
    const unionIdx = findTopLevelKeyword(cteBody, 'UNION ALL');
    if (unionIdx !== -1 && new RegExp(`\\b${cteName}\\b`, 'i').test(cteBody.slice(unionIdx))) {
      isRecursive = true;
      const anchorSql = cteBody.slice(0, unionIdx).trim();
      const recSql = cteBody.slice(unionIdx + 'UNION ALL'.length).trim();
      const anchorRes = executeSelectQuery(anchorSql, dialect, datasetId, store);
      const accumulated: Record<string, ResultCell>[] = [];
      let frontier: Record<string, ResultCell>[] = (anchorRes?.rows ?? []).map((r) => {
        const obj: Record<string, ResultCell> = {};
        (anchorRes?.columns ?? []).forEach((c, idx) => {
          obj[c.name] = r[idx] ?? null;
        });
        return obj;
      });
      accumulated.push(...frontier);

      let guard = 0;
      while (frontier.length > 0 && guard < 12) {
        guard += 1;
        const iterStore: TableStore = { ...store, [cteName]: frontier };
        const stepRes = executeSelectQuery(recSql, dialect, datasetId, iterStore);
        const nextRows: Record<string, ResultCell>[] = (stepRes?.rows ?? []).map((r) => {
          const obj: Record<string, ResultCell> = {};
          (stepRes?.columns ?? []).forEach((c, idx) => {
            obj[c.name] = r[idx] ?? null;
          });
          return obj;
        });
        if (nextRows.length === 0) break;
        accumulated.push(...nextRows);
        frontier = nextRows;
      }
      store[cteName] = accumulated;
    } else {
      const cteRes = executeSelectQuery(cteBody, dialect, datasetId, store);
      store[cteName] = (cteRes?.rows ?? []).map((r) => {
        const obj: Record<string, ResultCell> = {};
        (cteRes?.columns ?? []).forEach((c, idx) => {
          obj[c.name] = r[idx] ?? null;
        });
        return obj;
      });
    }

    cursor = cursor.slice(closeIdx + 1).trim();
    if (cursor.startsWith(',')) {
      cursor = cursor.slice(1).trim();
    } else {
      break;
    }
  }

  return { mainQuery: cursor, store, cteNames, isRecursive };
}

function analyzeAndParse(request: AnalyzeQueryRequest): {
  response: AnalyzeQueryResponse;
  parsed?: ParsedSelectQuery;
  store?: TableStore;
  cteNames?: string[];
  isRecursive?: boolean;
} {
  const raw = request.query ?? '';
  const trimmed = raw.trim();

  if (!trimmed) {
    return {
      response: buildDiagnosticsResponse(
        request,
        'incomplete',
        [
          {
            code: 'EMPTY_QUERY',
            message: 'Start typing a SELECT query or load an example from any of the 32 lessons.',
            severity: 'info',
          },
        ],
        'Waiting for a SQL query.'
      ),
    };
  }

  const withoutEndSemi = stripTrailingSemicolon(trimmed);
  const firstWord = withoutEndSemi.replace(/\s+/g, ' ').trim().split(/\s+/)[0]?.toUpperCase() ?? '';

  // Sandbox Explanation Mode for DDL, DML, and Transaction control statements
  if (['CREATE', 'ALTER', 'DROP', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'BEGIN', 'START', 'COMMIT', 'ROLLBACK'].includes(firstWord)) {
    const concepts: QueryConcept[] = [];
    const breakdown: QueryBreakdownItem[] = [];

    if (firstWord === 'CREATE') {
      concepts.push({ id: 'data-types-ddl', label: 'DDL / CREATE', topicSlug: 'data-types-ddl' });
      if (/PRIMARY\s+KEY/i.test(withoutEndSemi)) concepts.push({ id: 'primary-key', label: 'PRIMARY KEY', topicSlug: 'primary-key' });
      if (/FOREIGN\s+KEY/i.test(withoutEndSemi)) concepts.push({ id: 'foreign-key', label: 'FOREIGN KEY', topicSlug: 'foreign-key' });
      if (/CASCADE/i.test(withoutEndSemi)) concepts.push({ id: 'cascade', label: 'CASCADE', topicSlug: 'cascade' });
      if (/VIEW/i.test(withoutEndSemi)) concepts.push({ id: 'views', label: 'CREATE VIEW', topicSlug: 'views' });
      if (/TRIGGER|PROCEDURE/i.test(withoutEndSemi)) {
        concepts.push({ id: 'stored-procedures-triggers', label: 'PROCEDURE / TRIGGER', topicSlug: 'stored-procedures-triggers' });
      }
      breakdown.push({
        id: 'ddl-stmt',
        sourceText: withoutEndSemi.split('\n')[0] ?? withoutEndSemi,
        title: 'Schema / Object Definition',
        explanation: 'Defines database structure, integrity constraints, or procedural logic.',
      });
    } else if (['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'].includes(firstWord)) {
      concepts.push({ id: 'dml-mutations', label: `DML / ${firstWord}`, topicSlug: 'dml-mutations' });
      breakdown.push({
        id: 'dml-stmt',
        sourceText: withoutEndSemi,
        title: `${firstWord} Data Mutation`,
        explanation: /WHERE/i.test(withoutEndSemi)
          ? 'Modifies only rows matching the WHERE filter.'
          : 'Warning: Without a WHERE clause, this statement affects every row in the table.',
      });
    } else {
      concepts.push({ id: 'transactions-acid', label: 'TRANSACTION / ACID', topicSlug: 'transactions-acid' });
      breakdown.push({
        id: 'tx-stmt',
        sourceText: withoutEndSemi,
        title: 'Atomic Transaction Control',
        explanation: 'Groups statements into an all-or-nothing ACID unit with COMMIT or ROLLBACK recovery.',
      });
    }

    return {
      response: buildDiagnosticsResponse(
        request,
        'unsupported',
        [
          {
            code: 'SANDBOX_READ_ONLY_MODE',
            message:
              'Sandbox Inspection Mode: Clause breakdown is active above, while live execution is restricted to read-only SELECT and EXPLAIN queries.',
            severity: 'warning',
          },
        ],
        `Parsed ${firstWord} statement in Read-Only Sandbox Inspection Mode.`,
        concepts,
        breakdown
      ),
    };
  }

  // Multi-statement check for non-transaction queries
  if (withoutEndSemi.includes(';')) {
    return {
      response: buildDiagnosticsResponse(
        request,
        'unsupported',
        [
          {
            code: 'MULTIPLE_STATEMENTS',
            message: 'Only one SQL query is allowed at a time.',
            severity: 'error',
          },
        ],
        'Multiple statements are blocked.'
      ),
    };
  }

  // Handle CTE wrapper if present
  const { mainQuery, store, cteNames, isRecursive } = resolveCtesIfPresent(
    withoutEndSemi,
    request.dialect,
    request.datasetId
  );
  const { tableLookup, columnLookup } = buildTableLookups(store);

  const normalized = mainQuery.replace(/\s+/g, ' ').trim();
  let isExplain = false;
  let working = normalized;

  if (/^EXPLAIN\s+/i.test(working)) {
    isExplain = true;
    working = working.replace(/^EXPLAIN\s+/i, '').trim();
  }

  const startWord = working.split(/\s+/)[0]?.toUpperCase() ?? '';
  if (startWord !== 'SELECT') {
    return {
      response: buildDiagnosticsResponse(
        request,
        'syntax_error',
        [
          {
            code: 'EXPECTED_SELECT',
            message: 'Queries must start with SELECT, WITH, or EXPLAIN.',
            severity: 'error',
          },
        ],
        'Expected a SELECT statement.'
      ),
    };
  }

  if (/(SELECT|FROM|WHERE|AND|OR|ORDER BY|GROUP BY|HAVING|JOIN|ON|IN|BETWEEN|LIKE|UNION|INTERSECT|EXCEPT)$/i.test(working)) {
    return {
      response: buildDiagnosticsResponse(
        request,
        'incomplete',
        [
          {
            code: 'INCOMPLETE_CLAUSE',
            message: 'Query ends mid-clause. Complete the table, column, or condition.',
            severity: 'info',
          },
        ],
        'Query is still incomplete.'
      ),
    };
  }

  // Check for top-level Set Operations (UNION ALL, UNION, INTERSECT, EXCEPT)
  for (const setOp of ['UNION ALL', 'UNION', 'INTERSECT', 'EXCEPT']) {
    const idx = findTopLevelKeyword(working, setOp);
    if (idx !== -1) {
      const leftSql = working.slice(0, idx).trim();
      const rightSql = working.slice(idx + setOp.length).trim();
      const leftCheck = analyzeAndParse({ ...request, query: leftSql });
      if (leftCheck.response.status !== 'valid') return leftCheck;
      const rightCheck = analyzeAndParse({ ...request, query: rightSql });
      if (rightCheck.response.status !== 'valid') return rightCheck;

      return {
        store,
        cteNames,
        isRecursive,
        parsed: {
          raw,
          normalized: working,
          dialect: request.dialect,
          datasetId: request.datasetId,
          isExplain,
          distinct: false,
          topCount: null,
          limitCount: null,
          selectExprs: ['*'],
          baseTable: '__SET_OP__',
          baseAlias: setOp,
          joins: [],
          whereClause: null,
          groupByCols: [],
          havingClause: null,
          orderBy: null,
        },
        response: {
          status: 'valid',
          queryId: `q-${Date.now()}`,
          datasetId: request.datasetId,
          dialect: request.dialect,
          concepts: [
            { id: 'select', label: 'SELECT', topicSlug: 'select' },
            { id: 'set-operations', label: setOp, topicSlug: 'set-operations' },
          ],
          explanation: `Combines two SELECT result sets vertically using ${setOp}.`,
          breakdown: [
            {
              id: 'set-left',
              sourceText: leftSql,
              title: 'Top query branch',
              explanation: 'Evaluates the first SELECT result set.',
            },
            {
              id: 'set-op',
              sourceText: setOp,
              title: `Apply ${setOp}`,
              explanation:
                setOp === 'UNION'
                  ? 'Stacks both outputs and removes duplicate rows.'
                  : setOp === 'UNION ALL'
                    ? 'Concatenates all rows from both outputs.'
                    : setOp === 'INTERSECT'
                      ? 'Keeps only rows present in both outputs.'
                      : 'Keeps rows from the top query absent in the bottom query.',
            },
            {
              id: 'set-right',
              sourceText: rightSql,
              title: 'Bottom query branch',
              explanation: 'Evaluates the second SELECT result set.',
            },
          ],
          diagnostics: [],
        },
      };
    }
  }

  // Extract LIMIT (MySQL) vs TOP (T-SQL)
  let limitCount: number | null = null;
  let topCount: number | null = null;

  const limitMatch = working.match(/\bLIMIT\s+(\d+)\s*$/i);
  if (limitMatch) {
    if (request.dialect === 'tsql') {
      return {
        response: buildDiagnosticsResponse(
          request,
          'syntax_error',
          [
            {
              code: 'DIALECT_LIMIT_IN_TSQL',
              message: `T-SQL does not support LIMIT ${limitMatch[1]}. Use SELECT TOP ${limitMatch[1]} ... instead.`,
              severity: 'error',
            },
          ],
          'Invalid LIMIT clause for T-SQL dialect.'
        ),
      };
    }
    limitCount = Number(limitMatch[1]);
    working = working.slice(0, limitMatch.index).trim();
  }

  const topMatch = working.match(/^SELECT\s+TOP\s+(\d+)\s+/i);
  if (topMatch) {
    if (request.dialect === 'mysql') {
      return {
        response: buildDiagnosticsResponse(
          request,
          'syntax_error',
          [
            {
              code: 'DIALECT_TOP_IN_MYSQL',
              message: `MySQL does not support SELECT TOP ${topMatch[1]}. Use LIMIT ${topMatch[1]} at the end instead.`,
              severity: 'error',
            },
          ],
          'Invalid TOP clause for MySQL dialect.'
        ),
      };
    }
    topCount = Number(topMatch[1]);
    working = `SELECT ${working.slice(topMatch[0].length)}`;
  }

  let distinct = false;
  if (/^SELECT\s+DISTINCT\s+/i.test(working)) {
    distinct = true;
    working = working.replace(/^SELECT\s+DISTINCT\s+/i, 'SELECT ');
  }

  // Locate top-level FROM
  const fromIdx = findTopLevelKeyword(working, 'FROM');
  if (fromIdx === -1) {
    const emptySelect = /^SELECT\s+FROM\b/i.test(working);
    return {
      response: buildDiagnosticsResponse(
        request,
        'syntax_error',
        [
          {
            code: emptySelect ? 'MISSING_SELECT_LIST' : 'MISSING_FROM_CLAUSE',
            message: emptySelect
              ? 'Specify at least one column or * between SELECT and FROM.'
              : 'Include a FROM <table> clause specifying which table to read.',
            severity: 'error',
          },
        ],
        'Syntax error in SELECT / FROM structure.'
      ),
    };
  }

  const selectPart = working.slice('SELECT'.length, fromIdx).trim();
  if (!selectPart) {
    return {
      response: buildDiagnosticsResponse(
        request,
        'syntax_error',
        [
          {
            code: 'MISSING_SELECT_LIST',
            message: 'Specify at least one column or * between SELECT and FROM.',
            severity: 'error',
          },
        ],
        'Missing projection list in SELECT.'
      ),
    };
  }

  let rest = working.slice(fromIdx + 'FROM'.length).trim();

  // Extract top-level ORDER BY, HAVING, GROUP BY, WHERE in reverse order
  let orderBy: ParsedSelectQuery['orderBy'] = null;
  const orderIdx = findTopLevelKeyword(rest, 'ORDER BY');
  if (orderIdx !== -1) {
    const orderStr = rest.slice(orderIdx + 'ORDER BY'.length).trim();
    const m = orderStr.match(/^([a-zA-Z0-9_.]+)(?:\s+(ASC|DESC))?$/i);
    if (m) {
      orderBy = { column: m[1], direction: m[2]?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC' };
    }
    rest = rest.slice(0, orderIdx).trim();
  }

  let havingClause: string | null = null;
  const havingIdx = findTopLevelKeyword(rest, 'HAVING');
  if (havingIdx !== -1) {
    havingClause = rest.slice(havingIdx + 'HAVING'.length).trim();
    rest = rest.slice(0, havingIdx).trim();
  }

  let groupByCols: string[] = [];
  const groupIdx = findTopLevelKeyword(rest, 'GROUP BY');
  if (groupIdx !== -1) {
    groupByCols = splitTopLevelCommas(rest.slice(groupIdx + 'GROUP BY'.length).trim());
    rest = rest.slice(0, groupIdx).trim();
  }

  let whereClause: string | null = null;
  const whereIdx = findTopLevelKeyword(rest, 'WHERE');
  if (whereIdx !== -1) {
    whereClause = rest.slice(whereIdx + 'WHERE'.length).trim();
    rest = rest.slice(0, whereIdx).trim();
  }

  // Parse FROM + JOINs
  const joins: ParsedJoin[] = [];
  let baseTableToken = '';
  let baseAlias = '';

  const joinSplitRegex = /\b(INNER\s+JOIN|LEFT\s+(?:OUTER\s+)?JOIN|RIGHT\s+(?:OUTER\s+)?JOIN|FULL\s+(?:OUTER\s+)?JOIN|CROSS\s+JOIN|JOIN)\b/i;
  if (joinSplitRegex.test(rest)) {
    const tokens = rest.split(joinSplitRegex);
    const baseSpec = tokens[0].trim().split(/\s+/);
    baseTableToken = baseSpec[0] ?? '';
    baseAlias = baseSpec[1] && baseSpec[1].toUpperCase() !== 'AS' ? baseSpec[1] : baseSpec[2] ?? baseTableToken;

    for (let i = 1; i < tokens.length; i += 2) {
      const joinKeyword = tokens[i].toUpperCase();
      const joinBody = (tokens[i + 1] ?? '').trim();
      if (joinKeyword.startsWith('FULL') && request.dialect === 'mysql') {
        return {
          response: buildDiagnosticsResponse(
            request,
            'syntax_error',
            [
              {
                code: 'DIALECT_FULL_JOIN_IN_MYSQL',
                message: 'MySQL does not support FULL OUTER JOIN directly. Switch to T-SQL or combine LEFT JOIN + RIGHT JOIN with UNION.',
                severity: 'error',
              },
            ],
            'FULL OUTER JOIN is not supported natively in MySQL.'
          ),
        };
      }

      if (joinKeyword.startsWith('CROSS')) {
        const jParts = joinBody.split(/\s+/);
        const jTable = jParts[0] ?? '';
        const jAlias = jParts[1] && jParts[1].toUpperCase() !== 'AS' ? jParts[1] : jParts[2] ?? jTable;
        joins.push({ type: 'CROSS', table: jTable, alias: jAlias });
      } else {
        const onMatch = joinBody.match(/^(.+?)\s+ON\s+([a-zA-Z0-9_.]+)\s*=\s*([a-zA-Z0-9_.]+)$/i);
        if (!onMatch) {
          return {
            response: buildDiagnosticsResponse(
              request,
              'syntax_error',
              [
                {
                  code: 'MISSING_JOIN_ON',
                  message: 'JOIN requires an ON left.key = right.key condition.',
                  severity: 'error',
                },
              ],
              'Missing ON condition in JOIN clause.'
            ),
          };
        }
        const jParts = onMatch[1].trim().split(/\s+/);
        const jTable = jParts[0] ?? '';
        const jAlias = jParts[1] && jParts[1].toUpperCase() !== 'AS' ? jParts[1] : jParts[2] ?? jTable;
        const jType: ParsedJoin['type'] = joinKeyword.startsWith('LEFT')
          ? 'LEFT'
          : joinKeyword.startsWith('RIGHT')
            ? 'RIGHT'
            : joinKeyword.startsWith('FULL')
              ? 'FULL'
              : 'INNER';
        joins.push({
          type: jType,
          table: jTable,
          alias: jAlias,
          leftKey: onMatch[2],
          rightKey: onMatch[3],
        });
      }
    }
  } else {
    const baseSpec = rest.split(/\s+/);
    baseTableToken = baseSpec[0] ?? '';
    baseAlias = baseSpec[1] && baseSpec[1].toUpperCase() !== 'AS' ? baseSpec[1] : baseSpec[2] ?? baseTableToken;
  }

  const resolvedBase = resolveTableName(baseTableToken, tableLookup);
  if (!resolvedBase) {
    return {
      response: buildDiagnosticsResponse(
        request,
        'semantic_error',
        [
          {
            code: 'UNKNOWN_TABLE',
            message: `Table or view "${baseTableToken}" does not exist in ${request.datasetId}.`,
            severity: 'error',
          },
        ],
        `Unknown table "${baseTableToken}".`
      ),
    };
  }

  const activeTables: { table: string; alias: string }[] = [
    { table: resolvedBase, alias: baseAlias || resolvedBase },
  ];

  for (const j of joins) {
    const resolvedJoin = resolveTableName(j.table, tableLookup);
    if (!resolvedJoin) {
      return {
        response: buildDiagnosticsResponse(
          request,
          'semantic_error',
          [
            {
              code: 'UNKNOWN_TABLE',
              message: `Joined table "${j.table}" does not exist in ${request.datasetId}.`,
              severity: 'error',
            },
          ],
          `Unknown joined table "${j.table}".`
        ),
      };
    }
    j.table = resolvedJoin;
    if (!j.alias) j.alias = resolvedJoin;
    activeTables.push({ table: resolvedJoin, alias: j.alias });
  }

  const selectExprs = splitTopLevelCommas(selectPart);
  const aggRegex = /^(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*([^)]+)\s*\)(?:\s+AS\s+([a-zA-Z0-9_]+))?$/i;
  const winRegex = /^(ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|FIRST_VALUE|SUM|AVG|COUNT)\s*\(\s*([^)]*)\s*\)\s*OVER\s*\(([^)]*)\)(?:\s+AS\s+([a-zA-Z0-9_]+))?$/i;

  // Validate simple column references in WHERE
  if (whereClause && !/EXISTS\s*\(/i.test(whereClause)) {
    const simplePredicates = whereClause.split(/\s+(?:AND|OR)\s+/i);
    for (const pred of simplePredicates) {
      const colMatch = pred.trim().match(/^([a-zA-Z0-9_.]+)\s+(?:IS\s+NOT\s+NULL|IS\s+NULL|NOT\s+LIKE|LIKE|NOT\s+IN|IN|BETWEEN|=|!=|<>|>=|<=|>|<)/i);
      if (colMatch) {
        const colName = colMatch[1];
        if (!resolveColumnReference(colName, activeTables, columnLookup)) {
          return {
            response: buildDiagnosticsResponse(
              request,
              'semantic_error',
              [
                {
                  code: 'UNKNOWN_COLUMN',
                  message: `Column "${colName}" in WHERE does not exist in ${activeTables.map((t) => t.table).join(', ')}.`,
                  severity: 'error',
                },
              ],
              `Unknown column "${colName}" in WHERE clause.`
            ),
          };
        }
      }
    }
  }

  // Validate plain column names in SELECT (skipping CASE, scalar functions, aggregates, windows, literals)
  for (const expr of selectExprs) {
    const cleanedExpr = expr.replace(/\s+AS\s+[a-zA-Z0-9_]+$/i, '').trim();
    if (
      cleanedExpr === '*' ||
      aggRegex.test(expr) ||
      winRegex.test(expr) ||
      /^CASE\b/i.test(cleanedExpr) ||
      /^[a-zA-Z_]+\s*\(/.test(cleanedExpr) ||
      /^['"0-9]/.test(cleanedExpr)
    ) {
      continue;
    }
    if (!resolveColumnReference(cleanedExpr, activeTables, columnLookup)) {
      return {
        response: buildDiagnosticsResponse(
          request,
          'semantic_error',
          [
            {
              code: 'UNKNOWN_COLUMN',
              message: `"${cleanedExpr}" is not a valid column in ${activeTables.map((t) => t.table).join(', ')}.`,
              severity: 'error',
            },
          ],
          `Unknown column "${cleanedExpr}".`
        ),
      };
    }
  }

  // Build Concepts & Clause Breakdown
  const concepts: QueryConcept[] = [{ id: 'select', label: 'SELECT', topicSlug: 'select' }];
  const breakdown: QueryBreakdownItem[] = [];

  if (isExplain) {
    concepts.push({ id: 'indexes-explain', label: 'EXPLAIN PLAN', topicSlug: 'indexes-explain' });
    breakdown.push({
      id: 'explain-clause',
      sourceText: 'EXPLAIN',
      title: 'Inspect query execution plan',
      explanation: 'Shows whether the optimizer uses a Primary Key index seek or a Full Table Scan.',
    });
  }

  if (cteNames.length > 0) {
    concepts.push({
      id: isRecursive ? 'recursive-ctes' : 'ctes',
      label: isRecursive ? 'RECURSIVE CTE' : 'WITH CTE',
      topicSlug: isRecursive ? 'recursive-ctes' : 'ctes',
    });
    breakdown.push({
      id: 'cte-clause',
      sourceText: `WITH ${cteNames.join(', ')}`,
      title: isRecursive ? 'Recursive CTE traversal' : 'Common Table Expression',
      explanation: isRecursive
        ? 'Iteratively expands the anchor row across hierarchical parent-child links.'
        : `Defines temporary named block(s) (${cteNames.join(', ')}) before the main SELECT.`,
    });
  }

  if (distinct) {
    concepts.push({ id: 'distinct-aliases', label: 'DISTINCT', topicSlug: 'distinct-aliases' });
  }

  breakdown.push({
    id: 'from-clause',
    sourceText: `FROM ${resolvedBase}`,
    title: 'Read source relation',
    explanation:
      resolvedBase === 'HonorStudents'
        ? 'Reads rows from the HonorStudents virtual view (Student rows with CGPA >= 3.50).'
        : `Reads rows from ${resolvedBase}.`,
  });

  if (resolvedBase === 'HonorStudents') {
    concepts.push({ id: 'views', label: 'VIEW', topicSlug: 'views' });
  }

  for (let idx = 0; idx < joins.length; idx += 1) {
    const j = joins[idx];
    if (j.type === 'CROSS') {
      concepts.push({ id: 'cross-product', label: 'CROSS JOIN', topicSlug: 'cross-product' });
      breakdown.push({
        id: `join-${idx}`,
        sourceText: `CROSS JOIN ${j.table}`,
        title: 'Cartesian product',
        explanation: `Pairs every left row with every row in ${j.table}.`,
      });
    } else if (j.table === resolvedBase) {
      concepts.push({ id: 'right-full-self-joins', label: 'SELF JOIN', topicSlug: 'right-full-self-joins' });
      breakdown.push({
        id: `join-${idx}`,
        sourceText: `${j.type} JOIN ${j.table} ${j.alias} ON ${j.leftKey} = ${j.rightKey}`,
        title: 'Self join table',
        explanation: `Joins ${j.table} to itself using alias ${j.alias} to follow hierarchical links.`,
      });
    } else if (j.type === 'RIGHT' || j.type === 'FULL') {
      concepts.push({ id: 'right-full-self-joins', label: `${j.type} JOIN`, topicSlug: 'right-full-self-joins' });
      breakdown.push({
        id: `join-${idx}`,
        sourceText: `${j.type} JOIN ${j.table} ON ${j.leftKey} = ${j.rightKey}`,
        title: `${j.type} outer join`,
        explanation: `Preserves unmatched ${j.type === 'RIGHT' ? 'right-side' : 'both-side'} rows with NULL padding.`,
      });
    } else {
      concepts.push({ id: 'joins', label: `${j.type} JOIN`, topicSlug: 'joins' });
      breakdown.push({
        id: `join-${idx}`,
        sourceText: `${j.type} JOIN ${j.table} ON ${j.leftKey} = ${j.rightKey}`,
        title: j.type === 'LEFT' ? 'Left outer join' : 'Inner join tables',
        explanation: `Matches rows where ${j.leftKey} = ${j.rightKey}.`,
      });
    }
  }

  if (whereClause) {
    concepts.push({ id: 'where', label: 'WHERE', topicSlug: 'where' });
    if (/\b(LIKE|IN|BETWEEN|IS\s+NULL|IS\s+NOT\s+NULL)\b/i.test(whereClause)) {
      concepts.push({
        id: 'pattern-range-filtering',
        label: 'LIKE / IN / BETWEEN / NULL',
        topicSlug: 'pattern-range-filtering',
      });
    }
    if (/\bEXISTS\s*\(/i.test(whereClause)) {
      concepts.push({
        id: 'correlated-subqueries-exists',
        label: 'EXISTS SUBQUERY',
        topicSlug: 'correlated-subqueries-exists',
      });
    } else if (/\(\s*SELECT\b/i.test(whereClause)) {
      concepts.push({
        id: 'scalar-in-subqueries',
        label: 'SUBQUERY',
        topicSlug: 'scalar-in-subqueries',
      });
    }
    breakdown.push({
      id: 'where-clause',
      sourceText: `WHERE ${whereClause}`,
      title: 'Filter candidate rows',
      explanation: `Keeps only rows satisfying ${whereClause}.`,
    });
  }

  if (/\bCASE\b/i.test(selectPart)) {
    concepts.push({ id: 'case-expressions', label: 'CASE WHEN', topicSlug: 'case-expressions' });
  }
  if (/\b(COALESCE|IFNULL|ISNULL)\s*\(/i.test(selectPart)) {
    concepts.push({ id: 'null-handling-functions', label: 'NULL HANDLING', topicSlug: 'null-handling-functions' });
  }
  if (/\b(YEAR|MONTH|DAY)\s*\(/i.test(selectPart)) {
    concepts.push({ id: 'date-time-functions', label: 'DATE FUNCTIONS', topicSlug: 'date-time-functions' });
  }
  if (/\b(UPPER|LOWER|LENGTH|LEN|ROUND|CONCAT)\s*\(/i.test(selectPart)) {
    concepts.push({ id: 'string-numeric-functions', label: 'SCALAR FUNCTIONS', topicSlug: 'string-numeric-functions' });
  }

  if (selectExprs.some((e) => winRegex.test(e))) {
    const isRanking = selectExprs.some((e) => /^(ROW_NUMBER|RANK|DENSE_RANK)\b/i.test(e));
    concepts.push({
      id: isRanking ? 'window-ranking' : 'window-value-frames',
      label: isRanking ? 'WINDOW RANKING' : 'WINDOW FRAME / OFFSET',
      topicSlug: isRanking ? 'window-ranking' : 'window-value-frames',
    });
  }

  if (selectExprs.some((e) => aggRegex.test(e))) {
    concepts.push({ id: 'aggregate-functions', label: 'AGGREGATES', topicSlug: 'aggregate-functions' });
  }

  if (groupByCols.length > 0 || havingClause) {
    concepts.push({
      id: 'group-by-having',
      label: havingClause ? 'GROUP BY & HAVING' : 'GROUP BY',
      topicSlug: 'group-by-having',
    });
    breakdown.push({
      id: 'group-by-clause',
      sourceText: havingClause ? `GROUP BY ${groupByCols.join(', ')} HAVING ${havingClause}` : `GROUP BY ${groupByCols.join(', ')}`,
      title: 'Group & filter buckets',
      explanation: `Groups rows by ${groupByCols.join(', ')}${havingClause ? ` and filters groups with ${havingClause}` : ''}.`,
    });
  }

  breakdown.push({
    id: 'select-clause',
    sourceText: `SELECT ${distinct ? 'DISTINCT ' : ''}${selectPart}`,
    title: 'Project output columns',
    explanation: `Projects ${selectExprs.join(', ')} into the output table.`,
  });

  if (orderBy) {
    concepts.push({ id: 'order-by', label: 'ORDER BY', topicSlug: 'order-by' });
    breakdown.push({
      id: 'order-by-clause',
      sourceText: `ORDER BY ${orderBy.column} ${orderBy.direction}`,
      title: 'Sort output rows',
      explanation: `Sorts rows by ${orderBy.column} (${orderBy.direction}).`,
    });
  }

  const cap = topCount ?? limitCount;
  if (cap !== null) {
    if (!concepts.some((c) => c.id === 'order-by')) {
      concepts.push({ id: 'order-by', label: request.dialect === 'tsql' ? 'TOP' : 'LIMIT', topicSlug: 'order-by' });
    }
    breakdown.push({
      id: 'limit-clause',
      sourceText: request.dialect === 'tsql' ? `TOP ${cap}` : `LIMIT ${cap}`,
      title: 'Cap returned rows',
      explanation: `Caps output to at most ${cap} row(s).`,
    });
  }

  const uniqueConcepts = Array.from(new Map(concepts.map((c) => [c.id, c])).values());

  return {
    store,
    cteNames,
    isRecursive,
    parsed: {
      raw,
      normalized: working,
      dialect: request.dialect,
      datasetId: request.datasetId,
      isExplain,
      distinct,
      topCount,
      limitCount,
      selectExprs,
      baseTable: resolvedBase,
      baseAlias: baseAlias || resolvedBase,
      joins,
      whereClause,
      groupByCols,
      havingClause,
      orderBy,
    },
    response: {
      status: 'valid',
      queryId: `q-${Date.now()}`,
      datasetId: request.datasetId,
      dialect: request.dialect,
      concepts: uniqueConcepts,
      explanation: `Valid ${request.dialect.toUpperCase()} query reading ${resolvedBase}${
        joins.length ? ` joined with ${joins.map((j) => j.table).join(', ')}` : ''
      }${whereClause ? ` filtered by ${whereClause}` : ''}.`,
      breakdown,
      diagnostics: [],
    },
  };
}

function executeSelectQuery(
  queryStr: string,
  dialect: SqlDialect,
  datasetId: string,
  customStore?: TableStore
): EvaluateQueryResponse | null {
  const analysis = analyzeAndParse({ query: queryStr, dialect, datasetId });
  if (analysis.response.status !== 'valid' || !analysis.parsed) return null;

  const parsed = analysis.parsed;
  const store = customStore ?? analysis.store ?? MOCK_TABLES;
  const { columnLookup } = buildTableLookups(store);

  // If EXPLAIN query, return simulated optimizer plan table
  if (parsed.isExplain) {
    const usesPk = Boolean(parsed.whereClause && /\b(StudentID|DepartmentID|CourseID|EnrollmentID|TeacherID)\s*=/i.test(parsed.whereClause));
    return {
      status: 'success',
      datasetId,
      dialect,
      columns: [
        { name: 'id', type: 'number' },
        { name: 'select_type', type: 'string' },
        { name: 'table', type: 'string' },
        { name: 'access_type', type: 'string' },
        { name: 'key_used', type: 'string' },
        { name: 'estimated_rows', type: 'number' },
      ],
      rows: [
        [
          1,
          'SIMPLE',
          parsed.baseTable,
          usesPk ? 'const (Index Seek)' : 'ALL (Full Table Scan)',
          usesPk ? 'PRIMARY' : 'NULL',
          usesPk ? 1 : (store[parsed.baseTable]?.length ?? 5),
        ],
      ],
      rowCount: 1,
    };
  }

  // Handle Set Operations (UNION, UNION ALL, INTERSECT, EXCEPT)
  if (parsed.baseTable === '__SET_OP__') {
    const setOp = parsed.baseAlias;
    const idx = findTopLevelKeyword(parsed.normalized, setOp);
    const leftRes = executeSelectQuery(parsed.normalized.slice(0, idx).trim(), dialect, datasetId, store);
    const rightRes = executeSelectQuery(parsed.normalized.slice(idx + setOp.length).trim(), dialect, datasetId, store);
    if (!leftRes || !rightRes) return null;

    const sig = (r: ResultCell[]) => JSON.stringify(r);
    const rightSigs = new Set(rightRes.rows.map(sig));
    let combined: ResultCell[][] = [];

    if (setOp === 'UNION ALL') {
      combined = [...leftRes.rows, ...rightRes.rows];
    } else if (setOp === 'UNION') {
      const seen = new Set<string>();
      for (const r of [...leftRes.rows, ...rightRes.rows]) {
        const s = sig(r);
        if (!seen.has(s)) {
          seen.add(s);
          combined.push(r);
        }
      }
    } else if (setOp === 'INTERSECT') {
      const seen = new Set<string>();
      for (const r of leftRes.rows) {
        const s = sig(r);
        if (rightSigs.has(s) && !seen.has(s)) {
          seen.add(s);
          combined.push(r);
        }
      }
    } else if (setOp === 'EXCEPT') {
      const seen = new Set<string>();
      for (const r of leftRes.rows) {
        const s = sig(r);
        if (!rightSigs.has(s) && !seen.has(s)) {
          seen.add(s);
          combined.push(r);
        }
      }
    }

    return {
      status: 'success',
      datasetId,
      dialect,
      columns: leftRes.columns,
      rows: combined,
      rowCount: combined.length,
    };
  }

  const activeTables: { table: string; alias: string }[] = [
    { table: parsed.baseTable, alias: parsed.baseAlias },
  ];

  let combinedRows: Record<string, ResultCell>[] = (store[parsed.baseTable] ?? []).map((r) => {
    const qualified: Record<string, ResultCell> = {};
    for (const [k, v] of Object.entries(r)) {
      qualified[`${parsed.baseAlias}.${k}`] = v;
    }
    return qualified;
  });

  // Apply JOINs
  for (const j of parsed.joins) {
    activeTables.push({ table: j.table, alias: j.alias });
    const rightSource = store[j.table] ?? [];
    const nextRows: Record<string, ResultCell>[] = [];

    if (j.type === 'CROSS') {
      for (const leftRow of combinedRows) {
        for (const rRow of rightSource) {
          const merged: Record<string, ResultCell> = { ...leftRow };
          for (const [k, v] of Object.entries(rRow)) {
            merged[`${j.alias}.${k}`] = v;
          }
          nextRows.push(merged);
        }
      }
    } else if (j.leftKey && j.rightKey) {
      const leftResolved = resolveColumnReference(j.leftKey, activeTables, columnLookup);
      const rightResolved = resolveColumnReference(j.rightKey, activeTables, columnLookup);
      const matchedRightIndices = new Set<number>();

      for (const leftRow of combinedRows) {
        let matchedAny = false;
        rightSource.forEach((rRow, rIdx) => {
          const candidate: Record<string, ResultCell> = { ...leftRow };
          for (const [k, v] of Object.entries(rRow)) {
            candidate[`${j.alias}.${k}`] = v;
          }
          if (
            leftResolved &&
            rightResolved &&
            candidate[leftResolved.key] !== null &&
            candidate[leftResolved.key] === candidate[rightResolved.key]
          ) {
            matchedAny = true;
            matchedRightIndices.add(rIdx);
            nextRows.push(candidate);
          }
        });
        if ((j.type === 'LEFT' || j.type === 'FULL') && !matchedAny) {
          const padded: Record<string, ResultCell> = { ...leftRow };
          for (const k of Object.keys(rightSource[0] ?? {})) {
            padded[`${j.alias}.${k}`] = null;
          }
          nextRows.push(padded);
        }
      }

      if (j.type === 'RIGHT' || j.type === 'FULL') {
        rightSource.forEach((rRow, rIdx) => {
          if (!matchedRightIndices.has(rIdx)) {
            const padded: Record<string, ResultCell> = {};
            for (const prevT of activeTables.slice(0, -1)) {
              for (const k of Object.keys(store[prevT.table]?.[0] ?? {})) {
                padded[`${prevT.alias}.${k}`] = null;
              }
            }
            for (const [k, v] of Object.entries(rRow)) {
              padded[`${j.alias}.${k}`] = v;
            }
            nextRows.push(padded);
          }
        });
      }
    }
    combinedRows = nextRows;
  }

  // Apply WHERE
  if (parsed.whereClause) {
    combinedRows = combinedRows.filter((row) =>
      evaluateWhere(parsed.whereClause!, row, activeTables, columnLookup, store)
    );
  }

  const aggRegex = /^(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*([^)]+)\s*\)(?:\s+AS\s+([a-zA-Z0-9_]+))?$/i;
  const winRegex = /^(ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|FIRST_VALUE|SUM|AVG|COUNT)\s*\(\s*([^)]*)\s*\)\s*OVER\s*\(([^)]*)\)(?:\s+AS\s+([a-zA-Z0-9_]+))?$/i;
  const hasAgg = parsed.selectExprs.some((e) => aggRegex.test(e));
  const hasWin = parsed.selectExprs.some((e) => winRegex.test(e));

  let projectedObjects: Record<string, ResultCell>[] = [];
  let outputColumns: ResultColumn[] = [];

  if (hasAgg || parsed.groupByCols.length > 0) {
    const groups = new Map<string, Record<string, ResultCell>[]>();
    if (parsed.groupByCols.length === 0) {
      groups.set('__all__', combinedRows);
    } else {
      const resolvedGroupKeys = parsed.groupByCols
        .map((c) => resolveColumnReference(c, activeTables, columnLookup))
        .filter((r): r is { key: string; displayName: string } => Boolean(r));
      for (const row of combinedRows) {
        const sig = resolvedGroupKeys.map((g) => String(row[g.key])).join('||');
        const list = groups.get(sig) ?? [];
        list.push(row);
        groups.set(sig, list);
      }
    }

    for (const groupRows of groups.values()) {
      if (parsed.havingClause) {
        const hMatch = parsed.havingClause.match(
          /^(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*([^)]+)\s*\)\s*(=|!=|<>|>=|<=|>|<)\s*(.+)$/i
        );
        if (hMatch) {
          const aggVal = computeAggregate(hMatch[1], hMatch[2], groupRows, activeTables, columnLookup);
          const targetVal = parseLiteral(hMatch[4]);
          if (typeof aggVal === 'number' && typeof targetVal === 'number') {
            const op = hMatch[3];
            const pass =
              op === '='
                ? aggVal === targetVal
                : op === '!=' || op === '<>'
                  ? aggVal !== targetVal
                  : op === '>'
                    ? aggVal > targetVal
                    : op === '>='
                      ? aggVal >= targetVal
                      : op === '<'
                        ? aggVal < targetVal
                        : aggVal <= targetVal;
            if (!pass) continue;
          }
        }
      }

      const outObj: Record<string, ResultCell> = {};
      for (const expr of parsed.selectExprs) {
        const aggMatch = expr.match(aggRegex);
        if (aggMatch) {
          const alias = aggMatch[3] ?? `${aggMatch[1].toUpperCase()}(${aggMatch[2].trim()})`;
          outObj[alias] = computeAggregate(aggMatch[1], aggMatch[2], groupRows, activeTables, columnLookup);
        } else {
          const aliasMatch = expr.match(/^(.+?)\s+AS\s+([a-zA-Z0-9_]+)$/i);
          const colExpr = aliasMatch ? aliasMatch[1].trim() : expr.trim();
          const resolved = resolveColumnReference(colExpr, activeTables, columnLookup);
          const colLabel = aliasMatch ? aliasMatch[2] : resolved?.displayName ?? colExpr;
          outObj[colLabel] = resolved ? (groupRows[0]?.[resolved.key] ?? null) : null;
        }
      }
      projectedObjects.push(outObj);
    }

    const firstRow = projectedObjects[0];
    outputColumns = firstRow
      ? Object.entries(firstRow).map(([name, val]) => ({ name, type: typeof val === 'number' ? 'number' : 'string' }))
      : parsed.selectExprs.map((expr) => {
          const aliasMatch = expr.match(/\s+AS\s+([a-zA-Z0-9_]+)$/i);
          return { name: aliasMatch ? aliasMatch[1] : expr, type: 'number' };
        });
  } else {
    // Row-level projection (supporting *, aliases, CASE, scalar functions, and Window Functions)
    if (hasWin) {
      // Pre-compute each window expression onto combinedRows
      for (let wIdx = 0; wIdx < parsed.selectExprs.length; wIdx += 1) {
        const expr = parsed.selectExprs[wIdx];
        const wm = expr.match(winRegex);
        if (!wm) continue;
        const winFn = wm[1].toUpperCase();
        const winArg = wm[2].trim();
        const overSpec = wm[3].trim();
        const winKey = `__win_${wIdx}`;

        const partMatch = overSpec.match(/PARTITION\s+BY\s+([a-zA-Z0-9_.]+)/i);
        const ordMatch = overSpec.match(/ORDER\s+BY\s+([a-zA-Z0-9_.]+)(?:\s+(ASC|DESC))?/i);

        const partCol = partMatch ? resolveColumnReference(partMatch[1], activeTables, columnLookup) : null;
        const ordCol = ordMatch ? resolveColumnReference(ordMatch[1], activeTables, columnLookup) : null;
        const ordDir = ordMatch?.[2]?.toUpperCase() === 'DESC' ? -1 : 1;

        const buckets = new Map<string, Record<string, ResultCell>[]>();
        for (const r of combinedRows) {
          const pKey = partCol ? String(r[partCol.key]) : '__all__';
          const arr = buckets.get(pKey) ?? [];
          arr.push(r);
          buckets.set(pKey, arr);
        }

        for (const bucket of buckets.values()) {
          if (ordCol) {
            bucket.sort((a, b) => {
              const va = a[ordCol.key];
              const vb = b[ordCol.key];
              if (va === vb) return 0;
              if (va === null || va === undefined) return 1;
              if (vb === null || vb === undefined) return -1;
              return va > vb ? ordDir : -ordDir;
            });
          }

          let runningSum = 0;
          for (let i = 0; i < bucket.length; i += 1) {
            const cur = bucket[i];
            if (winFn === 'ROW_NUMBER') {
              cur[winKey] = i + 1;
            } else if (winFn === 'RANK') {
              if (i === 0 || !ordCol) cur[winKey] = 1;
              else {
                const prev = bucket[i - 1];
                cur[winKey] = cur[ordCol.key] === prev[ordCol.key] ? prev[winKey] : i + 1;
              }
            } else if (winFn === 'DENSE_RANK') {
              if (i === 0 || !ordCol) cur[winKey] = 1;
              else {
                const prev = bucket[i - 1];
                cur[winKey] =
                  cur[ordCol.key] === prev[ordCol.key]
                    ? prev[winKey]
                    : Number(prev[winKey] ?? 0) + 1;
              }
            } else if (winFn === 'LAG') {
              const argRes = resolveColumnReference(winArg, activeTables, columnLookup);
              cur[winKey] = i > 0 && argRes ? (bucket[i - 1][argRes.key] ?? null) : null;
            } else if (winFn === 'LEAD') {
              const argRes = resolveColumnReference(winArg, activeTables, columnLookup);
              cur[winKey] = i + 1 < bucket.length && argRes ? (bucket[i + 1][argRes.key] ?? null) : null;
            } else if (winFn === 'FIRST_VALUE') {
              const argRes = resolveColumnReference(winArg, activeTables, columnLookup);
              cur[winKey] = argRes ? (bucket[0][argRes.key] ?? null) : null;
            } else if (winFn === 'SUM') {
              const argRes = resolveColumnReference(winArg, activeTables, columnLookup);
              const val = argRes ? Number(cur[argRes.key] ?? 0) : 0;
              runningSum = Number((runningSum + val).toFixed(2));
              cur[winKey] = runningSum;
            }
          }
        }
      }
    }

    const colSpecs: { label: string; compute: (r: Record<string, ResultCell>) => ResultCell }[] = [];

    for (let idx = 0; idx < parsed.selectExprs.length; idx += 1) {
      const expr = parsed.selectExprs[idx];
      if (expr === '*') {
        for (const t of activeTables) {
          const tableCols = Object.keys(store[t.table]?.[0] ?? {});
          for (const c of tableCols) {
            const label =
              activeTables.length > 1 && colSpecs.some((cs) => cs.label === c)
                ? `${t.alias}.${c}`
                : c;
            colSpecs.push({ label, compute: (r) => r[`${t.alias}.${c}`] ?? null });
          }
        }
        continue;
      }

      const wm = expr.match(winRegex);
      if (wm) {
        const label = wm[4] ?? `${wm[1].toUpperCase()}_val`;
        const winKey = `__win_${idx}`;
        colSpecs.push({ label, compute: (r) => r[winKey] ?? null });
        continue;
      }

      const aliasMatch = expr.match(/^(.+?)\s+AS\s+([a-zA-Z0-9_]+)$/i);
      const rawExpr = aliasMatch ? aliasMatch[1].trim() : expr.trim();
      const resolved = resolveColumnReference(rawExpr, activeTables, columnLookup);
      const label =
        aliasMatch?.[2] ??
        (resolved
          ? colSpecs.some((cs) => cs.label === resolved.displayName)
            ? resolved.key
            : resolved.displayName
          : rawExpr);

      colSpecs.push({
        label,
        compute: (r) => evaluateScalarExpr(rawExpr, r, activeTables, columnLookup),
      });
    }

    projectedObjects = combinedRows.map((row) => {
      const out: Record<string, ResultCell> = {};
      for (const spec of colSpecs) {
        out[spec.label] = spec.compute(row);
      }
      return out;
    });

    outputColumns = colSpecs.map((spec) => {
      const sampleVal = projectedObjects[0]?.[spec.label];
      return { name: spec.label, type: typeof sampleVal === 'number' ? 'number' : 'string' };
    });
  }

  // Apply DISTINCT
  if (parsed.distinct) {
    const seen = new Set<string>();
    projectedObjects = projectedObjects.filter((obj) => {
      const key = JSON.stringify(outputColumns.map((c) => obj[c.name] ?? null));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Apply ORDER BY
  if (parsed.orderBy) {
    const dir = parsed.orderBy.direction === 'DESC' ? -1 : 1;
    const orderTarget = parsed.orderBy.column.toLowerCase();
    projectedObjects.sort((a, b) => {
      const keyA = Object.keys(a).find(
        (k) => k.toLowerCase() === orderTarget || k.toLowerCase().endsWith(`.${orderTarget}`)
      );
      const valA = keyA ? a[keyA] : null;
      const valB = keyA ? b[keyA] : null;
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      return valA > valB ? dir : -dir;
    });
  }

  // Apply LIMIT / TOP
  const cap = parsed.topCount ?? parsed.limitCount;
  if (cap !== null) {
    projectedObjects = projectedObjects.slice(0, cap);
  }

  const rows: ResultCell[][] = projectedObjects.map((obj) =>
    outputColumns.map((col) => obj[col.name] ?? null)
  );

  return {
    status: 'success',
    datasetId,
    dialect,
    columns: outputColumns,
    rows,
    rowCount: rows.length,
  };
}

export async function mockAnalyzeQuery(
  request: AnalyzeQueryRequest,
  signal?: AbortSignal
): Promise<AnalyzeQueryResponse> {
  await delay(80, signal);
  return analyzeAndParse(request).response;
}

export async function mockEvaluateQuery(
  request: EvaluateQueryRequest,
  signal?: AbortSignal
): Promise<EvaluateQueryResponse> {
  await delay(110, signal);
  const analysis = analyzeAndParse(request);
  if (analysis.response.status !== 'valid') {
    throw new Error(analysis.response.diagnostics[0]?.message ?? 'Query must be valid before evaluation.');
  }
  const res = executeSelectQuery(request.query, request.dialect, request.datasetId);
  if (!res) {
    throw new Error('Unable to evaluate query.');
  }
  return res;
}

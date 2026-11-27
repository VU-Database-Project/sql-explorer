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
  await delay(60);
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
  await delay(60);
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

interface ParsedJoin {
  type: 'INNER' | 'LEFT' | 'CROSS';
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

const TABLE_LOOKUP = new Map<string, string>(
  Object.keys(MOCK_TABLES).map((name) => [name.toLowerCase(), name])
);

const COLUMN_LOOKUP = new Map<string, Map<string, string>>();
for (const [tableName, rows] of Object.entries(MOCK_TABLES)) {
  const colMap = new Map<string, string>();
  const sample = rows[0] ?? {};
  for (const col of Object.keys(sample)) {
    colMap.set(col.toLowerCase(), col);
  }
  COLUMN_LOOKUP.set(tableName, colMap);
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

function resolveTableName(rawName: string): string | null {
  const cleaned = rawName.replace(/[`\[\]]/g, '').trim().toLowerCase();
  return TABLE_LOOKUP.get(cleaned) ?? null;
}

function resolveColumnReference(
  ref: string,
  activeTables: { table: string; alias: string }[]
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
    const actualCol = COLUMN_LOOKUP.get(target.table)?.get(colPart);
    if (!actualCol) return null;
    return {
      key: `${target.alias}.${actualCol}`,
      displayName: actualCol,
    };
  }

  const colLower = cleaned.toLowerCase();
  for (const t of activeTables) {
    const actualCol = COLUMN_LOOKUP.get(t.table)?.get(colLower);
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

function analyzeAndParse(request: AnalyzeQueryRequest): {
  response: AnalyzeQueryResponse;
  parsed?: ParsedSelectQuery;
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
            message: 'Start typing a SELECT query or load an example from a lesson.',
            severity: 'info',
          },
        ],
        'Waiting for a SQL query.'
      ),
    };
  }

  // Multi-statement check
  const withoutEndSemi = stripTrailingSemicolon(trimmed);
  if (withoutEndSemi.includes(';')) {
    return {
      response: buildDiagnosticsResponse(
        request,
        'unsupported',
        [
          {
            code: 'MULTIPLE_STATEMENTS',
            message: 'Only a single SQL statement is allowed at a time.',
            severity: 'error',
          },
        ],
        'Multiple statements are blocked for safety.'
      ),
    };
  }

  const normalized = withoutEndSemi.replace(/\s+/g, ' ').trim();
  const upper = normalized.toUpperCase();

  // Safety filter for DDL / DML
  const firstWord = upper.split(/\s+/)[0] ?? '';
  if (firstWord === 'CREATE') {
    return {
      response: buildDiagnosticsResponse(
        request,
        'unsupported',
        [
          {
            code: 'DDL_READ_ONLY_SANDBOX',
            message:
              'CREATE TABLE / CREATE VIEW DDL syntax is shown in the lesson guide, while the live playground executes read-only SELECT queries.',
            severity: 'warning',
          },
        ],
        'DDL definitions are read-only in the live playground. Try a SELECT query on Student or HonorStudents.'
      ),
    };
  }

  const unsafeKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'EXEC', 'MERGE', 'GRANT', 'REVOKE'];
  if (unsafeKeywords.includes(firstWord)) {
    return {
      response: buildDiagnosticsResponse(
        request,
        'unsupported',
        [
          {
            code: 'UNSAFE_STATEMENT',
            message: `${firstWord} statements are blocked. Only read-only SELECT queries are permitted.`,
            severity: 'error',
          },
        ],
        `Blocked non-SELECT statement (${firstWord}).`
      ),
    };
  }

  if (firstWord !== 'SELECT') {
    return {
      response: buildDiagnosticsResponse(
        request,
        'syntax_error',
        [
          {
            code: 'EXPECTED_SELECT',
            message: 'Queries must begin with the SELECT keyword.',
            severity: 'error',
          },
        ],
        'Expected a SELECT statement.'
      ),
    };
  }

  // Incomplete trailing keyword check
  if (/(SELECT|FROM|WHERE|AND|OR|ORDER BY|GROUP BY|HAVING|JOIN|ON|IN|BETWEEN|LIKE)$/i.test(normalized)) {
    return {
      response: buildDiagnosticsResponse(
        request,
        'incomplete',
        [
          {
            code: 'INCOMPLETE_CLAUSE',
            message: 'Query ends mid-clause. Finish typing the table, column, or condition.',
            severity: 'info',
          },
        ],
        'Query is still in progress.'
      ),
    };
  }

  // Extract LIMIT (MySQL) vs TOP (T-SQL)
  let working = normalized;
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
              message: `MySQL does not support SELECT TOP ${topMatch[1]}. Use LIMIT ${topMatch[1]} at the end of the query instead.`,
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

  // Locate top-level FROM
  const fromMatch = working.match(/^SELECT\s+(.+?)\s+FROM\s+(.+)$/i);
  if (!fromMatch) {
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
              : 'Include a FROM <table> clause specifying which table to query.',
            severity: 'error',
          },
        ],
        'Syntax error in SELECT / FROM structure.'
      ),
    };
  }

  const selectPart = fromMatch[1].trim();
  let rest = fromMatch[2].trim();

  // Extract ORDER BY
  let orderBy: ParsedSelectQuery['orderBy'] = null;
  const orderMatch = rest.match(/\bORDER\s+BY\s+([a-zA-Z0-9_.]+)(?:\s+(ASC|DESC))?\s*$/i);
  if (orderMatch) {
    orderBy = {
      column: orderMatch[1],
      direction: (orderMatch[2]?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'),
    };
    rest = rest.slice(0, orderMatch.index).trim();
  }

  // Extract HAVING
  let havingClause: string | null = null;
  const havingMatch = rest.match(/\bHAVING\s+(.+)$/i);
  if (havingMatch) {
    havingClause = havingMatch[1].trim();
    rest = rest.slice(0, havingMatch.index).trim();
  }

  // Extract GROUP BY
  let groupByCols: string[] = [];
  const groupMatch = rest.match(/\bGROUP\s+BY\s+(.+)$/i);
  if (groupMatch) {
    groupByCols = splitTopLevelCommas(groupMatch[1]);
    rest = rest.slice(0, groupMatch.index).trim();
  }

  // Extract WHERE
  let whereClause: string | null = null;
  const whereMatch = rest.match(/\bWHERE\s+(.+)$/i);
  if (whereMatch) {
    whereClause = whereMatch[1].trim();
    rest = rest.slice(0, whereMatch.index).trim();
  }

  // Parse FROM + JOINs (including comma cross-join)
  const joins: ParsedJoin[] = [];
  let baseTableToken = '';
  let baseAlias = '';

  const joinSplitRegex = /\b(INNER\s+JOIN|LEFT\s+(?:OUTER\s+)?JOIN|CROSS\s+JOIN|JOIN)\b/i;
  if (joinSplitRegex.test(rest)) {
    const tokens = rest.split(joinSplitRegex);
    const baseSpec = tokens[0].trim().split(/\s+/);
    baseTableToken = baseSpec[0] ?? '';
    baseAlias = baseSpec[1] && baseSpec[1].toUpperCase() !== 'AS' ? baseSpec[1] : baseSpec[2] ?? baseTableToken;

    for (let i = 1; i < tokens.length; i += 2) {
      const joinKeyword = tokens[i].toUpperCase();
      const joinBody = (tokens[i + 1] ?? '').trim();
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
                  message: 'INNER JOIN and LEFT JOIN require an ON left.key = right.key condition.',
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
        joins.push({
          type: joinKeyword.startsWith('LEFT') ? 'LEFT' : 'INNER',
          table: jTable,
          alias: jAlias,
          leftKey: onMatch[2],
          rightKey: onMatch[3],
        });
      }
    }
  } else if (rest.includes(',')) {
    const commaTables = splitTopLevelCommas(rest);
    const firstParts = commaTables[0].split(/\s+/);
    baseTableToken = firstParts[0] ?? '';
    baseAlias = firstParts[1] ?? baseTableToken;
    for (let i = 1; i < commaTables.length; i += 1) {
      const p = commaTables[i].split(/\s+/);
      joins.push({ type: 'CROSS', table: p[0] ?? '', alias: p[1] ?? p[0] ?? '' });
    }
  } else {
    const baseSpec = rest.split(/\s+/);
    baseTableToken = baseSpec[0] ?? '';
    baseAlias = baseSpec[1] && baseSpec[1].toUpperCase() !== 'AS' ? baseSpec[1] : baseSpec[2] ?? baseTableToken;
  }

  const resolvedBase = resolveTableName(baseTableToken);
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
    const resolvedJoin = resolveTableName(j.table);
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

  // Validate JOIN ON keys
  for (const j of joins) {
    if (j.type !== 'CROSS' && j.leftKey && j.rightKey) {
      if (!resolveColumnReference(j.leftKey, activeTables)) {
        return {
          response: buildDiagnosticsResponse(
            request,
            'semantic_error',
            [
              {
                code: 'UNKNOWN_COLUMN',
                message: `Join key "${j.leftKey}" was not found in the joined tables.`,
                severity: 'error',
              },
            ],
            `Unknown column "${j.leftKey}" in ON clause.`
          ),
        };
      }
      if (!resolveColumnReference(j.rightKey, activeTables)) {
        return {
          response: buildDiagnosticsResponse(
            request,
            'semantic_error',
            [
              {
                code: 'UNKNOWN_COLUMN',
                message: `Join key "${j.rightKey}" was not found in the joined tables.`,
                severity: 'error',
              },
            ],
            `Unknown column "${j.rightKey}" in ON clause.`
          ),
        };
      }
    }
  }

  // Validate SELECT expressions
  const selectExprs = splitTopLevelCommas(selectPart);
  const aggRegex = /^(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*([^)]+)\s*\)(?:\s+AS\s+([a-zA-Z0-9_]+))?$/i;

  for (const expr of selectExprs) {
    const aggMatch = expr.match(aggRegex);
    if (aggMatch) {
      const innerCol = aggMatch[2].trim();
      if (innerCol !== '*' && !resolveColumnReference(innerCol, activeTables)) {
        return {
          response: buildDiagnosticsResponse(
            request,
            'semantic_error',
            [
              {
                code: 'UNKNOWN_COLUMN',
                message: `Column "${innerCol}" inside ${aggMatch[1].toUpperCase()}() does not exist.`,
                severity: 'error',
              },
            ],
            `Unknown column "${innerCol}".`
          ),
        };
      }
      continue;
    }

    const colOnly = expr.replace(/\s+AS\s+[a-zA-Z0-9_]+$/i, '').trim();
    if (!resolveColumnReference(colOnly, activeTables)) {
      return {
        response: buildDiagnosticsResponse(
          request,
          'semantic_error',
          [
            {
              code: 'UNKNOWN_COLUMN',
              message: `"${colOnly}" is not a valid column in ${activeTables.map((t) => t.table).join(', ')}.`,
              severity: 'error',
            },
          ],
          `Unknown column "${colOnly}".`
        ),
      };
    }
  }

  // Validate WHERE column names
  if (whereClause) {
    const simplePredicates = whereClause.split(/\s+(?:AND|OR)\s+/i);
    for (const pred of simplePredicates) {
      const colMatch = pred.trim().match(/^([a-zA-Z0-9_.]+)\s+(?:IS\s+NOT\s+NULL|IS\s+NULL|NOT\s+LIKE|LIKE|NOT\s+IN|IN|BETWEEN|=|!=|<>|>=|<=|>|<)/i);
      if (colMatch) {
        const colName = colMatch[1];
        if (!resolveColumnReference(colName, activeTables)) {
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

  // Validate GROUP BY columns
  for (const gCol of groupByCols) {
    if (!resolveColumnReference(gCol, activeTables)) {
      return {
        response: buildDiagnosticsResponse(
          request,
          'semantic_error',
          [
            {
              code: 'UNKNOWN_COLUMN',
              message: `GROUP BY column "${gCol}" does not exist.`,
              severity: 'error',
            },
          ],
          `Unknown GROUP BY column "${gCol}".`
        ),
      };
    }
  }

  // Validate ORDER BY column (allow aggregate alias too)
  if (orderBy) {
    const aliases = selectExprs
      .map((e) => e.match(/\s+AS\s+([a-zA-Z0-9_]+)$/i)?.[1]?.toLowerCase())
      .filter((a): a is string => Boolean(a));
    if (
      !aliases.includes(orderBy.column.toLowerCase()) &&
      !resolveColumnReference(orderBy.column, activeTables)
    ) {
      return {
        response: buildDiagnosticsResponse(
          request,
          'semantic_error',
          [
            {
              code: 'UNKNOWN_COLUMN',
              message: `ORDER BY column "${orderBy.column}" does not exist.`,
              severity: 'error',
            },
          ],
          `Unknown ORDER BY column "${orderBy.column}".`
        ),
      };
    }
  }

  // Build concepts & plain-English clause breakdown
  const concepts: QueryConcept[] = [{ id: 'select', label: 'SELECT', topicSlug: 'select' }];
  const breakdown: QueryBreakdownItem[] = [
    {
      id: 'from-clause',
      sourceText: `FROM ${resolvedBase}`,
      title: 'Read base table',
      explanation:
        resolvedBase === 'HonorStudents'
          ? 'Reads rows from the HonorStudents virtual view (Student rows where CGPA >= 3.50).'
          : `Reads rows from the ${resolvedBase} table.`,
    },
  ];

  if (resolvedBase === 'HonorStudents') {
    concepts.push({ id: 'views', label: 'VIEW', topicSlug: 'views' });
  }

  if (joins.length > 0) {
    for (let idx = 0; idx < joins.length; idx += 1) {
      const j = joins[idx];
      if (j.type === 'CROSS') {
        concepts.push({ id: 'cross-product', label: 'CROSS JOIN', topicSlug: 'cross-product' });
        breakdown.push({
          id: `join-${idx}`,
          sourceText: `CROSS JOIN ${j.table}`,
          title: 'Cartesian product',
          explanation: `Pairs every row from the left side with every row in ${j.table}.`,
        });
      } else {
        concepts.push({ id: 'joins', label: `${j.type} JOIN`, topicSlug: 'joins' });
        breakdown.push({
          id: `join-${idx}`,
          sourceText: `${j.type} JOIN ${j.table} ON ${j.leftKey} = ${j.rightKey}`,
          title: j.type === 'LEFT' ? 'Left outer join' : 'Inner join tables',
          explanation:
            j.type === 'LEFT'
              ? `Keeps all left rows and attaches matching ${j.table} rows where ${j.leftKey} = ${j.rightKey} (NULL if unmatched).`
              : `Matches rows across tables where ${j.leftKey} equals ${j.rightKey}.`,
        });
      }
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
    breakdown.push({
      id: 'where-clause',
      sourceText: `WHERE ${whereClause}`,
      title: 'Filter candidate rows',
      explanation: `Keeps only rows satisfying ${whereClause}.`,
      variationHint: 'Try adjusting boundary operators (> vs >=) or values to see row counts change.',
    });
  }

  const hasAgg = selectExprs.some((e) => aggRegex.test(e));
  if (hasAgg) {
    concepts.push({
      id: 'aggregate-functions',
      label: 'AGGREGATES',
      topicSlug: 'aggregate-functions',
    });
  }

  if (groupByCols.length > 0 || havingClause) {
    concepts.push({
      id: 'group-by-having',
      label: havingClause ? 'GROUP BY & HAVING' : 'GROUP BY',
      topicSlug: 'group-by-having',
    });
    breakdown.push({
      id: 'group-by-clause',
      sourceText: havingClause
        ? `GROUP BY ${groupByCols.join(', ')} HAVING ${havingClause}`
        : `GROUP BY ${groupByCols.join(', ')}`,
      title: 'Group & filter buckets',
      explanation: havingClause
        ? `Groups rows by ${groupByCols.join(', ')} and keeps only groups where ${havingClause}.`
        : `Partitions rows into buckets by ${groupByCols.join(', ')} before computing aggregates.`,
    });
  }

  breakdown.push({
    id: 'select-clause',
    sourceText: `SELECT ${selectPart}`,
    title: 'Project output columns',
    explanation:
      selectPart === '*'
        ? 'Returns all columns from the active row set.'
        : `Projects ${selectExprs.join(', ')} into the final table.`,
  });

  if (orderBy) {
    concepts.push({ id: 'order-by', label: 'ORDER BY', topicSlug: 'order-by' });
    breakdown.push({
      id: 'order-by-clause',
      sourceText: `ORDER BY ${orderBy.column} ${orderBy.direction}`,
      title: 'Sort result rows',
      explanation: `Orders rows by ${orderBy.column} in ${orderBy.direction === 'DESC' ? 'descending' : 'ascending'} order.`,
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
      explanation: `Returns at most ${cap} row(s) after sorting.`,
    });
  }

  // Deduplicate concepts by id
  const uniqueConcepts = Array.from(new Map(concepts.map((c) => [c.id, c])).values());

  return {
    parsed: {
      raw,
      normalized,
      dialect: request.dialect,
      datasetId: request.datasetId,
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

function evaluateSinglePredicate(
  pred: string,
  row: Record<string, ResultCell>,
  activeTables: { table: string; alias: string }[]
): boolean {
  const p = pred.trim();

  const nullMatch = p.match(/^([a-zA-Z0-9_.]+)\s+IS\s+(NOT\s+)?NULL$/i);
  if (nullMatch) {
    const resolved = resolveColumnReference(nullMatch[1], activeTables);
    if (!resolved) return false;
    const val = row[resolved.key];
    return nullMatch[2] ? val !== null && val !== undefined : val === null || val === undefined;
  }

  const betweenMatch = p.match(/^([a-zA-Z0-9_.]+)\s+BETWEEN\s+(.+?)\s+AND\s+(.+)$/i);
  if (betweenMatch) {
    const resolved = resolveColumnReference(betweenMatch[1], activeTables);
    if (!resolved) return false;
    const val = row[resolved.key];
    const low = parseLiteral(betweenMatch[2]);
    const high = parseLiteral(betweenMatch[3]);
    if (typeof val === 'number' && typeof low === 'number' && typeof high === 'number') {
      return val >= low && val <= high;
    }
    return String(val) >= String(low) && String(val) <= String(high);
  }

  const inMatch = p.match(/^([a-zA-Z0-9_.]+)\s+(NOT\s+)?IN\s*\((.+)\)$/i);
  if (inMatch) {
    const resolved = resolveColumnReference(inMatch[1], activeTables);
    if (!resolved) return false;
    const val = row[resolved.key];
    const items = splitTopLevelCommas(inMatch[3]).map(parseLiteral);
    const matched = items.some((item) => item === val);
    return inMatch[2] ? !matched : matched;
  }

  const likeMatch = p.match(/^([a-zA-Z0-9_.]+)\s+(NOT\s+)?LIKE\s+(['"].+['"])$/i);
  if (likeMatch) {
    const resolved = resolveColumnReference(likeMatch[1], activeTables);
    if (!resolved) return false;
    const val = row[resolved.key];
    if (val === null || val === undefined) return false;
    const pattern = String(parseLiteral(likeMatch[3]));
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexStr = '^' + escaped.replace(/%/g, '.*').replace(/_/g, '.') + '$';
    const matched = new RegExp(regexStr, 'i').test(String(val));
    return likeMatch[2] ? !matched : matched;
  }

  const cmpMatch = p.match(/^([a-zA-Z0-9_.]+)\s*(=|!=|<>|>=|<=|>|<)\s*(.+)$/);
  if (cmpMatch) {
    const resolved = resolveColumnReference(cmpMatch[1], activeTables);
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
  activeTables: { table: string; alias: string }[]
): boolean {
  // Split by OR at top level, then AND inside each OR branch (standard SQL precedence)
  const orBranches = whereClause.split(/\s+OR\s+/i);
  return orBranches.some((branch) => {
    // Re-stitch BETWEEN a AND b so we don't split BETWEEN's AND
    const protectedBranch = branch.replace(
      /\bBETWEEN\s+([^\s]+)\s+AND\s+([^\s]+)/gi,
      'BETWEEN $1__BETWEEN_AND__$2'
    );
    const andParts = protectedBranch
      .split(/\s+AND\s+/i)
      .map((part) => part.replace('__BETWEEN_AND__', ' AND '));
    return andParts.every((p) => evaluateSinglePredicate(p, row, activeTables));
  });
}

function computeAggregate(
  fn: string,
  colRef: string,
  rows: Record<string, ResultCell>[],
  activeTables: { table: string; alias: string }[]
): ResultCell {
  const upperFn = fn.toUpperCase();
  if (upperFn === 'COUNT' && colRef.trim() === '*') {
    return rows.length;
  }
  const resolved = resolveColumnReference(colRef, activeTables);
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

export async function mockAnalyzeQuery(
  request: AnalyzeQueryRequest,
  signal?: AbortSignal
): Promise<AnalyzeQueryResponse> {
  await delay(90, signal);
  return analyzeAndParse(request).response;
}

export async function mockEvaluateQuery(
  request: EvaluateQueryRequest,
  signal?: AbortSignal
): Promise<EvaluateQueryResponse> {
  await delay(120, signal);
  const { response, parsed } = analyzeAndParse(request);
  if (response.status !== 'valid' || !parsed) {
    throw new Error(response.diagnostics[0]?.message ?? 'Query must be valid before evaluation.');
  }

  const activeTables: { table: string; alias: string }[] = [
    { table: parsed.baseTable, alias: parsed.baseAlias },
  ];

  // Build initial qualified rows from baseTable
  let combinedRows: Record<string, ResultCell>[] = (MOCK_TABLES[parsed.baseTable] ?? []).map((r) => {
    const qualified: Record<string, ResultCell> = {};
    for (const [k, v] of Object.entries(r)) {
      qualified[`${parsed.baseAlias}.${k}`] = v;
    }
    return qualified;
  });

  // Apply JOINs sequentially
  for (const j of parsed.joins) {
    activeTables.push({ table: j.table, alias: j.alias });
    const rightSource = MOCK_TABLES[j.table] ?? [];
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
      const leftResolved = resolveColumnReference(j.leftKey, activeTables);
      const rightResolved = resolveColumnReference(j.rightKey, activeTables);
      for (const leftRow of combinedRows) {
        let matchedAny = false;
        for (const rRow of rightSource) {
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
            nextRows.push(candidate);
          }
        }
        if (j.type === 'LEFT' && !matchedAny) {
          const padded: Record<string, ResultCell> = { ...leftRow };
          const sampleCols = Object.keys(rightSource[0] ?? {});
          for (const k of sampleCols) {
            padded[`${j.alias}.${k}`] = null;
          }
          nextRows.push(padded);
        }
      }
    }
    combinedRows = nextRows;
  }

  // Apply WHERE
  if (parsed.whereClause) {
    combinedRows = combinedRows.filter((row) =>
      evaluateWhere(parsed.whereClause!, row, activeTables)
    );
  }

  const aggRegex = /^(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*([^)]+)\s*\)(?:\s+AS\s+([a-zA-Z0-9_]+))?$/i;
  const hasAgg = parsed.selectExprs.some((e) => aggRegex.test(e));

  let projectedObjects: Record<string, ResultCell>[] = [];
  let outputColumns: ResultColumn[] = [];

  if (hasAgg || parsed.groupByCols.length > 0) {
    // Group rows
    const groups = new Map<string, Record<string, ResultCell>[]>();
    if (parsed.groupByCols.length === 0) {
      groups.set('__all__', combinedRows);
    } else {
      const resolvedGroupKeys = parsed.groupByCols
        .map((c) => resolveColumnReference(c, activeTables))
        .filter((r): r is { key: string; displayName: string } => Boolean(r));
      for (const row of combinedRows) {
        const sig = resolvedGroupKeys.map((g) => String(row[g.key])).join('||');
        const list = groups.get(sig) ?? [];
        list.push(row);
        groups.set(sig, list);
      }
    }

    for (const groupRows of groups.values()) {
      // Check HAVING if present
      if (parsed.havingClause) {
        const hMatch = parsed.havingClause.match(
          /^(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*([^)]+)\s*\)\s*(=|!=|<>|>=|<=|>|<)\s*(.+)$/i
        );
        if (hMatch) {
          const aggVal = computeAggregate(hMatch[1], hMatch[2], groupRows, activeTables);
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
          outObj[alias] = computeAggregate(aggMatch[1], aggMatch[2], groupRows, activeTables);
        } else {
          const aliasMatch = expr.match(/^(.+?)\s+AS\s+([a-zA-Z0-9_]+)$/i);
          const colExpr = aliasMatch ? aliasMatch[1].trim() : expr.trim();
          const resolved = resolveColumnReference(colExpr, activeTables);
          const colLabel = aliasMatch ? aliasMatch[2] : resolved?.displayName ?? colExpr;
          outObj[colLabel] = resolved ? (groupRows[0]?.[resolved.key] ?? null) : null;
        }
      }
      projectedObjects.push(outObj);
    }

    const firstRow = projectedObjects[0];
    if (firstRow) {
      outputColumns = Object.entries(firstRow).map(([name, val]) => ({
        name,
        type: typeof val === 'number' ? 'number' : 'string',
      }));
    } else {
      outputColumns = parsed.selectExprs.map((expr) => {
        const aliasMatch = expr.match(/\s+AS\s+([a-zA-Z0-9_]+)$/i);
        return { name: aliasMatch ? aliasMatch[1] : expr, type: 'number' };
      });
    }
  } else {
    // Non-aggregate projection
    const expandedCols: { key: string; label: string }[] = [];
    for (const expr of parsed.selectExprs) {
      if (expr === '*') {
        for (const t of activeTables) {
          const tableCols = Object.keys(MOCK_TABLES[t.table]?.[0] ?? {});
          for (const c of tableCols) {
            const label =
              activeTables.length > 1 && expandedCols.some((ec) => ec.label === c)
                ? `${t.alias}.${c}`
                : c;
            expandedCols.push({ key: `${t.alias}.${c}`, label });
          }
        }
      } else {
        const aliasMatch = expr.match(/^(.+?)\s+AS\s+([a-zA-Z0-9_]+)$/i);
        const colExpr = aliasMatch ? aliasMatch[1].trim() : expr.trim();
        const resolved = resolveColumnReference(colExpr, activeTables);
        if (resolved) {
          const label =
            aliasMatch?.[2] ??
            (expandedCols.some((ec) => ec.label === resolved.displayName)
              ? resolved.key
              : resolved.displayName);
          expandedCols.push({ key: resolved.key, label });
        }
      }
    }

    outputColumns = expandedCols.map((c) => {
      const sampleVal = combinedRows[0]?.[c.key];
      return {
        name: c.label,
        type: typeof sampleVal === 'number' ? 'number' : 'string',
      };
    });

    projectedObjects = combinedRows.map((row) => {
      const out: Record<string, ResultCell> = {};
      for (const c of expandedCols) {
        out[c.label] = row[c.key] ?? null;
      }
      return out;
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
    datasetId: parsed.datasetId,
    dialect: parsed.dialect,
    columns: outputColumns,
    rows,
    rowCount: rows.length,
  };
}

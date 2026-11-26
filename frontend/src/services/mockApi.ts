import type {
  AnalyzeQueryRequest,
  AnalyzeQueryResponse,
  DatasetSchema,
  DatasetSummary,
  EvaluateQueryRequest,
  EvaluateQueryResponse,
  ResultCell,
  ResultColumn,
  TopicDetail,
  TopicSummary,
} from '../types/api';
import { ApiClientError } from './apiClient';
import {
  DEFAULT_DATASET_ID,
  MOCK_DATASETS,
  MOCK_DATASET_SCHEMAS,
  MOCK_STUDENT_ROWS,
  MOCK_TOPICS,
  MOCK_TOPIC_SUMMARIES,
} from './mockData';

/**
 * TEMPORARY MOCK BACKEND ADAPTER (Development Only)
 * -------------------------------------------------
 * This file simulates backend API responses for the golden test queries so the
 * frontend can be built and demonstrated before the Express + AST backend is live.
 * It is NOT a real SQL parser or browser SQL execution engine.
 */

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true }
    );
  });
}

function normalizeSql(raw: string): string {
  return raw.trim().replace(/;+\s*$/, '').replace(/\s+/g, ' ');
}

export async function mockGetTopics(): Promise<TopicSummary[]> {
  await wait(120);
  return MOCK_TOPIC_SUMMARIES;
}

export async function mockGetTopicBySlug(slug: string): Promise<TopicDetail> {
  await wait(120);
  const found = MOCK_TOPICS.find((t) => t.slug === slug);
  if (!found) {
    throw new ApiClientError(`Topic "${slug}" was not found.`, 'TOPIC_NOT_FOUND', 404);
  }
  return found;
}

export async function mockGetDatasets(): Promise<DatasetSummary[]> {
  await wait(100);
  return MOCK_DATASETS;
}

export async function mockGetDatasetSchema(datasetId: string): Promise<DatasetSchema> {
  await wait(100);
  const schema = MOCK_DATASET_SCHEMAS[datasetId];
  if (!schema) {
    throw new ApiClientError(`Dataset "${datasetId}" was not found.`, 'DATASET_NOT_FOUND', 404);
  }
  return schema;
}

export async function mockAnalyzeQuery(
  req: AnalyzeQueryRequest,
  signal?: AbortSignal
): Promise<AnalyzeQueryResponse> {
  await wait(180, signal);

  const raw = req.query.trim();
  const normalized = normalizeSql(raw);
  const upper = normalized.toUpperCase();
  const base = { datasetId: req.datasetId, dialect: req.dialect };

  // 1. Unsafe / DDL / DML / Multi-statement rejection
  if (
    /^(DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE|CREATE)\b/.test(upper) ||
    raw.replace(/;\s*$/, '').includes(';')
  ) {
    return {
      ...base,
      status: 'unsupported',
      concepts: [],
      explanation: 'Only single, read-only SELECT queries are allowed in SQL Explorer.',
      breakdown: [],
      diagnostics: [
        {
          code: 'UNSAFE_STATEMENT',
          message:
            'Only supported read-only SELECT queries are allowed. Destructive statements and multiple statements are rejected.',
          line: 1,
          column: 1,
          severity: 'error',
        },
      ],
    };
  }

  // 2. Incomplete queries
  if (upper === 'SELECT' || upper === 'SELECT *' || upper === 'SELECT * FROM' || /\b(FROM|WHERE|ORDER BY)$/.test(upper)) {
    const missingFrom = upper.endsWith('FROM');
    const missingWhere = upper.endsWith('WHERE');
    return {
      ...base,
      status: 'incomplete',
      concepts: [{ id: 'select', label: 'SELECT', topicSlug: 'select' }],
      explanation: 'The query is not complete yet.',
      breakdown: [],
      diagnostics: [
        {
          code: missingFrom
            ? 'EXPECTED_TABLE_AFTER_FROM'
            : missingWhere
              ? 'EXPECTED_CONDITION_AFTER_WHERE'
              : 'INCOMPLETE_QUERY',
          message: missingFrom
            ? 'Choose a table name after FROM (for example: Student).'
            : missingWhere
              ? 'Add a condition after WHERE (for example: CGPA > 3.42).'
              : 'Continue writing the query—include columns after SELECT and a table after FROM.',
          line: 1,
          column: raw.length + 1,
          severity: 'info',
        },
      ],
    };
  }

  // 3. Syntax error: missing select list
  if (/^SELECT\s+FROM\b/.test(upper)) {
    return {
      ...base,
      status: 'syntax_error',
      concepts: [],
      explanation: 'This query has a syntax error before FROM.',
      breakdown: [],
      diagnostics: [
        {
          code: 'EXPECTED_SELECT_LIST',
          message: 'A column name or * is expected between SELECT and FROM.',
          line: 1,
          column: 8,
          severity: 'error',
        },
      ],
    };
  }

  // 4. Dialect mismatch checks (MySQL LIMIT vs T-SQL TOP)
  if (req.dialect === 'tsql' && /\bLIMIT\s+\d+$/i.test(normalized)) {
    return {
      ...base,
      status: 'syntax_error',
      concepts: [{ id: 'select', label: 'SELECT', topicSlug: 'select' }],
      explanation: 'LIMIT is MySQL syntax and is not valid in Microsoft SQL Server (T-SQL).',
      breakdown: [],
      diagnostics: [
        {
          code: 'DIALECT_SYNTAX_MISMATCH',
          message:
            'In T-SQL, use SELECT TOP N ... instead of LIMIT N, or switch the dialect selector to MySQL.',
          severity: 'error',
        },
      ],
    };
  }

  if (req.dialect === 'mysql' && /^SELECT\s+TOP\s+\d+\b/i.test(normalized)) {
    return {
      ...base,
      status: 'syntax_error',
      concepts: [{ id: 'select', label: 'SELECT', topicSlug: 'select' }],
      explanation: 'TOP is T-SQL syntax and is not valid in MySQL.',
      breakdown: [],
      diagnostics: [
        {
          code: 'DIALECT_SYNTAX_MISMATCH',
          message:
            'In MySQL, use LIMIT N at the end of the query instead of SELECT TOP N, or switch the dialect selector to T-SQL.',
          severity: 'error',
        },
      ],
    };
  }

  // 5. Valid SQL features not supported yet
  if (/\b(JOIN|GROUP BY|HAVING|OVER\s*\(|UNION|WITH)\b/.test(upper)) {
    return {
      ...base,
      status: 'unsupported',
      concepts: [{ id: 'select', label: 'SELECT', topicSlug: 'select' }],
      explanation: 'This looks like valid SQL, but this feature is not supported in the playground yet.',
      breakdown: [],
      diagnostics: [
        {
          code: 'UNSUPPORTED_FEATURE',
          message:
            'This SQL feature is not supported yet. Try SELECT, FROM, WHERE comparisons, ORDER BY, or LIMIT/TOP.',
          severity: 'warning',
        },
      ],
    };
  }

  // 6. Semantic error: unknown column (golden test case: CGPAA or UnknownColumn)
  if (/\b(CGPAA|UNKNOWNCOLUMN|GPA)\b/.test(upper)) {
    const badCol = upper.includes('CGPAA')
      ? 'CGPAA'
      : upper.includes('UNKNOWNCOLUMN')
        ? 'UnknownColumn'
        : 'GPA';
    return {
      ...base,
      status: 'semantic_error',
      concepts: [
        { id: 'select', label: 'SELECT', topicSlug: 'select' },
        { id: 'from', label: 'FROM', topicSlug: 'select' },
      ],
      explanation: `The column "${badCol}" does not exist in Student.`,
      breakdown: [],
      diagnostics: [
        {
          code: 'UNKNOWN_COLUMN',
          message: `${badCol} is not a column in Student. Available columns: StudentID, Name, Email, CGPA, DepartmentID.`,
          severity: 'error',
        },
      ],
    };
  }

  // 7. Semantic error: unknown table
  const fromMatch = normalized.match(/\bFROM\s+([A-Za-z_][A-Za-z0-9_]*)/i);
  if (fromMatch && fromMatch[1].toLowerCase() !== 'student') {
    return {
      ...base,
      status: 'semantic_error',
      concepts: [{ id: 'select', label: 'SELECT', topicSlug: 'select' }],
      explanation: `Table "${fromMatch[1]}" is not available in this mock preview.`,
      breakdown: [],
      diagnostics: [
        {
          code: 'UNKNOWN_TABLE',
          message: `The selected dataset does not have mock rows for "${fromMatch[1]}". Try querying Student.`,
          severity: 'error',
        },
      ],
    };
  }

  // 8. Golden supported demo queries against Student
  const parsed = matchMockStudentFixture(normalized);
  if (!parsed) {
    return {
      ...base,
      status: 'unsupported',
      concepts: [{ id: 'select', label: 'SELECT', topicSlug: 'select' }],
      explanation:
        'Mock Mode only includes pre-recorded responses for the MVP demo queries against Student.',
      breakdown: [],
      diagnostics: [
        {
          code: 'MOCK_FIXTURE_NOT_MATCHED',
          message:
            'Connect the real backend API for full AST analysis, or try one of the starter queries (e.g., SELECT Name, CGPA FROM Student WHERE CGPA > 3.42;).',
          severity: 'warning',
        },
      ],
    };
  }

  return {
    ...base,
    status: 'valid',
    queryId: `mock-${Date.now()}`,
    concepts: parsed.concepts,
    explanation: parsed.explanation,
    breakdown: parsed.breakdown,
    diagnostics: [],
  };
}

export async function mockEvaluateQuery(
  req: EvaluateQueryRequest,
  signal?: AbortSignal
): Promise<EvaluateQueryResponse> {
  await wait(220, signal);

  const analysis = await mockAnalyzeQuery(req, signal);
  if (analysis.status !== 'valid') {
    throw new ApiClientError(
      analysis.diagnostics[0]?.message || 'Query must be valid before evaluation.',
      analysis.diagnostics[0]?.code || 'INVALID_QUERY',
      422
    );
  }

  const parsed = matchMockStudentFixture(normalizeSql(req.query));
  if (!parsed) {
    throw new ApiClientError('No mock evaluation fixture matched this query.', 'MOCK_NOT_FOUND', 422);
  }

  let rows = [...MOCK_STUDENT_ROWS];

  if (parsed.filter) {
    const { column, op, value } = parsed.filter;
    rows = rows.filter((row) => {
      const cell = row[column];
      switch (op) {
        case '>': return cell > value;
        case '>=': return cell >= value;
        case '<': return cell < value;
        case '<=': return cell <= value;
        case '=': return cell === value;
        case '<>':
        case '!=': return cell !== value;
        default: return true;
      }
    });
  }

  if (parsed.orderBy) {
    const { column, direction } = parsed.orderBy;
    rows.sort((a, b) => {
      const av = a[column];
      const bv = b[column];
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return direction === 'DESC' ? -cmp : cmp;
    });
  }

  if (parsed.limit !== undefined) {
    rows = rows.slice(0, parsed.limit);
  }

  const columns: ResultColumn[] = parsed.selectedColumns.map((col) => ({
    name: col,
    type: col === 'CGPA' || col === 'StudentID' || col === 'DepartmentID' ? 'number' : 'string',
  }));

  const matrix: ResultCell[][] = rows.map((row) =>
    parsed.selectedColumns.map((col) => row[col])
  );

  return {
    status: 'success',
    datasetId: req.datasetId || DEFAULT_DATASET_ID,
    dialect: req.dialect,
    columns,
    rows: matrix,
    rowCount: matrix.length,
  };
}

// --- Internal fixture matcher for the MVP golden queries ---

type StudentCol = keyof typeof MOCK_STUDENT_ROWS[number];
const ALL_STUDENT_COLS: StudentCol[] = ['StudentID', 'Name', 'Email', 'CGPA', 'DepartmentID'];
const COL_LOOKUP: Record<string, StudentCol> = {
  studentid: 'StudentID',
  name: 'Name',
  email: 'Email',
  cgpa: 'CGPA',
  departmentid: 'DepartmentID',
};

interface MockFixturePlan {
  selectedColumns: StudentCol[];
  filter?: { column: 'CGPA' | 'DepartmentID' | 'StudentID'; op: string; value: number };
  orderBy?: { column: StudentCol; direction: 'ASC' | 'DESC' };
  limit?: number;
  concepts: AnalyzeQueryResponse['concepts'];
  explanation: string;
  breakdown: AnalyzeQueryResponse['breakdown'];
}

function opToWords(op: string): string {
  switch (op) {
    case '>': return 'strictly greater than';
    case '>=': return 'greater than or equal to';
    case '<': return 'less than';
    case '<=': return 'less than or equal to';
    case '=': return 'equal to';
    case '<>':
    case '!=': return 'not equal to';
    default: return op;
  }
}

function matchMockStudentFixture(normalized: string): MockFixturePlan | null {
  const pattern =
    /^SELECT\s+(?:TOP\s+(\d+)\s+)?(\*|[A-Za-z0-9_,\s]+?)\s+FROM\s+Student(?:\s+WHERE\s+(CGPA|DepartmentID|StudentID)\s*(=|<>|!=|<=|>=|<|>)\s*(\d+(?:\.\d+)?))?(?:\s+ORDER\s+BY\s+([A-Za-z_]+)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\d+))?$/i;

  const match = normalized.match(pattern);
  if (!match) return null;

  const [, topStr, selectRaw, whereColRaw, whereOp, whereValStr, orderColRaw, orderDirRaw, limitStr] =
    match;

  let selectedColumns: StudentCol[] = [];
  if (selectRaw.trim() === '*') {
    selectedColumns = ALL_STUDENT_COLS;
  } else {
    const parts = selectRaw.split(',').map((s) => s.trim().toLowerCase());
    for (const p of parts) {
      if (!COL_LOOKUP[p]) return null;
      selectedColumns.push(COL_LOOKUP[p]);
    }
  }

  const concepts: AnalyzeQueryResponse['concepts'] = [
    { id: 'select', label: 'SELECT', topicSlug: 'select' },
    { id: 'from', label: 'FROM', topicSlug: 'select' },
  ];

  const breakdown: AnalyzeQueryResponse['breakdown'] = [
    {
      id: 'select-list',
      sourceText: `SELECT ${topStr ? `TOP ${topStr} ` : ''}${selectRaw.trim()}`,
      title: 'Choose output columns',
      explanation:
        selectRaw.trim() === '*'
          ? 'Include every column from the Student table in the output.'
          : `Include only ${selectedColumns.join(', ')} in the output.`,
      variationHint:
        selectRaw.trim() === '*'
          ? 'Try replacing * with Name, CGPA to narrow the columns.'
          : 'Try adding or removing a column name from the SELECT list.',
    },
    {
      id: 'from-clause',
      sourceText: 'FROM Student',
      title: 'Choose the source table',
      explanation: 'Read student rows from the Student table in the active dataset.',
    },
  ];

  let filter: MockFixturePlan['filter'];
  if (whereColRaw && whereOp && whereValStr) {
    const colKey = COL_LOOKUP[whereColRaw.toLowerCase()] as 'CGPA' | 'DepartmentID' | 'StudentID';
    const val = Number(whereValStr);
    filter = { column: colKey, op: whereOp, value: val };
    concepts.push(
      { id: 'where', label: 'WHERE', topicSlug: 'where' },
      { id: 'comparison', label: `Comparison (${whereOp})`, topicSlug: 'where' }
    );
    breakdown.push({
      id: 'where-clause',
      sourceText: `WHERE ${colKey} ${whereOp} ${val}`,
      title: 'Filter rows',
      explanation: `Keep only rows where ${colKey} is ${opToWords(whereOp)} ${val}.`,
      variationHint:
        whereOp === '>'
          ? `Try changing > to >= to see if a boundary row with ${colKey} = ${val} appears.`
          : 'Try adjusting the comparison operator (<, <=, =, >=, >) or threshold value.',
    });
  }

  let orderBy: MockFixturePlan['orderBy'];
  if (orderColRaw) {
    const colKey = COL_LOOKUP[orderColRaw.toLowerCase()];
    if (!colKey) return null;
    const direction = (orderDirRaw?.toUpperCase() as 'ASC' | 'DESC') || 'ASC';
    orderBy = { column: colKey, direction };
    concepts.push({ id: 'order-by', label: 'ORDER BY', topicSlug: 'order-by' });
    breakdown.push({
      id: 'order-by-clause',
      sourceText: `ORDER BY ${colKey} ${direction}`,
      title: 'Sort output rows',
      explanation:
        direction === 'DESC'
          ? `Sort matching rows by ${colKey} from highest to lowest.`
          : `Sort matching rows by ${colKey} from lowest to highest.`,
      variationHint: `Switch ${direction} to ${direction === 'DESC' ? 'ASC' : 'DESC'} to reverse the order.`,
    });
  }

  const limitNum = topStr ? Number(topStr) : limitStr ? Number(limitStr) : undefined;
  if (limitNum !== undefined) {
    concepts.push({
      id: topStr ? 'top' : 'limit',
      label: topStr ? 'TOP (T-SQL)' : 'LIMIT (MySQL)',
      topicSlug: 'order-by',
    });
    breakdown.push({
      id: 'row-limit',
      sourceText: topStr ? `TOP ${limitNum}` : `LIMIT ${limitNum}`,
      title: 'Cap returned rows',
      explanation: `Return at most ${limitNum} row${limitNum === 1 ? '' : 's'} after filtering and sorting.`,
    });
  }

  const colPhrase =
    selectRaw.trim() === '*'
      ? 'all columns'
      : selectedColumns.join(' and ');
  const wherePhrase = filter
    ? ` whose ${filter.column} is ${opToWords(filter.op)} ${filter.value}`
    : '';
  const orderPhrase = orderBy
    ? `, sorted by ${orderBy.column} (${orderBy.direction === 'DESC' ? 'highest first' : 'lowest first'})`
    : '';
  const limitPhrase =
    limitNum !== undefined ? `, limited to at most ${limitNum} row${limitNum === 1 ? '' : 's'}` : '';

  return {
    selectedColumns,
    filter,
    orderBy,
    limit: limitNum,
    concepts,
    explanation: `Returns ${colPhrase} for students${wherePhrase}${orderPhrase}${limitPhrase}.`,
    breakdown,
  };
}
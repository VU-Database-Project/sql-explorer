export type SqlDialect = 'mysql' | 'tsql';

export interface DialectOption {
  id: SqlDialect;
  label: string;
  shortLabel: string;
  description: string;
}

export const DIALECT_OPTIONS: DialectOption[] = [
  {
    id: 'mysql',
    label: 'MySQL',
    shortLabel: 'MySQL',
    description: 'Uses LIMIT for row caps and standard backtick identifiers.',
  },
  {
    id: 'tsql',
    label: 'Microsoft SQL Server (T-SQL)',
    shortLabel: 'T-SQL',
    description: 'Uses TOP for row caps and bracketed identifiers.',
  },
];

export type QueryStatus =
  | 'valid'
  | 'incomplete'
  | 'syntax_error'
  | 'semantic_error'
  | 'unsupported';

export interface QueryConcept {
  id: string;
  label: string;
  topicSlug?: string;
}

export interface QueryBreakdownItem {
  id: string;
  sourceText: string;
  title: string;
  explanation: string;
  variationHint?: string;
}

export type DiagnosticSeverity = 'info' | 'warning' | 'error';

export interface QueryDiagnostic {
  code: string;
  message: string;
  line?: number;
  column?: number;
  severity: DiagnosticSeverity;
}

export interface AnalyzeQueryRequest {
  query: string;
  dialect: SqlDialect;
  datasetId: string;
}

export interface AnalyzeQueryResponse {
  status: QueryStatus;
  queryId?: string;
  datasetId: string;
  dialect: SqlDialect;
  concepts: QueryConcept[];
  explanation: string;
  breakdown: QueryBreakdownItem[];
  diagnostics: QueryDiagnostic[];
}

export interface EvaluateQueryRequest {
  query: string;
  dialect: SqlDialect;
  datasetId: string;
}

export interface ResultColumn {
  name: string;
  type: string;
}

export type ResultCell = string | number | boolean | null;

export interface EvaluateQueryResponse {
  status: 'success';
  datasetId: string;
  dialect: SqlDialect;
  columns: ResultColumn[];
  rows: ResultCell[][];
  rowCount: number;
}

export interface ApiErrorResponse {
  status: 'error';
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface DatasetColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  description: string;
  isPrimaryKey?: boolean;
  references?: string;
}

export interface DatasetTable {
  name: string;
  description: string;
  columns: DatasetColumn[];
}

export interface DatasetSummary {
  id: string;
  name: string;
  version: string;
  description: string;
  tableNames: string[];
}

export interface DatasetSchema {
  datasetId: string;
  name: string;
  description: string;
  tables: DatasetTable[];
}

export interface TopicExample {
  id: string;
  title: string;
  datasetId: string;
  queryByDialect: Record<SqlDialect, string>;
  explanation: string;
}

export interface TopicComponentNote {
  token: string;
  meaning: string;
}

export interface TopicSummary {
  slug: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate';
  summary: string;
  prerequisites: string[];
}

export interface TopicDetail extends TopicSummary {
  overview: string;
  whyItExists: string;
  syntaxByDialect: Record<SqlDialect, string>;
  components: TopicComponentNote[];
  example: TopicExample;
  variations: string[];
  relatedSlugs: string[];
}

export interface PlaygroundLaunchState {
  query?: string;
  dialect?: SqlDialect;
  datasetId?: string;
  lessonSlug?: string;
  lessonTitle?: string;
  focusConcept?: string;
}
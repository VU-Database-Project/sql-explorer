import type {
  DatasetSchema,
  DatasetSummary,
  TopicDetail,
  TopicSummary,
} from '../types/api';

export const DEFAULT_DATASET_ID = 'university-demo-v1';

export const MOCK_DATASETS: DatasetSummary[] = [
  {
    id: DEFAULT_DATASET_ID,
    name: 'University Demo (v1)',
    version: '1.0',
    description:
      'Synthetic university dataset with fictional student, department, course, enrollment, and teacher records.',
    tableNames: ['Student', 'Department', 'Course', 'Enrollment', 'Teacher'],
  },
];

export const MOCK_DATASET_SCHEMAS: Record<string, DatasetSchema> = {
  [DEFAULT_DATASET_ID]: {
    datasetId: DEFAULT_DATASET_ID,
    name: 'University Demo (v1)',
    description: 'Fictional sample tables for learning SQL safely.',
    tables: [
      {
        name: 'Student',
        description: 'Synthetic student records used in beginner queries.',
        columns: [
          {
            name: 'StudentID',
            dataType: 'INT',
            nullable: false,
            description: 'Unique identifier for each student.',
            isPrimaryKey: true,
          },
          {
            name: 'Name',
            dataType: 'VARCHAR',
            nullable: false,
            description: 'Fictional student name.',
          },
          {
            name: 'Email',
            dataType: 'VARCHAR',
            nullable: false,
            description: 'Synthetic university email address.',
          },
          {
            name: 'CGPA',
            dataType: 'DECIMAL(3,2)',
            nullable: false,
            description: 'Cumulative grade point average (0.00 to 4.00).',
          },
          {
            name: 'DepartmentID',
            dataType: 'INT',
            nullable: false,
            description: 'Department the student belongs to.',
            references: 'Department.DepartmentID',
          },
        ],
      },
      {
        name: 'Department',
        description: 'Academic departments.',
        columns: [
          {
            name: 'DepartmentID',
            dataType: 'INT',
            nullable: false,
            description: 'Unique department code.',
            isPrimaryKey: true,
          },
          {
            name: 'DepartmentName',
            dataType: 'VARCHAR',
            nullable: false,
            description: 'Name of the academic department.',
          },
        ],
      },
      {
        name: 'Course',
        description: 'Courses offered by departments.',
        columns: [
          {
            name: 'CourseID',
            dataType: 'VARCHAR',
            nullable: false,
            description: 'Unique course code.',
            isPrimaryKey: true,
          },
          {
            name: 'CourseName',
            dataType: 'VARCHAR',
            nullable: false,
            description: 'Course title.',
          },
          {
            name: 'Credit',
            dataType: 'DECIMAL(2,1)',
            nullable: false,
            description: 'Credit hours.',
          },
          {
            name: 'DepartmentID',
            dataType: 'INT',
            nullable: false,
            description: 'Owning department.',
            references: 'Department.DepartmentID',
          },
        ],
      },
    ],
  },
};

export interface MockStudentRow {
  StudentID: number;
  Name: string;
  Email: string;
  CGPA: number;
  DepartmentID: number;
}

export const MOCK_STUDENT_ROWS: MockStudentRow[] = [
  { StudentID: 101, Name: 'Amina', Email: 'amina@demo.edu', CGPA: 3.75, DepartmentID: 10 },
  { StudentID: 102, Name: 'Rafi', Email: 'rafi@demo.edu', CGPA: 3.20, DepartmentID: 20 },
  { StudentID: 103, Name: 'Nadia', Email: 'nadia@demo.edu', CGPA: 3.55, DepartmentID: 10 },
  { StudentID: 104, Name: 'Sami', Email: 'sami@demo.edu', CGPA: 3.42, DepartmentID: 30 },
  { StudentID: 105, Name: 'Tuhin', Email: 'tuhin@demo.edu', CGPA: 3.90, DepartmentID: 20 },
];

export const MOCK_TOPICS: TopicDetail[] = [
  {
    slug: 'select',
    title: 'SELECT & FROM',
    category: 'Fundamentals',
    difficulty: 'Beginner',
    summary: 'Choose which columns to display and which table to read rows from.',
    prerequisites: [],
    overview:
      'SELECT tells the database which columns should appear in the output table, while FROM identifies the source table containing the rows.',
    whyItExists:
      'Real tables often hold dozens of columns. Selecting only the columns you need makes query results clearer and easier to reason about.',
    syntaxByDialect: {
      mysql: 'SELECT column1, column2\nFROM table_name;',
      tsql: 'SELECT column1, column2\nFROM table_name;',
    },
    components: [
      { token: 'SELECT', meaning: 'Starts a read-only query and lists the output columns (or * for all columns).' },
      { token: 'Name, CGPA', meaning: 'Specific column names requested from the source table.' },
      { token: 'FROM Student', meaning: 'Specifies Student as the table to read rows from.' },
    ],
    example: {
      id: 'ex-select-all',
      title: 'Retrieve all students',
      datasetId: DEFAULT_DATASET_ID,
      queryByDialect: {
        mysql: 'SELECT *\nFROM Student;',
        tsql: 'SELECT *\nFROM Student;',
      },
      explanation: 'Reads every row from Student and includes all columns in the output.',
    },
    variations: [
      'Replace * with Name, CGPA to return only two columns.',
      'Add a WHERE clause to filter students by CGPA.',
    ],
    relatedSlugs: ['where', 'order-by'],
  },
  {
    slug: 'where',
    title: 'Filtering with WHERE',
    category: 'Filtering',
    difficulty: 'Beginner',
    summary: 'Keep only rows that satisfy a comparison condition.',
    prerequisites: ['SELECT & FROM'],
    overview:
      'The WHERE clause evaluates a condition for each row in the source table and keeps only the rows where that condition is true.',
    whyItExists:
      'Without filtering, a query returns every row in the table. WHERE lets you focus on records matching specific thresholds or values.',
    syntaxByDialect: {
      mysql: 'SELECT column1\nFROM table_name\nWHERE column_name > value;',
      tsql: 'SELECT column1\nFROM table_name\nWHERE column_name > value;',
    },
    components: [
      { token: 'WHERE', meaning: 'Introduces the row-filtering condition.' },
      { token: 'CGPA', meaning: 'The numeric column being tested for each row.' },
      { token: '>', meaning: 'Strict greater-than comparison operator (excludes exact matches).' },
      { token: '3.42', meaning: 'Numeric threshold literal compared against CGPA.' },
    ],
    example: {
      id: 'ex-where-cgpa',
      title: 'Find students with CGPA above 3.42',
      datasetId: DEFAULT_DATASET_ID,
      queryByDialect: {
        mysql: 'SELECT Name, CGPA\nFROM Student\nWHERE CGPA > 3.42;',
        tsql: 'SELECT Name, CGPA\nFROM Student\nWHERE CGPA > 3.42;',
      },
      explanation: 'Returns the Name and CGPA of students whose CGPA is strictly greater than 3.42.',
    },
    variations: [
      'Change > to >= to see how the boundary row (CGPA = 3.42) is included.',
      'Change 3.42 to 4.00 to observe a valid empty result set.',
    ],
    relatedSlugs: ['select', 'order-by'],
  },
  {
    slug: 'order-by',
    title: 'Sorting & Limiting Rows',
    category: 'Sorting',
    difficulty: 'Beginner',
    summary: 'Order output rows and cap how many rows are returned in MySQL vs. T-SQL.',
    prerequisites: ['SELECT & FROM'],
    overview:
      'ORDER BY arranges the output rows by one or more columns in ascending (ASC) or descending (DESC) order. Row limits differ by dialect: MySQL uses LIMIT at the end, while T-SQL uses TOP right after SELECT.',
    whyItExists:
      'Relational tables have no guaranteed display order. Sorting and capping rows lets you inspect top or bottom values predictably.',
    syntaxByDialect: {
      mysql: 'SELECT column1, column2\nFROM table_name\nORDER BY column2 DESC\nLIMIT 3;',
      tsql: 'SELECT TOP 3 column1, column2\nFROM table_name\nORDER BY column2 DESC;',
    },
    components: [
      { token: 'ORDER BY CGPA DESC', meaning: 'Sorts matching rows from highest CGPA to lowest.' },
      { token: 'LIMIT 3 (MySQL)', meaning: 'Returns at most 3 rows after sorting in MySQL.' },
      { token: 'TOP 3 (T-SQL)', meaning: 'Returns at most 3 rows after sorting in Microsoft SQL Server.' },
    ],
    example: {
      id: 'ex-order-top',
      title: 'Top 3 students by CGPA',
      datasetId: DEFAULT_DATASET_ID,
      queryByDialect: {
        mysql: 'SELECT Name, CGPA\nFROM Student\nORDER BY CGPA DESC\nLIMIT 3;',
        tsql: 'SELECT TOP 3 Name, CGPA\nFROM Student\nORDER BY CGPA DESC;',
      },
      explanation: 'Lists the highest-scoring students first and caps the output to 3 rows.',
    },
    variations: [
      'Remove LIMIT 3 (or TOP 3) to inspect all students sorted by CGPA.',
      'Switch DESC to ASC to sort from lowest CGPA to highest.',
    ],
    relatedSlugs: ['select', 'where'],
  },
];

export const MOCK_TOPIC_SUMMARIES: TopicSummary[] = MOCK_TOPICS.map(
  ({ slug, title, category, difficulty, summary, prerequisites }) => ({
    slug,
    title,
    category,
    difficulty,
    summary,
    prerequisites,
  })
);
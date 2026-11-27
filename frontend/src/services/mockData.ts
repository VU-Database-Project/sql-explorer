import type {
  DatasetSchema,
  DatasetSummary,
  ResultCell,
  TopicDetail,
} from '../types/api';

export const DEFAULT_DATASET_ID = 'university-demo-v1';

export const MOCK_DATASETS: DatasetSummary[] = [
  {
    id: 'university-demo-v1',
    name: 'University Academic Records',
    version: '1.0',
    description:
      'Synthetic undergraduate dataset with departments, students, courses, enrollments, faculty, and an HonorStudents view.',
    tableNames: [
      'Department',
      'Student',
      'Course',
      'Enrollment',
      'Teacher',
      'HonorStudents',
    ],
  },
];

export const MOCK_DATASET_SCHEMA: DatasetSchema = {
  datasetId: 'university-demo-v1',
  name: 'University Academic Records (v1)',
  description:
    'Normalized relational schema designed for practicing filtering, aggregation, joins, integrity keys, and views.',
  tables: [
    {
      name: 'Department',
      description: 'Academic departments offering degree programs.',
      columns: [
        {
          name: 'DepartmentID',
          dataType: 'INT',
          nullable: false,
          description: 'Unique department identifier (Primary Key).',
          isPrimaryKey: true,
        },
        {
          name: 'DepartmentName',
          dataType: 'VARCHAR(100)',
          nullable: false,
          description: 'Official name of the academic department.',
        },
      ],
    },
    {
      name: 'Student',
      description: 'Undergraduate student records and cumulative GPA.',
      columns: [
        {
          name: 'StudentID',
          dataType: 'INT',
          nullable: false,
          description: 'Unique student roll identifier (Primary Key).',
          isPrimaryKey: true,
        },
        {
          name: 'Name',
          dataType: 'VARCHAR(100)',
          nullable: false,
          description: 'Student first name.',
        },
        {
          name: 'Email',
          dataType: 'VARCHAR(150)',
          nullable: false,
          description: 'Unique university email address.',
        },
        {
          name: 'CGPA',
          dataType: 'DECIMAL(3,2)',
          nullable: false,
          description: 'Cumulative grade point average on a 4.00 scale.',
        },
        {
          name: 'DepartmentID',
          dataType: 'INT',
          nullable: false,
          description: 'Foreign key referencing Department(DepartmentID).',
          references: 'Department.DepartmentID',
        },
      ],
    },
    {
      name: 'Course',
      description: 'Courses offered across departments.',
      columns: [
        {
          name: 'CourseID',
          dataType: 'VARCHAR(20)',
          nullable: false,
          description: 'Unique course code such as CSE-2201 (Primary Key).',
          isPrimaryKey: true,
        },
        {
          name: 'CourseName',
          dataType: 'VARCHAR(150)',
          nullable: false,
          description: 'Full title of the course.',
        },
        {
          name: 'Credit',
          dataType: 'DECIMAL(2,1)',
          nullable: false,
          description: 'Credit hours awarded upon completion.',
        },
        {
          name: 'DepartmentID',
          dataType: 'INT',
          nullable: false,
          description: 'Host department ID.',
          references: 'Department.DepartmentID',
        },
      ],
    },
    {
      name: 'Enrollment',
      description: 'Junction table linking students to enrolled courses and grades.',
      columns: [
        {
          name: 'EnrollmentID',
          dataType: 'INT',
          nullable: false,
          description: 'Unique enrollment record ID (Primary Key).',
          isPrimaryKey: true,
        },
        {
          name: 'StudentID',
          dataType: 'INT',
          nullable: false,
          description: 'Enrolled student ID.',
          references: 'Student.StudentID',
        },
        {
          name: 'CourseID',
          dataType: 'VARCHAR(20)',
          nullable: false,
          description: 'Enrolled course code.',
          references: 'Course.CourseID',
        },
        {
          name: 'Semester',
          dataType: 'VARCHAR(20)',
          nullable: false,
          description: 'Academic term (e.g., Fall-2026).',
        },
        {
          name: 'Grade',
          dataType: 'VARCHAR(5)',
          nullable: true,
          description: 'Letter grade (NULL while course is still in progress).',
        },
      ],
    },
    {
      name: 'Teacher',
      description: 'Faculty members assigned to academic departments.',
      columns: [
        {
          name: 'TeacherID',
          dataType: 'INT',
          nullable: false,
          description: 'Unique faculty identifier (Primary Key).',
          isPrimaryKey: true,
        },
        {
          name: 'Name',
          dataType: 'VARCHAR(100)',
          nullable: false,
          description: 'Faculty full name.',
        },
        {
          name: 'Designation',
          dataType: 'VARCHAR(80)',
          nullable: false,
          description: 'Academic rank (Professor, Associate Professor, Lecturer).',
        },
        {
          name: 'DepartmentID',
          dataType: 'INT',
          nullable: false,
          description: 'Department where the teacher is appointed.',
          references: 'Department.DepartmentID',
        },
      ],
    },
    {
      name: 'HonorStudents',
      description: 'Virtual View filtering Student rows where CGPA >= 3.50.',
      columns: [
        {
          name: 'StudentID',
          dataType: 'INT',
          nullable: false,
          description: 'Student ID projected from Student.',
        },
        {
          name: 'Name',
          dataType: 'VARCHAR(100)',
          nullable: false,
          description: 'Student name projected from Student.',
        },
        {
          name: 'CGPA',
          dataType: 'DECIMAL(3,2)',
          nullable: false,
          description: 'CGPA (>= 3.50).',
        },
        {
          name: 'DepartmentID',
          dataType: 'INT',
          nullable: false,
          description: 'Department ID projected from Student.',
        },
      ],
    },
  ],
};

export const MOCK_TABLES: Record<string, Record<string, ResultCell>[]> = {
  Department: [
    { DepartmentID: 10, DepartmentName: 'Computer Science & Engineering' },
    { DepartmentID: 20, DepartmentName: 'Electrical & Electronic Engineering' },
    { DepartmentID: 30, DepartmentName: 'Business Administration' },
  ],
  Student: [
    { StudentID: 101, Name: 'Amina', Email: 'amina@demo.edu', CGPA: 3.75, DepartmentID: 10 },
    { StudentID: 102, Name: 'Rafi', Email: 'rafi@demo.edu', CGPA: 3.2, DepartmentID: 20 },
    { StudentID: 103, Name: 'Nadia', Email: 'nadia@demo.edu', CGPA: 3.55, DepartmentID: 10 },
    { StudentID: 104, Name: 'Sami', Email: 'sami@demo.edu', CGPA: 3.42, DepartmentID: 30 },
    { StudentID: 105, Name: 'Tuhin', Email: 'tuhin@demo.edu', CGPA: 3.9, DepartmentID: 20 },
  ],
  Course: [
    { CourseID: 'CSE-2201', CourseName: 'Database Management Systems', Credit: 3.0, DepartmentID: 10 },
    { CourseID: 'CSE-2203', CourseName: 'Computer Algorithms', Credit: 3.0, DepartmentID: 10 },
    { CourseID: 'EEE-2101', CourseName: 'Digital Logic Design', Credit: 3.0, DepartmentID: 20 },
    { CourseID: 'BBA-1101', CourseName: 'Principles of Management', Credit: 3.0, DepartmentID: 30 },
  ],
  Enrollment: [
    { EnrollmentID: 1, StudentID: 101, CourseID: 'CSE-2201', Semester: 'Fall-2026', Grade: 'A' },
    { EnrollmentID: 2, StudentID: 101, CourseID: 'CSE-2203', Semester: 'Fall-2026', Grade: 'A-' },
    { EnrollmentID: 3, StudentID: 102, CourseID: 'EEE-2101', Semester: 'Fall-2026', Grade: 'B+' },
    { EnrollmentID: 4, StudentID: 103, CourseID: 'CSE-2201', Semester: 'Fall-2026', Grade: 'A-' },
    { EnrollmentID: 5, StudentID: 105, CourseID: 'EEE-2101', Semester: 'Fall-2026', Grade: 'A+' },
    { EnrollmentID: 6, StudentID: 104, CourseID: 'BBA-1101', Semester: 'Spring-2027', Grade: null },
  ],
  Teacher: [
    { TeacherID: 501, Name: 'Dr. Farhana Rahman', Designation: 'Associate Professor', DepartmentID: 10 },
    { TeacherID: 502, Name: 'Tanvir Ahmed', Designation: 'Assistant Professor', DepartmentID: 20 },
    { TeacherID: 503, Name: 'Nusrat Jahan', Designation: 'Lecturer', DepartmentID: 30 },
  ],
  HonorStudents: [
    { StudentID: 101, Name: 'Amina', CGPA: 3.75, DepartmentID: 10 },
    { StudentID: 103, Name: 'Nadia', CGPA: 3.55, DepartmentID: 10 },
    { StudentID: 105, Name: 'Tuhin', CGPA: 3.9, DepartmentID: 20 },
  ],
};

export const MOCK_TOPICS: TopicDetail[] = [
  {
    slug: 'select',
    title: 'SELECT & FROM',
    category: 'Querying Basics',
    difficulty: 'Beginner',
    summary: 'Choose which columns to project and which base table to read rows from.',
    prerequisites: [],
    overview:
      'Every read query begins by naming the columns you want in the output (SELECT) and the table holding those records (FROM). Even though SELECT is written first, the database logically locates the FROM table before projecting columns.',
    whyItExists:
      'Applications rarely need every column stored in a wide table. Explicit column projection reduces network payload and makes query intent clear.',
    syntaxByDialect: {
      mysql: 'SELECT column1, column2\nFROM table_name;',
      tsql: 'SELECT column1, column2\nFROM table_name;',
    },
    components: [
      { token: 'SELECT', meaning: 'Lists the columns or expressions to include in each output row.' },
      { token: '*', meaning: 'Wildcard shorthand that projects every column in table definition order.' },
      { token: 'FROM', meaning: 'Specifies the source table or view from which rows are read.' },
    ],
    example: {
      id: 'ex-select',
      title: 'Project student names and GPAs',
      datasetId: 'university-demo-v1',
      queryByDialect: {
        mysql: 'SELECT StudentID, Name, CGPA\nFROM Student;',
        tsql: 'SELECT StudentID, Name, CGPA\nFROM Student;',
      },
      explanation: 'Reads all 5 rows from Student and projects only StudentID, Name, and CGPA.',
    },
    variations: [
      'SELECT * FROM Student;',
      'SELECT CourseID, CourseName, Credit FROM Course;',
      'SELECT Name, Designation FROM Teacher;',
    ],
    relatedSlugs: ['where', 'order-by', 'views'],
  },
  {
    slug: 'where',
    title: 'Filtering with WHERE',
    category: 'Querying Basics',
    difficulty: 'Beginner',
    summary: 'Filter rows using comparison predicates (=, >, >=, <, <>) and logical AND / OR.',
    prerequisites: ['select'],
    overview:
      'The WHERE clause evaluates a boolean predicate against each candidate row from FROM. Only rows where the predicate evaluates to TRUE survive to projection.',
    whyItExists:
      'Filtering inside the database engine avoids transferring thousands of irrelevant rows to application memory.',
    syntaxByDialect: {
      mysql: 'SELECT column1, column2\nFROM table_name\nWHERE condition;',
      tsql: 'SELECT column1, column2\nFROM table_name\nWHERE condition;',
    },
    components: [
      { token: 'WHERE', meaning: 'Introduces row-level filter conditions evaluated before SELECT.' },
      { token: '>', meaning: 'Strict greater-than comparison (excludes exact boundary values).' },
      { token: '>=', meaning: 'Greater-than-or-equal comparison (includes boundary matches).' },
      { token: 'AND / OR', meaning: 'Combines multiple boolean conditions.' },
    ],
    example: {
      id: 'ex-where',
      title: 'Find students with CGPA above 3.42',
      datasetId: 'university-demo-v1',
      queryByDialect: {
        mysql: 'SELECT Name, CGPA\nFROM Student\nWHERE CGPA > 3.42;',
        tsql: 'SELECT Name, CGPA\nFROM Student\nWHERE CGPA > 3.42;',
      },
      explanation: 'Keeps Amina (3.75), Nadia (3.55), and Tuhin (3.90), while excluding Sami (3.42).',
    },
    variations: [
      'SELECT Name, CGPA FROM Student WHERE CGPA >= 3.42;',
      'SELECT Name, CGPA FROM Student WHERE DepartmentID = 10 AND CGPA >= 3.60;',
      'SELECT Name, CGPA FROM Student WHERE CGPA > 4.00;',
    ],
    relatedSlugs: ['select', 'pattern-range-filtering', 'order-by'],
  },
  {
    slug: 'order-by',
    title: 'Sorting & Limiting Rows',
    category: 'Querying Basics',
    difficulty: 'Beginner',
    summary: 'Sort output deterministically with ORDER BY and cap row counts with LIMIT or TOP.',
    prerequisites: ['select', 'where'],
    overview:
      'Relational tables have no guaranteed physical order. ORDER BY sorts the final result set, and dialect-specific row caps (LIMIT in MySQL, TOP in T-SQL) return the top N rows.',
    whyItExists:
      'Leaderboards, pagination, and top-K lookups depend on deterministic sorting paired with row limits.',
    syntaxByDialect: {
      mysql: 'SELECT column1, column2\nFROM table_name\nORDER BY column2 DESC\nLIMIT 3;',
      tsql: 'SELECT TOP 3 column1, column2\nFROM table_name\nORDER BY column2 DESC;',
    },
    components: [
      { token: 'ORDER BY', meaning: 'Sorts output rows by one or more columns (ASC default, DESC descending).' },
      { token: 'LIMIT N', meaning: 'MySQL/PostgreSQL clause placed at the end to cap returned rows.' },
      { token: 'TOP N', meaning: 'T-SQL keyword placed right after SELECT to cap returned rows.' },
    ],
    example: {
      id: 'ex-order-by',
      title: 'Top 3 students by CGPA',
      datasetId: 'university-demo-v1',
      queryByDialect: {
        mysql: 'SELECT Name, CGPA\nFROM Student\nORDER BY CGPA DESC\nLIMIT 3;',
        tsql: 'SELECT TOP 3 Name, CGPA\nFROM Student\nORDER BY CGPA DESC;',
      },
      explanation: 'Sorts students from highest to lowest CGPA and returns Tuhin, Amina, and Nadia.',
    },
    variations: [
      'SELECT Name, CGPA FROM Student ORDER BY Name ASC;',
      'SELECT Name, CGPA FROM Student WHERE DepartmentID = 10 ORDER BY CGPA DESC;',
    ],
    relatedSlugs: ['where', 'aggregate-functions'],
  },
  {
    slug: 'pattern-range-filtering',
    title: 'Pattern & Range Filtering (LIKE, IN, BETWEEN, IS NULL)',
    category: 'Querying Basics',
    difficulty: 'Beginner',
    summary: 'Match string patterns with LIKE, test set membership with IN, check ranges with BETWEEN, and detect missing values with IS NULL.',
    prerequisites: ['where'],
    overview:
      'Beyond basic = and > comparisons, SQL provides expressive predicates for partial text search (LIKE), discrete value lists (IN), inclusive intervals (BETWEEN), and three-valued NULL checks (IS NULL).',
    whyItExists:
      'Writing dozens of OR conditions is error-prone, and standard = NULL fails because NULL represents an unknown value rather than a number or string.',
    syntaxByDialect: {
      mysql:
        "SELECT Name, CGPA\nFROM Student\nWHERE Name LIKE 'A%'\n  OR DepartmentID IN (10, 20)\n  AND CGPA BETWEEN 3.50 AND 4.00;",
      tsql:
        "SELECT Name, CGPA\nFROM Student\nWHERE Name LIKE 'A%'\n  OR DepartmentID IN (10, 20)\n  AND CGPA BETWEEN 3.50 AND 4.00;",
    },
    components: [
      { token: "LIKE 'A%'", meaning: 'Matches text starting with A (% = any sequence of chars, _ = single char).' },
      { token: 'IN (10, 20)', meaning: 'Returns TRUE if the column matches any value in the list.' },
      { token: 'BETWEEN a AND b', meaning: 'Inclusive range check equivalent to col >= a AND col <= b.' },
      { token: 'IS NULL', meaning: 'Tests whether a column value is missing (NULL).' },
    ],
    example: {
      id: 'ex-pattern-range',
      title: 'Filter by department list and CGPA range',
      datasetId: 'university-demo-v1',
      queryByDialect: {
        mysql:
          'SELECT Name, CGPA, DepartmentID\nFROM Student\nWHERE DepartmentID IN (10, 20)\n  AND CGPA BETWEEN 3.50 AND 4.00;',
        tsql:
          'SELECT Name, CGPA, DepartmentID\nFROM Student\nWHERE DepartmentID IN (10, 20)\n  AND CGPA BETWEEN 3.50 AND 4.00;',
      },
      explanation: 'Selects CSE (10) and EEE (20) students whose CGPA lies between 3.50 and 4.00 inclusive.',
    },
    variations: [
      "SELECT Name, Email FROM Student WHERE Name LIKE '%a';",
      'SELECT EnrollmentID, StudentID, CourseID, Semester FROM Enrollment WHERE Grade IS NULL;',
      'SELECT StudentID, CourseID, Grade FROM Enrollment WHERE Grade IS NOT NULL;',
    ],
    relatedSlugs: ['where', 'aggregate-functions'],
  },
  {
    slug: 'aggregate-functions',
    title: 'Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)',
    category: 'Aggregation',
    difficulty: 'Intermediate',
    summary: 'Collapse multiple rows into summary metrics using COUNT, SUM, AVG, MIN, and MAX.',
    prerequisites: ['select', 'where'],
    overview:
      'Aggregate functions compute a single summary value across a set of rows. Unless paired with GROUP BY, an aggregate query collapses the entire filtered table into one summary row.',
    whyItExists:
      'Dashboards and reports rely on database-level summaries—such as class average CGPA or total enrolled students—without fetching every raw record.',
    syntaxByDialect: {
      mysql: 'SELECT COUNT(*) AS TotalRows, AVG(CGPA) AS AvgCGPA, MAX(CGPA) AS TopCGPA\nFROM Student;',
      tsql: 'SELECT COUNT(*) AS TotalRows, AVG(CGPA) AS AvgCGPA, MAX(CGPA) AS TopCGPA\nFROM Student;',
    },
    components: [
      { token: 'COUNT(*)', meaning: 'Counts all matching rows, including rows with NULL columns.' },
      { token: 'COUNT(col)', meaning: 'Counts only rows where the specified column is NOT NULL.' },
      { token: 'AVG / SUM', meaning: 'Computes arithmetic mean or total across numeric values (ignoring NULL).' },
      { token: 'MIN / MAX', meaning: 'Finds the smallest or largest value in the column.' },
    ],
    example: {
      id: 'ex-aggregates',
      title: 'Compute university-wide CGPA statistics',
      datasetId: 'university-demo-v1',
      queryByDialect: {
        mysql:
          'SELECT COUNT(*) AS TotalStudents, AVG(CGPA) AS AverageCGPA, MAX(CGPA) AS HighestCGPA, MIN(CGPA) AS LowestCGPA\nFROM Student;',
        tsql:
          'SELECT COUNT(*) AS TotalStudents, AVG(CGPA) AS AverageCGPA, MAX(CGPA) AS HighestCGPA, MIN(CGPA) AS LowestCGPA\nFROM Student;',
      },
      explanation: 'Summarizes all 5 Student rows into count (5), average (3.56), highest (3.90), and lowest (3.20).',
    },
    variations: [
      'SELECT COUNT(Grade) AS GradedCount, COUNT(*) AS TotalEnrollments FROM Enrollment;',
      'SELECT SUM(Credit) AS TotalCredits FROM Course WHERE DepartmentID = 10;',
    ],
    relatedSlugs: ['group-by-having', 'order-by'],
  },
  {
    slug: 'group-by-having',
    title: 'Grouping Data (GROUP BY & HAVING)',
    category: 'Aggregation',
    difficulty: 'Intermediate',
    summary: 'Partition rows into buckets with GROUP BY and filter aggregated buckets with HAVING.',
    prerequisites: ['aggregate-functions'],
    overview:
      'GROUP BY partitions rows sharing the same key into groups so aggregate functions run once per group. HAVING filters those groups after aggregation—unlike WHERE, which filters individual rows before grouping.',
    whyItExists:
      'Answering questions like "Which departments have an average CGPA of at least 3.50?" requires grouping rows by department first and filtering the group averages afterward.',
    syntaxByDialect: {
      mysql:
        'SELECT DepartmentID, COUNT(*) AS StudentCount, AVG(CGPA) AS AvgCGPA\nFROM Student\nGROUP BY DepartmentID\nHAVING AVG(CGPA) >= 3.50;',
      tsql:
        'SELECT DepartmentID, COUNT(*) AS StudentCount, AVG(CGPA) AS AvgCGPA\nFROM Student\nGROUP BY DepartmentID\nHAVING AVG(CGPA) >= 3.50;',
    },
    components: [
      { token: 'GROUP BY col', meaning: 'Creates one summary bucket per distinct value of col.' },
      { token: 'HAVING cond', meaning: 'Filters grouped buckets using aggregate predicates (e.g., COUNT(*) > 1).' },
      { token: 'Execution Order', meaning: 'FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY.' },
    ],
    example: {
      id: 'ex-group-by',
      title: 'Departments with average CGPA >= 3.50',
      datasetId: 'university-demo-v1',
      queryByDialect: {
        mysql:
          'SELECT DepartmentID, COUNT(*) AS StudentCount, AVG(CGPA) AS AvgCGPA\nFROM Student\nGROUP BY DepartmentID\nHAVING AVG(CGPA) >= 3.50;',
        tsql:
          'SELECT DepartmentID, COUNT(*) AS StudentCount, AVG(CGPA) AS AvgCGPA\nFROM Student\nGROUP BY DepartmentID\nHAVING AVG(CGPA) >= 3.50;',
      },
      explanation: 'Groups students by DepartmentID and keeps departments whose group average CGPA is >= 3.50 (Dept 10 and Dept 20).',
    },
    variations: [
      'SELECT DepartmentID, COUNT(*) AS StudentCount FROM Student GROUP BY DepartmentID;',
      'SELECT StudentID, COUNT(*) AS CoursesTaken FROM Enrollment GROUP BY StudentID HAVING COUNT(*) >= 2;',
    ],
    relatedSlugs: ['aggregate-functions', 'joins'],
  },
  {
    slug: 'cross-product',
    title: 'Cartesian Product (CROSS JOIN)',
    category: 'Joins & Sets',
    difficulty: 'Intermediate',
    summary: 'Generate every possible pair of rows (A x B) across two tables using CROSS JOIN.',
    prerequisites: ['select'],
    overview:
      'A Cartesian product pairs every row in the left table (M rows) with every row in the right table (N rows), producing M x N total rows. In SQL, this happens explicitly with CROSS JOIN or implicitly when listing two tables in FROM without a JOIN condition.',
    whyItExists:
      'Understanding Cartesian products explains why forgetting an ON condition in a join multiplies row counts—and is intentionally useful when generating schedules, grids, or combinations.',
    syntaxByDialect: {
      mysql: 'SELECT Student.Name, Department.DepartmentName\nFROM Student\nCROSS JOIN Department;',
      tsql: 'SELECT Student.Name, Department.DepartmentName\nFROM Student\nCROSS JOIN Department;',
    },
    components: [
      { token: 'CROSS JOIN', meaning: 'Explicitly pairs all M rows of table A with all N rows of table B (no ON clause).' },
      { token: 'M x N Rows', meaning: '5 students x 3 departments = 15 combined rows.' },
    ],
    example: {
      id: 'ex-cross-product',
      title: 'Cartesian product of Student and Department',
      datasetId: 'university-demo-v1',
      queryByDialect: {
        mysql: 'SELECT Student.Name, Department.DepartmentName\nFROM Student\nCROSS JOIN Department;',
        tsql: 'SELECT Student.Name, Department.DepartmentName\nFROM Student\nCROSS JOIN Department;',
      },
      explanation: 'Pairs each of the 5 students with all 3 departments, producing 15 rows.',
    },
    variations: [
      'SELECT Student.Name, Course.CourseID FROM Student CROSS JOIN Course;',
    ],
    relatedSlugs: ['joins', 'foreign-key'],
  },
  {
    slug: 'joins',
    title: 'Combining Tables (JOIN, INNER JOIN & LEFT JOIN)',
    category: 'Joins & Sets',
    difficulty: 'Intermediate',
    summary: 'Reconstruct normalized relationships across Student, Department, Course, and Enrollment.',
    prerequisites: ['cross-product', 'foreign-key'],
    overview:
      'Normalized databases split entities across separate tables to eliminate redundancy. JOIN recombines related rows using a matching key predicate (ON). INNER JOIN keeps only matching pairs, while LEFT JOIN preserves every row from the left table even when no right-table match exists (filling missing columns with NULL).',
    whyItExists:
      'Without joins, displaying a student name alongside their department name and enrolled course title would be impossible in a normalized schema.',
    syntaxByDialect: {
      mysql:
        'SELECT Student.Name, Department.DepartmentName\nFROM Student\nINNER JOIN Department ON Student.DepartmentID = Department.DepartmentID;',
      tsql:
        'SELECT Student.Name, Department.DepartmentName\nFROM Student\nINNER JOIN Department ON Student.DepartmentID = Department.DepartmentID;',
    },
    components: [
      { token: 'INNER JOIN', meaning: 'Returns only rows where the ON predicate matches in both tables.' },
      { token: 'LEFT JOIN', meaning: 'Keeps all left-table rows; unmatched right-table columns become NULL.' },
      { token: 'ON a.Key = b.Key', meaning: 'Specifies the foreign-key to primary-key equality condition.' },
    ],
    example: {
      id: 'ex-joins',
      title: 'Join students with their department names',
      datasetId: 'university-demo-v1',
      queryByDialect: {
        mysql:
          'SELECT Student.Name, Student.CGPA, Department.DepartmentName\nFROM Student\nINNER JOIN Department ON Student.DepartmentID = Department.DepartmentID;',
        tsql:
          'SELECT Student.Name, Student.CGPA, Department.DepartmentName\nFROM Student\nINNER JOIN Department ON Student.DepartmentID = Department.DepartmentID;',
      },
      explanation: 'Matches each student DepartmentID to Department.DepartmentID to display the full department name.',
    },
    variations: [
      'SELECT Student.Name, Enrollment.CourseID, Enrollment.Grade FROM Student LEFT JOIN Enrollment ON Student.StudentID = Enrollment.StudentID;',
      'SELECT Student.Name, Course.CourseName, Enrollment.Grade FROM Enrollment INNER JOIN Student ON Enrollment.StudentID = Student.StudentID INNER JOIN Course ON Enrollment.CourseID = Course.CourseID;',
    ],
    relatedSlugs: ['cross-product', 'foreign-key', 'group-by-having'],
  },
  {
    slug: 'primary-key',
    title: 'Primary Keys & Entity Integrity',
    category: 'Schema & Keys',
    difficulty: 'Beginner',
    summary: 'Guarantee that every row in a table is uniquely identifiable and never NULL.',
    prerequisites: ['select'],
    overview:
      'A PRIMARY KEY constraint enforces Entity Integrity: every row must have a unique, non-NULL identifier (such as StudentID in Student or CourseID in Course). Databases automatically build a unique index on the primary key for fast point lookups.',
    whyItExists:
      'If two students shared the same ID or had a NULL ID, updates, enrollments, and joins could not target a specific person unambiguously.',
    syntaxByDialect: {
      mysql:
        'CREATE TABLE Student (\n  StudentID INT PRIMARY KEY,\n  Name VARCHAR(100) NOT NULL,\n  CGPA DECIMAL(3,2) NOT NULL\n);',
      tsql:
        'CREATE TABLE Student (\n  StudentID INT PRIMARY KEY,\n  Name VARCHAR(100) NOT NULL,\n  CGPA DECIMAL(3,2) NOT NULL\n);',
    },
    components: [
      { token: 'PRIMARY KEY', meaning: 'Combines UNIQUE + NOT NULL to uniquely identify each table row.' },
      { token: 'Entity Integrity', meaning: 'Relational rule stating no primary key attribute may be NULL.' },
    ],
    example: {
      id: 'ex-primary-key',
      title: 'Point lookup using StudentID primary key',
      datasetId: 'university-demo-v1',
      queryByDialect: {
        mysql: 'SELECT StudentID, Name, Email, CGPA\nFROM Student\nWHERE StudentID = 101;',
        tsql: 'SELECT StudentID, Name, Email, CGPA\nFROM Student\nWHERE StudentID = 101;',
      },
      explanation: 'Because StudentID is the Primary Key, filtering by StudentID = 101 is guaranteed to match at most 1 row.',
    },
    variations: [
      "SELECT CourseID, CourseName, Credit FROM Course WHERE CourseID = 'CSE-2201';",
      'SELECT DepartmentID, DepartmentName FROM Department WHERE DepartmentID = 10;',
    ],
    relatedSlugs: ['foreign-key', 'cascade'],
  },
  {
    slug: 'foreign-key',
    title: 'Foreign Keys & Referential Integrity',
    category: 'Schema & Keys',
    difficulty: 'Intermediate',
    summary: 'Link child rows to valid parent primary keys to prevent orphan records.',
    prerequisites: ['primary-key', 'joins'],
    overview:
      'A FOREIGN KEY in a child table (such as Student.DepartmentID) references a PRIMARY KEY in a parent table (Department.DepartmentID). Referential Integrity ensures you cannot insert a student into a non-existent DepartmentID 99.',
    whyItExists:
      'Foreign keys enforce valid relationships inside the database itself, preventing broken references across tables.',
    syntaxByDialect: {
      mysql:
        'CREATE TABLE Student (\n  StudentID INT PRIMARY KEY,\n  Name VARCHAR(100) NOT NULL,\n  DepartmentID INT NOT NULL,\n  CONSTRAINT fk_student_dept FOREIGN KEY (DepartmentID)\n    REFERENCES Department(DepartmentID)\n);',
      tsql:
        'CREATE TABLE Student (\n  StudentID INT PRIMARY KEY,\n  Name VARCHAR(100) NOT NULL,\n  DepartmentID INT NOT NULL,\n  CONSTRAINT fk_student_dept FOREIGN KEY (DepartmentID)\n    REFERENCES Department(DepartmentID)\n);',
    },
    components: [
      { token: 'FOREIGN KEY (col)', meaning: 'Declares a column that points to a parent table key.' },
      { token: 'REFERENCES Parent(Key)', meaning: 'Requires every non-NULL child value to exist in Parent(Key).' },
    ],
    example: {
      id: 'ex-foreign-key',
      title: 'Verify foreign key links between Enrollment, Student, and Course',
      datasetId: 'university-demo-v1',
      queryByDialect: {
        mysql:
          'SELECT Enrollment.EnrollmentID, Student.Name, Enrollment.CourseID, Enrollment.Semester\nFROM Enrollment\nINNER JOIN Student ON Enrollment.StudentID = Student.StudentID;',
        tsql:
          'SELECT Enrollment.EnrollmentID, Student.Name, Enrollment.CourseID, Enrollment.Semester\nFROM Enrollment\nINNER JOIN Student ON Enrollment.StudentID = Student.StudentID;',
      },
      explanation: 'Every Enrollment.StudentID resolves cleanly to a valid Student.StudentID parent row.',
    },
    variations: [
      'SELECT Teacher.Name, Teacher.Designation, Department.DepartmentName FROM Teacher INNER JOIN Department ON Teacher.DepartmentID = Department.DepartmentID;',
    ],
    relatedSlugs: ['primary-key', 'cascade', 'joins'],
  },
  {
    slug: 'cascade',
    title: 'Referential Actions (ON DELETE / ON UPDATE CASCADE)',
    category: 'Schema & Keys',
    difficulty: 'Intermediate',
    summary: 'Control what happens to dependent child rows when a parent key is updated or deleted.',
    prerequisites: ['foreign-key'],
    overview:
      'By default (RESTRICT / NO ACTION), a database blocks deleting or changing a parent primary key while child rows still reference it. Adding ON DELETE CASCADE or ON UPDATE CASCADE instructs the database engine to automatically propagate the deletion or key update to matching child rows.',
    whyItExists:
      'Cascading rules keep dependent tables (such as Enrollment records belonging to a Student) synchronized automatically without manual multi-table cleanup.',
    syntaxByDialect: {
      mysql:
        'CREATE TABLE Enrollment (\n  EnrollmentID INT PRIMARY KEY,\n  StudentID INT NOT NULL,\n  CourseID VARCHAR(20) NOT NULL,\n  CONSTRAINT fk_enroll_student FOREIGN KEY (StudentID)\n    REFERENCES Student(StudentID)\n    ON DELETE CASCADE\n    ON UPDATE CASCADE\n);',
      tsql:
        'CREATE TABLE Enrollment (\n  EnrollmentID INT PRIMARY KEY,\n  StudentID INT NOT NULL,\n  CourseID VARCHAR(20) NOT NULL,\n  CONSTRAINT fk_enroll_student FOREIGN KEY (StudentID)\n    REFERENCES Student(StudentID)\n    ON DELETE CASCADE\n    ON UPDATE CASCADE\n);',
    },
    components: [
      { token: 'ON DELETE CASCADE', meaning: 'Deleting a parent row automatically deletes all referencing child rows.' },
      { token: 'ON UPDATE CASCADE', meaning: 'Updating a parent key automatically updates the foreign key in child rows.' },
      { token: 'ON DELETE SET NULL', meaning: 'Alternative action that sets child foreign keys to NULL instead of deleting.' },
    ],
    example: {
      id: 'ex-cascade',
      title: 'Inspect parent-child rows governed by CASCADE',
      datasetId: 'university-demo-v1',
      queryByDialect: {
        mysql:
          'SELECT Student.StudentID, Student.Name, Enrollment.EnrollmentID, Enrollment.CourseID\nFROM Student\nINNER JOIN Enrollment ON Student.StudentID = Enrollment.StudentID\nWHERE Student.StudentID = 101;',
        tsql:
          'SELECT Student.StudentID, Student.Name, Enrollment.EnrollmentID, Enrollment.CourseID\nFROM Student\nINNER JOIN Enrollment ON Student.StudentID = Enrollment.StudentID\nWHERE Student.StudentID = 101;',
      },
      explanation: 'Shows the 2 Enrollment rows tied to StudentID 101 (Amina) that would automatically cascade if StudentID 101 were updated or deleted.',
    },
    variations: [
      'SELECT Student.StudentID, Student.Name, Enrollment.CourseID, Enrollment.Grade FROM Student LEFT JOIN Enrollment ON Student.StudentID = Enrollment.StudentID;',
    ],
    relatedSlugs: ['foreign-key', 'primary-key'],
  },
  {
    slug: 'views',
    title: 'SQL Views (CREATE VIEW)',
    category: 'Database Objects',
    difficulty: 'Intermediate',
    summary: 'Save reusable SELECT queries as named virtual tables using CREATE VIEW.',
    prerequisites: ['select', 'where'],
    overview:
      'A VIEW is a stored query definition that behaves like a virtual table. It does not duplicate data on disk; whenever you SELECT from a view, the database runs its underlying query against the latest base table rows.',
    whyItExists:
      'Views simplify complex recurring queries (such as honor-roll filters or multi-table joins) and can hide sensitive columns like Email from restricted users.',
    syntaxByDialect: {
      mysql:
        'CREATE VIEW HonorStudents AS\nSELECT StudentID, Name, CGPA, DepartmentID\nFROM Student\nWHERE CGPA >= 3.50;',
      tsql:
        'CREATE VIEW HonorStudents AS\nSELECT StudentID, Name, CGPA, DepartmentID\nFROM Student\nWHERE CGPA >= 3.50;',
    },
    components: [
      { token: 'CREATE VIEW name AS', meaning: 'Registers a named virtual table backed by a SELECT query.' },
      { token: 'Virtual Table', meaning: 'Always reflects live updates from underlying base tables.' },
    ],
    example: {
      id: 'ex-views',
      title: 'Query the pre-defined HonorStudents view',
      datasetId: 'university-demo-v1',
      queryByDialect: {
        mysql: 'SELECT *\nFROM HonorStudents\nORDER BY CGPA DESC;',
        tsql: 'SELECT *\nFROM HonorStudents\nORDER BY CGPA DESC;',
      },
      explanation: 'Queries the HonorStudents virtual view, returning Amina, Nadia, and Tuhin without repeating the WHERE CGPA >= 3.50 filter.',
    },
    variations: [
      'SELECT Name, CGPA FROM HonorStudents WHERE DepartmentID = 10;',
      'SELECT HonorStudents.Name, HonorStudents.CGPA, Department.DepartmentName FROM HonorStudents INNER JOIN Department ON HonorStudents.DepartmentID = Department.DepartmentID;',
    ],
    relatedSlugs: ['select', 'where', 'joins'],
  },
];

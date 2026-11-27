import type {
  DatasetSchema,
  DatasetSummary,
  ResultCell,
  TopicDetail,
} from '../types/api';

export const DEFAULT_DATASET_ID = 'university-demo-v1';

export const MOCK_DATASETS: DatasetSummary[] = [
  {
    "id": "university-demo-v1",
    "name": "University Academic Records",
    "version": "1.1",
    "description": "Complete undergraduate relational dataset with departments, students, courses (with prerequisites), enrollments (with dates), faculty (with salaries), and the HonorStudents view.",
    "tableNames": [
      "Department",
      "Student",
      "Course",
      "Enrollment",
      "Teacher",
      "HonorStudents"
    ]
  }
];

export const MOCK_DATASET_SCHEMA: DatasetSchema = {
  "datasetId": "university-demo-v1",
  "name": "University Academic Records (v1.1)",
  "description": "Normalized relational schema covering basic queries, scalar functions, aggregates, joins, subqueries, recursive CTEs, window functions, integrity constraints, and views.",
  "tables": [
    {
      "name": "Department",
      "description": "Academic departments offering degree programs.",
      "columns": [
        {
          "name": "DepartmentID",
          "dataType": "INT",
          "nullable": false,
          "description": "Unique department identifier (Primary Key).",
          "isPrimaryKey": true
        },
        {
          "name": "DepartmentName",
          "dataType": "VARCHAR(100)",
          "nullable": false,
          "description": "Official name of the academic department."
        }
      ]
    },
    {
      "name": "Student",
      "description": "Undergraduate student records and cumulative GPA.",
      "columns": [
        {
          "name": "StudentID",
          "dataType": "INT",
          "nullable": false,
          "description": "Unique student roll identifier (Primary Key).",
          "isPrimaryKey": true
        },
        {
          "name": "Name",
          "dataType": "VARCHAR(100)",
          "nullable": false,
          "description": "Student first name."
        },
        {
          "name": "Email",
          "dataType": "VARCHAR(150)",
          "nullable": false,
          "description": "Unique university email address."
        },
        {
          "name": "CGPA",
          "dataType": "DECIMAL(3,2)",
          "nullable": false,
          "description": "Cumulative grade point average on a 4.00 scale."
        },
        {
          "name": "DepartmentID",
          "dataType": "INT",
          "nullable": false,
          "description": "Foreign key referencing Department(DepartmentID).",
          "references": "Department.DepartmentID"
        }
      ]
    },
    {
      "name": "Course",
      "description": "Courses offered across departments, including self-referencing prerequisites.",
      "columns": [
        {
          "name": "CourseID",
          "dataType": "VARCHAR(20)",
          "nullable": false,
          "description": "Unique course code such as CSE-2201 (Primary Key).",
          "isPrimaryKey": true
        },
        {
          "name": "CourseName",
          "dataType": "VARCHAR(150)",
          "nullable": false,
          "description": "Full title of the course."
        },
        {
          "name": "Credit",
          "dataType": "DECIMAL(2,1)",
          "nullable": false,
          "description": "Credit hours awarded upon completion."
        },
        {
          "name": "DepartmentID",
          "dataType": "INT",
          "nullable": false,
          "description": "Host department ID.",
          "references": "Department.DepartmentID"
        },
        {
          "name": "PrerequisiteCourseID",
          "dataType": "VARCHAR(20)",
          "nullable": true,
          "description": "Self-referencing FK pointing to required prerequisite Course(CourseID).",
          "references": "Course.CourseID"
        }
      ]
    },
    {
      "name": "Enrollment",
      "description": "Junction table linking students to enrolled courses, enrollment dates, and grades.",
      "columns": [
        {
          "name": "EnrollmentID",
          "dataType": "INT",
          "nullable": false,
          "description": "Unique enrollment record ID (Primary Key).",
          "isPrimaryKey": true
        },
        {
          "name": "StudentID",
          "dataType": "INT",
          "nullable": false,
          "description": "Enrolled student ID.",
          "references": "Student.StudentID"
        },
        {
          "name": "CourseID",
          "dataType": "VARCHAR(20)",
          "nullable": false,
          "description": "Enrolled course code.",
          "references": "Course.CourseID"
        },
        {
          "name": "Semester",
          "dataType": "VARCHAR(20)",
          "nullable": false,
          "description": "Academic term (e.g., Fall-2026)."
        },
        {
          "name": "EnrolledDate",
          "dataType": "DATE",
          "nullable": false,
          "description": "Date when the student registered for the course."
        },
        {
          "name": "Grade",
          "dataType": "VARCHAR(5)",
          "nullable": true,
          "description": "Letter grade (NULL while course is still in progress)."
        }
      ]
    },
    {
      "name": "Teacher",
      "description": "Faculty members assigned to academic departments with rank and salary.",
      "columns": [
        {
          "name": "TeacherID",
          "dataType": "INT",
          "nullable": false,
          "description": "Unique faculty identifier (Primary Key).",
          "isPrimaryKey": true
        },
        {
          "name": "Name",
          "dataType": "VARCHAR(100)",
          "nullable": false,
          "description": "Faculty full name."
        },
        {
          "name": "Designation",
          "dataType": "VARCHAR(80)",
          "nullable": false,
          "description": "Academic rank (Professor, Associate Professor, Lecturer)."
        },
        {
          "name": "DepartmentID",
          "dataType": "INT",
          "nullable": false,
          "description": "Department where the teacher is appointed.",
          "references": "Department.DepartmentID"
        },
        {
          "name": "Salary",
          "dataType": "DECIMAL(10,2)",
          "nullable": false,
          "description": "Monthly salary used for numeric and window ranking examples."
        }
      ]
    },
    {
      "name": "HonorStudents",
      "description": "Virtual View projecting Student rows where CGPA >= 3.50.",
      "columns": [
        {
          "name": "StudentID",
          "dataType": "INT",
          "nullable": false,
          "description": "Student ID projected from Student."
        },
        {
          "name": "Name",
          "dataType": "VARCHAR(100)",
          "nullable": false,
          "description": "Student name projected from Student."
        },
        {
          "name": "CGPA",
          "dataType": "DECIMAL(3,2)",
          "nullable": false,
          "description": "CGPA (>= 3.50)."
        },
        {
          "name": "DepartmentID",
          "dataType": "INT",
          "nullable": false,
          "description": "Department ID projected from Student."
        }
      ]
    }
  ]
};

export const MOCK_TABLES: Record<string, Record<string, ResultCell>[]> = {
  "Department": [
    {
      "DepartmentID": 10,
      "DepartmentName": "Computer Science & Engineering"
    },
    {
      "DepartmentID": 20,
      "DepartmentName": "Electrical & Electronic Engineering"
    },
    {
      "DepartmentID": 30,
      "DepartmentName": "Business Administration"
    }
  ],
  "Student": [
    {
      "StudentID": 101,
      "Name": "Amina",
      "Email": "amina@demo.edu",
      "CGPA": 3.75,
      "DepartmentID": 10
    },
    {
      "StudentID": 102,
      "Name": "Rafi",
      "Email": "rafi@demo.edu",
      "CGPA": 3.2,
      "DepartmentID": 20
    },
    {
      "StudentID": 103,
      "Name": "Nadia",
      "Email": "nadia@demo.edu",
      "CGPA": 3.55,
      "DepartmentID": 10
    },
    {
      "StudentID": 104,
      "Name": "Sami",
      "Email": "sami@demo.edu",
      "CGPA": 3.42,
      "DepartmentID": 30
    },
    {
      "StudentID": 105,
      "Name": "Tuhin",
      "Email": "tuhin@demo.edu",
      "CGPA": 3.9,
      "DepartmentID": 20
    }
  ],
  "Course": [
    {
      "CourseID": "CSE-1101",
      "CourseName": "Structured Programming",
      "Credit": 3,
      "DepartmentID": 10,
      "PrerequisiteCourseID": null
    },
    {
      "CourseID": "CSE-2201",
      "CourseName": "Database Management Systems",
      "Credit": 3,
      "DepartmentID": 10,
      "PrerequisiteCourseID": "CSE-1101"
    },
    {
      "CourseID": "CSE-2203",
      "CourseName": "Computer Algorithms",
      "Credit": 3,
      "DepartmentID": 10,
      "PrerequisiteCourseID": "CSE-2201"
    },
    {
      "CourseID": "EEE-2101",
      "CourseName": "Digital Logic Design",
      "Credit": 3,
      "DepartmentID": 20,
      "PrerequisiteCourseID": null
    },
    {
      "CourseID": "BBA-1101",
      "CourseName": "Principles of Management",
      "Credit": 3,
      "DepartmentID": 30,
      "PrerequisiteCourseID": null
    }
  ],
  "Enrollment": [
    {
      "EnrollmentID": 1,
      "StudentID": 101,
      "CourseID": "CSE-2201",
      "Semester": "Fall-2026",
      "EnrolledDate": "2026-09-01",
      "Grade": "A"
    },
    {
      "EnrollmentID": 2,
      "StudentID": 101,
      "CourseID": "CSE-2203",
      "Semester": "Fall-2026",
      "EnrolledDate": "2026-09-02",
      "Grade": "A-"
    },
    {
      "EnrollmentID": 3,
      "StudentID": 102,
      "CourseID": "EEE-2101",
      "Semester": "Fall-2026",
      "EnrolledDate": "2026-09-03",
      "Grade": "B+"
    },
    {
      "EnrollmentID": 4,
      "StudentID": 103,
      "CourseID": "CSE-2201",
      "Semester": "Fall-2026",
      "EnrolledDate": "2026-09-04",
      "Grade": "A-"
    },
    {
      "EnrollmentID": 5,
      "StudentID": 105,
      "CourseID": "EEE-2101",
      "Semester": "Fall-2026",
      "EnrolledDate": "2026-09-05",
      "Grade": "A+"
    },
    {
      "EnrollmentID": 6,
      "StudentID": 104,
      "CourseID": "BBA-1101",
      "Semester": "Spring-2027",
      "EnrolledDate": "2027-01-15",
      "Grade": null
    }
  ],
  "Teacher": [
    {
      "TeacherID": 501,
      "Name": "Dr. Farhana Rahman",
      "Designation": "Associate Professor",
      "DepartmentID": 10,
      "Salary": 125000
    },
    {
      "TeacherID": 502,
      "Name": "Tanvir Ahmed",
      "Designation": "Assistant Professor",
      "DepartmentID": 20,
      "Salary": 105000
    },
    {
      "TeacherID": 503,
      "Name": "Nusrat Jahan",
      "Designation": "Lecturer",
      "DepartmentID": 30,
      "Salary": 82000
    },
    {
      "TeacherID": 504,
      "Name": "Dr. Mahmudul Hasan",
      "Designation": "Professor",
      "DepartmentID": 10,
      "Salary": 148000
    }
  ],
  "HonorStudents": [
    {
      "StudentID": 101,
      "Name": "Amina",
      "CGPA": 3.75,
      "DepartmentID": 10
    },
    {
      "StudentID": 103,
      "Name": "Nadia",
      "CGPA": 3.55,
      "DepartmentID": 10
    },
    {
      "StudentID": 105,
      "Name": "Tuhin",
      "CGPA": 3.9,
      "DepartmentID": 20
    }
  ]
};

export const MOCK_TOPICS: TopicDetail[] = [
  {
    "slug": "relational-model",
    "title": "01. Relational Model & Logical Execution",
    "category": "Stage 1: Relational Foundations",
    "difficulty": "Beginner",
    "summary": "Understand tables (relations), rows (tuples), columns (attributes), and the order SQL evaluates clauses.",
    "prerequisites": [],
    "overview": "In a relational database, data is organized into tables (relations) made of rows (tuples) and typed columns (attributes). Although you write SELECT first, the database engine logically evaluates FROM first, then WHERE, then SELECT, and finally ORDER BY.",
    "whyItExists": "Knowing logical execution order explains why column aliases created in SELECT cannot be referenced inside WHERE, yet work cleanly in ORDER BY.",
    "syntaxByDialect": {
      "mysql": "SELECT Name, CGPA\nFROM Student\nWHERE CGPA >= 3.50\nORDER BY CGPA DESC;",
      "tsql": "SELECT Name, CGPA\nFROM Student\nWHERE CGPA >= 3.50\nORDER BY CGPA DESC;"
    },
    "components": [
      {
        "token": "1. FROM",
        "meaning": "Identifies the source relation (table) to read."
      },
      {
        "token": "2. WHERE",
        "meaning": "Filters individual tuples before projection."
      },
      {
        "token": "3. SELECT",
        "meaning": "Projects requested attributes and expressions."
      },
      {
        "token": "4. ORDER BY",
        "meaning": "Sorts the final projected output."
      }
    ],
    "example": {
      "id": "ex-relational-model",
      "title": "Trace FROM -> WHERE -> SELECT -> ORDER BY",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT Name, CGPA\nFROM Student\nWHERE CGPA >= 3.50\nORDER BY CGPA DESC;",
        "tsql": "SELECT Name, CGPA\nFROM Student\nWHERE CGPA >= 3.50\nORDER BY CGPA DESC;"
      },
      "explanation": "Reads Student, keeps rows with CGPA >= 3.50, projects Name and CGPA, and sorts highest first."
    },
    "variations": [
      "SELECT * FROM Department;",
      "SELECT CourseID, CourseName, Credit FROM Course ORDER BY CourseID ASC;"
    ],
    "relatedSlugs": [
      "select",
      "where",
      "order-by"
    ]
  },
  {
    "slug": "select",
    "title": "02. SELECT & FROM",
    "category": "Stage 1: Relational Foundations",
    "difficulty": "Beginner",
    "summary": "Project specific columns or expressions from a base table.",
    "prerequisites": [
      "relational-model"
    ],
    "overview": "Every read query begins by specifying the columns you want in the result set (SELECT) and the table storing the records (FROM).",
    "whyItExists": "Selecting only required columns reduces network transfer and keeps query contracts stable even when new columns are added to a table.",
    "syntaxByDialect": {
      "mysql": "SELECT column1, column2\nFROM table_name;",
      "tsql": "SELECT column1, column2\nFROM table_name;"
    },
    "components": [
      {
        "token": "SELECT",
        "meaning": "Lists the columns or computed expressions to project."
      },
      {
        "token": "*",
        "meaning": "Wildcard shorthand projecting every column in table order."
      },
      {
        "token": "FROM",
        "meaning": "Specifies the source table or view."
      }
    ],
    "example": {
      "id": "ex-select",
      "title": "Project student IDs, names, and GPAs",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT StudentID, Name, CGPA\nFROM Student;",
        "tsql": "SELECT StudentID, Name, CGPA\nFROM Student;"
      },
      "explanation": "Reads all 5 rows from Student and projects only StudentID, Name, and CGPA."
    },
    "variations": [
      "SELECT * FROM Student;",
      "SELECT TeacherID, Name, Designation FROM Teacher;"
    ],
    "relatedSlugs": [
      "distinct-aliases",
      "where"
    ]
  },
  {
    "slug": "distinct-aliases",
    "title": "03. Eliminating Duplicates & Aliases",
    "category": "Stage 1: Relational Foundations",
    "difficulty": "Beginner",
    "summary": "Remove duplicate rows with DISTINCT and rename columns or tables using AS aliases.",
    "prerequisites": [
      "select"
    ],
    "overview": "SQL tables allow duplicate projected values unless you add DISTINCT after SELECT. Column aliases (AS) give computed expressions readable headers, while table aliases shorten multi-table queries.",
    "whyItExists": "Listing unique departments represented in Student or naming calculated columns clearly makes query output immediately readable.",
    "syntaxByDialect": {
      "mysql": "SELECT DISTINCT DepartmentID AS DeptID\nFROM Student;",
      "tsql": "SELECT DISTINCT DepartmentID AS DeptID\nFROM Student;"
    },
    "components": [
      {
        "token": "DISTINCT",
        "meaning": "Deduplicates identical rows in the projected output."
      },
      {
        "token": "AS AliasName",
        "meaning": "Assigns a readable header name to an output column."
      }
    ],
    "example": {
      "id": "ex-distinct-aliases",
      "title": "List distinct department IDs from Student",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT DISTINCT DepartmentID AS DeptCode\nFROM Student;",
        "tsql": "SELECT DISTINCT DepartmentID AS DeptCode\nFROM Student;"
      },
      "explanation": "Deduplicates the 5 student rows into the 3 unique DepartmentID values (10, 20, 30)."
    },
    "variations": [
      "SELECT DISTINCT Semester FROM Enrollment;",
      "SELECT Name AS StudentName, CGPA AS GradePoint FROM Student;"
    ],
    "relatedSlugs": [
      "select",
      "where",
      "group-by-having"
    ]
  },
  {
    "slug": "where",
    "title": "04. Filtering with WHERE",
    "category": "Stage 1: Relational Foundations",
    "difficulty": "Beginner",
    "summary": "Filter rows using comparison operators (=, >, >=, <, <>) and boolean AND / OR.",
    "prerequisites": [
      "select"
    ],
    "overview": "The WHERE clause tests a boolean condition on every candidate row. Only rows evaluating to TRUE are passed to SELECT.",
    "whyItExists": "Filtering rows inside the database engine prevents fetching thousands of irrelevant records over the network.",
    "syntaxByDialect": {
      "mysql": "SELECT Name, CGPA\nFROM Student\nWHERE CGPA > 3.42;",
      "tsql": "SELECT Name, CGPA\nFROM Student\nWHERE CGPA > 3.42;"
    },
    "components": [
      {
        "token": "WHERE",
        "meaning": "Introduces row-level filter predicates."
      },
      {
        "token": "> vs >=",
        "meaning": "Strict greater-than excludes boundary ties; >= includes them."
      },
      {
        "token": "AND / OR",
        "meaning": "Combines predicates (AND binds tighter than OR)."
      }
    ],
    "example": {
      "id": "ex-where",
      "title": "Find students with CGPA strictly above 3.42",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT Name, CGPA\nFROM Student\nWHERE CGPA > 3.42;",
        "tsql": "SELECT Name, CGPA\nFROM Student\nWHERE CGPA > 3.42;"
      },
      "explanation": "Keeps Amina (3.75), Nadia (3.55), and Tuhin (3.90) while excluding Sami (3.42)."
    },
    "variations": [
      "SELECT Name, CGPA FROM Student WHERE CGPA >= 3.42;",
      "SELECT Name, CGPA FROM Student WHERE DepartmentID = 10 AND CGPA >= 3.60;",
      "SELECT Name, CGPA FROM Student WHERE CGPA > 4.00;"
    ],
    "relatedSlugs": [
      "pattern-range-filtering",
      "order-by"
    ]
  },
  {
    "slug": "pattern-range-filtering",
    "title": "05. Pattern, Range & NULL Filtering",
    "category": "Stage 1: Relational Foundations",
    "difficulty": "Beginner",
    "summary": "Filter text patterns with LIKE, lists with IN, intervals with BETWEEN, and missing values with IS NULL.",
    "prerequisites": [
      "where"
    ],
    "overview": "SQL offers dedicated predicates for partial string matching (LIKE with % and _), set membership (IN), inclusive intervals (BETWEEN), and missing values (IS NULL). Because NULL represents an unknown value, = NULL never returns TRUE.",
    "whyItExists": "Clean range and pattern operators replace long chains of OR conditions and prevent subtle three-valued NULL bugs.",
    "syntaxByDialect": {
      "mysql": "SELECT Name, CGPA, DepartmentID\nFROM Student\nWHERE DepartmentID IN (10, 20)\n  AND CGPA BETWEEN 3.50 AND 4.00;",
      "tsql": "SELECT Name, CGPA, DepartmentID\nFROM Student\nWHERE DepartmentID IN (10, 20)\n  AND CGPA BETWEEN 3.50 AND 4.00;"
    },
    "components": [
      {
        "token": "LIKE 'A%'",
        "meaning": "% matches zero or more characters; _ matches any single character."
      },
      {
        "token": "IN (10, 20)",
        "meaning": "Matches any value present in the parenthesized set."
      },
      {
        "token": "BETWEEN a AND b",
        "meaning": "Inclusive range check (col >= a AND col <= b)."
      },
      {
        "token": "IS NULL",
        "meaning": "Checks whether a column contains NULL."
      }
    ],
    "example": {
      "id": "ex-pattern-range",
      "title": "Filter by department list and CGPA interval",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT Name, CGPA, DepartmentID\nFROM Student\nWHERE DepartmentID IN (10, 20)\n  AND CGPA BETWEEN 3.50 AND 4.00;",
        "tsql": "SELECT Name, CGPA, DepartmentID\nFROM Student\nWHERE DepartmentID IN (10, 20)\n  AND CGPA BETWEEN 3.50 AND 4.00;"
      },
      "explanation": "Returns CSE (10) and EEE (20) students whose CGPA falls within [3.50, 4.00]."
    },
    "variations": [
      "SELECT Name, Email FROM Student WHERE Name LIKE 'A%';",
      "SELECT EnrollmentID, StudentID, CourseID, Semester FROM Enrollment WHERE Grade IS NULL;",
      "SELECT StudentID, CourseID, Grade FROM Enrollment WHERE Grade IS NOT NULL;"
    ],
    "relatedSlugs": [
      "where",
      "null-handling-functions"
    ]
  },
  {
    "slug": "order-by",
    "title": "06. Sorting & Limiting Rows",
    "category": "Stage 1: Relational Foundations",
    "difficulty": "Beginner",
    "summary": "Sort output deterministically with ORDER BY and cap rows with LIMIT (MySQL) or TOP (T-SQL).",
    "prerequisites": [
      "where"
    ],
    "overview": "Relational sets have no inherent row order. ORDER BY sorts the final output, and dialect-specific row caps (LIMIT N at the end in MySQL; SELECT TOP N at the start in T-SQL) extract top-K records.",
    "whyItExists": "Leaderboards, pagination, and top-N reports require explicit sorting and row caps.",
    "syntaxByDialect": {
      "mysql": "SELECT Name, CGPA\nFROM Student\nORDER BY CGPA DESC\nLIMIT 3;",
      "tsql": "SELECT TOP 3 Name, CGPA\nFROM Student\nORDER BY CGPA DESC;"
    },
    "components": [
      {
        "token": "ORDER BY col DESC",
        "meaning": "Sorts rows from highest to lowest (ASC is default)."
      },
      {
        "token": "LIMIT N",
        "meaning": "MySQL row-cap clause placed at the end of SELECT."
      },
      {
        "token": "TOP N",
        "meaning": "T-SQL row-cap keyword placed right after SELECT."
      }
    ],
    "example": {
      "id": "ex-order-by",
      "title": "Top 3 students by CGPA",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT Name, CGPA\nFROM Student\nORDER BY CGPA DESC\nLIMIT 3;",
        "tsql": "SELECT TOP 3 Name, CGPA\nFROM Student\nORDER BY CGPA DESC;"
      },
      "explanation": "Sorts students descending by CGPA and returns Tuhin (3.90), Amina (3.75), and Nadia (3.55)."
    },
    "variations": [
      "SELECT Name, Salary FROM Teacher ORDER BY Salary DESC;",
      "SELECT Name, CGPA FROM Student WHERE DepartmentID = 10 ORDER BY CGPA DESC;"
    ],
    "relatedSlugs": [
      "window-ranking",
      "aggregate-functions"
    ]
  },
  {
    "slug": "string-numeric-functions",
    "title": "07. String & Numeric Functions",
    "category": "Stage 2: Scalar Functions & Logic",
    "difficulty": "Beginner",
    "summary": "Transform text and numbers per row using UPPER, LOWER, CONCAT, LENGTH/LEN, and ROUND.",
    "prerequisites": [
      "select",
      "distinct-aliases"
    ],
    "overview": "Scalar functions take input values from a single row and return one transformed value per row. Some names differ slightly across dialects, such as LENGTH() in MySQL versus LEN() in T-SQL.",
    "whyItExists": "Formatting display strings, standardizing casing, and rounding decimals directly in SQL keeps reporting queries clean.",
    "syntaxByDialect": {
      "mysql": "SELECT UPPER(Name) AS UpperName, LENGTH(Name) AS NameLen, ROUND(CGPA, 1) AS RoundedCGPA\nFROM Student;",
      "tsql": "SELECT UPPER(Name) AS UpperName, LEN(Name) AS NameLen, ROUND(CGPA, 1) AS RoundedCGPA\nFROM Student;"
    },
    "components": [
      {
        "token": "UPPER / LOWER",
        "meaning": "Converts text to uppercase or lowercase."
      },
      {
        "token": "LENGTH / LEN",
        "meaning": "Returns character count (LENGTH in MySQL, LEN in T-SQL)."
      },
      {
        "token": "ROUND(num, d)",
        "meaning": "Rounds a numeric value to d decimal places."
      }
    ],
    "example": {
      "id": "ex-scalar-funcs",
      "title": "Uppercase student names and round CGPA to 1 decimal",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT UPPER(Name) AS UpperName, ROUND(CGPA, 1) AS RoundedCGPA\nFROM Student;",
        "tsql": "SELECT UPPER(Name) AS UpperName, ROUND(CGPA, 1) AS RoundedCGPA\nFROM Student;"
      },
      "explanation": "Transforms Name to uppercase and rounds each student CGPA to one decimal place."
    },
    "variations": [
      "SELECT LOWER(Email) AS CleanEmail, CGPA FROM Student;",
      "SELECT Name, ROUND(Salary / 1000, 1) AS SalaryInK FROM Teacher;"
    ],
    "relatedSlugs": [
      "date-time-functions",
      "null-handling-functions"
    ]
  },
  {
    "slug": "date-time-functions",
    "title": "08. Date & Time Operations",
    "category": "Stage 2: Scalar Functions & Logic",
    "difficulty": "Intermediate",
    "summary": "Extract calendar parts (YEAR, MONTH, DAY) and filter chronological enrollment events.",
    "prerequisites": [
      "string-numeric-functions",
      "where"
    ],
    "overview": "Relational databases store timestamps and dates in ISO format (YYYY-MM-DD). Functions like YEAR(), MONTH(), and DAY() extract numeric calendar components for filtering and grouping.",
    "whyItExists": "Academic terms, billing cycles, and audit logs all depend on accurate date extraction and range filtering.",
    "syntaxByDialect": {
      "mysql": "SELECT EnrollmentID, StudentID, CourseID, YEAR(EnrolledDate) AS EnrollYear, MONTH(EnrolledDate) AS EnrollMonth\nFROM Enrollment;",
      "tsql": "SELECT EnrollmentID, StudentID, CourseID, YEAR(EnrolledDate) AS EnrollYear, MONTH(EnrolledDate) AS EnrollMonth\nFROM Enrollment;"
    },
    "components": [
      {
        "token": "YEAR(date)",
        "meaning": "Extracts the 4-digit calendar year from a DATE column."
      },
      {
        "token": "MONTH(date)",
        "meaning": "Extracts the month number (1–12)."
      },
      {
        "token": "DAY(date)",
        "meaning": "Extracts the day of the month (1–31)."
      }
    ],
    "example": {
      "id": "ex-date-funcs",
      "title": "Extract enrollment year and month",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT EnrollmentID, StudentID, CourseID, EnrolledDate, YEAR(EnrolledDate) AS EnrollYear\nFROM Enrollment;",
        "tsql": "SELECT EnrollmentID, StudentID, CourseID, EnrolledDate, YEAR(EnrolledDate) AS EnrollYear\nFROM Enrollment;"
      },
      "explanation": "Reads EnrolledDate from Enrollment and projects the extracted calendar year."
    },
    "variations": [
      "SELECT EnrollmentID, StudentID, CourseID, EnrolledDate FROM Enrollment WHERE EnrolledDate >= '2027-01-01';"
    ],
    "relatedSlugs": [
      "string-numeric-functions",
      "group-by-having"
    ]
  },
  {
    "slug": "null-handling-functions",
    "title": "09. Defensive NULL Handling (COALESCE, IFNULL, ISNULL)",
    "category": "Stage 2: Scalar Functions & Logic",
    "difficulty": "Intermediate",
    "summary": "Replace missing NULL values with safe fallback defaults using COALESCE, IFNULL, or ISNULL.",
    "prerequisites": [
      "pattern-range-filtering"
    ],
    "overview": "NULL propagates through arithmetic and string concatenation. COALESCE(val1, val2, ...) is ANSI-standard and returns the first non-NULL argument; MySQL also offers IFNULL(a, b) while T-SQL offers ISNULL(a, b).",
    "whyItExists": "In-progress enrollments have Grade = NULL; replacing NULL with a readable label prevents blank UI cells.",
    "syntaxByDialect": {
      "mysql": "SELECT EnrollmentID, StudentID, CourseID, COALESCE(Grade, 'In Progress') AS Status\nFROM Enrollment;",
      "tsql": "SELECT EnrollmentID, StudentID, CourseID, ISNULL(Grade, 'In Progress') AS Status\nFROM Enrollment;"
    },
    "components": [
      {
        "token": "COALESCE(a, b)",
        "meaning": "Standard SQL function returning the first non-NULL expression."
      },
      {
        "token": "IFNULL(a, b)",
        "meaning": "MySQL two-argument fallback when a is NULL."
      },
      {
        "token": "ISNULL(a, b)",
        "meaning": "T-SQL two-argument fallback when a is NULL."
      }
    ],
    "example": {
      "id": "ex-null-funcs",
      "title": "Display In Progress when Grade is NULL",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT EnrollmentID, StudentID, CourseID, COALESCE(Grade, 'In Progress') AS CurrentGrade\nFROM Enrollment;",
        "tsql": "SELECT EnrollmentID, StudentID, CourseID, ISNULL(Grade, 'In Progress') AS CurrentGrade\nFROM Enrollment;"
      },
      "explanation": "Replaces NULL Grade on EnrollmentID 6 with In Progress while keeping existing letter grades intact."
    },
    "variations": [
      "SELECT CourseID, CourseName, COALESCE(PrerequisiteCourseID, 'None') AS Prerequisite FROM Course;"
    ],
    "relatedSlugs": [
      "pattern-range-filtering",
      "case-expressions"
    ]
  },
  {
    "slug": "case-expressions",
    "title": "10. Conditional Logic (CASE WHEN)",
    "category": "Stage 2: Scalar Functions & Logic",
    "difficulty": "Intermediate",
    "summary": "Write if-else branching directly inside SQL queries with CASE WHEN ... THEN ... ELSE ... END.",
    "prerequisites": [
      "where",
      "null-handling-functions"
    ],
    "overview": "CASE expressions evaluate boolean branches top-to-bottom and return the result of the first matching WHEN clause (or ELSE if none match). They work in SELECT, ORDER BY, and even inside aggregate functions.",
    "whyItExists": "Categorizing numeric GPAs into academic standing tiers or bucketing salaries directly in SQL keeps business logic declarative.",
    "syntaxByDialect": {
      "mysql": "SELECT Name, CGPA,\n  CASE\n    WHEN CGPA >= 3.75 THEN 'Summa Cum Laude'\n    WHEN CGPA >= 3.50 THEN 'Dean Honor List'\n    ELSE 'Good Standing'\n  END AS Standing\nFROM Student;",
      "tsql": "SELECT Name, CGPA,\n  CASE\n    WHEN CGPA >= 3.75 THEN 'Summa Cum Laude'\n    WHEN CGPA >= 3.50 THEN 'Dean Honor List'\n    ELSE 'Good Standing'\n  END AS Standing\nFROM Student;"
    },
    "components": [
      {
        "token": "CASE WHEN cond THEN val",
        "meaning": "Evaluates conditions sequentially; stops at the first TRUE branch."
      },
      {
        "token": "ELSE fallback",
        "meaning": "Default value when no WHEN condition matches (NULL if omitted)."
      },
      {
        "token": "END AS alias",
        "meaning": "Terminates the CASE expression and names the resulting column."
      }
    ],
    "example": {
      "id": "ex-case",
      "title": "Classify students into academic honors tiers",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT Name, CGPA,\n  CASE\n    WHEN CGPA >= 3.75 THEN 'Summa Cum Laude'\n    WHEN CGPA >= 3.50 THEN 'Dean Honor List'\n    ELSE 'Good Standing'\n  END AS AcademicStanding\nFROM Student;",
        "tsql": "SELECT Name, CGPA,\n  CASE\n    WHEN CGPA >= 3.75 THEN 'Summa Cum Laude'\n    WHEN CGPA >= 3.50 THEN 'Dean Honor List'\n    ELSE 'Good Standing'\n  END AS AcademicStanding\nFROM Student;"
      },
      "explanation": "Maps Amina (3.75) and Tuhin (3.90) to Summa Cum Laude, Nadia (3.55) to Dean Honor List, and Rafi/Sami to Good Standing."
    },
    "variations": [
      "SELECT Name, Salary, CASE WHEN Salary >= 120000 THEN 'Senior Scale' ELSE 'Standard Scale' END AS PayBand FROM Teacher;"
    ],
    "relatedSlugs": [
      "aggregate-functions",
      "group-by-having"
    ]
  },
  {
    "slug": "aggregate-functions",
    "title": "11. Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)",
    "category": "Stage 3: Aggregation & Summarization",
    "difficulty": "Intermediate",
    "summary": "Summarize multiple rows into single metrics using COUNT, SUM, AVG, MIN, and MAX.",
    "prerequisites": [
      "select",
      "where"
    ],
    "overview": "Aggregate functions collapse a set of rows into a single summary value. COUNT(*) counts every row, whereas COUNT(col), SUM(col), and AVG(col) automatically skip NULL values.",
    "whyItExists": "Computing university-wide average CGPA, faculty payroll totals, or graded enrollment counts in SQL avoids shipping raw datasets to clients.",
    "syntaxByDialect": {
      "mysql": "SELECT COUNT(*) AS TotalStudents, AVG(CGPA) AS AverageCGPA, MAX(CGPA) AS TopCGPA, MIN(CGPA) AS LowestCGPA\nFROM Student;",
      "tsql": "SELECT COUNT(*) AS TotalStudents, AVG(CGPA) AS AverageCGPA, MAX(CGPA) AS TopCGPA, MIN(CGPA) AS LowestCGPA\nFROM Student;"
    },
    "components": [
      {
        "token": "COUNT(*)",
        "meaning": "Counts all rows in the group regardless of NULLs."
      },
      {
        "token": "COUNT(col)",
        "meaning": "Counts only rows where col is NOT NULL."
      },
      {
        "token": "AVG / SUM",
        "meaning": "Computes mean or sum over non-NULL numbers."
      },
      {
        "token": "MIN / MAX",
        "meaning": "Returns minimum or maximum value."
      }
    ],
    "example": {
      "id": "ex-aggregates",
      "title": "University-wide student GPA summary",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT COUNT(*) AS TotalStudents, AVG(CGPA) AS AverageCGPA, MAX(CGPA) AS HighestCGPA, MIN(CGPA) AS LowestCGPA\nFROM Student;",
        "tsql": "SELECT COUNT(*) AS TotalStudents, AVG(CGPA) AS AverageCGPA, MAX(CGPA) AS HighestCGPA, MIN(CGPA) AS LowestCGPA\nFROM Student;"
      },
      "explanation": "Collapses all 5 Student rows into count (5), average (3.56), highest (3.90), and lowest (3.20)."
    },
    "variations": [
      "SELECT COUNT(Grade) AS GradedCount, COUNT(*) AS TotalEnrollments FROM Enrollment;",
      "SELECT SUM(Salary) AS TotalPayroll, AVG(Salary) AS AvgSalary FROM Teacher;"
    ],
    "relatedSlugs": [
      "group-by-having",
      "window-ranking"
    ]
  },
  {
    "slug": "group-by-having",
    "title": "12. Grouping Data (GROUP BY & HAVING)",
    "category": "Stage 3: Aggregation & Summarization",
    "difficulty": "Intermediate",
    "summary": "Partition rows into buckets with GROUP BY and filter aggregated buckets with HAVING.",
    "prerequisites": [
      "aggregate-functions"
    ],
    "overview": "GROUP BY groups rows sharing identical key values so aggregate functions compute one summary per bucket. HAVING filters groups after aggregation, whereas WHERE filters individual rows before grouping.",
    "whyItExists": "Finding departments whose average CGPA exceeds 3.50 requires grouping by DepartmentID first and filtering the group averages with HAVING.",
    "syntaxByDialect": {
      "mysql": "SELECT DepartmentID, COUNT(*) AS StudentCount, AVG(CGPA) AS AvgCGPA\nFROM Student\nGROUP BY DepartmentID\nHAVING AVG(CGPA) >= 3.50;",
      "tsql": "SELECT DepartmentID, COUNT(*) AS StudentCount, AVG(CGPA) AS AvgCGPA\nFROM Student\nGROUP BY DepartmentID\nHAVING AVG(CGPA) >= 3.50;"
    },
    "components": [
      {
        "token": "GROUP BY col",
        "meaning": "Creates one summary bucket per distinct key value."
      },
      {
        "token": "HAVING cond",
        "meaning": "Filters summary buckets using aggregate predicates."
      }
    ],
    "example": {
      "id": "ex-group-by",
      "title": "Departments with average CGPA >= 3.50",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT DepartmentID, COUNT(*) AS StudentCount, AVG(CGPA) AS AvgCGPA\nFROM Student\nGROUP BY DepartmentID\nHAVING AVG(CGPA) >= 3.50;",
        "tsql": "SELECT DepartmentID, COUNT(*) AS StudentCount, AVG(CGPA) AS AvgCGPA\nFROM Student\nGROUP BY DepartmentID\nHAVING AVG(CGPA) >= 3.50;"
      },
      "explanation": "Groups Student by DepartmentID and keeps Dept 10 (3.65) and Dept 20 (3.55) while filtering out Dept 30 (3.42)."
    },
    "variations": [
      "SELECT DepartmentID, COUNT(*) AS FacultyCount, AVG(Salary) AS AvgSalary FROM Teacher GROUP BY DepartmentID;",
      "SELECT StudentID, COUNT(*) AS CoursesTaken FROM Enrollment GROUP BY StudentID HAVING COUNT(*) >= 2;"
    ],
    "relatedSlugs": [
      "aggregate-functions",
      "joins"
    ]
  },
  {
    "slug": "cross-product",
    "title": "13. Cartesian Product (CROSS JOIN)",
    "category": "Stage 4: Multi-Table Joins & Sets",
    "difficulty": "Intermediate",
    "summary": "Pair every row of Table A with every row of Table B (M x N combinations) using CROSS JOIN.",
    "prerequisites": [
      "select"
    ],
    "overview": "A Cartesian product combines every row from the left table (M rows) with every row from the right table (N rows), yielding M x N rows. Understanding CROSS JOIN reveals what happens under the hood before an ON filter is applied.",
    "whyItExists": "Explains why forgetting an ON condition multiplies row counts, and proves useful when generating full schedules or combinations.",
    "syntaxByDialect": {
      "mysql": "SELECT Student.Name, Department.DepartmentName\nFROM Student\nCROSS JOIN Department;",
      "tsql": "SELECT Student.Name, Department.DepartmentName\nFROM Student\nCROSS JOIN Department;"
    },
    "components": [
      {
        "token": "CROSS JOIN",
        "meaning": "Produces all M x N row pairs without a join predicate."
      }
    ],
    "example": {
      "id": "ex-cross-product",
      "title": "Cartesian product of Student (5) and Department (3)",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT Student.Name, Department.DepartmentName\nFROM Student\nCROSS JOIN Department;",
        "tsql": "SELECT Student.Name, Department.DepartmentName\nFROM Student\nCROSS JOIN Department;"
      },
      "explanation": "Pairs all 5 students with all 3 departments, producing 5 x 3 = 15 rows."
    },
    "variations": [
      "SELECT Student.Name, Course.CourseID FROM Student CROSS JOIN Course;"
    ],
    "relatedSlugs": [
      "joins",
      "right-full-self-joins"
    ]
  },
  {
    "slug": "joins",
    "title": "14. Combining Tables (INNER JOIN & LEFT JOIN)",
    "category": "Stage 4: Multi-Table Joins & Sets",
    "difficulty": "Intermediate",
    "summary": "Reconstruct normalized relationships across Student, Department, Course, and Enrollment.",
    "prerequisites": [
      "cross-product",
      "foreign-key"
    ],
    "overview": "INNER JOIN keeps only row pairs satisfying the ON condition across both tables. LEFT JOIN preserves every row from the left table and fills unmatched right-table columns with NULL.",
    "whyItExists": "Normalized schemas store DepartmentName in Department and Student names in Student; joins recombine them cleanly without data duplication.",
    "syntaxByDialect": {
      "mysql": "SELECT Student.Name, Student.CGPA, Department.DepartmentName\nFROM Student\nINNER JOIN Department ON Student.DepartmentID = Department.DepartmentID;",
      "tsql": "SELECT Student.Name, Student.CGPA, Department.DepartmentName\nFROM Student\nINNER JOIN Department ON Student.DepartmentID = Department.DepartmentID;"
    },
    "components": [
      {
        "token": "INNER JOIN",
        "meaning": "Returns only rows with matching keys in both tables."
      },
      {
        "token": "LEFT JOIN",
        "meaning": "Preserves all left-table rows even when no right match exists."
      },
      {
        "token": "ON a.Key = b.Key",
        "meaning": "Links child foreign key to parent primary key."
      }
    ],
    "example": {
      "id": "ex-joins",
      "title": "Join students with their department names",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT Student.Name, Student.CGPA, Department.DepartmentName\nFROM Student\nINNER JOIN Department ON Student.DepartmentID = Department.DepartmentID;",
        "tsql": "SELECT Student.Name, Student.CGPA, Department.DepartmentName\nFROM Student\nINNER JOIN Department ON Student.DepartmentID = Department.DepartmentID;"
      },
      "explanation": "Matches each Student.DepartmentID to Department.DepartmentID to display the full department title."
    },
    "variations": [
      "SELECT Student.Name, Enrollment.CourseID, Enrollment.Grade FROM Student LEFT JOIN Enrollment ON Student.StudentID = Enrollment.StudentID;",
      "SELECT Student.Name, Course.CourseName, Enrollment.Grade FROM Enrollment INNER JOIN Student ON Enrollment.StudentID = Student.StudentID INNER JOIN Course ON Enrollment.CourseID = Course.CourseID;"
    ],
    "relatedSlugs": [
      "right-full-self-joins",
      "set-operations"
    ]
  },
  {
    "slug": "right-full-self-joins",
    "title": "15. Outer & Self Joins (RIGHT, FULL OUTER, SELF JOIN)",
    "category": "Stage 4: Multi-Table Joins & Sets",
    "difficulty": "Intermediate",
    "summary": "Preserve right-side or both-side unmatched rows and join a table to itself using aliases.",
    "prerequisites": [
      "joins"
    ],
    "overview": "RIGHT JOIN keeps all rows from the right table; FULL OUTER JOIN (native in T-SQL) keeps unmatched rows from both sides. A SELF JOIN joins a table to itself with distinct aliases—ideal for Course prerequisites.",
    "whyItExists": "Hierarchical relationships stored in a single table (such as Course.PrerequisiteCourseID -> Course.CourseID) require self-joining.",
    "syntaxByDialect": {
      "mysql": "SELECT c.CourseID, c.CourseName, p.CourseName AS PrerequisiteName\nFROM Course c\nLEFT JOIN Course p ON c.PrerequisiteCourseID = p.CourseID;",
      "tsql": "SELECT c.CourseID, c.CourseName, p.CourseName AS PrerequisiteName\nFROM Course c\nLEFT JOIN Course p ON c.PrerequisiteCourseID = p.CourseID;"
    },
    "components": [
      {
        "token": "Course c / Course p",
        "meaning": "Distinct aliases let SQL treat one table as two logical roles."
      },
      {
        "token": "RIGHT JOIN",
        "meaning": "Preserves all rows from the right-hand table."
      },
      {
        "token": "FULL OUTER JOIN",
        "meaning": "Preserves unmatched rows from both tables (supported natively in T-SQL)."
      }
    ],
    "example": {
      "id": "ex-self-join",
      "title": "Self-join Course to display each course prerequisite",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT c.CourseID, c.CourseName, p.CourseName AS PrerequisiteName\nFROM Course c\nLEFT JOIN Course p ON c.PrerequisiteCourseID = p.CourseID;",
        "tsql": "SELECT c.CourseID, c.CourseName, p.CourseName AS PrerequisiteName\nFROM Course c\nLEFT JOIN Course p ON c.PrerequisiteCourseID = p.CourseID;"
      },
      "explanation": "Joins Course (c) to itself (p) so CSE-2203 shows Database Management Systems and CSE-2201 shows Structured Programming."
    },
    "variations": [
      "SELECT Enrollment.EnrollmentID, Course.CourseID, Course.CourseName FROM Enrollment RIGHT JOIN Course ON Enrollment.CourseID = Course.CourseID;"
    ],
    "relatedSlugs": [
      "joins",
      "recursive-ctes"
    ]
  },
  {
    "slug": "set-operations",
    "title": "16. Set Operations (UNION, UNION ALL, INTERSECT, EXCEPT)",
    "category": "Stage 4: Multi-Table Joins & Sets",
    "difficulty": "Intermediate",
    "summary": "Combine result sets vertically using UNION, UNION ALL, INTERSECT, and EXCEPT.",
    "prerequisites": [
      "select",
      "distinct-aliases"
    ],
    "overview": "While joins combine columns horizontally, set operators stack compatible SELECT outputs vertically. UNION removes duplicates, UNION ALL keeps all rows, INTERSECT returns common rows, and EXCEPT returns rows in the first query absent from the second.",
    "whyItExists": "Combining students enrolled in CSE-2201 with those in CSE-2203 or finding students who took one course but not another is concise with set operators.",
    "syntaxByDialect": {
      "mysql": "SELECT StudentID FROM Enrollment WHERE CourseID = 'CSE-2201'\nUNION\nSELECT StudentID FROM Enrollment WHERE CourseID = 'CSE-2203';",
      "tsql": "SELECT StudentID FROM Enrollment WHERE CourseID = 'CSE-2201'\nUNION\nSELECT StudentID FROM Enrollment WHERE CourseID = 'CSE-2203';"
    },
    "components": [
      {
        "token": "UNION",
        "meaning": "Combines two SELECT outputs and removes duplicate rows."
      },
      {
        "token": "UNION ALL",
        "meaning": "Concatenates two SELECT outputs without deduplicating."
      },
      {
        "token": "INTERSECT",
        "meaning": "Returns only rows present in both SELECT results."
      },
      {
        "token": "EXCEPT",
        "meaning": "Returns rows from the top SELECT not found in the bottom SELECT."
      }
    ],
    "example": {
      "id": "ex-set-ops",
      "title": "Students enrolled in CSE-2201 or CSE-2203 (deduplicated)",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT StudentID FROM Enrollment WHERE CourseID = 'CSE-2201'\nUNION\nSELECT StudentID FROM Enrollment WHERE CourseID = 'CSE-2203';",
        "tsql": "SELECT StudentID FROM Enrollment WHERE CourseID = 'CSE-2201'\nUNION\nSELECT StudentID FROM Enrollment WHERE CourseID = 'CSE-2203';"
      },
      "explanation": "Returns distinct StudentIDs (101 and 103) without repeating Student 101."
    },
    "variations": [
      "SELECT StudentID FROM Enrollment WHERE CourseID = 'CSE-2201' UNION ALL SELECT StudentID FROM Enrollment WHERE CourseID = 'CSE-2203';",
      "SELECT StudentID FROM Enrollment WHERE CourseID = 'CSE-2201' INTERSECT SELECT StudentID FROM Enrollment WHERE CourseID = 'CSE-2203';",
      "SELECT StudentID FROM Student EXCEPT SELECT StudentID FROM Enrollment WHERE DepartmentID = 20;"
    ],
    "relatedSlugs": [
      "joins",
      "scalar-in-subqueries"
    ]
  },
  {
    "slug": "scalar-in-subqueries",
    "title": "17. Single-Row & Multi-Row Subqueries",
    "category": "Stage 5: Subqueries & CTEs",
    "difficulty": "Intermediate",
    "summary": "Nest a SELECT inside WHERE using scalar comparisons (=, >) or multi-row IN / NOT IN.",
    "prerequisites": [
      "where",
      "aggregate-functions"
    ],
    "overview": "A subquery is a query nested inside another SQL statement. Scalar subqueries return a single value (such as university-wide AVG(CGPA)) for comparison, while multi-row subqueries return a column of values tested with IN or NOT IN.",
    "whyItExists": "Comparing each student against the university average cannot be written directly in WHERE without a subquery or CTE.",
    "syntaxByDialect": {
      "mysql": "SELECT Name, CGPA\nFROM Student\nWHERE CGPA > (SELECT AVG(CGPA) FROM Student);",
      "tsql": "SELECT Name, CGPA\nFROM Student\nWHERE CGPA > (SELECT AVG(CGPA) FROM Student);"
    },
    "components": [
      {
        "token": "(SELECT AVG(...))",
        "meaning": "Scalar subquery evaluated once before the outer WHERE filter."
      },
      {
        "token": "IN (SELECT ...)",
        "meaning": "Tests membership against a dynamic list returned by an inner query."
      }
    ],
    "example": {
      "id": "ex-subqueries",
      "title": "Find students scoring above the university average CGPA",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT Name, CGPA\nFROM Student\nWHERE CGPA > (SELECT AVG(CGPA) FROM Student);",
        "tsql": "SELECT Name, CGPA\nFROM Student\nWHERE CGPA > (SELECT AVG(CGPA) FROM Student);"
      },
      "explanation": "Computes AVG(CGPA) = 3.56 first, then returns Amina (3.75) and Tuhin (3.90)."
    },
    "variations": [
      "SELECT Name, Email FROM Student WHERE StudentID IN (SELECT StudentID FROM Enrollment WHERE CourseID = 'CSE-2201');"
    ],
    "relatedSlugs": [
      "correlated-subqueries-exists",
      "ctes"
    ]
  },
  {
    "slug": "correlated-subqueries-exists",
    "title": "18. Correlated Subqueries & EXISTS",
    "category": "Stage 5: Subqueries & CTEs",
    "difficulty": "Advanced",
    "summary": "Check per-row existence across related tables using EXISTS and NOT EXISTS.",
    "prerequisites": [
      "scalar-in-subqueries",
      "joins"
    ],
    "overview": "A correlated subquery references a column from the outer query and is evaluated conceptually once per outer row. EXISTS returns TRUE as soon as the inner query finds at least one matching row—making it immune to NOT IN NULL traps.",
    "whyItExists": "Checking whether a student has at least one enrollment or finding departments with zero faculty is cleanest with EXISTS / NOT EXISTS.",
    "syntaxByDialect": {
      "mysql": "SELECT s.StudentID, s.Name, s.CGPA\nFROM Student s\nWHERE EXISTS (\n  SELECT 1 FROM Enrollment e WHERE e.StudentID = s.StudentID\n);",
      "tsql": "SELECT s.StudentID, s.Name, s.CGPA\nFROM Student s\nWHERE EXISTS (\n  SELECT 1 FROM Enrollment e WHERE e.StudentID = s.StudentID\n);"
    },
    "components": [
      {
        "token": "EXISTS (SELECT 1 ...)",
        "meaning": "Short-circuits to TRUE as soon as one matching child row is found."
      },
      {
        "token": "NOT EXISTS (...)",
        "meaning": "Returns TRUE only when zero matching rows exist in the inner query."
      }
    ],
    "example": {
      "id": "ex-exists",
      "title": "Students who have at least one course enrollment",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT s.StudentID, s.Name, s.CGPA\nFROM Student s\nWHERE EXISTS (\n  SELECT 1 FROM Enrollment e WHERE e.StudentID = s.StudentID\n);",
        "tsql": "SELECT s.StudentID, s.Name, s.CGPA\nFROM Student s\nWHERE EXISTS (\n  SELECT 1 FROM Enrollment e WHERE e.StudentID = s.StudentID\n);"
      },
      "explanation": "Checks each student s against Enrollment e and returns all 5 students who have active registrations."
    },
    "variations": [
      "SELECT c.CourseID, c.CourseName FROM Course c WHERE NOT EXISTS (SELECT 1 FROM Enrollment e WHERE e.CourseID = c.CourseID);"
    ],
    "relatedSlugs": [
      "scalar-in-subqueries",
      "ctes"
    ]
  },
  {
    "slug": "ctes",
    "title": "19. Common Table Expressions (WITH)",
    "category": "Stage 5: Subqueries & CTEs",
    "difficulty": "Intermediate",
    "summary": "Structure complex queries into readable, named temporary blocks using WITH.",
    "prerequisites": [
      "scalar-in-subqueries"
    ],
    "overview": "A Common Table Expression (CTE) defines a temporary named result set at the top of a query using WITH cte_name AS (...). CTEs eliminate deeply nested subqueries and make multi-step transformations easy to read.",
    "whyItExists": "Modular SQL pipelines read top-to-bottom like clean code rather than inside-out nested parentheses.",
    "syntaxByDialect": {
      "mysql": "WITH HighAchievers AS (\n  SELECT StudentID, Name, CGPA, DepartmentID\n  FROM Student\n  WHERE CGPA >= 3.55\n)\nSELECT Name, CGPA\nFROM HighAchievers\nORDER BY CGPA DESC;",
      "tsql": "WITH HighAchievers AS (\n  SELECT StudentID, Name, CGPA, DepartmentID\n  FROM Student\n  WHERE CGPA >= 3.55\n)\nSELECT Name, CGPA\nFROM HighAchievers\nORDER BY CGPA DESC;"
    },
    "components": [
      {
        "token": "WITH name AS (...)",
        "meaning": "Defines a temporary named query block scoped to the following SELECT."
      }
    ],
    "example": {
      "id": "ex-ctes",
      "title": "Filter honor students via a CTE and sort by CGPA",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "WITH HighAchievers AS (\n  SELECT StudentID, Name, CGPA, DepartmentID\n  FROM Student\n  WHERE CGPA >= 3.55\n)\nSELECT Name, CGPA\nFROM HighAchievers\nORDER BY CGPA DESC;",
        "tsql": "WITH HighAchievers AS (\n  SELECT StudentID, Name, CGPA, DepartmentID\n  FROM Student\n  WHERE CGPA >= 3.55\n)\nSELECT Name, CGPA\nFROM HighAchievers\nORDER BY CGPA DESC;"
      },
      "explanation": "Defines HighAchievers first, then queries and sorts it cleanly in the main SELECT."
    },
    "variations": [
      "WITH DeptStats AS (SELECT DepartmentID, AVG(CGPA) AS AvgGPA FROM Student GROUP BY DepartmentID) SELECT DepartmentID, AvgGPA FROM DeptStats WHERE AvgGPA >= 3.50;"
    ],
    "relatedSlugs": [
      "recursive-ctes",
      "window-ranking"
    ]
  },
  {
    "slug": "recursive-ctes",
    "title": "20. Hierarchical Queries (Recursive CTEs)",
    "category": "Stage 5: Subqueries & CTEs",
    "difficulty": "Advanced",
    "summary": "Traverse multi-level trees and prerequisite chains iteratively with recursive CTEs.",
    "prerequisites": [
      "ctes",
      "right-full-self-joins"
    ],
    "overview": "A recursive CTE combines an anchor SELECT (base case) with a recursive SELECT referencing the CTE itself via UNION ALL. MySQL requires WITH RECURSIVE, whereas T-SQL uses WITH.",
    "whyItExists": "Walking arbitrary-depth prerequisite chains (CSE-2203 -> CSE-2201 -> CSE-1101) cannot be solved with a fixed number of self-joins.",
    "syntaxByDialect": {
      "mysql": "WITH RECURSIVE CourseChain AS (\n  SELECT CourseID, CourseName, PrerequisiteCourseID, 1 AS Depth\n  FROM Course\n  WHERE CourseID = 'CSE-2203'\n  UNION ALL\n  SELECT c.CourseID, c.CourseName, c.PrerequisiteCourseID, cc.Depth + 1\n  FROM Course c\n  INNER JOIN CourseChain cc ON c.CourseID = cc.PrerequisiteCourseID\n)\nSELECT CourseID, CourseName, Depth FROM CourseChain;",
      "tsql": "WITH CourseChain AS (\n  SELECT CourseID, CourseName, PrerequisiteCourseID, 1 AS Depth\n  FROM Course\n  WHERE CourseID = 'CSE-2203'\n  UNION ALL\n  SELECT c.CourseID, c.CourseName, c.PrerequisiteCourseID, cc.Depth + 1\n  FROM Course c\n  INNER JOIN CourseChain cc ON c.CourseID = cc.PrerequisiteCourseID\n)\nSELECT CourseID, CourseName, Depth FROM CourseChain;"
    },
    "components": [
      {
        "token": "Anchor Member",
        "meaning": "Initial SELECT establishing the starting node (Depth = 1)."
      },
      {
        "token": "UNION ALL",
        "meaning": "Appends each newly discovered level to the working set."
      },
      {
        "token": "Recursive Member",
        "meaning": "Joins base table to the CTE until no new rows match."
      }
    ],
    "example": {
      "id": "ex-recursive-cte",
      "title": "Walk the full prerequisite chain starting from CSE-2203",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "WITH RECURSIVE CourseChain AS (\n  SELECT CourseID, CourseName, PrerequisiteCourseID, 1 AS Depth\n  FROM Course\n  WHERE CourseID = 'CSE-2203'\n  UNION ALL\n  SELECT c.CourseID, c.CourseName, c.PrerequisiteCourseID, cc.Depth + 1\n  FROM Course c\n  INNER JOIN CourseChain cc ON c.CourseID = cc.PrerequisiteCourseID\n)\nSELECT CourseID, CourseName, Depth FROM CourseChain;",
        "tsql": "WITH CourseChain AS (\n  SELECT CourseID, CourseName, PrerequisiteCourseID, 1 AS Depth\n  FROM Course\n  WHERE CourseID = 'CSE-2203'\n  UNION ALL\n  SELECT c.CourseID, c.CourseName, c.PrerequisiteCourseID, cc.Depth + 1\n  FROM Course c\n  INNER JOIN CourseChain cc ON c.CourseID = cc.PrerequisiteCourseID\n)\nSELECT CourseID, CourseName, Depth FROM CourseChain;"
      },
      "explanation": "Traverses CSE-2203 (Depth 1) -> CSE-2201 (Depth 2) -> CSE-1101 (Depth 3)."
    },
    "variations": [
      "WITH RECURSIVE CourseChain AS (SELECT CourseID, CourseName, PrerequisiteCourseID, 1 AS Depth FROM Course WHERE CourseID = 'CSE-2201' UNION ALL SELECT c.CourseID, c.CourseName, c.PrerequisiteCourseID, cc.Depth + 1 FROM Course c INNER JOIN CourseChain cc ON c.CourseID = cc.PrerequisiteCourseID) SELECT CourseID, CourseName, Depth FROM CourseChain;"
    ],
    "relatedSlugs": [
      "ctes",
      "right-full-self-joins"
    ]
  },
  {
    "slug": "window-ranking",
    "title": "21. Window Ranking Functions (ROW_NUMBER, RANK, DENSE_RANK)",
    "category": "Stage 6: Window Functions & Analytics",
    "difficulty": "Advanced",
    "summary": "Rank rows within partitions without collapsing individual rows using OVER (PARTITION BY ... ORDER BY ...).",
    "prerequisites": [
      "group-by-having",
      "order-by"
    ],
    "overview": "Unlike GROUP BY, window functions preserve every input row while computing rankings across a sliding window defined by OVER (...). ROW_NUMBER assigns 1,2,3; RANK leaves gaps after ties (1,1,3); DENSE_RANK leaves no gaps (1,1,2).",
    "whyItExists": "Finding the highest-paid teacher or top student inside each department requires partitioning without losing individual names.",
    "syntaxByDialect": {
      "mysql": "SELECT Name, DepartmentID, CGPA,\n  RANK() OVER (PARTITION BY DepartmentID ORDER BY CGPA DESC) AS DeptRank\nFROM Student;",
      "tsql": "SELECT Name, DepartmentID, CGPA,\n  RANK() OVER (PARTITION BY DepartmentID ORDER BY CGPA DESC) AS DeptRank\nFROM Student;"
    },
    "components": [
      {
        "token": "OVER (...)",
        "meaning": "Defines the window frame over which the function operates."
      },
      {
        "token": "PARTITION BY col",
        "meaning": "Restarts ranking independently for each distinct value of col."
      },
      {
        "token": "ROW_NUMBER / RANK / DENSE_RANK",
        "meaning": "Assigns sequential or tie-aware ordinal ranks."
      }
    ],
    "example": {
      "id": "ex-window-rank",
      "title": "Rank students by CGPA within each department",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT Name, DepartmentID, CGPA,\n  RANK() OVER (PARTITION BY DepartmentID ORDER BY CGPA DESC) AS DeptRank\nFROM Student;",
        "tsql": "SELECT Name, DepartmentID, CGPA,\n  RANK() OVER (PARTITION BY DepartmentID ORDER BY CGPA DESC) AS DeptRank\nFROM Student;"
      },
      "explanation": "Ranks Amina (#1) and Nadia (#2) in Dept 10, Tuhin (#1) and Rafi (#2) in Dept 20, and Sami (#1) in Dept 30."
    },
    "variations": [
      "SELECT Name, DepartmentID, Salary, DENSE_RANK() OVER (PARTITION BY DepartmentID ORDER BY Salary DESC) AS SalaryRank FROM Teacher;",
      "SELECT Name, CGPA, ROW_NUMBER() OVER (ORDER BY CGPA DESC) AS OverallPos FROM Student;"
    ],
    "relatedSlugs": [
      "window-value-frames",
      "ctes"
    ]
  },
  {
    "slug": "window-value-frames",
    "title": "22. Offsets, Running Totals & Window Frames",
    "category": "Stage 6: Window Functions & Analytics",
    "difficulty": "Advanced",
    "summary": "Access neighboring rows with LAG / LEAD and compute cumulative running totals with SUM() OVER.",
    "prerequisites": [
      "window-ranking"
    ],
    "overview": "Value window functions like LAG() and LEAD() inspect preceding or following rows without a self-join, while aggregate window functions like SUM(col) OVER (ORDER BY ...) compute running cumulative totals.",
    "whyItExists": "Comparing each student CGPA against the next-ranked peer or tracking cumulative payroll across faculty members is effortless with window frames.",
    "syntaxByDialect": {
      "mysql": "SELECT Name, CGPA,\n  LAG(CGPA) OVER (ORDER BY CGPA DESC) AS PrevHigherCGPA,\n  SUM(CGPA) OVER (ORDER BY StudentID) AS RunningCGPASum\nFROM Student;",
      "tsql": "SELECT Name, CGPA,\n  LAG(CGPA) OVER (ORDER BY CGPA DESC) AS PrevHigherCGPA,\n  SUM(CGPA) OVER (ORDER BY StudentID) AS RunningCGPASum\nFROM Student;"
    },
    "components": [
      {
        "token": "LAG(col)",
        "meaning": "Reads col from the immediately preceding row in window order (NULL on first row)."
      },
      {
        "token": "LEAD(col)",
        "meaning": "Reads col from the immediately following row in window order."
      },
      {
        "token": "SUM(col) OVER (ORDER BY ...)",
        "meaning": "Computes a running cumulative sum from the start of the partition."
      }
    ],
    "example": {
      "id": "ex-window-frames",
      "title": "Compare each student with the previous GPA and compute running sum",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT Name, CGPA,\n  LAG(CGPA) OVER (ORDER BY CGPA DESC) AS PrevHigherCGPA,\n  SUM(CGPA) OVER (ORDER BY StudentID) AS RunningCGPASum\nFROM Student;",
        "tsql": "SELECT Name, CGPA,\n  LAG(CGPA) OVER (ORDER BY CGPA DESC) AS PrevHigherCGPA,\n  SUM(CGPA) OVER (ORDER BY StudentID) AS RunningCGPASum\nFROM Student;"
      },
      "explanation": "Shows each student alongside the preceding CGPA in descending order and the cumulative sum ordered by StudentID."
    },
    "variations": [
      "SELECT Name, Salary, SUM(Salary) OVER (ORDER BY TeacherID) AS CumulativePayroll FROM Teacher;"
    ],
    "relatedSlugs": [
      "window-ranking",
      "aggregate-functions"
    ]
  },
  {
    "slug": "data-types-ddl",
    "title": "23. Data Types & Table Definition (DDL)",
    "category": "Stage 7: Schema Design & DML",
    "difficulty": "Beginner",
    "summary": "Define tables, column types, CHECK rules, DEFAULTs, and auto-increment keys with CREATE TABLE.",
    "prerequisites": [
      "relational-model"
    ],
    "overview": "Data Definition Language (DDL) creates and evolves database structures. Choosing accurate column types (INT, VARCHAR, DECIMAL, DATE) and column constraints (NOT NULL, UNIQUE, CHECK, DEFAULT) enforces data quality at storage time.",
    "whyItExists": "Strong schema constraints prevent invalid grades, negative credits, or malformed records from ever entering the database.",
    "syntaxByDialect": {
      "mysql": "CREATE TABLE Scholarship (\n  ScholarshipID INT AUTO_INCREMENT PRIMARY KEY,\n  Title VARCHAR(100) NOT NULL UNIQUE,\n  MinCGPA DECIMAL(3,2) DEFAULT 3.50 CHECK (MinCGPA >= 3.00)\n);",
      "tsql": "CREATE TABLE Scholarship (\n  ScholarshipID INT IDENTITY(1,1) PRIMARY KEY,\n  Title VARCHAR(100) NOT NULL UNIQUE,\n  MinCGPA DECIMAL(3,2) DEFAULT 3.50 CHECK (MinCGPA >= 3.00)\n);"
    },
    "components": [
      {
        "token": "CREATE TABLE",
        "meaning": "Defines a new relational table and its column specifications."
      },
      {
        "token": "AUTO_INCREMENT / IDENTITY",
        "meaning": "Auto-generates sequential integer IDs (MySQL vs T-SQL)."
      },
      {
        "token": "CHECK / NOT NULL / UNIQUE",
        "meaning": "Domain constraints rejecting invalid or duplicate values."
      }
    ],
    "example": {
      "id": "ex-ddl",
      "title": "Inspect DDL syntax for a Scholarship table (Sandbox Explanation Mode)",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "CREATE TABLE Scholarship (\n  ScholarshipID INT AUTO_INCREMENT PRIMARY KEY,\n  Title VARCHAR(100) NOT NULL UNIQUE,\n  MinCGPA DECIMAL(3,2) DEFAULT 3.50 CHECK (MinCGPA >= 3.00)\n);",
        "tsql": "CREATE TABLE Scholarship (\n  ScholarshipID INT IDENTITY(1,1) PRIMARY KEY,\n  Title VARCHAR(100) NOT NULL UNIQUE,\n  MinCGPA DECIMAL(3,2) DEFAULT 3.50 CHECK (MinCGPA >= 3.00)\n);"
      },
      "explanation": "Demonstrates column types, auto-numbering, and CHECK constraints in read-only sandbox inspection mode."
    },
    "variations": [
      "SELECT StudentID, Name, CGPA FROM Student;"
    ],
    "relatedSlugs": [
      "primary-key",
      "foreign-key",
      "normalization"
    ]
  },
  {
    "slug": "primary-key",
    "title": "24. Primary Keys & Entity Integrity",
    "category": "Stage 7: Schema Design & DML",
    "difficulty": "Beginner",
    "summary": "Guarantee every tuple is uniquely identifiable and non-NULL with PRIMARY KEY.",
    "prerequisites": [
      "data-types-ddl"
    ],
    "overview": "Entity Integrity requires every table to have a PRIMARY KEY whose values are both UNIQUE and NOT NULL. Databases automatically index the primary key for O(log N) B-Tree point lookups.",
    "whyItExists": "Without a primary key, duplicate rows cannot be updated or referenced unambiguously.",
    "syntaxByDialect": {
      "mysql": "CREATE TABLE Student (\n  StudentID INT PRIMARY KEY,\n  Name VARCHAR(100) NOT NULL\n);",
      "tsql": "CREATE TABLE Student (\n  StudentID INT PRIMARY KEY,\n  Name VARCHAR(100) NOT NULL\n);"
    },
    "components": [
      {
        "token": "PRIMARY KEY",
        "meaning": "Enforces UNIQUE + NOT NULL and builds a clustered/unique index."
      }
    ],
    "example": {
      "id": "ex-primary-key",
      "title": "Point lookup by StudentID primary key",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT StudentID, Name, Email, CGPA\nFROM Student\nWHERE StudentID = 101;",
        "tsql": "SELECT StudentID, Name, Email, CGPA\nFROM Student\nWHERE StudentID = 101;"
      },
      "explanation": "Filtering on StudentID = 101 targets at most 1 guaranteed unique student row."
    },
    "variations": [
      "SELECT CourseID, CourseName, Credit FROM Course WHERE CourseID = 'CSE-2201';"
    ],
    "relatedSlugs": [
      "foreign-key",
      "cascade",
      "indexes-explain"
    ]
  },
  {
    "slug": "foreign-key",
    "title": "25. Foreign Keys & Referential Integrity",
    "category": "Stage 7: Schema Design & DML",
    "difficulty": "Intermediate",
    "summary": "Link child rows to existing parent primary keys to eliminate orphan records.",
    "prerequisites": [
      "primary-key",
      "joins"
    ],
    "overview": "A FOREIGN KEY in a child table (e.g., Student.DepartmentID) must match an existing value in the referenced parent primary key (Department.DepartmentID) or be NULL.",
    "whyItExists": "Referential integrity prevents inserting enrollments for non-existent students or courses.",
    "syntaxByDialect": {
      "mysql": "CREATE TABLE Student (\n  StudentID INT PRIMARY KEY,\n  DepartmentID INT NOT NULL,\n  CONSTRAINT fk_student_dept FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID)\n);",
      "tsql": "CREATE TABLE Student (\n  StudentID INT PRIMARY KEY,\n  DepartmentID INT NOT NULL,\n  CONSTRAINT fk_student_dept FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID)\n);"
    },
    "components": [
      {
        "token": "FOREIGN KEY (col)",
        "meaning": "Declares the child referencing attribute."
      },
      {
        "token": "REFERENCES Parent(Key)",
        "meaning": "Enforces that matching parent rows exist."
      }
    ],
    "example": {
      "id": "ex-foreign-key",
      "title": "Verify foreign key links between Enrollment and Student",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT Enrollment.EnrollmentID, Student.Name, Enrollment.CourseID, Enrollment.Semester\nFROM Enrollment\nINNER JOIN Student ON Enrollment.StudentID = Student.StudentID;",
        "tsql": "SELECT Enrollment.EnrollmentID, Student.Name, Enrollment.CourseID, Enrollment.Semester\nFROM Enrollment\nINNER JOIN Student ON Enrollment.StudentID = Student.StudentID;"
      },
      "explanation": "Resolves every Enrollment.StudentID foreign key against its parent Student record."
    },
    "variations": [
      "SELECT Teacher.Name, Department.DepartmentName FROM Teacher INNER JOIN Department ON Teacher.DepartmentID = Department.DepartmentID;"
    ],
    "relatedSlugs": [
      "primary-key",
      "cascade"
    ]
  },
  {
    "slug": "cascade",
    "title": "26. Referential Actions (ON DELETE / ON UPDATE CASCADE)",
    "category": "Stage 7: Schema Design & DML",
    "difficulty": "Intermediate",
    "summary": "Automate child row updates or deletions when a parent primary key changes.",
    "prerequisites": [
      "foreign-key"
    ],
    "overview": "When a parent key is deleted or updated, RESTRICT blocks the change if children exist, SET NULL clears child foreign keys, and CASCADE automatically propagates the delete or key update to dependent child rows.",
    "whyItExists": "Prevents stale foreign keys and eliminates manual multi-table cleanup scripts.",
    "syntaxByDialect": {
      "mysql": "FOREIGN KEY (StudentID) REFERENCES Student(StudentID)\n  ON DELETE CASCADE\n  ON UPDATE CASCADE",
      "tsql": "FOREIGN KEY (StudentID) REFERENCES Student(StudentID)\n  ON DELETE CASCADE\n  ON UPDATE CASCADE"
    },
    "components": [
      {
        "token": "ON DELETE CASCADE",
        "meaning": "Deleting a parent row deletes all referencing child rows."
      },
      {
        "token": "ON UPDATE CASCADE",
        "meaning": "Updating a parent primary key updates child foreign keys."
      },
      {
        "token": "ON DELETE SET NULL",
        "meaning": "Sets child foreign keys to NULL instead of deleting rows."
      }
    ],
    "example": {
      "id": "ex-cascade",
      "title": "Inspect child Enrollment rows governed by StudentID 101",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT Student.StudentID, Student.Name, Enrollment.EnrollmentID, Enrollment.CourseID\nFROM Student\nINNER JOIN Enrollment ON Student.StudentID = Enrollment.StudentID\nWHERE Student.StudentID = 101;",
        "tsql": "SELECT Student.StudentID, Student.Name, Enrollment.EnrollmentID, Enrollment.CourseID\nFROM Student\nINNER JOIN Enrollment ON Student.StudentID = Enrollment.StudentID\nWHERE Student.StudentID = 101;"
      },
      "explanation": "Displays the 2 Enrollment rows belonging to Amina (101) that cascade automatically on parent change."
    },
    "variations": [
      "SELECT Student.StudentID, Student.Name, Enrollment.CourseID FROM Student LEFT JOIN Enrollment ON Student.StudentID = Enrollment.StudentID;"
    ],
    "relatedSlugs": [
      "foreign-key",
      "dml-mutations"
    ]
  },
  {
    "slug": "dml-mutations",
    "title": "27. Modifying Data Safely (INSERT, UPDATE, DELETE)",
    "category": "Stage 7: Schema Design & DML",
    "difficulty": "Beginner",
    "summary": "Add, modify, and remove rows safely with INSERT INTO, UPDATE ... WHERE, and DELETE ... WHERE.",
    "prerequisites": [
      "where",
      "primary-key"
    ],
    "overview": "Data Manipulation Language (DML) modifies table contents. Always include a selective WHERE clause on UPDATE and DELETE—omitting WHERE modifies or erases every row in the table.",
    "whyItExists": "Every transactional application relies on safe, targeted row inserts, updates, and deletions.",
    "syntaxByDialect": {
      "mysql": "UPDATE Student\nSET CGPA = 3.80\nWHERE StudentID = 101;",
      "tsql": "UPDATE Student\nSET CGPA = 3.80\nWHERE StudentID = 101;"
    },
    "components": [
      {
        "token": "INSERT INTO tbl VALUES (...)",
        "meaning": "Appends new rows matching column types and constraints."
      },
      {
        "token": "UPDATE tbl SET ... WHERE ...",
        "meaning": "Modifies specific columns on rows matching WHERE."
      },
      {
        "token": "DELETE FROM tbl WHERE ...",
        "meaning": "Removes rows matching WHERE (logged row-by-row)."
      }
    ],
    "example": {
      "id": "ex-dml",
      "title": "Inspect targeted UPDATE syntax (Sandbox Explanation Mode)",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "UPDATE Student\nSET CGPA = 3.80\nWHERE StudentID = 101;",
        "tsql": "UPDATE Student\nSET CGPA = 3.80\nWHERE StudentID = 101;"
      },
      "explanation": "Explains how WHERE StudentID = 101 scopes the update to a single row in the read-only sandbox."
    },
    "variations": [
      "SELECT StudentID, Name, CGPA FROM Student WHERE StudentID = 101;"
    ],
    "relatedSlugs": [
      "transactions-acid",
      "cascade"
    ]
  },
  {
    "slug": "normalization",
    "title": "28. Schema Normalization & Anomalies (1NF–BCNF)",
    "category": "Stage 7: Schema Design & DML",
    "difficulty": "Intermediate",
    "summary": "Eliminate insertion, update, and deletion anomalies through 1NF, 2NF, 3NF, and BCNF.",
    "prerequisites": [
      "primary-key",
      "foreign-key",
      "joins"
    ],
    "overview": "Normalization decomposes wide, redundant tables into well-structured relations: 1NF enforces atomic values; 2NF removes partial dependencies on composite keys; 3NF removes transitive dependencies (like storing DepartmentName inside Student); BCNF ensures every determinant is a candidate key.",
    "whyItExists": "Without 3NF, renaming a department requires updating hundreds of student rows and risks inconsistent spelling.",
    "syntaxByDialect": {
      "mysql": "SELECT Student.StudentID, Student.Name, Department.DepartmentName, Course.CourseName, Enrollment.Grade\nFROM Enrollment\nINNER JOIN Student ON Enrollment.StudentID = Student.StudentID\nINNER JOIN Department ON Student.DepartmentID = Department.DepartmentID\nINNER JOIN Course ON Enrollment.CourseID = Course.CourseID;",
      "tsql": "SELECT Student.StudentID, Student.Name, Department.DepartmentName, Course.CourseName, Enrollment.Grade\nFROM Enrollment\nINNER JOIN Student ON Enrollment.StudentID = Student.StudentID\nINNER JOIN Department ON Student.DepartmentID = Department.DepartmentID\nINNER JOIN Course ON Enrollment.CourseID = Course.CourseID;"
    },
    "components": [
      {
        "token": "1NF (Atomic)",
        "meaning": "No repeating groups or multi-valued cells."
      },
      {
        "token": "2NF (Full Key)",
        "meaning": "Every non-key attribute depends on the whole primary key."
      },
      {
        "token": "3NF (No Transitive)",
        "meaning": "Non-key attributes depend only on the primary key."
      }
    ],
    "example": {
      "id": "ex-normalization",
      "title": "Reconstruct a denormalized report from 3NF tables",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT Student.StudentID, Student.Name, Department.DepartmentName, Course.CourseName, Enrollment.Grade\nFROM Enrollment\nINNER JOIN Student ON Enrollment.StudentID = Student.StudentID\nINNER JOIN Department ON Student.DepartmentID = Department.DepartmentID\nINNER JOIN Course ON Enrollment.CourseID = Course.CourseID;",
        "tsql": "SELECT Student.StudentID, Student.Name, Department.DepartmentName, Course.CourseName, Enrollment.Grade\nFROM Enrollment\nINNER JOIN Student ON Enrollment.StudentID = Student.StudentID\nINNER JOIN Department ON Student.DepartmentID = Department.DepartmentID\nINNER JOIN Course ON Enrollment.CourseID = Course.CourseID;"
      },
      "explanation": "Joins 4 normalized 3NF tables together to produce a unified academic transcript view."
    },
    "variations": [
      "SELECT * FROM Department;"
    ],
    "relatedSlugs": [
      "foreign-key",
      "views"
    ]
  },
  {
    "slug": "views",
    "title": "29. SQL Views (CREATE VIEW)",
    "category": "Stage 8: Objects, Performance & ACID",
    "difficulty": "Intermediate",
    "summary": "Encapsulate reusable queries and hide sensitive columns behind named virtual tables.",
    "prerequisites": [
      "select",
      "where"
    ],
    "overview": "A VIEW stores a named SELECT definition rather than copying rows on disk. Querying a view always reflects the latest data in underlying base tables.",
    "whyItExists": "Views simplify repeated honor-roll filters and let administrators expose safe subsets of columns (omitting Email or Salary).",
    "syntaxByDialect": {
      "mysql": "CREATE VIEW HonorStudents AS\nSELECT StudentID, Name, CGPA, DepartmentID\nFROM Student\nWHERE CGPA >= 3.50;",
      "tsql": "CREATE VIEW HonorStudents AS\nSELECT StudentID, Name, CGPA, DepartmentID\nFROM Student\nWHERE CGPA >= 3.50;"
    },
    "components": [
      {
        "token": "CREATE VIEW name AS",
        "meaning": "Registers a virtual table backed by a SELECT statement."
      }
    ],
    "example": {
      "id": "ex-views",
      "title": "Query the pre-defined HonorStudents view",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "SELECT *\nFROM HonorStudents\nORDER BY CGPA DESC;",
        "tsql": "SELECT *\nFROM HonorStudents\nORDER BY CGPA DESC;"
      },
      "explanation": "Reads from the HonorStudents view, returning Tuhin, Amina, and Nadia without repeating the WHERE filter."
    },
    "variations": [
      "SELECT Name, CGPA FROM HonorStudents WHERE DepartmentID = 10;"
    ],
    "relatedSlugs": [
      "select",
      "normalization"
    ]
  },
  {
    "slug": "indexes-explain",
    "title": "30. Indexes & Query Execution Plans (EXPLAIN)",
    "category": "Stage 8: Objects, Performance & ACID",
    "difficulty": "Advanced",
    "summary": "Accelerate lookups with B-Tree indexes and inspect access paths using EXPLAIN.",
    "prerequisites": [
      "primary-key",
      "where"
    ],
    "overview": "Without an index on a filtered column, the engine performs a Full Table Scan across every row. Creating a B-Tree index lets the optimizer locate matching rows in logarithmic steps, visible via EXPLAIN.",
    "whyItExists": "Diagnosing slow queries with execution plans is the #1 performance skill in database engineering.",
    "syntaxByDialect": {
      "mysql": "EXPLAIN SELECT Name, CGPA\nFROM Student\nWHERE StudentID = 101;",
      "tsql": "SELECT Name, CGPA\nFROM Student\nWHERE StudentID = 101;"
    },
    "components": [
      {
        "token": "CREATE INDEX idx ON tbl(col)",
        "meaning": "Builds an ordered B-Tree lookup structure on col."
      },
      {
        "token": "EXPLAIN",
        "meaning": "Displays whether the optimizer uses a Primary Key seek or Full Table Scan."
      }
    ],
    "example": {
      "id": "ex-explain",
      "title": "Inspect optimizer plan for a primary-key lookup",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "EXPLAIN SELECT Name, CGPA\nFROM Student\nWHERE StudentID = 101;",
        "tsql": "SELECT Name, CGPA\nFROM Student\nWHERE StudentID = 101;"
      },
      "explanation": "Shows how StudentID = 101 uses a Primary Key index lookup (const / 1 row) instead of scanning the full table."
    },
    "variations": [
      "EXPLAIN SELECT Name, CGPA FROM Student WHERE CGPA > 3.50;"
    ],
    "relatedSlugs": [
      "primary-key",
      "stored-procedures-triggers"
    ]
  },
  {
    "slug": "stored-procedures-triggers",
    "title": "31. Stored Procedures & Triggers",
    "category": "Stage 8: Objects, Performance & ACID",
    "difficulty": "Advanced",
    "summary": "Automate multi-step routines and event-driven validation inside the database engine.",
    "prerequisites": [
      "dml-mutations",
      "case-expressions"
    ],
    "overview": "Stored Procedures bundle parameterized SQL logic callable on demand, while Triggers fire automatically BEFORE or AFTER INSERT, UPDATE, or DELETE events on a table.",
    "whyItExists": "Enforcing audit logs or automatic value normalization at the database layer guarantees consistency across every client app.",
    "syntaxByDialect": {
      "mysql": "CREATE TRIGGER trg_round_cgpa\nBEFORE INSERT ON Student\nFOR EACH ROW\nSET NEW.CGPA = ROUND(NEW.CGPA, 2);",
      "tsql": "CREATE PROCEDURE GetStudentsByDept @DeptID INT AS\nBEGIN\n  SELECT Name, CGPA FROM Student WHERE DepartmentID = @DeptID;\nEND;"
    },
    "components": [
      {
        "token": "CREATE PROCEDURE",
        "meaning": "Saves a reusable parameterized routine inside the database."
      },
      {
        "token": "CREATE TRIGGER",
        "meaning": "Attaches automatic logic to INSERT / UPDATE / DELETE table events."
      }
    ],
    "example": {
      "id": "ex-triggers",
      "title": "Inspect a BEFORE INSERT validation trigger (Sandbox Explanation Mode)",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "CREATE TRIGGER trg_round_cgpa\nBEFORE INSERT ON Student\nFOR EACH ROW\nSET NEW.CGPA = ROUND(NEW.CGPA, 2);",
        "tsql": "CREATE PROCEDURE GetStudentsByDept @DeptID INT AS\nBEGIN\n  SELECT Name, CGPA FROM Student WHERE DepartmentID = @DeptID;\nEND;"
      },
      "explanation": "Parses and explains procedural routine and trigger syntax in read-only sandbox mode."
    },
    "variations": [
      "SELECT Name, CGPA FROM Student WHERE DepartmentID = 10;"
    ],
    "relatedSlugs": [
      "dml-mutations",
      "transactions-acid"
    ]
  },
  {
    "slug": "transactions-acid",
    "title": "32. Transactions, Concurrency & ACID",
    "category": "Stage 8: Objects, Performance & ACID",
    "difficulty": "Advanced",
    "summary": "Group statements into atomic all-or-nothing units with BEGIN, COMMIT, ROLLBACK, and ACID guarantees.",
    "prerequisites": [
      "dml-mutations"
    ],
    "overview": "A transaction bundles multiple SQL operations into an indivisible unit governed by ACID: Atomicity (all or nothing), Consistency (valid constraints), Isolation (concurrent safety), and Durability (persisted after COMMIT).",
    "whyItExists": "Transferring enrollment credits or updating linked balances must never leave half-applied state if an error occurs mid-way.",
    "syntaxByDialect": {
      "mysql": "START TRANSACTION;\nUPDATE Student SET CGPA = 3.85 WHERE StudentID = 101;\nROLLBACK;",
      "tsql": "BEGIN TRANSACTION;\nUPDATE Student SET CGPA = 3.85 WHERE StudentID = 101;\nROLLBACK;"
    },
    "components": [
      {
        "token": "BEGIN / START TRANSACTION",
        "meaning": "Opens an atomic transaction boundary."
      },
      {
        "token": "COMMIT",
        "meaning": "Makes all changes inside the transaction permanent."
      },
      {
        "token": "ROLLBACK",
        "meaning": "Undoes all uncommitted changes back to the transaction start."
      }
    ],
    "example": {
      "id": "ex-transactions",
      "title": "Trace an atomic UPDATE + ROLLBACK block (Sandbox Explanation Mode)",
      "datasetId": "university-demo-v1",
      "queryByDialect": {
        "mysql": "START TRANSACTION;\nUPDATE Student SET CGPA = 3.85 WHERE StudentID = 101;\nROLLBACK;",
        "tsql": "BEGIN TRANSACTION;\nUPDATE Student SET CGPA = 3.85 WHERE StudentID = 101;\nROLLBACK;"
      },
      "explanation": "Demonstrates atomic transaction boundaries and ROLLBACK recovery in read-only sandbox mode."
    },
    "variations": [
      "SELECT StudentID, Name, CGPA FROM Student WHERE StudentID = 101;"
    ],
    "relatedSlugs": [
      "dml-mutations",
      "stored-procedures-triggers"
    ]
  }
];

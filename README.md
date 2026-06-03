# 🎓 College Account Section Management System

A modern, full-stack web application for managing college finances — including student fee collection, expense tracking, salary management, budget allocation, scholarships, and comprehensive financial reporting with role-based access control.

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with access & refresh tokens
- Role-based access control (Super Admin, Admin, Accountant, Clerk, Viewer)
- Secure password hashing with bcrypt
- Session management and token refresh

### 👨‍🎓 Student Management
- Complete student registration with enrollment details
- Student search and filtering by department, year, and status
- Student profile management with contact information
- Bulk student import support

### 💰 Fee Management
- Configurable fee structures by department, year, and category
- Fee payment recording with multiple payment methods (Cash, Cheque, DD, Online, UPI)
- Automated receipt generation with unique receipt numbers
- Fee due tracking and defaulter lists
- Partial payment support

### 📋 Expense Tracking
- Categorized expense recording and management
- Vendor/payee tracking
- Expense approval workflow
- Budget-linked expense monitoring

### 💼 Salary Management
- Employee salary disbursement records
- Monthly/yearly salary tracking
- Department-wise salary reports

### 🎖️ Scholarship Management
- Scholarship creation and assignment
- Student scholarship tracking
- Scholarship disbursement records

### 📊 Budget Management
- Budget head creation and categorization
- Annual budget allocation
- Budget vs. actual expenditure tracking
- Budget utilization reports

### 📈 Reports & Analytics
- Daily/monthly/yearly collection reports
- Department-wise fee collection summaries
- Expense analysis reports
- Income vs. expenditure statements
- Dashboard with key financial metrics and charts

### 📝 Audit Trail
- Complete audit logging of all financial transactions
- User activity tracking
- Data change history

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.11** | Programming language |
| **FastAPI** | Web framework with async support |
| **SQLAlchemy 2.0** | ORM with async session support |
| **PostgreSQL 16** | Relational database |
| **Alembic** | Database migrations |
| **Pydantic v2** | Data validation and serialization |
| **python-jose** | JWT token handling |
| **bcrypt / passlib** | Password hashing |
| **Uvicorn** | ASGI server |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI library |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Build tool and dev server |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client |
| **Tailwind CSS** | Utility-first CSS framework |
| **Recharts** | Charting library |
| **React Hook Form** | Form management |
| **Zod** | Schema validation |

### DevOps
| Technology | Purpose |
|---|---|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **Nginx** | Reverse proxy and static file serving |

---

## 📸 Screenshots

> _Screenshots will be added here after the UI is complete._

---

## 📋 Prerequisites

### Option A: Docker (Recommended)
- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

### Option B: Manual Setup
- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL 16](https://www.postgresql.org/download/)

---

## 🚀 Quick Start with Docker

### 1. Clone the Repository
```bash
git clone <repository-url>
cd account_section_management_system
```

### 2. Start All Services
```bash
docker-compose up --build
```

### 3. Access the Application

| Service | URL |
|---|---|
| **Frontend** | [http://localhost](http://localhost) |
| **API Documentation (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **API Documentation (ReDoc)** | [http://localhost:8000/redoc](http://localhost:8000/redoc) |

### 4. Stop Services
```bash
docker-compose down
```

To also remove the database volume (⚠️ this deletes all data):
```bash
docker-compose down -v
```

---

## 🔧 Manual Setup (Without Docker)

### 1. Database Setup

```bash
# Create the PostgreSQL database
createdb college_accounts

# Or using psql
psql -U postgres -c "CREATE DATABASE college_accounts;"
```

### 2. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and adjust the settings as needed
# Especially update DATABASE_URL if your PostgreSQL credentials differ
```

### 3. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Seed the database with initial data (creates tables + default users)
python -m app.seed

# Start the development server
uvicorn app.main:app --reload --port 8000
```

The API will be available at [http://localhost:8000](http://localhost:8000)

### 4. Frontend Setup

```bash
# Navigate to the frontend directory (from project root)
cd frontend

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173)

---

## 🔑 Default Login Credentials

The database seeder creates the following default user accounts:

| # | Username | Password | Role | Permissions |
|---|---|---|---|---|
| 1 | `superadmin` | `SuperAdmin@123` | Super Admin | Full system access, user management |
| 2 | `admin` | `Admin@123` | Admin | Manage students, fees, expenses, reports |
| 3 | `accountant` | `Accountant@123` | Accountant | Fee collection, expense entry, salary processing |
| 4 | `clerk` | `Clerk@123` | Clerk | Fee collection, basic data entry |
| 5 | `viewer` | `Viewer@123` | Viewer | View-only access to reports and data |

> ⚠️ **Important:** Change all default passwords before deploying to production!

---

## 📖 API Documentation

Interactive API documentation is automatically generated by FastAPI:

- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs) — Interactive API explorer
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc) — Clean, readable API reference

### Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `GET` | `/api/students` | List all students |
| `POST` | `/api/students` | Create a student |
| `GET` | `/api/fees/structures` | List fee structures |
| `POST` | `/api/fees/payments` | Record fee payment |
| `GET` | `/api/expenses` | List expenses |
| `POST` | `/api/expenses` | Create an expense |
| `GET` | `/api/salaries` | List salary records |
| `GET` | `/api/scholarships` | List scholarships |
| `GET` | `/api/budgets` | List budget heads |
| `GET` | `/api/reports/dashboard` | Dashboard summary |
| `GET` | `/api/reports/collections` | Collection reports |

---

## 📁 Project Structure

```
account_section_management_system/
├── docker-compose.yml              # Docker orchestration
├── .env.example                    # Environment variable template
├── .gitignore                      # Git ignore rules
├── README.md                       # This file
│
├── backend/                        # FastAPI Backend
│   ├── Dockerfile                  # Backend container config
│   ├── alembic.ini                 # Alembic migration config
│   ├── requirements.txt            # Python dependencies
│   │
│   ├── alembic/                    # Database migrations
│   │   ├── env.py                  # Migration environment
│   │   ├── script.py.mako          # Migration template
│   │   └── versions/               # Migration scripts
│   │
│   └── app/                        # Application package
│       ├── __init__.py
│       ├── main.py                 # FastAPI app entry point
│       ├── config.py               # App configuration (env vars)
│       ├── database.py             # Database connection & session
│       ├── seed.py                 # Database seeder
│       │
│       ├── models/                 # SQLAlchemy models
│       │   ├── __init__.py
│       │   ├── user.py
│       │   ├── student.py
│       │   ├── fee.py
│       │   ├── expense.py
│       │   ├── salary.py
│       │   ├── scholarship.py
│       │   ├── budget.py
│       │   └── audit.py
│       │
│       ├── schemas/                # Pydantic schemas
│       │   ├── __init__.py
│       │   ├── user.py
│       │   ├── student.py
│       │   ├── fee.py
│       │   ├── expense.py
│       │   ├── salary.py
│       │   ├── scholarship.py
│       │   └── budget.py
│       │
│       ├── routers/                # API route handlers
│       │   ├── __init__.py
│       │   ├── auth.py
│       │   ├── users.py
│       │   ├── students.py
│       │   ├── fees.py
│       │   ├── expenses.py
│       │   ├── salaries.py
│       │   ├── scholarships.py
│       │   ├── budgets.py
│       │   └── reports.py
│       │
│       ├── services/               # Business logic
│       │   ├── __init__.py
│       │   ├── auth.py
│       │   ├── student.py
│       │   ├── fee.py
│       │   └── report.py
│       │
│       └── utils/                  # Utility functions
│           ├── __init__.py
│           ├── security.py         # JWT & password utilities
│           ├── dependencies.py     # FastAPI dependencies
│           └── receipt.py          # Receipt generation
│
└── frontend/                       # React Frontend
    ├── Dockerfile                  # Frontend container config
    ├── nginx.conf                  # Nginx configuration
    ├── package.json                # Node.js dependencies
    ├── vite.config.ts              # Vite configuration
    ├── tsconfig.json               # TypeScript configuration
    ├── tailwind.config.js          # Tailwind CSS configuration
    ├── index.html                  # HTML entry point
    │
    └── src/
        ├── main.tsx                # React entry point
        ├── App.tsx                 # Root component with routing
        ├── api/                    # Axios API client
        │   └── axios.ts
        ├── context/                # React contexts
        │   └── AuthContext.tsx
        ├── components/             # Reusable UI components
        │   ├── Layout/
        │   ├── common/
        │   └── charts/
        ├── pages/                  # Page components
        │   ├── Login.tsx
        │   ├── Dashboard.tsx
        │   ├── Students/
        │   ├── Fees/
        │   ├── Expenses/
        │   ├── Salaries/
        │   ├── Scholarships/
        │   ├── Budgets/
        │   ├── Reports/
        │   └── Users/
        ├── hooks/                  # Custom React hooks
        ├── types/                  # TypeScript type definitions
        └── utils/                  # Utility functions
```

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/college_accounts` |
| `SECRET_KEY` | JWT signing secret (min 32 chars) | `your-super-secret-key-change-in-production-min-32-chars-long` |
| `ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL in minutes | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL in days | `7` |
| `CORS_ORIGINS` | Allowed CORS origins (JSON array) | `["http://localhost:5173"]` |
| `COLLEGE_NAME` | Institution name for receipts | `National Institute of Technology` |
| `COLLEGE_ADDRESS` | Institution address for receipts | `Main Campus Road, Bangalore - 560001` |
| `COLLEGE_PHONE` | Institution phone number | `+91-80-2658-1234` |
| `COLLEGE_EMAIL` | Institution email address | `accounts@nit.edu.in` |
| `RECEIPT_PREFIX` | Prefix for receipt numbers | `NIT` |
| `ACADEMIC_YEAR` | Current academic year | `2025-2026` |

---

## 🗄️ Database Migrations

This project uses **Alembic** for database schema migrations.

```bash
# Navigate to the backend directory
cd backend

# Create a new migration (after modifying models)
alembic revision --autogenerate -m "describe your change"

# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

---

## 🧪 Running Tests

### Backend Tests
```bash
cd backend
pytest -v
```

### Frontend Tests
```bash
cd frontend
npm run test
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit** your changes with clear, descriptive messages:
   ```bash
   git commit -m "feat: add student bulk import functionality"
   ```
4. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open** a Pull Request with a detailed description of your changes

### Commit Message Convention
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `style:` — Code style changes (formatting, etc.)
- `refactor:` — Code refactoring
- `test:` — Adding or updating tests
- `chore:` — Maintenance tasks

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 College Account Section Management System

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<p align="center">
  Made with ❤️ for educational institutions
</p>

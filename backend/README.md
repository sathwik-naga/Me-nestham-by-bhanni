# Me Nestham By Bhanni - E-commerce Backend

Production-ready, highly scalable, clean-architecture backend for the Me Nestham e-commerce website. Built with TypeScript, Express.js, and Supabase.

## Tech Stack
* **Runtime:** Node.js
* **Framework:** Express.js
* **Language:** TypeScript
* **Database & Auth:** Supabase (PostgreSQL)
* **Validation:** Zod
* **Logger:** Winston
* **Security:** Helmet, CORS, Rate Limiter
* **AI Engine:** OpenAI API
* **Payments:** Razorpay

---

## Folder Architecture

The backend follows the Repository & Service pattern, keeping logic separated and maintaining SOLID principles:

```text
backend/
├── src/
│   ├── config/          # Configuration schemas and env validation
│   ├── controllers/     # Express route handlers / request-response logic
│   ├── routes/          # Express route declarations
│   ├── services/        # Business logic layer
│   ├── repositories/    # Database queries & data access layer (Supabase)
│   ├── middleware/      # Custom Express middleware (auth, errors, rate limits)
│   ├── validators/      # Zod validation schemas for input
│   ├── interfaces/      # TypeScript interfaces
│   ├── types/           # Custom type definitions
│   ├── utils/           # Helper utilities (logger, etc.)
│   ├── lib/             # Third-party service initializations (supabase client, razorpay, etc.)
│   ├── constants/       # Global constants
│   ├── docs/            # Swagger/API Documentation (if applicable)
│   ├── app.ts           # Express Application setup & middleware application
│   └── server.ts        # Entry point for starting the server
├── .env.example         # Template for environment variables
├── .eslintrc.json       # ESLint configurations
├── tsconfig.json        # TypeScript compiler configurations
└── package.json         # Project manifests and scripts
```

---

## Getting Started

### Prerequisites
* Node.js (v18+ recommended)
* npm or yarn

### Installation
1. Clone the repository and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template and fill in your keys:
   ```bash
   cp .env.example .env
   ```

### Running Locally
* **Development Mode (Hot Reload):**
  ```bash
  npm run dev
  ```
* **Production Build:**
  ```bash
  npm run build
  npm start
  ```
* **Linting & Code Checks:**
  ```bash
  npm run lint
  npm run typecheck
  ```

---

## APIs & Features

### Core Modules
* **Health Check:** `/api/health` - Check service status and database connectivity.

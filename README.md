# Excalidraw

A collaborative drawing app built with Next.js, NextAuth, Drizzle ORM, and PostgreSQL.

## Prerequisites

- Node.js 20+
- PostgreSQL (local or remote)
- A Google OAuth app (for Google sign-in)

## Setup

### 1. Install dependencies

```bash
yarn
```

### 2. Configure environment variables

Copy the example below into a `.env.local` file at the project root:

```env
# PostgreSQL connection string
# Local example: postgresql://postgres:password@localhost:5432/excalidraw
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>

# NextAuth secret — generate one with: openssl rand -base64 32
AUTH_SECRET=your_random_secret_here

# Google OAuth credentials
# Create an OAuth 2.0 Client ID at https://console.cloud.google.com/apis/credentials
# Authorized redirect URI: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Run database migrations

```bash
yarn db:migrate
```

### 4. Start the development server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database scripts

| Command | Description |
|---|---|
| `yarn db:generate` | Generate migration files from schema changes |
| `yarn db:migrate` | Apply pending migrations to the database |
| `yarn db:push` | Push schema directly (no migration files, for prototyping) |

## Docker

To run the app with Docker:

```bash
# Make sure .env.local is filled in first
docker compose up --build
```

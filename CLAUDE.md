# MoneyTor

Personal finance management application with bank account integration.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **UI:** React 19, Tailwind CSS 4, Recharts
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js (credentials)
- **Bank Integration:** Plaid (Link + Accounts + Transactions APIs)
- **Validation:** Zod

## Project Structure

```
MoneyTor/
├── prisma/
│   └── schema.prisma           # Database schema
├── moneytor/                   # Main Next.js application
│   ├── app/
│   │   ├── (auth)/             # Auth pages (login, register)
│   │   ├── (dashboard)/        # Protected app pages
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── accounts/       # Account management
│   │   │   ├── transactions/   # Transaction management
│   │   │   ├── categories/     # Category management
│   │   │   ├── budgets/        # Budget management
│   │   │   └── settings/       # User settings
│   │   ├── api/
│   │   │   ├── auth/           # NextAuth endpoints
│   │   │   ├── accounts/       # Account CRUD
│   │   │   ├── categories/     # Category CRUD
│   │   │   ├── transactions/   # Transaction CRUD
│   │   │   ├── budgets/        # Budget CRUD
│   │   │   └── dashboard/      # Dashboard data
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Root redirect
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── layout/             # Layout components (sidebar)
│   │   └── providers/          # Context providers
│   ├── lib/
│   │   ├── db.ts               # Prisma client
│   │   ├── auth.ts             # NextAuth config
│   │   ├── session.ts          # Session helpers
│   │   ├── utils.ts            # Utility functions
│   │   └── validations.ts      # Zod schemas
│   └── types/
│       └── next-auth.d.ts      # NextAuth type extensions
└── CLAUDE.md
```

## Commands

```bash
# Development
cd moneytor && npm run dev        # Start dev server (port 3000)

# Database
cd moneytor && npm run db:migrate # Run migrations
cd moneytor && npm run db:generate # Generate Prisma client
cd moneytor && npm run db:studio  # Open Prisma Studio
cd moneytor && npm run db:push    # Push schema changes

# Build & Lint
cd moneytor && npm run build      # Production build
cd moneytor && npm run lint       # ESLint check
```

## Environment Variables

Copy `moneytor/.env.example` to `moneytor/.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/moneytor
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox
```

## API Routes

### Auth
- `POST /api/auth/register` - Create new user (seeds default categories)
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Accounts
- `GET /api/accounts` - List user accounts with calculated balances
- `POST /api/accounts` - Create account
- `GET /api/accounts/[id]` - Get account
- `PUT /api/accounts/[id]` - Update account
- `DELETE /api/accounts/[id]` - Delete account

### Categories
- `GET /api/categories?type=income|expense` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete (fails if has transactions)

### Transactions
- `GET /api/transactions?from=&to=&type=&accountId=&categoryId=` - List transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/[id]` - Update transaction
- `DELETE /api/transactions/[id]` - Delete transaction

### Budgets
- `GET /api/budgets?period=YYYY-MM` - List budgets with spent amounts
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/[id]` - Update budget
- `DELETE /api/budgets/[id]` - Delete budget

### Dashboard
- `GET /api/dashboard?period=YYYY-MM` - Get dashboard data

## Data Model

### Core Entities
- **User** - Email/password auth with NextAuth
- **Account** - Manual or Plaid-linked accounts
- **Category** - Income/expense categories (19 defaults seeded)
- **Transaction** - Income, expense, or transfer
- **Budget** - Monthly spending limits per category
- **Institution** - Banks (for Plaid)
- **UserConnection** - Plaid access tokens

### Account Types
- Assets: `checking`, `savings`, `investment`, `manual_cash`
- Liabilities: `credit_card`, `loan`, `mortgage`

### Balance Calculation
```typescript
calculatedBalance = startingBalance + sum(income) - sum(expense)
netWorth = sum(assets) - sum(liabilities)
```

## UI Components

### Shared (`components/ui/`)
- `Button` - Primary, secondary, outline, ghost, danger variants
- `Input` - Text input with label and error states
- `Select` - Dropdown select with options
- `Card` - Card container with header/content
- `Modal` - Dialog overlay
- `Badge` - Status badges
- `EmptyState` - Empty list placeholders

### Layout (`components/layout/`)
- `Sidebar` - Navigation with mobile responsive drawer

## Coding Conventions

- **Imports:** Use `@/*` path alias for project root
- **Components:** Client components use `"use client"` directive
- **API Routes:** Use Zod validation, return proper status codes
- **Styling:** Tailwind utility classes, dark mode via `dark:` prefix
- **Decimals:** Use `Decimal(19,4)` for monetary values

## Development Status

### Phase 1 - Manual Core (Complete)
- [x] User authentication (register/login)
- [x] Account management (CRUD)
- [x] Category management (CRUD with defaults)
- [x] Transaction management (CRUD with filters)
- [x] Budget management (CRUD with progress tracking)
- [x] Dashboard with metrics and charts

### Phase 2 - Plaid Integration (Pending)
- [ ] Plaid Link token endpoint
- [ ] Token exchange and storage
- [ ] Account sync from Plaid
- [ ] Transaction sync with category mapping

### Phase 3 - Enhancements (Pending)
- [ ] Recurring transactions
- [ ] CSV export
- [ ] Account balance snapshots
- [ ] Net worth history chart

# MoneyTor

MoneyTor is a modern, personal finance tracker designed to give you complete control over your financial life. It combines the flexibility of manual tracking with the convenience of automated bank synchronization via Plaid.

## Features

- **📊 Real-time Dashboard**: Get an instant overview of your Income, Expenses, Net Flow, and Net Worth.
- **🏦 Bank Integration**: Securely connect your bank accounts using **Plaid** to automatically import balances and transactions.
- **📝 Manual Tracking**: Manually add cash accounts and transactions for complete coverage.
- **💰 Budgeting**: Set monthly budgets for specific categories and track your spending progress visually.
- **🏷️ Categorization**: Organize your transactions with custom categories.
- **🔒 Secure**: Built with **Supabase Auth** and **Row Level Security (RLS)** to ensure your data is private and secure.

## Usage

### Prerequisites

- Node.js 18+
- A Supabase Project
- A Plaid Developer Account

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/moneytor.git
    cd moneytor
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory and add your credentials:

    ```env
    NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

    PLAID_CLIENT_ID="your_plaid_client_id"
    PLAID_SECRET="your_plaid_secret"
    PLAID_ENV="sandbox" # Change to 'development' or 'production' for real data
    ```

4.  **Database Setup:**
    Run the provided `supabase_schema.sql` script in your Supabase SQL Editor to create the necessary tables and security policies.

5.  **Run the App:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to start tracking!

## Important Notices

- **Plaid Sandbox**: By default, the app is configured for Plaid's **Sandbox** environment. Use the username `user_good` and password `pass_good` to test bank connections.
- **Data Privacy**: All data is stored in your own Supabase project. Row Level Security (RLS) policies are enforced so users can only access their own data.

## FAQs

### Q: Why am I getting a "Could not authenticate user" error?

**A:** This usually happens if the email confirmation link has expired or is invalid. Try logging in again to receive a new link, and click it immediately.

### Q: Why isn't my bank data syncing?

**A:**

1.  Check your console logs for errors.
2.  Ensure your `PLAID_CLIENT_ID` and `PLAID_SECRET` are correct in `.env.local`.
3.  Verify that you are using the correct `PLAID_ENV` (Sandbox vs. Development).

### Q: Can I use this with real bank accounts?

**A:** Yes! To use real data, you need to:

1.  Get access to Plaid's **Development** or **Production** environment.
2.  Update `PLAID_ENV` in your `.env.local` file.
3.  Update your `PLAID_SECRET` to the corresponding environment secret.

### Q: I see the Next.js welcome page instead of my Dashboard.

**A:** If `app/page.tsx` exists, it overrides the dashboard layout at the root URL (`/`). Delete `app/page.tsx` if you want the Dashboard to be your home page.

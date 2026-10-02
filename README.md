# Expense Tracker

A personal finance and expense tracking web app built with **React + Vite + Tailwind CSS**, using **Firebase Authentication** and **Cloud Firestore** as the only backend. There is no custom server. The app deploys to **Vercel** as a static single-page application.

Each signed-in user has a private workspace for expenses, income, budgets and categories. Data syncs across devices in real time, and **Firestore Security Rules** keep every user's data isolated.

---

## Contents

1. [Features](#1-features)
2. [Technology stack](#2-technology-stack)
3. [Folder structure](#3-folder-structure)
4. [Firebase project setup](#4-firebase-project-setup)
5. [Authentication setup](#5-authentication-setup)
6. [Firestore setup and data model](#6-firestore-setup-and-data-model)
7. [Firestore security rules](#7-firestore-security-rules)
8. [Firestore indexes](#8-firestore-indexes)
9. [Environment variables](#9-environment-variables)
10. [Local development](#10-local-development)
11. [Production build](#11-production-build)
12. [Vercel deployment](#12-vercel-deployment)
13. [Troubleshooting](#13-troubleshooting)
14. [Security notes](#14-security-notes)
15. [Design decisions and limitations](#15-design-decisions-and-limitations)

---

## 1. Features

**Accounts**
- Google sign-in and email/password sign-up and login, with sessions kept across reloads
- Password reset by email
- Protected routes: signed-out users are redirected to `/login`, and back to the page they wanted after signing in
- First-login onboarding: choose a currency and an optional monthly budget (both skippable). Default categories are seeded exactly once.

**Transactions**
- Add, edit and delete expenses and income: amount, category, payment method, date and description
- Deleting always asks for confirmation ("This action cannot be undone.")
- Transactions page:
  - case-insensitive search across description, category and payment method
  - filters for type, category, payment method and date (today, this week, this month, last month, custom range and more)
  - sorting by date or amount
  - results grouped by day, with "load more" pagination
- Filters are stored in the URL, so a filtered view survives a refresh and can be bookmarked

**Dashboard**
- Total balance (with change this month), total income, total expenses, monthly expenses (vs last month) and monthly savings
- Monthly expenses (last 6 months), income vs expenses, and spending by category (donut)
- In-app budget alerts, the monthly budget at a glance, and the 8 most recent transactions

**Budgets**
- One overall monthly budget plus any number of category budgets. A category budget can group several categories, such as Rent, Electricity and Internet as "Bills".
- Budget, spent, remaining and a progress meter, with a month switcher for past months
- In-app alerts at **80%**, **90%** and **100%**, for example "You have used 90% of your Food budget." or "Food budget exceeded by ₹850."

**Lend & Borrow**
- Track money between you and other people, like a khata book:
  - **You gave:** you lent money, paid for them, or repaid them
  - **You got:** they lent you money, paid for something of yours (such as a bill), or repaid you
- Each person has a running balance shown as "Owes you ₹X", "You owe ₹X" or "Settled up". Partial repayments are just more entries, and **Settle up** clears a balance in one tap.
- Overview with totals ("You will get", "You will give", net), search, and filters (Owe you / You owe / Settled). Each person has a page listing their entries with the balance after each one.
- When someone pays a bill for you, you can also record it as an expense in the same step, so your spending stays accurate.
- Lend & Borrow is kept separate from income, expenses and the balance, because lending money isn't spending it. A summary card appears on the dashboard while anything is outstanding.

**Analytics**
- Period selector: this month, last month, last 3, 6 or 12 months, this year, or a custom range
- Summary cards: total income, total expense, savings, average daily expense, largest expense and most used category
- Charts: spending by category, top spending categories, monthly (or daily) expenses, income vs expenses, and payment method breakdown
- Every chart has a **Table** view with the same numbers

**Settings and data**
- Profile (name, email, photo from Google), currency (INR, USD, EUR or GBP) and theme (light, dark or system), synced across devices
- Create, rename, re-icon and delete categories
- Export transactions to **CSV**, export a full **JSON backup** (including Lend & Borrow), and **import** a backup (validated and sanitised, with a confirmation step)

**Experience**
- Responsive layouts:
  - desktop: sidebar
  - phones and tablets: bottom navigation with a central **Add** button, cards instead of tables, and full-screen forms
- Dark mode, including the charts
- Skeleton loaders, empty states, toast notifications, an offline banner and friendly error messages
- Accessibility: keyboard-navigable dialogs with focus trapping, labelled controls, visible focus rings, and important actions that always carry text labels

---

## 2. Technology stack

| Area | Choice |
| --- | --- |
| UI | React 19, React Router 7 |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 (class-based dark mode, semantic colour tokens in `src/index.css`) |
| Backend | Firebase Authentication, Cloud Firestore (modular Web SDK v12) |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Dates | date-fns 4 |
| Hosting | Vercel (static SPA) |

The project uses JavaScript (JSX). ESLint is configured with the React Hooks and React Refresh rules.

---

## 3. Folder structure

```text
.
├── docs/FIREBASE_SETUP.md      Step-by-step Firebase console setup
├── firebase.json               Firebase CLI config (rules + indexes deploy)
├── firestore.rules             Security rules — the real security boundary
├── firestore.indexes.json      Composite indexes used by the app's queries
├── vercel.json                 SPA rewrites + security/caching headers
├── .env.example                Environment variable template
└── src/
    ├── App.jsx                 Providers + routes (pages are lazy-loaded)
    ├── main.jsx
    ├── index.css               Tailwind + light/dark design tokens
    ├── firebase/
    │   ├── config.js           Centralised Firebase initialisation (env-driven)
    │   ├── appCheck.js         Optional App Check (reCAPTCHA Enterprise / v3)
    │   ├── auth.js             Sign-in, sign-up, reset, sign-out helpers
    │   └── firestore.js        /users/{uid} path helpers (uid from the signed-in user)
    ├── services/               All Firestore reads/writes (no Firestore code in components)
    │   ├── transactionService.js
    │   ├── categoryService.js
    │   ├── budgetService.js
    │   ├── userService.js      Settings, profile, onboarding
    │   ├── ledgerService.js    Lend & Borrow people and entries
    │   └── backupService.js    CSV/JSON export, backup import
    ├── context/                Auth, theme, toasts, per-user data, transaction dialog
    ├── hooks/                  useAuth, useTransactions, useBudgets, useCategories, ...
    ├── layouts/                AuthLayout, DashboardLayout
    ├── pages/                  Dashboard, Transactions, Budgets, LendBorrow, PersonLedger,
    │   │                       Analytics, Settings, Onboarding, NotFound, SetupRequired
    │   └── auth/               Login, Register, ForgotPassword
    ├── components/
    │   ├── common/             Button, Input, Select, DatePicker, Modal, ConfirmDialog,
    │   │                       Card, StatCard, Toast, Skeleton, EmptyState, ...
    │   ├── transactions/       TransactionForm, TransactionModal, TransactionCard,
    │   │                       TransactionTable, TransactionList, TransactionFilters
    │   ├── budgets/            BudgetProgress, BudgetAlerts, BudgetCard, BudgetFormModal
    │   ├── charts/             ChartCard, ExpenseBarChart, IncomeExpenseChart,
    │   │                       CategoryBreakdown, RankedBarList
    │   ├── ledger/             LedgerEntryModal, PersonFormModal, BalanceLabel
    │   ├── dashboard/          RecentTransactions, MonthlyBudgetCard, LedgerSummaryCard
    │   ├── settings/           Profile, preferences, category manager, data section
    │   ├── layout/             Sidebar, MobileNav
    │   ├── routing/            ProtectedRoute, PublicOnlyRoute, SetupGate
    │   └── auth/               Google button, password input, form alerts
    └── utils/
        ├── calculations.js     All financial maths (totals, budgets, analytics)
        ├── ledger.js           Lend & Borrow balances, totals, running balance
        ├── currency.js         Intl.NumberFormat currency formatting (en-IN for INR)
        ├── dates.js            date-fns helpers, presets, timezone-safe date keys
        ├── validation.js       Input validation/sanitising (forms, services, import)
        ├── export.js           CSV, JSON backup, backup parsing + import planning
        ├── transactions.js     Search, sort, group-by-day
        ├── errors.js           Friendly error messages
        └── constants.js        Payment methods, default categories, limits
```

---

## 4. Firebase project setup

Follow **[docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)** for the detailed console steps. In short:

1. Create a Firebase project and register a **Web app**.
2. Enable **Authentication** with the **Google** and **Email/Password** providers.
3. Create a **Cloud Firestore** database in production mode.
4. Deploy `firestore.rules` and `firestore.indexes.json`.
5. Optionally configure **App Check**.
6. Copy the web config into `.env` (locally) and into Vercel's environment variables.

---

## 5. Authentication setup

- **Providers:** Firebase Console → *Authentication* → *Sign-in method* → enable **Email/Password** and **Google**. Google requires a project support email.
- **Authorized domains:** go to *Authentication* → *Settings* → *Authorized domains*. `localhost` is included by default. Add your Vercel domain (e.g. `your-app.vercel.app`) and any custom domain. Google sign-in fails with `auth/unauthorized-domain` on domains that aren't listed.
- **Sessions:** the app uses Firebase's default `browserLocalPersistence`, so users stay signed in until they log out.
- **Passwords:** these are handled entirely by Firebase Auth and never stored by the app. Sign-up requires at least 8 characters, including a letter and a number.
- **Password reset:** Firebase sends the reset email. You can customise the template under *Authentication* → *Templates*.

---

## 6. Firestore setup and data model

Create the database in **production mode** (deny-all), then deploy the rules in this repo.

```text
users/{uid}/
  profile/data            { displayName, email, photoURL, createdAt, updatedAt }
  settings/data           { currency, theme, onboardingCompleted, createdAt, updatedAt }
  transactions/{id}       { type, amount, categoryId, categoryName, paymentMethod,
                            description, date, createdAt, updatedAt }
  categories/{id}         { name, type, icon, isDefault, createdAt, updatedAt }
  budgets/{id}            { name, scope, categoryIds, amount, createdAt, updatedAt }
  people/{id}             { name, createdAt, updatedAt }                      Lend & Borrow
  ledger/{id}             { personId, personName, direction, amount, note,    Lend & Borrow
                            date, createdAt, updatedAt }
```

| Field | Notes |
| --- | --- |
| `type` | `"expense"` or `"income"` |
| `amount` | A positive **number** (e.g. `5000`), never a formatted string. It is formatted only in the UI. |
| `date` | The calendar day as `"yyyy-MM-dd"` (see [design decisions](#15-design-decisions-and-limitations)) |
| `createdAt` / `updatedAt` | Firestore **server timestamps** (`serverTimestamp()`), verified by the rules |
| `paymentMethod` | `cash`, `upi`, `credit_card`, `debit_card`, `bank_transfer`, `net_banking` or `other` |
| `categoryName` | Copy of the category name, used as a fallback if the category is later deleted |
| Budget `scope` | `"overall"` (always stored at id `overall`) or `"category"` (1–30 `categoryIds`) |
| Ledger `direction` | `"gave"` (they owe you more) or `"got"` (you owe them more). A person's balance is the sum of what you gave minus the sum of what you got. |

**First login:** when `settings/data` doesn't exist, the onboarding screen appears. Completing or skipping it writes the following in **one Firestore transaction**, which first re-checks that settings don't exist yet:
- settings
- profile
- the 20 default categories, using fixed ids such as `default-food`
- the overall budget, if one was entered

Because of that check and the fixed ids, seeding can never run twice or create duplicate categories.

---

## 7. Firestore security rules

The rules in [`firestore.rules`](firestore.rules) enforce:

- **Authentication and ownership:** every path is `/users/{userId}/...` and requires `request.auth != null && request.auth.uid == userId`. A user can never read, create, modify or delete another user's profile, settings, transactions, categories, budgets, or Lend & Borrow people and entries.
- **Default deny:** anything not explicitly matched is rejected, including the `/users/{uid}` document itself and unknown subcollections.
- **Schema validation on every write:**
  - required fields, and no extra fields (`hasAll` + `hasOnly`)
  - types and enum values (transaction type, payment method, currency, theme, budget scope)
  - `amount` is a number with `0 < amount ≤ 1,000,000,000`, which also rejects NaN and Infinity
  - `date` must match `YYYY-MM-DD`, and string lengths are capped
- **Server timestamps:**
  - `createdAt` and `updatedAt` must equal `request.time` on create
  - `updatedAt` must equal `request.time` on update, and `createdAt` can't be backdated
- **Invariants:** a category's type can't change after creation. There is exactly one overall budget, at id `overall`. The single `settings`/`profile` documents can't be deleted.

**Deploy with the Firebase CLI:**

```bash
npm install -g firebase-tools
firebase login
firebase use --add            # pick your project
firebase deploy --only firestore:rules
```

You can also paste the file's contents into *Firestore Database* → *Rules* → *Publish*.

> Frontend validation is a convenience for users. The rules are the security boundary and are written assuming a malicious client.

---

## 8. Firestore indexes

Single-field indexes are automatic. The composite indexes below are defined in [`firestore.indexes.json`](firestore.indexes.json). All are on the `transactions` collection with **Collection** scope.

| # | Fields | Used by |
| --- | --- | --- |
| 1 | `type` ↑, `date` ↓ | Transactions page: type filter |
| 2 | `categoryId` ↑, `date` ↓ | Transactions page: category filter |
| 3 | `paymentMethod` ↑, `date` ↓ | Transactions page: payment-method filter |
| 4 | `type` ↑, `paymentMethod` ↑, `date` ↓ | Type + payment method |
| 5 | `categoryId` ↑, `paymentMethod` ↑, `date` ↓ | Category + payment method |
| 6 | `type` ↑, `amount` ↑ | All-time income/expense `sum()` aggregation (dashboard balance) |

Deploy them with:

```bash
firebase deploy --only firestore:indexes
```

Indexes take a few minutes to build. If a query runs before its index exists, the app shows "A required database index is missing…". In development, the browser console also logs Firebase's one-click link to create the missing index.

---

## 9. Environment variables

Copy `.env.example` to `.env` and fill in the values. `.env` is git-ignored and must never be committed.

| Variable | Where to find it |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Firebase Console → ⚙ *Project settings* → *General* → *Your apps* → your Web app → *SDK setup and configuration* → **Config** → `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | same → `authDomain` (e.g. `your-project.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | same → `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | same → `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | same → `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | same → `appId` |
| `VITE_FIREBASE_APPCHECK_SITE_KEY` | *Optional.* reCAPTCHA Enterprise (or v3) site key for App Check. Leave empty to disable App Check. |
| `VITE_FIREBASE_APPCHECK_PROVIDER` | *Optional.* `recaptcha-enterprise` (default) or `recaptcha-v3` |
| `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN` | *Optional, development only.* A debug token registered in App Check |

Notes:
- Vite inlines `VITE_*` variables **at build time**. After changing them on Vercel, **redeploy**.
- These values identify your Firebase project and are visible in any web app's bundle. They are **not secrets**. Your data is protected by Authentication and the security rules.
- If a required variable is missing, the app shows a "Firebase isn't configured yet" screen listing what's missing, instead of crashing.

---

## 10. Local development

Requirements: **Node.js 20.19+ or 22.12+** (needed by Vite 8) and npm.

```bash
npm install
cp .env.example .env      # then fill in your Firebase values
npm run dev               # http://localhost:5173
npm run lint
```

App Check is off locally unless you set `VITE_FIREBASE_APPCHECK_SITE_KEY`, so local development needs no extra setup. If you turn on App Check **enforcement** later, see [App Check in development](docs/FIREBASE_SETUP.md#9-configure-app-check-optional-recommended-for-production).

---

## 11. Production build

```bash
npm run build      # outputs to dist/
npm run preview    # serves the production build locally
```

Pages are code-split by route. Firebase, React and the charting library are emitted as separate long-cacheable vendor chunks, and the charts load only with the pages that use them.

---

## 12. Vercel deployment

1. Push the repository to GitHub, GitLab or Bitbucket.
2. In Vercel: **Add New… → Project → Import** the repository. The framework preset is detected as **Vite**:
   - build command: `npm run build`
   - output directory: `dist`
3. Under **Settings → Environment Variables**, add every `VITE_FIREBASE_*` variable from [section 9](#9-environment-variables) for **Production**, and for **Preview** if you use preview deployments.
4. Click **Deploy**.
5. In Firebase Console → *Authentication* → *Settings* → *Authorized domains*, add the Vercel domain (e.g. `your-app.vercel.app`) and any custom domain.
6. Make sure the Firestore rules and indexes are deployed ([sections 7](#7-firestore-security-rules) and [8](#8-firestore-indexes)).

`vercel.json` is required. It does two things:
- It rewrites every non-file request to `index.html`, so client-side routes such as `/dashboard`, `/transactions`, `/budgets`, `/analytics` and `/settings` don't return 404 on refresh or direct visits.
- It sets security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy: same-origin-allow-popups` (Google popup sign-in needs this). It also sets immutable caching for hashed assets.

> Preview deployments get unique URLs. Google sign-in only works on domains listed in Firebase's *Authorized domains*, so use email/password on previews or add the preview domain there.

---

## 13. Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Firebase isn't configured yet" screen | A `VITE_FIREBASE_*` variable is missing. Locally, restart `npm run dev` after editing `.env`. On Vercel, add the variables and **redeploy**. |
| `auth/unauthorized-domain` / "This domain is not authorised for sign-in" | Add the domain under *Authentication → Settings → Authorized domains*. |
| "This sign-in method is not enabled" | Enable Google and/or Email/Password under *Authentication → Sign-in method*. |
| Google popup closes immediately or is blocked | Allow popups for the site. Don't remove the `Cross-Origin-Opener-Policy: same-origin-allow-popups` header. |
| "We couldn't load your account" / permission errors right after sign-in | The Firestore rules aren't deployed, or the database is still in its default locked mode. Deploy `firestore.rules`. |
| "A required database index is missing or still building" | Run `firebase deploy --only firestore:indexes` and wait for the indexes to finish building (*Firestore → Indexes*). |
| Total balance shows "—" | The all-time `sum()` aggregation failed. Check that index #6 and the rules are deployed. |
| 404 when refreshing `/dashboard` on Vercel | Make sure `vercel.json` is in the repository root and redeploy. |
| App Check errors (403, "App attestation failed") after enabling enforcement | Check the site key and its allowed domains. Locally, register a debug token (see the setup guide). |
| "You're offline" banner, or saves blocked | The device has no connection. The app blocks writes while offline so nothing is silently lost. |
| Reset email never arrives | Check spam. For privacy, the app always shows the same confirmation message, whether or not an account exists. |

---

## 14. Security notes

- **Firestore Security Rules are the security boundary.** Data is isolated per Firebase Auth UID, every write is schema-validated, and the frontend is never trusted for authorisation.
- **Ownership comes from the session.** Services always read the uid from `auth.currentUser`, never from user input or URLs.
- **No Admin SDK and no service accounts** in the frontend. `.gitignore` excludes `.env*` (except `.env.example`) and common service-account key filenames.
- **Passwords** are only ever handled by Firebase Authentication.
- **Input is validated twice:** in the UI and services ([`src/utils/validation.js`](src/utils/validation.js)), and again by the rules.
- **Backup imports are allow-list sanitised.** Only known fields are copied, every record is re-validated and invalid records are dropped. Imports are size-capped at 10 MB and 50,000 transactions, and confirmed before anything is written.
- **CSV exports neutralise spreadsheet formula injection** by prefixing cells that start with `=`, `+`, `-` or `@`.
- **Exports never leave the device.** Files are generated in the browser, and no third-party services are used.
- **Errors are shown as friendly messages.** Stack traces never reach the UI, and raw errors are only logged to the console in development.
- **Firestore uses the in-memory cache**, not IndexedDB persistence, so no financial data is left on shared computers after sign-out.
- **Optional hardening:**
  - enable **App Check** enforcement
  - restrict the Firebase API key to your domains (Google Cloud Console → *APIs & Services → Credentials → Browser key → HTTP referrers*)
  - add a Content-Security-Policy header in `vercel.json` once your exact Firebase, reCAPTCHA and Google sign-in origins are known

---

## 15. Design decisions and limitations

**Timezone-safe dates.** A transaction's date is a calendar day, not an instant. It is stored as `"yyyy-MM-dd"`, which:
- sorts correctly
- supports range queries
- never shifts by a day when viewed from another timezone. A midnight timestamp written in IST would show as the previous day in the US.

The audit fields `createdAt` and `updatedAt` are Firestore server timestamps.

**Query efficiency.** The full transaction history is never downloaded except for an explicit export.

| Data | How it is read | Live? |
| --- | --- | --- |
| Settings, categories, budgets, Lend & Borrow people and entries | Small collections, one listener each for the session | Yes. Changes from other devices appear instantly. |
| Last 6 months of transactions | One date-bounded listener for the session. Powers the dashboard, budgets and recent analytics without re-reading on navigation. | Yes. Writes appear immediately. |
| All-time totals (balance) | Two server-side `sum()`/`count()` aggregation queries, re-run after writes | No |
| Transactions page | Server-side filters + date range, ordered by date, 50 per page with "Load more" | Yes, for the loaded pages |
| Older analytics or budget months | One-shot date-range read, refreshed after writes | No |
| Export | Paged reads of the full history, only on demand | No |

**Categories.** Transactions reference categories by id, so renaming a category updates every view. `categoryName` is kept on each transaction as a fallback for deleted categories.

**Budgets** are recurring monthly limits: they apply to every month until changed, and the month switcher shows any past month against them.

**Limitations**
- **Search** is client-side over the loaded transactions, because Firestore has no full-text search. When more pages exist, the page says so and offers "Load more". Type, category, method and date filters always run on the server.
- **Currency** is a display setting. Changing it doesn't convert existing amounts.
- **Profile photos** come from the Google account. There is no upload (Firebase Storage isn't used).
- **Offline:** the app reads from memory while connected and blocks writes while offline, rather than queueing them.

# Firebase setup

This guide takes a new Firebase project to a working Expense Tracker deployment. It takes about 15 minutes. You need a Google account and, for steps 7 and 8, Node.js.

```text
Create Firebase project
  → Register web app
  → Enable Authentication
  → Enable Google sign-in
  → Enable Email/Password
  → Create Firestore database
  → Add security rules
  → Configure indexes
  → Configure App Check (optional)
  → Copy Firebase configuration
  → Add environment variables
```

---

## 1. Create a Firebase project

1. Go to <https://console.firebase.google.com> and click **Create a project**. In some console versions this is **Add project**.
2. Enter a project name, such as `expense-tracker`.
3. Google Analytics is optional and isn't used by the app. You can disable it.
4. Click **Create project** and wait for it to finish.

The free **Spark** plan is enough for personal use. The app uses Authentication and Cloud Firestore only.

## 2. Register a web app

1. On the project overview page, click the **Web** icon (`</>`). You can also go to ⚙ **Project settings → General → Your apps → Add app → Web**.
2. Enter an app nickname, such as `expense-tracker-web`.
3. Leave **Firebase Hosting** unchecked, because the app is hosted on Vercel.
4. Click **Register app**. The configuration object shown next is what you'll need in [step 10](#10-copy-the-firebase-configuration). You can come back to it at any time.

## 3. Enable Authentication

1. In the left menu, open **Build → Authentication**.
2. Click **Get started**.

## 4. Enable Google sign-in

1. Go to **Authentication → Sign-in method → Add new provider → Google**.
2. Toggle **Enable**.
3. Choose a **Project support email**.
4. Click **Save**.

## 5. Enable Email/Password

1. Go to **Authentication → Sign-in method → Add new provider → Email/Password**.
2. Enable **Email/Password**. Leave **Email link (passwordless sign-in)** off, because the app doesn't use it.
3. Click **Save**.

**Authorized domains:** go to **Authentication → Settings → Authorized domains**.
- `localhost` is listed by default.
- After deploying to Vercel, add your production domain (e.g. `your-app.vercel.app`) and any custom domain.
- Google sign-in is rejected on domains that aren't listed.

**Optional:**
- Customise the password-reset email under **Authentication → Templates → Password reset**.
- Leave **Settings → User actions → Email enumeration protection** enabled. It is the default and improves privacy.

## 6. Create the Firestore database

1. Open **Build → Firestore Database** and click **Create database**.
2. Choose a **location** close to your users, for example `asia-south1` (Mumbai) for users in India. This can't be changed later.
3. Choose **Start in production mode**. This denies all access until you publish the rules in the next step.
4. Click **Create**.

## 7. Add the security rules

The rules in [`firestore.rules`](../firestore.rules) make sure every user can only access `/users/{their-uid}/...`, and they validate every write. Choose one of these options.

**Option A: Firebase CLI (recommended)**

Run these commands from the repository root:

```bash
npm install -g firebase-tools
firebase login
firebase use --add                 # select your project, alias e.g. "default"
firebase deploy --only firestore:rules
```

**Option B: Firebase Console**

1. Open **Firestore Database → Rules**.
2. Replace the contents with the contents of `firestore.rules`.
3. Click **Publish**.

To check the rules, open **Rules → Rules Playground**:
- Simulate a `get` on `/users/abc/transactions/x` while authenticated as uid `abc`. It should be **allowed**.
- Simulate the same request as uid `xyz`. It should be **denied**.
- Simulate the same request unauthenticated. It should be **denied**.

## 8. Configure indexes

The Transactions page combines filters with date ordering, and the dashboard balance uses a `sum()` aggregation. These queries need the composite indexes in [`firestore.indexes.json`](../firestore.indexes.json).

**Option A: CLI (recommended)**

```bash
firebase deploy --only firestore:indexes
```

**Option B: Console**

Open **Firestore Database → Indexes → Composite → Create index**. Create each of the following with collection ID `transactions` and query scope **Collection**:

| Fields (in order) |
| --- |
| `type` Ascending, `date` Descending |
| `categoryId` Ascending, `date` Descending |
| `paymentMethod` Ascending, `date` Descending |
| `type` Ascending, `paymentMethod` Ascending, `date` Descending |
| `categoryId` Ascending, `paymentMethod` Ascending, `date` Descending |
| `type` Ascending, `amount` Ascending |

Index builds take a few minutes. Their status appears on the **Indexes** tab. If you skip an index, the related screen shows "A required database index is missing…". In development, the browser console also prints Firebase's direct link to create it.

## 9. Configure App Check (optional, recommended for production)

App Check makes Firebase reject requests that don't come from your real app, which helps against scripted abuse of your project. The app only enables App Check when `VITE_FIREBASE_APPCHECK_SITE_KEY` is set, so local development works without it.

### 9.1 Create a reCAPTCHA Enterprise key

1. In the Google Cloud Console for the same project, open **Security → reCAPTCHA Enterprise**. Enable the API if prompted.
2. Click **Create key**:
   - platform: **Website**
   - domains: add your production domain(s), e.g. `your-app.vercel.app`
   - leave "Use checkbox challenge" **unchecked**, because App Check uses score-based keys
3. Copy the **key ID**. This is your site key.

reCAPTCHA v3 also works. Create a v3 key at <https://www.google.com/recaptcha/admin>, and set `VITE_FIREBASE_APPCHECK_PROVIDER=recaptcha-v3`.

### 9.2 Register the app with App Check

1. In Firebase Console, open **Build → App Check → Apps**.
2. Select your web app.
3. Choose **reCAPTCHA Enterprise** (or reCAPTCHA v3), paste the site key, and click **Save**.

### 9.3 Add the site key to the app

- Locally, set `VITE_FIREBASE_APPCHECK_SITE_KEY=<your key>` in `.env`.
- On Vercel, add the same variable in the project's environment variables and redeploy.

### 9.4 Development and debug tokens

`localhost` can't pass reCAPTCHA attestation. When the site key is set, the app runs in **debug mode** during `npm run dev`:

1. Run `npm run dev` and open the browser console. The SDK prints `App Check debug token: <uuid>`.
2. In **App Check → Apps**, open your web app's ⋮ menu and choose **Manage debug tokens → Add debug token**. Paste the token.
3. To reuse the same token across sessions, put it in `.env` as `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN`.

Debug mode is never enabled in production builds. Treat debug tokens like passwords and never commit them.

### 9.5 Turn on enforcement

1. Deploy with the site key.
2. Use the app for a while, then check **App Check → APIs** to confirm that almost all requests are **verified**.
3. Click **Enforce** for **Cloud Firestore**, and for **Authentication** if it is offered for your project.

Until enforcement is on, App Check only reports and never blocks. If you enforce it before the deployed app sends tokens, every request will fail.

## 10. Copy the Firebase configuration

1. Open ⚙ **Project settings → General → Your apps**.
2. Select the web app.
3. Under **SDK setup and configuration**, choose **Config**. You'll see:

```js
const firebaseConfig = {
  apiKey: "…",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "…",
  appId: "1:…:web:…",
};
```

## 11. Add the environment variables

**Locally:** copy `.env.example` to `.env` and map each value:

```text
VITE_FIREBASE_API_KEY=            ← apiKey
VITE_FIREBASE_AUTH_DOMAIN=        ← authDomain
VITE_FIREBASE_PROJECT_ID=         ← projectId
VITE_FIREBASE_STORAGE_BUCKET=     ← storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=← messagingSenderId
VITE_FIREBASE_APP_ID=             ← appId
```

Then run `npm install` and `npm run dev`, and open <http://localhost:5173>.

**On Vercel:**
1. Go to **Project → Settings → Environment Variables**.
2. Add the same six variables, plus the optional App Check ones, for **Production** (and **Preview** if you use previews).
3. Redeploy. Vite reads these variables at build time.

`.env` is git-ignored. These web config values aren't secrets, but keep `.env` out of Git anyway so each environment stays configurable. Never add a **service account** key to this project: the frontend doesn't need one and must not have one.

## 12. Smoke test

1. Register with email and password. The welcome screen should appear.
2. Choose a currency, enter a monthly budget, and click **Get started**.
3. Add an expense and an income. They should appear on the dashboard immediately.
4. Edit the expense, then delete it. You should be asked to confirm.
5. Sign out, then sign in with Google using a different account. That account should see none of the first account's data.
6. Refresh `/transactions` on the deployed site. It should load, not show a 404.

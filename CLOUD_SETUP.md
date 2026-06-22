# OJ Sippin — Cloud Setup Guide (Vercel + Neon)

This is the cloud version of the OJ Sippin Business Platform. It runs on the internet — you and your coworker can both log in from any browser, anywhere.

**Stack:** Next.js → Vercel (hosting) + Neon (PostgreSQL database)
**Your local version** is still at `~/ojsippin` and `~/Desktop/OJ Sippin Business Platform/` — untouched.

---

## Step 1 — Create a free Neon database

1. Go to **https://neon.tech** and sign up (free, no credit card)
2. Create a new project — name it "ojsippin" or anything you like
3. Once created, click **Connection Details** in the dashboard
4. Under **Connection string**, select **Pooled connection** and copy the URL
   - It looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

---

## Step 2 — Set up your local environment

In Terminal, navigate to this folder:
```
cd ~/Desktop/"OJ Sippin - Cloud Version (Vercel + Neon)"
```

Copy the example env file:
```
cp .env.local.example .env.local
```

Open `.env.local` in a text editor and fill in:
- `DATABASE_URL` — paste the Neon connection string from Step 1
- `APP_PASSWORD` — the password everyone will use to log in (e.g. `ojsippin2024`)
- `SESSION_SECRET` — generate a random secret: run `openssl rand -base64 32` in Terminal and paste the result

---

## Step 3 — Install dependencies and run the database migration

```
pnpm install
pnpm migrate
```

`pnpm migrate` creates all the tables in Neon and seeds the chart of accounts. You only need to run this once.

---

## Step 4 — Deploy to Vercel

1. Go to **https://vercel.com** and sign up with GitHub (free)
2. Click **Add New → Project**
3. If this folder isn't already a GitHub repo, you'll need to push it first:
   ```
   cd ~/Desktop/"OJ Sippin - Cloud Version (Vercel + Neon)"
   git init
   git add .
   git commit -m "Initial cloud version"
   ```
   Then create a new **private** repo on GitHub and push to it. Vercel will import from there.
4. In Vercel, import your repo. It will auto-detect Next.js.
5. Before deploying, add your environment variables in Vercel's dashboard:
   - Go to **Settings → Environment Variables**
   - Add all three variables from your `.env.local`:
     - `DATABASE_URL`
     - `APP_PASSWORD`
     - `SESSION_SECRET`
6. Click **Deploy**

Vercel will give you a URL like `https://ojsippin.vercel.app` — that's your live app.

---

## Step 5 — Share with your coworker

Send them the Vercel URL and the `APP_PASSWORD`. They open the URL in any browser and log in with the same password. All data is shared in real time — both of you see the same invoices, inventory, and books.

---

## Changing the password

In the Vercel dashboard: **Settings → Environment Variables → APP_PASSWORD** → edit the value → redeploy.

---

## Backing up your data

Your data lives in Neon's cloud database. Neon's free tier includes daily automated backups. You can also export from the Neon dashboard under **Branches → Restore**.

---

## Running locally (for testing before deploying)

```
cd ~/Desktop/"OJ Sippin - Cloud Version (Vercel + Neon)"
pnpm dev
```

Open **http://localhost:3000** — this connects to your real Neon database, so any data you enter here is the same database as the live site.

---

## Troubleshooting

**"DATABASE_URL is not set"** → Make sure `.env.local` exists and has the correct value. Don't use `.env.local.example` directly.

**"SSL connection required"** → Your Neon connection string must end with `?sslmode=require`.

**Tables don't exist / migration errors** → Re-run `pnpm migrate`. It's safe to run multiple times (uses `CREATE TABLE IF NOT EXISTS`).

**Vercel deploy fails** → Check the Vercel build logs. Most common cause: missing environment variables. Make sure all three are set in Vercel's dashboard.

**Forgot the password** → Update `APP_PASSWORD` in Vercel environment variables and redeploy.

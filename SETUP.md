# Cypress Basketball League — Website

This package is a complete responsive basketball league website using the supplied Cypress Basketball League logo.

## What is included

- Home / league dashboard
- Teams directory
- Automatic standings from completed game scores
- Upcoming / live / final game status
- Playoff bracket
- Searchable standings
- Admin control panel at `admin.html`
- JSON backup / restore
- Supabase support so you can update the website **without editing GitHub files**

## Fast demo

Open `index.html` in a browser. The site includes sample teams and games.

The demo stores changes locally in the browser only.

## Make updates visible to everyone (recommended)

The site uses Supabase as its small database. You only need to set it up once.

### 1. Create a Supabase project

Create a free project at Supabase.

### 2. Create the table

In Supabase → SQL Editor, run:

```sql
create table if not exists public.league_data (
  id bigint primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table public.league_data enable row level security;

create policy "Public can read league data"
on public.league_data
for select
to anon, authenticated
using (true);

create policy "Only my admin email can update league data"
on public.league_data
for update
to authenticated
using ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL')
with check ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL');

create policy "Only my admin email can insert league data"
on public.league_data
for insert
to authenticated
with check ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL');
```

Replace `YOUR_ADMIN_EMAIL` with the email you will use for the league admin account.

Then insert the first row. The easiest way is:
1. Open the public website once in demo mode.
2. Use the Admin page only after configuring Supabase.
3. Import `cbl-league-backup.json` if you exported one from the demo.

Alternatively, insert a JSON row manually in the Supabase table using the sample data in `app.js`.

### 3. Create your admin account

In Supabase → Authentication → Users, create a user using your admin email and password.

### 4. Add your Supabase keys

Open `config.js` and put:

```js
window.CBL_CONFIG = {
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-PUBLIC-ANON-KEY"
};
```

The **anon/publishable key is intended for browser use**. Never put a Supabase service-role key in this website.

### 5. Deploy to Vercel

Upload the entire folder to GitHub and deploy that repository to Vercel.

After deployment, open:

`https://your-site.vercel.app/admin.html`

Sign in with your Supabase admin account.

From the admin page you can:
- add/remove teams
- edit team names, codes and cities
- add games
- set home/away teams
- change date/time
- set Upcoming / Live / Final
- enter scores
- edit playoff bracket
- export a JSON backup

Click **Save changes**. Visitors do not need a new GitHub commit to see the updated data.

## Important

The bracket is intentionally editable instead of being automatically generated from standings, because different leagues use different playoff rules. You can enter winners and scores directly.

For a larger league, the next upgrade would be team/player profiles, automatic bracket advancement, standings filters by division, game details, and a commissioner-only admin role.

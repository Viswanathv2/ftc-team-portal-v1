# FTC Team Portal (Simple Static Site)

This is a beginner-friendly website for FTC team members.

## Features

- Login and registration page
- Left sidebar navigation after login
- Coach Admin page for coach-only menu editing
- Supabase free database persistence for user profiles and menu content

## How to customize menu options

Edit the `NAV_ITEMS` list in `app.js`.

## Local run

Because this is a static site, you can open `index.html` directly in a browser.

For a local server (recommended):

```bash
# Python 3
python -m http.server 5500
```

Then open: `http://localhost:5500/team-portal/`

## One-time setup for free persistence (Supabase)

This app now uses:

- Supabase Auth (email/password)
- Supabase Postgres table `profiles` for persistent user data and coach role
- Supabase Postgres table `menu_items` for shared menu text

### 1. Create free Supabase project

1. Go to `https://supabase.com` and create a free account.
2. Create a new project.
3. In project settings, copy:
	 - Project URL
	 - Anon public key

### 2. Create profiles table

Open SQL editor in Supabase and run:

```sql
create table if not exists public.profiles (
	user_id uuid primary key references auth.users(id) on delete cascade,
	display_name text not null,
	is_coach boolean not null default false,
	created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
on public.profiles for select
using (auth.uid() = user_id);

create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = user_id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = user_id);

create table if not exists public.menu_items (
	id text primary key,
	title text not null,
	content text not null,
	updated_at timestamp with time zone default now()
);

alter table public.menu_items enable row level security;

create policy "Authenticated users can read menu"
on public.menu_items for select
using (auth.role() = 'authenticated');

create policy "Coach can insert menu"
on public.menu_items for insert
with check (
	exists (
		select 1
		from public.profiles p
		where p.user_id = auth.uid() and p.is_coach = true
	)
);

create policy "Coach can update menu"
on public.menu_items for update
using (
	exists (
		select 1
		from public.profiles p
		where p.user_id = auth.uid() and p.is_coach = true
	)
)
with check (
	exists (
		select 1
		from public.profiles p
		where p.user_id = auth.uid() and p.is_coach = true
	)
);

insert into public.menu_items (id, title, content)
values
	('announcements', 'Announcements', 'Coach notes, meeting reminders, and tournament updates go here.'),
	('schedule', 'Build Schedule', 'Add this week''s goals and who is working on each task.'),
	('resources', 'Learning Resources', 'Put links to tutorial videos, docs, and checklists here.'),
	('checklist', 'Competition Checklist', 'List what to pack before leaving: battery charger, spare parts, and notebook.')
on conflict (id) do nothing;
```

### 2b. Mark coach accounts

After a coach registers, run this SQL (replace email):

```sql
update public.profiles p
set is_coach = true
from auth.users u
where p.user_id = u.id
  and u.email = 'coach@example.com';
```

### 3. Set keys in app

In `app.js`, replace:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

with your real values.

### 4. Enable email/password auth

In Supabase dashboard:

1. Open `Authentication -> Providers`.
2. Ensure `Email` provider is enabled.

## Free hosting options

### Option 1: GitHub Pages (easy and free)

1. Create a new GitHub repository, for example `ftc-team-portal`.
2. Upload the files inside this folder (`index.html`, `styles.css`, `app.js`).
3. In GitHub, open `Settings -> Pages`.
4. Under `Build and deployment`, choose `Deploy from a branch`.
5. Select `main` branch and `/ (root)` folder.
6. Save. After ~1 minute, your website URL appears.

### Option 2: Netlify Drop (fastest)

1. Go to `https://app.netlify.com/drop`.
2. Drag the `team-portal` folder into the page.
3. Netlify gives you a free URL immediately.
4. Optional: create an account to keep and manage the site.

## How to redeploy changes on Netlify

1. Edit files (`index.html`, `styles.css`, `app.js`).
2. Go to `https://app.netlify.com/drop`.
3. Drag the updated `team-portal` folder again.
4. Netlify publishes the new version in seconds.

## Next upgrade idea

- Add rich text formatting for announcements
- Add activity log for admin edits

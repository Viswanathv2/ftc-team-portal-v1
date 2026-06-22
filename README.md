# FTC Team Portal (Simple Static Site)

This is a beginner-friendly website for FTC team members.

## Features

- **Public Landing Page** - Team info visible to everyone (no login required)
- **Login and Registration** - Optional login for personalized dashboard
- **Left Sidebar Dashboard** - Team menu navigation after login
- **Coach Admin** - Coaches can edit dashboard menu items and announcements
- **Portal Admin** - Portal admins can customize landing page content
- **Team Member Management** - Portal admins can add/remove team members and upload member images
- **Feedback Section** - Visitors can submit feedback/comments on every public page
- **Visit Analytics** - Portal admins can view page visit counts
- **Supabase Free Database** - Persistence for user profiles and menu content
- **Assets Folder** - Easy image management for team photos and sponsors
- **Sponsorship Page** - Professional sponsorship levels with clickable email contact

## Site Flow

1. **Landing Page** (`index.html`) - Team intro and navigation links
2. **Public Content Pages** - Separate pages for team story, team members, schedule, sponsorship, and resources
3. **Login/Register Page** (`login.html`) - Authentication controls on a dedicated page
4. **Dashboard** (Post-login) - Personalized menu + coach admin features

## Public Pages Structure

- `index.html`: home page with intro + quick links
- `about.html`: team story and journey
- `team.html`: team member cards
- `schedule.html`: meetings and events
- `sponsorship.html`: sponsorship needed details + PDF download
- `resources.html`: announcements and public resources
- `login.html`: login/register + dashboard app shell

## How to Customize Public Pages

Use **Portal Admin** from the dashboard after login:
- Edit team story, schedule, resources, and sponsorship page text
- Add/remove team members
- Upload team member images
- Update sponsorship contact email
- Review visitor feedback
- Review page visit counts
- Export feedback to `portal-feedback.csv`
- Export visit analytics to `portal-visits.csv`

## How to Add Images

1. Place image files in `assets/images/` folder:
   - `team-photo.jpg` - hero image
   - `member1.jpg`, `member2.jpg`, etc. - team member photos
   - `sponsor1.png`, `sponsor2.png`, etc. - sponsor logos

2. Images display automatically if they exist. If an image is missing, a placeholder appears.

## Sponsorship Section

The **Sponsorship Needed** page displays:
- Team sponsorship needs and benefits
- **Sponsorship Levels**:
  - Platinum Sponsor ($2000+): Logo on robot, shirts, social media, portfolio & pit display, team event invitations
  - Gold Sponsor ($1000+): Logo on pit display, social media recognition, team document acknowledgment
  - Silver Sponsor ($500+): Social media recognition, materials listing
  - Friends of the Team (any amount): Social media thank-you mention
- Clickable email link to contact the team
- Optional PDF download with full sponsorship details

### Customize the Sponsorship Contact Email

Edit `sponsorship.html` to update the email link:
```html
<a href="mailto:ftc25795@gmail.com" class="email-link">ftc25795@gmail.com</a>
```

Replace `ftc25795@gmail.com` with your team's email address. Clicking the email link will open the user's default email client.

## How to Customize Menu Options (Dashboard)

Edit the `DEFAULT_NAV_ITEMS` list in `app.js` for the default menu items shown after login.

## Local Run

Because this is a static site, you can open `index.html` directly in a browser.

For a local server (recommended):

```bash
# Python 3
python -m http.server 5500
```

Then open: `http://localhost:5500/team-portal/`

## One-time Setup for Free Persistence (Supabase)

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
	is_portal_admin boolean not null default false,
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

create table if not exists public.portal_pages (
	slug text primary key,
	title text not null,
	subtitle text,
	body text,
	contact_email text,
	updated_at timestamp with time zone default now()
);

alter table public.portal_pages enable row level security;

create policy "Public can read portal pages"
on public.portal_pages for select
using (true);

create policy "Portal admin can write portal pages"
on public.portal_pages for all
using (
	exists (
		select 1 from public.profiles p
		where p.user_id = auth.uid() and p.is_portal_admin = true
	)
)
with check (
	exists (
		select 1 from public.profiles p
		where p.user_id = auth.uid() and p.is_portal_admin = true
	)
);

create table if not exists public.team_members (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	role text,
	image_url text,
	sort_order int not null default 1,
	is_active boolean not null default true,
	created_at timestamp with time zone default now()
);

alter table public.team_members enable row level security;

create policy "Public can read team members"
on public.team_members for select
using (true);

create policy "Portal admin can write team members"
on public.team_members for all
using (
	exists (
		select 1 from public.profiles p
		where p.user_id = auth.uid() and p.is_portal_admin = true
	)
)
with check (
	exists (
		select 1 from public.profiles p
		where p.user_id = auth.uid() and p.is_portal_admin = true
	)
);

create table if not exists public.feedback (
	id uuid primary key default gen_random_uuid(),
	page_slug text not null,
	name text not null,
	email text,
	comment text not null,
	created_at timestamp with time zone default now()
);

alter table public.feedback enable row level security;

create policy "Public can create feedback"
on public.feedback for insert
with check (true);

create policy "Public can read feedback"
on public.feedback for select
using (true);

create table if not exists public.page_visits (
	id uuid primary key default gen_random_uuid(),
	page_slug text not null,
	visitor_id text not null,
	visit_date date not null default current_date,
	visited_at timestamp with time zone default now(),
	constraint unique_visit unique (visitor_id, page_slug, visit_date)
);

alter table public.page_visits enable row level security;

create policy "Public can insert page visits"
on public.page_visits for insert
with check (true);

create policy "Authenticated users can read page visits"
on public.page_visits for select
using (auth.role() = 'authenticated');
```

### 2a. Create storage bucket for team member photos

Run this in Supabase SQL editor:

```sql
insert into storage.buckets (id, name, public)
values ('team-assets', 'team-assets', true)
on conflict (id) do nothing;

create policy "Public can read team assets"
on storage.objects for select
using (bucket_id = 'team-assets');

create policy "Portal admin can upload team assets"
on storage.objects for insert
with check (
	bucket_id = 'team-assets'
	and exists (
		select 1 from public.profiles p
		where p.user_id = auth.uid() and p.is_portal_admin = true
	)
);

create policy "Portal admin can delete team assets"
on storage.objects for delete
using (
	bucket_id = 'team-assets'
	and exists (
		select 1 from public.profiles p
		where p.user_id = auth.uid() and p.is_portal_admin = true
	)
);
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

### 2c. Mark Portal Admin accounts

A **Portal Admin** can customize landing page content (team intro, sponsorship email, etc.). After a Portal Admin registers, run this SQL (replace email):

```sql
update public.profiles p
set is_portal_admin = true
from auth.users u
where p.user_id = u.id
  and u.email = 'portaladmin@example.com';
```

### 3. Set keys in app

In `app.js`, replace:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

In `public.js`, replace:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

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

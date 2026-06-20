# FTC Team Portal (Simple Static Site)

This is a beginner-friendly website for FTC team members.

## Features

- Login page
- Left sidebar navigation after login
- 4 menu sections you can customize in `app.js`
- No backend required for the demo version

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

## Important security note

The current login is a **demo login** (username/password in JavaScript). That is fine for simple practice use, but not secure for private data.

If you want real authentication, switch to Firebase Authentication (free tier is usually enough for small teams).

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

## Next upgrade idea

- Add Firebase Authentication for real user accounts
- Store menu content in Firestore so kids can update from a web form

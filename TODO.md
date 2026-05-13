## Fix like/comment/share UI

### Info gathered
- Repo has backend server in `js/app.js` with these endpoints:
  - `GET /api/posts` (list posts)
  - `POST /api/posts/:id/like` (requires auth)
  - `POST /api/posts/:id/comments` (requires auth)
- Repo currently has no `/pages/login.html` or `/pages/admin.html`, and no UI code exists to call the like/comment APIs.
- `js/login.js` and `js/admin.js` are placeholders.

### Plan
1. Create `pages/login.html` (+ `js/login-ui.js` if needed) that calls:
   - `POST /api/auth/login`
   - Stores session cookie (set by server).
2. Create `pages/feed.html` (or embed in `pages/admin.html`) that:
   - Loads current user via `GET /api/auth/me`
   - Loads posts via `GET /api/posts`
   - Renders Like + Comment UI per post
   - On Like: `POST /api/posts/:id/like`
   - On Comment: `POST /api/posts/:id/comments` with `{ text }`
3. Implement Share:
   - Use `navigator.share({ ... })` when available, otherwise show a copy-to-clipboard share link.
4. Ensure static serving works under existing backend static routes (`/pages/*`, `/js/*`).
5. Update `index.html` to link to the new feed page.
6. Smoke test:
   - Login -> Like + Comment work
   - Unauth user -> buttons disabled or show “login required”

### Dependent files to edit/add
- Add: `pages/login.html`
- Add: `pages/feed.html`
- Add: `js/feed.js` (UI logic)
- Add: `js/login-ui.js` (optional)
- Edit: `index.html`

### Followup steps
- Run `npm install` only if needed (package.json has no deps).
- Start server: `node js/app.js`
- Open `/pages/login.html` then `/pages/feed.html`

### Status
- Implemented: `/pages/login.html`, `/pages/feed.html`, `js/login-ui.js`, `js/feed.js`
- Like/comment/share buttons now call backend endpoints (`/api/posts/:id/like` and `/api/posts/:id/comments`) and share uses `navigator.share` with clipboard fallback



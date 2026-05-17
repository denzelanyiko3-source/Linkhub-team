# Linkhub Project Audit - End-to-End Bug Fix Plan

## Goal
Make the LinkHub app work end-to-end (frontend ↔ backend) with no blocking runtime/API errors.

## Information gathered
- Backend routes/auth/session exist in `server.js` under `/api/*`.
- Frontend calls consistent routes:
  - `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/logout`
  - `/api/posts`, `/api/posts/:id/like`, `/api/posts/:id/comments`
  - `/api/groups`, POST `/api/groups`
  - `/api/events`, POST `/api/events`, POST `/api/events/:id/join`
  - `/api/profile/me`
  - Admin: `/api/admin/stats`, `/api/admin/users`

## Edit Plan (implementation steps)
1. Verify backend startup & DB behavior
   - Check `.env.example` and ensure server uses `MONGO_URI` correctly.
   - Ensure connect fallback doesn’t break auth-dependent flows.
2. Verify session cookie compatibility with fetch
   - Ensure `credentials: 'include'` in frontend + cookie `sameSite` and `secure` work in same-origin.
3. Verify express static + correct script paths
   - Confirm `index.html` and `pages/*.html` reference the correct `js/*` and `css/*`.
4. Run end-to-end manual tests (local)
   - Start server, test:
     - register → redirected home
     - login → home
     - create post → like → comment
     - create group → create event → join event
     - logout → protected actions return 401/403
     - admin endpoints blocked for non-admin; accessible for admin
5. Patch any remaining frontend runtime errors
   - Particularly around inline `onclick`/`onkeypress` usage and global function wiring.

## Dependent files to edit (as needed)
- `server.js`
- `js/app.js`
- `js/admin.js`
- `js/login.js`
- `js/register.js`
- `pages/*.html` and/or `index.html`

## Follow-up steps
- Execute `npm install` (if needed) and `npm start`.
- Use browser devtools + network tab to confirm all API routes return 200/201 where expected.


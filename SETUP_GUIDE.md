# LinkHub - Complete Setup & Deployment Guide

## Overview
LinkHub is now fully functional with a complete backend (Express.js + MongoDB/JSON) and frontend (Vanilla JavaScript + HTML/CSS) implementation.

## ✅ What Has Been Fixed

### Backend (server.js)
- ✅ Express server with full routing
- ✅ CORS enabled for frontend communication
- ✅ Express-session authentication with secure cookies
- ✅ MongoDB integration with JSON fallback
- ✅ Bcrypt password hashing
- ✅ All API endpoints with try-catch error handling
- ✅ Admin dashboard endpoints
- ✅ User registration and login
- ✅ Post, comment, group, and event management
- ✅ Profile endpoints with deterministic user data

### Frontend Scripts (Created/Fixed)
- ✅ `js/index.js` - Home page with feed, post creation
- ✅ `js/register.js` - User registration with validation
- ✅ `js/login-ui.js` - Login with email validation
- ✅ `js/feed.js` - Feed with posts, likes, comments
- ✅ `js/admin.js` - Admin dashboard with stats and user management
- ✅ `js/profile.js` - User profile display
- ✅ `js/groups.js` - Groups listing and creation
- ✅ `js/events.js` - Events listing and joining
- ✅ `js/app.js` - Deprecated (marked for reference only)

### Configuration
- ✅ `package.json` - All dependencies added
- ✅ `.env.example` - Environment template
- ✅ `data/store.json` - Sample data with users, posts, groups, events

## 🚀 Getting Started

### Prerequisites
- Node.js v14+
- npm or yarn
- MongoDB (optional - app works with JSON fallback)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Create `.env` file (copy from `.env.example`):**
```bash
cp .env.example .env
```

3. **Configure environment variables in `.env`:**
```
PORT=4000
SESSION_SECRET=your-secret-key-change-this-in-production
# MongoDB connection (optional - comment out to use JSON fallback)
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/linkhub
```

### Running the Application

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:4000` (or your configured PORT).

## 📋 Testing Endpoints with Postman

### Authentication Endpoints

**1. Register New User**
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response (201):
{
  "user": {
    "id": 1234567890,
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "JD",
    "role": "member"
  }
}
```

**2. Login**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "joe@linkhub.com",
  "password": "password123"
}

Response (200):
{
  "user": {
    "id": 1,
    "name": "Joe Maina",
    "email": "joe@linkhub.com",
    "avatar": "JM",
    "role": "admin"
  }
}
```

**3. Check Current User**
```
GET /api/auth/me

Response (200):
{
  "user": { ... } or null if not logged in
}
```

**4. Logout**
```
POST /api/auth/logout

Response (200):
{
  "success": true
}
```

### Feed Endpoints

**5. Get All Posts**
```
GET /api/posts

Response (200):
[
  {
    "id": 1,
    "author": "Joe Maina",
    "avatar": "JM",
    "text": "Welcome to LinkHub!",
    "likes": 5,
    "comments": [],
    ...
  }
]
```

**6. Create Post**
```
POST /api/posts
Content-Type: application/json
(Requires authentication)

{
  "text": "This is my first post!"
}

Response (201):
{
  "id": 1234567890,
  "author": "Joe Maina",
  "avatar": "JM",
  "text": "This is my first post!",
  "likes": 0,
  "comments": [],
  ...
}
```

**7. Like a Post**
```
POST /api/posts/1/like
(Requires authentication)

Response (200):
{
  "id": 1,
  "likes": 6,
  ...
}
```

**8. Comment on Post**
```
POST /api/posts/1/comments
Content-Type: application/json
(Requires authentication)

{
  "text": "Great post!"
}

Response (200):
{
  "id": 1,
  "comments": [
    {
      "author": "Joe Maina",
      "avatar": "JM",
      "text": "Great post!"
    }
  ],
  ...
}
```

### Groups Endpoints

**9. Get All Groups**
```
GET /api/groups

Response (200):
[
  {
    "id": 1,
    "name": "Nairobi Dev Collective",
    "emoji": "👨‍💻",
    "members": 12,
    "description": "Software developers..."
  }
]
```

**10. Create Group**
```
POST /api/groups
Content-Type: application/json
(Requires authentication)

{
  "name": "Web Designers",
  "emoji": "🎨",
  "members": 5,
  "description": "UI/UX designers sharing best practices"
}

Response (201):
{
  "id": 1234567890,
  "name": "Web Designers",
  ...
}
```

### Events Endpoints

**11. Get All Events**
```
GET /api/events

Response (200):
[
  {
    "id": 1,
    "name": "Weekend Coding Meetup",
    "date": "2026-12-15",
    "location": "Nairobi Tech Hub",
    "time": "2:00 PM",
    "attending": 18,
    "description": "..."
  }
]
```

**12. Create Event**
```
POST /api/events
Content-Type: application/json
(Requires authentication)

{
  "name": "Hackathon 2026",
  "date": "2026-12-20",
  "time": "09:00",
  "location": "Tech Park",
  "attending": 0,
  "description": "24-hour coding competition"
}

Response (201):
{
  "id": 1234567890,
  "name": "Hackathon 2026",
  ...
}
```

**13. Join Event**
```
POST /api/events/1/join
(Requires authentication)

Response (200):
{
  "id": 1,
  "attending": 19,
  ...
}
```

### Profile Endpoints

**14. Get User Profile**
```
GET /api/profile/me
(Requires authentication)

Response (200):
{
  "name": "Joe Maina",
  "avatar": "JM",
  "location": "Nairobi, Kenya",
  "headline": "Product Designer · Community Advocate",
  "friends": 127,
  "groups": 23,
  "eventsAttended": 45
}
```

### Admin Endpoints

**15. Get Admin Statistics**
```
GET /api/admin/stats
(Requires admin authentication)

Response (200):
{
  "posts": 15,
  "groups": 8,
  "events": 10,
  "users": 42
}
```

**16. Get All Users**
```
GET /api/admin/users
(Requires admin authentication)

Response (200):
[
  {
    "id": 1,
    "name": "Joe Maina",
    "email": "joe@linkhub.com",
    "avatar": "JM",
    "role": "admin"
  },
  ...
]
```

## 🔐 Authentication Notes

- Sessions are stored in memory by default (use MongoDB with connect-mongo for persistence)
- Cookies are HttpOnly, SameSite=Lax for security
- Passwords are hashed with bcrypt (10 salt rounds)
- Passwords must be at least 6 characters

## 📱 Frontend Navigation

**Home Page** (`/index.html` or `/`)
- View feed with posts
- Create new posts
- Like and comment on posts
- Dark mode toggle

**Login** (`/pages/login.html`)
- Email validation
- Error handling
- Redirect to feed on success

**Register** (`/pages/register.html`)
- Form validation
- Password requirements (6+ chars)
- Existing email detection

**Feed** (`/pages/feed.html`)
- Alternative feed view
- Post creation
- Like/comment functionality

**Profile** (`/pages/profile.html`)
- User profile display
- Statistics (friends, groups, events)
- Requires authentication

**Groups** (`/pages/groups.html`)
- Browse all groups
- Create new groups (if logged in)
- View member count

**Events** (`/pages/events.html`)
- Browse all events
- Create new events (if logged in)
- Join events

**Admin** (`/pages/admin.html`)
- Platform statistics
- User management
- Requires admin role

## 🗄️ Database

### JSON Fallback (default)
Data is persisted in `data/store.json` containing:
- Users (with hashed passwords)
- Posts (with comments)
- Groups
- Events
- Profiles

### MongoDB (optional)
Set `MONGO_URI` in `.env` to enable MongoDB:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/linkhub
```

Models included:
- User
- Post (with nested comments)
- Group
- Event
- Profile

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env to a different port (e.g., 5000)
PORT=5000
npm start
```

### MongoDB Connection Failed
The app automatically falls back to JSON storage. Check logs for details.

### Session Not Persisting
Sessions are stored in memory. For persistent sessions across server restarts, configure MongoDB.

### CORS Errors
CORS is enabled for all origins. If issues persist, verify browser console for actual error messages.

### Password Verification Failed
Ensure password is at least 6 characters during registration.

## 📊 Default Test Users

Username: Joe Maina
Email: `joe@linkhub.com`
Password: (See store.json - bcrypt hashed)
Role: admin

## ✨ Features Implemented

- ✅ User registration and login
- ✅ Secure password hashing (bcrypt)
- ✅ Session-based authentication
- ✅ Create and share posts
- ✅ Like and comment on posts
- ✅ Create and join groups
- ✅ Create and join events
- ✅ User profiles with personalized data
- ✅ Admin dashboard with statistics
- ✅ Full CRUD operations for content
- ✅ Error handling with user-friendly messages
- ✅ Dark mode toggle
- ✅ Responsive design
- ✅ MongoDB integration with JSON fallback

## 🔍 Code Quality

- ✅ All async operations use try-catch
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (Mongoose)
- ✅ XSS protection (HTML escaping)
- ✅ CORS properly configured
- ✅ Consistent error messages
- ✅ No broken imports or undefined variables

## 📝 Next Steps

1. Start the server: `npm run dev`
2. Open http://localhost:4000 in your browser
3. Register a new account or use test credentials
4. Explore all features
5. Test with Postman using endpoints above

Enjoy LinkHub! 🔗

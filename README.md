# VeriTask

VeriTask is a full-stack task manager with secure authentication, OTP-based account verification, password recovery, and an AI assistant that can help users manage tasks from the dashboard.

## Tech Stack

- Backend: Node.js, Express, MongoDB, Mongoose, Zod, JWT, Nodemailer
- Frontend: React, Vite, Tailwind CSS, Axios, React Router
- AI: Google Gemini (`gemini-2.5-flash`)

## Features

- Email/password authentication
- OTP-based signup verification
- Forgot-password and reset-password flow using email OTP
- Access token and refresh token session handling with cookies
- Create, view, update, and delete todos
- Filtered dashboard for active, completed, and overdue tasks
- AI task assistant for task suggestions and quick task creation
- Light and dark theme toggle

## Project Structure

```text
.
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   └── routes/
├── frontend/
│   └── src/
├── db.js
├── index.js
└── package.json
```

## Prerequisites

- Node.js 18+
- MongoDB connection string
- Gmail account with an app password for OTP emails
- Google Gemini API key

## Environment Variables

Create a root `.env` file with these values:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
REFRESH_SECRET=your_refresh_secret
EMAIL_USER=your_gmail_address
EMAIL_APP_PASSWORD=your_gmail_app_password
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
production=false
```

Optional frontend env in `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Installation

Install backend dependencies from the project root:

```bash
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

## Running The App

Start the backend from the project root:

```bash
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

App URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Main API Routes

- `POST /signup` - start signup and send OTP
- `POST /verify-otp` - verify signup OTP
- `POST /signin` - sign in user
- `POST /refresh` - refresh access token
- `GET /user` - fetch authenticated user
- `POST /todo` - create a todo
- `GET /todo` - list todos
- `PUT /todo` - update a todo
- `DELETE /todo` - delete a todo
- `POST /agent` - send a prompt to the AI assistant
- `POST /logout` - log out current session
- `POST /logoutfromAlldevices` - log out all sessions
- `POST /forgot-password` - send password reset OTP
- `POST /reset-password` - reset password with OTP

## Notes

- The backend reads environment variables from the root `.env` file.
- Cookies are marked `secure` only when `production=true`.
- OTP email delivery uses Gmail through Nodemailer, so a normal Gmail password will not work; use an app password.
- The AI assistant depends on a valid Gemini API key and an authenticated user session.

## Future Improvements

- Add automated tests
- Add Docker support
- Add task priorities and due-date editing from the AI flow
- Add deployment instructions for production

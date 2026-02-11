# 🎓 Interactive Presentation Platform

A real-time interactive classroom presentation platform where teachers present slides and students join live sessions to participate in activities (MCQ/Open-ended) embedded within the presentation flow.

**Built by:** Ritwik Shivankar  
**Tech Stack:** React + Node.js + Express + MongoDB + Socket.IO

---

## 📁 Project Structure

```
interactive-presentation-platform/
├── backend/
│   ├── config/           # Database & app configuration
│   ├── controllers/      # Route handlers
│   ├── middleware/        # Multer upload middleware
│   ├── models/           # MongoDB Mongoose models
│   ├── routes/           # Express routes
│   ├── uploads/          # Uploaded PDF/PPT files
│   ├── converted-slides/ # Converted slide images
│   ├── utils/            # Helper functions
│   ├── server.js         # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React Context (Socket, Session)
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Page-level components
│   │   ├── utils/        # API helpers
│   │   └── styles/       # CSS files
│   ├── public/
│   └── package.json
└── README.md
```

---

## 🚀 SETUP GUIDE (Step by Step)

### Prerequisites
- **Node.js** v18+ installed
- **MongoDB** running locally (or MongoDB Atlas URI)
- **VS Code** with extensions: ES7 React Snippets, Prettier

### Step 1: Clone/Download & Install Backend

```bash
cd interactive-presentation-platform/backend
npm install
```

### Step 2: Install Frontend

```bash
cd ../frontend
npm install
```

### Step 3: Setup Environment Variables

Create `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/presentation-platform
CLIENT_URL=http://localhost:3000
```

### Step 4: Install LibreOffice (for PPT conversion)

**Windows:**
- Download from https://www.libreoffice.org/download/
- Add to PATH: `C:\Program Files\LibreOffice\program`

**Mac:**
```bash
brew install libreoffice
```

**Linux:**
```bash
sudo apt install libreoffice
```

### Step 5: Install Ghostscript (for PDF to image conversion)

**Windows:**
-
    ' Could not convert PDF to images. Please install Ghostscript:\n\n' +
    '  1. Go to: https://ghostscript.com/releases/gsdnld.html\n' +
    '  2. Download "Ghostscript 10.x AGPL Release" for Windows (64-bit)\n' +
    '  3. During install, CHECK ✅ "Add to PATH"\n' +
    '  4. CLOSE and REOPEN your terminal / VS Code\n' +
    '  5. Verify by running: gswin64c --version\n' +
    '  6. Then restart the backend: npm run dev'






### Step 6: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Step 7: Open in Browser
- **Teacher View:** http://localhost:3000
- **Student View:** http://localhost:3000/student/join

---

## 🎯 Features

1. ✅ PDF/PPT Upload & Slide Conversion
2. ✅ Activity Insertion (MCQ + Open-ended)
3. ✅ Live Session with 6-char Code
4. ✅ Real-time Teacher ↔ Student Sync (Socket.IO)
5. ✅ Activity Experience (Student submission + Teacher results)
6. ✅ Child-friendly UI (target: 5-14 years)

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/presentations/upload` | Upload PDF/PPT |
| GET | `/api/presentations/:id` | Get presentation details |
| POST | `/api/presentations/:id/activities` | Add activity to slide |
| POST | `/api/sessions/create` | Create live session |
| POST | `/api/sessions/join` | Join session with code |
| GET | `/api/sessions/:code` | Get session details |

---

## 🔌 Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-session` | Client → Server | Student joins session room |
| `slide-change` | Teacher → Server → Students | Sync slide navigation |
| `activity-start` | Teacher → Server → Students | Trigger activity |
| `submit-answer` | Student → Server → Teacher | Submit response |
| `show-results` | Teacher → Server → Students | Broadcast results |
| `activity-end` | Teacher → Server → Students | Close activity |

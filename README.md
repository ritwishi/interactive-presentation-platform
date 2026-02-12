# 🎓 Interactive Presentation Platform

A real-time interactive classroom presentation platform where teachers present slides and students join live sessions to participate in activities (MCQ/Open-ended) embedded within the presentation flow.

**Built by:** Ritwik
**Tech Stack:** React + Node.js + Express + MongoDB + Socket.IO

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | [interactive-presentation-platform-zeta.vercel.app](https://interactive-presentation-platform-zeta.vercel.app) |
| **Backend API (Render)** | [interactive-presentation-platform.onrender.com](https://interactive-presentation-platform.onrender.com) |
| **API Health Check** | [/api/health](https://interactive-presentation-platform.onrender.com/api/health) |



---

## 🎯 Features

- **PDF/PPT Upload & Slide Conversion** — Upload PDF or PowerPoint files, automatically converted to slide images using Poppler/Ghostscript/LibreOffice
- **Activity Insertion** — Add MCQ (Multiple Choice) and Open-ended questions to specific slides
- **Live Sessions** — Start real-time classroom sessions with a unique 6-character join code
- **Real-time Sync** — Teacher slide navigation and activities sync instantly to all students via Socket.IO
- **Student Response Collection** — Students submit answers during live activities; teacher sees responses in real-time
- **Results Dashboard** — Visualize MCQ results with bar charts and percentages
- **Searchable Presentation List** — Scrollable, searchable file list with file count badge
- **Slide Preview Navigation** — Browse through all slides in the dashboard with ← → buttons
- **Child-Friendly UI** — Designed for students aged 5–14 with large buttons, emojis, and vibrant colors

---

## 📁 Project Structure

```
interactive-presentation-platform/
├── backend/
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   └── socket.js              # Socket.IO event handlers
│   ├── controllers/
│   │   ├── presentationController.js  # Upload, CRUD operations
│   │   └── sessionController.js       # Session create/join
│   ├── middleware/
│   │   └── upload.js              # Multer file upload config
│   ├── models/
│   │   ├── Presentation.js        # Presentation + Activity schema
│   │   └── Session.js             # Session + Response schema
│   ├── routes/
│   │   ├── presentationRoutes.js  # Presentation API routes
│   │   └── sessionRoutes.js       # Session API routes
│   ├── utils/
│   │   ├── convertPresentation.js # PDF/PPT → image conversion
│   │   └── generateCode.js        # 6-char session code generator
│   ├── uploads/                   # Uploaded PDF/PPT files
│   ├── converted-slides/          # Converted PNG slide images
│   ├── Dockerfile                 # Docker config for Render deployment
│   ├── .dockerignore
│   ├── server.js                  # Express + Socket.IO entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.js         # Landing page (Teacher/Student choice)
│   │   │   ├── TeacherDashboard.js # Upload, preview, activities
│   │   │   ├── TeacherPresent.js   # Live session presenter view
│   │   │   ├── StudentJoin.js      # Join session with code
│   │   │   └── StudentSession.js   # Student live session view
│   │   ├── contexts/
│   │   │   └── SocketContext.js    # Socket.IO React context
│   │   ├── utils/
│   │   │   └── api.js             # Axios API helper functions
│   │   ├── styles/
│   │   │   └── App.css            # Global styles
│   │   ├── App.js                 # React Router setup
│   │   └── index.js               # React entry point
│   ├── public/
│   │   └── index.html
│   ├── vercel.json                # Vercel SPA rewrite config
│   └── package.json
├
├── .gitignore
└── README.md
```

---

## 🚀 Setup Guide (Local Development)

### Prerequisites
- **Node.js** v18+ installed
- **MongoDB** running locally (or MongoDB Atlas URI)
- **Ghostscript** or **Poppler** (for PDF → image conversion)
- **LibreOffice** (optional, for PPT → PDF conversion)

### Step 1: Clone & Install

```bash
git clone https://github.com/ritwishi/interactive-presentation-platform.git
cd interactive-presentation-platform

# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### Step 2: Environment Variables

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/presentation-platform
CLIENT_URL=http://localhost:3000
```

### Step 3: Install System Dependencies

#### Ghostscript (PDF → Images)

| OS | Command |
|----|---------|
| **Windows** | Download from https://ghostscript.com/releases/gsdnld.html → Add to PATH |
| **Mac** | `brew install ghostscript` |
| **Linux** | `sudo apt install ghostscript poppler-utils` |

#### LibreOffice (PPT → PDF, Optional)

| OS | Command |
|----|---------|
| **Windows** | Download from https://www.libreoffice.org/download/ → Add to PATH |
| **Mac** | `brew install libreoffice` |
| **Linux** | `sudo apt install libreoffice` |

### Step 4: Start the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
```

### Step 5: Open in Browser

| Role | URL |
|------|-----|
| **Teacher** | http://localhost:3000/teacher/dashboard |
| **Student** | http://localhost:3000/student/join |

---

## 📡 API Endpoints

### Presentation APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/presentations/upload` | Upload PDF/PPT file |
| `GET` | `/api/presentations` | Get all presentations |
| `GET` | `/api/presentations/:id` | Get presentation by ID |
| `POST` | `/api/presentations/:id/activities` | Add activity to a slide |
| `DELETE` | `/api/presentations/:id/activities/:activityId` | Remove an activity |

### Session APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sessions/create` | Create a new live session |
| `POST` | `/api/sessions/join` | Join session with 6-char code |
| `GET` | `/api/sessions/:code` | Get session details |

---

## 🔌 Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-session` | Client → Server | Join a session room |
| `student-joined` | Server → Room | Notify when student joins |
| `student-left` | Server → Room | Notify when student disconnects |
| `slide-change` | Teacher → Students | Sync slide navigation |
| `activity-start` | Teacher → Students | Launch an activity |
| `submit-answer` | Student → Teacher | Submit activity response |
| `answer-received` | Server → Room | Broadcast new response |
| `show-results` | Teacher → Students | Share activity results |
| `activity-end` | Teacher → Students | Close active activity |
| `end-session` | Teacher → All | Terminate the session |

---

## 🏗️ Deployment

The app is deployed using **3 free services**:

| Service | Purpose |
|---------|---------|
| **MongoDB Atlas** | Cloud database (free M0 tier) |
| **Render** | Backend hosting with Docker (free tier) |
| **Vercel** | Frontend hosting (free tier) |

The backend runs in a **Docker container** on Render to ensure Poppler, Ghostscript, and LibreOffice are available for file conversion.


### Key Environment Variables

**Backend (Render):**

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `CLIENT_URL` | Vercel frontend URL (no trailing slash) |
| `PORT` | `5000` |

**Frontend (Vercel):**

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | Render backend URL + `/api` |
| `REACT_APP_STATIC_URL` | Render backend URL |
| `REACT_APP_SOCKET_URL` | Render backend URL |

---

## 🧪 How to Use

### As a Teacher:
1. Open the app → Click **"I'm a Teacher"**
2. Upload a PDF or PPT file
3. Browse slides using ← → navigation
4. Add MCQ or open-ended questions to any slide
5. Click **🚀 Start Live Session**
6. Share the **6-character code** with students
7. Navigate slides — activities trigger automatically
8. View real-time student responses
9. Click **📊 Show Results** to reveal answers

### As a Student:
1. Open the app → Click **"I'm a Student"**
2. Enter the **6-character session code** and your name
3. Follow along as the teacher navigates slides
4. Answer activities (MCQ or open-ended) when they appear
5. View results when the teacher shares them

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 | UI components & routing |
| **Styling** | Custom CSS | Child-friendly responsive design |
| **Backend** | Node.js + Express | REST API server |
| **Database** | MongoDB + Mongoose | Data persistence |
| **Real-time** | Socket.IO | Live session synchronization |
| **File Conversion** | Poppler, Ghostscript, LibreOffice | PDF/PPT → slide images |
| **Frontend Hosting** | Vercel | Static site deployment |
| **Backend Hosting** | Render (Docker) | Containerized Node.js server |
| **Database Hosting** | MongoDB Atlas | Cloud database |

---

## 📝 License

This project was built for educational purposes as part of a classroom presentation tool.

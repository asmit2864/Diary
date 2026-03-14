# 📝 NoteNest

A beautiful purple note-taking PWA built with React, Node.js, Express, and MongoDB.

---

## ✨ Features
- 6 category tabs: General, Remember, Information, Money Lend, Lists, Accounts
- Masonry grid layout like Google Keep
- Frosted glass cards on a purple gradient background
- Auto-save while typing
- Installable as a PWA (Add to Home Screen)
- Swipe left/right to switch tabs on mobile

---

## 🖥️ Run Locally

### Prerequisites
- Node.js v18+ → https://nodejs.org
- A MongoDB Atlas account (free) → https://mongodb.com/atlas

---

### Step 1 – Get a MongoDB connection string

1. Go to https://cloud.mongodb.com and sign in / sign up (free)
2. Create a **free M0 cluster**
3. Click **Connect** → **Connect your application**
4. Copy the connection string, it looks like:
   ```
   mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Add your database name at the end:
   ```
   mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/notenest?retryWrites=true&w=majority
   ```

---

### Step 2 – Set up the project

```bash
# 1. Enter the project folder
cd notenest

# 2. Copy the env template and fill in your MongoDB URI
cp .env.example .env
```

Open `.env` and paste your MongoDB URI:
```
MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/notenest?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
```

---

### Step 3 – Install dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

Or use the shortcut:
```bash
npm run install-all
```

---

### Step 4 – Run in development mode

```bash
npm run dev
```

This starts:
- **Backend** on http://localhost:5000
- **Frontend** on http://localhost:3000

Open http://localhost:3000 in your browser.  
On mobile, open your computer's local IP (e.g. http://192.168.1.x:3000).

---

### Step 5 – Build for production (optional local test)

```bash
npm run build
NODE_ENV=production node server/index.js
```

Then open http://localhost:5000

---

## 🚀 Deploy to Render (free hosting)

### Step 1 – Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/notenest.git
git push -u origin main
```

### Step 2 – Create a Render Web Service
1. Go to https://render.com and sign in
2. Click **New** → **Web Service**
3. Connect your GitHub repo
4. Render will auto-detect the `render.yaml` config
5. Set the **Environment Variable**:
   - Key: `MONGODB_URI`
   - Value: your MongoDB Atlas connection string
6. Click **Create Web Service**

Render will build and deploy automatically. Your app will be live at:
`https://notenest.onrender.com`

### Step 3 – Allow Render IP in MongoDB Atlas
1. In MongoDB Atlas → **Network Access**
2. Click **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)
3. Save

---

## 📱 Install as PWA

### On Android (Chrome):
1. Open the app URL in Chrome
2. Tap the **⋮ menu** → **Add to Home screen**
3. Tap **Add**

### On iPhone (Safari):
1. Open the app URL in Safari
2. Tap the **Share** button (box with arrow)
3. Scroll down → **Add to Home Screen**
4. Tap **Add**

---

## 📁 Project Structure

```
notenest/
├── server/
│   ├── index.js          # Express server
│   ├── models/
│   │   └── Note.js       # Mongoose Note model
│   └── routes/
│       └── notes.js      # REST API routes
├── client/
│   ├── public/
│   │   ├── index.html    # HTML shell
│   │   ├── manifest.json # PWA manifest
│   │   └── sw.js         # Service worker
│   └── src/
│       ├── App.js         # Root component
│       ├── index.js       # Entry + SW registration
│       ├── index.css      # Global styles
│       ├── components/
│       │   ├── TabBar      # Category tab pills
│       │   ├── NotesGrid   # Masonry note grid
│       │   ├── NoteCard    # Individual note card
│       │   ├── FAB         # Floating action button
│       │   └── NoteEditor  # Full-screen note editor
│       ├── hooks/
│       │   └── useNotes.js # Data fetching hook
│       └── utils/
│           ├── api.js       # API calls
│           └── constants.js # Tabs & colors
├── .env.example
├── package.json
├── render.yaml
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notes?category=General | Get notes (filtered) |
| POST | /api/notes | Create note |
| PUT | /api/notes/:id | Update note |
| DELETE | /api/notes/:id | Delete note |

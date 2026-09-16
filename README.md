# 📅 Modern Weekly Schedule

An editorial, responsive, interactive weekly timetable web application inspired by [jay2d1.github.io/weeklyschedule](https://jay2d1.github.io/weeklyschedule/).

Built with pure **HTML5, CSS3, Modern JavaScript (ES6+)**, and zero external build tools or heavy frameworks.

---

## ✨ Features

- **Editorial Design System**:
  - Warm ink-on-paper surface (`#FDFCF9`) with high-contrast text (`#1A1814`) and distinctive **Syne** headings paired with **DM Sans** body text.
  - Dynamically generated pastel subject color palette with high-contrast matching left border accents.
- **7-Day Timetable Grid**:
  - 8-column CSS Grid (1 column for time slots from 08:00 to 18:00 + 7 equal day columns from Monday to Sunday).
  - Dynamic highlight for **Today's** column and date number.
  - Pixel-precise event placement according to start and end minutes.
- **Live Week Navigation**:
  - Automatically loads the current week.
  - Jump back and forth with `←` and `→` week arrows, or jump straight back to current week with the **Today** button.
- **Group Cohort Filtering**:
  - Filter classes for `All`, `Group A`, `Group B`, `Group C`, or `Group D` with 1 click.
- **Interactive Event Detail Modal**:
  - Click any class to view complete details: Subject, Topic, Faculty / Instructor, Date & Day, Time, and Room/Location.
  - Includes a **Delete Class** button to remove classes.
- **In-App "Add Class" Modal**:
  - Add lectures or labs directly from the web interface without touching JSON or code!
  - Supports recurring weekly classes or specific calendar dates.
  - Persists automatically to your browser's `localStorage`.
- **1-Click Calendar Export (.ICS)**:
  - Generates standard RFC 5545 `.ics` file.
  - Download and import directly into **Google Calendar, Apple Calendar, or Microsoft Outlook**.

---

## 🚀 How to Run Locally

Because this is a pure static web app, you can run it in multiple easy ways:

### Option 1: Direct Double-Click
Simply double-click `index.html` in your file explorer to open it directly in Chrome, Edge, Safari, or Firefox.

### Option 2: Using Python's Built-in Local Server
Open your terminal in the `weekly-schedule` directory and run:
```bash
python -m http.server 8000
```
Then open your browser to: [http://localhost:8000](http://localhost:8000)

### Option 3: VS Code Live Server
If you use VS Code, right-click `index.html` and choose **"Open with Live Server"**.

---

## 🌐 How to Deploy Free to GitHub Pages (Like the Original)

To host your schedule online at `https://<your-username>.github.io/weeklyschedule/`:

1. Create a new GitHub repository named `weeklyschedule` (or any name you like).
2. Push the files in this folder (`index.html`, `style.css`, `app.js`, `schedule.json`, `README.md`) to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of weekly schedule"
   git branch -M main
   git remote add origin https://github.com/<your-username>/weeklyschedule.git
   git push -u origin main
   ```
3. In GitHub, go to **Settings** > **Pages**.
4. Under **Branch**, select `main` and root `/`, then click **Save**.
5. Your live schedule will be published at `https://<your-username>.github.io/weeklyschedule/` within 1-2 minutes!

---

## ⚙️ Customization Guide

### Changing the Timetable Hours
In `app.js`, adjust the configuration constants:
```javascript
const GRID_START  = 8;   // Start hour (08:00 AM)
const GRID_END    = 18;  // End hour (06:00 PM)
const SLOT_HEIGHT = 60;  // Height in pixels per hour row
```

### Adding Events Directly in JSON
Edit `schedule.json` following this structure:
```json
{
  "subject": "Pharmacology",
  "topic": "Autonomic Nervous System & Beta Blockers",
  "faculty": "Dr. S. K. Sahu",
  "day": "Tuesday",
  "date": "2026-09-15",
  "start_time": "09:00",
  "end_time": "10:30",
  "group": "all",
  "room": "Lecture Hall 2"
}
```

Here’s a complete, coherent, production‑style codebase for your Trubblx desktop widget — all files, wired together, with:

Auto‑launch on startup

Tray icon + show/hide

Global shortcut

Draggable, frameless widget

Edit/Preview modes

Tasks with categories, reminders, sound, progress

Notes page

Timers (Pomodoro) page

Clean, minimal Trubblx‑style UI

0. Install dependencies
In your project folder:

bash
npm init -y
npm install electron auto-launch
Your structure:

text
trubblx-widget/
  package.json
  main.js
  preload.js
  index.html
  mini.html
  style.css
  script.js
  trubblx-icon.png
  alert.mp3
1. package.json
json
{
  "name": "trubblx-widget",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  },
  "dependencies": {
    "auto-launch": "^5.0.5",
    "electron": "^28.0.0"
  }
}
2. main.js
js
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  globalShortcut,
  ipcMain
} = require("electron");
const path = require("path");
const AutoLaunch = require("auto-launch");

let win;
let tray;
let mini;

// ---------- AUTO-LAUNCH ----------
const trubblxAutoLauncher = new AutoLaunch({
  name: "Trubblx Widget",
  path: process.execPath
});

trubblxAutoLauncher.isEnabled().then((enabled) => {
  if (!enabled) trubblxAutoLauncher.enable();
});

// ---------- MAIN WIDGET WINDOW ----------
function createWindow() {
  win = new BrowserWindow({
    width: 400,
    height: 540,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    show: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    }
  });

  win.loadFile("index.html");

  win.once("ready-to-show", () => {
    win.show();
    win.setOpacity(0);
    let opacity = 0;
    const fade = setInterval(() => {
      opacity += 0.05;
      win.setOpacity(opacity);
      if (opacity >= 1) clearInterval(fade);
    }, 16);
  });

  win.on("close", (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      win.hide();
    }
  });
}

// ---------- MINI BUBBLE ----------
function createMiniBubble() {
  mini = new BrowserWindow({
    width: 60,
    height: 60,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    x: 20,
    y: 100,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mini.loadFile("mini.html");
}

// ---------- TRAY ----------
function createTray() {
  const iconPath = path.join(__dirname, "trubblx-icon.png");
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show / Hide Widget",
      click: () => {
        if (win.isVisible()) win.hide();
        else win.show();
      }
    },
    { type: "separator" },
    {
      label: "Quit Trubblx",
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip("Trubblx Tasks");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    if (win.isVisible()) win.hide();
    else win.show();
  });
}

// ---------- GLOBAL SHORTCUT ----------
function registerShortcuts() {
  globalShortcut.register("CommandOrControl+Shift+T", () => {
    if (win.isVisible()) win.hide();
    else win.show();
  });
}

// ---------- IPC FROM MINI BUBBLE ----------
ipcMain.on("toggle-widget", () => {
  if (!win) return;
  if (win.isVisible()) win.hide();
  else win.show();
});

// ---------- APP LIFECYCLE ----------
app.whenReady().then(() => {
  createWindow();
  createMiniBubble();
  createTray();
  registerShortcuts();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
3. preload.js
js
const { contextBridge, Notification } = require("electron");

contextBridge.exposeInMainWorld("trubblxAPI", {
  notify: (title, body) => {
    new Notification({ title, body }).show();
  }
});
4. index.html
html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Trubblx Tasks</title>
  <link rel="stylesheet" href="style.css" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body>
  <div id="widget" class="draggable">

    <div id="header">
      <div id="brand">
        <img src="trubblx-icon.png" id="logo" />
        <div>
          <div id="title">Trubblx Tasks</div>
          <div id="subtitle">Daily focus in the age of AI</div>
        </div>
      </div>

      <button id="modeToggle" class="chip">Preview</button>
    </div>

    <div id="tabs">
      <button class="tab active" data-page="tasks">Tasks</button>
      <button class="tab" data-page="notes">Notes</button>
      <button class="tab" data-page="timers">Timers</button>
    </div>

    <!-- TASKS PAGE -->
    <div id="page-tasks" class="page active">
      <div id="task-input" class="edit-mode">
        <input type="text" id="taskText" placeholder="What are you working on?" />
        <input type="time" id="taskTime" />
        <select id="taskCategory">
          <option value="Study">Study</option>
          <option value="Work">Work</option>
          <option value="Personal">Personal</option>
        </select>
        <button id="addTask" class="primary-btn">Add</button>
      </div>

      <div id="meta-row">
        <div id="progress">
          <div id="progress-bar"></div>
        </div>
        <span id="progress-text">0% complete</span>
      </div>

      <div id="task-list"></div>
    </div>

    <!-- NOTES PAGE -->
    <div id="page-notes" class="page">
      <textarea id="notesArea" placeholder="Write your notes here..."></textarea>
    </div>

    <!-- TIMERS PAGE -->
    <div id="page-timers" class="page">
      <div id="pomodoro">
        <div id="timerDisplay">25:00</div>
        <div id="timer-controls">
          <button id="startPomodoro" class="primary-btn">Start</button>
          <button id="resetPomodoro" class="chip">Reset</button>
        </div>
      </div>
    </div>

  </div>

  <audio id="alertSound" src="alert.mp3" preload="auto"></audio>
  <script src="script.js"></script>
</body>
</html>
5. mini.html
html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Trubblx Mini</title>
  <style>
    body {
      margin: 0;
      background: transparent;
    }
    #bubble {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(74, 123, 255, 0.9);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: Inter, system-ui, sans-serif;
      font-size: 22px;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(74, 123, 255, 0.4);
      user-select: none;
    }
  </style>
</head>
<body>
  <div id="bubble">T</div>

  <script>
    const { ipcRenderer } = require("electron");
    document.getElementById("bubble").addEventListener("click", () => {
      ipcRenderer.send("toggle-widget");
    });
  </script>
</body>
</html>
6. style.css
css
:root {
  --bg-glass: rgba(255, 255, 255, 0.16);
  --bg-card: rgba(255, 255, 255, 0.42);
  --border-subtle: rgba(255, 255, 255, 0.35);
  --accent: #4A7BFF;
  --accent-soft: rgba(74, 123, 255, 0.12);
  --text-main: #111827;
  --text-muted: #6B7280;
  --radius-lg: 20px;
  --radius-md: 12px;
  --shadow-soft: 0 18px 45px rgba(15, 23, 42, 0.25);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: transparent;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--text-main);
}

/* Widget shell */

#widget {
  position: absolute;
  top: 60px;
  left: 60px;
  width: 380px;
  min-height: 260px;
  border-radius: var(--radius-lg);
  background: var(--bg-glass);
  backdrop-filter: blur(22px);
  box-shadow: var(--shadow-soft);
  padding: 16px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Draggable */

.draggable {
  cursor: grab;
}

.draggable:active {
  cursor: grabbing;
}

/* Header */

#header {
  display: flex;
  align-items: center;
  gap: 10px;
}

#brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

#logo {
  width: 18px;
  height: 18px;
  border-radius: 6px;
}

#title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

#subtitle {
  font-size: 11px;
  color: var(--text-muted);
}

/* Mode chip */

.chip {
  margin-left: auto;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.4);
  font-size: 11px;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.chip:hover {
  background: var(--accent-soft);
  color: var(--accent);
  border-color: var(--accent);
}

/* Tabs */

#tabs {
  display: flex;
  gap: 6px;
  margin-top: 2px;
}

.tab {
  flex: 1;
  padding: 6px 0;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.4);
  background: rgba(255,255,255,0.2);
  font-size: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.tab.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

/* Pages */

.page {
  display: none;
  margin-top: 6px;
}

.page.active {
  display: block;
}

/* Input row (Tasks) */

#task-input {
  display: flex;
  gap: 6px;
  align-items: center;
}

#task-input input[type="text"] {
  flex: 1.4;
}

#task-input input[type="time"],
#taskCategory {
  flex: 0.8;
}

#task-input input,
#taskCategory {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  padding: 7px 9px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.75);
  outline: none;
}

#task-input input:focus,
#taskCategory:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent-soft);
}

.primary-btn {
  border-radius: var(--radius-md);
  border: none;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 500;
  background: var(--accent);
  color: white;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(74, 123, 255, 0.35);
  transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.1s ease;
}

.primary-btn:hover {
  background: #3b6af0;
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(74, 123, 255, 0.4);
}

.primary-btn:active {
  transform: translateY(0);
  box-shadow: 0 6px 14px rgba(74, 123, 255, 0.3);
}

/* Meta row */

#meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

#progress {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 999px;
  overflow: hidden;
}

#progress-bar {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #4A7BFF, #7C3AED);
  transition: width 0.25s ease-out;
}

#progress-text {
  font-size: 11px;
  color: var(--text-muted);
}

/* Task list */

#task-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.task {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.55);
  font-size: 12px;
}

.task[data-category="Study"] {
  border-left: 3px solid #4A7BFF;
}

.task[data-category="Work"] {
  border-left: 3px solid #F97316;
}

.task[data-category="Personal"] {
  border-left: 3px solid #22C55E;
}

.task input[type="checkbox"] {
  accent-color: var(--accent);
}

.task span[contenteditable="true"] {
  outline: none;
}

.task span[contenteditable="true"]:focus {
  box-shadow: 0 0 0 1px var(--accent-soft);
  border-radius: 6px;
  padding: 1px 3px;
  background: rgba(255, 255, 255, 0.8);
}

.task input[type="time"] {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  padding: 3px 6px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.85);
}

.task button {
  border: none;
  background: transparent;
  font-size: 13px;
  cursor: pointer;
  color: #9CA3AF;
  padding: 2px;
  transition: color 0.15s ease, transform 0.1s ease;
}

.task button:hover {
  color: #EF4444;
  transform: translateY(-1px);
}

/* Notes */

#notesArea {
  width: 100%;
  height: 260px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.4);
  background: rgba(255,255,255,0.35);
  backdrop-filter: blur(10px);
  padding: 12px;
  font-size: 13px;
  font-family: Inter, sans-serif;
  outline: none;
  resize: none;
}

/* Timers */

#pomodoro {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

#timerDisplay {
  font-size: 32px;
  font-weight: 600;
  color: var(--accent);
}

#timer-controls {
  display: flex;
  gap: 8px;
}

/* Preview mode */

.preview-mode #task-input {
  display: none;
}

.preview-mode .task input[type="checkbox"],
.preview-mode .task button,
.preview-mode .task input[type="time"],
.preview-mode .task span[contenteditable="true"] {
  pointer-events: none;
  opacity: 0.7;
}
7. script.js
js
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

const widget = document.getElementById("widget");
const container = document.getElementById("task-list");
const addBtn = document.getElementById("addTask");
const alertSound = document.getElementById("alertSound");
const modeToggle = document.getElementById("modeToggle");
const notesArea = document.getElementById("notesArea");

// ---------- DRAGGABLE WIDGET ----------
let offsetX, offsetY;

widget.addEventListener("mousedown", (e) => {
  if (
    e.target.tagName === "INPUT" ||
    e.target.tagName === "BUTTON" ||
    e.target.tagName === "SELECT" ||
    e.target.isContentEditable ||
    e.target.tagName === "TEXTAREA"
  ) return;

  offsetX = e.clientX - widget.offsetLeft;
  offsetY = e.clientY - widget.offsetTop;

  function move(ev) {
    widget.style.left = `${ev.clientX - offsetX}px`;
    widget.style.top = `${ev.clientY - offsetY}px`;
  }

  document.addEventListener("mousemove", move);

  document.addEventListener("mouseup", () => {
    document.removeEventListener("mousemove", move);
  }, { once: true });
});

// ---------- MODE TOGGLE ----------
modeToggle.addEventListener("click", () => {
  document.body.classList.toggle("preview-mode");
  const preview = document.body.classList.contains("preview-mode");
  modeToggle.innerText = preview ? "Edit" : "Preview";
});

// ---------- TABS ----------
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById("page-" + tab.dataset.page).classList.add("active");
  });
});

// ---------- TASKS: RENDER ----------
function renderTasks() {
  container.innerHTML = "";
  tasks.forEach((task, index) => {
    const el = document.createElement("div");
    el.className = "task";
    el.dataset.category = task.category;

    el.innerHTML = `
      <input type="checkbox" ${task.done ? "checked" : ""} onchange="toggleDone(${index})">
      <span contenteditable="true" onblur="updateTask(${index}, this.innerText)">${task.text}</span>
      <input type="time" value="${task.time || ""}" onchange="updateTime(${index}, this.value)" />
      <button title="Delete" onclick="deleteTask(${index})">✕</button>
    `;

    container.appendChild(el);
  });

  updateProgress();
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ---------- TASKS: CRUD ----------
function addTask() {
  const text = document.getElementById("taskText").value.trim();
  const time = document.getElementById("taskTime").value;
  const category = document.getElementById("taskCategory").value;

  if (!text) return;

  tasks.push({ text, time, category, done: false });
  renderTasks();

  document.getElementById("taskText").value = "";
}

function updateTask(index, newText) {
  tasks[index].text = newText.trim();
  renderTasks();
}

function updateTime(index, newTime) {
  tasks[index].time = newTime;
  renderTasks();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  renderTasks();
}

function toggleDone(index) {
  tasks[index].done = !tasks[index].done;
  renderTasks();
}

window.addTask = addTask;
window.updateTask = updateTask;
window.updateTime = updateTime;
window.deleteTask = deleteTask;
window.toggleDone = toggleDone;

// ---------- PROGRESS ----------
function updateProgress() {
  const doneCount = tasks.filter(t => t.done).length;
  const percent = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  document.getElementById("progress-bar").style.width = percent + "%";
  document.getElementById("progress-text").innerText = `${percent}% complete`;
}

// ---------- REMINDERS ----------
function checkReminders() {
  const now = new Date();
  const current = now.toTimeString().slice(0, 5);

  tasks.forEach(task => {
    if (task.time === current && !task.done && task.time) {
      if (window.trubblxAPI?.notify) {
        window.trubblxAPI.notify("Trubblx Reminder", task.text);
      } else if ("Notification" in window) {
        new Notification("Trubblx Reminder", {
          body: task.text,
          icon: "trubblx-icon.png"
        });
      }
      alertSound.currentTime = 0;
      alertSound.play();
    }
  });
}

// ---------- NOTES ----------
notesArea.value = localStorage.getItem("trubblxNotes") || "";
notesArea.addEventListener("input", () => {
  localStorage.setItem("trubblxNotes", notesArea.value);
});

// ---------- TIMERS (POMODORO) ----------
let timeLeft = 25 * 60;
let timerInterval;

function updateTimer() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  document.getElementById("timerDisplay").innerText =
    `${m}:${s.toString().padStart(2, "0")}`;
}

document.getElementById("startPomodoro").onclick = () => {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      if (window.trubblxAPI?.notify) {
        window.trubblxAPI.notify("Pomodoro Complete", "Take a break!");
      }
      alertSound.currentTime = 0;
      alertSound.play();
      timeLeft = 25 * 60;
      updateTimer();
    }
  }, 1000);
};

document.getElementById("resetPomodoro").onclick = () => {
  clearInterval(timerInterval);
  timeLeft = 25 * 60;
  updateTimer();
};

updateTimer();

// ---------- INIT ----------
addBtn.addEventListener("click", addTask);
setInterval(checkReminders, 60000);
renderTasks();
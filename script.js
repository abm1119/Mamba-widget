/* ---------------------------------------------------------
   MAMBA WIDGET — PRODUCTION SCRIPT (SECURE)
--------------------------------------------------------- */

// Utility for basic sanitization
const sanitize = (str) => {
  if (typeof str !== 'string') return '';
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
};

// Safe Task Data Loading/Validation
let tasks = [];
async function loadAndRender() {
  if (window.mambaAPI) {
    const loaded = await window.mambaAPI.loadTasks();
    if (Array.isArray(loaded)) {
      tasks = loaded;
    }
  }
  renderTasks();
}

const taskList = document.getElementById("task-list");
const addBtn = document.getElementById("addTask");
const alertSound = document.getElementById("alertSound");
const modeToggle = document.getElementById("modeToggle");
const notesArea = document.getElementById("notesArea");

/* MODE TOGGLE */
modeToggle.addEventListener("click", () => {
  document.body.classList.toggle("preview-mode");
  modeToggle.innerText = document.body.classList.contains("preview-mode")
    ? "Edit"
    : "Preview";
});

document.getElementById("hideWidget").addEventListener("click", () => {
  window.mambaAPI.toggleWidget();
});

/* TABS */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById("page-" + tab.dataset.page).classList.add("active");
  });
});

/* TASKS */
function renderTasks() {
  taskList.textContent = "";

  tasks.forEach((task, index) => {
    const row = document.createElement("div");
    row.className = `task ${task.done ? "done" : ""}`;
    row.dataset.category = task.category || "General";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!task.done;
    checkbox.addEventListener("change", () => toggleDone(index));

    const span = document.createElement("span");
    span.contentEditable = "true";
    span.textContent = task.text || "";
    span.addEventListener("blur", (e) => updateTask(index, e.target.textContent));

    const timeInput = document.createElement("input");
    timeInput.type = "time";
    timeInput.value = task.time || "";
    timeInput.addEventListener("change", (e) => updateTime(index, e.target.value));

    const delBtn = document.createElement("button");
    delBtn.innerText = "✕";
    delBtn.addEventListener("click", () => deleteTask(index));

    row.appendChild(checkbox);
    row.appendChild(span);
    row.appendChild(timeInput);
    row.appendChild(delBtn);

    taskList.appendChild(row);
  });

  updateProgress();
  if (window.mambaAPI) window.mambaAPI.saveTasks(tasks);
}

function addTask() {
  const textInput = document.getElementById("taskText");
  const timeInput = document.getElementById("taskTime");
  const categoryInput = document.getElementById("taskCategory");

  const text = textInput.value.trim();
  const time = timeInput.value;
  const category = categoryInput.value;

  if (!text) return;

  tasks.push({ text, time, category, done: false });
  renderTasks();

  textInput.value = "";
  timeInput.value = "";
  textInput.focus();
}

document.getElementById("taskText").addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});

function updateTask(index, newText) {
  if (!tasks[index]) return;
  tasks[index].text = newText.trim();
  if (window.mambaAPI) window.mambaAPI.saveTasks(tasks);
  updateProgress();
}

function updateTime(index, newTime) {
  if (!tasks[index]) return;
  tasks[index].time = newTime;
  if (window.mambaAPI) window.mambaAPI.saveTasks(tasks);
}

function deleteTask(index) {
  tasks.splice(index, 1);
  renderTasks();
}

function toggleDone(index) {
  if (!tasks[index]) return;
  tasks[index].done = !tasks[index].done;
  renderTasks();
}

/* PROGRESS */
function updateProgress() {
  const done = tasks.filter(t => t.done).length;
  const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const progressBar = document.getElementById("progress-bar");
  if (progressBar) progressBar.style.width = percent + "%";
  
  const progressText = document.getElementById("progress-text");
  if (progressText) progressText.innerText = `${percent}% complete`;
}

/* REMINDERS */
function checkReminders() {
  const now = new Date();
  const current = now.toTimeString().slice(0, 5);

  tasks.forEach(task => {
    if (task.time === current && !task.done && task.time) {
      if (window.mambaAPI) {
        // Sanitize before sending to Main
        window.mambaAPI.notify("Mamba Reminder", sanitize(task.text));
      }

      alertSound.currentTime = 0;
      alertSound.play().catch(e => console.error("Sound play failed:", e));
    }
  });
}

/* NOTES */
// Note: Notes are still in localStorage as they were not specifically requested to be encrypted, 
// but the same pattern could be applied if needed.
notesArea.value = localStorage.getItem("mambaNotes") || "";
notesArea.addEventListener("input", () => {
  localStorage.setItem("mambaNotes", notesArea.value);
});

/* TIMERS */
let timeLeft = 25 * 60;
let timerInterval = null;

function updateTimer() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  document.getElementById("timerDisplay").innerText =
    `${m}:${s.toString().padStart(2, "0")}`;
}

document.getElementById("startPomodoro").addEventListener("click", () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById("startPomodoro").innerText = "Start";
    document.body.classList.remove("timer-running");
    return;
  }

  document.getElementById("startPomodoro").innerText = "Pause";
  document.body.classList.add("timer-running");
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      document.getElementById("startPomodoro").innerText = "Start";
      document.body.classList.remove("timer-running");

      if (window.mambaAPI) {
        window.mambaAPI.notify("Pomodoro Complete", "Take a break!");
      }

      alertSound.currentTime = 0;
      alertSound.play().catch(e => console.error("Sound play failed:", e));

      timeLeft = 25 * 60;
      updateTimer();
    }
  }, 1000);
});

document.getElementById("resetPomodoro").addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;
  document.getElementById("startPomodoro").innerText = "Start";
  document.body.classList.remove("timer-running");
  timeLeft = 25 * 60;
  updateTimer();
});

updateTimer();

/* TEST ALERT */
document.getElementById("testAlert").addEventListener("click", () => {
  if (window.mambaAPI) {
    window.mambaAPI.notify("Mamba Test", "Your alerts are working perfectly! 🌿");
  }
  alertSound.currentTime = 0;
  alertSound.play().catch(e => {
    console.error("Sound play failed:", e);
    alert("Audio playback failed. Please click anywhere on the widget first to enable audio!");
  });
});

/* INIT */
addBtn.addEventListener("click", addTask);
setInterval(checkReminders, 60000);
loadAndRender();

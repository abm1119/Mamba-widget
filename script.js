/* ---------------------------------------------------------
   MAMBA WIDGET — PRODUCTION SCRIPT
--------------------------------------------------------- */

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

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
  taskList.innerHTML = "";

  tasks.forEach((task, index) => {
    const row = document.createElement("div");
    row.className = `task ${task.done ? "done" : ""}`;
    row.dataset.category = task.category;

    row.innerHTML = `
      <input type="checkbox" ${task.done ? "checked" : ""} onchange="toggleDone(${index})">
      <span contenteditable="true" onblur="updateTask(${index}, this.innerText)">${task.text}</span>
      <input type="time" value="${task.time || ""}" onchange="updateTime(${index}, this.value)" />
      <button onclick="deleteTask(${index})">✕</button>
    `;

    taskList.appendChild(row);
  });

  updateProgress();
  localStorage.setItem("tasks", JSON.stringify(tasks));
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

// Handle Enter key for task input
document.getElementById("taskText").addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});

function updateTask(index, newText) {
  tasks[index].text = newText.trim();
  localStorage.setItem("tasks", JSON.stringify(tasks));
  updateProgress();
}

function updateTime(index, newTime) {
  tasks[index].time = newTime;
  localStorage.setItem("tasks", JSON.stringify(tasks));
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

/* PROGRESS */
function updateProgress() {
  const done = tasks.filter(t => t.done).length;
  const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  document.getElementById("progress-bar").style.width = percent + "%";
  document.getElementById("progress-text").innerText = `${percent}% complete`;
}

/* REMINDERS */
function checkReminders() {
  const now = new Date();
  const current = now.toTimeString().slice(0, 5);

  tasks.forEach(task => {
    if (task.time === current && !task.done && task.time) {
      if (window.mambaAPI) {
        window.mambaAPI.notify("Mamba Reminder", task.text);
      }

      alertSound.currentTime = 0;
      alertSound.play().catch(e => console.log("Sound play failed:", e));
      
      // Mark as reminded so it doesn't fire every second if we checked more often
    }
  });
}

/* NOTES */
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

document.getElementById("startPomodoro").onclick = () => {
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
      alertSound.play().catch(e => console.log("Sound play failed:", e));

      timeLeft = 25 * 60;
      updateTimer();
    }
  }, 1000);
};

document.getElementById("resetPomodoro").onclick = () => {
  clearInterval(timerInterval);
  timerInterval = null;
  document.getElementById("startPomodoro").innerText = "Start";
  document.body.classList.remove("timer-running");
  timeLeft = 25 * 60;
  updateTimer();
};

updateTimer();

/* TEST ALERT */
document.getElementById("testAlert").onclick = () => {
  if (window.mambaAPI) {
    window.mambaAPI.notify("Mamba Test", "Your alerts are working perfectly! 🌿");
  }
  alertSound.currentTime = 0;
  alertSound.play().catch(e => {
    console.log("Sound play failed:", e);
    alert("Audio playback failed. Please click anywhere on the widget first to enable audio!");
  });
};

/* INIT */
addBtn.addEventListener("click", addTask);
setInterval(checkReminders, 60000);
renderTasks();

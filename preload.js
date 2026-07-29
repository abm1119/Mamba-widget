const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mambaAPI", {
  notify: (title, body) => {
    ipcRenderer.send("show-notification", { title, body });
  },
  toggleWidget: () => {
    ipcRenderer.send("toggle-widget");
  },
  saveTasks: (tasks) => {
    ipcRenderer.send("save-tasks", tasks);
  },
  loadTasks: () => {
    return ipcRenderer.invoke("load-tasks");
  }
});

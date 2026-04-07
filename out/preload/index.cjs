"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  minimize: () => electron.ipcRenderer.send("window:minimize"),
  maximize: () => electron.ipcRenderer.send("window:maximize"),
  close: () => electron.ipcRenderer.send("window:close"),
  homedir: () => electron.ipcRenderer.invoke("app:homedir"),
  cameras: (params) => electron.ipcRenderer.invoke("dvr:cameras", params),
  timestamps: (params) => electron.ipcRenderer.invoke("dvr:timestamps", params),
  dvrBasePath: () => electron.ipcRenderer.invoke("dvr:basePath")
});

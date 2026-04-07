import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
    minimize: () => ipcRenderer.send("window:minimize"),
    maximize: () => ipcRenderer.send("window:maximize"),
    close: () => ipcRenderer.send("window:close"),
    homedir: () => ipcRenderer.invoke("app:homedir"),
    cameras: (params: { company: number; location: number; date: string }) =>
        ipcRenderer.invoke("dvr:cameras", params),
    timestamps: (params: { company: number; location: number; date: string; camera: number }) =>
        ipcRenderer.invoke("dvr:timestamps", params),
    dvrBasePath: () => ipcRenderer.invoke("dvr:basePath"),
});

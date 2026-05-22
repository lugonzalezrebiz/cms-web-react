import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
    minimize: () => ipcRenderer.send("window:minimize"),
    maximize: () => ipcRenderer.send("window:maximize"),
    close: () => ipcRenderer.send("window:close"),

    homedir: () => ipcRenderer.invoke("app:homedir"),
    cameras: (params: { company: number; location: number; date: string }) =>
        ipcRenderer.invoke("dvr:cameras", params),
    timestamps: (params: {
        company: number;
        location: number;
        date: string;
        camera: number;
    }) => ipcRenderer.invoke("dvr:timestamps", params),
    dvrBasePath: () => ipcRenderer.invoke("dvr:basePath"),
    crashContext: () => ipcRenderer.invoke("crash:context"),
    logCrash: (payload: unknown) => ipcRenderer.invoke("crash:log", payload),

    checkForUpdates: () => ipcRenderer.invoke("update:check"),
    downloadUpdate: () => ipcRenderer.invoke("update:download"),
    installUpdate: () => ipcRenderer.invoke("update:install"),

    onUpdateAvailable: (callback: (info: unknown) => void) => {
        ipcRenderer.on("update:available", (_, info) => callback(info));
    },

    onUpdateProgress: (callback: (progress: { percent: number }) => void) => {
        ipcRenderer.on("update:progress", (_, progress) => callback(progress));
    },

    onUpdateDownloaded: (callback: (info: unknown) => void) => {
        ipcRenderer.on("update:downloaded", (_, info) => callback(info));
    },

    onUpdateError: (callback: (error: { message: string }) => void) => {
        ipcRenderer.on("update:error", (_, error) => callback(error));
    },
});

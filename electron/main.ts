import { app, BrowserWindow, ipcMain, protocol } from "electron";
import path from "path";
import os from "os";
import fs from "fs/promises";
import { config } from "dotenv";
import updater from "electron-updater";

const { autoUpdater } = updater;

// Load .env from the project root (works in both dev and prod)
config({ path: path.join(app.getAppPath(), ".env") });

const DVR_BASE = process.env.DVR_BASE ?? path.join(os.homedir(), "DVR Bot");
// Must be called before app.whenReady()
protocol.registerSchemesAsPrivileged([
    {
        scheme: "dvr",
        privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true },
    },
]);

function setupAutoUpdater(win: BrowserWindow) {
    if (!app.isPackaged) {
        return;
    }

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.setFeedURL({
        provider: "generic",
        url: "https://cmsweb.rebiz.com/downloads",
    });

    autoUpdater.on("checking-for-update", () => {
        win.webContents.send("update:checking");
    });

    autoUpdater.on("update-available", (info) => {
        win.webContents.send("update:available", info);
    });

    autoUpdater.on("update-not-available", (info) => {
        win.webContents.send("update:not-available", info);
    });

    autoUpdater.on("download-progress", (progress) => {
        win.webContents.send("update:progress", {
            percent: progress.percent,
            transferred: progress.transferred,
            total: progress.total,
            bytesPerSecond: progress.bytesPerSecond,
        });
    });

    autoUpdater.on("update-downloaded", (info) => {
        win.webContents.send("update:downloaded", info);

        setTimeout(() => {
            autoUpdater.quitAndInstall(false, true);
        }, 1500);
    });

    autoUpdater.on("error", (error) => {
        win.webContents.send("update:error", {
            message: error.message,
            stack: error.stack,
        });
    });

    ipcMain.handle("update:check", async () => {
        return autoUpdater.checkForUpdates();
    });

    ipcMain.handle("update:restart", () => {
        autoUpdater.quitAndInstall(false, true);
    });

    setTimeout(() => {
        autoUpdater.checkForUpdates().catch((error) => {
            win.webContents.send("update:error", {
                message: error.message,
                stack: error.stack,
            });
        });
    }, 3000);
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        show: false,
        icon: path.join(__dirname, "../../public/assets/rebiz-icon-1.png"),
        webPreferences: {
            preload: path.join(__dirname, "../preload/index.cjs"),
        },
    });

    ipcMain.on("window:minimize", () => win.minimize());
    ipcMain.on("window:maximize", () => {
        if (win.isMaximized()) win.unmaximize();
        else win.maximize();
    });
    ipcMain.on("window:close", () => win.close());

    ipcMain.handle("app:homedir", () => os.homedir());
    ipcMain.handle("dvr:basePath", () => DVR_BASE);

    // Returns sorted array of seconds-since-midnight for every image in a camera folder.
    // Called once per camera per session — result is cached in the renderer.
    ipcMain.handle(
        "dvr:timestamps",
        async (_, { company, location, date, camera }: { company: number; location: number; date: string; camera: number }) => {
            const dir = path.join(DVR_BASE, String(company), String(location), String(date), String(camera));
            try {
                const files = await fs.readdir(dir);
                return files
                    .filter((f) => f.endsWith(".jpg"))
                    .map((f) => {
                        // filename: YYMMDD_HHMMSS.jpg → time part "HHMMSS"
                        const ts = f.split("_")[1]?.replace(".jpg", "");
                        if (!ts || ts.length !== 6) return null;
                        return (
                            Number(ts.slice(0, 2)) * 3600 +
                            Number(ts.slice(2, 4)) * 60 +
                            Number(ts.slice(4, 6))
                        );
                    })
                    .filter((t): t is number => t !== null)
                    .sort((a, b) => a - b);
            } catch (error) {
                console.log(`Failed to read timestamps from ${dir}`, error);
                return [];
            }
        },
    );

    ipcMain.handle(
        "dvr:cameras",
        async (_, { company, location, date }: { company: number; location: number; date: string }) => {
            const dir = path.join(DVR_BASE, String(company), String(location), String(date));
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                return entries
                    .filter((e) => e.isDirectory())
                    .map((e) => ({ id: Number(e.name), name: `Camera ${e.name}` }))
                    .sort((a, b) => a.id - b.id);
            } catch {
                return [];
            }
        },
    );

    setupAutoUpdater(win);

    win.once("ready-to-show", () => {
        win.maximize();
        win.show();
    });

    if (process.env.ELECTRON_RENDERER_URL) {
        win.loadURL(process.env.ELECTRON_RENDERER_URL);
    } else {
        win.loadFile("out/renderer/index.html");
    }
}

app.whenReady().then(() => {
    // Register protocol BEFORE creating the window
    protocol.handle("dvr", async (request) => {
        const url = new URL(request.url);
        // dvr://local/{company}/{location}/{date}/{camera}/{filename}
        // hostname is fixed as "local"; full path is in url.pathname
        const filePath = path.join(DVR_BASE, url.pathname);
        try {
            const data = await fs.readFile(filePath);
            return new Response(data, { headers: { "content-type": "image/jpeg" } });
        } catch {
            return new Response(null, { status: 404 });
        }
    });

    if (process.platform === "darwin") {
        app.dock?.setIcon(path.join(__dirname, "../../public/assets/rebiz-icon-1.png"));
    }

    createWindow();
});

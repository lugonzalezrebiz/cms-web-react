import { app, BrowserWindow, ipcMain, protocol } from "electron";
import path from "path";
import os from "os";
import fs from "fs/promises";

const DVR_BASE = process.env.DVR_BASE ?? path.join(os.homedir(), "DVR Bot");

// Must be called before app.whenReady()
protocol.registerSchemesAsPrivileged([
    {
        scheme: "dvr",
        privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true },
    },
]);

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        show: false,
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
                        // filename: 20260121_080000.jpg → time part "080000"
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
            } catch {
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

    createWindow();
});

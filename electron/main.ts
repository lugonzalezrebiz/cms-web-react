import { app, BrowserWindow, ipcMain, protocol, Menu, globalShortcut, session } from "electron";
import path from "path";
import os from "os";
import fs from "fs/promises";
import { config } from "dotenv";
import updater from "electron-updater";

const { autoUpdater } = updater;

// Load .env from the project root (works in both dev and prod)
config({ path: path.join(app.getAppPath(), ".env") });

const DVR_BASE = process.env.DVR_BASE ?? path.join(os.homedir(), "DVR Bot");

// Interface name/description patterns used by common VPN clients and OS-level tunnel adapters.
const VPN_INTERFACE_PATTERN =
    /(vpn|tun|tap|ppp|wg|wireguard|nordlynx|utun|zerotier|tailscale|openvpn|pia|l2tp|ipsec|pptp)/i;

function isVpnActive() {
    const interfaces = os.networkInterfaces();
    return Object.entries(interfaces).some(([name, addresses]) => {
        if (!VPN_INTERFACE_PATTERN.test(name)) return false;
        return (addresses ?? []).some((addr) => !addr.internal);
    });
}

type CrashLogPayload = {
    eventType: string;
    severity: string;
    message: string;
    stack?: string;
    componentStack?: string;
    timestamp?: string;
    appContext?: Record<string, unknown>;
    userContext?: Record<string, unknown>;
    workflowContext?: Record<string, unknown>;
    breadcrumbs?: unknown[];
};

const trimWrappedQuotes = (value: string) =>
    value.replace(/^[\'"]|[\'"]$/g, "");

function getCrashLogEndpoint() {
    const explicitUrl = process.env.CRASH_LOG_URL?.trim();
    if (explicitUrl) return trimWrappedQuotes(explicitUrl);

    const rawHost = process.env.VITE_HOST?.trim();
    const rawApiUrl = process.env.VITE_URL_API?.trim() || "/api/";
    const host = rawHost ? trimWrappedQuotes(rawHost).replace(/\/+$/, "") : "";
    const apiUrl = trimWrappedQuotes(rawApiUrl);

    if (/^https?:\/\//i.test(apiUrl)) {
        return new URL(
            "log/crash",
            apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`,
        ).toString();
    }

    if (!host) return null;

    const normalizedApiPath = apiUrl.startsWith("/") ? apiUrl : `/${apiUrl}`;
    return new URL(
        "log/crash",
        `${host}${normalizedApiPath.endsWith("/") ? normalizedApiPath : `${normalizedApiPath}/`}`,
    ).toString();
}

function getMachineContext() {
    return {
        appVersion: app.getVersion(),
        appName: app.getName(),
        isPackaged: app.isPackaged,
        platform: process.platform,
        arch: process.arch,
        osRelease: os.release(),
        osType: os.type(),
        hostname: os.hostname(),
        cpuCount: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        electronVersion: process.versions.electron,
        chromeVersion: process.versions.chrome,
        nodeVersion: process.versions.node,
    };
}

function flattenCrashPayload(payload: CrashLogPayload) {
    const appContext = payload.appContext ?? {};
    const userContext = payload.userContext ?? {};
    const workflowContext = payload.workflowContext ?? {};

    return {
        userID: userContext.userID ?? null,
        roleID: userContext.roleID ?? null,

        appVersion: appContext.appVersion ?? app.getVersion(),
        os: appContext.osType ?? appContext.platform ?? process.platform,

        deviceInfo: {
            appName: appContext.appName,
            isPackaged: appContext.isPackaged,
            platform: appContext.platform,
            arch: appContext.arch,
            osRelease: appContext.osRelease,
            osType: appContext.osType,
            hostname: appContext.hostname,
            cpuCount: appContext.cpuCount,
            totalMemory: appContext.totalMemory,
            freeMemory: appContext.freeMemory,
            electronVersion: appContext.electronVersion,
            chromeVersion: appContext.chromeVersion,
            nodeVersion: appContext.nodeVersion,
            userAgent: appContext.userAgent,
            viewport: appContext.viewport,
        },

        route: workflowContext.route ?? null,
        workflow: workflowContext.workflow ?? workflowContext.screen ?? null,
        monitoringID: workflowContext.monitoringID ?? null,
        locationID:
            workflowContext.locationID ?? workflowContext.storeID ?? null,

        eventType: payload.eventType,
        severity: payload.severity,
        message: payload.message,
        stack: payload.stack ?? payload.componentStack ?? null,

        metadata: {
            timestamp: payload.timestamp,
            appContext,
            userContext,
            workflowContext,
            breadcrumbs: payload.breadcrumbs ?? [],
        },
    };
}

async function sendCrashLog(payload: CrashLogPayload) {
    const endpoint = getCrashLogEndpoint();
    const finalPayload = {
        ...payload,
        timestamp: payload.timestamp ?? new Date().toISOString(),
        appContext: {
            ...getMachineContext(),
            processType: "main",
            ...(payload.appContext ?? {}),
        },
    };

    if (!endpoint) {
        console.error("Crash log endpoint is not configured", finalPayload);
        return { ok: false, reason: "Crash log endpoint is not configured" };
    }

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(flattenCrashPayload(finalPayload)),
        });

        return { ok: response.ok, status: response.status };
    } catch (error) {
        console.error("Failed to send crash log", error);
        return {
            ok: false,
            reason: error instanceof Error ? error.message : String(error),
        };
    }
}

function setupMainCrashHandlers() {
    process.on("uncaughtException", (error) => {
        void sendCrashLog({
            eventType: "main-uncaught-exception",
            severity: "fatal",
            message: error.message,
            stack: error.stack,
        });
    });

    process.on("unhandledRejection", (reason) => {
        const error =
            reason instanceof Error ? reason : new Error(String(reason));
        void sendCrashLog({
            eventType: "main-unhandled-rejection",
            severity: "fatal",
            message: error.message,
            stack: error.stack,
        });
    });
}

// Must be called before app.whenReady()
protocol.registerSchemesAsPrivileged([
    {
        scheme: "dvr",
        privileges: {
            secure: true,
            standard: true,
            supportFetchAPI: true,
            corsEnabled: true,
        },
    },
]);

setupMainCrashHandlers();

function setupAutoUpdater(win: BrowserWindow) {
    if (!app.isPackaged) {
        return;
    }

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;

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

    ipcMain.handle("update:download", async () => {
        return autoUpdater.downloadUpdate();
    });

    ipcMain.handle("update:install", () => {
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
        frame: true,
        show: false,
        autoHideMenuBar: true,
        icon: path.join(__dirname, "../../public/assets/rebiz-icon-1.png"),
        webPreferences: {
            preload: path.join(__dirname, "../preload/index.cjs"),
        },
    });

    win.setMenuBarVisibility(false);
    // show dev tools
    if (
        process.env.NODE_ENV === "development" ||
        process.env.PRODUCTION === "false"
    ) {
        win.webContents.openDevTools();
    }

    ipcMain.on("window:minimize", () => win.minimize());
    ipcMain.on("window:maximize", () => {
        if (win.isMaximized()) win.unmaximize();
        else win.maximize();
    });
    ipcMain.on("window:close", () => win.close());

    ipcMain.handle("app:homedir", () => os.homedir());
    ipcMain.handle("dvr:basePath", () => DVR_BASE);
    ipcMain.handle("crash:context", () => getMachineContext());
    ipcMain.handle("crash:log", async (_, payload: CrashLogPayload) => {
        return sendCrashLog({
            ...payload,
            appContext: {
                ...(payload?.appContext ?? {}),
                processType: "renderer",
            },
        });
    });

    ipcMain.handle("vpn:check", () => isVpnActive());

    win.webContents.on("unresponsive", () => {
        void sendCrashLog({
            eventType: "renderer-unresponsive",
            severity: "warning",
            message: "Renderer window became unresponsive",
            appContext: {
                processType: "renderer",
                url: win.webContents.getURL(),
            },
        });
    });

    win.webContents.on("render-process-gone", (_, details) => {
        void sendCrashLog({
            eventType: "renderer-process-gone",
            severity: details.reason === "crashed" ? "fatal" : "error",
            message: `Renderer process ended: ${details.reason}`,
            appContext: {
                processType: "renderer",
                url: win.webContents.getURL(),
                reason: details.reason,
                exitCode: details.exitCode,
            },
        });
    });

    // Returns sorted array of seconds-since-midnight for every image in a camera folder.
    // Called once per camera per session — result is cached in the renderer.
    ipcMain.handle(
        "dvr:timestamps",
        async (
            _,
            {
                company,
                location,
                date,
                camera,
            }: {
                company: number;
                location: number;
                date: string;
                camera: number;
            },
        ) => {
            const dir = path.join(
                DVR_BASE,
                String(company),
                String(location),
                String(date),
                String(camera),
            );
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
            } catch {
                return [];
            }
        },
    );

    ipcMain.handle(
        "dvr:cameras",
        async (
            _,
            {
                company,
                location,
                date,
            }: { company: number; location: number; date: string },
        ) => {
            const dir = path.join(
                DVR_BASE,
                String(company),
                String(location),
                String(date),
            );
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                return entries
                    .filter((e) => e.isDirectory())
                    .map((e) => ({
                        id: Number(e.name),
                        name: `Camera ${e.name}`,
                    }))
                    .sort((a, b) => a.id - b.id);
            } catch {
                return [];
            }
        },
    );

    setupAutoUpdater(win);

    app.on("browser-window-focus", () => {
        globalShortcut.register("CommandOrControl+Shift+I", () => {
            win.webContents.toggleDevTools();
        });
        globalShortcut.register("CommandOrControl+R", () => {
            win.webContents.reload();
        });
    });
    app.on("browser-window-blur", () => {
        globalShortcut.unregisterAll();
    });

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

// Electron denies all permission requests (geolocation, camera, etc.) by default and shows
// no prompt UI of its own — without this, navigator.geolocation fails silently as if the
// user had denied it.
function setupPermissions() {
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
        callback(permission === "geolocation");
    });
    session.defaultSession.setPermissionCheckHandler(
        (_webContents, permission) => permission === "geolocation",
    );
}

app.whenReady().then(() => {
    Menu.setApplicationMenu(null); // Disable default menu
    setupPermissions();

    // Register protocol BEFORE creating the window
    protocol.handle("dvr", async (request) => {
        const url = new URL(request.url);
        // dvr://local/{company}/{location}/{date}/{camera}/{filename}
        // hostname is fixed as "local"; full path is in url.pathname
        const filePath = path.join(DVR_BASE, url.pathname);
        try {
            const data = await fs.readFile(filePath);
            return new Response(data, {
                headers: { "content-type": "image/jpeg" },
            });
        } catch {
            return new Response(null, { status: 404 });
        }
    });

    if (process.platform === "darwin") {
        app.dock?.setIcon(
            path.join(__dirname, "../../public/assets/rebiz-icon-1.png"),
        );
    }

    createWindow();
});

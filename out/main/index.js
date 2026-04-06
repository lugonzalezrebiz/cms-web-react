import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.cjs")
    }
  });
  ipcMain.on("window:minimize", () => win.minimize());
  ipcMain.on("window:maximize", () => {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.on("window:close", () => win.close());
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
app.whenReady().then(createWindow);

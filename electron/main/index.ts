import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  desktopCapturer,
  dialog,
  nativeImage,
} from "electron";
import { release } from "node:os";
import { join } from "node:path";
import { update } from "./update";
import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from "electron-devtools-installer";
import { Store } from "./store";
import { writeFile } from "fs";

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, "../");
process.env.DIST = join(process.env.DIST_ELECTRON, "../dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, "../public")
  : process.env.DIST;

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
// Here, you can also use other preload
const preload = join(__dirname, "../preload/index.js");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, "index.html");

// First instantiate the class
const store = new Store({
  configName: "config",
});

async function createWindow() {
  win = new BrowserWindow({
    title: "Main window",
    icon: join(process.env.PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    // electron-vite-vue#298
    win.loadURL(url);
    // Open devTool if the app is not packaged
    win.webContents.once("dom-ready", async () => {
      await installExtension(REDUX_DEVTOOLS)
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log("An error occurred: ", err));

      await installExtension(REACT_DEVELOPER_TOOLS)
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log("An error occurred: ", err));
      win.webContents.openDevTools();
    });
    // uncomment to potentially debug max event emitter warning
    // process.on('warning', (e) => console.warn(e.stack));
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });

  // Apply electron-updater
  update(win);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

ipcMain.handle("get-video-sources", async (_) => {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });
  const sources = inputSources.map((source: Electron.DesktopCapturerSource) => {
    return {
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
    };
  });
  return sources;
});

ipcMain.handle("get-stream", async (_, sourceId) => {
  const constraints = {
    audio: false,
    video: {
      chromeMediaSource: "desktop",
      chromeMediaSourceId: sourceId,
    },
  };

  const stream = await (navigator.mediaDevices as any).getUserMedia(
    constraints
  );
  console.log(stream);
  return stream;
});

ipcMain.handle("get-recordings", async (_) => {
  const recordings = store.get("recordings");
  return recordings;
});

ipcMain.handle("save-video", async (_, fileName, arrayBuffer, dialogLabel) => {
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: dialogLabel,
    defaultPath: `${app.getPath("userData")}/${fileName}`,
  });

  console.log(arrayBuffer);
  const buffer = Buffer.from(arrayBuffer);
  writeFile(filePath, buffer, async () => {
    const thumbnail = await nativeImage
      .createThumbnailFromPath(filePath, {
        height: 64,
        width: 64,
      })
      .then((t) => t.toDataURL())
      .catch((err) => null);
    store.append("recordings", {
      filePath: filePath,
      isHighlight: false,
      date: Date.now(),
      thumbnail: thumbnail ? thumbnail : {},
    });

    console.log("Video saved!");
  });
});

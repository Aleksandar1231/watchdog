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
import fs, { writeFile, readFileSync } from "fs";
import ffmpeg from "fluent-ffmpeg";
import { parse as csvParse } from "csv-parse";
import { BufferTime, Recording, VideoQuality } from "../types";

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
  return stream;
});

ipcMain.handle("get-recordings", async (_) => {
  const recordings = store.get("recordings");
  const filteredRecordings = recordings.filter((recording) =>
    fs.existsSync(recording.filePath)
  );
  store.set("recordings", filteredRecordings);
  return filteredRecordings;
});

ipcMain.handle("get-config", async (_) => {
  const recordings = store.get("config");
  return recordings;
});

ipcMain.handle(
  "save-config",
  async (
    _,
    logFilePath?: string,
    videoQuality?: VideoQuality,
    autoDelete?: boolean,
    preBufferSeconds?: BufferTime,
    postBufferSeconds?: BufferTime
  ) => {
    store.set("config", {
      logFilePath: logFilePath,
      videoQuality: videoQuality,
      autoDelete: autoDelete,
      preBufferSeconds: preBufferSeconds,
      postBufferSeconds: postBufferSeconds,
    });
    console.log(store.get("config"));
  }
);

ipcMain.handle("open-directory", async (_) => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
  });
  if (!result.canceled) {
    return result.filePaths[0];
  } else return "";
});

ipcMain.handle("default-log-location", async (_) => {
  return `${app.getPath(
    "home"
  )}/Library/Logs/Guerrilla Trading Platform/events_log.csv`;
});

ipcMain.handle(
  "save-video",
  async (_, fileName, arrayBuffer, dialogLabel, startTime, duration, date) => {
    const { filePath } = await dialog.showSaveDialog({
      buttonLabel: dialogLabel,
      defaultPath: `${app.getPath("userData")}/${fileName}`,
    });

    const buffer = Buffer.from(arrayBuffer);
    writeFile(filePath, buffer, async () => {
      const thumbnail = await nativeImage
        .createThumbnailFromPath(filePath, {
          height: 64,
          width: 64,
        })
        .then((t) => t.toDataURL())
        .catch((err) => console.log(err));
      store.append("recordings", {
        filePath: filePath,
        isHighlight: false,
        startTime: startTime,
        duration: duration,
        date: date,
        thumbnail: thumbnail ? thumbnail : {},
      });
      console.log(filePath);
      splitVideo(filePath);
    });
  }
);

function convertMilliToSeconds(milli: number) {
  const seconds = Math.floor(milli / 1000);
  return seconds;
}

function getTimeSegments(
  eventTimestamps: number[],
  startTime: number,
  endTime: number
) {
  const preBuffer = store.get("config")["preBufferSeconds"];
  const postBuffer = store.get("config")["postBufferSeconds"];
  const preBufferMilliseconds = convertBufferTimeToMilliseconds(preBuffer);
  const postBufferMilliseconds = convertBufferTimeToMilliseconds(postBuffer);
  const segments = eventTimestamps.map((timestamp) => {
    const startSegmentMilliseconds = Math.max(
      timestamp - startTime - preBufferMilliseconds,
      0
    );
    const endSegmentMilliseconds = Math.min(
      timestamp - startTime + postBufferMilliseconds,
      endTime
    );
    return {
      start: convertMilliToSeconds(startSegmentMilliseconds),
      end: convertMilliToSeconds(endSegmentMilliseconds),
    };
  });
  return segments;
}

function convertBufferTimeToMilliseconds(bufferTime: BufferTime) {
  switch (bufferTime) {
    case "2 seconds":
      return 2000;
    case "5 seconds":
      return 5000;
    case "10 seconds":
      return 10000;
  }
}

async function splitVideo(filePath: string) {
  if (fs.existsSync(filePath)) {
    const recording = store
      .get("recordings")
      .find((recording) => recording.filePath === filePath);

    const eventTimestamps = await filterEventsLog(recording);
    const endTime = recording.startTime + recording.duration;
    const segments = getTimeSegments(
      eventTimestamps,
      recording.startTime,
      endTime
    );
    if (segments.length === 0) return;

    const outputPath = `${app.getPath("userData")}/recording-${
      recording.date
    }-highlight`;

    const segmentPaths: string[] = [];

    try {
      // Split the video into segments
      for (let i = 0; i < segments.length; i++) {
        const { start, end } = segments[i];
        const segmentPath = `${outputPath}-part${i + 1}.mp4`;
        segmentPaths.push(segmentPath);

        await new Promise<void>((resolve, reject) => {
          ffmpeg(filePath)
            .setStartTime(start)
            .setDuration(end - start)
            .output(segmentPath)
            .on("error", (err) => {
              reject(err);
            })
            .on("end", () => {
              resolve();
            })
            .run();
        });
      }

      // Merge the segments into one file
      const inputPaths = segmentPaths;
      const command = ffmpeg();
      inputPaths.forEach((inputPath) => {
        command.input(inputPath);
      });
      command
        .mergeToFile(`${outputPath}.mp4`, app.getPath("userData"))
        .on("end", async () => {
          // Delete the temporary segment files
          for (const segmentPath of segmentPaths) {
            await fs.promises.unlink(segmentPath);
          }
          const thumbnail = await nativeImage
            .createThumbnailFromPath(`${outputPath}.mp4`, {
              height: 64,
              width: 64,
            })
            .then((t) => t.toDataURL())
            .catch((err) => console.log(err));

          store.append("recordings", {
            filePath: `${outputPath}.mp4`,
            isHighlight: true,
            startTime: recording.startTime,
            duration: recording.duration,
            date: recording.date,
            thumbnail: thumbnail ? thumbnail : {},
          });
        })
        .on("error", async (err) => {
          throw err;
        });
    } catch (err) {
      // Delete the temporary segment files if an error occurs
      for (const segmentPath of segmentPaths) {
        try {
          await fs.promises.unlink(segmentPath);
        } catch (e) {
          // Ignore errors when deleting files
        }
      }
      console.log(err);
    }
  }
}

async function filterEventsLog(recording: Recording) {
  const eventsFile = store.get("config")["logFilePath"];
  const startTime = recording.startTime;
  const endTime = recording.startTime + recording.duration;
  const records = await parseEventLog(eventsFile);
  const timestamps = await getFilteredTimestamps(records, startTime, endTime);
  return timestamps;
}

async function parseEventLog(csvFilePath: string) {
  const records = [];
  console.log(csvFilePath);
  const parser = csvParse({
    delimiter: ",",
  });
  parser.on("readable", () => {
    let record;
    while ((record = parser.read())) {
      records.push(record);
    }
  });

  const stream = fs.createReadStream(csvFilePath);
  stream.pipe(parser);
  return new Promise((resolve, reject) => {
    parser.on("error", (err: any) => console.log(err));
    parser.on("end", () => resolve(records));
  });
}

function getFilteredTimestamps(
  records: any,
  startTime: number,
  endTime: number
) {
  const dates = records.map((record) => record[0]);
  const timestamps = dates.map((date) => Date.parse(date));
  const filteredTimestamp = timestamps.filter(
    (timestamp) => timestamp >= startTime && timestamp <= endTime
  );
  return filteredTimestamp;
}
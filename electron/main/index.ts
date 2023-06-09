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
import { BufferTime, Config, Recording, VideoQuality } from "../types";
import { spawn } from "child_process";

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

// First instantiate the config files
const configStore = new Store({
  configName: "config",
});
getConfig();

const recordingStore = new Store({
  configName: "recordings",
});

function getConfig() {
  let config = configStore.get("config");
  if (!config) {
    configStore.set("config", {
      // logFilePath: `${app.getPath(
      //   "home"
      // )}/Library/Logs/Guerrilla Trading Platform/events_log_${formattedDate}.csv`,
      videoQuality: "Low",
      autoDelete: false,
      preBufferSeconds: "2 seconds",
      postBufferSeconds: "2 seconds",
    });
    config = configStore.get("config");
  }
  return config;
}

function saveConfig(config: Config, event?: Electron.IpcMainInvokeEvent) {
  configStore.set("config", config);
  const newConfig = configStore.get("config");
  event && event.sender.send("config-save-complete", newConfig);
  return newConfig;
}

function getRecordings() {
  const data = recordingStore.get();
  const result: Recording[] = data
    ? Object.values(data).map((v) => {
        return {
          filePath: v.filePath,
          thumbnail: v.thumbnail,
          date: v.date,
          duration: v.duration,
          startTime: v.startTime,
          highlight: v.highlight,
          highlightState: v.highlightState,
          voiceoverState: v.voiceoverState,
          voiceover: v.voiceover,
        };
      })
    : [];
  const filteredRecordings = result?.filter((recording) =>
    fs.existsSync(recording.filePath)
  );

  filteredRecordings?.forEach((filteredRecording) => {
    if (
      filteredRecording.highlightState &&
      (!filteredRecording.highlight ||
        !fs.existsSync(filteredRecording.highlight.filePath))
    ) {
      recordingStore.set(filteredRecording.filePath, {
        filePath: filteredRecording.filePath,
        thumbnail: filteredRecording.thumbnail,
        date: filteredRecording.date,
        duration: filteredRecording.duration,
        startTime: filteredRecording.startTime,
      });
    }
    if (
      filteredRecording.voiceoverState &&
      (!filteredRecording.voiceover ||
        !fs.existsSync(filteredRecording.voiceover.filePath))
    ) {
      recordingStore.set(filteredRecording.filePath, {
        filePath: filteredRecording.filePath,
        thumbnail: filteredRecording.thumbnail,
        date: filteredRecording.date,
        duration: filteredRecording.duration,
        startTime: filteredRecording.startTime,
        highlight: filteredRecording.highlight,
        highlightState: filteredRecording.highlightState,
      });
    }
  });

  if (filteredRecordings?.length !== result.length) {
    recordingStore.clear();
    filteredRecordings.forEach((filteredRecording) => {
      recordingStore.set(filteredRecording.filePath, filteredRecording);
    });
  }

  return filteredRecordings;
}

function saveRecording(
  filePath: string,
  recording: Recording,
  event?: Electron.IpcMainInvokeEvent
) {
  recordingStore.set(filePath, recording);
  const recordings = recordingStore.get();
  win.webContents.send("recording-save", recordings);
  return recordings;
}

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
  return getRecordings();
});

ipcMain.handle("get-config", async (_) => {
  return getConfig();
});

ipcMain.handle(
  "save-config",
  async (
    event,
    //logFilePath?: string,
    videoQuality?: VideoQuality,
    autoDelete?: boolean,
    preBufferSeconds?: BufferTime,
    postBufferSeconds?: BufferTime
  ) => {
    const config = saveConfig(
      {
        ...getConfig(),
        //...(logFilePath && { logFilePath }),
        ...(videoQuality && { videoQuality }),
        ...(autoDelete !== undefined && { autoDelete }),
        ...(preBufferSeconds && { preBufferSeconds }),
        ...(postBufferSeconds && { postBufferSeconds }),
      },
      event
    );
    console.log(config);
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
  "save-voiceover",
  async (event, fileName, highlightPath, arrayBuffer, dialogLabel) => {
    const { filePath } = await dialog.showSaveDialog({
      buttonLabel: dialogLabel,
      defaultPath: `${app.getPath("userData")}/${fileName}`,
    });
    const buffer = Buffer.from(arrayBuffer);
    writeFile(filePath, buffer, async () => {
      mergeVoiceover(filePath, highlightPath);
    });
  }
);

ipcMain.handle(
  "save-video",
  async (
    event,
    fileName,
    arrayBuffer,
    dialogLabel,
    startTime,
    duration,
    date
  ) => {
    const { filePath } = await dialog.showSaveDialog({
      buttonLabel: dialogLabel,
      defaultPath: `${app.getPath("userData")}/${fileName}`,
    });

    const buffer = Buffer.from(arrayBuffer);
    writeFile(filePath, buffer, async () => {
      const screenshotPath = await generateThumbnail(filePath);
      const image = nativeImage.createFromPath(screenshotPath);
      const thumbnailSize = { width: 64, height: 64 };
      image.resize(thumbnailSize);
      const thumbnail = image.toDataURL();
      saveRecording(
        filePath,
        {
          filePath: filePath,
          startTime: startTime,
          duration: duration,
          date: date,
          thumbnail: thumbnail ? thumbnail : "",
        },
        event
      );
      await fs.promises.unlink(screenshotPath);
      console.log(filePath);
      splitAndMergeVideo(filePath, event);
    });
  }
);

ipcMain.handle("generate-highlights", (event, filePath) => {
  console.log(filePath);
  splitAndMergeVideo(filePath, event);
});

async function generateThumbnail(filePath) {
  const timestamp = formatTime(1);
  const tempPath = `${filePath}-thumbnail.png`;
  const ffmpegArgs = [
    "-i",
    filePath,
    "-ss",
    timestamp,
    "-vframes",
    1,
    tempPath,
  ];
  const ffmpeg = spawn("ffmpeg", ffmpegArgs);

  return await new Promise<string>((resolve, reject) => {
    ffmpeg
      .on("error", (err) => {
        console.log(`Error getting thumbnail for ${filePath}: ${err}`);
        reject("");
      })
      .on("exit", (code) => {
        ffmpeg.kill("SIGTERM");
        if (code === 0) {
          console.log(`Generated thumbnail for ${filePath}`);
          resolve(tempPath);
        } else {
          console.log(`Error getting thumbnail for ${filePath}`);
          reject("");
        }
      });
    ffmpeg.stdout.pipe(process.stdout);
    ffmpeg.stderr.pipe(process.stderr);
    process.on("SIGTERM", () => {
      console.log("Received SIGTERM, terminating ffmpeg process...");
      ffmpeg.kill("SIGTERM");
      resolve("");
      process.exit();
    });

    process.on("SIGINT", () => {
      console.log("Received SIGINT, terminating ffmpeg process...");
      ffmpeg.kill("SIGINT");
      resolve("");
      process.exit();
    });
  });
}

function convertMilliToSeconds(milli: number) {
  const seconds = Math.floor(milli / 1000);
  return seconds;
}

function getTimeSegments(
  eventTimestamps: number[],
  startTime: number,
  endTime: number
) {
  const preBuffer = getConfig()["preBufferSeconds"];
  const postBuffer = getConfig()["postBufferSeconds"];
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
  if (segments.length === 0) return segments;
  const mergedSegments = mergeSegments(segments);
  console.log(mergedSegments);
  return mergedSegments;
}

function mergeSegments(segments: { start: number; end: number }[]) {
  const uniqueSegments = segments.reduce((unique, o) => {
    if (!unique.some((obj) => obj.start === o.start && obj.end === o.end)) {
      unique.push(o);
    }
    return unique;
  }, []);

  // Sort segments by start value
  uniqueSegments.sort((a, b) => a.start - b.start);

  // Initialize mergedSegments with the first segment
  const mergedSegments = [uniqueSegments[0]];

  // Loop through remaining segments and merge overlapping segments
  for (let i = 1; i < uniqueSegments.length; i++) {
    const currentSegment = uniqueSegments[i];
    const lastMergedSegment = mergedSegments[mergedSegments.length - 1];

    if (currentSegment.start <= lastMergedSegment.end) {
      // Merge currentSegment with lastMergedSegment
      lastMergedSegment.end = Math.max(
        currentSegment.end,
        lastMergedSegment.end
      );
    } else {
      // Add currentSegment to mergedSegments
      mergedSegments.push(currentSegment);
    }
  }

  return mergedSegments;
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

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hoursString = hours.toString().padStart(2, "0");
  const minutesString = minutes.toString().padStart(2, "0");
  const secondsString = seconds.toString().padStart(2, "0");

  return `${hoursString}:${minutesString}:${secondsString}`;
}

async function split(filePath, segments, outputPath) {
  const segmentPaths: string[] = [];
  const segmentPromises: Promise<void>[] = [];
  for (let i = 0; i < segments.length; i++) {
    const { start, end } = segments[i];
    const startTime = formatTime(start);
    const duration = formatTime(end - start);
    const segmentPath = `${outputPath}-part${i + 1}.mp4`;
    if (fs.existsSync(segmentPath)) {
      await fs.promises.unlink(segmentPath);
    }
    segmentPaths.push(segmentPath);

    const ffmpegArgs = [
      "-i",
      filePath,
      "-ss",
      startTime,
      "-t",
      duration,
      segmentPath,
    ];
    const ffmpeg = spawn("ffmpeg", ffmpegArgs);

    segmentPromises.push(
      new Promise<void>((resolve, reject) => {
        ffmpeg
          .on("error", (err) => {
            console.log(`Error splitting Segment ${i + 1}`);
            reject(err);
          })
          .on("exit", (code) => {
            ffmpeg.kill("SIGTERM");
            if (code === 0) {
              console.log(`Segment ${i + 1} complete`);
              resolve();
            } else {
              console.log(
                `Error splitting Segment ${
                  i + 1
                }: ffmpeg exited with code ${code}`
              );
              reject(new Error(`ffmpeg exited with code ${code}`));
            }
          });
        ffmpeg.stdout.pipe(process.stdout);
        ffmpeg.stderr.pipe(process.stderr);
        process.on("SIGTERM", () => {
          console.log("Received SIGTERM, terminating ffmpeg process...");
          ffmpeg.kill("SIGTERM");
          resolve();
          process.exit();
        });

        process.on("SIGINT", () => {
          console.log("Received SIGINT, terminating ffmpeg process...");
          ffmpeg.kill("SIGINT");
          resolve();
          process.exit();
        });
      })
    );
  }

  await Promise.all(segmentPromises)
    .then(() => {
      console.log("Splitting completed!");
    })
    .catch((error) => {
      console.error(error);
    });

  return segmentPaths;
}

async function mergeVoiceover(filePath: string, highlightPath: string) {
  if (fs.existsSync(filePath) && fs.existsSync(highlightPath)) {
    const recording = getRecordings().find(
      (recording) => recording.highlight?.filePath === highlightPath
    );

    const outputPath = `${app.getPath("userData")}/recording-${
      recording.date
    }-voiceover`;

    saveRecording(recording.filePath, {
      filePath: recording.filePath,
      highlightState: recording.highlightState,
      highlight: recording.highlight,
      startTime: recording.startTime,
      duration: recording.duration,
      date: recording.date,
      thumbnail: recording.thumbnail,
      voiceoverState: "Processing",
      voiceover: {
        filePath: `${outputPath}.mp4`,
      },
    });

    // Merge the audio and video streams
    console.time("merging");
    if (fs.existsSync(`${outputPath}.mp4`)) {
      await fs.promises.unlink(`${outputPath}.mp4`);
    }

    return await new Promise<void>((resolve, reject) => {
      const ffmpegArgs = [
        "-i",
        filePath,
        "-i",
        highlightPath,
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-strict",
        "experimental",
        `${outputPath}.mp4`,
      ];
      const ffmpeg = spawn("ffmpeg", ffmpegArgs);
      ffmpeg.stdout.pipe(process.stdout);
      ffmpeg.stderr.pipe(process.stderr);
      ffmpeg.on("error", (error) => {
        console.log(`Error merging audio: ${error.message}`);
        reject(error);
      });
      process.on("SIGTERM", () => {
        console.log("Received SIGTERM, terminating ffmpeg process...");
        ffmpeg.kill("SIGTERM");
        resolve();
        process.exit();
      });

      process.on("SIGINT", () => {
        console.log("Received SIGINT, terminating ffmpeg process...");
        ffmpeg.kill("SIGINT");
        resolve();
        process.exit();
      });
      ffmpeg.on("exit", async (code) => {
        ffmpeg.kill("SIGTERM");
        await fs.promises.unlink(filePath);
        if (code === 0) {
          console.timeEnd("merging");
          saveRecording(recording.filePath, {
            filePath: recording.filePath,
            highlightState: recording.highlightState,
            highlight: recording.highlight,
            startTime: recording.startTime,
            duration: recording.duration,
            date: recording.date,
            thumbnail: recording.thumbnail,
            voiceoverState: "Completed",
            voiceover: {
              filePath: `${outputPath}.mp4`,
            },
          });
          resolve();
        } else {
          console.log(`Error merging audio: ffmpeg exited with code ${code}`);
          saveRecording(recording.filePath, {
            filePath: recording.filePath,
            highlightState: recording.highlightState,
            highlight: recording.highlight,
            startTime: recording.startTime,
            duration: recording.duration,
            date: recording.date,
            thumbnail: recording.thumbnail,
          });
          reject(new Error(`ffmpeg exited with code ${code}`));
        }
      });
    });
  }
}

async function splitAndMergeVideo(filePath: string, event: any) {
  if (fs.existsSync(filePath)) {
    const recording = recordingStore.get(filePath);
    const eventTimestamps = await filterEventsLog(recording);
    const endTime = recording.startTime + recording.duration;
    const segments = getTimeSegments(
      eventTimestamps,
      recording.startTime,
      endTime
    );
    if (segments.length === 0) return;

    dialog.showMessageBox(win, {
      type: "info",
      title: "Notification",
      message: "Generating Highlights....",
    });

    const outputPath = `${app.getPath("userData")}/recording-${
      recording.date
    }-highlight`;
    saveRecording(
      filePath,
      {
        filePath: filePath,
        highlightState: "Processing",
        startTime: recording.startTime,
        duration: recording.duration,
        date: recording.date,
        thumbnail: recording.thumbnail,
      },
      event
    );

    console.time("splitting");
    const segmentPaths: string[] = await split(filePath, segments, outputPath);
    console.timeEnd("splitting");

    // Merge the segments into one file
    console.time("merging");
    if (fs.existsSync(`${outputPath}.mp4`)) {
      await fs.promises.unlink(`${outputPath}.mp4`);
    }
    return await new Promise<void>((resolve, reject) => {
      const inputPaths = segmentPaths;
      const inputArgs = inputPaths.flatMap((path) => ["-i", path]);
      const filterArgs = [
        "-filter_complex",
        `concat=n=${inputPaths.length}:v=1[outv]`,
        "-map",
        "[outv]",
      ];
      const ffmpegArgs = [
        ...inputArgs,
        ...filterArgs,
        "-c:v",
        "libx264",
        "-crf",
        "23",
        "-preset",
        "veryfast",
        "-movflags",
        "+faststart",
        `${outputPath}.mp4`,
      ];
      const ffmpeg = spawn("ffmpeg", ffmpegArgs);
      ffmpeg.stdout.pipe(process.stdout);
      ffmpeg.stderr.pipe(process.stderr);
      ffmpeg.on("error", (error) => {
        console.log(`Error merging videos: ${error.message}`);
        saveRecording(
          filePath,
          {
            filePath: filePath,
            startTime: recording.startTime,
            duration: recording.duration,
            date: recording.date,
            thumbnail: recording.thumbnail,
          },
          event
        );
        reject(error);
      });
      process.on("SIGTERM", () => {
        console.log("Received SIGTERM, terminating ffmpeg process...");
        ffmpeg.kill("SIGTERM");
        resolve();
        process.exit();
      });

      process.on("SIGINT", () => {
        console.log("Received SIGINT, terminating ffmpeg process...");
        ffmpeg.kill("SIGINT");
        resolve();
        process.exit();
      });
      ffmpeg.on("exit", async (code) => {
        ffmpeg.kill("SIGTERM");
        if (code === 0) {
          console.timeEnd("merging");
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

          saveRecording(
            filePath,
            {
              filePath: filePath,
              highlightState: "Completed",
              highlight: {
                filePath: `${outputPath}.mp4`,
                thumbnail: thumbnail ? thumbnail : "",
                date: recording.date,
              },
              startTime: recording.startTime,
              duration: recording.duration,
              date: recording.date,
              thumbnail: recording.thumbnail,
            },
            event
          );
          resolve();
        } else {
          console.log(`Error merging videos: ffmpeg exited with code ${code}`);
          saveRecording(
            filePath,
            {
              filePath: filePath,
              startTime: recording.startTime,
              duration: recording.duration,
              date: recording.date,
              thumbnail: recording.thumbnail,
            },
            event
          );
          reject(new Error(`ffmpeg exited with code ${code}`));
        }
      });
    });
  }
}

async function filterEventsLog(recording: Recording) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;

  const eventsFile = `${app.getPath(
    "home"
  )}/Library/Logs/Guerrilla Trading Platform/events_log_${formattedDate}.csv`;

  if (!fs.existsSync(eventsFile)) {
    dialog.showMessageBox(win, {
      type: "error",
      title: "Error",
      message: "Events log file not found",
    });
    return;
  }

  //const eventsFile = getConfig()["logFilePath"];
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
    relax_column_count: true,
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

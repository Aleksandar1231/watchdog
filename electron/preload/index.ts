import { contextBridge, ipcRenderer } from "electron";
import { BufferTime, Config, Recording, VideoQuality } from "../types";

const main = {
  openNewWindow: async (route: string): Promise<void> => {
    return await ipcRenderer.invoke("open-win", route);
  },
  getVideoSources: async (): Promise<Electron.DesktopCapturerSource[]> => {
    return await ipcRenderer.invoke("get-video-sources");
  },
  getStream: async (sourceId: string): Promise<MediaStream> => {
    return await ipcRenderer.invoke("get-stream", sourceId);
  },
  getRecordings: async (): Promise<string> => {
    return await ipcRenderer.invoke("get-recordings");
  },
  getConfig: async (): Promise<string> => {
    return await ipcRenderer.invoke("get-config");
  },
  openDirectory: async (): Promise<string> => {
    return await ipcRenderer.invoke("open-directory");
  },
  saveVideo: async (
    fileName: string,
    blob: any,
    dialogLabel: string,
    startTime: number,
    duration: number,
    date: number
  ): Promise<string> => {
    return await ipcRenderer.invoke(
      "save-video",
      fileName,
      blob,
      dialogLabel,
      startTime,
      duration,
      date
    );
  },
  generateHighlights: async (filePath: string): Promise<void> => {
    return await ipcRenderer.invoke("generate-highlights", filePath);
  },
  saveConfig: async (config: Config): Promise<void> => {
    return await ipcRenderer.invoke(
      "save-config",
      config.logFilePath,
      config.videoQuality,
      config.autoDelete,
      config.preBufferSeconds,
      config.postBufferSeconds
    );
  },
  listenRecordingSave: (setRecordings: (value: Recording[]) => void): void => {
    ipcRenderer.on("recording-save", (event, recordings) => {
      const values = Object.values(recordings);
      setRecordings(values as Recording[]);
    });
  },
  listenConfigSave: (setConfig: (value: Config) => void): void => {
    ipcRenderer.on("config-save-complete", (event, config) => {
      setConfig(config);
    });
  },
};

contextBridge.exposeInMainWorld("main", main);

function domReady(
  condition: DocumentReadyState[] = ["complete", "interactive"]
) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener("readystatechange", () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find((e) => e === child)) {
      return parent.appendChild(child);
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find((e) => e === child)) {
      return parent.removeChild(child);
    }
  },
};

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `loaders-css__square-spin`;
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `;
  const oStyle = document.createElement("style");
  const oDiv = document.createElement("div");

  oStyle.id = "app-loading-style";
  oStyle.innerHTML = styleContent;
  oDiv.className = "app-loading-wrap";
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`;

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.body, oDiv);
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle);
      safeDOM.remove(document.body, oDiv);
    },
  };
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading();
domReady().then(appendLoading);

window.onmessage = (ev) => {
  ev.data.payload === "removeLoading" && removeLoading();
};

setTimeout(removeLoading, 4999);

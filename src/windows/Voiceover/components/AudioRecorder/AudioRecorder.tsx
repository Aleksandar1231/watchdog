import { useEffect, useRef, useState } from "react";
import classNames from "classnames";

type AudioRecorderProps = {
  source: string;
};

let mediaRecorder: MediaRecorder;
let recordedChunks: any[] = [];

export function AudioRecorder(props: AudioRecorderProps) {
  const { source } = props;
  const videoRef = useRef<HTMLVideoElement>(null);

  const fileName = source.split(".").slice(0, -1).join(".");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState<boolean>(false);

  useEffect(() => {
    document.title = "Watchdog > Voiceover";

    async function getStream() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (stream) setStream(stream);
    }
    getStream();
  }, []);

  function handleDataAvailable(e: any) {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  }

  async function handleDataEnd() {
    const blob = new Blob(recordedChunks, { type: "audio/webm;codecs=opus" });

    const arrayBuffer = await blob.arrayBuffer();
    await window.main.saveVoiceover(
      `${fileName}-voiceover.webm`,
      source,
      arrayBuffer,
      "Save Voiceover"
    );
    recordedChunks = [];
  }

  const handleStartRecording = () => {
    if (!stream) return;
    setRecording(true);
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleDataEnd;
    recordedChunks = [];
    playVideo();
    mediaRecorder.start(1000);
  };

  const handleStopRecording = async () => {
    setRecording(false);
    pauseVideo();
    mediaRecorder.stop();
  };

  const playVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const pauseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <div>
      {recording ? (
        <div className="flex items-center justify-center my-2">
          <div className="text-lg px-3">Recording</div>
          <div
            className={classNames("", {
              "w-4 h-4 bg-red-500 rounded-full animate-pulse": recording,
            })}
          />
        </div>
      ) : (
        <div className="flex justify-center my-2">
          <h4>Voiceover</h4>
        </div>
      )}
      <video
        ref={videoRef}
        controls
        src={`file://${source}`}
        className="w-full p-10 h-150 h-auto"
      ></video>
      <div className="my-4 flex justify-left items-center">
        {recording ? (
          <button
            className="border border-red-500 bg-red-100 hover:bg-red-200 text-red-500 font-semibold py-2 px-4"
            onClick={handleStopRecording}
          >
            Stop Recording
          </button>
        ) : (
          <button
            className="border border-green-500 bg-green-100 hover:bg-green-200 text-green-500 font-semibold py-2 px-4"
            onClick={handleStartRecording}
          >
            Start Recording
          </button>
        )}
      </div>
    </div>
  );
}

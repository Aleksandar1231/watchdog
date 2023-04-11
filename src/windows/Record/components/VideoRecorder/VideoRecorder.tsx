import { toggleRecording } from "@/redux/recording";
import { RootState } from "@/store";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

type VideoPlayerProps = {
  source: string;
};

let mediaRecorder: MediaRecorder;
let recordedChunks: any[] = [];
let startTime: number;
let duration: number;

export function VideoRecorder(props: VideoPlayerProps) {
  const { source } = props;
  const dispatch = useDispatch();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const isRecording = useSelector(
    (state: RootState) => state.recording.isRecording
  );

  useEffect(() => {
    document.title = "Watchdog > Record";

    async function getStream() {
      const constraints = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: source,
          },
        },
      };

      const s: MediaStream = await (navigator.mediaDevices as any).getUserMedia(
        constraints
      );
      if (s) {
        setStream(s);
        playVideo(s);
      }
    }

    getStream();
  }, []);

  function handleDataAvailable(e: any) {
    recordedChunks.push(e.data);
    console.log(recordedChunks);
  }

  function handleDataStart() {
    startTime = Date.now();
  }

  async function handleDataEnd() {
    duration = Date.now() - startTime;
    const blob = new Blob(recordedChunks, {
      type: "video/webm; codecs=vp9",
    });
    const arrayBuffer = await blob.arrayBuffer();
    const date = Date.now();
    await window.main.saveVideo(
      `recording-${date}.webm`,
      arrayBuffer,
      "Save video",
      startTime,
      duration,
      date
    );
    recordedChunks = [];
  }

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleStartRecording = () => {
    if (!stream) return;
    dispatch(toggleRecording(true));

    const options = { mimeType: "video/webm; codecs=vp9" };

    mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.onstart = handleDataStart;
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleDataEnd;
    recordedChunks = [];
    mediaRecorder.start(1000);
  };

  const handleStopRecording = async () => {
    dispatch(toggleRecording(false));
    //pauseVideo();
    mediaRecorder.stop();
  };

  const playVideo = (s: MediaStream) => {
    if (videoRef.current && s) {
      videoRef.current.srcObject = s;
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
      <video ref={videoRef} className="w-full h-auto" />
      <div className="m-4 flex justify-center items-center">
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-4"
          onClick={handleStartRecording}
          disabled={isRecording}
        >
          Start
        </button>
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleStopRecording}
          disabled={!isRecording}
        >
          Stop
        </button>
      </div>
    </div>
  );
}

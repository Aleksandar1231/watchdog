import { useEffect, useRef, useState } from "react";

type VideoPlayerProps = {
  source: string;
};

let mediaRecorder: MediaRecorder;
let recordedChunks: any[] = [];

export function VideoPlayer(props: VideoPlayerProps) {
  const { source } = props;
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);

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
    console.log(stream);
  }, []);

  function handleDataAvailable(e: any) {
    recordedChunks.push(e.data);
    console.log(recordedChunks);
  }

  async function handleDataEnd(e: any) {
    const blob = new Blob(recordedChunks, {
      type: "video/webm; codecs=vp9",
    });
    const arrayBuffer = await blob.arrayBuffer();
    console.log(arrayBuffer);
    window.main.saveVideo(
      `recording-${Date.now()}.webm`,
      arrayBuffer,
      "Save video"
    );
    recordedChunks = [];
  }

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleStartRecording = () => {
    if (!stream) return;
    setIsRecording(true);

    const options = { mimeType: "video/webm; codecs=vp9" };

    mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleDataEnd;
    recordedChunks = [];
    mediaRecorder.start(1000);
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
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

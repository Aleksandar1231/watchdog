import { useEffect, useState } from "react";
import ScreenRecordingCard from "./components/ScreenRecordingCard";
import TopMenu from "./components/TopMenu";
import VideoRecorder from "./components/VideoRecorder";

export function Record() {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Watchdog > Start Session";
  }, []);

  const handleScreenClick = (sourceId: string) => {
    setSelectedSourceId(sourceId);
  };

  return (
    <div className="container m-8 space-y-10">
      {selectedSourceId ? (
        <VideoRecorder source={selectedSourceId} />
      ) : (
        <>
          <TopMenu />
          <ScreenRecordingCard handleScreenClick={handleScreenClick} />
        </>
      )}
    </div>
  );
}

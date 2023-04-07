import { NativeImage } from "electron";
import React, { useEffect, useState } from "react";

interface Source {
  id: string;
  name: string;
  thumbnail: string;
}

type Props = {
  handleScreenClick: (sourceId: string) => void;
};

export const ScreenRecordingCard: React.FC<Props> = (props: Props) => {
  const { handleScreenClick } = props;
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  useEffect(() => {
    async function getSources() {
      const sources = await window.main.getVideoSources();
      setSources(sources);
    }

    getSources();
  }, []);

  const handleSourceSelect = (sourceId: string) => {
    setSelectedSourceId(sourceId);
  };

  return (
    <div className="flex flex-wrap">
      {sources.map((source) => (
        <div key={source.id} className="w-1/2 md:w-1/3 lg:w-1/4 p-4">
          <div
            className={`cursor-pointer rounded-md overflow-hidden ${
              selectedSourceId === source.id ? "border-2 border-purple-500" : ""
            }`}
            onClick={() => handleSourceSelect(source.id)}
          >
            <img src={source.thumbnail} alt={source.name} className="w-full" />
            <div className="p-2">
              <p className="font-medium">{source.name}</p>
            </div>
          </div>
          {selectedSourceId === source.id && (
            <div className="flex justify-center p-2">
              <button
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={() => handleScreenClick(source.id)}
              >
                Select
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

import React, { useEffect } from "react";
import { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Transition } from "@headlessui/react";
import { Recording } from "@/types";
import {
  faPlay,
  faHeart,
  faEllipsisH,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface VideoCarouselProps {
  recording: Recording;
}

export const VideoCarousel: React.FC<VideoCarouselProps> = ({ recording }) => {
  const { filePath, date, thumbnail, highlight, highlightState } = recording;
  const [currentVideoIndex, setCurrentVideoIndex] = useState(
    highlightState ? 1 : 0
  );

  useEffect(() => {
    setCurrentVideoIndex(highlightState ? 1 : 0);
  }, [highlightState]);

  function getDateString(date: number) {
    return new Date(date).toString();
  }

  return (
    <div className="container max-w-xs overflow-hidden m-2">
      <div className="p-2">
        <p className="text-gray-700 text-sm">{getDateString(date)}</p>
      </div>
      <div className="relative w-full">
        {recording.filePath && currentVideoIndex === 0 && (
          <div
            className="flex flex-col items-center justify-center border border-2 h-800 border-gray bg-center bg-contain bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${thumbnail})`,
              height: "150px",
            }}
          >
            <div className="flex items-center justify-center mt-4">
              <button
                onClick={() =>
                  window.main.openNewWindow(
                    `/videoPlayer/${encodeURIComponent(filePath)}`
                  )
                }
              >
                <FontAwesomeIcon
                  icon={faPlay}
                  size="4x"
                  className="text-gray opacity-50 hover:opacity-75"
                />
              </button>
            </div>
            <div className="px-6 py-4 flex items-center justify-center">
              <p className="text-white text-base font-bold">Full Session</p>
            </div>
          </div>
        )}
        {highlight && currentVideoIndex === 1 && (
          <div
            className="flex flex-col items-center justify-center border border-2 h-800 border-gray bg-center bg-contain bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${highlight.thumbnail})`,
              height: "150px",
            }}
          >
            <div className="flex items-center justify-center mt-4">
              <button
                onClick={() =>
                  window.main.openNewWindow(
                    `/videoPlayer/${encodeURIComponent(highlight.filePath)}`
                  )
                }
              >
                <FontAwesomeIcon
                  icon={faPlay}
                  size="4x"
                  className="text-gray opacity-50 hover:opacity-75"
                />
              </button>
            </div>
            <div className="px-6 py-4 flex items-center justify-center">
              <p className="text-white text-base font-bold">Highlights</p>
            </div>
          </div>
        )}
        {highlightState === "Processing" && currentVideoIndex === 1 && (
          <div
            className="flex flex-col items-center justify-center border border-2 h-800 border-gray bg-center bg-contain bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${thumbnail})`,
              height: "150px",
            }}
          >
            <div className="px-6 py-4 flex items-center justify-center">
              <p className="text-white text-base font-bold">Processing...</p>
            </div>
          </div>
        )}
        <div className="absolute inset-y-0 left-0 flex items-center justify-center">
          <button
            className="p-2  text-gray-800"
            onClick={() => {
              if (highlight && currentVideoIndex === 0) {
                setCurrentVideoIndex(1);
                return;
              } else if (currentVideoIndex === 1) {
                setCurrentVideoIndex(0);
                return;
              }
            }}
          >
            <FiChevronLeft size={24} />
          </button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center justify-center">
          <button
            className="p-2 text-gray-800"
            onClick={() => {
              if (highlight && currentVideoIndex === 0) {
                setCurrentVideoIndex(1);
                return;
              } else if (currentVideoIndex === 1) {
                setCurrentVideoIndex(0);
                return;
              }
            }}
          >
            <FiChevronRight size={24} />
          </button>
        </div>
      </div>
      <div className="container flex flex-row justify-evenly">
        <div className="py-2">
          <button className="bg-purple-300 hover:bg-purple-700 border border-2 border-purple-700 text-black text-sm px-4 ">
            Share...
          </button>
        </div>
        <div className="py-2">
          <button className="bg-green-200 hover:bg-green-400 border border-2 border-green-700 text-black text-sm px-4 ">
            Voiceover
          </button>
        </div>
        <div className="py-2">
          <button className="bg-gray-700 text-white text-small px-2">
            <FontAwesomeIcon icon={faHeart} className="text-small" />
          </button>
        </div>
        <div className="py-2">
          <button className="text-gray-700 text-base">
            <FontAwesomeIcon icon={faEllipsisH} className="text-base" />
          </button>
        </div>
      </div>
    </div>
  );
};

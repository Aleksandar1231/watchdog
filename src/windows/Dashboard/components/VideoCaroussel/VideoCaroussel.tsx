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
import { Button } from "@saas-ui/react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  PopoverAnchor,
} from "@chakra-ui/react";

interface VideoCarouselProps {
  recording: Recording;
}

export const VideoCarousel: React.FC<VideoCarouselProps> = ({ recording }) => {
  const {
    filePath,
    date,
    thumbnail,
    highlight,
    highlightState,
    voiceover,
    voiceoverState,
  } = recording;
  const [currentVideoIndex, setCurrentVideoIndex] = useState(
    voiceover ? 2 : highlight ? 1 : 0
  );

  useEffect(() => {
    setCurrentVideoIndex(voiceover ? 2 : highlight ? 1 : 0);
  }, [highlight, voiceover]);

  function getDateString(date: number) {
    return new Date(date).toString();
  }

  function generateHighlights() {
    window.main.generateHighlights(filePath);
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
        {highlightState === "Processing" && currentVideoIndex === 1 ? (
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
        ) : highlight && currentVideoIndex === 1 ? (
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
        ) : null}
        {voiceoverState === "Processing" && currentVideoIndex === 2 ? (
          <div
            className="flex flex-col items-center justify-center border border-2 h-800 border-gray bg-center bg-contain bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${
                highlight!.thumbnail
              })`,
              height: "150px",
            }}
          >
            <div className="px-6 py-4 flex items-center justify-center">
              <p className="text-white text-base font-bold">Processing...</p>
            </div>
          </div>
        ) : voiceover && currentVideoIndex === 2 ? (
          <div
            className="flex flex-col items-center justify-center border border-2 h-800 border-gray bg-center bg-contain bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${
                highlight!.thumbnail
              })`,
              height: "150px",
            }}
          >
            <div className="flex items-center justify-center mt-4">
              <button
                onClick={() =>
                  window.main.openNewWindow(
                    `/videoPlayer/${encodeURIComponent(voiceover.filePath)}`
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
              <p className="text-white text-base font-bold">Voiceover</p>
            </div>
          </div>
        ) : null}
        <div className="absolute inset-y-0 left-0 flex items-center justify-center">
          <button
            className="p-2  text-gray-800"
            onClick={() => {
              if (currentVideoIndex === 0) {
                if (voiceover) {
                  setCurrentVideoIndex(2);
                } else if (highlight) {
                  setCurrentVideoIndex(1);
                }
              } else if (currentVideoIndex === 1) {
                setCurrentVideoIndex(0);
              } else if (currentVideoIndex === 2) {
                if (highlight) {
                  setCurrentVideoIndex(1);
                } else setCurrentVideoIndex(0);
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
              if (currentVideoIndex === 0) {
                if (highlight) {
                  setCurrentVideoIndex(1);
                } else if (voiceover) {
                  setCurrentVideoIndex(2);
                }
              } else if (currentVideoIndex === 1) {
                if (voiceover) {
                  setCurrentVideoIndex(2);
                } else setCurrentVideoIndex(0);
              } else if (currentVideoIndex === 2) {
                setCurrentVideoIndex(0);
              }
            }}
          >
            <FiChevronRight size={24} />
          </button>
        </div>
      </div>
      <div className="container flex flex-row justify-between items-center">
        <div className="py-2">
          <Button colorScheme="green">Share...</Button>
        </div>

        <div className="py-2">
          <Button
            colorScheme="blue"
            disabled={highlight ? false : true}
            onClick={() =>
              window.main.openNewWindow(
                `/voiceover/${encodeURIComponent(highlight!.filePath)}`
              )
            }
          >
            Record Voiceover
          </Button>
        </div>

        <div className="py-2">
          <FontAwesomeIcon
            icon={faHeart}
            className="hover:text-red-600 hover:cursor-pointer"
          />
        </div>
        <div className="py-2">
          <Popover>
            <PopoverTrigger>
              <Button>
                <FontAwesomeIcon icon={faEllipsisH} className="text-base" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverBody>
                <div className="[&>*]:border-b [&>*]:py-1 [&>*]:p-1 [&>*]:cursor-pointer hover:[&>*]:bg-gray-200">
                  <div>Edit Video Name</div>
                  <div>
                    <button
                      disabled={highlight ? true : false}
                      onClick={generateHighlights}
                      className={`${
                        highlight ? "text-gray-500" : "text-black"
                      }`}
                    >
                      Generate Highlights
                    </button>
                  </div>
                  <div>Add Tags</div>
                  <div>Show in Folder</div>
                  <div>Delete</div>
                  <div className="last:border-0">Add a Journal Entry</div>
                </div>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

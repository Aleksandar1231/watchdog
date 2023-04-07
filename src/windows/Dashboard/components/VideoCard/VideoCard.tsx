import { Recording } from "@/windows/Record";
import {
  faPlay,
  faHeart,
  faEllipsisH,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function VideoCard(props: Recording) {
  const { filePath, isHighlight, date, thumbnail } = props;

  function getDateString(date: string) {
    return new Date(date).toString();
  }

  return (
    <div className="container max-w-xs overflow-hidden m-2">
      <div className="p-2">
        <p className="text-gray-700 text-sm">{getDateString(date)}</p>
      </div>
      <div
        className="flex flex-col items-center justify-center border border-2 h-800 border-gray bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${thumbnail})`, height: "150px" }}
      >
        <div className="flex items-center justify-center">
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
              className="text-gray opacity-10 hover:opacity-75"
            />
          </button>
        </div>
        <div className="px-6 py-4 flex items-center justify-center">
          {isHighlight ? (
            <p className="text-gray-700 text-base">Highlights</p>
          ) : (
            <p className="text-gray-700 text-base">Full Session</p>
          )}
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
}

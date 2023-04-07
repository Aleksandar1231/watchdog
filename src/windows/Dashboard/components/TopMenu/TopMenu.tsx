import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircle,
  faSquare,
  faSearch,
  faSortAlphaDown,
  faFilter,
  faCog,
} from "@fortawesome/free-solid-svg-icons";
import electronIsDev from "electron-is-dev";

export function TopMenu() {
  return (
    <div className="container flex flex-row space-x-4 max-w-full">
      <div className="container flex flex-row">
        <button
          className="border border-green-500 bg-green-100 hover:bg-green-200 text-green-500 font-semibold py-2 px-4"
          onClick={() => window.main.openNewWindow("/startSession")}
        >
          <div className="flex flex-row items-center">
            <FontAwesomeIcon icon={faCircle} />
            <div className="px-1">Start Session</div>
          </div>
        </button>
        <button className="border border-red-500 bg-red-100 hover:bg-red-200 text-red-500 font-semibold py-2 px-4">
          <div className="flex flex-row items-center">
            <FontAwesomeIcon icon={faSquare} />
            <div className="px-1">Stop Session</div>
          </div>
        </button>
      </div>
      <div className="container flex flex-row justify-end items-center p-3">
        <input
          type="text"
          className="px-4 py-2 bg-white border-2 placeholder-gray-500"
        />
        <button className="p-2 text-black focus:outline-none focus:shadow-outline">
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </div>
      <div className="container flex flex-row justify-end items-center space-x-4 px-3">
        <div className="text-black">
          <FontAwesomeIcon icon={faSortAlphaDown} />
        </div>
        <div className="text-black">
          <FontAwesomeIcon icon={faFilter} />
        </div>
        <div className="text-black">
          <button onClick={() => window.main.openNewWindow("/settings")}>
            <FontAwesomeIcon icon={faCog} />
          </button>
        </div>
      </div>
    </div>
  );
}

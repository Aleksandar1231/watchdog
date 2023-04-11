import DropdownMenu from "@/components/DropdownMenu";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store";
import {
  updatePreBufferTime,
  updatePostBufferTime,
  updateAutoDelete,
} from "../../../../redux/config";

export function Highlights() {
  const config = useSelector((state: RootState) => state.config);
  const autoDelete = useSelector((state: RootState) => state.config.autoDelete);
  const preBufferTime = useSelector(
    (state: RootState) => state.config.preBufferSeconds
  );
  const postBufferTime = useSelector(
    (state: RootState) => state.config.postBufferSeconds
  );
  const dispatch = useDispatch();

  const handlePreEventBufferChange = async (time: any) => {
    dispatch(updatePreBufferTime(time));
    await window.main.saveConfig({
      ...config,
      preBufferSeconds: time,
    });
  };

  const handlePostEventBufferChange = async (time: any) => {
    dispatch(updatePostBufferTime(time));
    await window.main.saveConfig({
      ...config,
      postBufferTime: time,
    });
  };

  const handleCheckBoxChange = async () => {
    dispatch(updateAutoDelete(!autoDelete));
    await window.main.saveConfig({
      ...config,
      autoDelete: !autoDelete,
    });
  };

  return (
    <div className="container space-y-2">
      <div className="text-lg font-bold">Highlights Generation</div>
      <div className="flex flex-row justify-left items-center space-x-4">
        <div className="text-sm w-1/5">Pre-event buffer time</div>
        <div className="py-1 w-1/5 mr-6">
          <DropdownMenu
            values={["2 seconds", "5 seconds", "10 seconds"]}
            onChange={handlePreEventBufferChange}
            selectedOption={preBufferTime}
          />
        </div>
      </div>
      <div className="flex flex-row justify-left items-center space-x-4">
        <div className="text-sm w-1/5">Post-event buffer time</div>
        <div className="py-1 w-1/5">
          <DropdownMenu
            values={["2 seconds", "5 seconds", "10 seconds"]}
            onChange={handlePostEventBufferChange}
            selectedOption={postBufferTime}
          />
        </div>
      </div>
      <div className="flex items-center pt-2">
        <input
          type="checkbox"
          id="autodelete-checkbox"
          checked={autoDelete}
          onChange={handleCheckBoxChange}
          className="h-5 w-5 border-2 rounded-sm focus:outline-none"
        />
        <label htmlFor="autodelete-checkbox" className="ml-2 text-sm ">
          Auto-delete full-session videos after generating highlights
        </label>
      </div>
    </div>
  );
}

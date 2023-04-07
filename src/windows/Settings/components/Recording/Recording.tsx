import DropdownMenu from "@/components/DropdownMenu";
import { RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { updateVideoQuality } from "../../../../redux/config";

export function Recording() {
  const dispatch = useDispatch();
  const videoQuality = useSelector(
    (state: RootState) => state.config.videoQuality
  );
  const handleChange = (newOption: any) => {
    dispatch(updateVideoQuality(newOption));
  };

  return (
    <div className="container space-y-2 ">
      <div className="text-lg font-bold">Recording</div>
      <div className="flex flex-row justify-left items-center space-x-4">
        <div className="text-sm w-1/6">Video Quality:</div>
        <div className="py-1 w-1/5 mr-6">
          <DropdownMenu
            values={["Low", "High"]}
            onChange={handleChange}
            selectedOption={videoQuality}
          />
        </div>
        <div></div>
      </div>
    </div>
  );
}

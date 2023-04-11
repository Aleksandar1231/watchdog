import { configureStore } from "@reduxjs/toolkit";
import configReducer from "./redux/config";
import recordingReducer from "./redux/recording";

const store = configureStore({
  reducer: {
    config: configReducer,
    recording: recordingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export default store;

import { configureStore } from "@reduxjs/toolkit";
import recordingReducer from "./redux/recording";

const store = configureStore({
  reducer: {
    recording: recordingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export default store;

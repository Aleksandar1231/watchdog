import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ConfigState {
  logFilePath: string;
  videoQuality: "Low" | "High";
  preBufferSeconds: string;
  postBufferSeconds: string;
  autoDelete: boolean;
}

const initialState: ConfigState = {
  logFilePath: "",
  videoQuality: "Low",
  preBufferSeconds: "2 seconds",
  postBufferSeconds: "5 seconds",
  autoDelete: false,
};

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    updateLogFilePath(state, action: PayloadAction<string>) {
      state.logFilePath = action.payload;
    },
    updateVideoQuality(state, action: PayloadAction<"Low" | "High">) {
      state.videoQuality = action.payload;
    },
    updatePreBufferTime(state, action: PayloadAction<string>) {
      state.preBufferSeconds = action.payload;
    },
    updatePostBufferTime(state, action: PayloadAction<string>) {
      state.postBufferSeconds = action.payload;
    },
    updateAutoDelete(state, action: PayloadAction<boolean>) {
      state.autoDelete = action.payload;
    },
  },
});

export const {
  updateLogFilePath,
  updateVideoQuality,
  updatePreBufferTime,
  updatePostBufferTime,
  updateAutoDelete,
} = configSlice.actions;

export default configSlice.reducer;

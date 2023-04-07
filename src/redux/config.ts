import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type BufferTime = "2" | "5" | "10";

export interface ConfigState {
  videoQuality: "Low" | "High";
  preBufferSeconds: string;
  postBufferSeconds: string;
  autoDelete: boolean;
}

const initialState: ConfigState = {
  videoQuality: "Low",
  preBufferSeconds: "2 seconds",
  postBufferSeconds: "5 seconds",
  autoDelete: false,
};

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
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
  updateVideoQuality,
  updatePreBufferTime,
  updatePostBufferTime,
  updateAutoDelete,
} = configSlice.actions;

export default configSlice.reducer;

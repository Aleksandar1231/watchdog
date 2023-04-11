import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface RecordingState {
  isRecording: boolean;
}

const initialState: RecordingState = {
  isRecording: false,
};

const recordingSlice = createSlice({
  name: "recording",
  initialState,
  reducers: {
    toggleRecording(state, action: PayloadAction<boolean>) {
      state.isRecording = action.payload;
    },
  },
});

export const {
  toggleRecording
} = recordingSlice.actions;


export default recordingSlice.reducer;

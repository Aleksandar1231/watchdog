export type Recording = {
  filePath: string;
  date: number;
  thumbnail: string;
  highlight?: Highlight;
  startTime?: number;
  duration?: number;
  highlightState?: HighlightState;
  voiceoverState?: HighlightState;
  voiceover?: Voiceover;
};
export type Voiceover = {
  filePath: string;
};
export type BufferTime = "2 seconds" | "5 seconds" | "10 seconds";
export type VideoQuality = "Low" | "High";
export type Config = {
  logFilePath: string;
  videoQuality: VideoQuality;
  preBufferSeconds: BufferTime;
  postBufferSeconds: BufferTime;
  autoDelete: boolean;
};
export type HighlightState = "Processing" | "Completed";
export type Highlight = {
  filePath: string;
  date: number;
  thumbnail: string;
};

export type RecordingType = "Full Session" | "Highlight" | "Voice Over";

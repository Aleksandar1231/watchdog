export type Recording = {
  filePath: string;
  date: number;
  thumbnail: string;
  highlight?: Highlight;
  startTime?: number;
  duration?: number;
};

export type Highlight = {
  filePath: string;
  date: number;
  thumbnail: string;
};

export type RecordingType = "Full Session" | "Highlight" | "Voice Over";

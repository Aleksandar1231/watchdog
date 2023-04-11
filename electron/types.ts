export type Recording = {
  filePath: string;
  isHighlight: boolean;
  startTime: number;
  duration: number;
  date: number;
  thumbnail: string;
};
export type Segment = {
  start: number;
  end: number;
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

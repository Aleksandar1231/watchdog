export type Recording = {
  filePath: string;
  isHighlight: boolean;
  date: number;
  thumbnail: string;
  startTime?: number;
  duration?: number;
};

export type Highlight = {
  filePath: string;
  date: number;
  thumbnail: string;
};

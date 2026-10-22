export type TimelapseEncoderModuleEvents = {
  onProgress: (params: EncodeProgress) => void;
};

export type EncodeProgress = {
  /** Number of photos rendered so far. */
  current: number;
  total: number;
};

export type FrameSpec = {
  /** `file://` URI or absolute path of the photo. */
  uri: string;
  /** Text drawn at the bottom of the frame, e.g. "Gün 12 · 5 Mart 2026". */
  label?: string | null;
};

export type EncodeOptions = {
  frames: FrameSpec[];
  /** `file://` URI where the MP4 is written. */
  outputUri: string;
  width: number;
  height: number;
  fps: number;
  secondsPerPhoto: number;
  bitRate: number;
};

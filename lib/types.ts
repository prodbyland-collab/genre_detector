export type GenreConfidence = {
  name: string;
  confidence: number;
};

export type ArtistFit = {
  name: string;
  reason: string;
};

export type AudioFeatures = {
  bpm: number;
  key: string;
  energy: number;
  mood: string[];
  genres: GenreConfidence[];
};

export type AnalysisResult = AudioFeatures & {
  id: string;
  title: string;
  createdAt: string;
  artists: ArtistFit[];
  vocalStyles: string[];
  explanation: string;
};

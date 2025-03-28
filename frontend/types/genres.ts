export type GenreResponse = Record<string, number>;

export type SunburstData = {
  name: string;
  children: {
    name: string;
    value: number;
  }[];
};
export type GenreData = {
    name: string;
    value: number;
  };
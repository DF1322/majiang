export enum Suit {
  WAN = 'wan',   // 万
  TONG = 'tong', // 筒
  TIAO = 'tiao', // 条
  DRAGON = 'dragon' // 中发白
}

export interface TileData {
  id: string; // unique identifier for React keys
  suit: Suit;
  value: number; // 1-9 for suits, 1=Red(中), 2=Green(发), 3=White(白) for Dragons
}

export interface GameStats {
  id: string;
  date: string;
  rounds: number;
}

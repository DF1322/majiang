import { Suit, TileData } from '../types';

// 生成唯一ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// 初始化一副牌 (136张: 3花色x9x4 + 3字x4) - 不含风牌(东南西北)根据用户描述
export const generateDeck = (): TileData[] => {
  const deck: TileData[] = [];
  
  // 万筒条 1-9
  [Suit.WAN, Suit.TONG, Suit.TIAO].forEach(suit => {
    for (let val = 1; val <= 9; val++) {
      for (let i = 0; i < 4; i++) {
        deck.push({ id: generateId(), suit, value: val });
      }
    }
  });

  // 中发白 (Value: 1=中, 2=发, 3=白)
  for (let val = 1; val <= 3; val++) {
    for (let i = 0; i < 4; i++) {
      deck.push({ id: generateId(), suit: Suit.DRAGON, value: val });
    }
  }

  return deck;
};

// 洗牌 (Fisher-Yates)
export const shuffleDeck = (deck: TileData[]): TileData[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// 获取牌的中文名称
export const getTileName = (tile: TileData): string => {
  if (tile.suit === Suit.WAN) return `${tile.value}万`;
  if (tile.suit === Suit.TONG) return `${tile.value}筒`;
  if (tile.suit === Suit.TIAO) return `${tile.value}条`;
  if (tile.suit === Suit.DRAGON) {
    if (tile.value === 1) return '中';
    if (tile.value === 2) return '发';
    if (tile.value === 3) return '白';
  }
  return '';
};

// 判断是否是同一张牌（忽略ID）
export const isSameTileType = (t1: TileData, t2: TileData | null): boolean => {
  if (!t2) return false;
  return t1.suit === t2.suit && t1.value === t2.value;
};

// 理牌排序逻辑
export const sortHand = (hand: TileData[], wildcard: TileData | null): TileData[] => {
  return [...hand].sort((a, b) => {
    // 癞子最前
    const aIsWild = isSameTileType(a, wildcard);
    const bIsWild = isSameTileType(b, wildcard);
    if (aIsWild && !bIsWild) return -1;
    if (!aIsWild && bIsWild) return 1;

    // 花色顺序：万 -> 筒 -> 条 -> 字
    const suitOrder = { [Suit.WAN]: 1, [Suit.TONG]: 2, [Suit.TIAO]: 3, [Suit.DRAGON]: 4 };
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    // 同花色按点数
    return a.value - b.value;
  });
};

// 转换为文本格式
export const handToString = (hand: TileData[], wildcard: TileData | null): string => {
    const sorted = sortHand(hand, null); // 纯文本不需要把赖子放最前，通常按花色看比较好，或者跟理牌保持一致
    // 这里采用跟理牌一致，方便对照
    const visualSorted = sortHand(hand, wildcard);
    return visualSorted.map(t => {
        let name = getTileName(t);
        if (isSameTileType(t, wildcard)) {
            name += "(癞)";
        }
        return name;
    }).join(' ');
}

// 供自定义选择的基础牌库（每种一张）
export const getBaseTiles = (): TileData[] => {
  const tiles: TileData[] = [];
  // 万
  for(let i=1; i<=9; i++) tiles.push({id: `base-wan-${i}`, suit: Suit.WAN, value: i});
  // 筒
  for(let i=1; i<=9; i++) tiles.push({id: `base-tong-${i}`, suit: Suit.TONG, value: i});
  // 条
  for(let i=1; i<=9; i++) tiles.push({id: `base-tiao-${i}`, suit: Suit.TIAO, value: i});
  // 字
  tiles.push({id: `base-drag-1`, suit: Suit.DRAGON, value: 1}); // 中
  tiles.push({id: `base-drag-2`, suit: Suit.DRAGON, value: 2}); // 发
  tiles.push({id: `base-drag-3`, suit: Suit.DRAGON, value: 3}); // 白
  return tiles;
}

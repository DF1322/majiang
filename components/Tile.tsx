import React from 'react';
import { TileData, Suit } from '../types';
import { isSameTileType, getTileName } from '../utils/gameLogic';

interface TileProps {
  tile: TileData;
  wildcard: TileData | null;
  onClick?: () => void;
  isNewDraw?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Tile: React.FC<TileProps> = ({ 
  tile, 
  wildcard, 
  onClick, 
  isNewDraw = false,
  className = "",
  size = 'md'
}) => {
  const isWild = isSameTileType(tile, wildcard);

  // Styling based on suit
  const getSuitColor = (suit: Suit, val: number) => {
    if (suit === Suit.WAN) return 'text-red-700'; // Character usually red for numbers
    if (suit === Suit.TONG) return 'text-blue-600'; // Dots usually blue/green mix, sticking to blue for contrast
    if (suit === Suit.TIAO) return val === 1 ? 'text-green-700' : 'text-green-600'; // Bamboo green
    if (suit === Suit.DRAGON) {
      if (val === 1) return 'text-red-600'; // Zhong
      if (val === 2) return 'text-green-600'; // Fa
      if (val === 3) return 'text-blue-900 border-blue-900'; // Bai (Empty frame or blue text)
    }
    return 'text-slate-800';
  };

  const colorClass = getSuitColor(tile.suit, tile.value);
  const name = getTileName(tile);

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-11 text-xs',
    md: 'w-10 h-14 text-sm sm:w-12 sm:h-16 sm:text-base',
    lg: 'w-14 h-20 text-lg',
  };

  // Render content helpers
  const renderContent = () => {
    // Simplify visuals to Text mostly, but add some flair
    if (tile.suit === Suit.DRAGON && tile.value === 3) {
      // White Dragon often depicted as an empty blue rectangle
      return (
        <div className="w-4/5 h-4/5 border-2 border-blue-900 rounded-sm flex items-center justify-center">
            <span className="text-blue-900 font-bold opacity-0">白</span>
        </div>
      );
    }
    
    // For Tiao (Bamboo), specially 1 Tiao is a bird, but we stick to text for simplicity in this version,
    // or use a simple visual cue. Let's use Large Text for suit logic.
    return (
        <div className="flex flex-col items-center justify-center leading-none">
            <span className={`font-bold ${size === 'sm' ? 'text-xs' : 'text-xl'} ${colorClass}`}>
                {name.replace(/[0-9]/g, '')}
            </span>
            {tile.suit !== Suit.DRAGON && (
               <span className={`font-bold ${colorClass} mt-0.5`}>{tile.value}</span>
            )}
        </div>
    );
  };
  
  // Specific visual adjustment for readability
  // Wan: "五万" vertical
  // Tong: "5筒" vertical
  // Tiao: "8条" vertical
  const renderVerticalText = () => {
      let topChar = "";
      let bottomChar = "";

      if (tile.suit === Suit.DRAGON) {
          topChar = name; 
      } else {
          // Chinese numbers mapping roughly
          const cnNums = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
          topChar = cnNums[tile.value];
          bottomChar = tile.suit === Suit.WAN ? "万" : (tile.suit === Suit.TONG ? "筒" : "条");
      }

      return (
        <div className={`flex flex-col items-center justify-center font-black leading-tight ${colorClass} ${size === 'sm' ? 'scale-75' : ''}`}>
             {tile.suit === Suit.DRAGON ? (
                 tile.value === 3 ? (
                    <div className="w-6 h-8 border-2 border-blue-800 rounded-sm" />
                 ) : (
                    <span className="text-2xl">{topChar}</span>
                 )
             ) : (
                 <>
                    <span className="text-lg">{topChar}</span>
                    <span className="text-lg">{bottomChar}</span>
                 </>
             )}
        </div>
      )
  }

  return (
    <div 
      onClick={onClick}
      className={`
        relative flex justify-center items-center 
        bg-white border-b-4 border-r-2 border-slate-300 rounded-md shadow-md
        select-none transition-all duration-100
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer active:scale-95 hover:-translate-y-1' : ''}
        ${isNewDraw ? 'ml-3 sm:ml-4' : ''}
        ${className}
      `}
      style={{
          background: 'linear-gradient(to bottom right, #ffffff, #f1f5f9)'
      }}
    >
      {/* Wildcard Indicator */}
      {isWild && (
        <div className="absolute -top-1.5 -left-1.5 z-10 bg-yellow-400 text-yellow-900 text-[10px] px-1 rounded shadow-sm border border-yellow-500 font-bold scale-75 sm:scale-100 origin-bottom-right">
          癞
        </div>
      )}

      {renderVerticalText()}
    </div>
  );
};

export default Tile;

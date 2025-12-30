import React, { useState } from 'react';
import { TileData, Suit } from '../types';
import { getBaseTiles, isSameTileType, sortHand } from '../utils/gameLogic';
import Tile from './Tile';
import { X, Check, RotateCcw } from 'lucide-react';

interface CustomHandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newHand: TileData[]) => void;
  currentWildcard: TileData | null;
}

const CustomHandModal: React.FC<CustomHandModalProps> = ({ isOpen, onClose, onSave, currentWildcard }) => {
  const [tempHand, setTempHand] = useState<TileData[]>([]);
  const baseTiles = getBaseTiles();

  if (!isOpen) return null;

  const handleAddTile = (baseTile: TileData) => {
    if (tempHand.length >= 14) return;
    // Create a new instance with unique ID
    const newTile: TileData = {
        ...baseTile,
        id: Math.random().toString(36).substr(2, 9)
    };
    const newHand = [...tempHand, newTile];
    // Auto sort for better UX while building
    setTempHand(sortHand(newHand, currentWildcard));
  };

  const handleRemoveTile = (id: string) => {
    setTempHand(prev => prev.filter(t => t.id !== id));
  };

  const handleClear = () => {
    setTempHand([]);
  };

  const handleConfirm = () => {
      // Must have at least 1 tile (usually 13 or 14, but we allow flexible for testing)
      // Though strictly game logic expects 13 or 14. 
      // The game loop expects 13 to be "waiting for draw" and 14 to be "waiting for discard".
      // We will allow saving whatever, but warn or fill? Let's just save.
      onSave(tempHand);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">自定义牌型</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Current Hand Preview */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 min-h-[120px]">
                <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-green-800">当前手牌 ({tempHand.length}/14)</span>
                    <button onClick={handleClear} className="text-xs flex items-center gap-1 text-red-600 hover:text-red-700">
                        <RotateCcw size={12}/> 清空
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {tempHand.length === 0 && <span className="text-gray-400 text-sm py-4">点击下方牌库添加手牌...</span>}
                    {tempHand.map((tile) => (
                        <Tile 
                            key={tile.id} 
                            tile={tile} 
                            wildcard={currentWildcard} 
                            onClick={() => handleRemoveTile(tile.id)}
                            size="sm"
                        />
                    ))}
                </div>
            </div>

            {/* Selection Area */}
            <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-3">点击添加牌</h3>
                <div className="grid grid-cols-1 gap-4">
                    {/* Wan */}
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded">
                        {baseTiles.filter(t => t.suit === Suit.WAN).map(t => (
                            <Tile key={t.id} tile={t} wildcard={currentWildcard} onClick={() => handleAddTile(t)} size="sm" className="hover:scale-110" />
                        ))}
                    </div>
                    {/* Tong */}
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded">
                        {baseTiles.filter(t => t.suit === Suit.TONG).map(t => (
                            <Tile key={t.id} tile={t} wildcard={currentWildcard} onClick={() => handleAddTile(t)} size="sm" className="hover:scale-110" />
                        ))}
                    </div>
                    {/* Tiao */}
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded">
                        {baseTiles.filter(t => t.suit === Suit.TIAO).map(t => (
                            <Tile key={t.id} tile={t} wildcard={currentWildcard} onClick={() => handleAddTile(t)} size="sm" className="hover:scale-110" />
                        ))}
                    </div>
                    {/* Dragon */}
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded">
                        {baseTiles.filter(t => t.suit === Suit.DRAGON).map(t => (
                            <Tile key={t.id} tile={t} wildcard={currentWildcard} onClick={() => handleAddTile(t)} size="sm" className="hover:scale-110" />
                        ))}
                    </div>
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">取消</button>
            <button 
                onClick={handleConfirm} 
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                disabled={tempHand.length === 0}
            >
                <Check size={18} /> 确认修改
            </button>
        </div>
      </div>
    </div>
  );
};

export default CustomHandModal;

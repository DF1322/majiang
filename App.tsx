import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateDeck, shuffleDeck, sortHand, getTileName, handToString, isSameTileType } from './utils/gameLogic';
import { TileData, GameStats } from './types';
import Tile from './components/Tile';
import CustomHandModal from './components/CustomHandModal';
import { RefreshCw, Clipboard, Trophy, Settings, BarChart3, HelpCircle } from 'lucide-react';

const App: React.FC = () => {
  // Game State
  const [deck, setDeck] = useState<TileData[]>([]);
  const [hand, setHand] = useState<TileData[]>([]);
  const [wildcard, setWildcard] = useState<TileData | null>(null);
  const [discarded, setDiscarded] = useState<TileData[]>([]);
  
  // Stats
  const [turnCount, setTurnCount] = useState(0);
  const [history, setHistory] = useState<GameStats[]>([]);
  
  // UI State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [lastAction, setLastAction] = useState<string>('游戏开始');
  const [autoDrawTimer, setAutoDrawTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // 初始化游戏
  const initGame = useCallback(() => {
    const fullDeck = generateDeck();
    const shuffled = shuffleDeck(fullDeck);
    
    // 1. 确定癞子 (随机抽一张，其类型即为癞子)
    // 实际上通常是翻一张，这张的下一张是癞子，或者直接指定这张是癞子。
    // 这里简单处理：随机取一种存在的牌做癞子。
    // 为了公平，我们先发牌再定癞子，或者先定。这里先定。
    // Pick a random tile from deck as reference for wildcard type
    const wildcardRefIndex = Math.floor(Math.random() * shuffled.length);
    const wildcardRef = shuffled[wildcardRefIndex];
    
    // 2. 发牌 (13张)
    // Note: We don't remove the wildcard ref from deck unless we want to simulate "flipped" tile.
    // Let's keep it simple: Just use the value/suit.
    
    const initialHand = shuffled.slice(0, 13);
    const remainingDeck = shuffled.slice(13);
    
    // Sort initial hand for better UX
    const sortedHand = sortHand(initialHand, wildcardRef);

    setWildcard(wildcardRef);
    setDeck(remainingDeck);
    setHand(sortedHand);
    setDiscarded([]);
    setTurnCount(1); // Round 1 starts with the first draw
    setLastAction('新游戏开始');
    
    // Trigger first draw automatically after a short delay
    setTimeout(() => {
        drawTile(remainingDeck, sortedHand);
    }, 500);
  }, []);

  // 摸牌逻辑
  const drawTile = (currentDeck: TileData[], currentHand: TileData[]) => {
    if (currentDeck.length === 0) {
      setLastAction('流局 - 牌墙摸空');
      return;
    }
    
    const newTile = currentDeck[0];
    const nextDeck = currentDeck.slice(1);
    
    setDeck(nextDeck);
    setHand([...currentHand, newTile]);
    setLastAction(`摸入: ${getTileName(newTile)}`);
  };

  // 打牌逻辑
  const handleDiscard = (tileToDiscard: TileData) => {
    // Prevent discarding if it's not player's turn (hand != 14)
    if (hand.length % 3 !== 2) return; // Standard mahjong hand count: 1, 4, 7, 10, 13 + 1 = 14. Mod 3 should be 2.

    const newHand = hand.filter(t => t.id !== tileToDiscard.id);
    setHand(newHand);
    setDiscarded(prev => [tileToDiscard, ...prev]);
    setTurnCount(prev => prev + 1);
    setLastAction(`打出: ${getTileName(tileToDiscard)}`);

    // Auto draw after 500ms
    if (autoDrawTimer) clearTimeout(autoDrawTimer);
    const timer = setTimeout(() => {
        drawTile(deck, newHand);
    }, 600);
    setAutoDrawTimer(timer);
  };

  // 理牌
  const handleSort = () => {
    setHand(prev => sortHand(prev, wildcard));
    setLastAction('理牌完成');
  };

  // 复制牌型
  const handleCopy = () => {
    const text = handToString(hand, wildcard);
    navigator.clipboard.writeText(text).then(() => {
      setLastAction('牌型已复制到剪贴板');
    });
  };

  // 记录胡牌
  const handleWin = () => {
    const newRecord: GameStats = {
      id: Date.now().toString(),
      date: new Date().toLocaleTimeString(),
      rounds: turnCount
    };
    setHistory(prev => [newRecord, ...prev].slice(0, 10)); // Keep last 10
    setLastAction(`胡牌！本次耗时 ${turnCount} 轮`);
    
    // Don't auto-reset, let user admire the hand or click reset.
    if (autoDrawTimer) clearTimeout(autoDrawTimer);
  };

  // 自定义牌型保存
  const handleCustomHandSave = (newHand: TileData[]) => {
      // If user sets 13 tiles, trigger a draw. If 14, wait for discard.
      setHand(newHand);
      setLastAction('已应用自定义牌型');
      
      // Reset deck roughly (randomize again since we don't know what user picked)
      // In a real trainer we might subtract used tiles, but here we just shuffle leftovers.
      const fullDeck = generateDeck();
      // Remove tiles that are in hand roughly (by type matching) to be slightly realistic
      const tempHand = [...newHand];
      const filteredDeck = fullDeck.filter(d => {
          const idx = tempHand.findIndex(h => isSameTileType(h, d));
          if (idx !== -1) {
              tempHand.splice(idx, 1);
              return false;
          }
          return true;
      });
      
      setDeck(shuffleDeck(filteredDeck));
      setTurnCount(1);
      
      // If 13 tiles, draw one
      if (newHand.length % 3 === 1) {
           setTimeout(() => {
            // Need to pass the fresh state refs
             const freshDeck = shuffleDeck(filteredDeck); // Logic above was for state set, recalculate for local use or use functional update effects. 
             // Easier to just let effect or manual trigger.
             // Actually, let's just trigger draw if length is 13.
             // But wait, state update is async.
           }, 500);
      }
  };

  // Effect to handle "Auto Draw" logic after Custom Hand setup if needed
  // Using a simplified approach: If length is 13, user needs to hit "Next Turn" or we auto draw? 
  // User asked for "Play then Auto Draw".
  useEffect(() => {
      // First Load
      initGame();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Separate effect for custom hand flow check
  useEffect(() => {
      if (hand.length % 3 === 1 && deck.length > 0 && !isCustomModalOpen) {
          // If we end up with 13 tiles (e.g. after custom edit), draw immediately
           const timer = setTimeout(() => {
              drawTile(deck, hand);
           }, 500);
           return () => clearTimeout(timer);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hand.length, isCustomModalOpen]);


  return (
    <div className="min-h-screen flex flex-col max-w-5xl mx-auto px-4 py-6 font-sans">
      
      {/* Top Bar: Stats & Controls */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <span className="bg-blue-600 text-white p-1 rounded">麻</span>
             麻将牌效训练器
           </h1>
           <p className="text-slate-500 text-sm mt-1">
             当前轮数: <span className="font-bold text-blue-600 text-lg">{turnCount}</span> | 剩余牌山: {deck.length}
           </p>
        </div>

        <div className="flex gap-2">
            <button onClick={initGame} className="flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-lg transition">
                <RefreshCw size={18} /> 重置
            </button>
            <button onClick={() => setIsCustomModalOpen(true)} className="flex items-center gap-1 bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg transition">
                <Settings size={18} /> 自定义
            </button>
             <button onClick={handleWin} className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg transition">
                <Trophy size={18} /> 记录胡牌
            </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col justify-center items-center gap-8 relative">
        
        {/* Info Banner */}
        <div className="w-full bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
             <div className="flex items-center gap-2">
                 <span className="text-slate-400 text-xs uppercase tracking-wider">最新动态</span>
                 <span className="font-medium text-slate-700">{lastAction}</span>
             </div>
             {wildcard && (
                 <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded border border-yellow-200">
                     <span className="text-xs text-yellow-800 font-bold">本局癞子</span>
                     <span className="font-bold text-slate-800">{getTileName(wildcard)}</span>
                 </div>
             )}
        </div>

        {/* The Table/Hand Area */}
        <div className="w-full bg-green-800 rounded-xl p-4 md:p-8 shadow-inner relative min-h-[300px] flex flex-col justify-between">
            
            {/* Discard Pile (Simple Visual) */}
            <div className="flex flex-wrap content-start gap-1 justify-center h-32 overflow-hidden opacity-80 mb-4">
                {discarded.slice(0, 24).map((t, i) => (
                    <div key={`${t.id}-discard-${i}`} className="w-6 h-8 bg-slate-200 rounded-sm border border-slate-400 flex justify-center items-center text-[10px] text-slate-500 select-none">
                       {getTileName(t)}
                    </div>
                ))}
            </div>

            {/* Hand Tiles */}
            <div className="flex items-end justify-center gap-1 sm:gap-2 select-none overflow-x-auto pb-2 px-2 no-scrollbar w-full">
                {/* Standard Hand (0 to 12) */}
                {hand.slice(0, hand.length % 3 === 2 ? hand.length - 1 : hand.length).map((tile) => (
                    <Tile 
                        key={tile.id} 
                        tile={tile} 
                        wildcard={wildcard} 
                        onClick={() => handleDiscard(tile)}
                    />
                ))}
                
                {/* Drawn Tile (The 14th one) */}
                {hand.length % 3 === 2 && (
                    <Tile 
                        tile={hand[hand.length - 1]} 
                        wildcard={wildcard} 
                        isNewDraw={true}
                        onClick={() => handleDiscard(hand[hand.length - 1])}
                    />
                )}
            </div>
            
             <div className="absolute top-4 right-4 text-white/50 text-xs">
                点击牌张打出
            </div>
        </div>

        {/* Action Bar */}
        <div className="flex gap-4 w-full justify-center">
            <button onClick={handleSort} className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition active:translate-y-1 font-bold text-lg">
                <BarChart3 size={20} /> 理牌
            </button>
            <button onClick={handleCopy} className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-white hover:bg-gray-50 text-slate-700 border border-slate-300 px-6 py-3 rounded-xl shadow-sm transition active:translate-y-1 font-medium">
                <Clipboard size={20} /> 复制牌型
            </button>
        </div>

      </main>

      {/* History Section */}
      <section className="mt-10 border-t pt-6">
        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20}/>
            近期胡牌战绩
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {history.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    暂无胡牌记录，加油！
                </div>
            )}
            {history.map((record, idx) => (
                <div key={record.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center">
                    <span className="text-xs text-slate-400 mb-1">{record.date}</span>
                    <span className="text-xl font-black text-blue-600">{record.rounds} <span className="text-xs font-normal text-slate-500">轮</span></span>
                    {idx === 0 && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded mt-1">New</span>}
                </div>
            ))}
        </div>
      </section>

      {/* Modals */}
      <CustomHandModal 
        isOpen={isCustomModalOpen} 
        onClose={() => setIsCustomModalOpen(false)}
        onSave={handleCustomHandSave}
        currentWildcard={wildcard}
      />

    </div>
  );
};

export default App;
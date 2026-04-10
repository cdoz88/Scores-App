import React, { useState } from 'react';
import { Dribbble, Trophy, Play } from 'lucide-react';
import { HoopsGame } from './games/HoopsGame';
import { GridironGame } from './games/GridironGame';

export const Halftime = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  if (activeGame === 'hoops') {
    return <HoopsGame onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === 'gridiron') {
    return <GridironGame onBack={() => setActiveGame(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black uppercase tracking-tighter text-white">
          Halftime Games
        </h2>
        <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
          <Trophy size={14} className="text-[#9df01c]" />
          Win Coins & Rewards
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <GameCard
          title="Pro Hoops"
          description="Test your shooting skills in this fast-paced basketball challenge."
          icon={<Dribbble size={40} className="text-[#9df01c]" />}
          onClick={() => setActiveGame('hoops')}
          color="bg-orange-500/10 border-orange-500/20"
        />
        <GameCard
          title="Gridiron Kick"
          description="Master the field goal in our realistic football kicking simulator."
          icon={<Trophy size={40} className="text-[#9df01c]" />}
          onClick={() => setActiveGame('gridiron')}
          color="bg-green-500/10 border-green-500/20"
        />
      </div>
    </div>
  );
};

interface GameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}

const GameCard = ({ title, description, icon, onClick, color }: GameCardProps) => (
  <div
    onClick={onClick}
    className={cn(
      "relative group cursor-pointer rounded-3xl border p-8 transition-all duration-300 hover:scale-[1.02] overflow-hidden",
      color
    )}
  >
    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
      {icon}
    </div>
    
    <div className="relative z-10 space-y-4">
      <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-800 group-hover:border-[#9df01c] transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="text-2xl font-black uppercase tracking-tighter text-white group-hover:text-[#9df01c] transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-[200px]">
          {description}
        </p>
      </div>
      <button className="flex items-center gap-2 bg-white text-gray-900 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest group-hover:bg-[#9df01c] transition-colors">
        <Play size={14} fill="currentColor" />
        Play Now
      </button>
    </div>
  </div>
);

import { cn } from '../lib/utils';

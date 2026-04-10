/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SegmentedControl } from './components/SegmentedControl';
import { Scoreboard } from './components/Scoreboard';
import { Fantasy } from './components/Fantasy';
import { GameDetails } from './components/GameDetails';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  const [activeTab, setActiveTab] = useState('scores');
  const [selectedGame, setSelectedGame] = useState<{ id: string; league: string } | null>(null);

  // Lifted Scoreboard state
  const [scoreboardDate, setScoreboardDate] = useState(new Date());
  const [selectedSport, setSelectedSport] = useState<string>('ALL SPORTS');
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');

  const tabs = [
    { id: 'scores', label: 'Scores' },
    { id: 'fantasy', label: 'Fantasy' },
  ];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedGame(null); // Reset detail view when switching tabs
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#121212] text-gray-200 selection:bg-[#9df01c] selection:text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
          <header className="flex flex-col items-center mb-4">
            <SegmentedControl
              activeTab={activeTab}
              onTabChange={handleTabChange}
              tabs={tabs}
            />
          </header>

          <main>
            <AnimatePresence mode="wait">
              {selectedGame ? (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <GameDetails 
                    gameId={selectedGame.id} 
                    leagueId={selectedGame.league} 
                    onBack={() => setSelectedGame(null)} 
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {activeTab === 'scores' && (
                    <Scoreboard 
                      onSelectGame={(id, league) => setSelectedGame({ id, league })} 
                      date={scoreboardDate}
                      setDate={setScoreboardDate}
                      selectedSport={selectedSport}
                      setSelectedSport={setSelectedSport}
                      selectedLeague={selectedLeague}
                      setSelectedLeague={setSelectedLeague}
                    />
                  )}
                  {activeTab === 'fantasy' && <Fantasy />}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Bottom Navigation Bar (Mobile Only) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A]/80 backdrop-blur-xl border-t border-gray-800 px-6 py-4 flex justify-between items-center sm:hidden z-40">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                activeTab === tab.id ? "text-[#9df01c]" : "text-gray-500"
              )}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabDot"
                  className="w-1 h-1 bg-[#9df01c] rounded-full"
                />
              )}
            </button>
          ))}
        </nav>
      </div>
    </QueryClientProvider>
  );
}

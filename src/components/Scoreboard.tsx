import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchScoreboard, LEAGUES } from '../services/espnService';
import { GameCard } from './GameCard';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { CalendarPicker } from './CalendarPicker';
import { Game } from '../types';
import { Dropdown } from './Dropdown';
import { AllSportsIcon, FootballIcon, BasketballIcon, BaseballIcon, HockeyIcon, GolfIcon, SoccerIcon } from './icons';

interface ScoreboardProps {
  onSelectGame: (id: string, league: string) => void;
  date: Date;
  setDate: (date: Date) => void;
  selectedSport: string;
  setSelectedSport: (sport: string) => void;
  selectedLeague: string;
  setSelectedLeague: (league: string) => void;
}

const SPORT_OPTIONS = [
  { value: 'ALL SPORTS', label: 'All Sports', icon: <AllSportsIcon /> },
  { value: 'FOOTBALL', label: 'Football', icon: <FootballIcon /> },
  { value: 'BASKETBALL', label: 'Basketball', icon: <BasketballIcon /> },
  { value: 'BASEBALL', label: 'Baseball', icon: <BaseballIcon /> },
  { value: 'HOCKEY', label: 'Hockey', icon: <HockeyIcon /> },
  { value: 'GOLF', label: 'Golf', icon: <GolfIcon /> },
  { value: 'SOCCER', label: 'Soccer', icon: <SoccerIcon /> },
];

export const Scoreboard = ({ 
  onSelectGame,
  date,
  setDate,
  selectedSport,
  setSelectedSport,
  selectedLeague,
  setSelectedLeague
}: ScoreboardProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableLeagues = useMemo(() => {
    if (selectedSport === 'ALL SPORTS') return [];
    return LEAGUES.filter(l => l.sport.toUpperCase() === selectedSport);
  }, [selectedSport]);

  const handleSportChange = (value: string) => {
    setSelectedSport(value);
    setSelectedLeague('ALL');
  };

  const { data: games, isLoading } = useQuery({
    queryKey: ['scoreboard', selectedSport, selectedLeague, format(date, 'yyyyMMdd')],
    queryFn: async () => {
      let leaguesToFetch: string[] = [];
      
      if (selectedSport === 'ALL SPORTS') {
        leaguesToFetch = LEAGUES.map(l => l.id);
      } else if (selectedLeague === 'ALL') {
        leaguesToFetch = availableLeagues.map(l => l.id);
      } else {
        leaguesToFetch = [selectedLeague];
      }
      
      const results = await Promise.all(
        leaguesToFetch.map(id => fetchScoreboard(id, format(date, 'yyyyMMdd')))
      );
      return results.flat();
    },
  });

  const groupedGames = useMemo(() => {
    if (!games) return {};
    const groups: Record<string, Game[]> = {};
    games.forEach(game => {
      if (!groups[game.league]) {
        groups[game.league] = [];
      }
      groups[game.league].push(game);
    });
    return groups;
  }, [games]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        {/* League and Sport Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto z-30">
          <div className="relative w-full sm:w-48">
            <Dropdown
              value={selectedSport}
              options={SPORT_OPTIONS}
              onChange={handleSportChange}
            />
          </div>

          <div className="relative w-full sm:w-40">
            <Dropdown
              value={selectedLeague}
              options={[
                { value: 'ALL', label: 'ALL' },
                ...availableLeagues.map(l => ({ value: l.id, label: l.name }))
              ]}
              onChange={setSelectedLeague}
              disabled={selectedSport === 'ALL SPORTS'}
            />
          </div>
        </div>

        {/* Date Picker */}
        <div className="relative flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end z-50" ref={calendarRef}>
          <button
            onClick={() => setDate(subDays(date, 1))}
            className="p-2.5 bg-[#2c2c2c] hover:bg-[#374151] rounded-lg transition-colors text-gray-300"
          >
            <ChevronLeft size={16} />
          </button>
          
          <button
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className="flex items-center justify-between w-28 px-4 py-2.5 bg-[#2c2c2c] hover:bg-[#374151] rounded-lg transition-colors font-bold text-sm text-gray-200 uppercase tracking-wide"
          >
            <span className="w-full text-center">{isToday(date) ? 'TODAY' : format(date, 'MMM d')}</span>
            <ChevronDown size={14} className="text-gray-400 ml-2" />
          </button>

          <button
            onClick={() => setDate(addDays(date, 1))}
            className="p-2.5 bg-[#2c2c2c] hover:bg-[#374151] rounded-lg transition-colors text-gray-300"
          >
            <ChevronRight size={16} />
          </button>

          {isCalendarOpen && (
            <CalendarPicker 
              selectedDate={date} 
              onSelect={setDate} 
              onClose={() => setIsCalendarOpen(false)} 
            />
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-800/50 animate-pulse rounded-xl border border-gray-700/50" />
          ))}
        </div>
      ) : games?.length === 0 ? (
        <div className="text-center py-20 bg-gray-800/30 rounded-2xl border border-dashed border-gray-700">
          <p className="text-gray-500 font-bold uppercase tracking-widest">No games scheduled</p>
        </div>
      ) : (
        <div className="space-y-8">
          {LEAGUES.filter(l => groupedGames[l.id]).map(league => (
            <div key={league.id} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
                <div className="w-3 h-3 rounded-full bg-[#9df01c]" />
                <h2 className="text-xl font-black uppercase tracking-widest">{league.name}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupedGames[league.id].map(game => (
                  <GameCard 
                    key={game.id} 
                    game={game} 
                    onClick={() => onSelectGame(game.id, game.league)} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

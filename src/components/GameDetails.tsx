import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, MapPin, Tv, Info, Users, List, RefreshCw, Cloud, Circle, Square, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { fetchGameSummary } from '../services/espnService';
import { cn, getTeamLogo } from '../lib/utils';

interface GameDetailsProps {
  gameId: string;
  leagueId: string;
  onBack: () => void;
}

export const GameDetails = ({ gameId, leagueId, onBack }: GameDetailsProps) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'boxscore' | 'plays'>('summary');
  const [boxscoreTab, setBoxscoreTab] = useState<'team' | 'away' | 'home'>('team');
  const [hasSetDefaultTab, setHasSetDefaultTab] = useState(false);

  const queryClient = useQueryClient();

  // Find the game in the scoreboard cache to get fallback data (odds, broadcasts, date)
  const scoreboardQueries = queryClient.getQueriesData({ queryKey: ['scoreboard'] });
  let fallbackGame: any = null;
  for (const [key, data] of scoreboardQueries) {
    const games = data as any[];
    if (games && Array.isArray(games)) {
      const found = games.find(g => g.id === gameId);
      if (found) {
        fallbackGame = found;
        break;
      }
    }
  }

  const { data: summary, isLoading, isFetching } = useQuery({
    queryKey: ['gameSummary', leagueId, gameId, fallbackGame?.date],
    queryFn: () => fetchGameSummary(leagueId, gameId, fallbackGame?.date),
  });

  useEffect(() => {
    if (summary && !hasSetDefaultTab) {
      const state = summary.header?.competitions?.[0]?.status?.type?.state;
      const isCompleted = summary.header?.competitions?.[0]?.status?.type?.completed;
      
      if (state === 'in' || state === 'post' || isCompleted) {
        setActiveTab('boxscore');
      }
      setHasSetDefaultTab(true);
    }
  }, [summary, hasSetDefaultTab]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-[#9df01c] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 font-bold uppercase tracking-widest animate-pulse">Loading Game Data...</p>
      </div>
    );
  }

  if (!summary) {
    if (leagueId === 'PGA' && fallbackGame && fallbackGame.golfCompetitors) {
      // Use fallback game data to render the leaderboard
      const eventName = fallbackGame.name || fallbackGame.shortName || 'Event Details';
      const statusDetail = fallbackGame.status?.detail || 'Status Unavailable';
      const sortedCompetitors = fallbackGame.golfCompetitors;

      return (
        <div className="max-w-4xl mx-auto pb-16 sm:pb-24">
          <div className="sticky top-0 z-10 bg-[#121212] pt-0 pb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button 
                  onClick={onBack}
                  className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['gameSummary', leagueId, gameId] })}
                  className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <RefreshCw size={20} className={cn("transition-transform", isFetching && "animate-spin")} />
                </button>
              </div>
            </div>
            <div className="mb-6 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{eventName}</h2>
              <p className="text-sm font-normal text-[#9df01c] uppercase tracking-wider">{statusDetail}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-[#333] border-b border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-center">Rank</th>
                  <th className="px-4 py-3">Athlete</th>
                  <th className="px-4 py-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 bg-[#2A2A2A]">
                {sortedCompetitors.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-gray-400">Leaderboard data not available.</td>
                  </tr>
                ) : (
                  sortedCompetitors.slice(0, 20).map((c: any, index: number) => {
                    const rank = c.order || (index + 1);
                    const name = c.athlete?.displayName || c.team?.displayName || 'Unknown';
                    const score = c.score || c.statistics?.[0]?.displayValue || c.linescores?.[0]?.value || '-';
                    const flagImg = c.athlete?.flag?.href ? (
                      <img src={c.athlete.flag.href} className="w-4 h-3 inline-block mr-2" alt="flag" />
                    ) : null;
                    
                    return (
                      <tr key={index} className="border-b border-gray-700 hover:bg-[#3e3e3e] transition-colors">
                        <td className="px-4 py-3 font-bold text-gray-300 w-16 text-center">{rank}</td>
                        <td className="px-4 py-3 font-semibold text-white">{flagImg}{name}</td>
                        <td className="px-4 py-3 font-bold text-right text-[#9df01c]">{score}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-gray-400 font-bold uppercase tracking-widest">Game Data Unavailable</p>
        <button onClick={onBack} className="text-[#9df01c] font-bold">Go Back</button>
      </div>
    );
  }

  const header = summary.header;
  const competition = header?.competitions?.[0];
  
  if (leagueId === 'PGA') {
    const eventName = header?.name || header?.shortName || 'Event Details';
    const statusDetail = competition?.status?.type?.detail || 'Status Unavailable';
    const competitors = competition?.competitors || [];
    const sortedCompetitors = [...competitors].sort((a: any, b: any) => (a.order || 999) - (b.order || 999));

    return (
      <div className="max-w-4xl mx-auto pb-16 sm:pb-24">
        <div className="sticky top-0 z-10 bg-[#121212] pt-0 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button 
                onClick={onBack}
                className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-full transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['gameSummary', leagueId, gameId] })}
                className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-full transition-colors"
              >
                <RefreshCw size={20} className={cn("transition-transform", isFetching && "animate-spin")} />
              </button>
            </div>
          </div>
          <div className="mb-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{eventName}</h2>
            <p className="text-sm font-normal text-[#9df01c] uppercase tracking-wider">{statusDetail}</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-[#333] border-b border-gray-600">
              <tr>
                <th className="px-4 py-3 text-center">Rank</th>
                <th className="px-4 py-3">Athlete</th>
                <th className="px-4 py-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 bg-[#2A2A2A]">
              {sortedCompetitors.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-gray-400">Leaderboard data not available.</td>
                </tr>
              ) : (
                sortedCompetitors.slice(0, 20).map((c: any, index: number) => {
                  const rank = c.order || (index + 1);
                  const name = c.athlete?.displayName || c.team?.displayName || 'Unknown';
                  const score = c.score || c.statistics?.[0]?.displayValue || c.linescores?.[0]?.value || '-';
                  const flagImg = c.athlete?.flag?.href ? (
                    <img src={c.athlete.flag.href} className="w-4 h-3 inline-block mr-2" alt="flag" />
                  ) : null;
                  
                  return (
                    <tr key={index} className="border-b border-gray-700 hover:bg-[#3e3e3e] transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-300 w-16 text-center">{rank}</td>
                      <td className="px-4 py-3 font-semibold text-white">{flagImg}{name}</td>
                      <td className="px-4 py-3 font-bold text-right text-[#9df01c]">{score}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!competition) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <p className="text-gray-400 font-bold uppercase tracking-widest">Game Data Unavailable</p>
      <button onClick={onBack} className="text-[#9df01c] font-bold">Go Back</button>
    </div>
  );

  const away = competition?.competitors?.find((c: any) => c.homeAway === 'away');
  const home = competition?.competitors?.find((c: any) => c.homeAway === 'home');
  
  if (!away || !home) return null;

  const boxscore = summary.boxscore;
  const plays = summary.plays;
  const scoringPlays = summary.scoringPlays;
  const isSoccer = ['EPL', 'MLS', 'UCL', 'UEL', 'ESP', 'GER', 'ITA', 'FRA', 'NED', 'MEX'].includes(leagueId);
  const soccerEvents = summary.keyEvents || summary.details || summary.plays || [];
  
  const getPlayTeamLogo = (playTeam: any) => {
    if (!playTeam) return null;
    if (playTeam.id === away.team.id) return getTeamLogo(away.team);
    if (playTeam.id === home.team.id) return getTeamLogo(home.team);
    return getTeamLogo(playTeam);
  };
  
  // Handle odds as an array
  let oddsList = [];
  if (summary.pickcenter && summary.pickcenter.length > 0) {
    oddsList = summary.pickcenter;
  } else if (competition.odds && competition.odds.length > 0) {
    oddsList = competition.odds;
  } else if (fallbackGame?.odds && fallbackGame.odds.length > 0) {
    oddsList = fallbackGame.odds;
  }
  
  const weather = summary.gameInfo?.weather;
  const broadcasts = competition.broadcasts || summary.broadcasts || competition.geoBroadcasts || summary.geoBroadcasts || fallbackGame?.broadcasts || [];
  const lastPlayText = summary.drives?.current?.plays?.slice(-1)[0]?.text || summary.plays?.slice(-1)[0]?.text || '';

  return (
    <div className="max-w-4xl mx-auto pb-16 sm:pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#121212] pt-0 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={onBack}
              className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-full transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['gameSummary', leagueId, gameId] })}
              className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-full transition-colors"
            >
              <RefreshCw size={20} className={cn("transition-transform", isFetching && "animate-spin")} />
            </button>
          </div>
          <div className="text-[#9df01c] text-xs font-bold uppercase tracking-widest">
            {competition.status.type.detail}
          </div>
        </div>

        {/* Scoreboard Section */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 mb-4">
          {/* Away Team */}
          <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1">
            <img 
              src={getTeamLogo(away.team)} 
              alt={away.team.name} 
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => { e.currentTarget.src = `https://placehold.co/48x48/1f2937/ffffff?text=${away.team.abbreviation || '?'}` }}
            />
            <p className="text-[10px] sm:text-xs text-gray-400 font-bold">{away.record?.[0]?.summary || '0-0'}</p>
          </div>

          {/* Score */}
          <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-4">
            <span className={cn(
              "text-3xl sm:text-6xl font-black",
              parseInt(away.score) > parseInt(home.score) ? "text-white" : "text-gray-300"
            )}>
              {away.score}
            </span>
            <span className="text-gray-600 text-xl sm:text-3xl font-black">-</span>
            <span className={cn(
              "text-3xl sm:text-6xl font-black",
              parseInt(home.score) > parseInt(away.score) ? "text-white" : "text-gray-300"
            )}>
              {home.score}
            </span>
          </div>

          {/* Home Team */}
          <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1">
            <img 
              src={getTeamLogo(home.team)} 
              alt={home.team.name} 
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => { e.currentTarget.src = `https://placehold.co/48x48/1f2937/ffffff?text=${home.team.abbreviation || '?'}` }}
            />
            <p className="text-[10px] sm:text-xs text-gray-400 font-bold">{home.record?.[0]?.summary || '0-0'}</p>
          </div>
        </div>

        {/* Last Play */}
        {lastPlayText && (
          <div className="text-center py-2 border-t border-b border-gray-800 mb-4">
            <p className="text-sm text-gray-300">
              <span className="font-bold">Last Play:</span> {lastPlayText}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-center gap-4 sm:gap-8 border-b border-gray-800">
          {[
            { id: 'summary', label: 'GAME INFO' },
            { id: 'boxscore', label: 'BOX SCORE' },
            { id: 'plays', label: 'SCORING' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-3 text-xs font-bold uppercase tracking-widest transition-colors relative",
                activeTab === tab.id 
                  ? "text-white" 
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#9df01c] rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'summary' && (
            <div className="space-y-3">
              {/* Game Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-gray-800/30 border border-gray-700/50 p-2.5 sm:p-3 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <div className="p-1 sm:p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
                      <MapPin size={14} className="sm:w-[16px] sm:h-[16px]" />
                    </div>
                    <h4 className="font-bold text-[10px] sm:text-xs uppercase tracking-widest">Venue</h4>
                  </div>
                  <p className="text-sm sm:text-base font-bold leading-tight">{summary.gameInfo?.venue?.fullName || 'N/A'}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{summary.gameInfo?.venue?.address?.city}, {summary.gameInfo?.venue?.address?.state}</p>
                </div>

                {weather && (
                  <div className="bg-gray-800/30 border border-gray-700/50 p-2.5 sm:p-3 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                      <div className="p-1 sm:p-1.5 bg-yellow-500/10 rounded-lg text-yellow-400">
                        <Cloud size={14} className="sm:w-[16px] sm:h-[16px]" />
                      </div>
                      <h4 className="font-bold text-[10px] sm:text-xs uppercase tracking-widest">Weather</h4>
                    </div>
                    <p className="text-sm sm:text-base font-bold leading-tight">{weather.temperature}°F</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{weather.displayValue}</p>
                  </div>
                )}

                <div className="bg-gray-800/30 border border-gray-700/50 p-2.5 sm:p-3 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <div className="p-1 sm:p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
                      <Tv size={14} className="sm:w-[16px] sm:h-[16px]" />
                    </div>
                    <h4 className="font-bold text-[10px] sm:text-xs uppercase tracking-widest">Broadcast</h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {broadcasts.length > 0 ? broadcasts.map((b: any, i: number) => (
                      <span key={i} className="px-1.5 py-0.5 bg-gray-700 rounded text-[9px] sm:text-[10px] font-bold">
                        {b.names?.[0] || b.media?.shortName || 'N/A'}
                      </span>
                    )) : <span className="text-gray-500 text-[10px] sm:text-xs">N/A</span>}
                  </div>
                </div>
              </div>

              {/* Odds */}
              {oddsList && oddsList.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  {oddsList.map((oddsItem: any, i: number) => (
                    <div key={i} className="bg-gray-800/30 border border-gray-700/50 p-3 sm:p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-[#9df01c] rounded-full" />
                          Betting Odds
                        </h4>
                        {oddsItem.provider?.name && (
                          <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-800 px-1.5 py-0.5 rounded">
                            {oddsItem.provider.name}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:gap-6">
                        <div>
                          <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Spread</p>
                          <p className="text-base sm:text-lg font-black leading-tight">{oddsItem.details || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Over/Under</p>
                          <p className="text-base sm:text-lg font-black leading-tight">{oddsItem.overUnder || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'boxscore' && (
            <div className="space-y-4">
              {/* Boxscore Sub-tabs */}
              <div className="flex bg-gray-800/50 p-1 rounded-xl">
                <button
                  onClick={() => setBoxscoreTab('team')}
                  className={cn(
                    "flex-1 py-2 text-xs sm:text-sm font-bold uppercase tracking-widest rounded-lg transition-all",
                    boxscoreTab === 'team' ? "bg-gray-700 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  Team
                </button>
                <button
                  onClick={() => setBoxscoreTab('away')}
                  className={cn(
                    "flex-1 py-2 text-xs sm:text-sm font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2",
                    boxscoreTab === 'away' ? "bg-gray-700 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  <img src={getTeamLogo(away.team)} className="w-4 h-4 object-contain hidden sm:block" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = `https://placehold.co/48x48/1f2937/ffffff?text=${away.team.abbreviation || '?'}` }} />
                  <span className="hidden sm:inline">{away.team.displayName || away.team.name || away.team.abbreviation}</span>
                  <span className="sm:hidden">{away.team.name || away.team.abbreviation}</span>
                </button>
                <button
                  onClick={() => setBoxscoreTab('home')}
                  className={cn(
                    "flex-1 py-2 text-xs sm:text-sm font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2",
                    boxscoreTab === 'home' ? "bg-gray-700 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  <img src={getTeamLogo(home.team)} className="w-4 h-4 object-contain hidden sm:block" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = `https://placehold.co/48x48/1f2937/ffffff?text=${home.team.abbreviation || '?'}` }} />
                  <span className="hidden sm:inline">{home.team.displayName || home.team.name || home.team.abbreviation}</span>
                  <span className="sm:hidden">{home.team.name || home.team.abbreviation}</span>
                </button>
              </div>

              {boxscoreTab === 'team' && (boxscore?.teams || ['MLB', 'CBASE'].includes(leagueId)) && (
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-3 sm:p-4">
                  {['MLB', 'CBASE'].includes(leagueId) ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-center table-fixed">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <th className="pb-2 sm:pb-3 text-left w-1/3 font-bold text-white uppercase tracking-wider">{away.team.name}</th>
                            <th className="pb-2 sm:pb-3 w-1/3 font-bold text-white uppercase tracking-wider">STAT</th>
                            <th className="pb-2 sm:pb-3 text-right w-1/3 font-bold text-white uppercase tracking-wider">{home.team.name}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                          {[
                            { label: 'Runs', awayValue: away.score ?? 0, homeValue: home.score ?? 0 },
                            { label: 'Hits', awayValue: away.hits ?? 0, homeValue: home.hits ?? 0 },
                            { label: 'Errors', awayValue: away.errors ?? 0, homeValue: home.errors ?? 0 }
                          ].map((stat, index) => (
                            <tr key={index} className="hover:bg-gray-800/20 transition-colors">
                              <td className="py-2 sm:py-2.5 text-left font-bold text-white text-sm sm:text-base">{stat.awayValue}</td>
                              <td className="py-2 sm:py-2.5 text-gray-400 uppercase text-[10px] sm:text-xs tracking-widest">{stat.label}</td>
                              <td className="py-2 sm:py-2.5 text-right font-bold text-white text-sm sm:text-base">{stat.homeValue}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-800">
                        <div className="flex items-center gap-2 sm:gap-3 w-1/3">
                          <img src={getTeamLogo(away.team)} className="w-6 h-6 sm:w-8 sm:h-8 object-contain" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = `https://placehold.co/48x48/1f2937/ffffff?text=${away.team.abbreviation || '?'}` }} />
                          <span className="font-black text-base sm:text-lg uppercase hidden sm:block">{away.team.abbreviation}</span>
                        </div>
                        <div className="w-1/3 text-center text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">
                          Team Stats
                        </div>
                        <div className="flex items-center justify-end gap-2 sm:gap-3 w-1/3">
                          <span className="font-black text-base sm:text-lg uppercase hidden sm:block">{home.team.abbreviation}</span>
                          <img src={getTeamLogo(home.team)} className="w-6 h-6 sm:w-8 sm:h-8 object-contain" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = `https://placehold.co/48x48/1f2937/ffffff?text=${home.team.abbreviation || '?'}` }} />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {boxscore?.teams?.find((t: any) => t.homeAway === 'away')?.statistics?.map((stat: any, index: number, allAwayStats: any[]) => {
                      if (stat.name?.toLowerCase().includes('pct') || stat.label?.includes('%')) return null;
                      
                      const allHomeStats = boxscore.teams.find((t: any) => t.homeAway === 'home')?.statistics || [];
                      const homeStat = allHomeStats.find((s: any) => s.name === stat.name);
                      if (!homeStat) return null;
                      
                      const parseStatValue = (val: string) => {
                        if (!val) return 0;
                        const match = val.match(/^(\d+)[-/]/);
                        if (match) return parseFloat(match[1]);
                        return parseFloat(val) || 0;
                      };

                      const awayVal = parseStatValue(stat.displayValue);
                      const homeVal = parseStatValue(homeStat.displayValue);
                      const total = awayVal + homeVal;
                      const awayPct = total > 0 ? (awayVal / total) * 100 : 50;
                      const homePct = total > 0 ? (homeVal / total) * 100 : 50;

                      const formatDisplayValue = (val: string) => val ? val.replace(/^(\d+)-(\d+)$/, '$1/$2') : '';
                      
                      const awayDisplay = formatDisplayValue(stat.displayValue);
                      const homeDisplay = formatDisplayValue(homeStat.displayValue);
                      
                      let awayPctDisplay = null;
                      let homePctDisplay = null;
                      
                      // Safely find corresponding percentage stat
                      let pctStatName = '';
                      if (stat.name === 'fieldGoalsMade-fieldGoalsAttempted' || stat.name === 'fieldGoals') pctStatName = 'fieldGoalPct';
                      else if (stat.name === 'threePointFieldGoalsMade-threePointFieldGoalsAttempted' || stat.name === 'threePointFieldGoals') pctStatName = 'threePointFieldGoalPct';
                      else if (stat.name === 'freeThrowsMade-freeThrowsAttempted' || stat.name === 'freeThrows') pctStatName = 'freeThrowPct';
                      else if (stat.name === 'completionAttempts' || stat.name === 'completions-passingAttempts') pctStatName = 'completionPct';
                      
                      let pctAwayStat = null;
                      let pctHomeStat = null;
                      
                      if (pctStatName) {
                        pctAwayStat = allAwayStats.find((s: any) => s.name === pctStatName);
                        pctHomeStat = allHomeStats.find((s: any) => s.name === pctStatName);
                      } else {
                        // Fallback to next stat if it's a percentage and current stat is a ratio
                        const isRatio = stat.displayValue?.includes('-');
                        const nextAwayStat = allAwayStats[index + 1];
                        if (isRatio && nextAwayStat && (nextAwayStat.name?.toLowerCase().includes('pct') || nextAwayStat.label?.includes('%'))) {
                          pctAwayStat = nextAwayStat;
                          pctHomeStat = allHomeStats.find((s: any) => s.name === nextAwayStat.name);
                        }
                      }
                      
                      if (pctAwayStat && pctAwayStat.displayValue) {
                        awayPctDisplay = `(${pctAwayStat.displayValue}${pctAwayStat.displayValue.includes('%') ? '' : '%'})`;
                      }
                      if (pctHomeStat && pctHomeStat.displayValue) {
                        homePctDisplay = `(${pctHomeStat.displayValue}${pctHomeStat.displayValue.includes('%') ? '' : '%'})`;
                      }

                      return (
                        <div key={index} className="flex flex-col gap-1">
                          <div className="flex justify-between items-center px-1">
                            <span className="font-bold text-xs sm:text-sm text-white w-1/3 text-left flex items-center gap-1.5">
                              {awayDisplay}
                              {awayPctDisplay && <span className="text-gray-500 text-[10px] sm:text-xs font-normal">{awayPctDisplay}</span>}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest w-1/3 text-center">
                              {stat.label}
                            </span>
                            <span className="font-bold text-xs sm:text-sm text-white w-1/3 text-right flex items-center justify-end gap-1.5">
                              {homePctDisplay && <span className="text-gray-500 text-[10px] sm:text-xs font-normal">{homePctDisplay}</span>}
                              {homeDisplay}
                            </span>
                          </div>
                          <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-800">
                            <div 
                              style={{ 
                                width: `${awayPct}%`, 
                                backgroundColor: `#${away.team.color || '3b82f6'}` 
                              }} 
                            />
                            <div 
                              style={{ 
                                width: `${homePct}%`, 
                                backgroundColor: `#${home.team.color || 'ef4444'}` 
                              }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {boxscoreTab === 'away' && boxscore?.players && (
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl overflow-hidden">
                  {boxscore.players.filter((t: any) => t.team.id === away.team.id).map((teamBox: any, i: number) => (
                    <div key={i} className="space-y-4">
                      {teamBox.statistics?.map((statGroup: any, statIdx: number) => (
                        <div key={statIdx} className="overflow-x-auto">
                          <h3 className="px-3 pt-3 text-sm sm:text-base font-bold text-white mb-1">{statGroup.name || statGroup.label || ''}</h3>
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-gray-500 font-bold uppercase tracking-widest border-b border-gray-700/30">
                                <th className="px-3 py-2 sm:p-3 sticky left-0 bg-[#1a1a1a] z-10">Player</th>
                                {statGroup.labels?.map((label: string, j: number) => (
                                  <th key={j} className="px-3 py-2 sm:p-3 text-center whitespace-nowrap">{label}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {statGroup.athletes?.map((athlete: any, j: number) => (
                                <tr key={j} className="border-b border-gray-700/10 hover:bg-gray-700/20 transition-colors">
                                  <td className="px-3 py-2 sm:p-3 sticky left-0 bg-[#1a1a1a] z-10 border-r border-gray-700/30">
                                    <div className="flex items-baseline gap-2 whitespace-nowrap">
                                      <span className="font-bold text-white">{athlete.athlete?.displayName || athlete.athlete?.shortName || 'Player'}</span>
                                      <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase">{athlete.athlete?.position?.abbreviation}</span>
                                    </div>
                                  </td>
                                  {athlete.stats?.map((stat: string, k: number) => (
                                    <td key={k} className="px-3 py-2 sm:p-3 text-center font-mono text-gray-300">{stat.replace(/-/g, '/')}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {boxscoreTab === 'home' && boxscore?.players && (
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl overflow-hidden">
                  {boxscore.players.filter((t: any) => t.team.id === home.team.id).map((teamBox: any, i: number) => (
                    <div key={i} className="space-y-4">
                      {teamBox.statistics?.map((statGroup: any, statIdx: number) => (
                        <div key={statIdx} className="overflow-x-auto">
                          <h3 className="px-3 pt-3 text-sm sm:text-base font-bold text-white mb-1">{statGroup.name || statGroup.label || ''}</h3>
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-gray-500 font-bold uppercase tracking-widest border-b border-gray-700/30">
                                <th className="px-3 py-2 sm:p-3 sticky left-0 bg-[#1a1a1a] z-10">Player</th>
                                {statGroup.labels?.map((label: string, j: number) => (
                                  <th key={j} className="px-3 py-2 sm:p-3 text-center whitespace-nowrap">{label}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {statGroup.athletes?.map((athlete: any, j: number) => (
                                <tr key={j} className="border-b border-gray-700/10 hover:bg-gray-700/20 transition-colors">
                                  <td className="px-3 py-2 sm:p-3 sticky left-0 bg-[#1a1a1a] z-10 border-r border-gray-700/30">
                                    <div className="flex items-baseline gap-2 whitespace-nowrap">
                                      <span className="font-bold text-white">{athlete.athlete?.displayName || athlete.athlete?.shortName || 'Player'}</span>
                                      <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase">{athlete.athlete?.position?.abbreviation}</span>
                                    </div>
                                  </td>
                                  {athlete.stats?.map((stat: string, k: number) => (
                                    <td key={k} className="px-3 py-2 sm:p-3 text-center font-mono text-gray-300">{stat.replace(/-/g, '/')}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {!boxscore?.players && !boxscore?.teams && (
                <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-widest">
                  Box score not available yet
                </div>
              )}
            </div>
          )}

          {activeTab === 'plays' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Line Score Table */}
              {away.linescores && home.linescores && (
                <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-2 sm:p-3 overflow-x-auto">
                  <table className="w-full text-center text-xs font-bold uppercase tracking-widest">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-700/50">
                        <th className="py-1.5 px-1 text-left">Team</th>
                        {away.linescores.map((_: any, i: number) => {
                          let label: string | number = i + 1;
                          if (['nfl', 'college-football', 'nba', 'mens-college-basketball', 'womens-college-basketball', 'wnba'].includes(leagueId)) {
                            if (i === 4) label = 'OT';
                            else if (i > 4) label = `${i - 3}OT`;
                          } else if (['nhl'].includes(leagueId)) {
                            if (i === 3) label = 'OT';
                            else if (i === 4) label = 'SO';
                            else if (i > 4) label = `${i - 2}OT`;
                          } else if (['eng.1', 'usa.1', 'uefa.champions'].includes(leagueId)) {
                            if (i === 2) label = 'ET';
                            else if (i === 3) label = 'PEN';
                          }
                          return <th key={i} className="py-1.5 px-1 sm:px-2">{label}</th>;
                        })}
                        <th className="py-1.5 px-1 sm:px-2 text-white">T</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-700/30">
                        <td className="py-1.5 sm:py-2 px-1 text-left flex items-center gap-2">
                          <img src={getTeamLogo(away.team)} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = `https://placehold.co/48x48/1f2937/ffffff?text=${away.team.abbreviation || '?'}` }} />
                          <span className="font-bold text-xs sm:text-sm">{away.team.abbreviation}</span>
                        </td>
                        {away.linescores.map((ls: any, i: number) => (
                          <td key={i} className="py-1.5 sm:py-2 px-1 sm:px-2 text-gray-400">{ls.displayValue || ls.value}</td>
                        ))}
                        <td className="py-1.5 sm:py-2 px-1 sm:px-2 font-black text-[#9df01c] text-xs sm:text-sm">{away.score}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 sm:py-2 px-1 text-left flex items-center gap-2">
                          <img src={getTeamLogo(home.team)} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = `https://placehold.co/48x48/1f2937/ffffff?text=${home.team.abbreviation || '?'}` }} />
                          <span className="font-bold text-xs sm:text-sm">{home.team.abbreviation}</span>
                        </td>
                        {home.linescores.map((ls: any, i: number) => (
                          <td key={i} className="py-1.5 sm:py-2 px-1 sm:px-2 text-gray-400">{ls.displayValue || ls.value}</td>
                        ))}
                        <td className="py-1.5 sm:py-2 px-1 sm:px-2 font-black text-[#9df01c] text-xs sm:text-sm">{home.score}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Scoring Plays */}
              {isSoccer ? (
                soccerEvents && soccerEvents.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    <h3 className="text-base sm:text-lg font-black uppercase mb-2 sm:mb-3">Match Timeline</h3>
                    {soccerEvents.map((event: any, i: number) => {
                      const teamData = competition.competitors?.find((c: any) => c.id === event.team?.id);
                      const teamColor = teamData ? `#${teamData.team.color || 'ffffff'}` : '#9ca3af';
                      
                      let Icon = Circle;
                      let iconColor = "text-gray-500";
                      let eventTypeClass = "text-gray-300";
                      const typeText = event.type?.text?.toLowerCase() || '';
                      
                      if (typeText.includes('goal')) {
                        Icon = Circle;
                        iconColor = "text-[#9df01c] fill-[#9df01c]";
                        eventTypeClass = "text-white font-bold";
                      } else if (typeText.includes('yellow card')) {
                        Icon = Square;
                        iconColor = "text-yellow-400 fill-yellow-400";
                      } else if (typeText.includes('red card')) {
                        Icon = Square;
                        iconColor = "text-red-500 fill-red-500";
                      } else if (typeText.includes('substitution')) {
                        Icon = ArrowLeftRight;
                        iconColor = "text-blue-400";
                      } else if (typeText.includes('penalty')) {
                        Icon = AlertCircle;
                        iconColor = "text-orange-400";
                      }
                      
                      let playersHtml = '';
                      if (event.participants) {
                        playersHtml = event.participants.map((p: any) => p.athlete?.displayName).join(', ');
                      } else if (event.text) {
                        playersHtml = event.text;
                      }

                      return (
                        <div 
                          key={i} 
                          className={cn(
                            "bg-gray-800/30 p-2 sm:p-3 rounded-r-lg flex items-center gap-3 sm:gap-4",
                            teamData && "border-l-4"
                          )}
                          style={teamData ? { borderLeftColor: teamColor } : {}}
                        >
                          <div className="w-10 sm:w-12 text-center flex flex-col items-center justify-center border-r border-gray-700/50 pr-2 sm:pr-3">
                            <span className="font-bold text-base sm:text-lg text-white">{event.clock?.displayValue || '-'}</span>
                          </div>
                          <div className="flex-shrink-0 w-5 sm:w-6 flex justify-center">
                            <Icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", iconColor)} />
                          </div>
                          <div className="flex-grow">
                            <p className={cn("text-xs sm:text-sm uppercase tracking-wide", eventTypeClass)}>
                              {event.type?.text || 'Event'}
                            </p>
                            <p className="text-gray-400 text-[10px] sm:text-xs">{playersHtml}</p>
                          </div>
                          {teamData && (
                            <img 
                              src={getTeamLogo(teamData.team)} 
                              className="w-5 h-5 sm:w-6 sm:h-6 object-contain opacity-50" 
                              referrerPolicy="no-referrer"
                              onError={(e) => { e.currentTarget.src = `https://placehold.co/48x48/1f2937/ffffff?text=${teamData.team.abbreviation || '?'}` }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 sm:py-20 text-sm text-gray-500 font-bold uppercase tracking-widest">
                    Match timeline not available
                  </div>
                )
              ) : (scoringPlays && scoringPlays.length > 0) || (plays && plays.filter((p: any) => p.scoringPlay).length > 0) ? (
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-base sm:text-lg font-black uppercase mb-2 sm:mb-3">Scoring Plays</h3>
                  {(scoringPlays || plays.filter((p: any) => p.scoringPlay)).slice().reverse().map((play: any, i: number) => (
                    <div key={i} className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/30 border border-gray-700/50 rounded-xl hover:border-gray-600 transition-colors">
                      <div className="flex flex-col items-center gap-1 min-w-[45px] sm:min-w-[55px]">
                        <div className="text-[10px] sm:text-xs font-black text-[#9df01c]">{play.clock?.displayValue}</div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase">{play.period?.number}Q</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          {play.team && (
                            <img src={getPlayTeamLogo(play.team)} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = `https://placehold.co/48x48/1f2937/ffffff?text=${play.team.abbreviation || '?'}` }} />
                          )}
                          <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {play.type?.text || play.scoringType?.displayName}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-sm leading-relaxed">{play.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : plays && plays.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-base sm:text-lg font-black uppercase mb-2 sm:mb-3">Play-by-Play</h3>
                  {plays.slice().reverse().map((play: any, i: number) => (
                    <div key={i} className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/30 border border-gray-700/50 rounded-xl hover:border-gray-600 transition-colors">
                      <div className="flex flex-col items-center gap-1 min-w-[45px] sm:min-w-[55px]">
                        <div className="text-[10px] sm:text-xs font-black text-[#9df01c]">{play.clock?.displayValue}</div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase">{play.period?.number}Q</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          {play.team && (
                            <img src={getPlayTeamLogo(play.team)} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = `https://placehold.co/48x48/1f2937/ffffff?text=${play.team.abbreviation || '?'}` }} />
                          )}
                          <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {play.type?.text}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-sm leading-relaxed">{play.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-widest">
                  Plays not available yet
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

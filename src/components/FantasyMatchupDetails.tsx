import React from 'react';
import { SleeperLeague, SleeperMatchup, SleeperRoster, SleeperUser } from '../types';
import { ChevronLeft, ExternalLink, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../lib/utils';

interface Props {
  league: SleeperLeague;
  matchups: SleeperMatchup[];
  rosters: SleeperRoster[];
  users: SleeperUser[];
  week: number;
  players: any;
  onBack: () => void;
  isFetching?: boolean;
}

export const FantasyMatchupDetails: React.FC<Props> = ({ league, matchups, rosters, users, week, players, onBack, isFetching }) => {
  const queryClient = useQueryClient();
  
  const myRoster = rosters.find(r => r.owner_id === league.synced_user_id);
  if (!myRoster) return null;

  const myMatchup = matchups.find(m => m.roster_id === myRoster.roster_id);
  if (!myMatchup) return null;

  const opponentMatchup = matchups.find(m => m.matchup_id === myMatchup.matchup_id && m.roster_id !== myRoster.roster_id);

  const team1Roster = myRoster;
  const team2Roster = opponentMatchup ? rosters.find(r => r.roster_id === opponentMatchup.roster_id) : null;
  
  const team1User = users.find(u => u.user_id === team1Roster.owner_id);
  const team2User = team2Roster ? users.find(u => u.user_id === team2Roster.owner_id) : null;

  const team1Name = team1User?.metadata?.team_name || team1User?.display_name || 'Unknown';
  const team2Name = opponentMatchup ? (team2User?.metadata?.team_name || team2User?.display_name || 'Unknown') : 'BYE';

  const team1Avatar = team1User?.avatar ? (league.platform === 'Yahoo' ? team1User.avatar : `https://sleepercdn.com/avatars/thumbs/${team1User.avatar}`) : 'https://placehold.co/40x40/383838/ffffff?text=?';
  const team2Avatar = team2User?.avatar ? (league.platform === 'Yahoo' ? team2User.avatar : `https://sleepercdn.com/avatars/thumbs/${team2User.avatar}`) : 'https://placehold.co/40x40/383838/ffffff?text=BYE';

  const platformIconUrl = league.platform === 'Yahoo' 
    ? 'https://s.yimg.com/cv/apiv2/myc/fantasy/Fantasy_icon_0919250x252.png'
    : 'https://play-lh.googleusercontent.com/JLW6o2Mmj5T4J0lGx5a3vRmwGILpWTweL8rmineEhIA9MZ_S-uMoqV4mzX19sIKPsVA';

  const getDisplayName = (playerId: string) => {
    if (!playerId || playerId === "0") return 'Empty';
    const player = players?.[playerId];
    if (!player) return playerId;
    if (player.position === 'DEF') return player.last_name || player.full_name || player.first_name || playerId;
    
    const fullName = player.full_name || `${player.first_name} ${player.last_name}`;
    const parts = fullName.split(' ');
    if (parts.length === 1) return fullName;
    return `${parts[0].charAt(0)}. ${parts.slice(1).join(' ')}`;
  };

  // Sleeper API doesn't return roster_positions in the league object directly sometimes, 
  // but we can infer starters from the matchup.starters array length.
  // Actually, we should fetch league details if we want exact positions, but for now we can just list starters then bench.
  const team1Starters = myMatchup.starters || [];
  const team2Starters = opponentMatchup?.starters || [];

  const team1Bench = team1Roster.players?.filter(p => !team1Starters.includes(p)) || [];
  const team2Bench = team2Roster?.players?.filter(p => !team2Starters.includes(p)) || [];

  const renderPlayerRow = (p1Id: string, p2Id: string, isBench: boolean = false) => {
    const p1Points = (p1Id && p1Id !== "0") ? (myMatchup.players_points?.[p1Id] || 0).toFixed(2) : '0.00';
    const p2Points = (p2Id && p2Id !== "0") ? (opponentMatchup?.players_points?.[p2Id] || 0).toFixed(2) : '0.00';
    
    const p1Name = getDisplayName(p1Id);
    const p2Name = getDisplayName(p2Id);
    
    const p1Pos = (p1Id && p1Id !== "0") ? players?.[p1Id]?.position || 'FLEX' : 'BN';

    return (
      <div key={`${p1Id}-${p2Id}`} className="grid grid-cols-[1fr_3.5rem_3rem_3.5rem_1fr] items-center py-3 border-b border-gray-800 gap-1">
        <div className="text-[13px] font-medium truncate text-left">{p1Name}</div>
        <div className="text-sm font-bold text-gray-200 text-right">{p1Points}</div>
        <div className="flex justify-center">
          <span className="bg-[#2A2A2A] rounded px-2 py-1 text-[10px] text-gray-400 font-bold min-w-[2.5rem] text-center">
            {isBench ? 'BN' : p1Pos}
          </span>
        </div>
        <div className="text-sm font-bold text-gray-200 text-left">{p2Points}</div>
        <div className="text-[13px] font-medium truncate text-right">{p2Name}</div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 sm:pb-24">
      <div className="sticky top-0 z-10 bg-[#121212] pt-0 pb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button 
            onClick={onBack}
            className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-full transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['fantasyMatchups'] })}
            className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-full transition-colors"
          >
            <RefreshCw size={20} className={cn("transition-transform", isFetching && "animate-spin")} />
          </button>
        </div>
        <a 
          href={`https://sleeper.app/leagues/${league.league_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors border border-gray-600 rounded-full px-3 py-1.5"
        >
          <span>Go to League</span>
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="bg-[#2A2A2A] rounded-xl p-4 mb-6 flex items-center justify-between shadow-lg border border-gray-700">
        <div className="flex items-center gap-4">
          <img src={team1Avatar} className="w-12 h-12 rounded-full border-2 border-[#9df01c]" alt="" />
          <div>
            <div className="text-2xl font-bold text-white leading-none">{myMatchup.points?.toFixed(2) || '0.00'}</div>
            <div className="text-sm text-gray-400 font-semibold max-w-[100px] truncate">{team1Name}</div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <img src={platformIconUrl} className="w-6 h-6 mb-1 opacity-80 object-contain" alt="" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Week {week}</span>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div>
            <div className="text-2xl font-bold text-white leading-none">{opponentMatchup?.points?.toFixed(2) || '0.00'}</div>
            <div className="text-sm text-gray-400 font-semibold max-w-[100px] truncate">{team2Name}</div>
          </div>
          <img src={team2Avatar} className="w-12 h-12 rounded-full border-2 border-gray-600" alt="" />
        </div>
      </div>

      <div className="px-1">
        {team1Starters.map((p1Id, index) => {
          const p2Id = team2Starters[index];
          return renderPlayerRow(p1Id, p2Id, false);
        })}

        <div className="flex items-center text-center py-4">
          <div className="flex-1 border-b border-gray-800"></div>
          <span className="text-gray-500 text-sm font-bold px-4">Bench</span>
          <div className="flex-1 border-b border-gray-800"></div>
        </div>

        {Array.from({ length: Math.max(team1Bench.length, team2Bench.length) }).map((_, index) => {
          const p1Id = team1Bench[index];
          const p2Id = team2Bench[index];
          if (!p1Id && !p2Id) return null;
          return renderPlayerRow(p1Id, p2Id, true);
        })}
      </div>
    </div>
  );
};

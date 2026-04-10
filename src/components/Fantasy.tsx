import React, { useState } from 'react';
import { useFantasy } from '../hooks/useFantasy';
import { Plus, Trash2, ExternalLink, RefreshCw, Trophy, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { useFantasyMatchups } from '../hooks/useFantasyMatchups';
import { FantasyMatchupCard } from './FantasyMatchupCard';
import { FantasyMatchupDetails } from './FantasyMatchupDetails';
import { FantasyTicker } from './FantasyTicker';

const PLATFORM_ICONS: Record<string, string> = {
  'Sleeper': 'https://play-lh.googleusercontent.com/JLW6o2Mmj5T4J0lGx5a3vRmwGILpWTweL8rmineEhIA9MZ_S-uMoqV4mzX19sIKPsVA',
  'Yahoo': 'https://s.yimg.com/cv/apiv2/myc/fantasy/Fantasy_icon_0919250x252.png',
  'ESPN': 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/a1/ed/7c/a1ed7c08-860b-7959-8613-42563e931829/AppIcon-0-0-1x_U007epad-0-9-0-85-220.png/492x0w.webp'
};

export const Fantasy = () => {
  const { syncedLeagues, syncLeague, removeLeague, isLoading, error } = useFantasy();
  const [username, setUsername] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);

  const { matchupsData, isLoading: isMatchupsLoading, currentWeek, players } = useFantasyMatchups(syncedLeagues);

  const mySyncedPlayerNames = React.useMemo(() => new Set<string>(), []);
  const playerToLeaguesMap = React.useMemo(() => new Map<string, Set<string>>(), []);

  React.useEffect(() => {
    mySyncedPlayerNames.clear();
    playerToLeaguesMap.clear();

    if (matchupsData && players) {
      matchupsData.forEach(data => {
        const { league, rosters } = data;
        const myRoster = rosters.find(r => r.owner_id === league.synced_user_id);
        
        if (myRoster && myRoster.starters) {
          myRoster.starters.forEach(pid => {
            if (pid === "0") return;

            const player = players[pid];
            if (player && player.full_name) {
              const fullName = player.full_name;
              mySyncedPlayerNames.add(fullName);
              
              if (!playerToLeaguesMap.has(fullName)) {
                playerToLeaguesMap.set(fullName, new Set());
              }
              playerToLeaguesMap.get(fullName)!.add(league.league_id);
            }
          });
        }
      });
    }
  }, [matchupsData, players, mySyncedPlayerNames, playerToLeaguesMap]);

  const [highlightedLeagueIds, setHighlightedLeagueIds] = useState<Set<string>>(new Set());

  const handleYahooSync = async () => {
    try {
      const response = await fetch('/api/auth/yahoo/url');
      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }
      const { url } = await response.json();

      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
    }
  };

  const [yahooLeagues, setYahooLeagues] = useState<any[]>([]);
  const [isFetchingYahoo, setIsFetchingYahoo] = useState(false);

  const fetchYahooLeagues = async () => {
    setIsFetchingYahoo(true);
    try {
      const response = await fetch('/api/yahoo/users;use_login=1/games;game_keys=nfl/leagues?format=json');
      if (response.ok) {
        const data = await response.json();
        const leagues = data?.fantasy_content?.users?.[0]?.user?.[1]?.games?.[0]?.game?.[1]?.leagues;
        if (leagues) {
          const parsedLeagues = Object.keys(leagues)
            .filter(key => key !== 'count')
            .map(key => leagues[key].league[0]);
          setYahooLeagues(parsedLeagues);
          setSelectedPlatform('YahooSelect');
        }
      }
    } catch (error) {
      console.error('Failed to fetch Yahoo leagues:', error);
    } finally {
      setIsFetchingYahoo(false);
    }
  };

  const handleYahooDisconnect = async () => {
    try {
      await fetch('/api/auth/yahoo/logout', { method: 'POST' });
      setYahooLeagues([]);
      setSelectedPlatform(null);
    } catch (error) {
      console.error('Failed to logout from Yahoo:', error);
    }
  };

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'YAHOO_AUTH_SUCCESS') {
        console.log("Yahoo Auth Success!");
        fetchYahooLeagues();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    await syncLeague(username);
    setUsername('');
    setSelectedPlatform(null);
  };

  const leagueData = selectedLeagueId ? matchupsData?.find(d => d.league.league_id === selectedLeagueId) : null;

  return (
    <div className="space-y-6">
      {selectedLeagueId && leagueData && (
        <FantasyMatchupDetails 
          league={leagueData.league}
          matchups={leagueData.matchups}
          rosters={leagueData.rosters}
          users={leagueData.users}
          week={currentWeek}
          players={players}
          onBack={() => setSelectedLeagueId(null)}
          isFetching={isMatchupsLoading}
        />
      )}
      
      <div className={selectedLeagueId ? 'hidden' : 'space-y-6'}>
        {!isSyncing ? (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">
                My Fantasy Leagues
              </h2>
              <button
                onClick={() => setIsSyncing(true)}
                className="flex items-center gap-2 bg-[#2c2c2c] text-gray-300 px-4 py-2 rounded-md text-sm font-bold uppercase tracking-widest hover:bg-[#374151] transition-colors"
              >
                <Plus size={14} />
                Sync
              </button>
            </div>

          {syncedLeagues.length === 0 ? (
            <div className="text-center py-20 bg-gray-800/30 rounded-2xl border border-dashed border-gray-700">
              <Trophy size={40} className="mx-auto mb-4 text-gray-700" />
              <p className="text-gray-500 font-bold uppercase tracking-widest">No leagues synced</p>
              <p className="text-gray-600 text-xs mt-2 uppercase tracking-tight">Sync your Sleeper account to see live matchups</p>
            </div>
          ) : (
            <>
              <FantasyTicker 
                currentWeek={currentWeek}
                mySyncedPlayerNames={mySyncedPlayerNames}
                playerToLeaguesMap={playerToLeaguesMap}
                onHighlightLeagues={setHighlightedLeagueIds}
              />
              {isMatchupsLoading ? (
                <div className="text-center py-10">
                  <RefreshCw size={32} className="mx-auto mb-4 text-gray-600 animate-spin" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest">Loading Matchups...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchupsData?.map(data => (
                    <FantasyMatchupCard 
                      key={data.league.league_id}
                      league={data.league}
                      matchups={data.matchups}
                      rosters={data.rosters}
                      users={data.users}
                      week={currentWeek}
                      isHighlighted={highlightedLeagueIds.has(data.league.league_id)}
                      onClick={() => setSelectedLeagueId(data.league.league_id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSyncing(false)} className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-full transition-colors">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-black uppercase tracking-tighter text-white">
              Sync a Fantasy League
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 py-4 max-w-xs mx-auto">
            <button onClick={() => setSelectedPlatform('Sleeper')} className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#121212]">
                <img src={PLATFORM_ICONS['Sleeper']} alt="Sleeper" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-medium">Sleeper</span>
            </button>
            <button onClick={handleYahooSync} className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#121212]">
                <img src={PLATFORM_ICONS['Yahoo']} alt="Yahoo" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-medium">Yahoo</span>
            </button>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold mb-4">Manage Synced Leagues</h3>
            <div className="space-y-2">
              {syncedLeagues.map(league => (
                <div key={league.league_id} className="flex items-center justify-between py-3 border-b border-gray-800/50">
                  <div className="flex items-center gap-3">
                    <img src={PLATFORM_ICONS[league.platform || 'Sleeper']} className="w-6 h-6 rounded-md" />
                    <span className="font-medium text-gray-200">{league.name}</span>
                  </div>
                  <button onClick={() => removeLeague(league.league_id)} className="text-red-500 hover:text-red-400 p-2">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {syncedLeagues.length === 0 && (
                <p className="text-gray-500 text-center py-4">No leagues have been synced.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Username */}
      {selectedPlatform && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A2A2A] rounded-2xl p-6 w-full max-w-sm border border-gray-800 text-center">
            {selectedPlatform === 'Sleeper' ? (
              <>
                <h2 className="text-xl font-semibold mb-2">Enter your username to sync your Sleeper account.</h2>
                <p className="text-gray-400 text-sm mb-6">You can always unsync your leagues at any time, which will safely dissociate your username from the app.</p>
                <form onSubmit={handleSync}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username..."
                    className="w-full bg-[#383838] border border-gray-600 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:border-[#9df01c]"
                    autoFocus
                  />
                  {error && <p className="text-red-400 text-xs font-bold mb-4">{error}</p>}
                  <div className="flex border-t border-gray-800 pt-4 gap-2">
                    <button type="button" onClick={() => setSelectedPlatform(null)} className="flex-1 py-2 text-red-500 font-semibold">Cancel</button>
                    <button type="submit" disabled={isLoading} className="flex-1 py-2 text-blue-500 font-semibold disabled:opacity-50">
                      {isLoading ? 'Syncing...' : 'Sync'}
                    </button>
                  </div>
                </form>
              </>
            ) : selectedPlatform === 'YahooSelect' ? (
              <>
                <h2 className="text-xl font-semibold mb-4">Select Yahoo Leagues</h2>
                {yahooLeagues.length > 0 ? (
                  <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scroll text-left">
                    {yahooLeagues.map((league: any) => (
                      <div key={league.league_key} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-3">
                          {league.logo_url && <img src={league.logo_url} className="w-8 h-8 rounded-full" alt="" />}
                          <div>
                            <p className="font-semibold text-gray-200">{league.name}</p>
                            <p className="text-xs text-gray-400">{league.season} • {league.num_teams} Teams</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            addYahooLeague(league);
                            setSelectedPlatform(null);
                            setIsSyncing(false);
                          }}
                          className="px-3 py-1 bg-[#9df01c] text-black text-xs font-bold rounded-md hover:bg-[#8ce01b]"
                        >
                          Sync
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm mb-6">No active NFL leagues found on this Yahoo account.</p>
                )}
                <div className="flex border-t border-gray-800 pt-4 gap-2">
                  <button type="button" onClick={() => setSelectedPlatform(null)} className="flex-1 py-2 text-gray-400 font-semibold hover:text-white">Cancel</button>
                  <button type="button" onClick={handleYahooDisconnect} className="flex-1 py-2 text-red-500 font-semibold hover:text-red-400">Disconnect Yahoo</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-2">Coming Soon!</h2>
                <p className="text-gray-400 text-sm mb-6">This feature is not yet implemented.</p>
                <div className="flex border-t border-gray-800 pt-4">
                  <button type="button" onClick={() => setSelectedPlatform(null)} className="flex-1 py-2 text-blue-500 font-semibold">Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

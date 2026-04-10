import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';

interface FantasyTickerProps {
  currentWeek: number;
  mySyncedPlayerNames: Set<string>;
  playerToLeaguesMap: Map<string, Set<string>>;
  onHighlightLeagues: (leagueIds: Set<string>) => void;
}

const API_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

const getTeamLogo = (team: any) => {
  if (team.logos && team.logos.length > 1) {
    return team.logos[1].href;
  }
  return team.logos?.[0]?.href || team.logo || 'https://placehold.co/48x48/1f2937/ffffff?text=?';
};

const fetchNFLScoringPlays = async ({ pageParam }: { pageParam: number }) => {
  const response = await fetch(`${API_URL}?seasontype=2&week=${pageParam}`);
  const data = await response.json();
  
  let plays: any[] = [];
  
  if (data.events && data.events.length > 0) {
    const summaryPromises = data.events.map(async (event: any) => {
      try {
        const summaryRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${event.id}`);
        const summaryData = await summaryRes.json();
        return { event, summaryData };
      } catch (e) {
        console.error("Failed to fetch summary for event", event.id, e);
        return { event, summaryData: null };
      }
    });

    const summaries = await Promise.all(summaryPromises);

    summaries.forEach(({ event, summaryData }) => {
      if (!summaryData) return;
      
      const comp = event.competitions?.[0] || event;
      if (summaryData.scoringPlays) {
        summaryData.scoringPlays.forEach((play: any) => {
          const homeTeam = comp.competitors.find((c: any) => c.homeAway === 'home');
          const awayTeam = comp.competitors.find((c: any) => c.homeAway === 'away');
          
          let scoringTeam = null;
          if (play.team) {
            if (homeTeam.id === play.team.id) scoringTeam = homeTeam;
            else if (awayTeam.id === play.team.id) scoringTeam = awayTeam;
          }

          plays.push({
            id: play.id || Math.random().toString(),
            text: play.text,
            type: play.type?.text || 'Scoring Play',
            clock: play.clock?.displayValue || 'Final',
            period: play.period?.number,
            awayTeam: awayTeam?.team?.abbreviation || 'AWAY',
            homeTeam: homeTeam?.team?.abbreviation || 'HOME',
            awayScore: play.awayScore,
            homeScore: play.homeScore,
            scoringTeamLogo: getTeamLogo(scoringTeam?.team || {}),
            awayTeamLogo: getTeamLogo(awayTeam?.team || {}),
            homeTeamLogo: getTeamLogo(homeTeam?.team || {})
          });
        });
      }
    });
  }
  
  // Sort plays by some logic if needed, but usually they are returned in order.
  // We want newest first, so we reverse.
  return {
    week: pageParam,
    plays: plays.reverse()
  };
};

export const FantasyTicker: React.FC<FantasyTickerProps> = ({ 
  currentWeek, 
  mySyncedPlayerNames, 
  playerToLeaguesMap, 
  onHighlightLeagues 
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['nflScoringPlays', currentWeek],
    queryFn: fetchNFLScoringPlays,
    initialPageParam: currentWeek,
    getNextPageParam: (lastPage) => {
      if (lastPage.week > 1) {
        return lastPage.week - 1;
      }
      return undefined;
    },
    refetchInterval: 60000,
  });

  const slides = useMemo(() => {
    if (!data) return [{ type: 'intro', text: 'The next week starts soon!' }];
    
    let allSlides: any[] = [{ type: 'intro', text: 'The next week starts soon!' }];
    
    data.pages.forEach((page, index) => {
      if (index > 0) {
        allSlides.push({ type: 'divider', text: `Week ${page.week} Scoring Plays` });
      }
      allSlides.push(...page.plays);
    });

    if (isFetchingNextPage) {
      allSlides.push({ type: 'loading', text: 'Loading older plays...' });
    }

    return allSlides;
  }, [data, isFetchingNextPage]);

  const currentSlide = slides[currentSlideIndex];

  // Highlight logic
  useEffect(() => {
    if (!currentSlide || currentSlide.type === 'intro' || currentSlide.type === 'divider' || currentSlide.type === 'loading') {
      onHighlightLeagues(new Set());
      return;
    }

    const text = currentSlide.text;
    const foundLeagues = new Set<string>();

    mySyncedPlayerNames.forEach(fullName => {
      const escapedName = fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
      
      if (regex.test(text)) {
        const leagues = playerToLeaguesMap.get(fullName);
        if (leagues) {
          leagues.forEach(l => foundLeagues.add(l));
        }
      }
    });

    onHighlightLeagues(foundLeagues);
  }, [currentSlide, mySyncedPlayerNames, playerToLeaguesMap, onHighlightLeagues]);

  const handleNext = () => {
    if (currentSlideIndex >= slides.length - 3 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentSlideIndex(0);
  };

  // Helper to render highlighted text
  const renderHighlightedText = (text: string) => {
    let parts = [{ text, isHighlight: false }];
    
    // Sort names by length descending to match longer names first (e.g. "Amon-Ra St. Brown" before "Brown")
    const sortedNames = Array.from(mySyncedPlayerNames).sort((a, b) => b.length - a.length);

    sortedNames.forEach(fullName => {
      const escapedName = fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(\\b${escapedName}\\b)`, 'gi');
      
      let newParts: any[] = [];
      parts.forEach(part => {
        if (part.isHighlight) {
          newParts.push(part);
        } else {
          const splitText = part.text.split(regex);
          splitText.forEach(segment => {
            if (regex.test(segment)) {
              newParts.push({ text: segment, isHighlight: true });
            } else if (segment) {
              newParts.push({ text: segment, isHighlight: false });
            }
          });
        }
      });
      parts = newParts;
    });

    return parts.map((part, i) => 
      part.isHighlight ? (
        <span key={i} className="text-[#9df01c] font-extrabold">{part.text}</span>
      ) : (
        <span key={i}>{part.text}</span>
      )
    );
  };

  return (
    <div className="bg-[#2A2A2A] rounded-xl p-2 flex items-center justify-between min-h-[5.5rem] border border-gray-800 mb-6">
      <div className="w-16 flex items-center">
        <button 
          onClick={handleReset} 
          disabled={currentSlideIndex === 0}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#9df01c] disabled:opacity-20 transition-colors"
          title="Back to Beginning"
        >
          <ChevronsLeft size={20} />
        </button>
        <button 
          onClick={handlePrev} 
          disabled={currentSlideIndex === 0}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#9df01c] disabled:opacity-20 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      </div>
      
      <div className="flex-1 px-4 flex flex-col items-center justify-center text-center">
        {currentSlide?.type === 'intro' ? (
          <div className="text-base font-semibold text-gray-200">{currentSlide.text}</div>
        ) : currentSlide?.type === 'divider' ? (
          <div className="text-lg font-bold text-[#9df01c] uppercase tracking-widest">{currentSlide.text}</div>
        ) : currentSlide?.type === 'loading' ? (
          <div className="text-base font-semibold text-gray-400 animate-pulse">{currentSlide.text}</div>
        ) : (
          <div className="w-full">
            <div className="flex items-center justify-center gap-2 mb-1">
              <img src={currentSlide.scoringTeamLogo} className="w-5 h-5 object-contain" alt="" />
              <span className="font-bold text-white text-[13px] uppercase">{currentSlide.type}</span>
            </div>
            <div className="text-[15px] font-medium text-gray-300 mb-1 leading-tight">
              {renderHighlightedText(currentSlide.text)}
            </div>
            <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
              <img src={currentSlide.awayTeamLogo} className="w-4 h-4 object-contain inline-block align-middle mr-1" alt="" />
              <span className="text-white font-bold">{currentSlide.awayScore}</span>
              <span className="text-gray-600">-</span>
              <span className="text-white font-bold">{currentSlide.homeScore}</span>
              <img src={currentSlide.homeTeamLogo} className="w-4 h-4 object-contain inline-block align-middle ml-1" alt="" />
              <span className="text-gray-600">|</span>
              <span className="uppercase font-bold text-gray-500">{currentSlide.clock} {currentSlide.period ? `Q${currentSlide.period}` : ''}</span>
            </div>
          </div>
        )}
      </div>

      <div className="w-16 flex items-center justify-end">
        <button 
          onClick={handleNext} 
          disabled={currentSlideIndex >= slides.length - 1 && !hasNextPage}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#9df01c] disabled:opacity-20 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

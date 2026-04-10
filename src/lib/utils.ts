import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTeamLogo(team: any) {
  if (!team) return 'https://placehold.co/48x48/1f2937/ffffff?text=?';
  
  // Some endpoints return logo directly as a string
  if (typeof team.logo === 'string' && team.logo.length > 0) {
    return team.logo;
  }
  
  // Some endpoints return logos array
  if (team.logos && Array.isArray(team.logos) && team.logos.length > 0) {
    // Prefer the first logo, usually the primary one
    return team.logos[0].href || team.logos[0];
  }
  
  return `https://placehold.co/48x48/1f2937/ffffff?text=${team.abbreviation || '?'}`;
}

export function formatGameTime(dateString: string) {
  if (!dateString) return "TBD";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "TBD";
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

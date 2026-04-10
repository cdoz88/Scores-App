import React from 'react';
import { cn } from '../lib/utils';

interface TabProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  key?: string | number;
}

const Tab = ({ active, onClick, children }: TabProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex-1 py-2 text-sm font-bold uppercase tracking-wider transition-all duration-300 rounded-full z-10",
      active ? "text-gray-900" : "text-gray-400 hover:text-gray-200"
    )}
  >
    {children}
  </button>
);

interface SegmentedControlProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: { id: string; label: string }[];
}

export const SegmentedControl = ({ activeTab, onTabChange, tabs }: SegmentedControlProps) => {
  const activeIndex = tabs.findIndex(t => t.id === activeTab);
  
  return (
    <div className="relative flex bg-gray-800/50 p-1 rounded-full w-full max-w-md mx-auto mb-6 border border-gray-700/50">
      <div
        className="absolute top-1 bottom-1 left-1 bg-[#9df01c] rounded-full transition-transform duration-300 ease-out"
        style={{
          width: `calc(${100 / tabs.length}% - 4px)`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {tabs.map((tab) => (
        <Tab
          key={tab.id}
          active={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </Tab>
      ))}
    </div>
  );
};

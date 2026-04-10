import React from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface CalendarPickerProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

export const CalendarPicker = ({ selectedDate, onSelect, onClose }: CalendarPickerProps) => {
  const [currentMonth, setCurrentMonth] = React.useState(startOfMonth(selectedDate));

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="absolute top-full right-0 mt-2 w-72 bg-[#222222] border border-gray-700 rounded-lg shadow-2xl z-50 p-4">
      <div className="flex justify-between items-center mb-4">
        <button className="flex items-center gap-1 font-bold text-sm text-white hover:text-gray-300">
          {format(currentMonth, 'MMMM yyyy')}
          <ChevronDown size={14} />
        </button>
        <div className="flex gap-2 text-gray-400">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:text-white transition-colors">
            <ArrowUp size={16} />
          </button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:text-white transition-colors">
            <ArrowDown size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs text-white font-medium">
        {days.map((day, i) => <div key={i}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {calendarDays.map((day, i) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          return (
            <button
              key={i}
              onClick={() => { onSelect(day); onClose(); }}
              className={cn(
                "p-1.5 rounded hover:bg-gray-700 transition-colors flex items-center justify-center",
                !isCurrentMonth ? "text-gray-500" : "text-white",
                isSelected && "bg-[#93b4d8] text-black font-bold hover:bg-[#7a9bc0]"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between mt-4 text-xs text-[#93b4d8] font-medium">
        <button onClick={() => { onSelect(new Date()); onClose(); }} className="hover:text-white transition-colors">Clear</button>
        <button onClick={() => { onSelect(new Date()); onClose(); }} className="hover:text-white transition-colors">Today</button>
      </div>
    </div>
  );
};

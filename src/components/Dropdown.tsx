import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const Dropdown = ({ value, options, onChange, disabled, className, placeholder }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-200",
          "bg-[#2c2c2c] border",
          isOpen ? "border-[#9df01c]" : "border-transparent",
          !disabled && "hover:bg-[#374151]",
          disabled && "opacity-60 cursor-not-allowed",
          selectedOption ? "text-gray-200" : "text-gray-400"
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-[#afed50]">
              {selectedOption.icon}
            </span>
          )}
          <span>{selectedOption?.label || placeholder || 'Select'}</span>
        </span>
        <ChevronDown 
          size={16} 
          className={cn(
            "text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 w-full mt-1 rounded-lg overflow-hidden z-50 bg-[#2c2c2c] border border-[#4b5563] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.5)] max-h-96 overflow-y-auto custom-scroll pb-1">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "px-4 py-3 cursor-pointer flex items-center gap-3 border-b border-gray-700 last:border-0 transition-colors duration-200",
                "hover:bg-[#374151] hover:text-white",
                option.value === value ? "text-[#9df01c] font-bold" : "text-gray-300 font-semibold"
              )}
            >
              {option.icon && (
                <div className="w-6 h-6 flex items-center justify-center text-[#afed50]">
                  {option.icon}
                </div>
              )}
              <span className="text-sm tracking-wide uppercase">{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

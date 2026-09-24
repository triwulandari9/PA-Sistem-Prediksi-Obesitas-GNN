import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const CustomSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Pilih salah satu...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs transition-all duration-200 shadow-sm focus:outline-none ${
          isOpen
            ? 'bg-white border-[#5dbb7d] ring-2 ring-[#5dbb7d]/20 text-slate-900'
            : selectedOption
            ? 'bg-white border-slate-200 text-slate-800 font-medium hover:border-slate-300'
            : 'bg-[#edf2ef]/80 hover:bg-[#e4ece7] border-slate-200/50 text-slate-800'
        }`}
      >
        <span className={`truncate ${!selectedOption ? 'text-slate-400 font-normal italic' : 'text-slate-800 font-medium'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-300 ml-2 flex-shrink-0 ${
            isOpen ? 'transform rotate-180 text-[#5dbb7d]' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-100 py-1 overflow-hidden max-h-52 overflow-y-auto"
          style={{
            boxShadow: '0 8px 30px -6px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.06)',
            animation: 'customSelectSlideDown 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div className="px-1 space-y-0.5">
            {options.map((option) => {
              const isSelected = String(option.value) === String(value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between rounded-lg transition-all duration-150 ${
                    isSelected
                      ? 'bg-[#5dbb7d] text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Keyframe animation */}
      <style>{`
        @keyframes customSelectSlideDown {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const CustomSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Pilih salah satu...',
  className = '',
  placement = 'auto' // 'auto' | 'top' | 'bottom'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef(null);

  // Determine direction (up vs down) on open
  const toggleDropdown = () => {
    if (!isOpen && dropdownRef.current) {
      if (placement === 'top') {
        setOpenUpward(true);
      } else if (placement === 'bottom') {
        setOpenUpward(false);
      } else {
        // Auto detection: check viewport space below and above
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const estimatedHeight = Math.min(options.length * 36 + 16, 220);

        // Buka ke atas jika ruang di bawah sempit (< 240px) atau berada di area bawah layar dan ruang atas cukup
        if ((spaceBelow < estimatedHeight || spaceBelow < 240 || rect.top > window.innerHeight * 0.52) && spaceAbove > 160) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }
    }
    setIsOpen(!isOpen);
  };

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
        onClick={toggleDropdown}
        className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs transition-all duration-200 shadow-sm focus:outline-none cursor-pointer ${
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
          className={`w-3.5 h-3.5 transition-transform duration-200 ml-2 flex-shrink-0 ${
            isOpen ? 'transform rotate-180 text-[#5dbb7d]' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-[100] left-0 right-0 bg-white rounded-xl border border-slate-200/90 py-1.5 max-h-56 overflow-y-auto ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
          style={{
            boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
            animation: openUpward ? 'customSelectSlideUp 0.16s cubic-bezier(0.16, 1, 0.3, 1)' : 'customSelectSlideDown 0.16s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div className="px-1.5 space-y-0.5">
            {options.map((option) => {
              const isSelected = String(option.value) === String(value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between rounded-lg transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#5dbb7d] text-white font-bold shadow-sm shadow-[#5dbb7d]/30'
                      : 'text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-900 font-medium'
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

      {/* Keyframe animations */}
      <style>{`
        @keyframes customSelectSlideDown {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes customSelectSlideUp {
          from {
            opacity: 0;
            transform: translateY(6px);
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

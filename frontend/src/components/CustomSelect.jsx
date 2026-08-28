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
        className={`w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl border text-xs transition-all shadow-sm focus:outline-none ${
          isOpen
            ? 'bg-white border-[#5dbb7d] ring-2 ring-[#5dbb7d]/20 text-slate-900'
            : 'bg-[#edf2ef] hover:bg-[#e4ece7] border-transparent text-slate-800'
        }`}
      >
        <span className={`truncate ${!selectedOption ? 'text-slate-400 font-normal italic' : 'text-slate-800 font-medium'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ml-2 flex-shrink-0 ${
            isOpen ? 'transform rotate-180 text-[#5dbb7d]' : ''
          }`}
        />
      </button>

      {/* Floating Custom Menu Popover (MEMBUKA KE BAWAH, SEMUA ITEM TAMPIL UTUH TANPA SCROLL) */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-2xl border border-slate-100 py-1 overflow-visible animate-in">
          <div className="divide-y divide-slate-50">
            {options.map((option) => {
              const isSelected = String(option.value) === String(value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-[#5dbb7d] text-white font-bold'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

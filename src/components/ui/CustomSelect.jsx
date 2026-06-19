import { useState } from 'react';

export default function CustomSelect({ value, onChange, options, icon, disabled, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = (options || []).find(opt => {
    const optVal = typeof opt === 'object' ? opt.value : opt;
    return optVal === value;
  });
  const displayLabel = selectedOption 
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption) 
    : (value || placeholder);

  return (
    <div className={`relative ${isOpen ? 'z-[100]' : 'z-10'} w-full`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border border-slate-200 bg-white rounded-xl ${icon ? 'pl-8 xs:pl-10' : 'px-3'} pr-4 py-2.5 xs:py-3 text-xs xs:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary flex items-center justify-between cursor-pointer transition select-none disabled:bg-slate-50/50 disabled:text-slate-300 disabled:cursor-not-allowed text-left h-10 xs:h-12`}
      >
        <span className="truncate">{displayLabel}</span>
        <span className="text-slate-400 text-[10px] xs:text-xs ml-1 flex-shrink-0">
          <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
        </span>
      </button>

      {/* Left Icon overlay */}
      {icon && (
        <span className="absolute left-2.5 xs:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs xs:text-sm pointer-events-none">
          <i className={icon}></i>
        </span>
      )}

      {isOpen && (
        <>
          {/* Transparent full-screen overlay to catch click-outside */}
          <div 
            className="fixed inset-0 z-[140]" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Options Menu dropdown */}
          <div className="absolute top-[calc(100%+6px)] left-0 w-full min-w-[160px] bg-white border border-slate-200 rounded-2xl shadow-xl z-[150] py-1.5 overflow-hidden animate-scale-up">
            {options.map((opt) => {
              const optVal = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              const optDisabled = typeof opt === 'object' ? opt.disabled : false;
              const isSelected = optVal === value;

              return (
                <button
                  key={optVal}
                  type="button"
                  disabled={optDisabled}
                  onClick={() => {
                    onChange(optVal);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs xs:text-sm font-bold transition flex items-center justify-between ${
                    isSelected 
                      ? 'bg-sky-50 text-primary' 
                      : optDisabled 
                        ? 'opacity-30 cursor-not-allowed text-slate-300' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{optLabel}</span>
                  {isSelected && <i className="fa-solid fa-check text-[10px] text-primary"></i>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

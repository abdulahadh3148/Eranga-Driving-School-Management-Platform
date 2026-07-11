import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePicker({ value, onChange, placeholder = "Select Date", minYear = 2020, maxYear = 2035, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [inputValue, setInputValue] = useState(value || '');
  const containerRef = useRef(null);

  // Sync external value to internal string
   
  useEffect(() => {
    setInputValue(value || '');
    if (value && !isNaN(new Date(value).getTime())) {
      setCurrentViewDate(new Date(value));
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleDayClick = (day) => {
    const newDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), day);
    // Format to YYYY-MM-DD
    const localIso = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    onChange(localIso);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentViewDate(today);
    const localIso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    onChange(localIso);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    
    // Simple regex check for YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(new Date(val).getTime())) {
      onChange(val);
      setCurrentViewDate(new Date(val));
    }
  };

  // Calendar calculations
  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentViewDate(new Date(year, month + 1, 1));
  const handleYearChange = (e) => setCurrentViewDate(new Date(parseInt(e.target.value), month, 1));
  const handleMonthChange = (e) => setCurrentViewDate(new Date(year, parseInt(e.target.value), 1));

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onClick={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all cursor-text"
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 p-4 bg-white rounded-2xl shadow-xl border border-gray-100 w-[300px]"
          >
            {/* Header: Month & Year Selectors */}
            <div className="flex justify-between items-center mb-4 gap-2">
              <button 
                onClick={handlePrevMonth} 
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex gap-1 flex-1">
                <select 
                  value={month} 
                  onChange={handleMonthChange}
                  className="w-full text-sm font-bold text-gray-800 bg-transparent hover:bg-gray-50 rounded p-1 outline-none cursor-pointer appearance-none text-center"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
                
                <select 
                  value={year} 
                  onChange={handleYearChange}
                  className="w-full text-sm font-bold text-gray-800 bg-transparent hover:bg-gray-50 rounded p-1 outline-none cursor-pointer appearance-none text-center"
                >
                  {Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleNextMonth} 
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                // Fallback robust check for selected
                const checkDate = new Date(year, month, day);
                const localIso = new Date(checkDate.getTime() - checkDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                const active = value === localIso;

                const isToday = localIso === new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`
                      h-8 w-full rounded-lg text-sm flex items-center justify-center transition-all
                      ${active ? 'bg-primary text-white font-bold shadow-md shadow-primary/20' : 
                        isToday ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200' : 
                        'text-gray-700 hover:bg-gray-100'}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button 
                onClick={handleToday}
                className="w-full py-2 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
              >
                Go to Today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

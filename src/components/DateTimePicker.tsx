"use client";

import React, { useState, useEffect } from "react";

interface DateTimePickerProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

export function DateTimePicker({ value, onChange, label }: DateTimePickerProps) {
  // Parse initial value correctly
  const dateObj = value ? new Date(value) : null;
  const isValidDate = dateObj && !isNaN(dateObj.getTime());
  
  // To initialize state properly from potentially local or UTC strings:
  // If it's a valid date, we get its local components.
  let initialDateStr = "";
  let initialHour = "12";
  let initialMin = "00";
  let initialAmPm = "PM";

  if (isValidDate) {
    const yyyy = dateObj.getFullYear();
    const mm = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const dd = dateObj.getDate().toString().padStart(2, '0');
    initialDateStr = `${yyyy}-${mm}-${dd}`;
    
    let h = dateObj.getHours();
    const m = dateObj.getMinutes();
    initialAmPm = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    initialHour = h.toString().padStart(2, "0");
    initialMin = m.toString().padStart(2, "0");
  }

  const [date, setDate] = useState(initialDateStr);
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMin);
  const [ampm, setAmPm] = useState(initialAmPm);

  // When value prop changes from outside (e.g. resetting modal), update internal state
  useEffect(() => {
    if (!value) {
      setDate("");
      setHour("12");
      setMinute("00");
      setAmPm("PM");
    }
  }, [value]);

  useEffect(() => {
    if (!date) {
      // If date is cleared, notify parent
      if (value !== "") {
        onChange("");
      }
      return;
    }
    
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    
    // Create new date string in local timezone
    const [year, month, day] = date.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), h, parseInt(minute), 0, 0);
    
    const iso = d.toISOString();
    if (value !== iso) {
      onChange(iso);
    }
  }, [date, hour, minute, ampm, onChange]);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
      <div className="flex flex-wrap gap-2 w-full">
        <input 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)}
          className="flex-1 min-w-[130px] border border-slate-200 rounded-lg px-2 py-2 text-sm outline-none focus:border-blue-500 bg-white"
        />
        <div className="flex gap-1.5 flex-1 min-w-[140px]">
          <select 
            value={hour} 
            onChange={e => setHour(e.target.value)}
            className="flex-1 border border-slate-200 rounded-lg px-1 py-2 text-sm outline-none focus:border-blue-500 appearance-none text-center bg-white cursor-pointer"
          >
            {['01','02','03','04','05','06','07','08','09','10','11','12'].map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <span className="self-center font-bold text-slate-400">:</span>
          <select 
            value={minute} 
            onChange={e => setMinute(e.target.value)}
            className="flex-1 border border-slate-200 rounded-lg px-1 py-2 text-sm outline-none focus:border-blue-500 appearance-none text-center bg-white cursor-pointer"
          >
            {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select 
            value={ampm} 
            onChange={e => setAmPm(e.target.value)}
            className="flex-[1.2] border border-slate-200 rounded-lg px-1 py-2 text-sm outline-none focus:border-blue-500 appearance-none text-center font-semibold bg-white cursor-pointer"
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>
    </div>
  );
}

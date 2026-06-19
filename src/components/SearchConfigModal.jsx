import { useState } from 'react';
import CustomSelect from './ui/CustomSelect';
import CalendarSelect from './ui/CalendarSelect';
import { parseDateStr, formatDateToStr } from '../lib/helpers';
import { locations } from '../lib/constants';

export default function SearchConfigModal({ origin, destination, isRT, adults, kids, dateOut, dateRet, onClose, onSave, t, lang }) {
  const [lclOrigin, setLclOrigin] = useState(origin);
  const [lclDestination, setLclDestination] = useState(destination);
  const [lclIsRT, setLclIsRT] = useState(isRT);
  const [lclAdults, setLclAdults] = useState(adults);
  const [lclKids, setLclKids] = useState(kids);
  const [lclDateOut, setLclDateOut] = useState(dateOut);
  const [lclDateRet, setLclDateRet] = useState(dateRet);

  const handleDateOutChange = (val) => {
    setLclDateOut(val);
    const outDate = parseDateStr(val, lang);
    const retDate = parseDateStr(lclDateRet, lang);
    if (retDate < outDate) {
      const nextDay = new Date(outDate);
      nextDay.setDate(outDate.getDate() + 1);
      setLclDateRet(formatDateToStr(nextDay, lang));
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] w-full max-w-lg shadow-2xl transition-all duration-300 transform scale-100 flex flex-col overflow-hidden animate-scale-up">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wide">{t.searchRoute}</h3>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 transition"><i className="fa-solid fa-xmark"></i></button>
      </div>

      <div className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">

        {/* Toggle Trip Type */}
        <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-2xl mb-2">
          <button
            onClick={() => setLclIsRT(false)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${!lclIsRT ? 'bg-primary text-white shadow-sm' : 'text-slate-650 hover:text-slate-800'}`}
          >
            {t.oneWay}
          </button>
          <button
            onClick={() => setLclIsRT(true)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${lclIsRT ? 'bg-primary text-white shadow-sm' : 'text-slate-650 hover:text-slate-800'}`}
          >
            {t.roundTrip}
          </button>
        </div>

        {/* Ports selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t.originPort}</label>
            <CustomSelect
              value={lclOrigin}
              onChange={setLclOrigin}
              options={locations}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t.destPort}</label>
            <CustomSelect
              value={lclDestination}
              onChange={setLclDestination}
              options={locations}
            />
          </div>
        </div>

        {/* Dates Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{lang === 'id' ? 'Tanggal Pergi' : 'Departure Date'}</label>
            <CalendarSelect
              value={lclDateOut}
              onChange={handleDateOutChange}
              lang={lang}
            />
          </div>
          <div>
            <label className={`block text-xs font-bold text-slate-500 mb-1.5 ${!lclIsRT ? 'opacity-40' : ''}`}>{lang === 'id' ? 'Tanggal Pulang' : 'Return Date'}</label>
            <CalendarSelect
              value={lclDateRet}
              onChange={setLclDateRet}
              disabled={!lclIsRT}
              minDate={lclDateOut}
              lang={lang}
            />
          </div>
        </div>

        {/* Passengers quantity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-550 mb-2">{t.adults}</label>
            <div className="flex items-center justify-between border border-slate-200 rounded-xl p-1 bg-white h-10">
              <button
                type="button"
                onClick={() => setLclAdults(Math.max(1, lclAdults - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary active:bg-slate-50 transition"
              >
                <i className="fa-solid fa-minus text-[10px]"></i>
              </button>
              <span className="text-xs font-extrabold text-slate-800 w-6 text-center">{lclAdults}</span>
              <button
                type="button"
                onClick={() => setLclAdults(lclAdults + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary active:bg-slate-50 transition"
              >
                <i className="fa-solid fa-plus text-[10px]"></i>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-555 mb-2">{t.kids}</label>
            <div className="flex items-center justify-between border border-slate-200 rounded-xl p-1 bg-white h-10">
              <button
                type="button"
                onClick={() => setLclKids(Math.max(0, lclKids - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary active:bg-slate-50 transition"
              >
                <i className="fa-solid fa-minus text-[10px]"></i>
              </button>
              <span className="text-xs font-extrabold text-slate-800 w-6 text-center">{lclKids}</span>
              <button
                type="button"
                onClick={() => setLclKids(lclKids + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary active:bg-slate-50 transition"
              >
                <i className="fa-solid fa-plus text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>

      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4 rounded-b-[24px]">
        <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-655 bg-white hover:bg-slate-100 transition">{t.cancel}</button>
        <button onClick={() => onSave(lclOrigin, lclDestination, lclIsRT, lclAdults, lclKids, lclDateOut, lclDateRet)} className="flex-1 bg-primary hover:bg-sky-850 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-md shadow-sky-100">{t.saveRoute}</button>
      </div>
    </div>
  );
}

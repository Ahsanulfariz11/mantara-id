import { Map, MapMarker, MapRoute, MapControls, MarkerContent, MarkerLabel } from "@/components/ui/map";
import { mapPorts } from "../lib/constants";

export default function InteractiveMap({ origin, destination, mapSelectionStep, handleMapPortClick, swapPorts, lang, t }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 bg-slate-50 border border-slate-200/60 rounded-2xl sm:rounded-3xl p-3 sm:p-4 mb-3 sm:mb-4 flex-shrink-0 gap-3 sm:gap-4 overflow-hidden relative shadow-sm">
      <div className="lg:col-span-4 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1.5 sm:mb-2 text-primary">
          <i className="fa-solid fa-map-location-dot text-sm"></i>
          <h3 className="font-extrabold text-xs sm:text-sm tracking-wide uppercase">{t.routeMap}</h3>
        </div>
        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mb-1.5 sm:mb-2">{origin} ➔ {destination}</h4>
        <p className="text-[10px] sm:text-xs text-slate-500 mb-3 sm:mb-4 leading-relaxed">{t.mapInstruction}</p>

        {/* Connection indicator */}
        <div className="bg-white border border-slate-200 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase block">{lang === 'id' ? 'ASAL' : 'ORIGIN'}</span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-700">{origin} ({mapPorts[origin]?.code})</span>
          </div>
          <button onClick={swapPorts} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-650 hover:bg-primary hover:text-white transition flex items-center justify-center shadow-sm flex-shrink-0 mx-2">
            <i className="fa-solid fa-arrow-right-arrow-left text-[10px] sm:text-xs"></i>
          </button>
          <div className="text-right">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase block">{lang === 'id' ? 'TUJUAN' : 'DESTINATION'}</span>
            <span className="text-[10px] sm:text-xs font-bold text-primary">{destination} ({mapPorts[destination]?.code})</span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 h-48 sm:h-64 md:h-72 lg:h-64 flex justify-center bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 relative overflow-hidden shadow-inner">
        <Map
          viewport={{
            center: [117.2, 3.4], // Centered in North Kalimantan
            zoom: 6.8,
            pitch: 20,
          }}
          className="w-full h-full"
        >
          <MapControls showZoom showCompass position="top-right" />

          <MapRoute
            coordinates={[
              mapPorts[origin]?.coord,
              mapPorts[destination]?.coord,
            ]}
            color="#0369a1"
            lineWidth={4}
            animated={true}
          />

          {Object.entries(mapPorts).map(([portName, data]) => {
            const isOrigin = portName === origin;
            const isDest = portName === destination;
            const isSelected = isOrigin || isDest;

            return (
              <MapMarker
                key={portName}
                longitude={data.coord[0]}
                latitude={data.coord[1]}
                onClick={() => handleMapPortClick(portName)}
              >
                <MarkerContent className="group">
                  {isSelected && (
                    <div className={`absolute -inset-2.5 rounded-full animate-ping ${isOrigin ? 'bg-sky-500/60' : 'bg-orange-500/60'}`}></div>
                  )}
                  <div className={`relative w-5 h-5 rounded-full border-2 transition-transform duration-200 group-hover:scale-125 shadow-md ${isSelected ? (isOrigin ? 'bg-sky-600 border-white' : 'bg-orange-500 border-white') : 'bg-white border-slate-400'}`}></div>
                  <MarkerLabel position="bottom" className={`mt-2 px-1.5 py-0.5 rounded-sm backdrop-blur-xs font-bold shadow-xs transition-colors ${isSelected ? 'text-slate-900 bg-white/80' : 'text-slate-655 bg-white/50'} group-hover:text-slate-900 group-hover:bg-white`}>
                    {data.label} ({data.code})
                  </MarkerLabel>
                </MarkerContent>
              </MapMarker>
            );
          })}
        </Map>
        {/* Status Indicator */}
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs font-bold text-slate-700">
          {mapSelectionStep === 'origin'
            ? (lang === 'id' ? 'Klik pelabuhan untuk Asal' : 'Click a port for Origin')
            : (lang === 'id' ? 'Klik pelabuhan untuk Tujuan' : 'Click a port for Destination')
          }
        </div>
      </div>
    </div>
  );
}

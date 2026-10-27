import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { India3DMap } from "../components/map/India3DMap";
import type { Destination } from "../types";
import { fetchDestinations, fetchStates } from "../api/client";
import { Compass, Filter, MapPin, Layers, RefreshCw } from "lucide-react";

export const ExplorerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get("focus") || undefined;

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [destRes, stateList] = await Promise.all([
          fetchDestinations({ page: 1, page_size: 50, state: selectedState || undefined }),
          fetchStates()
        ]);
        setDestinations(destRes.items || []);
        setStates(stateList);
      } catch (err) {
        console.error("Explorer data error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedState]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Top Header & State Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
              <Compass className="w-5 h-5 text-teal-400" />
            </div>
            <h1 className="text-xl font-extrabold text-ivory tracking-tight">Interactive 3D India Explorer</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real coordinates, DEM elevation terrain, mountain ranges, and national parks across India.
          </p>
        </div>

        {/* State Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-teal-400" />
            <span>State Filter:</span>
          </div>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-ivory focus:outline-none focus:border-teal-400"
          >
            <option value="">All States & Territories ({destinations.length} POIs)</option>
            {states.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          {selectedState && (
            <button
              onClick={() => setSelectedState("")}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-ivory text-xs"
              title="Clear Filter"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main 3D Map Component */}
      <India3DMap
        destinations={destinations}
        selectedDestinationId={focusId}
        height="h-[calc(100vh-210px)] min-h-[600px]"
      />
    </div>
  );
};

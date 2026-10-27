import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { Destination } from "../types";
import { fetchDestinations, fetchCategories, fetchStates, fetchRegions } from "../api/client";
import { DestinationCard } from "../components/destination/DestinationCard";
import { Search, Filter, RotateCcw, ChevronLeft, ChevronRight, Grid, MapPin } from "lucide-react";

export const DirectoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  const initialCategory = searchParams.get("category") || "";

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [state, setState] = useState("");
  const [region, setRegion] = useState("");
  const [budgetTier, setBudgetTier] = useState("");
  const [page, setPage] = useState(1);

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [statesList, setStatesList] = useState<string[]>([]);
  const [regionsList, setRegionsList] = useState<string[]>([]);

  // Load filter option lists once
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [cats, sts, regs] = await Promise.all([
          fetchCategories(),
          fetchStates(),
          fetchRegions()
        ]);
        setCategoriesList(cats);
        setStatesList(sts);
        setRegionsList(regs);
      } catch (err) {
        console.error("Filter options error:", err);
      }
    }
    loadFilterOptions();
  }, []);

  // Fetch destinations when query/filters/page change
  useEffect(() => {
    async function loadDestinations() {
      try {
        setLoading(true);
        const res = await fetchDestinations({
          query: query || undefined,
          category: category || undefined,
          state: state || undefined,
          region: region || undefined,
          budget_tier: budgetTier || undefined,
          page,
          page_size: 9
        });
        setDestinations(res.items || []);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch (err) {
        console.error("Load directory error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDestinations();
  }, [query, category, state, region, budgetTier, page]);

  const handleResetFilters = () => {
    setQuery("");
    setCategory("");
    setState("");
    setRegion("");
    setBudgetTier("");
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
              <Grid className="w-5 h-5 text-teal-400" />
            </div>
            <h1 className="text-2xl font-extrabold text-ivory tracking-tight">Destination Directory</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete catalog of Indian national parks, Himalayan peaks, beaches, and UNESCO heritage sites.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-teal-300">
            {total} Verified Destinations
          </span>
          {(query || category || state || region || budgetTier) && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        {/* Search input */}
        <div className="relative flex items-center bg-slate-900/90 rounded-xl px-3 border border-slate-700 focus-within:border-teal-400">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by destination name, keywords, highlights, or tags..."
            className="w-full bg-transparent border-none py-2.5 px-3 text-xs text-ivory placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {/* Multi-Facet Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Category */}
          <div>
            <label className="text-[11px] text-slate-400 block mb-1 font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-ivory text-xs focus:outline-none focus:border-teal-400"
            >
              <option value="">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* State */}
          <div>
            <label className="text-[11px] text-slate-400 block mb-1 font-medium">State / UT</label>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-ivory text-xs focus:outline-none focus:border-teal-400"
            >
              <option value="">All States</option>
              {statesList.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Region */}
          <div>
            <label className="text-[11px] text-slate-400 block mb-1 font-medium">Geographic Region</label>
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-ivory text-xs focus:outline-none focus:border-teal-400"
            >
              <option value="">All Regions</option>
              {regionsList.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Tier */}
          <div>
            <label className="text-[11px] text-slate-400 block mb-1 font-medium">Budget Band</label>
            <select
              value={budgetTier}
              onChange={(e) => {
                setBudgetTier(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-ivory text-xs focus:outline-none focus:border-teal-400"
            >
              <option value="">All Budgets</option>
              <option value="Budget">Budget</option>
              <option value="Moderate">Moderate</option>
              <option value="Luxury">Luxury</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 rounded-2xl glass-panel animate-pulse bg-slate-900/50" />
          ))}
        </div>
      ) : destinations.length === 0 ? (
        <div className="p-12 rounded-2xl glass-panel text-center space-y-3">
          <MapPin className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-ivory">No destinations match your criteria</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your category, state, or search keywords to view available locations.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest) => (
            <DestinationCard key={dest.destination_id} destination={dest} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-300 px-3">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

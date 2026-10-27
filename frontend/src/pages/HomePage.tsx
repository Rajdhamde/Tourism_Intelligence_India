import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Compass,
  Map,
  Search,
  Sparkles,
  BarChart3,
  Bot,
  ArrowRight,
  ShieldCheck,
  Mountain,
  Landmark,
  Palmtree,
  TreePine,
  Building2,
  ChevronRight,
  TrendingUp,
  MapPin
} from "lucide-react";
import type { Destination, OverviewKPIs } from "../types";
import { fetchDestinations, fetchOverviewKPIs } from "../api/client";
import { DestinationCard } from "../components/destination/DestinationCard";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredDestinations, setFeaturedDestinations] = useState<Destination[]>([]);
  const [kpis, setKpis] = useState<OverviewKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [destRes, kpiRes] = await Promise.all([
          fetchDestinations({ page: 1, page_size: 6 }),
          fetchOverviewKPIs().catch(() => null)
        ]);
        setFeaturedDestinations(destRes.items || []);
        setKpis(kpiRes);
      } catch (err) {
        console.error("Home data load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/directory?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const CATEGORY_SHORTCUTS = [
    { name: "Himalayas & Treks", filter: "Mountains & Trekking", icon: Mountain, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
    { name: "Monuments & Heritage", filter: "Heritage & Monuments", icon: Landmark, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
    { name: "Beaches & Islands", filter: "Beaches & Islands", icon: Palmtree, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
    { name: "Tiger Reserves & Wildlife", filter: "National Parks & Wildlife", icon: TreePine, color: "text-lime-400 bg-lime-500/10 border-lime-500/30" },
    { name: "Urban Promenades", filter: "Famous Streets & Promenades", icon: Building2, color: "text-teal-400 bg-teal-500/10 border-teal-500/30" },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          {/* Academic Topic Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs text-teal-300 shadow-glass">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            <span className="font-semibold">Tourism Data Warehouse & Behaviour Mining Platform</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-ivory max-w-4xl mx-auto leading-tight">
            Geospatial Intelligence & <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-amber-300 bg-clip-text text-transparent">Destination Recommendation</span> for India
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Harnessing a dimensional star-schema data warehouse, unsupervised K-Means clustering, and multi-criteria hybrid recommendation models to discover verified attractions across the Himalayas, deserts, backwaters, and heritage landmarks.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center glass-panel-elevated rounded-2xl p-2 border border-slate-700 focus-within:border-teal-400 shadow-2xl transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by destination, state, peak, national park, or heritage site..."
                className="w-full bg-transparent border-none text-sm text-ivory px-3 focus:outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-lg shadow-teal-500/20"
              >
                <span>Explore</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-4 text-xs font-semibold">
            <Link
              to="/explorer"
              className="p-3 rounded-xl glass-panel border border-slate-800 hover:border-teal-500/50 hover:bg-slate-800/60 flex items-center justify-center gap-2 text-ivory transition-all group"
            >
              <Map className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
              <span>3D India Map</span>
            </Link>
            <Link
              to="/recommendations"
              className="p-3 rounded-xl glass-panel border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/60 flex items-center justify-center gap-2 text-ivory transition-all group"
            >
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>ML Recommender</span>
            </Link>
            <Link
              to="/analytics"
              className="p-3 rounded-xl glass-panel border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60 flex items-center justify-center gap-2 text-ivory transition-all group"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Analytics DWH</span>
            </Link>
            <Link
              to="/assistant"
              className="p-3 rounded-xl glass-panel border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/60 flex items-center justify-center gap-2 text-ivory transition-all group"
            >
              <Bot className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>AI Travel Assistant</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Real Warehouse Metrics Strip */}
      {kpis && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl glass-panel-elevated border border-slate-800/80">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Curated Destinations</span>
              <span className="text-2xl font-extrabold text-ivory mt-0.5 block">{kpis.total_destinations}</span>
              <span className="text-[10px] text-teal-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3" /> Factual Geo Records
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">DWH Tracked Visits</span>
              <span className="text-2xl font-extrabold text-ivory mt-0.5 block">{kpis.total_tracked_visits.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3 h-3" /> Star-Schema Fact Visits
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Tourist Profiles Clustered</span>
              <span className="text-2xl font-extrabold text-ivory mt-0.5 block">{kpis.total_tourist_profiles.toLocaleString()}</span>
              <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                <span>{kpis.active_clusters_count} Behavioral Segments</span>
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Average Tourist Spend</span>
              <span className="text-2xl font-extrabold text-ivory mt-0.5 block">₹{Math.round(kpis.avg_estimated_spend_inr).toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Avg Trip: {kpis.avg_trip_duration_days} days
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Category Discovery Pills */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-ivory tracking-tight">Explore by Destination Category</h2>
            <p className="text-xs text-slate-400">Classified using tourism data warehousing ontology</p>
          </div>
          <Link to="/directory" className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1">
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CATEGORY_SHORTCUTS.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                onClick={() => navigate(`/directory?category=${encodeURIComponent(cat.filter)}`)}
                className={`p-3.5 rounded-xl border flex flex-col items-start gap-2.5 transition-all text-left group hover:scale-[1.02] ${cat.color}`}
              >
                <div className="p-2 rounded-lg bg-slate-900/80">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-ivory group-hover:text-teal-300">{cat.name}</h4>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Filter Records →</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Destinations Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-ivory tracking-tight">Featured Indian Destinations</h2>
            <p className="text-xs text-slate-400">
              Verified high-altitude Himalayan lakes, Western Ghats tea plantations, and living desert fortresses
            </p>
          </div>
          <Link
            to="/directory"
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 transition-colors"
          >
            <span>Full Directory ({featuredDestinations.length > 0 ? "20+" : "Loading..."})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 rounded-2xl glass-panel animate-pulse bg-slate-900/50" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDestinations.map((dest) => (
              <DestinationCard key={dest.destination_id} destination={dest} />
            ))}
          </div>
        )}
      </section>

      {/* Interactive 3D Callout Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl glass-panel-elevated border border-teal-500/30 p-8 sm:p-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-4 max-w-xl text-left">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
              Geospatial 3D Terrain Exploration
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-ivory leading-tight">
              Fly Through Mountain Elevations and Coastal Peninsulas
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Explore India with full 3D camera pitch, digital elevation models, mountain range vistas, and clickable POI markers for national parks, UNESCO heritage monuments, and tranquil backwaters.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/explorer"
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-teal-500/20"
              >
                <Compass className="w-4 h-4" />
                <span>Launch Interactive 3D Explorer</span>
              </Link>
              <Link
                to="/recommendations"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-ivory font-semibold text-xs transition-colors"
              >
                <span>Find Your Segment</span>
              </Link>
            </div>
          </div>

          <div className="w-full md:w-96 rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl shrink-0 aspect-[4/3] relative">
            <img
              src="https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80"
              alt="Himalayan Lake 3D Vista"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end p-4">
              <div className="text-xs">
                <span className="text-teal-300 font-bold block">Pangong Tso & Ladakh Highlands</span>
                <span className="text-slate-400 text-[10px]">4,225m Altitude Elevation • 3D Topographic Terrain</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

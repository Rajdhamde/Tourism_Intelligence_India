import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Clock,
  Star,
  Compass,
  Bookmark,
  Share2,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  DollarSign
} from "lucide-react";
import type { DestinationDetail, DestinationNearby } from "../types";
import { fetchDestinationDetail, fetchNearbyDestinations, recordInteraction } from "../api/client";

export const DestinationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [destination, setDestination] = useState<DestinationDetail | null>(null);
  const [nearby, setNearby] = useState<DestinationNearby[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeImage, setActiveImage] = useState<string>("");
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      try {
        setLoading(true);
        const [dest, nearList] = await Promise.all([
          fetchDestinationDetail(id!),
          fetchNearbyDestinations(id!, 450)
        ]);
        setDestination(dest);
        setNearby(nearList);
        setActiveImage(dest.cover_image);

        // Check if saved
        const savedList = JSON.parse(localStorage.getItem("tii_saved_destinations") || "[]");
        setIsSaved(savedList.includes(id));

        // Record interaction telemetry
        recordInteraction(id, "view");
      } catch (err) {
        console.error("Detail load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  const toggleSave = () => {
    if (!destination) return;
    const savedList: string[] = JSON.parse(localStorage.getItem("tii_saved_destinations") || "[]");
    let updated: string[];
    if (savedList.includes(destination.destination_id)) {
      updated = savedList.filter((item) => item !== destination.destination_id);
      setIsSaved(false);
    } else {
      updated = [...savedList, destination.destination_id];
      setIsSaved(true);
      recordInteraction(destination.destination_id, "save");
    }
    localStorage.setItem("tii_saved_destinations", JSON.stringify(updated));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-teal-400 border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Loading destination intelligence profile...</p>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-ivory">Destination record not found</h2>
        <Link to="/directory" className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs inline-block">
          Return to Directory
        </Link>
      </div>
    );
  }

  const galleryImages = [destination.cover_image, ...(destination.gallery || [])].filter(
    (img, idx, arr) => arr.indexOf(img) === idx
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumb Bar */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="hover:text-ivory transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link to="/directory" className="hover:text-ivory transition-colors">Directory</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-teal-400 font-medium">{destination.name}</span>
      </nav>

      {/* Hero Media & Identity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Photo Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
            <img
              src={activeImage || destination.cover_image}
              alt={destination.name}
              className="w-full h-full object-cover transition-all duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

            {/* Floating 3D Explorer Button */}
            <button
              onClick={() => navigate(`/explorer?focus=${destination.destination_id}`)}
              className="absolute bottom-4 right-4 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xl shadow-teal-500/20 transition-all hover:scale-105"
            >
              <Compass className="w-4 h-4" />
              <span>Explore on 3D Map</span>
            </button>
          </div>

          {/* Gallery Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImage === img ? "border-teal-400 scale-105 shadow-glow" : "border-slate-800 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Gallery thumb ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Media Attribution */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Photo attribution: <span className="text-slate-300 font-medium">{destination.image_attribution}</span></span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-mono text-[10px]">{destination.image_license}</span>
          </div>
        </div>

        {/* Right Column: Key Details & Quick Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/20 border border-teal-500/40 text-teal-300">
                {destination.category}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSave}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-amber-400 transition-colors"
                  title={isSaved ? "Saved" : "Save destination"}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? "fill-amber-400 text-amber-400" : ""}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-ivory transition-colors relative"
                  title="Share link"
                >
                  <Share2 className="w-4 h-4" />
                  {copied && (
                    <span className="absolute -top-7 -left-4 px-2 py-0.5 rounded bg-teal-500 text-slate-950 text-[10px] font-bold">
                      Copied!
                    </span>
                  )}
                </button>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold text-ivory tracking-tight">{destination.name}</h1>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1 font-semibold text-teal-400">
                <MapPin className="w-4 h-4" />
                {destination.state}, {destination.region} India
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {destination.rating.toFixed(1)} ({destination.review_count} reviews)
              </span>
            </div>
          </div>

          {/* Quick Specifications Matrix */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl glass-panel border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Elevation Altitude</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                {Math.round(destination.elevation_m)} meters
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Typical Visit Duration</span>
              <span className="text-ivory font-bold text-sm flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {destination.avg_visit_duration_days} Days
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Estimated Budget Tier</span>
              <span className="text-amber-400 font-bold text-sm">
                {destination.estimated_budget_tier} (~₹{Math.round(destination.typical_spend_inr).toLocaleString()})
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Prime Travel Season</span>
              <span className="text-ivory font-bold text-sm flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {destination.best_season}
              </span>
            </div>
          </div>

          {/* Highlights List */}
          {destination.highlights && destination.highlights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-ivory uppercase tracking-wider">Key Highlights</h4>
              <div className="flex flex-wrap gap-1.5">
                {destination.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200"
                  >
                    ✓ {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {destination.tags && destination.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ontology Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {destination.tags.map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full bg-slate-800/80 text-[10px] font-mono text-teal-300"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            onClick={() => navigate(`/recommendations?target=${destination.destination_id}`)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.01]"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Generate Personalized Recommendations Based on This</span>
          </button>
        </div>
      </div>

      {/* Detailed Description & Verified Visitor Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-ivory">Comprehensive Destination Profile</h3>
            <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-line">
              {destination.detailed_description}
            </p>
          </div>

          {/* Verified Official Visitor Information (Non-Fabricated) */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ivory flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified Visitor Guidelines & Entry Information
              </h3>
              <span className="text-[10px] text-slate-400">
                Verified: {destination.last_verified_date}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[11px] font-medium block mb-1">Ticketing & Entry Fees</span>
                <p className="text-slate-200">{destination.entry_fee_info}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[11px] font-medium block mb-1">Operating Hours</span>
                <p className="text-slate-200">{destination.opening_hours_info}</p>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
              <span>Authority Source: <span className="text-slate-300">{destination.source_name}</span></span>
              {destination.source_url && (
                <a
                  href={destination.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium"
                >
                  Official Portal <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Nearby Attractions (Haversine Spatial Query) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ivory flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-400" />
                Nearby Attractions
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-mono">
                &lt; 450 km
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Computed via great-circle Haversine spatial geodesic distance in SQL.
            </p>

            <div className="space-y-3">
              {nearby.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">No nearby records found within radius.</p>
              ) : (
                nearby.map((place) => (
                  <Link
                    key={place.destination_id}
                    to={`/destinations/${place.destination_id}`}
                    className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/40 transition-all group"
                  >
                    <img
                      src={place.cover_image}
                      alt={place.name}
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-ivory group-hover:text-teal-300 truncate">
                        {place.name}
                      </h4>
                      <div className="text-[11px] text-slate-400 truncate">{place.state}</div>
                      <div className="flex items-center justify-between text-[10px] text-emerald-400 mt-1 font-mono">
                        <span>{place.distance_km} km away</span>
                        <span className="text-amber-400 font-sans">★ {place.rating}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, MapPin, Calendar, Compass, Bookmark, Clock, ArrowUpRight } from "lucide-react";
import type { Destination } from "../../types";
import { recordInteraction } from "../../api/client";

interface DestinationCardProps {
  destination: Destination;
  onExplore3D?: (dest: Destination) => void;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({ destination, onExplore3D }) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const savedList = JSON.parse(localStorage.getItem("tii_saved_destinations") || "[]");
      setIsSaved(savedList.includes(destination.destination_id));
    } catch (e) {
      // ignore
    }
  }, [destination.destination_id]);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const savedList: string[] = JSON.parse(localStorage.getItem("tii_saved_destinations") || "[]");
      let updated: string[];
      if (savedList.includes(destination.destination_id)) {
        updated = savedList.filter((id) => id !== destination.destination_id);
        setIsSaved(false);
      } else {
        updated = [...savedList, destination.destination_id];
        setIsSaved(true);
        recordInteraction(destination.destination_id, "save");
      }
      localStorage.setItem("tii_saved_destinations", JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const getCategoryColor = (cat: string) => {
    if (cat.includes("Mountain") || cat.includes("Trek")) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    if (cat.includes("Heritage") || cat.includes("Temple")) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    if (cat.includes("Beach") || cat.includes("Island")) return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
    if (cat.includes("Wildlife") || cat.includes("Park")) return "bg-lime-500/15 text-lime-300 border-lime-500/30";
    return "bg-teal-500/15 text-teal-300 border-teal-500/30";
  };

  const handleCardClick = () => {
    recordInteraction(destination.destination_id, "click");
  };

  return (
    <div
      onClick={handleCardClick}
      className="group rounded-2xl glass-panel overflow-hidden border border-slate-800/80 hover:border-teal-500/40 hover:shadow-glow transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        {/* Cover Image with Badges */}
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
          <img
            src={destination.cover_image}
            alt={destination.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

          {/* Category Pill */}
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md ${getCategoryColor(destination.category)}`}>
              {destination.category}
            </span>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={toggleSave}
            title={isSaved ? "Saved to Favourites" : "Save destination"}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/70 backdrop-blur-md border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-amber-400 hover:scale-110 transition-all duration-150"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? "fill-amber-400 text-amber-400" : ""}`} />
          </button>

          {/* Bottom Overlay Info */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
            <span className="flex items-center gap-1 font-medium text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              {destination.state} • {destination.region}
            </span>
            {destination.elevation_m > 300 && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-emerald-300 font-mono">
                {Math.round(destination.elevation_m)}m elev
              </span>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base text-ivory group-hover:text-teal-300 transition-colors line-clamp-1">
              {destination.name}
            </h3>
            <div className="flex items-center gap-1 text-amber-400 font-semibold text-xs shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{destination.rating.toFixed(1)}</span>
            </div>
          </div>

          <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
            {destination.short_description}
          </p>

          {/* Quick Specs Strip */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{destination.best_season}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate justify-end">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>~{destination.avg_visit_duration_days} days trip</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-0 flex items-center gap-2">
        <Link
          to={`/destinations/${destination.destination_id}`}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-semibold text-ivory text-center flex items-center justify-center gap-1.5 transition-colors"
        >
          View Details
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (onExplore3D) {
              onExplore3D(destination);
            } else {
              navigate(`/explorer?focus=${destination.destination_id}`);
            }
          }}
          className="py-2 px-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-semibold text-teal-300 flex items-center gap-1.5 transition-colors"
          title="Explore on 3D Map"
        >
          <Compass className="w-3.5 h-3.5 text-teal-400" />
          <span>3D Map</span>
        </button>
      </div>
    </div>
  );
};

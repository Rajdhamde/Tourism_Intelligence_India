import React, { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker, NavigationControl } from "maplibre-gl";
import {
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  MapPin,
  Calendar,
  X,
  ExternalLink,
  Sparkles,
  Mountain,
  Palmtree,
  Landmark,
  TreePine,
  Building2,
  Navigation
} from "lucide-react";
import type { Destination } from "../../types";
import { recordInteraction } from "../../api/client";
import { useNavigate } from "react-router-dom";

interface India3DMapProps {
  destinations: Destination[];
  selectedDestinationId?: string;
  onSelectDestination?: (dest: Destination) => void;
  height?: string;
}

export const India3DMap: React.FC<India3DMapProps> = ({
  destinations,
  selectedDestinationId,
  onSelectDestination,
  height = "h-[750px]"
}) => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<{ [id: string]: Marker }>({});

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [selectedPlace, setSelectedPlace] = useState<Destination | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [webGLError, setWebGLError] = useState<boolean>(false);

  // Region Camera Presets
  const REGION_PRESETS = [
    { name: "All India", center: [78.9629, 22.5937] as [number, number], zoom: 4.3, pitch: 35, bearing: 0 },
    { name: "Himalayas & North", center: [78.0, 31.5] as [number, number], zoom: 6.5, pitch: 55, bearing: -10 },
    { name: "Rajasthan & West", center: [74.5, 26.5] as [number, number], zoom: 6.2, pitch: 40, bearing: 10 },
    { name: "Kerala & South", center: [76.5, 11.5] as [number, number], zoom: 6.5, pitch: 45, bearing: -5 },
    { name: "Northeast India", center: [92.5, 26.0] as [number, number], zoom: 6.5, pitch: 45, bearing: 15 }
  ];

  // Helper for marker color & icon
  const getMarkerBadgeStyle = (category: string) => {
    if (category.includes("Mountain") || category.includes("Trek")) {
      return { bg: "bg-emerald-500", border: "border-emerald-300", icon: "🏔" };
    }
    if (category.includes("Heritage") || category.includes("Monument") || category.includes("Temple")) {
      return { bg: "bg-amber-500", border: "border-amber-300", icon: "🏛" };
    }
    if (category.includes("Beach") || category.includes("Island")) {
      return { bg: "bg-cyan-500", border: "border-cyan-300", icon: "🏖" };
    }
    if (category.includes("Wildlife") || category.includes("Park")) {
      return { bg: "bg-lime-500", border: "border-lime-300", icon: "🐅" };
    }
    return { bg: "bg-teal-500", border: "border-teal-300", icon: "📍" };
  };

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    try {
      const map = new MapLibreMap({
        container: mapContainer.current,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: [78.9629, 22.5937],
        zoom: 4.3,
        pitch: 35,
        bearing: 0,
        maxPitch: 65,
        attributionControl: false
      });

      map.addControl(new NavigationControl({ showCompass: true, visualizePitch: true }), "top-left");

      map.on("load", () => {
        setMapLoaded(true);

        // Add 3D hillshading layer where supported
        try {
          if (!map.getSource("terrain-dem")) {
            map.addSource("terrain-dem", {
              type: "raster-dem",
              tiles: ["https://demotiles.maplibre.org/terrain-tiles/{z}/{x}/{y}.png"],
              tileSize: 256,
              maxzoom: 12
            });
            map.setTerrain({ source: "terrain-dem", exaggeration: 1.5 });
          }
        } catch (e) {
          console.debug("3D terrain source optional notice:", e);
        }
      });

      map.on("error", (e) => {
        console.warn("MapLibre notice:", e);
      });

      mapInstance.current = map;
    } catch (err) {
      console.error("MapLibre WebGL initialization failed; falling back to 2D topological explorer", err);
      setWebGLError(true);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Sync Markers when destinations or category filter changes
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded) return;

    // Clear previous markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    const filtered = destinations.filter((d) => {
      if (activeCategory === "All") return true;
      if (activeCategory === "Mountains") return d.category.includes("Mountain") || d.category.includes("Hill");
      if (activeCategory === "Heritage") return d.category.includes("Heritage") || d.category.includes("Temple");
      if (activeCategory === "Wildlife") return d.category.includes("Wildlife") || d.category.includes("Park");
      if (activeCategory === "Beaches") return d.category.includes("Beach") || d.category.includes("Island");
      if (activeCategory === "Cities") return d.category.includes("Cities") || d.category.includes("Promenades");
      return true;
    });

    filtered.forEach((d) => {
      const badge = getMarkerBadgeStyle(d.category);
      const isSelected = selectedPlace?.destination_id === d.destination_id;

      const el = document.createElement("div");
      el.className = `cursor-pointer transition-transform duration-200 transform hover:scale-125 ${
        isSelected ? "scale-125 z-40" : "z-10"
      }`;
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full ${badge.bg} border-2 ${badge.border} flex items-center justify-center text-xs shadow-lg shadow-black/60">
            ${badge.icon}
          </div>
          ${
            isSelected
              ? `<span class="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full animate-ping"></span>`
              : ""
          }
          <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700/80 text-[10px] font-semibold text-slate-200 pointer-events-none shadow">
            ${d.name}
          </div>
        </div>
      `;

      el.addEventListener("click", () => {
        handleSelectPlace(d);
      });

      const marker = new Marker({ element: el })
        .setLngLat([d.longitude, d.latitude])
        .addTo(map);

      markersRef.current[d.destination_id] = marker;
    });
  }, [destinations, activeCategory, mapLoaded, selectedPlace]);

  // Handle selectedDestinationId prop
  useEffect(() => {
    if (selectedDestinationId && destinations.length > 0) {
      const target = destinations.find((d) => d.destination_id === selectedDestinationId);
      if (target) {
        handleSelectPlace(target);
      }
    }
  }, [selectedDestinationId, destinations]);

  const handleSelectPlace = (d: Destination) => {
    setSelectedPlace(d);
    recordInteraction(d.destination_id, "3d_explore");
    if (onSelectDestination) {
      onSelectDestination(d);
    }

    if (mapInstance.current) {
      mapInstance.current.flyTo({
        center: [d.longitude, d.latitude],
        zoom: 9.5,
        pitch: is3DMode ? 55 : 20,
        bearing: 15,
        speed: 1.2,
        curve: 1.4,
        essential: true
      });
    }
  };

  const togglePitchMode = () => {
    const nextMode = !is3DMode;
    setIs3DMode(nextMode);
    if (mapInstance.current) {
      mapInstance.current.easeTo({
        pitch: nextMode ? 55 : 0,
        bearing: nextMode ? 20 : 0,
        duration: 800
      });
    }
  };

  const resetView = () => {
    if (mapInstance.current) {
      mapInstance.current.flyTo({
        center: [78.9629, 22.5937],
        zoom: 4.3,
        pitch: 35,
        bearing: 0,
        speed: 1.0
      });
    }
    setSelectedPlace(null);
  };

  const flyToPreset = (preset: (typeof REGION_PRESETS)[0]) => {
    if (mapInstance.current) {
      mapInstance.current.flyTo({
        center: preset.center,
        zoom: preset.zoom,
        pitch: preset.pitch,
        bearing: preset.bearing,
        speed: 1.1
      });
    }
  };

  return (
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950`}>
      {/* Fallback View if WebGL fails */}
      {webGLError ? (
        <div className="w-full h-full p-6 flex flex-col items-center justify-center text-center bg-slate-950 text-slate-300">
          <MapPin className="w-12 h-12 text-teal-400 mb-3 animate-bounce" />
          <h3 className="text-xl font-bold text-ivory mb-2">Interactive India Geospatial Directory</h3>
          <p className="text-slate-400 text-xs max-w-md mb-6">
            Displaying full spatial catalogue of Indian heritage, Himalayan peaks, and coastal sanctuaries.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl w-full max-h-[500px] overflow-y-auto p-2">
            {destinations.map((d) => (
              <div
                key={d.destination_id}
                onClick={() => setSelectedPlace(d)}
                className="p-3 rounded-xl glass-panel border border-slate-800 hover:border-teal-400 cursor-pointer text-left"
              >
                <div className="flex items-center justify-between text-xs font-bold text-ivory">
                  <span>{d.name}</span>
                  <span className="text-teal-400">★ {d.rating}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{d.state} • {d.category}</div>
                <div className="text-[10px] text-emerald-400 font-mono mt-1">
                  {d.latitude.toFixed(4)}°N, {d.longitude.toFixed(4)}°E
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* MapLibre Canvas Container */
        <div ref={mapContainer} className="w-full h-full" />
      )}

      {/* Top Floating Control Bar: Category Filters & 3D Toggle */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl glass-panel-elevated pointer-events-auto shadow-lg">
          {[
            { id: "All", label: "All POIs", icon: Compass },
            { id: "Mountains", label: "Mountains", icon: Mountain },
            { id: "Heritage", label: "Heritage", icon: Landmark },
            { id: "Wildlife", label: "Wildlife", icon: TreePine },
            { id: "Beaches", label: "Beaches", icon: Palmtree },
            { id: "Cities", label: "Cities", icon: Building2 },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? "bg-teal-500 text-slate-950 shadow-md font-bold"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-ivory"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3D / Perspective Toggle & Reset */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={togglePitchMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold glass-panel-elevated flex items-center gap-2 border transition-all ${
              is3DMode
                ? "border-teal-500 text-teal-300 bg-teal-500/20 shadow-glow"
                : "border-slate-700 text-slate-300 hover:text-ivory"
            }`}
            title="Toggle 3D Terrain & Camera Pitch"
          >
            <Compass className={`w-4 h-4 ${is3DMode ? "rotate-45 text-teal-400" : ""}`} />
            <span>{is3DMode ? "3D Terrain Mode" : "2D Map View"}</span>
          </button>
          <button
            onClick={resetView}
            className="p-2 rounded-xl glass-panel-elevated border border-slate-700 text-slate-300 hover:text-ivory hover:border-slate-600 transition-colors"
            title="Reset to All-India View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Region Quick Jumper */}
      <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-1.5 pointer-events-auto">
        <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-1">
          <Navigation className="w-3 h-3 text-teal-400" />
          <span>Regional Jump:</span>
        </div>
        {REGION_PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => flyToPreset(p)}
            className="px-2.5 py-1 rounded-lg glass-panel hover:bg-slate-800/80 border border-slate-700/60 text-[11px] font-medium text-slate-200 hover:text-teal-300 transition-colors"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Right Slide-out Details Drawer */}
      {selectedPlace && (
        <div className="absolute top-4 right-4 bottom-4 w-80 sm:w-96 glass-panel-elevated rounded-2xl border border-teal-500/30 overflow-hidden shadow-2xl flex flex-col justify-between z-30 pointer-events-auto animate-in slide-in-from-right duration-300">
          <div className="overflow-y-auto">
            {/* Header Image */}
            <div className="relative aspect-[16/10] bg-slate-900">
              <img
                src={selectedPlace.cover_image}
                alt={selectedPlace.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
              <button
                onClick={() => setSelectedPlace(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:text-ivory transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/30 border border-teal-500/50 text-teal-300 backdrop-blur-md">
                  {selectedPlace.category}
                </span>
                <h3 className="text-lg font-extrabold text-ivory mt-1 leading-tight">{selectedPlace.name}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    {selectedPlace.state}
                  </span>
                  <span>•</span>
                  <span className="text-amber-400 font-semibold">★ {selectedPlace.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Description & Metadata */}
            <div className="p-4 space-y-3.5 text-xs">
              <p className="text-slate-300 leading-relaxed">{selectedPlace.short_description}</p>

              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Elevation</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {Math.round(selectedPlace.elevation_m)} meters
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Coordinates</span>
                  <span className="font-mono text-slate-200">
                    {selectedPlace.latitude.toFixed(2)}°N, {selectedPlace.longitude.toFixed(2)}°E
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Best Season</span>
                  <span className="text-slate-200 font-medium">{selectedPlace.best_season}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Budget Tier</span>
                  <span className="text-amber-400 font-medium">{selectedPlace.estimated_budget_tier}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons in Drawer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/70 space-y-2">
            <button
              onClick={() => navigate(`/destinations/${selectedPlace.destination_id}`)}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-teal-500/20"
            >
              <span>Explore Full Destination Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate(`/recommendations?target=${selectedPlace.destination_id}`)}
              className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Find Similar Places (ML Recommender)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

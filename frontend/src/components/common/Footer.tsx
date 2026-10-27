import React from "react";
import { Compass, Database, Cpu, MapPin, ExternalLink } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#050811] border-t border-slate-800/80 pt-12 pb-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
                <Compass className="w-5 h-5 text-teal-400" />
              </div>
              <span className="font-bold text-sm text-ivory tracking-tight">Tourism Intelligence India</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Advanced portfolio-quality Tourism Data Warehouse, Tourist Behaviour Mining, 3D Geospatial Exploration, and Hybrid Recommendation System.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-teal-300">
              <span>Final Year Computer Science Engineering Project</span>
            </div>
          </div>

          {/* Core Methodology */}
          <div>
            <h4 className="text-ivory font-semibold mb-3 flex items-center gap-1.5 text-xs">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              Data Warehouse Architecture
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>• Star-Schema Facts: <span className="text-slate-300">Visits & Interactions</span></li>
              <li>• Dimensions: <span className="text-slate-300">Tourists, Geography, Dates, Trips</span></li>
              <li>• Automated Multi-Stage ETL Pipeline</li>
              <li>• Data Quality Audit & Duplicate Scrubbing</li>
              <li>• PostGIS & Haversine Spatial Geometry</li>
            </ul>
          </div>

          {/* Machine Learning */}
          <div>
            <h4 className="text-ivory font-semibold mb-3 flex items-center gap-1.5 text-xs">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Machine Learning & Mining
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>• Unsupervised K-Means Tourist Segmentation</li>
              <li>• Silhouette Score & Elbow Curve Evaluation</li>
              <li>• Multi-Criteria Content & Cluster Recommender</li>
              <li>• Logarithmic Popularity Bias Dampening</li>
              <li>• Tool-Augmented RAG Travel Assistant</li>
            </ul>
          </div>

          {/* Attribution & Legal */}
          <div>
            <h4 className="text-ivory font-semibold mb-3 flex items-center gap-1.5 text-xs">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Verified Open Sources
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>• Coordinates: <span className="text-slate-300">OpenStreetMap contributors</span></li>
              <li>• Media: <span className="text-slate-300">Wikimedia Commons (CC-BY-SA / CC0)</span></li>
              <li>• Tourism Facts: <span className="text-slate-300">ASI & State Tourism Boards</span></li>
              <li>• Elevation: <span className="text-slate-300">SRTM Digital Elevation Model</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} Tourism Intelligence India. Research & Educational Portfolio Platform.</p>
          <p className="text-slate-400 italic">
            Synthetic tourist profiles clearly labelled to distinguish academic benchmark data from official visitor counts.
          </p>
        </div>
      </div>
    </footer>
  );
};

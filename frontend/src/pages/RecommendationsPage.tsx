import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Compass,
  Sliders,
  Star,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  Info,
  CheckCircle2,
  TrendingUp,
  Cpu
} from "lucide-react";
import type { RecommendationRequest, RecommendationResponse } from "../types";
import { getRecommendations } from "../api/client";

export const RecommendationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Questionnaire / Slider State
  const [natureAffinity, setNatureAffinity] = useState<number>(0.8);
  const [cultureAffinity, setCultureAffinity] = useState<number>(0.6);
  const [adventureAffinity, setAdventureAffinity] = useState<number>(0.7);
  const [relaxationAffinity, setRelaxationAffinity] = useState<number>(0.4);
  const [wildlifeAffinity, setWildlifeAffinity] = useState<number>(0.5);
  const [budgetTier, setBudgetTier] = useState<string>("Moderate");
  const [durationDays, setDurationDays] = useState<number>(4);
  const [targetMonth, setTargetMonth] = useState<string>("");
  const [preferredRegion, setPreferredRegion] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<RecommendationResponse | null>(null);

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleGenerateRecommendations = async () => {
    try {
      setLoading(true);
      const payload: RecommendationRequest = {
        nature_affinity: natureAffinity,
        culture_affinity: cultureAffinity,
        adventure_affinity: adventureAffinity,
        relaxation_affinity: relaxationAffinity,
        wildlife_affinity: wildlifeAffinity,
        budget_tier: budgetTier,
        duration_days: durationDays,
        target_month: targetMonth || undefined,
        preferred_region: preferredRegion || undefined,
        top_k: 6
      };
      const res = await getRecommendations(payload);
      setResponse(res);
    } catch (err) {
      console.error("Recommendation generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerateRecommendations();
  }, []);

  // Quick Archetype Presets
  const applyPreset = (preset: {
    nature: number;
    culture: number;
    adventure: number;
    relaxation: number;
    budget: string;
    duration: number;
  }) => {
    setNatureAffinity(preset.nature);
    setCultureAffinity(preset.culture);
    setAdventureAffinity(preset.adventure);
    setRelaxationAffinity(preset.relaxation);
    setBudgetTier(preset.budget);
    setDurationDays(preset.duration);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-ivory tracking-tight">
            Destination Recommendation Engine
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Hybrid multi-criteria destination recommendation blending content cosine similarity (40%), K-Means cluster tourist affinity (25%), seasonality match (15%), and log-damped popularity signals (20%).
        </p>
      </div>

      {/* Main Grid: Questionnaire (Left) + Ranked Recommendations (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Preference Questionnaire */}
        <div className="lg:col-span-4 glass-panel-elevated p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-ivory flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-400" />
              Traveler Preference Profile
            </h2>
          </div>

          {/* Quick Archetype Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-medium block">Quick Persona Presets:</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() =>
                  applyPreset({ nature: 0.95, culture: 0.2, adventure: 0.9, relaxation: 0.3, budget: "Moderate", duration: 5 })
                }
                className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-[11px] font-semibold text-slate-200 text-left"
              >
                🏔 Himalayan Trekker
              </button>
              <button
                onClick={() =>
                  applyPreset({ nature: 0.2, culture: 0.95, adventure: 0.2, relaxation: 0.4, budget: "Moderate", duration: 3 })
                }
                className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-[11px] font-semibold text-slate-200 text-left"
              >
                🏛 Heritage Traveler
              </button>
              <button
                onClick={() =>
                  applyPreset({ nature: 0.4, culture: 0.2, adventure: 0.2, relaxation: 0.95, budget: "Luxury", duration: 4 })
                }
                className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-[11px] font-semibold text-slate-200 text-left"
              >
                🏖 Coastal Relaxation
              </button>
              <button
                onClick={() =>
                  applyPreset({ nature: 0.3, culture: 0.6, adventure: 0.4, relaxation: 0.4, budget: "Budget", duration: 2 })
                }
                className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-teal-500/50 text-[11px] font-semibold text-slate-200 text-left"
              >
                🏙 Budget Explorer
              </button>
            </div>
          </div>

          {/* Sliders for Affinities */}
          <div className="space-y-4 text-xs">
            {/* Nature */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-emerald-400">Nature & Mountains</span>
                <span className="text-slate-300 font-mono">{Math.round(natureAffinity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={natureAffinity}
                onChange={(e) => setNatureAffinity(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Culture */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-amber-400">Culture & Historic Monuments</span>
                <span className="text-slate-300 font-mono">{Math.round(cultureAffinity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={cultureAffinity}
                onChange={(e) => setCultureAffinity(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Adventure */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-orange-400">Adventure & Trekking</span>
                <span className="text-slate-300 font-mono">{Math.round(adventureAffinity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={adventureAffinity}
                onChange={(e) => setAdventureAffinity(parseFloat(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            {/* Relaxation */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-cyan-400">Beaches & Peaceful Relaxation</span>
                <span className="text-slate-300 font-mono">{Math.round(relaxationAffinity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={relaxationAffinity}
                onChange={(e) => setRelaxationAffinity(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Wildlife */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-lime-400">Wildlife & Tiger Safaris</span>
                <span className="text-slate-300 font-mono">{Math.round(wildlifeAffinity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={wildlifeAffinity}
                onChange={(e) => setWildlifeAffinity(parseFloat(e.target.value))}
                className="w-full accent-lime-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Categorical Constraints */}
          <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Budget Preference</label>
              <div className="grid grid-cols-3 gap-2">
                {["Budget", "Moderate", "Luxury"].map((b) => (
                  <button
                    key={b}
                    onClick={() => setBudgetTier(b)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      budgetTier === b
                        ? "bg-teal-500 text-slate-950 border-teal-400"
                        : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">
                Trip Duration: <span className="text-teal-400 font-bold">{durationDays} Days</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">Travel Month</label>
                <select
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-ivory text-xs"
                >
                  <option value="">Current Month</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">Preferred Region</label>
                <select
                  value={preferredRegion}
                  onChange={(e) => setPreferredRegion(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-ivory text-xs"
                >
                  <option value="">All Regions</option>
                  <option value="Himalayan">Himalayan</option>
                  <option value="Northern">Northern</option>
                  <option value="Western">Western</option>
                  <option value="Southern">Southern</option>
                  <option value="North-Eastern">North-Eastern</option>
                </select>
              </div>
            </div>
          </div>

          {/* Trigger Button */}
          <button
            onClick={handleGenerateRecommendations}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin text-sm">⏳</span>
            ) : (
              <Sparkles className="w-4 h-4 text-slate-950" />
            )}
            <span>Calculate Recommendations</span>
          </button>
        </div>

        {/* Right Column: Predicted Cluster & Ranked Destinations */}
        <div className="lg:col-span-8 space-y-6">
          {response && (
            <>
              {/* Predicted Cluster Banner */}
              <div className="glass-panel p-5 rounded-2xl border border-teal-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-glass">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold">
                      K-Means Segment Assignment
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-ivory">
                    {response.cluster_label}
                  </h3>
                  <p className="text-slate-300 text-xs">
                    Your preferences align with tourist cluster #{response.predicted_tourist_cluster}. Evaluated against {response.total_candidates_evaluated} destinations for {response.target_travel_month}.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Hybrid Model Weights</span>
                    <span className="text-slate-200 font-mono text-[11px]">40% Cosine • 25% Cluster</span>
                  </div>
                </div>
              </div>

              {/* Ranked Recommendation Cards */}
              <div className="space-y-4">
                {response.recommendations.map((item, index) => (
                  <div
                    key={item.destination_id}
                    className="glass-panel rounded-2xl p-5 border border-slate-800/80 hover:border-teal-500/40 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-slate-800 text-teal-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          #{index + 1}
                        </span>
                        <div>
                          <Link
                            to={`/destinations/${item.destination_id}`}
                            className="font-bold text-base text-ivory hover:text-teal-300 transition-colors"
                          >
                            {item.name}
                          </Link>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-teal-400" />
                              {item.state} • {item.region}
                            </span>
                            <span>•</span>
                            <span className="text-teal-300 font-medium">{item.category}</span>
                          </div>
                        </div>
                      </div>

                      {/* Overall Score Badge */}
                      <div className="text-right">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold text-sm">
                          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                          <span>{item.recommendation_score.toFixed(1)}% Match</span>
                        </div>
                      </div>
                    </div>

                    {/* Image & Description Slice */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                      <div className="sm:col-span-1 aspect-[16/10] rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                        <img
                          src={item.cover_image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="sm:col-span-3 space-y-2">
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {item.short_description}
                        </p>

                        {/* Matched Interests Pills */}
                        <div className="flex flex-wrap gap-1">
                          {item.matched_interests.map((m, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300 font-medium flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Component Score Decomposition Progress Bars */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px]">
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Content Sim</span>
                          <span className="font-mono text-slate-200">{item.component_scores.content_similarity}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-teal-400 h-full rounded-full"
                            style={{ width: `${item.component_scores.content_similarity}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Cluster Affinity</span>
                          <span className="font-mono text-slate-200">{item.component_scores.cluster_affinity}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full rounded-full"
                            style={{ width: `${item.component_scores.cluster_affinity}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Seasonality</span>
                          <span className="font-mono text-slate-200">{item.component_scores.seasonality_match}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full"
                            style={{ width: `${item.component_scores.seasonality_match}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Popularity</span>
                          <span className="font-mono text-slate-200">{item.component_scores.popularity_signal}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-400 h-full rounded-full"
                            style={{ width: `${item.component_scores.popularity_signal}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Scientific Evidence Rationale */}
                    <div className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                      <span>{item.evidence_rationale}</span>
                    </div>

                    {/* Action Links */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[11px] text-slate-400 font-mono">
                        Elevation: {Math.round(item.elevation_m)}m • Budget: {item.estimated_budget_tier}
                      </span>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/explorer?focus=${item.destination_id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 font-medium flex items-center gap-1 transition-colors"
                        >
                          <Compass className="w-3 h-3 text-teal-400" />
                          <span>3D Map</span>
                        </Link>
                        <Link
                          to={`/destinations/${item.destination_id}`}
                          className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-1 transition-colors"
                        >
                          <span>Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

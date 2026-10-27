import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  BarChart3,
  Database,
  Cpu,
  Layers,
  MapPin,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Sparkles,
  PieChart as PieIcon,
  RefreshCw
} from "lucide-react";
import type {
  OverviewKPIs,
  SeasonalityDataPoint,
  ClusterAnalyticsItem,
  CategoryDistributionItem,
  StateDistributionItem
} from "../types";
import {
  fetchOverviewKPIs,
  fetchSeasonality,
  fetchClusterAnalytics,
  fetchCategoryAnalytics,
  fetchStateAnalytics
} from "../api/client";

export const AnalyticsPage: React.FC = () => {
  const [kpis, setKpis] = useState<OverviewKPIs | null>(null);
  const [seasonality, setSeasonality] = useState<SeasonalityDataPoint[]>([]);
  const [clusters, setClusters] = useState<ClusterAnalyticsItem[]>([]);
  const [categories, setCategories] = useState<CategoryDistributionItem[]>([]);
  const [states, setStates] = useState<StateDistributionItem[]>([]);
  const [modelMetrics, setModelMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const CLUSTER_COLORS = ["#0D9488", "#10B981", "#F59E0B", "#06B6D4", "#8B5CF6", "#EC4899"];

  useEffect(() => {
    async function loadAllAnalytics() {
      try {
        setLoading(true);
        const [kpiRes, seasonRes, clusterRes, catRes, stateRes, mlEval] = await Promise.all([
          fetchOverviewKPIs(),
          fetchSeasonality(),
          fetchClusterAnalytics(),
          fetchCategoryAnalytics(),
          fetchStateAnalytics(),
          fetch("/api/v1/ml/evaluation").then((r) => r.json()).catch(() => null)
        ]);

        setKpis(kpiRes);
        setSeasonality(seasonRes);
        setClusters(clusterRes);
        setCategories(catRes);
        setStates(stateRes);
        setModelMetrics(mlEval);
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAllAnalytics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Title & Methodology Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-extrabold text-ivory tracking-tight">
              Tourism Data Warehouse & Behaviour Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Analytical intelligence dashboard populated directly from SQL star-schema fact tables (`FactTourismVisit`, `FactDestinationInteraction`) and scikit-learn clustering models.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-amber-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Star-Schema Benchmark Warehouse</span>
        </div>
      </div>

      {/* KPI Cards Strip */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">FactTourismVisit Rows</span>
            <span className="text-3xl font-extrabold text-ivory">{kpis.total_tracked_visits.toLocaleString()}</span>
            <div className="text-[10px] text-teal-400 font-mono mt-1">Surrogate key indexed</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">DimTourist Profiles</span>
            <span className="text-3xl font-extrabold text-ivory">{kpis.total_tourist_profiles.toLocaleString()}</span>
            <div className="text-[10px] text-emerald-400 font-mono mt-1">{kpis.active_clusters_count} active clusters</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">Average Tourist Spend</span>
            <span className="text-3xl font-extrabold text-ivory">₹{Math.round(kpis.avg_estimated_spend_inr).toLocaleString()}</span>
            <div className="text-[10px] text-amber-400 font-mono mt-1">Avg Duration: {kpis.avg_trip_duration_days} days</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">Tourist Satisfaction</span>
            <span className="text-3xl font-extrabold text-ivory">{kpis.avg_tourist_satisfaction} / 5.0</span>
            <div className="text-[10px] text-cyan-400 font-mono mt-1">{kpis.total_interactions.toLocaleString()} interactions</div>
          </div>
        </div>
      )}

      {/* Section 1: Seasonality & Spend Dynamics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Monthly Visits Bar Chart */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ivory flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" />
                Monthly Visit Seasonality Distribution
              </h3>
              <p className="text-[11px] text-slate-400">Aggregated across DimDate calendar keys and FactTourismVisit</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seasonality} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="month_name" stroke="#64748B" fontSize={11} tickFormatter={(val) => val.slice(0, 3)} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderColor: "#334155",
                    borderRadius: "10px",
                    fontSize: "12px",
                    color: "#F8FAFC"
                  }}
                />
                <Bar dataKey="total_visits" fill="#0D9488" radius={[6, 6, 0, 0]} name="Tracked Visits" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tourist Cluster Distribution Pie */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-ivory flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-amber-400" />
              Tourist Segment Share
            </h3>
            <p className="text-[11px] text-slate-400">Unsupervised K-Means clustering distribution</p>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={clusters}
                  dataKey="member_count"
                  nameKey="cluster_label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {clusters.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CLUSTER_COLORS[index % CLUSTER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderColor: "#334155",
                    borderRadius: "10px",
                    fontSize: "11px",
                    color: "#F8FAFC"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Cluster Legend */}
          <div className="space-y-1.5 text-[11px]">
            {clusters.map((c, i) => (
              <div key={c.cluster_id} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300 truncate max-w-[200px]">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}
                  />
                  {c.cluster_label}
                </span>
                <span className="font-mono text-slate-400">{c.member_percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Machine Learning Evaluation Metrics (Elbow & Silhouette) */}
      {modelMetrics && modelMetrics.elbow_curve && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-ivory flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                K-Means Model Evaluation: Elbow Curve & Silhouette Optimization
              </h3>
              <p className="text-[11px] text-slate-400">
                Trained on high-dimensional tourist preference vectors. Chosen optimal k={modelMetrics.n_clusters} with mean silhouette score {modelMetrics.silhouette_score}.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-teal-300">
                Optimal Silhouette: {modelMetrics.silhouette_score}
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-amber-300">
                Inertia: {modelMetrics.inertia}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Elbow Curve (Inertia vs k) */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Elbow Curve: Inertia vs Cluster Count (k)</span>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={modelMetrics.elbow_curve} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="k" stroke="#64748B" fontSize={11} label={{ value: "k clusters", position: "insideBottom", offset: -2, fill: "#64748B", fontSize: 10 }} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        borderColor: "#334155",
                        borderRadius: "10px",
                        fontSize: "11px",
                        color: "#F8FAFC"
                      }}
                    />
                    <Line type="monotone" dataKey="inertia" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} name="Inertia (SSE)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Silhouette Curve */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Silhouette Score vs Cluster Count (k)</span>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={modelMetrics.elbow_curve} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="k" stroke="#64748B" fontSize={11} label={{ value: "k clusters", position: "insideBottom", offset: -2, fill: "#64748B", fontSize: 10 }} />
                    <YAxis stroke="#64748B" fontSize={11} domain={[0, 0.6]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        borderColor: "#334155",
                        borderRadius: "10px",
                        fontSize: "11px",
                        color: "#F8FAFC"
                      }}
                    />
                    <Line type="monotone" dataKey="silhouette_score" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} name="Silhouette Coefficient" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Destination Category & State Popularity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Category Visits */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-ivory flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Category Popularity & Volume
            </h3>
            <p className="text-[11px] text-slate-400">Tracked visits by destination categorization</p>
          </div>

          <div className="space-y-3 text-xs">
            {categories.slice(0, 6).map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-200 font-medium truncate max-w-[240px]">{cat.category}</span>
                  <span className="font-mono text-teal-400">{cat.total_visits} visits</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (cat.total_visits / 350) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* State Geographic Spread */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-ivory flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              Geographic Spread Across States
            </h3>
            <p className="text-[11px] text-slate-400">Total destinations and visit volume by State / Territory</p>
          </div>

          <div className="space-y-3 text-xs max-h-72 overflow-y-auto pr-2">
            {states.map((st) => (
              <div
                key={st.state}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-ivory block text-xs">{st.state}</span>
                  <span className="text-[10px] text-slate-400">{st.region} Zone • {st.destination_count} locations</span>
                </div>
                <div className="text-right">
                  <span className="text-teal-400 font-mono font-bold text-xs">{st.total_visits}</span>
                  <span className="text-[10px] text-slate-400 block">visits</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

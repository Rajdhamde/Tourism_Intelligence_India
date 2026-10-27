import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Compass, Map, Grid, Sparkles, BarChart3, Bot, Menu, X, ShieldCheck } from "lucide-react";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Discover", path: "/", icon: Compass },
    { name: "3D Explorer", path: "/explorer", icon: Map },
    { name: "Directory", path: "/directory", icon: Grid },
    { name: "Recommendations", path: "/recommendations", icon: Sparkles },
    { name: "Analytics DWH", path: "/analytics", icon: BarChart3 },
    { name: "AI Assistant", path: "/assistant", icon: Bot },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
              <Compass className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-ivory block leading-tight">
                Tourism Intelligence <span className="text-teal-400 font-extrabold">India</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase text-slate-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                DWH & Behaviour Mining
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all duration-150 ${
                    isActive
                      ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm"
                      : "text-slate-300 hover:text-ivory hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-teal-400" : "text-slate-400"}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* System Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>FastAPI Star-Schema v1.0</span>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-ivory hover:bg-slate-800"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel-elevated border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 ${
                  isActive
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                    : "text-slate-300 hover:bg-slate-800/80"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-teal-400" : "text-slate-400"}`} />
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};

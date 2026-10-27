import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/common/Navbar";
import { Footer } from "./components/common/Footer";
import { HomePage } from "./pages/HomePage";
import { ExplorerPage } from "./pages/ExplorerPage";
import { DirectoryPage } from "./pages/DirectoryPage";
import { DestinationDetailPage } from "./pages/DestinationDetailPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AssistantPage } from "./pages/AssistantPage";

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#080D1A] text-[#F8FAFC]">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explorer" element={<ExplorerPage />} />
            <Route path="/directory" element={<DirectoryPage />} />
            <Route path="/destinations/:id" element={<DestinationDetailPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;

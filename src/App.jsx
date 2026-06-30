import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import MovieDetail from "./pages/MovieDetail";
import LanguagePage from "./pages/LanguagePage";
import DomainPage from "./pages/DomainPage";
import DomainDetail from "./pages/DomainDetail";
import HistoricalCombinationPage from "./pages/HistoricalCombinationPage";
import HistoricalCombinationsPage from "./pages/HistoricalCombinationsPage";
import HistoricalPeoplePage, { HistoricalPersonPage } from "./pages/HistoricalPeoplePage";
import WebseriesDetail from "./pages/WebseriesDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

import RouteLoader from "./components/RouteLoader";
import { initGA, trackPageView } from "./utils/analytics";

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return null;
}

export default function App() {
  return (
    <>
      <AnalyticsTracker />
      <RouteLoader />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movie/:slug" element={<MovieDetail />} />
        <Route path="/language/:language" element={<LanguagePage />} />

        <Route path="/hollywood" element={<DomainPage domain="hollywood" />} />
        <Route path="/hollywood/:slug" element={<DomainDetail domain="hollywood" />} />

        <Route path="/historical" element={<DomainPage domain="historical" />} />
        <Route path="/historical/people" element={<HistoricalPeoplePage />} />
        <Route path="/historical/person/:slug" element={<HistoricalPersonPage />} />
        <Route path="/historical/combinations" element={<HistoricalCombinationsPage />} />
        <Route path="/historical/combination/:slug" element={<HistoricalCombinationPage />} />
        <Route path="/historical/:slug" element={<DomainDetail domain="historical" />} />

        <Route path="/webseries/:slug" element={<WebseriesDetail />} />

        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

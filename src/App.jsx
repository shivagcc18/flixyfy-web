import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import MovieDetail from "./pages/MovieDetail";
import LanguagePage from "./pages/LanguagePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/movie/:slug" element={<MovieDetail />} />
      <Route path="/language/:language" element={<LanguagePage />} />
    </Routes>
  );
}
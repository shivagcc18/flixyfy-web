import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import MovieDetail from "./pages/MovieDetail";
import LanguagePage from "./pages/LanguagePage";
import About from "./pages/About";
import Contact from "./pages/Contact";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/movie/:slug" element={<MovieDetail />} />
      <Route path="/language/:language" element={<LanguagePage />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  );
}
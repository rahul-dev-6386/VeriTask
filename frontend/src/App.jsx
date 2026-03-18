import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing theme={theme} setTheme={setTheme} />} />
        <Route path="/dashboard" element={<Dashboard theme={theme} setTheme={setTheme} />} />
      </Routes>
    </Router>
  );
}

export default App;

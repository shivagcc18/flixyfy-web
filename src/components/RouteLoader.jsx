import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function RouteLoader() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "3px",
        width: "100%",
        background:
          "linear-gradient(90deg,#ec4899,#ff6bd5,#ec4899)",
        zIndex: 99999,
        animation: "loaderMove 0.3s linear",
      }}
    />
  );
}
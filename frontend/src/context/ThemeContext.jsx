import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      // Check for explicitly saved user preference
      const savedTheme = localStorage.getItem("theme") || localStorage.getItem("mn_theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        return savedTheme;
      }
    } catch {
      // Ignore storage access errors in restricted iframe/browser environments
    }

    // Default theme MUST explicitly be "light" (never use prefers-color-scheme / system)
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      document.body?.classList.add("dark");
    } else {
      root.classList.remove("dark");
      document.body?.classList.remove("dark");
    }

    try {
      localStorage.setItem("theme", theme);
      localStorage.setItem("mn_theme", theme);
    } catch {
      // Ignore storage write errors
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

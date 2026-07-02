// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material';
import { lightTheme, darkTheme } from '../theme';

const ThemeContext = createContext({ toggleTheme: () => { }, darkMode: false });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
  };
  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);
  return (
    <ThemeContext.Provider value={{ toggleTheme, darkMode }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
export const useThemeContext = () => useContext(ThemeContext);
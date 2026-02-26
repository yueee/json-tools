import React, { createContext, useContext } from 'react';

interface ThemeContextType {
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({ isDark: true });

export const ThemeProvider: React.FC<{ children: React.ReactNode; isDark: boolean }> = ({
  children,
  isDark,
}) => {
  return <ThemeContext.Provider value={{ isDark }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

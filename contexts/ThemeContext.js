import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Tema: 'brand' = Sage Light, 'midnight' = eski klasik koyu tema
  const [theme, setTheme] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const savedTheme = user?.preferences?.theme;
        if (savedTheme === 'midnight' || savedTheme === 'brand') {
          return savedTheme;
        }
      }
    } catch {
      // ignore
    }
    return 'brand';
  });

  // HTML attribute'larını güncelle: sadece iki tema
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.remove('light');
    document.documentElement.removeAttribute('data-contrast');

    if (theme === 'midnight') {
      document.documentElement.setAttribute('data-theme', 'midnight');
      localStorage.setItem('app-theme', 'midnight');
    } else {
      document.documentElement.setAttribute('data-theme', 'brand');
      localStorage.setItem('app-theme', 'brand');
    }
  }, [theme]);

  const setThemeMode = (newTheme) => {
    const finalTheme = newTheme === 'midnight' ? 'midnight' : 'brand';
    setTheme(finalTheme);

    // Kullanıcı tercihlerini güncelle
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const updatedUser = {
          ...user,
          preferences: {
            ...user.preferences,
            theme: finalTheme,
          }
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};


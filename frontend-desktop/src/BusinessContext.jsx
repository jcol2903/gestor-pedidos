import React, { createContext, useState, useContext } from 'react';

const BusinessContext = createContext();

export const BUSINESSES = [
  { id: 1, name: 'Kirala Tortas', themeColor: '#e83e8c', icon: '🎂' },
  { id: 2, name: 'Amigurumis', themeColor: '#20c997', icon: '🧶' }
];

export const BusinessProvider = ({ children }) => {
  const [activeBusiness, setActiveBusiness] = useState(BUSINESSES[0]);

  const switchBusiness = (id) => {
    const selected = BUSINESSES.find((b) => b.id === id);
    if (selected) setActiveBusiness(selected);
  };

  return (
    <BusinessContext.Provider value={{ activeBusiness, switchBusiness, BUSINESSES }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
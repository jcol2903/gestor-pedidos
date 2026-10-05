import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_BASE_URL } from './config';

const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar negocios desde el backend
  const fetchBusinesses = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/businesses`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBusinesses(data);

          // Preservar el negocio activo seleccionado o asignar el primero por defecto
          setActiveBusiness((prevActive) => {
            if (!prevActive) return data[0];
            const found = data.find((b) => b.id === prevActive.id);
            return found || data[0];
          });
        } else {
          setBusinesses([]);
          setActiveBusiness(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error al cargar la lista de negocios en BusinessContext:', err);
        setBusinesses([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  // Cambiar de negocio activo por su ID
  const switchBusiness = (id) => {
    const selected = businesses.find((b) => b.id === Number(id));
    if (selected) {
      setActiveBusiness(selected);
    }
  };

  return (
    <BusinessContext.Provider
      value={{
        activeBusiness,
        setActiveBusiness,
        businesses,
        switchBusiness,
        fetchBusinesses,
        loading,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
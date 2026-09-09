import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useBusiness } from '../BusinessContext';

const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export const OrdersCalendar = ({ SERVER_URL, isDarkMode }) => {
  const { activeBusiness } = useBusiness();
  const [events, setEvents] = useState([]);
  
  // Estados para controlar la fecha y la vista activa del calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(Views.MONTH);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/orders/${activeBusiness.id}`)
      .then((res) => res.json())
      .then((data) => {
        const formattedEvents = data
          .filter((o) => o.delivery_date)
          .map((o) => {
            const start = new Date(o.delivery_date);
            const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hora de duración
            return {
              id: o.id,
              title: `#${o.consecutive || o.id} - ${o.customer_name} ($${Number(o.total).toLocaleString()})`,
              start,
              end,
              status: o.status,
            };
          });
        setEvents(formattedEvents);
      })
      .catch((err) => console.error('Error al cargar pedidos en calendario:', err));
  }, [activeBusiness, SERVER_URL]);

  const eventStyleGetter = () => ({
    style: {
      backgroundColor: activeBusiness.themeColor || '#007bff',
      borderRadius: '5px',
      color: 'white',
      border: 'none',
      fontSize: '0.85rem',
      padding: '2px 5px',
    },
  });

  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      color: isDarkMode ? '#f1f1f1' : '#333',
      borderRadius: '8px',
      boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 6px rgba(0,0,0,0.08)',
      transition: 'all 0.3s ease'
    }}>
      <h3 style={{ marginBottom: '1rem' }}>Agenda de Entregas - {activeBusiness.name}</h3>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        culture="es"
        
        // Control de navegación y cambio de vistas
        date={currentDate}
        onNavigate={(newDate) => setCurrentDate(newDate)}
        view={currentView}
        onView={(newView) => setCurrentView(newView)}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        
        messages={{
          next: 'Siguiente ▶',
          previous: '◀ Anterior',
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día',
          agenda: 'Agenda',
          noEventsInRange: 'No hay entregas programadas en este rango.',
        }}
        eventPropGetter={eventStyleGetter}
      />
    </div>
  );
};
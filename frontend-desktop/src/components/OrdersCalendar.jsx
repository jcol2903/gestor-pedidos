import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useBusiness } from '../BusinessContext';
import { useTheme } from '../ThemeContext'; // Importamos el Hook global

const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export const OrdersCalendar = ({ SERVER_URL }) => {
  const { activeBusiness } = useBusiness();
  const { isDarkMode } = useTheme(); // Consumo directo del estado global
  const [events, setEvents] = useState([]);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(Views.MONTH);

  useEffect(() => {
    if (!activeBusiness?.id) return;

    fetch(`${SERVER_URL}/api/orders/${activeBusiness.id}`)
      .then((res) => res.json())
      .then((data) => {
        const formattedEvents = data
          .filter((o) => o.delivery_date)
          .map((o) => {
            const start = new Date(o.delivery_date);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
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
      backgroundColor: activeBusiness?.themeColor || '#007bff',
      borderRadius: '5px',
      color: '#ffffff',
      border: 'none',
      fontSize: '0.85rem',
      padding: '2px 5px',
    },
  });

  return (
    <div
      style={{
        padding: '1.5rem',
        backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
        color: isDarkMode ? '#f1f1f1' : '#333333',
        borderRadius: '8px',
        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 6px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Estilos dinámicos para sobreescribir la cuadrícula interna de react-big-calendar en modo oscuro */}
      {isDarkMode && (
        <style>{`
          .rbc-calendar { color: #e0e0e0 !important; }
          .rbc-header, .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border-color: #333333 !important; }
          .rbc-day-bg + .rbc-day-bg, .rbc-month-row + .rbc-month-row { border-color: #333333 !important; }
          .rbc-off-range-bg { background-color: #141414 !important; }
          .rbc-today { background-color: #2a2a2a !important; }
          .rbc-toolbar button { color: #e0e0e0 !important; border-color: #444444 !important; }
          .rbc-toolbar button:hover { background-color: #333333 !important; }
          .rbc-toolbar button.rbc-active { background-color: #0d6efd !important; color: #fff !important; }
        `}</style>
      )}

      <h3 style={{ marginBottom: '1rem' }}>
        Agenda de Entregas - {activeBusiness?.name || 'Cargando...'}
      </h3>
      
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        culture="es"
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
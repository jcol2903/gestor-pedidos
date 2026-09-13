// ColoresEstados.jsx
export const badge = (status) => {
  const normalizedStatus = status?.toLowerCase();

  const styles = {
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    border: '1px solid transparent'
  };

  switch (normalizedStatus) {
    case 'pendiente':
      // Gris
      return {
        ...styles,
        backgroundColor: '#e2e8f0',
        color: '#334155',
        borderColor: '#cbd5e1'
      };

    case 'en proceso':
      // Amarillo
      return {
        ...styles,
        backgroundColor: '#f5de83',
        color: '#92400e',
        borderColor: '#fde68a'
      };

    case 'listo para entregar':
      // Azul
      return {
        ...styles,
        backgroundColor: '#b7e2fe',
        color: '#075985',
        borderColor: '#bae6fd'
      };

    case 'entregado':
      // Verde
      return {
        ...styles,
        backgroundColor: '#b4fdd7',
        color: '#065f46',
        borderColor: '#a7f3d0'
      };

    case 'cancelado':
      // Rojo
      return {
        ...styles,
        backgroundColor: '#f9bfc3',
        color: '#9f1239',
        borderColor: '#fecdd3'
      };

    default:
      return {
        ...styles,
        backgroundColor: '#f1f5f9',
        color: '#64748b',
        borderColor: '#e2e8f0'
      };
  }
};
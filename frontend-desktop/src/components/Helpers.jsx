// Helper para limpiar el número o usuario de contacto
export const getWhatsAppUrl = (phoneInput, message) => {
  if (!phoneInput) return `https://wa.me/?text=${encodeURIComponent(message)}`;

  // Si ingresan un usuario tipo @usuario, quitamos el @
  let cleanInput = phoneInput.trim();
  if (cleanInput.startsWith('@')) {
    cleanInput = cleanInput.substring(1);
  }

  // Extraer solo dígitos numéricos
  const digits = cleanInput.replace(/\D/g, '');

  // Si tiene formato de número telefónico (mínimo 7-10 dígitos)
  if (digits.length >= 7) {
    // Si es un celular colombiano de 10 dígitos (empieza por 3), le anteponemos el código de país 57
    const formattedNumber = (digits.length === 10 && digits.startsWith('3')) ? `57${digits}` : digits;
    return `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
  }

  // Si ingresaron un nombre de usuario directo sin número
  return `https://wa.me/${cleanInput}?text=${encodeURIComponent(message)}`;
};

// 1. Mensaje al crear / confirmar el pedido
export const sendCreationMessage = (order, activeBusiness) => {
  const balance = Number(order.total || 0) - Number(order.deposit || 0);
  
  // AQUÍ IRA TU MENSAJE EXACTO DE CONFIRMACIÓN DE CREACIÓN
  const message = `¡Holi! 🌸😊
    Te confirmo tu pedido en *${activeBusiness?.name || 'nuestro negocio'}*.

    📌 *Detalles del Pedido:*
    • Total: $${Number(order.total).toLocaleString()}
    • Abono: $${Number(order.deposit || 0).toLocaleString()}
    • Saldo Pendiente: $${balance.toLocaleString()}
    • Fecha de Entrega: ${order.delivery_date ? new Date(order.delivery_date).toLocaleString() : 'Por definir'}

    ¡Gracias por tu compra! ✨`;

    window.open(getWhatsAppUrl(order.phone, message), '_blank');
};

// 2. Mensaje el día de la entrega (Pedido Listo)
export const sendReadyMessage = (order) => {
    const balance = Number(order.total || 0) - Number(order.deposit || 0);

    // AQUÍ IRÁ TU MENSAJE EXACTO DE PEDIDO LISTO PARA ENTREGAR
    const message = `¡Holi! 🌸😊🎉 
    Te informamos que tu pedido ya está *LISTO PARA ENTREGAR*. 🎂🎁

    📌 *Resumen:*
    • Modalidad: ${order.delivery_type} ${order.address ? `(${order.address})` : ''}
    • Saldo a cancelar: $${balance.toLocaleString()}

    Quedamos atentos a tu recepción. ¡Muchas gracias! ❤️`;

    window.open(getWhatsAppUrl(order.phone, message), '_blank');
};
export function formatPrice(amount: number): string {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDateTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateForBillId(date: Date = new Date()): string {
  const yyyy = date.getFullYear().toString();
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

export function getCategoryColor(categoryId: number): string {
  const colors = [
    '#FFF3E0', // Burgers
    '#FBE9E7', // Pizza
    '#E8F5E9', // Wraps
    '#FFFDE7', // Sides & Momos
    '#EDE7F6', // Sandwiches
    '#FFF8E1', // Fries
    '#E0F7FA', // Drinks & Combos
  ];
  return colors[(categoryId - 1) % colors.length] || '#F5F5F5';
}

export const generateSessionId = (): string => `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 15)}`;

// Store session token from QR scan (critical for security)
export const getSessionToken = (tableId: string): string | null => {
    return sessionStorage.getItem(`session_${tableId}`);
};

export const setSessionToken = (tableId: string, token: string): void => {
    sessionStorage.setItem(`session_${tableId}`, token);
};

export const clearSessionToken = (tableId: string): void => {
    sessionStorage.removeItem(`session_${tableId}`);
};

// Legacy session ID for backwards compatibility
export const getSessionId = (tableId: string): string => {
    const key = `sessionId_${tableId}`;
    let id = sessionStorage.getItem(key);
    if (!id) { id = generateSessionId(); sessionStorage.setItem(key, id); }
    return id;
};

export const formatPrice = (amount: number): string => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

export const formatDate = (date: string | Date): string => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date));

export const timeAgo = (date: string | Date): string => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

export const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = { CREATED: 'badge-warning', PENDING_CASH: 'badge-warning', PAID: 'badge-primary', PREPARING: 'badge-warning', READY: 'badge-success', SERVED: 'badge-success', CANCELLED: 'badge-error' };
    return colors[status] || 'badge-primary';
};

export const getStatusText = (status: string): string => {
    const texts: Record<string, string> = { CREATED: 'Pending Payment', PENDING_CASH: 'Pay at Counter', PAID: 'Order Received', PREPARING: 'Preparing', READY: 'Ready', SERVED: 'Served', CANCELLED: 'Cancelled' };
    return texts[status] || status;
};

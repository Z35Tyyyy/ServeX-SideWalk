import QRCode from 'qrcode';

export const generateQRCodeDataURL = async (data: string): Promise<string> => {
    return QRCode.toDataURL(data, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
};

export const generateTableQRUrl = (tableId: string): string => {
    const baseUrl = process.env.BASE_URL || 'https://serve-x-rose.vercel.app';
    return `${baseUrl}/t/${tableId}`;
};

export const generateTableQRCode = async (tableId: string): Promise<{ url: string; data: string }> => {
    const qrData = generateTableQRUrl(tableId);
    const qrCodeUrl = await generateQRCodeDataURL(qrData);
    return { url: qrCodeUrl, data: qrData };
};

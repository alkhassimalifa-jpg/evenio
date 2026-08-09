import QRCode from 'qrcode';

export const generateQRCodeImage = async (data: string): Promise<string> => {
  return QRCode.toDataURL(data);
};
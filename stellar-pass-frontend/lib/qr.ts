import QRCode from "qrcode";

export interface TicketQRData {
  ticketId: string;
  eventId: string;
  tierId: string;
  walletAddress: string;
  signature?: string;
  timestamp: number;
}

export async function generateTicketQR(data: TicketQRData): Promise<string> {
  const payload = JSON.stringify(data);
  try {
    const qrDataUrl = await QRCode.toDataURL(payload, {
      width: 300,
      margin: 2,
      color: {
        dark: "#1e3a8a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    });
    return qrDataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function generateTicketQRSvg(data: TicketQRData): Promise<string> {
  const payload = JSON.stringify(data);
  try {
    return await QRCode.toString(payload, {
      type: "svg",
      width: 300,
      margin: 2,
      color: {
        dark: "#1e3a8a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    });
  } catch (error) {
    throw new Error(`Failed to generate QR SVG: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export function parseTicketQR(qrData: string): TicketQRData | null {
  try {
    const parsed = JSON.parse(qrData);
    if (
      typeof parsed.ticketId === "string" &&
      typeof parsed.eventId === "string" &&
      typeof parsed.tierId === "string" &&
      typeof parsed.walletAddress === "string" &&
      typeof parsed.timestamp === "number"
    ) {
      return parsed as TicketQRData;
    }
    return null;
  } catch {
    return null;
  }
}

export function isValidTicketQR(data: TicketQRData): boolean {
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  const age = Date.now() - data.timestamp;
  return age < maxAge && !!data.ticketId && !!data.eventId && !!data.walletAddress;
}

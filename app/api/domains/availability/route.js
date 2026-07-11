import { NextResponse } from "next/server";

const WHOIS_API_KEY = process.env.WHOIS_API_KEY;
const WHOIS_URL = "https://www.whoisxmlapi.com/whoisserver/WhoisService";

export async function POST(request) {
  const { domain } = await request.json();

  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "Geçersiz domain" }, { status: 400 });
  }

  // Sadece TLD bazında kontrol: alan.com, alan.net gibi
  const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//i, "").replace(/\/$/, "");

  if (!WHOIS_API_KEY) {
    return NextResponse.json({ error: "WHOIS API anahtarı eksik" }, { status: 500 });
  }

  let whoisData;
  try {
    const res = await fetch(
      `${WHOIS_URL}?apiKey=${WHOIS_API_KEY}&domainName=${encodeURIComponent(cleaned)}&outputFormat=JSON`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) {
      return NextResponse.json({ error: `WHOIS API hatası: ${res.status}` }, { status: 502 });
    }
    whoisData = await res.json();
  } catch (err) {
    return NextResponse.json({ error: "WHOIS bağlantı hatası: " + err.message }, { status: 502 });
  }

  const record = whoisData?.WhoisRecord;

  // Uygunluk tespiti:
  // - domainAvailability === "AVAILABLE" → boş
  // - dataError === "MISSING_WHOIS_DATA" → büyük olasılıkla boş
  // - registrarName yoksa → büyük olasılıkla boş
  const domainAvailability = record?.registryData?.domainAvailability;
  const dataError = record?.dataError;
  const registrarName = record?.registrarName;

  let available;
  if (domainAvailability === "AVAILABLE") {
    available = true;
  } else if (domainAvailability === "UNAVAILABLE") {
    available = false;
  } else if (dataError === "MISSING_WHOIS_DATA") {
    available = true;
  } else if (registrarName) {
    available = false;
  } else {
    // Belirsiz — kayıtlı olmadığı varsayımıyla true
    available = true;
  }

  return NextResponse.json({
    domain: cleaned,
    available,
    registrar: registrarName || null,
    expiresDate: record?.registryData?.expiresDate || null,
  });
}

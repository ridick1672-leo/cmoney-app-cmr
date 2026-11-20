import React, { useId, useState } from 'react';

/**
 * ============================================================================
 * C-MONEY V7 — SISTEM IKON & ILUSTRASI VEKTOR TERPADU (4-TIER SVG)
 * ============================================================================
 * Bahasa desain seragam untuk seluruh tampilan Warga, Bottom Nav/Sidebar,
 * Ruang Pengurus, Modal QRIS, dan Bottom Sheet Instalasi PWA.
 *
 * Seluruh gradient SVG menggunakan React useId() agar 100% aman di Safari iOS,
 * Android Chrome, dan Desktop meskipun dirender berulang di layout responsif.
 */

/* ============================================================================
 * 0. KOMPONEN LOGO RESMI C-MONEY (DENGAN FALLBACK VEKTOR OTOMATIS)
 * ============================================================================ */

export function CMoneyLogo({
  src = '/assets/logo-cmoney.png',
  size = 40,
  className = '',
  alt = 'Logo C-Money CMR'
}) {
  const [imgError, setImgError] = useState(false);
  const uid = useId();

  if (imgError || !src) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        className={`shrink-0 ${className}`}
        aria-label={alt}
      >
        <defs>
          <linearGradient id={`${uid}-logo-bg`} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981" />
            <stop offset="1" stopColor="#0F766E" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="14" fill={`url(#${uid}-logo-bg)`} />
        <path
          d="M12 24.5L24 14L36 24.5"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16.5 23V33.5C16.5 34.33 17.17 35 18 35H30C30.83 35 31.5 34.33 31.5 33.5V23"
          stroke="#FFFFFF"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="28" r="3.2" fill="#A7F3D0" />
      </svg>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
      className={`object-contain rounded-2xl shrink-0 select-none ${className}`}
    />
  );
}

/* ============================================================================
 * 1. TIER 1: SOFT-3D LAYERED SVG (48x48) — MENU UNGGULAN & BAR KAPSUL BERANDA
 * ============================================================================ */

/** Parkir Fasum (Sky Cyan & Emerald Accent) */
export function Icon3DParking({ size = 40, className = '' }) {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E0F2FE" />
          <stop offset="1" stopColor="#BAE6FD" />
        </linearGradient>
        <linearGradient id={`${uid}-car`} x1="10" y1="18" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id={`${uid}-badge`} x1="27" y1="7" x2="41" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0EA5E9" />
          <stop offset="1" stopColor="#0369A1" />
        </linearGradient>
      </defs>
      <rect x="4" y="6" width="40" height="38" rx="14" fill={`url(#${uid}-bg)`} />
      {/* Bayangan lembut mobil */}
      <ellipse cx="22" cy="36.5" rx="13" ry="2.5" fill="#0369A1" fillOpacity="0.16" />
      {/* Bodi mobil Soft-3D */}
      <path
        d="M12 24.5L14.8 18.6C15.5 17.1 17 16.2 18.6 16.2H26.4C28 16.2 29.5 17.1 30.2 18.6L33 24.5H12Z"
        fill="#7DD3FC"
      />
      <rect x="9" y="23.5" width="27" height="10.5" rx="4.5" fill={`url(#${uid}-car)`} />
      {/* Kaca depan */}
      <path d="M15.4 23.2L17.1 19.2C17.4 18.6 18 18.2 18.7 18.2H26.3C27 18.2 27.6 18.6 27.9 19.2L29.6 23.2H15.4Z" fill="#F0F9FF" />
      {/* Lampu depan */}
      <rect x="11.5" y="27" width="4.5" height="2.6" rx="1.3" fill="#FEF08A" />
      <rect x="29" y="27" width="4.5" height="2.6" rx="1.3" fill="#FEF08A" />
      {/* Roda */}
      <rect x="12" y="32.5" width="5" height="4" rx="2" fill="#0F172A" />
      <rect x="28" y="32.5" width="5" height="4" rx="2" fill="#0F172A" />
      {/* Badge P Mengambang */}
      <circle cx="35" cy="13.5" r="8.5" fill={`url(#${uid}-badge)`} stroke="#FFFFFF" strokeWidth="2.2" />
      <path
        d="M32.8 17.2V9.8H35.6C37 9.8 37.9 10.6 37.9 11.9C37.9 13.2 37 14 35.6 14H32.8"
        stroke="#FFFFFF"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Paket di Pos Security (Warm Amber Soft-3D Box) */
export function Icon3DPackage({ size = 40, className = '' }) {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEF3C7" />
          <stop offset="1" stopColor="#FDE68A" />
        </linearGradient>
        <linearGradient id={`${uid}-box`} x1="11" y1="15" x2="37" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBF24" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id={`${uid}-top`} x1="10" y1="11" x2="38" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FCD34D" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <rect x="4" y="6" width="40" height="38" rx="14" fill={`url(#${uid}-bg)`} />
      <ellipse cx="24" cy="38.2" rx="12" ry="2.2" fill="#92400E" fillOpacity="0.16" />
      {/* Kardus utama */}
      <rect x="11" y="18" width="26" height="19" rx="4.5" fill={`url(#${uid}-box)`} />
      {/* Tutup atas kardus */}
      <path d="M10.5 18.8C10.5 16.5 12.1 14.5 14.4 13.9L22.5 11.7C23.5 11.4 24.5 11.4 25.5 11.7L33.6 13.9C35.9 14.5 37.5 16.5 37.5 18.8V20.5H10.5V18.8Z" fill={`url(#${uid}-top)`} />
      {/* Lakban / Pita tengah */}
      <rect x="21" y="12" width="6" height="13" rx="1.5" fill="#FFFBEB" fillOpacity="0.92" />
      {/* Label resi */}
      <rect x="14.5" y="28.5" width="9" height="5" rx="1.6" fill="#FFFBEB" fillOpacity="0.88" />
      <rect x="16" y="30.2" width="6" height="1.4" rx="0.7" fill="#D97706" />
      {/* Kilau sudut */}
      <circle cx="33" cy="24.5" r="2" fill="#FEF3C7" fillOpacity="0.5" />
    </svg>
  );
}

/** Absen Shift Security (Emerald-Teal Shield + Clock) */
export function Icon3DSecurity({ size = 40, className = '' }) {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D1FAE5" />
          <stop offset="1" stopColor="#A7F3D0" />
        </linearGradient>
        <linearGradient id={`${uid}-shield`} x1="12" y1="9" x2="35" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
      </defs>
      <rect x="4" y="6" width="40" height="38" rx="14" fill={`url(#${uid}-bg)`} />
      {/* Tameng pos */}
      <path
        d="M24 10L35.5 14.4V23.2C35.5 30.2 30.6 35.8 24 38.2C17.4 35.8 12.5 30.2 12.5 23.2V14.4L24 10Z"
        fill={`url(#${uid}-shield)`}
      />
      {/* Kilau separuh tameng */}
      <path
        d="M24 12.2L33.5 15.8V23.2C33.5 29 29.5 33.7 24 35.9V12.2Z"
        fill="#FFFFFF"
        fillOpacity="0.14"
      />
      {/* Simbol jam hadir di dalam tameng */}
      <circle cx="24" cy="23.5" r="6.2" fill="#ECFDF5" />
      <path
        d="M24 20.2V23.7L26.5 25.2"
        stroke="#0F766E"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Lapor Pos / Patroli (Teal Clipboard) */
export function Icon3DReport({ size = 34, className = '' }) {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id={`${uid}-board`} x1="11" y1="10" x2="37" y2="41" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14B8A6" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="28" height="32" rx="7" fill={`url(#${uid}-board)`} />
      <rect x="18" y="6.5" width="12" height="6.5" rx="3.2" fill="#99F6E4" stroke="#0F766E" strokeWidth="1.5" />
      <rect x="15.5" y="18.5" width="17" height="3.2" rx="1.6" fill="#FFFFFF" />
      <rect x="15.5" y="25" width="13" height="3.2" rx="1.6" fill="#CCFBF1" />
      <rect x="15.5" y="31.5" width="9.5" height="3.2" rx="1.6" fill="#CCFBF1" />
      <circle cx="34.5" cy="34.5" r="6.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M31.8 34.5L33.6 36.3L37.4 32.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Jadwal Shift (Sky Blue Calendar) */
export function Icon3DSchedule({ size = 34, className = '' }) {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id={`${uid}-cal`} x1="8" y1="12" x2="40" y2="41" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
      </defs>
      <rect x="8" y="11" width="32" height="30" rx="8" fill="#E0F2FE" />
      <path d="M8 19C8 14.58 11.58 11 16 11H32C36.42 11 40 14.58 40 19V21.5H8V19Z" fill={`url(#${uid}-cal)`} />
      <rect x="15.5" y="7" width="4" height="8" rx="2" fill="#0369A1" />
      <rect x="28.5" y="7" width="4" height="8" rx="2" fill="#0369A1" />
      <rect x="13.5" y="25.5" width="5.5" height="5" rx="1.6" fill="#0284C7" />
      <rect x="21.2" y="25.5" width="5.5" height="5" rx="1.6" fill="#7DD3FC" />
      <rect x="29" y="25.5" width="5.5" height="5" rx="1.6" fill="#7DD3FC" />
      <rect x="13.5" y="32.8" width="5.5" height="4.5" rx="1.6" fill="#7DD3FC" />
      <rect x="21.2" y="32.8" width="5.5" height="4.5" rx="1.6" fill="#10B981" />
    </svg>
  );
}

/** Slip Gaji Security (Emerald & Gold Wallet) */
export function Icon3DPayroll({ size = 34, className = '' }) {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id={`${uid}-w`} x1="8" y1="14" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>
      <rect x="11" y="9" width="24" height="12" rx="4" fill="#FBBF24" />
      <rect x="8" y="14" width="32" height="25" rx="7.5" fill={`url(#${uid}-w)`} />
      <rect x="28" y="22.5" width="13" height="8.5" rx="4.2" fill="#A7F3D0" stroke="#047857" strokeWidth="1.5" />
      <circle cx="32.8" cy="26.7" r="2" fill="#047857" />
      <rect x="13" y="20" width="10" height="2.6" rx="1.3" fill="#FFFFFF" fillOpacity="0.45" />
    </svg>
  );
}

/** Cek IPL / Status Warga (Emerald Home Check) */
export function Icon3DIplCheck({ size = 34, className = '' }) {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id={`${uid}-home`} x1="10" y1="10" x2="38" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34D399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
      <path
        d="M9.5 22.8L22.6 11.4C23.4 10.7 24.6 10.7 25.4 11.4L38.5 22.8C39.6 23.8 38.9 25.6 37.4 25.6H35.5V36.5C35.5 38.4 33.9 40 32 40H16C14.1 40 12.5 38.4 12.5 36.5V25.6H10.6C9.1 25.6 8.4 23.8 9.5 22.8Z"
        fill={`url(#${uid}-home)`}
      />
      <rect x="20" y="28" width="8" height="12" rx="2.5" fill="#ECFDF5" />
      <circle cx="35.5" cy="34.5" r="7" fill="#0EA5E9" stroke="#FFFFFF" strokeWidth="2.2" />
      <path d="M32.6 34.5L34.6 36.5L38.4 32.5" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Menu Lainnya (4-Dot Grid ala Gojek — dengan state expanded) */
export function Icon3DMore({ size = 34, expanded = false, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect
        x="6"
        y="6"
        width="36"
        height="36"
        rx="12"
        fill={expanded ? '#CCFBF1' : '#F1F5F9'}
      />
      <rect x="13.5" y="13.5" width="8.5" height="8.5" rx="2.8" fill={expanded ? '#0F766E' : '#334155'} />
      <rect x="26" y="13.5" width="8.5" height="8.5" rx="2.8" fill={expanded ? '#059669' : '#334155'} />
      <rect x="13.5" y="26" width="8.5" height="8.5" rx="2.8" fill={expanded ? '#059669' : '#334155'} />
      <rect x="26" y="26" width="8.5" height="8.5" rx="2.8" fill={expanded ? '#0284C7' : '#64748B'} />
    </svg>
  );
}

/** Arsip Tutup Buku (Untuk Drawer "Lainnya") */
export function Icon3DArchive({ size = 32, className = '' }) {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id={`${uid}-arc`} x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#64748B" />
          <stop offset="1" stopColor="#334155" />
        </linearGradient>
      </defs>
      <rect x="8" y="10" width="32" height="9" rx="3.5" fill="#94A3B8" />
      <rect x="10.5" y="19" width="27" height="20" rx="5" fill={`url(#${uid}-arc)`} />
      <rect x="19" y="24.5" width="10" height="3.2" rx="1.6" fill="#F8FAFC" />
    </svg>
  );
}

/** Tata Tertib Cluster (Untuk Drawer "Lainnya") */
export function Icon3DRules({ size = 32, className = '' }) {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id={`${uid}-doc`} x1="10" y1="8" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#4338CA" />
        </linearGradient>
      </defs>
      <rect x="11" y="8" width="26" height="32" rx="6.5" fill={`url(#${uid}-doc)`} />
      <rect x="16.5" y="16" width="15" height="3" rx="1.5" fill="#FFFFFF" />
      <rect x="16.5" y="22.5" width="15" height="3" rx="1.5" fill="#C7D2FE" />
      <rect x="16.5" y="29" width="10" height="3" rx="1.5" fill="#C7D2FE" />
    </svg>
  );
}

/** Pasang Aplikasi PWA (Untuk Drawer "Lainnya" & Ruang Pengurus) */
export function Icon3DInstallApp({ size = 32, className = '' }) {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id={`${uid}-app`} x1="12" y1="7" x2="36" y2="41" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06B6D4" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
      </defs>
      <rect x="13" y="7" width="22" height="34" rx="5.5" fill={`url(#${uid}-app)`} />
      <rect x="16" y="11" width="16" height="23" rx="2.5" fill="#F0F9FF" />
      <path d="M24 16.5V26.5M24 26.5L20 22.5M24 26.5L28 22.5" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="37.5" r="1.4" fill="#BAE6FD" />
    </svg>
  );
}

/** Slot Siap-Pakai SOS Darurat (Terkunci di balik saklar kode) */
export function Icon3DSos({ size = 32, className = '' }) {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id={`${uid}-sos`} x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FB7185" />
          <stop offset="1" stopColor="#E11D48" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="17" fill={`url(#${uid}-sos)`} />
      <circle cx="24" cy="24" r="12" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="2" />
      <text x="24" y="28.5" textAnchor="middle" fill="#FFFFFF" fontSize="11.5" fontWeight="900" fontFamily="system-ui, sans-serif">
        SOS
      </text>
    </svg>
  );
}

/** Slot Siap-Pakai CCTV Gerbang (Terkunci di balik saklar kode) */
export function Icon3DCctv({ size = 32, className = '' }) {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id={`${uid}-cam`} x1="9" y1="13" x2="39" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#475569" />
          <stop offset="1" stopColor="#1E293B" />
        </linearGradient>
      </defs>
      <rect x="8" y="15" width="24" height="15" rx="4.5" fill={`url(#${uid}-cam)`} />
      <path d="M32 19L40 15.5V29.5L32 26V19Z" fill="#64748B" />
      <circle cx="16.5" cy="22.5" r="3" fill="#38BDF8" />
      <circle cx="26.5" cy="20" r="1.5" fill="#10B981" />
      <path d="M16 30V36H24" stroke="#475569" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ============================================================================
 * 2. TIER 2: SOLID PILL MINI & UTILITY SVG (24x24) — CARD SALDO & PENGURUS
 * ============================================================================ */

export function IconPillLedger({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 3.5H15.5L19 7V20.5H6C4.9 20.5 4 19.6 4 18.5V5.5C4 4.4 4.9 3.5 6 3.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8.5 10.5H15.5M8.5 14.5H13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconPillCalendar({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" stroke="currentColor" strokeWidth="2" />
      <path d="M3.5 9.5H20.5M8 3V6.5M16 3V6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconPillCheck({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M8.5 12.2L10.9 14.6L15.8 9.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPillAdmin({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19.4 15A1.65 1.65 0 0 0 19.73 16.82L19.79 16.88A2 2 0 1 1 16.96 19.71L16.9 19.65A1.65 1.65 0 0 0 15.08 19.32A1.65 1.65 0 0 0 14.08 20.83V21A2 2 0 1 1 10.08 21V20.91A1.65 1.65 0 0 0 9 19.4A1.65 1.65 0 0 0 7.18 19.73L7.12 19.79A2 2 0 1 1 4.29 16.96L4.35 16.9A1.65 1.65 0 0 0 4.68 15.08A1.65 1.65 0 0 0 3.17 14.08H3A2 2 0 1 1 3 10.08H3.09A1.65 1.65 0 0 0 4.6 9A1.65 1.65 0 0 0 4.27 7.18L4.21 7.12A2 2 0 1 1 7.04 4.29L7.1 4.35A1.65 1.65 0 0 0 8.92 4.68H9A1.65 1.65 0 0 0 10 3.17V3A2 2 0 1 1 14 3V3.09A1.65 1.65 0 0 0 15 4.6A1.65 1.65 0 0 0 16.82 4.27L16.88 4.21A2 2 0 1 1 19.71 7.04L19.65 7.1A1.65 1.65 0 0 0 19.32 8.92V9A1.65 1.65 0 0 0 20.83 10H21A2 2 0 1 1 21 14H20.91A1.65 1.65 0 0 0 19.4 15Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPillPlus({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconPillWa({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M20.5 11.5C20.5 16.2 16.7 20 12 20C10.5 20 9.1 19.6 7.9 18.9L3.5 20L4.7 15.8C3.9 14.5 3.5 13.1 3.5 11.5C3.5 6.8 7.3 3 12 3C16.7 3 20.5 6.8 20.5 11.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 11.5H15M9 14.2H12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconPillPayroll({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M16 12.5H21M7 10.5H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconPillServer({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="4" width="17" height="6.5" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="3.5" y="13.5" width="17" height="6.5" rx="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="7.5" cy="7.25" r="1" fill="currentColor" />
      <circle cx="7.5" cy="16.75" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconPillLogout({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M14 4H7C5.9 4 5 4.9 5 6V18C5 19.1 5.9 20 7 20H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 12H20M20 12L16.5 8.5M20 12L16.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Ikon QRIS Scan tajam (Dipakai di tombol bulat tengah Bayar QRIS & modal) */
export function IconPillQris({ size = 22, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 8V6C4 4.9 4.9 4 6 4H8M16 4H18C19.1 4 20 4.9 20 6V8M20 16V18C20 19.1 19.1 20 18 20H16M8 20H6C4.9 20 4 19.1 4 18V16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="7.5" y="7.5" width="3.5" height="3.5" rx="0.8" fill="currentColor" />
      <rect x="13" y="7.5" width="3.5" height="3.5" rx="0.8" fill="currentColor" />
      <rect x="7.5" y="13" width="3.5" height="3.5" rx="0.8" fill="currentColor" />
      <path d="M13 13H16.5V16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---- Utility Mini Icons (Pengganti Emoji di Seluruh UI V7) ---- */

export function IconEye({ hidden = false, size = 18, className = '' }) {
  if (hidden) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10.6 10.6A2.5 2.5 0 0 0 13.4 13.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M9.9 5.2A10.4 10.4 0 0 1 12 5C16.8 5 20.5 8.3 21.8 12C21.3 13.4 20.4 14.8 19.2 15.9M6.2 7.1C4.4 8.4 3 10.1 2.2 12C3.5 15.7 7.2 19 12 19C13.6 19 15.1 18.6 16.4 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2.2 12C3.5 8.3 7.2 5 12 5C16.8 5 20.5 8.3 21.8 12C20.5 15.7 16.8 19 12 19C7.2 19 3.5 15.7 2.2 12Z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function IconRefresh({ size = 18, spinning = false, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`${spinning ? 'animate-spin' : ''} ${className}`}
    >
      <path d="M20 12A8 8 0 1 1 17.6 6.3L20 8.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4V8.5H15.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconArrowLeft({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M19 12H5M5 12L11.5 5.5M5 12L11.5 18.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronRight({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronDown({ size = 16, rotated = false, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`transition-transform duration-200 ${rotated ? 'rotate-180' : ''} ${className}`}
    >
      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconClose({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconSearch({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20L16.2 16.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconPhoto({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="4.5" width="18" height="15" rx="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="8.5" cy="9.5" r="1.5" fill="currentColor" />
      <path d="M4.5 17.5L9.5 12.5L13 15.8L16 13L19.5 17.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconUpload({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 15V4M12 4L7.5 8.5M12 4L16.5 8.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconClock({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7.5V12L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconAlert({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3.5L21 19.5H3L12 3.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 10V13.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function IconDownload({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 4V15M12 15L7.5 10.5M12 15L16.5 10.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17V18.5C4 19.3 4.7 20 5.5 20H18.5C19.3 20 20 19.3 20 18.5V17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconShareIos({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 15V3.5M12 3.5L8 7.5M12 3.5L16 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 11.5V18.5C6 19.6 6.9 20.5 8 20.5H16C17.1 20.5 18 19.6 18 18.5V11.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlusSquare({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8.5V15.5M8.5 12H15.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/* ============================================================================
 * 3. TIER 3: DUAL-STATE NAV SVG (24x24) — BOTTOM NAV MOBILE & SLIM SIDEBAR
 * ============================================================================ */

export function NavIconHome({ active = false, size = 22, className = '' }) {
  if (active) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path
          d="M3.6 10.6L10.8 4.4C11.5 3.8 12.5 3.8 13.2 4.4L20.4 10.6C21 11.1 20.7 12.1 19.9 12.1H19V19C19 20.1 18.1 21 17 21H14.5V15.5C14.5 14.7 13.8 14 13 14H11C10.2 14 9.5 14.7 9.5 15.5V21H7C5.9 21 5 20.1 5 19V12.1H4.1C3.3 12.1 3 11.1 3.6 10.6Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 10.8L11.2 4.6C11.7 4.2 12.3 4.2 12.8 4.6L20 10.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 9.5V18.8C6 19.5 6.5 20 7.2 20H16.8C17.5 20 18 19.5 18 18.8V9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 20V14.8H14V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NavIconLedger({ active = false, size = 22, className = '' }) {
  if (active) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="4" y="3.5" width="16" height="17" rx="3.5" fill="currentColor" />
        <path d="M8.5 9H15.5M8.5 13H15.5M8.5 17H12.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4.5" y="4" width="15" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M8.5 9H15.5M8.5 13H15.5M8.5 17H12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function NavIconResidents({ active = false, size = 22, className = '' }) {
  if (active) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="9.2" cy="8.2" r="3.4" fill="currentColor" />
        <path d="M3.5 19.2C3.5 15.8 6 13.5 9.2 13.5C12.4 13.5 14.9 15.8 14.9 19.2V20H3.5V19.2Z" fill="currentColor" />
        <circle cx="16.5" cy="9.5" r="2.6" fill="currentColor" fillOpacity="0.72" />
        <path d="M15.8 14.2C18.5 14.5 20.5 16.4 20.5 19.2V20H16.2V19.2C16.2 17.2 15.6 15.5 14.5 14.3C14.9 14.2 15.4 14.2 15.8 14.2Z" fill="currentColor" fillOpacity="0.72" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9.2" cy="8.2" r="3.2" stroke="currentColor" strokeWidth="2" />
      <path d="M3.8 19.5C3.8 16.3 6.1 14 9.2 14C12.3 14 14.6 16.3 14.6 19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16.5" cy="9.5" r="2.3" stroke="currentColor" strokeWidth="1.9" />
      <path d="M16.5 14.5C18.8 14.8 20.2 16.7 20.2 19.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function NavIconSecurity({ active = false, size = 22, className = '' }) {
  if (active) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path
          d="M12 3L19.5 6V11.8C19.5 16.6 16.3 20.3 12 21.8C7.7 20.3 4.5 16.6 4.5 11.8V6L12 3Z"
          fill="currentColor"
        />
        <path d="M9.2 12.2L11.2 14.2L15.2 10" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3.5L19 6.3V11.8C19 16.2 16 19.7 12 21.1C8 19.7 5 16.2 5 11.8V6.3L12 3.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9.3 12.2L11.2 14.1L15 10.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NavIconAdmin({ active = false, size = 20, className = '' }) {
  if (active) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="3.5" y="4" width="17" height="16" rx="4" fill="currentColor" />
        <circle cx="12" cy="10" r="2.6" fill="#FFFFFF" />
        <path d="M7.5 17.5C7.9 15.3 9.7 14 12 14C14.3 14 16.1 15.3 16.5 17.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return <IconPillAdmin size={size} className={className} />;
}

/* ============================================================================
 * 4. TIER 4: ILUSTRASI VEKTOR MINI — HEADER CLUSTER & EMPTY STATES
 * ============================================================================ */

/**
 * Ilustrasi Latar Header Atas (Siluet Gerbang & Deretan Rumah Cluster Mutiara Residence)
 * Menyatu lembut dengan latar gradasi mint-teal pada Beranda & Ruang Pengurus.
 */
export function ClusterHeaderIllustration({ className = '' }) {
  const uid = useId();
  return (
    <svg
      viewBox="0 0 260 110"
      fill="none"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <defs>
        <linearGradient id={`${uid}-hill`} x1="0" y1="65" x2="260" y2="110" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34D399" stopOpacity="0.28" />
          <stop offset="1" stopColor="#0D9488" stopOpacity="0.38" />
        </linearGradient>
        <linearGradient id={`${uid}-roof`} x1="120" y1="30" x2="180" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F766E" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>

      {/* Awan lembut */}
      <rect x="28" y="16" width="44" height="12" rx="6" fill="#FFFFFF" fillOpacity="0.55" />
      <rect x="44" y="11" width="22" height="10" rx="5" fill="#FFFFFF" fillOpacity="0.55" />
      <rect x="176" y="12" width="52" height="13" rx="6.5" fill="#FFFFFF" fillOpacity="0.45" />

      {/* Kontur bukit lembut belakang */}
      <path d="M0 95C36 74 82 70 132 82C182 94 218 72 260 80V110H0V95Z" fill={`url(#${uid}-hill)`} />

      {/* Pohon kiri */}
      <circle cx="42" cy="72" r="13" fill="#10B981" fillOpacity="0.45" />
      <circle cx="56" cy="78" r="10" fill="#059669" fillOpacity="0.38" />
      <rect x="41" y="78" width="3" height="16" rx="1.5" fill="#0F766E" fillOpacity="0.4" />

      {/* Rumah 1 (Kiri) */}
      <path d="M74 68L96 50L118 68H74Z" fill="#0D9488" fillOpacity="0.52" />
      <rect x="79" y="68" width="34" height="26" rx="3" fill="#FFFFFF" fillOpacity="0.72" />
      <rect x="85" y="74" width="8" height="8" rx="1.5" fill="#99F6E4" />
      <rect x="97" y="77" width="9" height="17" rx="2" fill="#0F766E" fillOpacity="0.55" />

      {/* Rumah Utama / Pos Cluster (Tengah) */}
      <path d="M120 62L152 36L184 62H120Z" fill={`url(#${uid}-roof)`} fillOpacity="0.82" />
      <rect x="127" y="62" width="50" height="33" rx="4" fill="#FFFFFF" fillOpacity="0.88" />
      <rect x="135" y="69" width="11" height="10" rx="2" fill="#A7F3D0" />
      <rect x="158" y="69" width="11" height="10" rx="2" fill="#A7F3D0" />
      <rect x="147" y="79" width="10" height="16" rx="2" fill="#059669" fillOpacity="0.75" />

      {/* Rumah 3 (Kanan) */}
      <path d="M188 70L210 53L232 70H188Z" fill="#0284C7" fillOpacity="0.42" />
      <rect x="193" y="70" width="34" height="24" rx="3" fill="#FFFFFF" fillOpacity="0.68" />
      <rect x="200" y="76" width="8" height="7" rx="1.5" fill="#BAE6FD" />
      <rect x="212" y="78" width="8" height="16" rx="2" fill="#0369A1" fillOpacity="0.45" />

      {/* Pohon kanan */}
      <circle cx="242" cy="74" r="11" fill="#10B981" fillOpacity="0.42" />
      <rect x="241" y="80" width="2.8" height="14" rx="1.4" fill="#0F766E" fillOpacity="0.35" />
    </svg>
  );
}

/**
 * Ilustrasi Empty State Vektor Mini (Anti Layar Polos)
 * type: 'package' | 'parking' | 'validation' | 'ledger' | 'search'
 */
export function EmptyStateIllustration({ type = 'package', size = 84, className = '' }) {
  const uid = useId();

  if (type === 'parking') {
    return (
      <svg width={size} height={size} viewBox="0 0 96 96" fill="none" className={className}>
        <circle cx="48" cy="48" r="40" fill="#F0F9FF" />
        <rect x="22" y="34" width="52" height="32" rx="10" fill="#E0F2FE" stroke="#7DD3FC" strokeWidth="2" strokeDasharray="5 4" />
        <circle cx="48" cy="50" r="12" fill="#0284C7" fillOpacity="0.16" />
        <path d="M44.5 55V45H48.5C50.4 45 51.8 46.2 51.8 48C51.8 49.8 50.4 51 48.5 51H44.5" stroke="#0284C7" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === 'validation') {
    return (
      <svg width={size} height={size} viewBox="0 0 96 96" fill="none" className={className}>
        <defs>
          <linearGradient id={`${uid}-ok`} x1="26" y1="26" x2="70" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34D399" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>
        <circle cx="48" cy="48" r="40" fill="#ECFDF5" />
        <circle cx="48" cy="48" r="24" fill={`url(#${uid}-ok)`} />
        <path d="M38 48.5L44.8 55.2L58.5 41.5" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === 'ledger' || type === 'search') {
    return (
      <svg width={size} height={size} viewBox="0 0 96 96" fill="none" className={className}>
        <circle cx="48" cy="48" r="40" fill="#F1F5F9" />
        <rect x="28" y="24" width="40" height="48" rx="9" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2.2" />
        <rect x="36" y="36" width="24" height="4" rx="2" fill="#CBD5E1" />
        <rect x="36" y="46" width="18" height="4" rx="2" fill="#E2E8F0" />
        <rect x="36" y="56" width="14" height="4" rx="2" fill="#E2E8F0" />
        <circle cx="62" cy="60" r="10" fill="#CCFBF1" stroke="#0F766E" strokeWidth="2.2" />
        <path d="M69 67L75 73" stroke="#0F766E" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    );
  }

  // Default: 'package' (0 Paket di Pos)
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" className={className}>
      <circle cx="48" cy="48" r="40" fill="#FFFBEB" />
      <rect x="26" y="36" width="44" height="32" rx="8" fill="#FDE68A" stroke="#F59E0B" strokeWidth="2" />
      <path d="M26 42L34 30H62L70 42H26Z" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" />
      <rect x="43" y="30" width="10" height="20" rx="2" fill="#FFFFFF" fillOpacity="0.85" />
      <circle cx="66" cy="64" r="10" fill="#10B981" stroke="#FFFFFF" strokeWidth="2.5" />
      <path d="M62 64L64.8 66.8L70.2 61.4" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
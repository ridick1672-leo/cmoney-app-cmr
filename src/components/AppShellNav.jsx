import React, { useState } from 'react';
import {
  CMoneyLogo,
  NavIconHome,
  NavIconLedger,
  NavIconResidents,
  NavIconSecurity,
  NavIconAdmin,
  IconPillQris,
  IconRefresh,
  IconAlert,
  IconChevronRight,
  IconLogin,
  IconSettings
} from './CMoneyIcons';

/**
 * ============================================================================
 * C-MONEY V7.2 — ADAPTIVE APP SHELL & NAVIGATION
 * ============================================================================
 * - Mobile (< 1024px)  : Micro Top Bar + Bottom Nav 5 Slot (Tombol Tengah Bayar QRIS)
 * - Desktop (>= 1024px): Fixed Full-Height Slim Sidebar (anti terpotong scroll) +
 *                        Tombol lipat di tepi kanan (logo 100% anti gepeng)
 * - Pemisahan tegas tombol Pengaturan Warga (Gear) vs Masuk/Ruang Pengurus (Login)
 */

const MAIN_NAV_ITEMS = [
  { id: 'beranda', label: 'Beranda', mobileLabel: 'Beranda', Icon: NavIconHome },
  { id: 'mutasi', label: 'Buku Kas', mobileLabel: 'Kas', Icon: NavIconLedger },
  { id: 'rumah', label: 'Daftar Warga', mobileLabel: 'Warga', Icon: NavIconResidents },
  { id: 'keamanan', label: 'Pos Security', mobileLabel: 'Pos', Icon: NavIconSecurity }
];

export default function AppShellNav({
  activeTab = 'beranda',
  onSelectTab,
  onOpenQris,
  onOpenAdmin,
  onOpenSettings,
  onRefresh,
  isRefreshing = false,
  isOnline = true,
  isAdminLoggedIn = false,
  isAdminViewActive = false,
  backendVersion = '',
  expectedBackendVersion = 'v6.3',
  isBackendOutdated = false,
  liveClock = '',
  lastSyncTime = '',
  packageCount = 0,
  pendingValidationCount = 0,
  logoUrl = '/assets/logo-cmoney.png',
  appName = 'C-Money',
  clusterSubtitle = 'Mutiara Residence',
  children
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleNavClick = (tabId) => {
    if (typeof onSelectTab === 'function') {
      onSelectTab(tabId);
    }
  };

  // Di Mobile, sembunyikan Micro Top Bar & Bottom Nav saat layar penuh Ruang Pengurus aktif
  const hideMobileChrome = Boolean(isAdminViewActive);

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-slate-800">
      {/* ====================================================================
          1. DESKTOP FIXED FULL-HEIGHT SLIM SIDEBAR (>= 1024px)
      ==================================================================== */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 bg-white border-r border-slate-200/85 z-40 transition-all duration-200 ${
          sidebarCollapsed ? 'w-[80px]' : 'w-[232px]'
        }`}
      >
        {/* Tombol Lipat / Lebarkan Menempel di Garis Tepi Kanan (Logo 100% Anti Gepeng) */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          title={sidebarCollapsed ? 'Lebarkan Sidebar' : 'Lipat Sidebar'}
          aria-label={sidebarCollapsed ? 'Lebarkan Sidebar' : 'Lipat Sidebar'}
          className="absolute -right-3.5 top-5 z-50 w-7 h-7 rounded-full bg-white hover:bg-emerald-50 border border-slate-200 text-slate-500 hover:text-emerald-700 shadow-sm flex items-center justify-center transition cursor-pointer"
        >
          <IconChevronRight
            size={14}
            className={`transition-transform duration-200 ${
              sidebarCollapsed ? 'rotate-0' : 'rotate-180'
            }`}
          />
        </button>

        {/* Brand Header Sidebar */}
        <div
          className={`h-16 border-b border-slate-100 flex items-center ${
            sidebarCollapsed ? 'justify-center px-2' : 'px-4'
          }`}
        >
          <button
            type="button"
            onClick={() => handleNavClick('beranda')}
            className={`flex items-center cursor-pointer text-left ${
              sidebarCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'
            }`}
            title="Kembali ke Beranda"
          >
            <CMoneyLogo
              src={logoUrl}
              size={36}
              className="aspect-square shrink-0 shadow-sm ring-1 ring-emerald-100"
            />
            {!sidebarCollapsed && (
              <div className="min-w-0 leading-tight">
                <p className="text-sm font-black text-slate-900 tracking-tight truncate">
                  {appName}
                </p>
                <p className="text-[11px] font-semibold text-emerald-700 truncate">
                  {clusterSubtitle}
                </p>
              </div>
            )}
          </button>
        </div>

        {/* Tombol CTA Utama: Bayar QRIS */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => typeof onOpenQris === 'function' && onOpenQris(null)}
            title="Bayar IPL & Parkir via QRIS"
            className={`w-full rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-extrabold shadow-md shadow-cyan-500/25 flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer ${
              sidebarCollapsed ? 'h-12 px-0' : 'py-3 px-4 text-xs'
            }`}
          >
            <IconPillQris size={20} className="shrink-0" />
            {!sidebarCollapsed && <span>Bayar QRIS</span>}
          </button>
        </div>

        {/* Menu Navigasi Utama Sidebar */}
        <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto" aria-label="Navigasi Utama">
          {MAIN_NAV_ITEMS.map(({ id, label, Icon }) => {
            const isActive = !isAdminViewActive && activeTab === id;
            const showPackageBadge = id === 'keamanan' && Number(packageCount) > 0;

            return (
              <button
                key={id}
                type="button"
                onClick={() => handleNavClick(id)}
                title={sidebarCollapsed ? label : undefined}
                className={`w-full flex items-center rounded-2xl transition cursor-pointer relative ${
                  sidebarCollapsed ? 'justify-center h-11 px-0' : 'justify-between px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-extrabold ring-1 ring-emerald-200/80'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="relative shrink-0">
                    <Icon active={isActive} size={21} />
                    {sidebarCollapsed && showPackageBadge && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                    )}
                  </span>
                  {!sidebarCollapsed && <span className="text-[13px] truncate">{label}</span>}
                </span>

                {!sidebarCollapsed && showPackageBadge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                    {packageCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Area Bawah Sidebar: Pengaturan Warga (Gear) & Masuk/Ruang Pengurus */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          {/* Tombol Pengaturan Warga (Gear) */}
          {typeof onOpenSettings === 'function' && (
            <button
              type="button"
              onClick={onOpenSettings}
              title={sidebarCollapsed ? 'Pengaturan & Panduan' : undefined}
              className={`w-full flex items-center rounded-2xl transition cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200/80 ${
                sidebarCollapsed ? 'justify-center h-11 px-0' : 'gap-2.5 px-3.5 py-2.5'
              }`}
            >
              <IconSettings size={19} className="shrink-0" />
              {!sidebarCollapsed && <span className="text-xs truncate">Pengaturan</span>}
            </button>
          )}

          {/* Tombol Masuk Pengurus / Ruang Pengurus */}
          <button
            type="button"
            onClick={() => typeof onOpenAdmin === 'function' && onOpenAdmin()}
            title={
              sidebarCollapsed
                ? isAdminLoggedIn
                  ? 'Ruang Pengurus'
                  : 'Masuk Pengurus'
                : undefined
            }
            className={`w-full flex items-center rounded-2xl transition cursor-pointer relative ${
              sidebarCollapsed ? 'justify-center h-11 px-0' : 'justify-between px-3.5 py-2.5'
            } ${
              isAdminViewActive
                ? 'bg-teal-900 text-white font-extrabold shadow-sm'
                : isAdminLoggedIn
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-200/80'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200/80'
            }`}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="relative shrink-0">
                {isAdminLoggedIn ? (
                  <NavIconAdmin active={isAdminViewActive} size={19} />
                ) : (
                  <IconLogin size={19} />
                )}
                {isAdminLoggedIn && !isAdminViewActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </span>
              {!sidebarCollapsed && (
                <span className="text-xs truncate">
                  {isAdminLoggedIn ? 'Ruang Pengurus' : 'Masuk Pengurus'}
                </span>
              )}
            </span>

            {!sidebarCollapsed && Number(pendingValidationCount) > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                  isAdminViewActive
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {pendingValidationCount}
              </span>
            )}
          </button>

          {!sidebarCollapsed && (
            <div className="px-2 pt-0.5 flex items-center justify-between text-[10px] font-semibold text-slate-400">
              <span>C-Money V7.2</span>
              <span className="font-mono">API {backendVersion || expectedBackendVersion}</span>
            </div>
          )}
        </div>
      </aside>

      {/* ====================================================================
          2. AREA KONTEN KANAN (DENGAN OFFSET DINAMIS UNTUK FIXED SIDEBAR)
      ==================================================================== */}
      <div
        className={`min-h-screen flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? 'lg:pl-[80px]' : 'lg:pl-[232px]'
        }`}
      >
        {/* MICRO TOP BAR — Ringkas, Cerah, & Menyatu dengan Latar Halaman */}
        <header
          className={`sticky top-0 z-30 transition-colors ${
            hideMobileChrome ? 'hidden lg:block' : 'block'
          } bg-white/90 lg:bg-white/85 backdrop-blur-md border-b border-slate-200/75`}
        >
          <div className="max-w-6xl mx-auto px-3.5 sm:px-5 lg:px-6 h-14 flex items-center justify-between gap-2">
            {/* Kiri: Brand Mini (Mobile) / Status Sinkronisasi Live (Desktop) */}
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Brand Mini khusus Mobile */}
              <button
                type="button"
                onClick={() => handleNavClick('beranda')}
                className="flex lg:hidden items-center gap-2 min-w-0 cursor-pointer text-left"
              >
                <CMoneyLogo
                  src={logoUrl}
                  size={32}
                  className="aspect-square shrink-0 ring-1 ring-emerald-100 shadow-xs"
                />
                <div className="min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-slate-900 tracking-tight">
                      {appName}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                        isOnline
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                        }`}
                      />
                      {isOnline ? 'Live' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-500 truncate">
                    {lastSyncTime ? `Sinkron ${lastSyncTime}` : clusterSubtitle}
                  </p>
                </div>
              </button>

              {/* Status Bar Live khusus Desktop */}
              <div className="hidden lg:flex items-center gap-2.5 min-w-0">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                    isOnline
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                      : 'bg-rose-50 text-rose-700 border-rose-200/80'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  {isOnline
                    ? `Online • API ${backendVersion || expectedBackendVersion}`
                    : 'Mode Offline (Data Lokal)'}
                </span>

                {lastSyncTime && (
                  <span className="text-xs font-semibold text-slate-500 truncate">
                    Sinkron: <strong className="text-slate-700">{lastSyncTime}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Kanan: Jam Real-Time, Refresh, Pengaturan (Gear), & Masuk Pengurus (Login) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {liveClock && (
                <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-xl bg-slate-100/90 text-[11px] font-bold text-slate-600 font-mono">
                  {liveClock}
                </span>
              )}

              {/* Tombol Refresh */}
              <button
                type="button"
                onClick={() => typeof onRefresh === 'function' && onRefresh()}
                disabled={isRefreshing}
                title="Segarkan Data Terbaru"
                aria-label="Segarkan Data"
                className="h-9 px-2.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 flex items-center gap-1.5 text-xs font-bold transition disabled:opacity-60 cursor-pointer"
              >
                <IconRefresh size={16} spinning={isRefreshing} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* Tombol Pengaturan Warga (Gear — Buka Mode Gelap, Panduan, PWA) */}
              {typeof onOpenSettings === 'function' && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  title="Pengaturan & Pusat Panduan"
                  aria-label="Pengaturan & Pusat Panduan"
                  className="h-9 w-9 sm:w-auto sm:px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer"
                >
                  <IconSettings size={17} />
                  <span className="hidden xl:inline">Pengaturan</span>
                </button>
              )}

              {/* Tombol Masuk Pengurus / Ruang Pengurus */}
              <button
                type="button"
                onClick={() => typeof onOpenAdmin === 'function' && onOpenAdmin()}
                title={isAdminLoggedIn ? 'Buka Ruang Pengurus' : 'Masuk Mode Pengurus'}
                aria-label={isAdminLoggedIn ? 'Buka Ruang Pengurus' : 'Masuk Mode Pengurus'}
                className={`relative h-9 px-2.5 sm:px-3 rounded-xl flex items-center gap-1.5 text-xs font-extrabold transition cursor-pointer ${
                  isAdminViewActive
                    ? 'bg-teal-900 text-white shadow-sm'
                    : isAdminLoggedIn
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                }`}
              >
                <span className="relative flex items-center">
                  {isAdminLoggedIn ? (
                    <NavIconAdmin active={isAdminViewActive} size={17} />
                  ) : (
                    <IconLogin size={17} />
                  )}
                  {isAdminLoggedIn && !isAdminViewActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                  )}
                </span>
                <span className="hidden sm:inline">
                  {isAdminLoggedIn ? 'Pengurus' : 'Masuk'}
                </span>
                {Number(pendingValidationCount) > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">
                    {pendingValidationCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Banner Peringatan Otomatis Jika Versi API GAS Tidak Cocok */}
          {isBackendOutdated && (
            <div className="bg-amber-50 border-t border-amber-200/90 px-3.5 sm:px-6 py-2">
              <div className="max-w-6xl mx-auto flex items-center gap-2 text-[11px] sm:text-xs font-bold text-amber-900">
                <IconAlert size={16} className="text-amber-600 shrink-0" />
                <span className="truncate">
                  Versi API GAS terdeteksi <strong>{backendVersion || 'lama'}</strong> (target{' '}
                  <strong>{expectedBackendVersion}</strong>). Periksa Status Server di Ruang
                  Pengurus.
                </span>
              </div>
            </div>
          )}
        </header>

        {/* KONTEN UTAMA HALAMAN */}
        <main
          className={`flex-1 w-full max-w-6xl mx-auto ${
            hideMobileChrome ? 'pb-6 lg:pb-10' : 'pb-28 lg:pb-10'
          }`}
        >
          {children}
        </main>
      </div>

      {/* ====================================================================
          3. MOBILE BOTTOM NAVIGATION BAR — 5 SLOT + TOMBOL BULAT TENGAH QRIS
      ==================================================================== */}
      {!hideMobileChrome && (
        <nav
          aria-label="Navigasi Bawah"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-6px_24px_rgba(15,23,42,0.07)]"
        >
          <div className="max-w-lg mx-auto grid grid-cols-5 items-end h-[66px] px-1">
            <MobileNavButton
              item={MAIN_NAV_ITEMS[0]}
              isActive={activeTab === 'beranda'}
              onClick={() => handleNavClick('beranda')}
            />
            <MobileNavButton
              item={MAIN_NAV_ITEMS[1]}
              isActive={activeTab === 'mutasi'}
              onClick={() => handleNavClick('mutasi')}
            />

            {/* Slot 3 (Tengah): Tombol Bulat Menonjol Bayar QRIS */}
            <div className="flex flex-col items-center justify-end pb-1.5 relative">
              <button
                type="button"
                onClick={() => typeof onOpenQris === 'function' && onOpenQris(null)}
                aria-label="Bayar QRIS"
                className="-mt-6 w-[60px] h-[60px] rounded-full bg-gradient-to-b from-sky-400 via-cyan-500 to-teal-500 hover:from-sky-500 hover:to-teal-600 text-white ring-4 ring-white shadow-[0_8px_20px_rgba(6,182,212,0.42)] flex flex-col items-center justify-center gap-0.5 active:scale-95 transition cursor-pointer"
              >
                <IconPillQris size={22} />
                <span className="text-[10px] font-black leading-none tracking-tight">Bayar</span>
              </button>
            </div>

            <MobileNavButton
              item={MAIN_NAV_ITEMS[2]}
              isActive={activeTab === 'rumah'}
              onClick={() => handleNavClick('rumah')}
            />
            <MobileNavButton
              item={MAIN_NAV_ITEMS[3]}
              isActive={activeTab === 'keamanan'}
              badgeCount={packageCount}
              onClick={() => handleNavClick('keamanan')}
            />
          </div>
        </nav>
      )}
    </div>
  );
}

function MobileNavButton({ item, isActive, badgeCount = 0, onClick }) {
  const { Icon, mobileLabel, label } = item;
  const hasBadge = Number(badgeCount) > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className={`h-full flex flex-col items-center justify-center gap-1 pt-1.5 pb-1.5 relative transition cursor-pointer ${
        isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      {isActive && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-emerald-600" />
      )}

      <span className="relative">
        <Icon active={isActive} size={22} />
        {hasBadge && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </span>

      <span
        className={`text-[10px] leading-none tracking-tight ${
          isActive ? 'font-extrabold text-emerald-700' : 'font-semibold text-slate-500'
        }`}
      >
        {mobileLabel}
      </span>
    </button>
  );
}
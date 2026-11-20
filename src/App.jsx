import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import './index.css';
import PwaInstallSheet from './components/PwaInstallSheet';
import { SettingsSheet, GuideCenterSheet } from './components/HelpAndSettingsSheets';
import { CMoneyAPI } from './services/apiService';
import * as apiModule from './services/apiService';
import * as gasConfigModule from './config/gasConfig';
import AppShellNav from './components/AppShellNav';
import PublicDashboard from './components/PublicDashboard';
import QrisPaymentModal from './components/QrisPaymentModal';
import AdminWorkspace, { AdminLoginSheet } from './components/AdminWorkspace';
import {
  IconClose,
  IconChevronRight,
  IconArrowLeft,
  IconDownload
} from './components/CMoneyIcons';

/**
 * ============================================================================
 * C-MONEY V7 — ROOT APPLICATION CONTROLLER
 * ============================================================================
 * - Menyatukan AppShellNav (Mobile Bottom Nav <-> Desktop Slim Sidebar),
 *   PublicDashboard (Pola Gojek), QrisPaymentModal, AdminWorkspace (Profilku),
 *   dan In-App Multi-Photo Lightbox Slider.
 * - Non-Blocking Background Sync setelah konfirmasi server 'success'
 * - 100% kompatibel dengan Code.gs V6.3, apiService.js, & gasConfig.js
 */

const EXPECTED_BACKEND_VERSION = 'v6.3';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const FALLBACK_HOUSES = [
  { id: 'H-01', nomor_rumah: '01', nama_warga: 'Pak Suharso', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-02', nomor_rumah: '02', nama_warga: 'Pak Refza', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-03', nomor_rumah: '03', nama_warga: 'Pak Upen', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-04', nomor_rumah: '04', nama_warga: 'Unit Dijual BPR', status_huni: 'Tidak Aktif', tarif_ipl: 0 },
  { id: 'H-05', nomor_rumah: '05', nama_warga: 'Pak Wahyu', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-06', nomor_rumah: '06', nama_warga: 'Pak Andy', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-07', nomor_rumah: '07', nama_warga: 'Pak Romi', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-08', nomor_rumah: '08', nama_warga: 'Pak Sonny', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-09', nomor_rumah: '09', nama_warga: 'Pak Kiswanto', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-10', nomor_rumah: '10', nama_warga: 'Pak Ridick', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-11', nomor_rumah: '11', nama_warga: 'Warga No. 11', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-12', nomor_rumah: '12', nama_warga: 'Warga No. 12', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-13', nomor_rumah: '13', nama_warga: 'Pak Hery', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-14', nomor_rumah: '14', nama_warga: 'Pak Dwi', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-15', nomor_rumah: '15', nama_warga: 'Pak Juhairi', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-16', nomor_rumah: '16', nama_warga: 'Pak Baim', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-17', nomor_rumah: '17', nama_warga: 'Warga No. 17', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-18', nomor_rumah: '18', nama_warga: 'Ibu Retno', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-19', nomor_rumah: '19', nama_warga: 'Pak Paulus', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-20', nomor_rumah: '20', nama_warga: 'Warga No. 20', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-21', nomor_rumah: '21', nama_warga: 'Ibu Marlina', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-22', nomor_rumah: '22', nama_warga: 'Pak Baim (Unit 2)', status_huni: 'Aktif', tarif_ipl: 200000 }
];

const INITIAL_FALLBACK_DATA = {
  app_name: 'C-Money',
  cluster_full_name: 'Cluster Mutiara Residence Sumberjaya',
  logo_url: '/assets/logo-cmoney.png',
  current_balance: 1394200,
  default_ipl_amount: 200000,
  total_houses: 22,
  total_active_houses: 21,
  qris_merchant_name: 'Cluster Mutiara Residence',
  qris_nmid: 'ID1026000000CMR',
  qris_image_url: '/assets/qris-cmr-statis.png',
  houses: FALLBACK_HOUSES,
  ipl_status: [],
  cash_ledger: [],
  monthly_closings: [],
  security_payroll: [],
  security_schedules: [],
  security_logs: [],
  parking_slots: []
};

/**
 * Menentukan periode buku default otomatis berdasarkan tanggal cut-off tgl 25
 */
function getInitialSmartPeriod(cutoffDay = 25) {
  const now = new Date();
  let mIdx = now.getMonth();
  let year = now.getFullYear();
  if (now.getDate() >= cutoffDay) {
    mIdx += 1;
    if (mIdx > 11) {
      mIdx = 0;
      year += 1;
    }
  }
  return {
    bulan: MONTH_NAMES[mIdx] || 'November',
    tahun: year
  };
}

/**
 * Memformat waktu jam detik WIB real-time
 */
function formatLiveClockWib(dateObj = new Date()) {
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const monthsShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const d = days[dateObj.getDay()];
  const tgl = String(dateObj.getDate()).padStart(2, '0');
  const bln = monthsShort[dateObj.getMonth()];
  const thn = dateObj.getFullYear();
  const hh = String(dateObj.getHours()).padStart(2, '0');
  const mm = String(dateObj.getMinutes()).padStart(2, '0');
  const ss = String(dateObj.getSeconds()).padStart(2, '0');
  return `${d}, ${tgl} ${bln} ${thn} • ${hh}:${mm}:${ss} WIB`;
}

function formatSyncTimeWib(dateObj = new Date()) {
  const hh = String(dateObj.getHours()).padStart(2, '0');
  const mm = String(dateObj.getMinutes()).padStart(2, '0');
  const ss = String(dateObj.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss} WIB`;
}

/**
 * Konversi tautan Google Drive menjadi URL gambar langsung untuk Lightbox In-App
 */
function extractDriveFileId(url) {
  if (!url || typeof url !== 'string') return '';
  const str = url.trim();
  const matchD = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) return matchD[1];
  const matchId = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) return matchId[1];
  return '';
}

function toDirectImageUrl(url, useThumbnailFallback = false) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('data:image') || trimmed.startsWith('/assets/')) {
    return trimmed;
  }
  const driveId = extractDriveFileId(trimmed);
  if (driveId) {
    return useThumbnailFallback
      ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`
      : `https://lh3.googleusercontent.com/d/${driveId}=w1600`;
  }
  return trimmed;
}

/**
 * Parser versi backend untuk deteksi otomatis API kadaluarsa
 */
function isVersionOlderThan(currentVer, targetVer = '6.3') {
  if (!currentVer) return false;
  const curNum = parseFloat(String(currentVer).replace(/[^0-9.]/g, ''));
  const tgtNum = parseFloat(String(targetVer).replace(/[^0-9.]/g, ''));
  if (Number.isNaN(curNum) || Number.isNaN(tgtNum)) return false;
  return curNum < tgtNum;
}

/**
 * Membaca potongan URL GAS aktif secara aman dari apiService / gasConfig
 */
function resolveGasUrlPreview() {
  if (typeof apiModule.getActiveGasUrlBadge === 'function') {
    const badge = apiModule.getActiveGasUrlBadge();
    if (badge) return badge;
  }
  const rawUrl =
    gasConfigModule.GAS_WEBAPP_URL ||
    gasConfigModule.ACTIVE_GAS_WEBAPP_URL ||
    gasConfigModule.GAS_URL ||
    gasConfigModule.default ||
    '';

  if (typeof rawUrl === 'string' && rawUrl.length > 24) {
    return `${rawUrl.slice(0, 36)}...${rawUrl.slice(-16)}`;
  }
  return rawUrl ? String(rawUrl) : 'Terhubung via src/config/gasConfig.js';
}

export default function App() {
  const initialPeriod = useMemo(() => getInitialSmartPeriod(25), []);

  // State Data Utama & Sinkronisasi
  const [dashboardData, setDashboardData] = useState(INITIAL_FALLBACK_DATA);
  const [hasServerData, setHasServerData] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(initialPeriod.bulan);
  const [selectedYear, setSelectedYear] = useState(initialPeriod.tahun);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingBackground, setIsSyncingBackground] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [backendVersion, setBackendVersion] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState('');
  const [liveClock, setLiveClock] = useState(() => formatLiveClockWib(new Date()));

  // State Navigasi Halaman & Modal
  const [activeTab, setActiveTab] = useState('beranda');
  const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);
  const [qrisPreselectedHouse, setQrisPreselectedHouse] = useState(null);

  // State Autentikasi & Ruang Pengurus
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() =>
    Boolean(localStorage.getItem('cmoney_pengurus_token'))
  );
  const [isAdminViewActive, setIsAdminViewActive] = useState(false);
  const [isLoginSheetOpen, setIsLoginSheetOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState('');

  // State Lightbox Slider Multi-Foto
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    urls: [],
    index: 0,
    title: '',
    subtitle: '',
    fallbackMap: {}
  });
  const touchStartXRef = useRef(null);

  // State Mode Gelap (tersimpan otomatis di HP warga + ubah warna status bar PWA)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem('cmoney_theme') === 'dark';
    } catch (_) {
      return false;
    }
  });

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('cmoney_theme', theme);
    } catch (_) {
      // ignore
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDarkMode ? '#0F172A' : '#059669');
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);
  
  // Deteksi mode PWA terinstal & tangkap event beforeinstallprompt Android/Desktop
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [deferredPwaPrompt, setDeferredPwaPrompt] = useState(null);
  const [isPwaSheetOpen, setIsPwaSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [guideSheet, setGuideSheet] = useState({ isOpen: false, initialTab: 'cara_pakai' });

  useEffect(() => {
    try {
      const standalone =
        window.matchMedia?.('(display-mode: standalone)')?.matches ||
        window.navigator?.standalone === true;
      setIsPwaInstalled(Boolean(standalone));
    } catch (_) {
      setIsPwaInstalled(false);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPwaPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsPwaInstalled(true);
      setDeferredPwaPrompt(null);
      setIsPwaSheetOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleTriggerNativePwaInstall = async () => {
    if (!deferredPwaPrompt) return;
    try {
      deferredPwaPrompt.prompt();
      const choice = await deferredPwaPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setIsPwaInstalled(true);
        setDeferredPwaPrompt(null);
        setIsPwaSheetOpen(false);
      }
    } catch (_) {
      // Abaikan jika dibatalkan pengguna
    }
  };

  // Jam detik real-time WIB
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(formatLiveClockWib(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Penarik Data Dashboard Live (Mendukung Mode Normal & Non-Blocking Background)
  const fetchDashboard = useCallback(
    async (bulan = selectedMonth, tahun = selectedYear, options = {}) => {
      const isBg = Boolean(options.background);
      if (isBg) {
        setIsSyncingBackground(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const res = await CMoneyAPI.getPublicDashboard(bulan, tahun);
        if (res && res.status === 'success') {
          setDashboardData((prev) => ({
            ...prev,
            ...res,
            houses: Array.isArray(res.houses) && res.houses.length > 0 ? res.houses : prev.houses
          }));
          setHasServerData(true);
          setIsOnline(true);
          setBackendVersion(res.backend_version || '');
          setLastSyncTime(formatSyncTimeWib(new Date()));
        } else {
          setIsOnline(false);
        }
      } catch (err) {
        console.warn('Koneksi GAS gagal, menampilkan data tersimpan:', err?.message);
        setIsOnline(false);
      } finally {
        if (isBg) {
          setIsSyncingBackground(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [selectedMonth, selectedYear]
  );

  // Ambil data saat pertama dibuka
  useEffect(() => {
    fetchDashboard(initialPeriod.bulan, initialPeriod.tahun, { background: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ganti periode bulan/tahun
  const handleChangePeriod = (bulan, tahun = selectedYear) => {
    setSelectedMonth(bulan);
    setSelectedYear(Number(tahun) || 2026);
    fetchDashboard(bulan, Number(tahun) || 2026, { background: false });
  };

  // Formatter seragam "No. XX / Nama Warga"
  const formatHouseIdentity = useCallback(
    (houseOrId) => {
      if (!houseOrId || houseOrId === '-') return '-';
      const houses = dashboardData.houses || FALLBACK_HOUSES;

      if (typeof houseOrId === 'object') {
        const digits = String(houseOrId.nomor_rumah || houseOrId.id || '').replace(/[^0-9]/g, '');
        const cleanNum = digits ? digits.padStart(2, '0') : '--';
        const name = String(houseOrId.nama_warga || houseOrId.nama_kepala_keluarga || 'Warga').trim();
        return `No. ${cleanNum} / ${name}`;
      }

      const raw = String(houseOrId).trim();
      const digits = raw.replace(/[^0-9]/g, '');
      const cleanNum = digits ? digits.padStart(2, '0') : '';
      const matched = houses.find(
        (h) =>
          String(h.id || '').toUpperCase() === raw.toUpperCase() ||
          (cleanNum && String(h.nomor_rumah || '').replace(/[^0-9]/g, '').padStart(2, '0') === cleanNum)
      );

      if (matched) {
        const num = String(matched.nomor_rumah || matched.id || '').replace(/[^0-9]/g, '').padStart(2, '0');
        const name = String(matched.nama_warga || matched.nama_kepala_keluarga || 'Warga').trim();
        return `No. ${num} / ${name}`;
      }
      return raw;
    },
    [dashboardData.houses]
  );

  // Hitung badge jumlah Paket Menunggu di Pos & Warga Menunggu Validasi
  const waitingPackagesCount = useMemo(() => {
    const logs = Array.isArray(dashboardData.security_logs) ? dashboardData.security_logs : [];
    return logs.filter(
      (l) =>
        l.kategori_laporan === 'PAKET_SURAT' &&
        !String(l.sub_kategori || '').toLowerCase().includes('sudah')
    ).length;
  }, [dashboardData.security_logs]);

  const pendingValidationCount = useMemo(() => {
    const iplList = Array.isArray(dashboardData.ipl_status) ? dashboardData.ipl_status : [];
    return iplList.filter((row) => {
      const st = String(row.status_bayar || row.status || '').toLowerCase();
      return st.includes('menunggu') || st.includes('pending') || st.includes('validasi');
    }).length;
  }, [dashboardData.ipl_status]);

  const isBackendOutdated = useMemo(
    () => Boolean(hasServerData && backendVersion && isVersionOlderThan(backendVersion, '6.3')),
    [hasServerData, backendVersion]
  );

  const gasUrlPreview = useMemo(() => resolveGasUrlPreview(), []);

  /* ==========================================================================
   * HANDLER NAVIGASI & AKSI PUBLIK / PENGURUS (NON-BLOCKING BACKGROUND SYNC)
   * ========================================================================== */

  const handleSelectTab = (tabId) => {
    setIsAdminViewActive(false);
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenQris = (house = null) => {
    setQrisPreselectedHouse(house || null);
    setIsQrisModalOpen(true);
  };

  const handleOpenAdmin = () => {
    if (isAdminLoggedIn) {
      setIsAdminViewActive(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setAuthError('');
      setIsLoginSheetOpen(true);
    }
  };

  const handleAdminLogin = async (username, password) => {
    setAuthError('');
    setIsLoggingIn(true);
    try {
      const res = await CMoneyAPI.loginPengurus(username, password);
      if (res && res.status === 'success') {
        if (res.user?.session_token) {
          localStorage.setItem('cmoney_pengurus_token', res.user.session_token);
        }
        setIsAdminLoggedIn(true);
        setIsLoginSheetOpen(false);
        setIsAdminViewActive(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setAuthError(res?.message || 'Username atau password pengurus salah.');
      }
    } catch (err) {
      setAuthError(err?.message || 'Gagal terhubung ke server login.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogoutAdmin = () => {
    localStorage.removeItem('cmoney_pengurus_token');
    setIsAdminLoggedIn(false);
    setIsAdminViewActive(false);
    setActiveTab('beranda');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Simpan Mutasi Kas Pengurus -> Konfirmasi server dulu, lalu sinkronisasi latar (Non-Blocking)
  const handleSaveTransaction = async (txPayload) => {
    const enriched = {
      ...txPayload,
      nominal: Number(txPayload.nominal || 0),
      expect_photo: Boolean(txPayload.file_base64)
    };
    const res = await CMoneyAPI.inputTransaction(enriched);
    if (res && res.status === 'success') {
      if (res.new_balance !== undefined) {
        setDashboardData((prev) => ({ ...prev, current_balance: Number(res.new_balance) }));
      }
      fetchDashboard(selectedMonth, selectedYear, { background: true });
    }
    return res;
  };

  // Validasi Lunas Warga Pengurus -> Konfirmasi server dulu, lalu sinkronisasi latar (Non-Blocking)
  const handleValidateIpl = async (iplPayload) => {
    const statusFinal = iplPayload.status_bayar || iplPayload.status || 'Lunas';
    const nominalFinal = Number(iplPayload.nominal || iplPayload.nominal_ipl || 200000);
    const enriched = {
      ...iplPayload,
      status_bayar: statusFinal,
      status: statusFinal,
      nominal: nominalFinal,
      nominal_ipl: nominalFinal,
      expect_photo: Boolean(iplPayload.file_base64)
    };
    const res = await CMoneyAPI.updateIplStatus(enriched);
    if (res && res.status === 'success') {
      if (res.new_balance !== undefined) {
        setDashboardData((prev) => ({ ...prev, current_balance: Number(res.new_balance) }));
      }
      fetchDashboard(selectedMonth, selectedYear, { background: true });
    }
    return res;
  };

  // Tutup Buku & Kirim WA via Fonnte
  const handleCloseMonthWa = async (bulan, tahun, targetWa = '') => {
    const res = await CMoneyAPI.closeMonthAndSendWa(bulan, tahun, targetWa);
    if (res && res.status === 'success') {
      fetchDashboard(selectedMonth, selectedYear, { background: true });
    }
    return res;
  };

  // Konfirmasi Bayar QRIS Warga (Foto Opsional + Fail-Safe)
  const handleUploadQrisProof = async (proofPayload) => {
    const nominalFinal = Number(proofPayload.nominal || proofPayload.nominal_bayar || 200000);
    const enriched = {
      ...proofPayload,
      nominal: nominalFinal,
      nominal_total: nominalFinal,
      paket_bayar: proofPayload.paket_pembayaran || 'IPL Saja',
      expect_photo: Boolean(proofPayload.file_base64)
    };
    const res = await CMoneyAPI.uploadIplProof(enriched);
    if (res && res.status === 'success') {
      fetchDashboard(selectedMonth, selectedYear, { background: true });
    }
    return res;
  };

  // Laporan Pos / Absensi / Paket Security (Termasuk Multi-Foto & SecurityAttendanceCard)
  const handleInputSecurityLog = async (logPayload) => {
    const res = await CMoneyAPI.inputSecurityLog(logPayload);
    if (res && res.status === 'success') {
      fetchDashboard(selectedMonth, selectedYear, { background: true });
    }
    return res;
  };

  // Update Denah 6 Slot Parkir oleh Security
  const handleUpdateParkingSlot = async (slotPayload) => {
    if (typeof CMoneyAPI.updateParkingSlot !== 'function') {
      return { status: 'error', message: 'Fungsi updateParkingSlot belum tersedia di apiService.' };
    }
    const res = await CMoneyAPI.updateParkingSlot(slotPayload);
    if (res && res.status === 'success') {
      fetchDashboard(selectedMonth, selectedYear, { background: true });
    }
    return res;
  };

  /* ==========================================================================
   * IN-APP LIGHTBOX SLIDER MULTI-FOTO (SWIPE HP + KEYBOARD DESKTOP + THUMBNAIL)
   * ========================================================================== */

  const openLightbox = useCallback((urlOrUrls, title = 'Bukti Lampiran', subtitle = '', initialIndex = 0) => {
    let list = [];
    if (Array.isArray(urlOrUrls)) {
      list = urlOrUrls.filter((u) => u && u !== '-');
    } else if (typeof urlOrUrls === 'string' && urlOrUrls !== '-') {
      list = urlOrUrls
        .split('|')
        .map((u) => u.trim())
        .filter((u) => u && u !== '-');
    }
    if (list.length === 0) return;

    const safeIndex = Math.max(0, Math.min(Number(initialIndex) || 0, list.length - 1));
    setLightbox({
      isOpen: true,
      urls: list,
      index: safeIndex,
      title: title || 'Pratinjau Foto',
      subtitle: subtitle || '',
      fallbackMap: {}
    });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const stepLightbox = useCallback((delta) => {
    setLightbox((prev) => {
      if (!prev.urls.length) return prev;
      const nextIdx = (prev.index + delta + prev.urls.length) % prev.urls.length;
      return { ...prev, index: nextIdx };
    });
  }, []);

  // Navigasi Keyboard untuk Lightbox di Desktop
  useEffect(() => {
    if (!lightbox.isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight' && lightbox.urls.length > 1) stepLightbox(1);
      if (e.key === 'ArrowLeft' && lightbox.urls.length > 1) stepLightbox(-1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightbox.isOpen, lightbox.urls.length, closeLightbox, stepLightbox]);

  const activeLightboxRawUrl = lightbox.urls[lightbox.index] || '';
  const activeLightboxSrc = toDirectImageUrl(
    activeLightboxRawUrl,
    Boolean(lightbox.fallbackMap[lightbox.index])
  );

  return (
    <>
      <AppShellNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenQris={handleOpenQris}
        onOpenAdmin={handleOpenAdmin}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefresh={() => fetchDashboard(selectedMonth, selectedYear, { background: false })}
        isRefreshing={isRefreshing || isSyncingBackground}
        isOnline={isOnline}
        isAdminLoggedIn={isAdminLoggedIn}
        isAdminViewActive={isAdminViewActive}
        backendVersion={backendVersion}
        expectedBackendVersion={EXPECTED_BACKEND_VERSION}
        isBackendOutdated={isBackendOutdated}
        liveClock={liveClock}
        lastSyncTime={lastSyncTime}
        packageCount={waitingPackagesCount}
        pendingValidationCount={pendingValidationCount}
        logoUrl={dashboardData.logo_url || '/assets/logo-cmoney.png'}
        appName={dashboardData.app_name || 'C-Money'}
        clusterSubtitle="Mutiara Residence"
      >
        {isAdminViewActive && isAdminLoggedIn ? (
          <AdminWorkspace
            dashboardData={dashboardData}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onChangePeriod={handleChangePeriod}
            onBackToHome={() => {
              setIsAdminViewActive(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLogout={handleLogoutAdmin}
            onSaveTransaction={handleSaveTransaction}
            onValidateIpl={handleValidateIpl}
            onCloseMonthWa={handleCloseMonthWa}
            onRefresh={() => fetchDashboard(selectedMonth, selectedYear, { background: false })}
            onOpenLightbox={openLightbox}
            onOpenPwaInstall={() => setIsPwaSheetOpen(true)}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            isRefreshing={isRefreshing}
            isSyncingBackground={isSyncingBackground}
            isOnline={isOnline}
            backendVersion={backendVersion || EXPECTED_BACKEND_VERSION}
            expectedBackendVersion={EXPECTED_BACKEND_VERSION}
            isBackendOutdated={isBackendOutdated}
            gasUrlPreview={gasUrlPreview}
            lastSyncTime={lastSyncTime}
            logoUrl={dashboardData.logo_url || '/assets/logo-cmoney.png'}
          />
        ) : (
          <PublicDashboard
            data={dashboardData}
            hasServerData={hasServerData}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onChangePeriod={handleChangePeriod}
            activeTab={activeTab}
            setActiveTab={handleSelectTab}
            onOpenQris={handleOpenQris}
            onOpenAdmin={handleOpenAdmin}
            onInputSecurityLog={handleInputSecurityLog}
            onUpdateParkingSlot={handleUpdateParkingSlot}
            onOpenLightbox={openLightbox}
            onOpenPwaInstall={() => setIsPwaSheetOpen(true)}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            onOpenGuide={(tab = 'cara_pakai') =>
              setGuideSheet({ isOpen: true, initialTab: tab })
            }
            isPwaInstalled={isPwaInstalled}
            formatHouseIdentity={formatHouseIdentity}
          />
        )}
      </AppShellNav>

      {/* BOTTOM SHEET / MODAL BAYAR QRIS WARGA */}
      <QrisPaymentModal
        isOpen={isQrisModalOpen}
        onClose={() => {
          setIsQrisModalOpen(false);
          setQrisPreselectedHouse(null);
        }}
        houses={dashboardData.houses || FALLBACK_HOUSES}
        selectedHouse={qrisPreselectedHouse}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        defaultIplAmount={dashboardData.default_ipl_amount || 200000}
        cutoffDay={
          dashboardData.parking_config?.cutoff_day_ipl ||
          dashboardData.smart_period?.cutoff_day ||
          25
        }
        qrisImageUrl={dashboardData.qris_image_url || '/assets/qris-cmr-statis.png'}
        qrisMerchantName={dashboardData.qris_merchant_name || 'Cluster Mutiara Residence'}
        qrisNmid={dashboardData.qris_nmid || 'ID1026000000CMR'}
        logoUrl={dashboardData.logo_url || '/assets/logo-cmoney.png'}
        onSubmitProof={handleUploadQrisProof}
        onOpenLightbox={openLightbox}
      />

      {/* BOTTOM SHEET / MODAL LOGIN PENGURUS */}
      <AdminLoginSheet
        isOpen={isLoginSheetOpen}
        onClose={() => {
          setIsLoginSheetOpen(false);
          setAuthError('');
        }}
        onSubmitLogin={handleAdminLogin}
        isSubmitting={isLoggingIn}
        authError={authError}
        logoUrl={dashboardData.logo_url || '/assets/logo-cmoney.png'}
      />

      {/* BOTTOM SHEET PANDUAN & INSTALASI PWA UNIVERSAL (ANDROID & IOS) */}
      <PwaInstallSheet
        isOpen={isPwaSheetOpen}
        onClose={() => setIsPwaSheetOpen(false)}
        deferredPrompt={deferredPwaPrompt}
        onTriggerNativeInstall={handleTriggerNativePwaInstall}
        isInstalled={isPwaInstalled}
        logoUrl={dashboardData.logo_url || '/assets/logo-cmoney.png'}
      />
      
      {/* BOTTOM SHEET PENGATURAN WARGA (DIKLIK DARI IKON GEAR) */}
      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenGuide={(tab = 'cara_pakai') =>
          setGuideSheet({ isOpen: true, initialTab: tab })
        }
        onOpenPwaInstall={() => setIsPwaSheetOpen(true)}
        isPwaInstalled={isPwaInstalled}
        isOnline={isOnline}
        backendVersion={backendVersion || EXPECTED_BACKEND_VERSION}
        lastSyncTime={lastSyncTime}
        logoUrl={dashboardData.logo_url || '/assets/logo-cmoney.png'}
      />

      {/* BOTTOM SHEET PUSAT PANDUAN & FAQ (4 TAB) */}
      <GuideCenterSheet
        isOpen={guideSheet.isOpen}
        initialTab={guideSheet.initialTab}
        onClose={() => setGuideSheet((prev) => ({ ...prev, isOpen: false }))}
        onOpenPwaInstall={() => setIsPwaSheetOpen(true)}
        onToggleDarkMode={handleToggleDarkMode}
        isDarkMode={isDarkMode}
        isPwaInstalled={isPwaInstalled}
      />
      
      {/* ====================================================================
          IN-APP LIGHTBOX SLIDER MULTI-FOTO (SOFT-SLATE BLUR + RAMAH SENIOR)
      ==================================================================== */}
      {lightbox.isOpen && (
        <div
          onClick={closeLightbox}
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.86)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
          className="fixed inset-0 z-[70] flex flex-col justify-between p-3 sm:p-5 animate-fade-in"
        >
          {/* Bar Atas Lightbox — Kontras Jelas & Tombol "✕ Tutup" Mudah Dilihat */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.88)' }}
            className="max-w-4xl w-full mx-auto rounded-2xl border border-white/15 px-3.5 py-2.5 flex items-center justify-between gap-3 text-white shadow-lg"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm font-extrabold truncate text-white">
                  {lightbox.title}
                </p>
                {lightbox.urls.length > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black shrink-0">
                    {lightbox.index + 1} / {lightbox.urls.length}
                  </span>
                )}
              </div>
              {lightbox.subtitle && (
                <p className="text-[11px] text-slate-300 truncate mt-0.5">{lightbox.subtitle}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeLightboxRawUrl && !activeLightboxRawUrl.startsWith('data:image') && (
                <a
                  href={activeLightboxRawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Buka Resolusi Penuh"
                  className="h-9 px-3 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
                >
                  <IconDownload size={15} />
                  <span className="hidden sm:inline">Asli</span>
                </a>
              )}

              <button
                type="button"
                onClick={closeLightbox}
                aria-label="Tutup Pratinjau Foto"
                className="cmoney-keep-white h-9 px-3.5 rounded-full bg-white hover:bg-slate-100 text-slate-900 text-xs font-black inline-flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
              >
                <IconClose size={15} />
                <span>Tutup</span>
              </button>
            </div>
          </div>

          {/* Area Gambar Utama (Mendukung Swipe Kanan/Kiri di HP) */}
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              touchStartXRef.current = e.touches?.[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              if (touchStartXRef.current === null || lightbox.urls.length <= 1) return;
              const endX = e.changedTouches?.[0]?.clientX ?? touchStartXRef.current;
              const diff = endX - touchStartXRef.current;
              if (diff > 45) stepLightbox(-1);
              else if (diff < -45) stepLightbox(1);
              touchStartXRef.current = null;
            }}
            className="flex-1 my-3 flex items-center justify-center relative max-w-4xl w-full mx-auto min-h-0"
          >
            {lightbox.urls.length > 1 && (
              <button
                type="button"
                onClick={() => stepLightbox(-1)}
                aria-label="Foto sebelumnya"
                style={{ backgroundColor: 'rgba(15, 23, 42, 0.78)' }}
                className="absolute left-1 sm:left-2 z-10 w-10 h-10 rounded-full border border-white/25 text-white hover:scale-105 flex items-center justify-center shadow-lg transition cursor-pointer"
              >
                <IconArrowLeft size={18} />
              </button>
            )}

            <img
              key={`${lightbox.index}-${lightbox.fallbackMap[lightbox.index] ? 'fb' : 'main'}`}
              src={activeLightboxSrc}
              alt={lightbox.title}
              onError={() => {
                if (!lightbox.fallbackMap[lightbox.index]) {
                  setLightbox((prev) => ({
                    ...prev,
                    fallbackMap: { ...prev.fallbackMap, [prev.index]: true }
                  }));
                }
              }}
              className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl ring-1 ring-white/20 select-none"
            />

            {lightbox.urls.length > 1 && (
              <button
                type="button"
                onClick={() => stepLightbox(1)}
                aria-label="Foto berikutnya"
                style={{ backgroundColor: 'rgba(15, 23, 42, 0.78)' }}
                className="absolute right-1 sm:right-2 z-10 w-10 h-10 rounded-full border border-white/25 text-white hover:scale-105 flex items-center justify-center shadow-lg transition cursor-pointer"
              >
                <IconChevronRight size={20} />
              </button>
            )}
          </div>

          {/* Bagian Bawah: Strip Thumbnail & Petunjuk Keluar Ramah Orang Tua */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            className="max-w-4xl w-full mx-auto flex flex-col items-center gap-2"
          >
            {lightbox.urls.length > 1 && (
              <div
                style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}
                className="flex items-center justify-center gap-2 overflow-x-auto px-3 py-2 rounded-2xl border border-white/15 max-w-full"
              >
                {lightbox.urls.map((u, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLightbox((prev) => ({ ...prev, index: idx }))}
                    className={`w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                      idx === lightbox.index
                        ? 'border-emerald-400 ring-2 ring-emerald-400/50 scale-105'
                        : 'border-white/25 opacity-65 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={toDirectImageUrl(u, true)}
                      alt={`Thumb ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <p className="text-[11px] font-semibold text-slate-200/90 text-center">
              {lightbox.urls.length > 1
                ? 'Geser foto ke kanan/kiri • Ketuk tombol Tutup atau area luar untuk kembali'
                : 'Ketuk tombol Tutup atau area luar gambar untuk kembali'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
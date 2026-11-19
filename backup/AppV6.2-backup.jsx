import React, { useState, useEffect, useCallback, useRef } from 'react';
import PublicDashboard from './components/PublicDashboard';
import QrisPaymentModal from './components/QrisPaymentModal';
import { CMoneyAPI, compressImageToBase64 } from './services/apiService';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Helper V6.2: Penentu Otomatis Periode Buku berdasarkan Cut-Off Tanggal 25
 * Tanggal 1-24 -> Bulan Berjalan | Tanggal 25-31 -> Bulan Berikutnya
 */
function getSmartPeriod(cutoffDay = 25) {
  const now = new Date();
  const day = now.getDate();
  let monthIndex = now.getMonth();
  let year = now.getFullYear();

  const calendarMonth = MONTH_NAMES[monthIndex];
  const calendarYear = year;

  if (day >= Number(cutoffDay || 25)) {
    monthIndex += 1;
    if (monthIndex > 11) {
      monthIndex = 0;
      year += 1;
    }
  }

  return {
    bookMonth: MONTH_NAMES[monthIndex],
    bookYear: year,
    calendarMonth,
    calendarYear,
    isAfterCutoff: day >= Number(cutoffDay || 25),
    cutoffDay: Number(cutoffDay || 25)
  };
}

/**
 * Helper V6.2: Konversi URL Google Drive menjadi Direct Image URL untuk In-App Lightbox
 */
export function getDirectDriveImageUrl(url) {
  if (!url || url === '-' || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('data:image') || trimmed.startsWith('/assets/')) {
    return trimmed;
  }
  const matchId =
    trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);

  if (matchId && matchId[1]) {
    return `https://drive.google.com/thumbnail?id=${matchId[1]}&sz=w1200`;
  }
  return trimmed;
}

/**
 * Helper V6.2: Ekstrak Daftar URL Foto (Mendukung String Tunggal, Pemisah " | ", maupun Array)
 */
export function parseLightboxPhotos(urlOrUrls) {
  if (!urlOrUrls) return [];
  const rawItems = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
  const flattened = [];

  rawItems.forEach((item) => {
    if (!item || typeof item !== 'string') return;
    item
      .split('|')
      .map((part) => part.trim())
      .filter((part) => part && part !== '-')
      .forEach((cleanUrl) => {
        flattened.push({
          rawUrl: cleanUrl,
          imageUrl: getDirectDriveImageUrl(cleanUrl)
        });
      });
  });

  return flattened;
}

/**
 * Helper V6.2: Ekstrak 2 Digit Nomor Rumah Murni (Anti-Bug "No. No. 01")
 */
export function extractCleanHouseNum(rawVal) {
  const digits = String(rawVal || '').replace(/[^0-9]/g, '');
  return digits ? digits.padStart(2, '0') : '';
}

/**
 * Data Cadangan (Fallback) 22 Unit Rumah CMR — 100% Sesuai Sheet `houses` CMR_Database_Master
 */
const FALLBACK_HOUSES = [
  { id: 'H-01', nomor_rumah: '01', nama_warga: 'Pak Suharso', nama_kepala_keluarga: 'Pak Suharso', alias_keluarga: 'Pak Suharso / Ibu Aira', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-02', nomor_rumah: '02', nama_warga: 'Pak Refza', nama_kepala_keluarga: 'Pak Refza', alias_keluarga: 'Pak Refza / Ibu Ulfa', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-03', nomor_rumah: '03', nama_warga: 'Pak Upen', nama_kepala_keluarga: 'Pak Upen', alias_keluarga: 'Pak Upen', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-04', nomor_rumah: '04', nama_warga: 'Dijual', nama_kepala_keluarga: 'Dijual', alias_keluarga: 'Unit Kosong - Dijual Pihak BPR', status_huni: 'Tidak Aktif', tarif_ipl: 0 },
  { id: 'H-05', nomor_rumah: '05', nama_warga: 'Pak Anggi', nama_kepala_keluarga: 'Pak Anggi', alias_keluarga: 'Pak Anggi / Ibu Siti / Abang Rafa', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-06', nomor_rumah: '06', nama_warga: 'Pak Andy', nama_kepala_keluarga: 'Pak Andy', alias_keluarga: 'Pak Andi / Ibu Santi', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-07', nomor_rumah: '07', nama_warga: 'Pak Romy', nama_kepala_keluarga: 'Pak Romy', alias_keluarga: 'Pak Romy', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-08', nomor_rumah: '08', nama_warga: 'Pak Sony', nama_kepala_keluarga: 'Pak Sony', alias_keluarga: 'Pak Sonny Ilham / Ibu Uci', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-09', nomor_rumah: '09', nama_warga: 'Pak Robi', nama_kepala_keluarga: 'Pak Robi', alias_keluarga: 'Pak Robi / Ibu Fitri / Kakak Aca', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-10', nomor_rumah: '10', nama_warga: 'Pak Ridick', nama_kepala_keluarga: 'Pak Ridick', alias_keluarga: 'Pak Ridick / Ibu Naufal', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-11', nomor_rumah: '11', nama_warga: 'Pak Zakaria', nama_kepala_keluarga: 'Pak Zakaria', alias_keluarga: 'Bang Jak / Ibu Sari', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-12', nomor_rumah: '12', nama_warga: 'Pak Kiswanto', nama_kepala_keluarga: 'Pak Kiswanto', alias_keluarga: 'Pak Kis / Ibu Ayu', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-13', nomor_rumah: '13', nama_warga: 'Pak Hery', nama_kepala_keluarga: 'Pak Hery', alias_keluarga: 'Pak Hery / Ibu Dewi', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-14', nomor_rumah: '14', nama_warga: 'Pak Dwi', nama_kepala_keluarga: 'Pak Dwi', alias_keluarga: 'Pak Dwi / Ibu Tuti', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-15', nomor_rumah: '15', nama_warga: 'Pak Juhairi', nama_kepala_keluarga: 'Pak Juhairi', alias_keluarga: 'Pak Juhairi', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-16', nomor_rumah: '16', nama_warga: 'Pak Baim', nama_kepala_keluarga: 'Pak Baim', alias_keluarga: 'Pak Baim', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-17', nomor_rumah: '17', nama_warga: 'Pak Yose', nama_kepala_keluarga: 'Pak Yose', alias_keluarga: 'Pak Yose / Ibu Reza', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-18', nomor_rumah: '18', nama_warga: 'Pak Jihad', nama_kepala_keluarga: 'Pak Jihad', alias_keluarga: 'Pak Jihad / Ibu Retno', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-19', nomor_rumah: '19', nama_warga: 'Pak Jacob', nama_kepala_keluarga: 'Pak Jacob', alias_keluarga: 'Opa Jacob', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-20', nomor_rumah: '20', nama_warga: 'Pak Ramon', nama_kepala_keluarga: 'Pak Ramon', alias_keluarga: 'Pak Ramon / Ibu Yuska / Abang Rasya', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-21', nomor_rumah: '21', nama_warga: 'Pak Suwandi', nama_kepala_keluarga: 'Pak Suwandi', alias_keluarga: 'Pak Suwandi / Ibu Maria', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-22', nomor_rumah: '22', nama_warga: 'Pak Baim', nama_kepala_keluarga: 'Pak Baim', alias_keluarga: 'Pak Baim', status_huni: 'Aktif', tarif_ipl: 200000 }
];

/**
 * Helper V6.2: Standarisasi Format "No. XX / Nama Warga" (Anti-Bug "No. No." & "undefined")
 */
export function formatHouseIdentity(houseOrId, housesList = FALLBACK_HOUSES) {
  if (!houseOrId || houseOrId === '-') return '-';

  const list = Array.isArray(housesList) && housesList.length > 0 ? housesList : FALLBACK_HOUSES;

  if (typeof houseOrId === 'object') {
    const num = extractCleanHouseNum(houseOrId.nomor_rumah || houseOrId.id) || '00';
    const name = String(
      houseOrId.nama_warga || houseOrId.nama_kepala_keluarga || 'Warga'
    ).trim();
    return `No. ${num} / ${name}`;
  }

  const raw = String(houseOrId).trim();
  const cleanNum = extractCleanHouseNum(raw);

  const matched = list.find(
    (h) =>
      String(h.id || '').toUpperCase() === raw.toUpperCase() ||
      (cleanNum && extractCleanHouseNum(h.nomor_rumah || h.id) === cleanNum)
  );

  if (matched) {
    const num = extractCleanHouseNum(matched.nomor_rumah || matched.id) || cleanNum || '00';
    const name = String(matched.nama_warga || matched.nama_kepala_keluarga || 'Warga').trim();
    return `No. ${num} / ${name}`;
  }

  return raw;
}

/**
 * Normalisasi seluruh array rumah dari Backend agar properti selalu konsisten
 */
function normalizeHousesArray(rawHouses) {
  const source = Array.isArray(rawHouses) && rawHouses.length > 0 ? rawHouses : FALLBACK_HOUSES;
  return source
    .map((h) => {
      const cleanNum = extractCleanHouseNum(h.nomor_rumah || h.id) || '00';
      const fallbackMatch = FALLBACK_HOUSES.find(
        (fb) => fb.nomor_rumah === cleanNum || fb.id === h.id
      );
      const cleanName = String(
        h.nama_warga ||
          h.nama_kepala_keluarga ||
          fallbackMatch?.nama_warga ||
          'Warga'
      ).trim();

      return {
        ...h,
        id: h.id || `H-${cleanNum}`,
        nomor_rumah: cleanNum,
        nama_warga: cleanName,
        nama_kepala_keluarga: cleanName,
        alias_keluarga: h.alias_keluarga || fallbackMatch?.alias_keluarga || cleanName,
        display_label: `No. ${cleanNum} / ${cleanName}`
      };
    })
    .sort((a, b) => Number(a.nomor_rumah) - Number(b.nomor_rumah));
}

/**
 * Pilihan Paket Pembayaran Netral V6.2 (100% Uang Kas Nyata)
 */
const PAYMENT_PACKAGES_V6 = [
  {
    id: 'IPL_ONLY',
    label: 'IPL Saja (Rp 200.000)',
    nominal: 200000,
    kategoriKas: 'Iuran Warga (IPL)',
    catatanDefault: 'Lunas IPL Bulanan (Rp 200.000)'
  },
  {
    id: 'IPL_PARKIR_1',
    label: 'IPL + Parkir 1 Mobil (Rp 350.000)',
    nominal: 350000,
    kategoriKas: 'Iuran Warga (IPL) & Parkir Fasum',
    catatanDefault: 'Lunas IPL Rp 200.000 + Parkir 1 Mobil Rp 150.000'
  },
  {
    id: 'IPL_PARKIR_2',
    label: 'IPL + Parkir 2 Mobil (Rp 500.000)',
    nominal: 500000,
    kategoriKas: 'Iuran Warga (IPL) & Parkir Fasum',
    catatanDefault: 'Lunas IPL Rp 200.000 + Parkir 2 Mobil Rp 300.000'
  },
  {
    id: 'IPL_PARKIR_WEEKEND',
    label: 'IPL + Parkir Weekend (Rp 250.000)',
    nominal: 250000,
    kategoriKas: 'Iuran Warga (IPL) & Parkir Fasum',
    catatanDefault: 'Lunas IPL Rp 200.000 + Parkir Weekend Rp 50.000'
  },
  {
    id: 'PARKIR_1_ONLY',
    label: 'Khusus Parkir 1 Mobil Saja (Rp 150.000)',
    nominal: 150000,
    kategoriKas: 'Parkir Fasum',
    catatanDefault: 'Lunas Parkir 1 Mobil (Rp 150.000)'
  },
  {
    id: 'CUSTOM',
    label: 'Nominal Lainnya (Sesuai Uang Riil Masuk)',
    nominal: 200000,
    kategoriKas: 'Iuran Warga (IPL)',
    catatanDefault: 'Pembayaran Kas Warga'
  }
];

export default function App() {
  const smartPeriod = getSmartPeriod(25);

  // State Utama Dashboard & Periode
  const [selectedMonth, setSelectedMonth] = useState(smartPeriod.bookMonth);
  const [selectedYear, setSelectedYear] = useState(smartPeriod.bookYear);
  const [activeTab, setActiveTab] = useState('beranda');
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Indikator Koneksi & Jam Real-Time
  const [liveClock, setLiveClock] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [hasServerData, setHasServerData] = useState(false);

  // Modal QRIS Warga
  const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);
  const [selectedHouseForQris, setSelectedHouseForQris] = useState(null);

  // Modal In-App Lightbox V6.2 (Slider Multi-Foto + Swipe HP + Keyboard)
  const [lightboxState, setLightboxState] = useState(null);
  const touchStartXRef = useRef(null);

  // State Login & Panel Pengurus
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    Boolean(localStorage.getItem('cmoney_pengurus_token'))
  );
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [adminUser, setAdminUser] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [adminActiveSection, setAdminActiveSection] = useState('mutasi');
  const [adminStatusMsg, setAdminStatusMsg] = useState({ type: '', text: '' });
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  // State Kompresi Foto Fail-Safe Pengurus
  const [isCompressingTxPhoto, setIsCompressingTxPhoto] = useState(false);
  const [txPhotoError, setTxPhotoError] = useState('');
  const [isCompressingIplPhoto, setIsCompressingIplPhoto] = useState(false);
  const [iplPhotoError, setIplPhotoError] = useState('');

  // State Form 1: Input Mutasi Kas (Uang Nyata)
  const [txForm, setTxForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    periode_bulan: smartPeriod.calendarMonth,
    periode_tahun: smartPeriod.calendarYear,
    tipe: 'OUT',
    kategori: 'Perawatan Pos',
    nominal: '',
    keterangan: '',
    house_id: '-',
    is_proyek: false,
    nama_proyek: '',
    file_base64: '',
    file_name: ''
  });

  // State Form 2: Validasi Lunas IPL & Parkir Warga
  const [iplForm, setIplForm] = useState({
    house_id: 'H-01',
    periode_bulan: smartPeriod.bookMonth,
    periode_tahun: smartPeriod.bookYear,
    status_bayar: 'Lunas',
    paket_id: 'IPL_ONLY',
    nominal_bayar: 200000,
    auto_jurnal_kas: true,
    tanggal_bayar: new Date().toISOString().slice(0, 10),
    catatan: 'Lunas IPL Bulanan (Rp 200.000)',
    file_base64: '',
    file_name: ''
  });

  // State Form 3: Tutup Buku WA & Gaji Security
  const [closingForm, setClosingForm] = useState({
    periode_bulan: smartPeriod.calendarMonth,
    periode_tahun: smartPeriod.calendarYear,
    target_wa: ''
  });

  const [payrollForm, setPayrollForm] = useState({
    nama_security: 'Pak Eko',
    periode_bulan: smartPeriod.calendarMonth,
    periode_tahun: smartPeriod.calendarYear,
    gaji_pokok: 1650000,
    uang_konsumsi: 0,
    potongan_kasbon: 0,
    catatan: ''
  });

  // Detak Tanggal & Jam Detik Real-Time WIB
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const tgl = now.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const jam = now
        .toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
        .replace(/\./g, ':');
      setLiveClock(`${tgl} • ${jam} WIB`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Navigasi Keyboard untuk Lightbox Slider (Panah Kiri/Kanan & Esc)
  useEffect(() => {
    if (!lightboxState) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightboxState(null);
      } else if (e.key === 'ArrowRight' && lightboxState.photos.length > 1) {
        setLightboxState((prev) =>
          prev
            ? { ...prev, activeIndex: (prev.activeIndex + 1) % prev.photos.length }
            : null
        );
      } else if (e.key === 'ArrowLeft' && lightboxState.photos.length > 1) {
        setLightboxState((prev) =>
          prev
            ? {
                ...prev,
                activeIndex: (prev.activeIndex - 1 + prev.photos.length) % prev.photos.length
              }
            : null
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxState]);

  // Ambil Data dari Backend Google Apps Script
  const fetchDashboard = useCallback(
    async (bulan = selectedMonth, tahun = selectedYear, silent = false) => {
      if (!silent) setIsLoading(true);
      setIsRefreshing(true);
      try {
        const res = await CMoneyAPI.getPublicDashboard(bulan, tahun);
        if (res && res.status === 'success') {
          const normalizedHouses = normalizeHousesArray(res.houses);

          setDashboardData({
            ...res,
            houses: normalizedHouses
          });
          setIsOnline(true);
          setHasServerData(true);
          const syncNow = new Date()
            .toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })
            .replace(/\./g, ':');
          setLastSyncTime(`${syncNow} WIB`);
        }
      } catch (err) {
        console.warn('Menggunakan data cadangan lokal:', err.message);
        setIsOnline(false);
        setDashboardData((prev) =>
          prev || {
            status: 'success',
            backend_version: 'offline',
            app_name: 'C-Money',
            cluster_full_name: 'Cluster Mutiara Residence Sumberjaya',
            logo_url: '/assets/logo-cmoney.png',
            current_balance: 1394200,
            default_ipl_amount: 200000,
            total_houses: 22,
            total_active_houses: 21,
            houses: normalizeHousesArray(FALLBACK_HOUSES),
            ipl_status: [],
            cash_ledger: [],
            monthly_closings: [],
            security_payroll: [],
            security_schedules: [],
            security_logs: [],
            parking_slots: []
          }
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedMonth, selectedYear]
  );

  useEffect(() => {
    fetchDashboard(selectedMonth, selectedYear);
  }, [fetchDashboard, selectedMonth, selectedYear]);

  // Daftar Rumah yang Sudah Diseragamkan ("No. XX / Nama Warga")
  const housesList = dashboardData?.houses || normalizeHousesArray(FALLBACK_HOUSES);
  const activeHousesList = housesList.filter(
    (h) => String(h.status_huni || 'Aktif').toLowerCase() !== 'tidak aktif' && h.id !== 'H-04'
  );

  // Buka Pop-up Slider Lightbox Multi-Foto (Mendukung 1 URL, Pemisah " | ", maupun Array URL)
  const handleOpenLightbox = (
    urlOrUrls,
    title = 'Bukti Transaksi / Foto',
    subtitle = '',
    initialIndex = 0
  ) => {
    const photos = parseLightboxPhotos(urlOrUrls);
    if (photos.length === 0) return;
    const safeIdx = Math.max(0, Math.min(initialIndex, photos.length - 1));
    setLightboxState({
      photos,
      activeIndex: safeIdx,
      title,
      subtitle
    });
  };

  // Navigasi Slide Lightbox
  const handlePrevLightbox = () => {
    setLightboxState((prev) =>
      prev
        ? { ...prev, activeIndex: (prev.activeIndex - 1 + prev.photos.length) % prev.photos.length }
        : null
    );
  };

  const handleNextLightbox = () => {
    setLightboxState((prev) =>
      prev ? { ...prev, activeIndex: (prev.activeIndex + 1) % prev.photos.length } : null
    );
  };

  // Handler Swipe Touch di Layar HP untuk Lightbox Multi-Foto
  const handleLightboxTouchStart = (e) => {
    touchStartXRef.current = e.touches?.[0]?.clientX ?? null;
  };

  const handleLightboxTouchEnd = (e) => {
    if (touchStartXRef.current === null || !lightboxState || lightboxState.photos.length <= 1) {
      return;
    }
    const endX = e.changedTouches?.[0]?.clientX ?? null;
    if (endX === null) return;
    const deltaX = touchStartXRef.current - endX;
    if (deltaX > 45) {
      handleNextLightbox();
    } else if (deltaX < -45) {
      handlePrevLightbox();
    }
    touchStartXRef.current = null;
  };

  // Buka Pop-up QRIS Warga
  const handleOpenQris = (houseObj = null) => {
    setSelectedHouseForQris(houseObj);
    setIsQrisModalOpen(true);
  };

  // Klik Tombol Pengurus di Header
  const handleAdminButtonClick = () => {
    if (isAdminLoggedIn) {
      setIsAdminModalOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  // Proses Login Pengurus
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmittingAdmin(true);
    try {
      const res = await CMoneyAPI.loginPengurus(adminUser.username, adminUser.password);
      if (res && res.status === 'success') {
        setIsAdminLoggedIn(true);
        setIsLoginModalOpen(false);
        setIsAdminModalOpen(true);
      } else {
        setLoginError(res?.message || 'Username atau password salah.');
      }
    } catch (err) {
      setLoginError(`Gagal terhubung ke server: ${err.message}`);
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleLogoutAdmin = () => {
    localStorage.removeItem('cmoney_pengurus_token');
    setIsAdminLoggedIn(false);
    setIsAdminModalOpen(false);
  };

  // Handler Upload File Foto di Form 1 (Mutasi Kas — Fail-Safe)
  const handleTxPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    setTxPhotoError('');
    if (!file) {
      setTxForm((prev) => ({ ...prev, file_base64: '', file_name: '' }));
      return;
    }

    setIsCompressingTxPhoto(true);
    try {
      const base64 = await compressImageToBase64(file, 900, 0.76);
      setTxForm((prev) => ({
        ...prev,
        file_base64: base64,
        file_name: file.name
      }));
    } catch (err) {
      setTxPhotoError(err.message || 'Gagal membaca/mengompresi foto bukti. Pilih ulang foto lain.');
      setTxForm((prev) => ({ ...prev, file_base64: '', file_name: '' }));
    } finally {
      setIsCompressingTxPhoto(false);
    }
  };

  // Handler Upload File Foto di Form 2 (Validasi IPL — Fail-Safe)
  const handleIplPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    setIplPhotoError('');
    if (!file) {
      setIplForm((prev) => ({ ...prev, file_base64: '', file_name: '' }));
      return;
    }

    setIsCompressingIplPhoto(true);
    try {
      const base64 = await compressImageToBase64(file, 900, 0.76);
      setIplForm((prev) => ({
        ...prev,
        file_base64: base64,
        file_name: file.name
      }));
    } catch (err) {
      setIplPhotoError(err.message || 'Gagal membaca/mengompresi foto bukti IPL. Pilih ulang foto lain.');
      setIplForm((prev) => ({ ...prev, file_base64: '', file_name: '' }));
    } finally {
      setIsCompressingIplPhoto(false);
    }
  };

  // Perubahan Pilihan Paket Pembayaran di Form 2 Pengurus
  const handleSelectPaymentPackage = (paketId) => {
    const pkg = PAYMENT_PACKAGES_V6.find((p) => p.id === paketId) || PAYMENT_PACKAGES_V6[0];
    setIplForm((prev) => ({
      ...prev,
      paket_id: pkg.id,
      nominal_bayar: pkg.nominal,
      catatan: pkg.catatanDefault
    }));
  };

  // Submit Form 1: Simpan Mutasi Kas (Atomik / Fail-Safe)
  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    if (isCompressingTxPhoto) {
      setAdminStatusMsg({ type: 'error', text: 'Tunggu sebentar, foto bukti masih dikompresi...' });
      return;
    }
    if (txPhotoError) {
      setAdminStatusMsg({
        type: 'error',
        text: `Transaksi dibatalkan: ${txPhotoError}`
      });
      return;
    }
    if (!txForm.nominal || Number(txForm.nominal) <= 0) {
      setAdminStatusMsg({ type: 'error', text: 'Nominal transaksi wajib diisi dengan benar.' });
      return;
    }

    setIsSubmittingAdmin(true);
    setAdminStatusMsg({ type: '', text: '' });

    try {
      const houseLabel =
        txForm.house_id && txForm.house_id !== '-'
          ? formatHouseIdentity(txForm.house_id, housesList)
          : '';
      const finalKeterangan =
        houseLabel && !txForm.keterangan.includes(houseLabel)
          ? `${txForm.keterangan} (${houseLabel})`.trim()
          : txForm.keterangan;

      const hasAttachedPhoto = Boolean(txForm.file_name || txForm.file_base64);

      const res = await CMoneyAPI.inputTransaction({
        ...txForm,
        nominal: Number(txForm.nominal),
        keterangan: finalKeterangan,
        expect_photo: hasAttachedPhoto
      });

      if (res && res.status === 'success') {
        const hasSavedProof = res.url_bukti && res.url_bukti !== '-';
        setAdminStatusMsg({
          type: 'success',
          text: `Transaksi berhasil disimpan ke Buku Kas ${txForm.periode_bulan}.${
            hasSavedProof ? ' Foto bukti berhasil tersimpan di Google Drive!' : ''
          }`
        });
        setTxForm((prev) => ({
          ...prev,
          nominal: '',
          keterangan: '',
          nama_proyek: '',
          is_proyek: false,
          file_base64: '',
          file_name: ''
        }));
        setTxPhotoError('');
        await fetchDashboard(selectedMonth, selectedYear, true);
      } else {
        setAdminStatusMsg({
          type: 'error',
          text: res?.message || 'Gagal menyimpan mutasi kas. Saldo tidak berubah.'
        });
      }
    } catch (err) {
      setAdminStatusMsg({
        type: 'error',
        text: `Gagal menyimpan transaksi: ${err.message}`
      });
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // Submit Form 2: Validasi Status Lunas IPL & Parkir Warga (Atomik / Fail-Safe + Auto-Jurnal)
  const handleSubmitIplUpdate = async (e) => {
    e.preventDefault();
    if (isCompressingIplPhoto) {
      setAdminStatusMsg({ type: 'error', text: 'Tunggu sebentar, foto bukti IPL masih dikompresi...' });
      return;
    }
    if (iplPhotoError) {
      setAdminStatusMsg({
        type: 'error',
        text: `Validasi dibatalkan: ${iplPhotoError}`
      });
      return;
    }

    setIsSubmittingAdmin(true);
    setAdminStatusMsg({ type: '', text: '' });

    try {
      const houseIdentity = formatHouseIdentity(iplForm.house_id, housesList);
      const selectedPkg =
        PAYMENT_PACKAGES_V6.find((p) => p.id === iplForm.paket_id) || PAYMENT_PACKAGES_V6[0];
      const hasAttachedPhoto = Boolean(iplForm.file_name || iplForm.file_base64);

      const res = await CMoneyAPI.updateIplStatus({
        house_id: iplForm.house_id,
        periode_bulan: iplForm.periode_bulan,
        periode_tahun: Number(iplForm.periode_tahun),
        status_bayar: iplForm.status_bayar,
        nominal_bayar: Number(iplForm.nominal_bayar),
        paket_bayar: selectedPkg.label,
        auto_jurnal: Boolean(iplForm.auto_jurnal_kas),
        tanggal_bayar: iplForm.tanggal_bayar,
        catatan: `${iplForm.catatan} — ${houseIdentity}`,
        file_base64: iplForm.file_base64,
        file_name: iplForm.file_name,
        expect_photo: hasAttachedPhoto
      });

      if (res && res.status === 'success') {
        setAdminStatusMsg({
          type: 'success',
          text: `Status ${houseIdentity} (${iplForm.periode_bulan}) berhasil divalidasi menjadi ${iplForm.status_bayar}!`
        });
        setIplForm((prev) => ({
          ...prev,
          file_base64: '',
          file_name: ''
        }));
        setIplPhotoError('');
        await fetchDashboard(selectedMonth, selectedYear, true);
      } else {
        setAdminStatusMsg({
          type: 'error',
          text: res?.message || 'Gagal memperbarui status IPL.'
        });
      }
    } catch (err) {
      setAdminStatusMsg({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // Submit Form 3A: Tutup Buku & Kirim WA via Fonnte
  const handleSubmitClosingWa = async (e) => {
    e.preventDefault();
    setIsSubmittingAdmin(true);
    setAdminStatusMsg({ type: '', text: '' });
    try {
      const res = await CMoneyAPI.closeMonthAndSendWa(
        closingForm.periode_bulan,
        Number(closingForm.periode_tahun),
        closingForm.target_wa
      );
      if (res && res.status === 'success') {
        setAdminStatusMsg({
          type: 'success',
          text: `Rekap Tutup Buku ${closingForm.periode_bulan} berhasil diproses (Status Fonnte: ${res.fonnte_status}).`
        });
        await fetchDashboard(selectedMonth, selectedYear, true);
      } else {
        setAdminStatusMsg({ type: 'error', text: res?.message || 'Gagal tutup buku.' });
      }
    } catch (err) {
      setAdminStatusMsg({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // Submit Form 3B: Simpan Rekap Gaji & Kasbon Security
  const handleSubmitPayroll = async (e) => {
    e.preventDefault();
    setIsSubmittingAdmin(true);
    setAdminStatusMsg({ type: '', text: '' });
    try {
      const res = await CMoneyAPI.inputPayroll(payrollForm);
      if (res && res.status === 'success') {
        setAdminStatusMsg({
          type: 'success',
          text: `Slip gaji ${payrollForm.nama_security} (${payrollForm.periode_bulan}) tercatat. Gaji bersih: Rp ${Number(
            res.gaji_bersih || 0
          ).toLocaleString('id-ID')}`
        });
        await fetchDashboard(selectedMonth, selectedYear, true);
      } else {
        setAdminStatusMsg({ type: 'error', text: res?.message || 'Gagal menyimpan slip gaji.' });
      }
    } catch (err) {
      setAdminStatusMsg({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // Handler Publik: Upload Bukti QRIS Mandiri oleh Warga
  const handlePublicUploadIplProof = async (proofPayload) => {
    const res = await CMoneyAPI.uploadIplProof(proofPayload);
    if (res && res.status === 'success') {
      await fetchDashboard(selectedMonth, selectedYear, true);
    }
    return res;
  };

  // Handler Publik/Security: Simpan Laporan Pos, Patroli, & Paket (Verifikasi Respon Nyata Server)
  const handleInputSecurityLog = async (logPayload) => {
    const res = await CMoneyAPI.inputSecurityLog(logPayload);
    if (res && res.status === 'success') {
      await fetchDashboard(selectedMonth, selectedYear, true);
    }
    return res;
  };

  // Handler Publik/Security: Check-In / Check-Out Denah 6 Slot Parkir Dinamis
  const handleUpdateParkingSlot = async (slotPayload) => {
    const res = await CMoneyAPI.updateParkingSlot(slotPayload);
    if (res && res.status === 'success') {
      await fetchDashboard(selectedMonth, selectedYear, true);
    }
    return res;
  };

  const activeLightboxPhoto = lightboxState
    ? lightboxState.photos[lightboxState.activeIndex] || lightboxState.photos[0]
    : null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-10">
      {/* DASHBOARD UTAMA PUBLIK WARGA & SECURITY */}
      <PublicDashboard
        data={dashboardData}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        isOnline={isOnline}
        hasServerData={hasServerData}
        backendVersion={dashboardData?.backend_version || ''}
        liveClock={liveClock}
        lastSyncTime={lastSyncTime}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onChangePeriod={(bulan, tahun) => {
          if (bulan) setSelectedMonth(bulan);
          if (tahun) setSelectedYear(Number(tahun));
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={() => fetchDashboard(selectedMonth, selectedYear, false)}
        onOpenQris={handleOpenQris}
        onOpenAdmin={handleAdminButtonClick}
        isAdminLoggedIn={isAdminLoggedIn}
        onInputSecurityLog={handleInputSecurityLog}
        onUpdateParkingSlot={handleUpdateParkingSlot}
        onOpenLightbox={handleOpenLightbox}
        formatHouseIdentity={(hOrId) => formatHouseIdentity(hOrId, housesList)}
      />

      {/* MODAL PEMBAYARAN QRIS WARGA */}
      {isQrisModalOpen && (
        <QrisPaymentModal
          isOpen={isQrisModalOpen}
          onClose={() => setIsQrisModalOpen(false)}
          houses={activeHousesList}
          selectedHouse={selectedHouseForQris}
          defaultMonth={smartPeriod.bookMonth}
          defaultYear={smartPeriod.bookYear}
          qrisImageUrl={dashboardData?.qris_image_url || '/assets/qris-cmr-statis.png'}
          qrisMerchantName={dashboardData?.qris_merchant_name || 'Cluster Mutiara Residence'}
          onUploadProof={handlePublicUploadIplProof}
          onConfirmQrisProof={handlePublicUploadIplProof}
          onOpenLightbox={handleOpenLightbox}
          formatHouseIdentity={(hOrId) => formatHouseIdentity(hOrId, housesList)}
        />
      )}

      {/* MODAL IN-APP LIGHTBOX SLIDER V6.2 (MENDUKUNG MULTI-FOTO, PANAH, THUMBNAIL, & SWIPE HP) */}
      {lightboxState && activeLightboxPhoto && (
        <div
          className="fixed inset-0 z-[90] bg-slate-900/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          onClick={() => setLightboxState(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Lightbox */}
            <div className="px-5 py-3.5 bg-teal-900 text-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm truncate">{lightboxState.title}</h3>
                  {lightboxState.photos.length > 1 && (
                    <span className="text-[11px] font-black bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full shrink-0">
                      Foto {lightboxState.activeIndex + 1} / {lightboxState.photos.length}
                    </span>
                  )}
                </div>
                {lightboxState.subtitle && (
                  <p className="text-xs text-teal-200 mt-0.5 truncate">{lightboxState.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLightboxState(null)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center font-bold text-sm shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Area Gambar Utama + Navigasi Slide & Swipe */}
            <div
              className="relative p-4 bg-slate-950 flex items-center justify-center min-h-[280px] sm:min-h-[360px] max-h-[60vh] overflow-hidden select-none"
              onTouchStart={handleLightboxTouchStart}
              onTouchEnd={handleLightboxTouchEnd}
            >
              {lightboxState.photos.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevLightbox}
                  aria-label="Foto sebelumnya"
                  className="absolute left-3 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center font-black text-base shadow-lg cursor-pointer transition"
                >
                  ◀
                </button>
              )}

              <img
                key={activeLightboxPhoto.imageUrl}
                src={activeLightboxPhoto.imageUrl}
                alt={`${lightboxState.title} (${lightboxState.activeIndex + 1})`}
                className="max-w-full max-h-[55vh] object-contain rounded-xl"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/logo-cmoney.png';
                }}
              />

              {lightboxState.photos.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextLightbox}
                  aria-label="Foto berikutnya"
                  className="absolute right-3 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center font-black text-base shadow-lg cursor-pointer transition"
                >
                  ▶
                </button>
              )}
            </div>

            {/* Barisan Thumbnail (Muncul otomatis jika jumlah foto > 1) */}
            {lightboxState.photos.length > 1 && (
              <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-2 overflow-x-auto">
                {lightboxState.photos.map((p, idx) => {
                  const isActive = idx === lightboxState.activeIndex;
                  return (
                    <button
                      key={`${p.rawUrl}-${idx}`}
                      type="button"
                      onClick={() =>
                        setLightboxState((prev) => (prev ? { ...prev, activeIndex: idx } : null))
                      }
                      className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                        isActive
                          ? 'border-emerald-400 scale-105 shadow-md'
                          : 'border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={p.imageUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] font-bold px-1">
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Footer Lightbox */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3">
                <a
                  href={activeLightboxPhoto.rawUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-teal-700 hover:underline"
                >
                  🔗 Buka Resolusi Penuh di Google Drive
                </a>
                {lightboxState.photos.length > 1 && (
                  <span className="hidden sm:inline text-[11px] text-slate-400">
                    (Geser / klik ◀ ▶ untuk foto lainnya)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLightboxState(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                Tutup Gambar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOGIN PENGURUS (1 AKUN TUNGGAL) */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800">🔒 Akses Pengurus CMR</h3>
                <p className="text-xs text-slate-500">Login Bendahara & Pengurus Cluster</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loginError && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={adminUser.username}
                  onChange={(e) => setAdminUser({ ...adminUser, username: e.target.value })}
                  placeholder="Username pengurus"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={adminUser.password}
                  onChange={(e) => setAdminUser({ ...adminUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingAdmin}
                className="w-full py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm transition shadow-md cursor-pointer"
              >
                {isSubmittingAdmin ? 'Memverifikasi...' : 'Masuk Panel Pengurus'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PANEL KENDALI PENGURUS V6.2 (RINGKAS: 3 FORM UTAMA BENDAHARA + FAIL-SAFE UPLOAD) */}
      {isAdminModalOpen && isAdminLoggedIn && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Header Panel Pengurus */}
            <div className="px-5 py-4 bg-gradient-to-r from-teal-900 to-emerald-800 text-white flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-bold">
                    Panel Pengurus V6.2
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-400/25 border border-emerald-300/40 px-2 py-0.5 rounded-full font-bold text-emerald-100">
                    GAS API: {dashboardData?.backend_version || 'memuat...'}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold mt-1">
                  Bendahara & Operasional CMR
                </h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  ← Layar Utama
                </button>
                <button
                  type="button"
                  onClick={handleLogoutAdmin}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-xs font-bold cursor-pointer"
                >
                  Logout
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Bar Pintasan Navigasi ke Layar Utama (Menu 22 Rumah -> Warga) */}
            <div className="px-5 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="font-semibold text-slate-500">Buka Cepat Menu Utama:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'beranda', label: '🏠 Beranda' },
                  { id: 'rumah', label: '🏘️ Warga' },
                  { id: 'mutasi', label: '📑 Buku Kas' },
                  { id: 'parkir', label: '🅿️ Parkir' },
                  { id: 'keamanan', label: '🛡️ Pos Security' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(t.id);
                      setIsAdminModalOpen(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-teal-600 text-slate-700 font-semibold cursor-pointer"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3 Tab Tugas Utama Bendahara */}
            <div className="grid grid-cols-3 gap-1 p-2 bg-slate-50 border-b border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setAdminActiveSection('mutasi');
                  setAdminStatusMsg({ type: '', text: '' });
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  adminActiveSection === 'mutasi'
                    ? 'bg-teal-800 text-white shadow'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                1. Input Mutasi Kas
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdminActiveSection('ipl');
                  setAdminStatusMsg({ type: '', text: '' });
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  adminActiveSection === 'ipl'
                    ? 'bg-teal-800 text-white shadow'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                2. Validasi Lunas Warga
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdminActiveSection('closing');
                  setAdminStatusMsg({ type: '', text: '' });
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  adminActiveSection === 'closing'
                    ? 'bg-teal-800 text-white shadow'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                3. Tutup Buku & Gaji
              </button>
            </div>

            {/* Isi Form Pengurus */}
            <div className="p-5 overflow-y-auto space-y-4">
              {adminStatusMsg.text && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-bold border ${
                    adminStatusMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  {adminStatusMsg.text}
                </div>
              )}

              {/* FORM 1: INPUT MUTASI KAS (UANG NYATA — ATOMIK / FAIL-SAFE) */}
              {adminActiveSection === 'mutasi' && (
                <form onSubmit={handleSubmitTransaction} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Tanggal Transaksi
                      </label>
                      <input
                        type="date"
                        required
                        value={txForm.tanggal}
                        onChange={(e) => setTxForm({ ...txForm, tanggal: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Periode Bulan Buku
                      </label>
                      <select
                        value={txForm.periode_bulan}
                        onChange={(e) => setTxForm({ ...txForm, periode_bulan: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                      >
                        {MONTH_NAMES.map((m) => (
                          <option key={m} value={m}>
                            {m} 2026
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Jenis Mutasi
                      </label>
                      <select
                        value={txForm.tipe}
                        onChange={(e) => setTxForm({ ...txForm, tipe: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                      >
                        <option value="OUT">🔴 Pengeluaran (OUT)</option>
                        <option value="IN">🟢 Pemasukan (IN)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Kategori Transaksi
                      </label>
                      <select
                        value={txForm.kategori}
                        onChange={(e) => setTxForm({ ...txForm, kategori: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                      >
                        <option value="Perawatan Pos">Perawatan Pos & Lingkungan</option>
                        <option value="Gaji">Gaji & Kasbon Security</option>
                        <option value="Sampah">Uang Sampah</option>
                        <option value="Listrik">Listrik Pos</option>
                        <option value="Air">Air Galon Pos</option>
                        <option value="Konsumsi">Konsumsi Pos</option>
                        <option value="Sosial">Dana Sosial</option>
                        <option value="Iuran Warga (IPL)">Iuran Warga (IPL)</option>
                        <option value="Parkir Fasum">Parkir Fasum</option>
                        <option value="Proyek">Proyek / Perbaikan Cluster</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Nominal Uang Nyata (Rp)
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Contoh: 150000"
                        value={txForm.nominal}
                        onChange={(e) => setTxForm({ ...txForm, nominal: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Rumah Terkait (Opsional)
                      </label>
                      <select
                        value={txForm.house_id}
                        onChange={(e) => setTxForm({ ...txForm, house_id: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                      >
                        <option value="-">-- Umum / Operasional Cluster --</option>
                        {housesList.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.display_label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={txForm.is_proyek}
                          onChange={(e) => setTxForm({ ...txForm, is_proyek: e.target.checked })}
                          className="rounded text-teal-700"
                        />
                        Termasuk Pengeluaran Proyek Khusus?
                      </label>
                    </div>
                  </div>

                  {txForm.is_proyek && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Nama Proyek
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Perbaikan Roda Pagar / Lampu Sorot"
                        value={txForm.nama_proyek}
                        onChange={(e) => setTxForm({ ...txForm, nama_proyek: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Rincian Keterangan Transaksi
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Beli token listrik pos & air galon"
                      value={txForm.keterangan}
                      onChange={(e) => setTxForm({ ...txForm, keterangan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  {/* Upload Foto Nota / Struk Bukti (Fail-Safe) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      📷 Upload Foto Nota / Kuitansi Bukti (Masuk ke Drive{' '}
                      {txForm.tipe === 'IN' ? 'Bukti_Iuran_Warga' : 'Struk_Pengeluaran_Kas'})
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleTxPhotoChange}
                      className="w-full text-xs text-slate-600"
                    />

                    {isCompressingTxPhoto && (
                      <p className="text-[11px] font-bold text-amber-700">
                        ⏳ Mengompresi foto bukti... harap tunggu sebelum menekan Simpan.
                      </p>
                    )}

                    {txPhotoError && (
                      <p className="text-[11px] font-bold text-rose-600">⚠️ {txPhotoError}</p>
                    )}

                    {txForm.file_base64 && !isCompressingTxPhoto && (
                      <div className="flex items-center gap-3 pt-1">
                        <img
                          src={txForm.file_base64}
                          alt="Preview Nota"
                          onClick={() =>
                            handleOpenLightbox(
                              txForm.file_base64,
                              'Pratinjau Nota Transaksi',
                              txForm.file_name
                            )
                          }
                          className="w-14 h-14 object-cover rounded-xl border border-emerald-300 cursor-pointer"
                        />
                        <div className="text-xs">
                          <p className="font-bold text-emerald-700">
                            ✓ Foto siap diunggah (~
                            {Math.round((txForm.file_base64.length * 3) / 4 / 1024)} KB)
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setTxForm((prev) => ({ ...prev, file_base64: '', file_name: '' }));
                              setTxPhotoError('');
                            }}
                            className="text-rose-600 font-semibold hover:underline mt-0.5 cursor-pointer"
                          >
                            Hapus Foto
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAdmin || isCompressingTxPhoto}
                    className="w-full py-3 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer"
                  >
                    {isCompressingTxPhoto
                      ? '⏳ Memproses Foto...'
                      : isSubmittingAdmin
                      ? 'Menyimpan ke Drive & Spreadsheet...'
                      : '💾 Simpan Transaksi ke Buku Kas'}
                  </button>
                </form>
              )}

              {/* FORM 2: VALIDASI LUNAS IPL & PARKIR WARGA (NETRAL + FAIL-SAFE + AUTO-JURNAL) */}
              {adminActiveSection === 'ipl' && (
                <form onSubmit={handleSubmitIplUpdate} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Pilih No. Rumah / Nama Warga (21 Unit Aktif)
                      </label>
                      <select
                        value={iplForm.house_id}
                        onChange={(e) => setIplForm({ ...iplForm, house_id: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                      >
                        {activeHousesList.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.display_label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Periode Bulan Buku IPL
                      </label>
                      <select
                        value={iplForm.periode_bulan}
                        onChange={(e) => setIplForm({ ...iplForm, periode_bulan: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                      >
                        {MONTH_NAMES.map((m) => (
                          <option key={m} value={m}>
                            Buku {m} 2026
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Paket Pembayaran (Uang Kas Nyata)
                      </label>
                      <select
                        value={iplForm.paket_id}
                        onChange={(e) => handleSelectPaymentPackage(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                      >
                        {PAYMENT_PACKAGES_V6.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Nominal Uang Masuk Riil (Rp)
                      </label>
                      <input
                        type="number"
                        required
                        value={iplForm.nominal_bayar}
                        onChange={(e) =>
                          setIplForm({ ...iplForm, nominal_bayar: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-extrabold text-teal-900 bg-teal-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Status Pembayaran
                      </label>
                      <select
                        value={iplForm.status_bayar}
                        onChange={(e) => setIplForm({ ...iplForm, status_bayar: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                      >
                        <option value="Lunas">✅ Lunas</option>
                        <option value="Menunggu Validasi">⏳ Menunggu Validasi</option>
                        <option value="Belum Bayar">❌ Belum Bayar</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Tanggal Bayar Riil
                      </label>
                      <input
                        type="date"
                        value={iplForm.tanggal_bayar}
                        onChange={(e) => setIplForm({ ...iplForm, tanggal_bayar: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={iplForm.auto_jurnal_kas}
                        onChange={(e) =>
                          setIplForm({ ...iplForm, auto_jurnal_kas: e.target.checked })
                        }
                        className="rounded text-teal-700"
                      />
                      Otomatis catat Rp {Number(iplForm.nominal_bayar || 0).toLocaleString('id-ID')}{' '}
                      ke Buku Kas ({iplForm.periode_bulan})
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Catatan Validasi
                    </label>
                    <input
                      type="text"
                      value={iplForm.catatan}
                      onChange={(e) => setIplForm({ ...iplForm, catatan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      📷 Upload Bukti Transfer / QRIS Warga (Masuk ke Drive Bukti_Iuran_Warga)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIplPhotoChange}
                      className="w-full text-xs text-slate-600"
                    />

                    {isCompressingIplPhoto && (
                      <p className="text-[11px] font-bold text-amber-700">
                        ⏳ Mengompresi foto bukti transfer...
                      </p>
                    )}

                    {iplPhotoError && (
                      <p className="text-[11px] font-bold text-rose-600">⚠️ {iplPhotoError}</p>
                    )}

                    {iplForm.file_base64 && !isCompressingIplPhoto && (
                      <div className="flex items-center gap-3 pt-1">
                        <img
                          src={iplForm.file_base64}
                          alt="Preview Bukti IPL"
                          onClick={() =>
                            handleOpenLightbox(
                              iplForm.file_base64,
                              'Pratinjau Bukti IPL Warga',
                              iplForm.file_name
                            )
                          }
                          className="w-14 h-14 object-cover rounded-xl border border-emerald-300 cursor-pointer"
                        />
                        <div className="text-xs">
                          <p className="font-bold text-emerald-700">
                            ✓ Bukti siap disimpan (~
                            {Math.round((iplForm.file_base64.length * 3) / 4 / 1024)} KB)
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setIplForm((prev) => ({ ...prev, file_base64: '', file_name: '' }));
                              setIplPhotoError('');
                            }}
                            className="text-rose-600 font-semibold hover:underline mt-0.5 cursor-pointer"
                          >
                            Hapus Foto
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAdmin || isCompressingIplPhoto}
                    className="w-full py-3 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer"
                  >
                    {isCompressingIplPhoto
                      ? '⏳ Memproses Foto...'
                      : isSubmittingAdmin
                      ? 'Memvalidasi & Mencatat Kas...'
                      : `✅ Simpan Status Lunas (${formatHouseIdentity(
                          iplForm.house_id,
                          housesList
                        )})`}
                  </button>
                </form>
              )}

              {/* FORM 3: TUTUP BUKU WA & REKAP GAJI SECURITY */}
              {adminActiveSection === 'closing' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handleSubmitClosingWa}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      📲 A. Tutup Buku Bulanan & Kirim WA Grup (Fonnte)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Periode Laporan
                        </label>
                        <select
                          value={closingForm.periode_bulan}
                          onChange={(e) =>
                            setClosingForm({ ...closingForm, periode_bulan: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                        >
                          {MONTH_NAMES.map((m) => (
                            <option key={m} value={m}>
                              {m} 2026
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Target Nomor / ID Grup WA (Opsional)
                        </label>
                        <input
                          type="text"
                          placeholder="Kosongkan untuk default Sheet"
                          value={closingForm.target_wa}
                          onChange={(e) =>
                            setClosingForm({ ...closingForm, target_wa: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmittingAdmin}
                      className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow cursor-pointer"
                    >
                      {isSubmittingAdmin
                        ? 'Mengirim Laporan...'
                        : '🚀 Proses Tutup Buku & Kirim Laporan WA'}
                    </button>
                  </form>

                  <form
                    onSubmit={handleSubmitPayroll}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      👮 B. Pencatatan Slip Gaji & Kasbon Security
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Personel Security
                        </label>
                        <select
                          value={payrollForm.nama_security}
                          onChange={(e) =>
                            setPayrollForm({ ...payrollForm, nama_security: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                        >
                          <option value="Pak Eko">Pak Eko</option>
                          <option value="Pak Mulyadi">Pak Mulyadi</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Periode Gaji
                        </label>
                        <select
                          value={payrollForm.periode_bulan}
                          onChange={(e) =>
                            setPayrollForm({ ...payrollForm, periode_bulan: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                        >
                          {MONTH_NAMES.map((m) => (
                            <option key={m} value={m}>
                              {m} 2026
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Gaji Pokok (Rp)
                        </label>
                        <input
                          type="number"
                          value={payrollForm.gaji_pokok}
                          onChange={(e) =>
                            setPayrollForm({ ...payrollForm, gaji_pokok: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Tambahan / Konsumsi
                        </label>
                        <input
                          type="number"
                          value={payrollForm.uang_konsumsi}
                          onChange={(e) =>
                            setPayrollForm({
                              ...payrollForm,
                              uang_konsumsi: Number(e.target.value)
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Potongan Kasbon (Rp)
                        </label>
                        <input
                          type="number"
                          value={payrollForm.potongan_kasbon}
                          onChange={(e) =>
                            setPayrollForm({
                              ...payrollForm,
                              potongan_kasbon: Number(e.target.value)
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingAdmin}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow cursor-pointer"
                    >
                      💾 Simpan Slip Gaji Security
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
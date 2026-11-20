import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  CMoneyLogo,
  ClusterHeaderIllustration,
  EmptyStateIllustration,
  IconArrowLeft,
  IconChevronRight,
  IconClose,
  IconEye,
  IconSearch,
  IconPhoto,
  IconUpload,
  IconRefresh,
  IconAlert,
  IconPillPlus,
  IconPillCheck,
  IconPillWa,
  IconPillPayroll,
  IconPillServer,
  IconPillLogout,
  IconPillTheme,
  Icon3DInstallApp
} from './CMoneyIcons';

/**
 * ============================================================================
 * C-MONEY V7 — RUANG PENGURUS (ADAPTIF MOBILE PROFILKU <-> DESKTOP MASTER-DETAIL)
 * ============================================================================
 * - Mobile (< 1024px)  : Halaman penuh bergaya Profilku Gojek (1 panah kembali)
 * - Desktop (>= 1024px): Master-Detail 2 kolom (Menu kiri + Form kerja kanan)
 * - 100% kompatibel dengan endpoint Code.gs V6.3 & skema auto-jurnal fail-safe
 */

const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

const EXPENSE_CATEGORIES = [
  'Gaji',
  'Sampah',
  'Listrik',
  'Konsumsi',
  'Perawatan Pos',
  'Sosial',
  'Air',
  'Proyek',
  'Lain-lain'
];

const INCOME_CATEGORIES = [
  'Iuran Warga',
  'Parkir Fasum',
  'Sumbangan',
  'Lain-lain'
];

// Pilihan Paket Pembayaran Netral (Uang Kas Nyata — Tanpa Nama Warga)
const PAYMENT_PACKAGES = [
  { id: 'IPL_ONLY', label: 'IPL Saja', nominal: 200000, desc: 'Iuran wajib bulanan' },
  { id: 'IPL_PARKIR_1', label: 'IPL + Parkir 1 Mobil', nominal: 350000, desc: 'IPL 200rb + Parkir 150rb' },
  { id: 'IPL_PARKIR_2', label: 'IPL + Parkir 2 Mobil', nominal: 500000, desc: 'IPL 200rb + Parkir 300rb' },
  { id: 'IPL_WEEKEND', label: 'IPL + Parkir Weekend', nominal: 250000, desc: 'IPL 200rb + Weekend 50rb' }
];

const SECURITY_STAFF = ['Pak Eko', 'Pak Mulyadi'];

function formatRupiah(amount) {
  const num = Number(amount) || 0;
  return `Rp ${num.toLocaleString('id-ID')}`;
}

function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatHouseLabel(house) {
  if (!house) return '-';
  const nomor = house.nomor_rumah || house.id || 'No. --';
  const nama = house.nama_warga || house.nama_kepala_keluarga || '';
  return nama ? `${nomor} / ${nama}` : nomor;
}

function isHouseInactive(house) {
  const st = String(house?.status_huni || house?.status || 'Aktif').toLowerCase();
  return st.includes('tidak') || st.includes('non') || st.includes('kosong') || st.includes('bpr');
}

function detectPackageByNominal(nominal) {
  const n = Number(nominal) || 200000;
  const matched = PAYMENT_PACKAGES.find((p) => p.nominal === n);
  return matched ? matched.id : 'IPL_ONLY';
}

function normalizeIplStatus(rawStatus) {
  const s = String(rawStatus || '').trim().toLowerCase();
  if (s === 'lunas' || s === 'approved' || s === 'paid') return 'Lunas';
  if (s.includes('menunggu') || s.includes('pending') || s.includes('validasi')) {
    return 'Menunggu Validasi';
  }
  return 'Belum Bayar';
}

/**
 * Kompresi foto bukti ringan mandiri (~80-150KB JPEG) agar unggahan Drive cepat & fail-safe
 */
function compressProofImage(file, maxWidth = 1024, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak didukung.'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / (img.width || maxWidth));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round((img.width || maxWidth) * scale);
        canvas.height = Math.round((img.height || maxWidth) * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function copyToClipboardSafe(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {
    // fallback
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (_) {
    return false;
  }
}

/* ============================================================================
 * 1. KOMPONEN LOGIN PENGURUS — BOTTOM SHEET (MOBILE) / MODAL KARTU (DESKTOP)
 * ============================================================================ */

export function AdminLoginSheet({
  isOpen = false,
  onClose,
  onSubmitLogin,
  isSubmitting = false,
  authError = '',
  logoUrl = '/assets/logo-cmoney.png'
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setShowPass(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onSubmitLogin === 'function') {
      onSubmitLogin(username.trim(), password);
    }
  };

  return (
    <div
      onClick={() => !isSubmitting && typeof onClose === 'function' && onClose()}
      className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-[2px] flex items-end sm:items-center justify-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
        className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 px-5 pt-3 sm:pt-5 space-y-4 animate-fade-in"
      >
        {/* Drag Handle khusus Mobile */}
        <div className="w-11 h-1.5 rounded-full bg-slate-300 mx-auto sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-black text-slate-900">Masuk Ruang Pengurus</h3>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Identitas Cluster */}
        <div className="flex flex-col items-center text-center pt-1 pb-2">
          <div className="p-2 rounded-3xl bg-emerald-50 ring-1 ring-emerald-200/70 mb-2.5">
            <CMoneyLogo src={logoUrl} size={48} />
          </div>
          <p className="text-sm font-extrabold text-slate-900">Akses Bendahara & Pengurus</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Cluster Mutiara Residence Sumberjaya
          </p>
        </div>

        {authError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
            <IconAlert size={16} className="shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Username</label>
            <input
              type="text"
              required
              autoComplete="username"
              placeholder="pengurus_cmr"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 px-3.5 text-sm font-semibold text-slate-800 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Password / PIN</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Masukkan password pengurus"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 pl-3.5 pr-11 text-sm font-semibold text-slate-800 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPass((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                aria-label="Tampilkan atau sembunyikan password"
              >
                <IconEye hidden={!showPass} size={18} />
              </button>
            </div>
          </div>

          <div className="pt-1 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-extrabold shadow-md shadow-emerald-600/20 active:scale-[0.99] transition disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? 'Memverifikasi Akun...' : 'Masuk Ruang Pengurus'}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="w-full h-10 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 text-xs font-bold transition cursor-pointer"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================================
 * 2. KOMPONEN UTAMA: RUANG PENGURUS V7 (MOBILE PROFILKU <-> DESKTOP 2 KOLOM)
 * ============================================================================ */

export default function AdminWorkspace({
  dashboardData = {},
  selectedMonth = 'November',
  selectedYear = 2026,
  onChangePeriod,
  onBackToHome,
  onLogout,
  onSaveTransaction,
  onValidateIpl,
  onCloseMonthWa,
  onRefresh,
  onOpenLightbox,
  onOpenPwaInstall,
  isRefreshing = false,
  isSyncingBackground = false,
  isOnline = true,
  backendVersion = 'v6.3',
  expectedBackendVersion = 'v6.3',
  isBackendOutdated = false,
  gasUrlPreview = '',
  lastSyncTime = '',
  logoUrl = '/assets/logo-cmoney.png',
  isDarkMode = false,
  onToggleDarkMode
}) {
  const houses = useMemo(() => dashboardData?.houses || [], [dashboardData]);
  const iplStatusList = useMemo(() => dashboardData?.ipl_status || [], [dashboardData]);
  const cashLedger = useMemo(() => dashboardData?.cash_ledger || [], [dashboardData]);
  const securityPayroll = useMemo(() => dashboardData?.security_payroll || [], [dashboardData]);

  // Gabungkan daftar rumah aktif + status IPL periode terpilih
  const activeHousesWithIpl = useMemo(() => {
    const activeHouses = houses.filter((h) => !isHouseInactive(h));
    return activeHouses.map((house) => {
      const iplRow = iplStatusList.find(
        (row) =>
          String(row.house_id || '').toUpperCase() === String(house.id || '').toUpperCase() &&
          String(row.periode_bulan || selectedMonth).toLowerCase() === String(selectedMonth).toLowerCase() &&
          Number(row.periode_tahun || selectedYear) === Number(selectedYear)
      );

      // Jika data dashboard sudah memfilter periode langsung pada ipl_status, fallback cocokkan house_id saja
      const fallbackRow =
        iplRow ||
        iplStatusList.find(
          (row) => String(row.house_id || '').toUpperCase() === String(house.id || '').toUpperCase()
        );

      const status = normalizeIplStatus(fallbackRow?.status || house.status_ipl);
      const nominal = Number(fallbackRow?.nominal || house.nominal_ipl || house.tarif_ipl || 200000);
      const buktiUrl = fallbackRow?.url_bukti || fallbackRow?.url_bukti_transfer || house.url_bukti || '';

      return {
        ...house,
        ipl_status: status,
        ipl_nominal: nominal,
        ipl_bukti_url: buktiUrl && buktiUrl !== '-' ? buktiUrl : '',
        ipl_catatan: fallbackRow?.catatan || fallbackRow?.keterangan || '',
        ipl_tanggal: fallbackRow?.tanggal_bayar || fallbackRow?.updated_at || ''
      };
    });
  }, [houses, iplStatusList, selectedMonth, selectedYear]);

  const pendingList = useMemo(
    () => activeHousesWithIpl.filter((h) => h.ipl_status === 'Menunggu Validasi'),
    [activeHousesWithIpl]
  );
  const unpaidList = useMemo(
    () => activeHousesWithIpl.filter((h) => h.ipl_status === 'Belum Bayar'),
    [activeHousesWithIpl]
  );
  const paidList = useMemo(
    () => activeHousesWithIpl.filter((h) => h.ipl_status === 'Lunas'),
    [activeHousesWithIpl]
  );

  // Navigasi sub-view:
  // Mobile: 'menu' | 'mutasi' | 'validasi' | 'tutup_buku' | 'payroll' | 'server'
  // Desktop: Kolom kiri selalu tampil menu, kolom kanan menampilkan `desktopSection`
  const [mobileSection, setMobileSection] = useState('menu');
  const [desktopSection, setDesktopSection] = useState(() =>
    pendingList.length > 0 ? 'validasi' : 'mutasi'
  );

  // Notifikasi Toast Non-Blocking di dalam Ruang Pengurus
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (type, title, detail = '', linkUrl = '') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, title, detail, linkUrl });
    toastTimerRef.current = setTimeout(() => setToast(null), 6500);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const openSection = (secId) => {
    setMobileSection(secId);
    setDesktopSection(secId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* --------------------------------------------------------------------------
   * STATE & HANDLER SUB 1: CATAT MUTASI KAS
   * -------------------------------------------------------------------------- */
  const [txForm, setTxForm] = useState({
    tipe: 'OUT',
    tanggal: getTodayDateString(),
    periode_bulan: selectedMonth,
    periode_tahun: Number(selectedYear) || 2026,
    kategori: 'Perawatan Pos',
    nominal: '',
    keterangan: '',
    is_proyek: false,
    nama_proyek: ''
  });
  const [txPhotoBase64, setTxPhotoBase64] = useState('');
  const [txPhotoName, setTxPhotoName] = useState('');
  const [isSavingTx, setIsSavingTx] = useState(false);

  useEffect(() => {
    setTxForm((prev) => ({
      ...prev,
      periode_bulan: selectedMonth,
      periode_tahun: Number(selectedYear) || 2026
    }));
  }, [selectedMonth, selectedYear]);

  const handleTxFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressProofImage(file, 1024, 0.75);
      setTxPhotoBase64(compressed);
      setTxPhotoName(file.name || `Nota_${txForm.tanggal}.jpg`);
    } catch (err) {
      showToast('error', 'Gagal memproses gambar', err.message);
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmitTx = async (e) => {
    e.preventDefault();
    if (!txForm.nominal || Number(txForm.nominal) <= 0) {
      showToast('error', 'Nominal wajib diisi lebih dari Rp 0');
      return;
    }
    if (typeof onSaveTransaction !== 'function') return;

    setIsSavingTx(true);
    try {
      const payload = {
        ...txForm,
        nominal: Number(txForm.nominal),
        is_proyek: Boolean(txForm.is_proyek || txForm.kategori === 'Proyek'),
        file_base64: txPhotoBase64 || '',
        file_name: txPhotoName || ''
      };

      const res = await onSaveTransaction(payload);
      if (res && res.status === 'success') {
        showToast(
          'success',
          'Mutasi Kas Tersimpan!',
          res.new_balance !== undefined
            ? `Saldo terbaru: ${formatRupiah(res.new_balance)} • Sinkronisasi latar berjalan.`
            : 'Data masuk ke Buku Kas Live • Siap input transaksi berikutnya.',
          res.url_struk || res.drive_url || ''
        );
        setTxForm((prev) => ({
          ...prev,
          nominal: '',
          keterangan: '',
          nama_proyek: ''
        }));
        setTxPhotoBase64('');
        setTxPhotoName('');
      } else {
        showToast('error', 'Gagal menyimpan mutasi', res?.message || 'Silakan coba lagi.');
      }
    } catch (err) {
      showToast('error', 'Error koneksi server', err?.message || 'Periksa koneksi internet.');
    } finally {
      setIsSavingTx(false);
    }
  };

  /* --------------------------------------------------------------------------
   * STATE & HANDLER SUB 2: VALIDASI LUNAS WARGA (3 TAB PINTAR + SHEET CEPAT)
   * -------------------------------------------------------------------------- */
  const [valTab, setValTab] = useState(() => (pendingList.length > 0 ? 'pending' : 'unpaid'));
  const [valSearch, setValSearch] = useState('');
  const [activeValHouse, setActiveValHouse] = useState(null);
  const [valSheetForm, setValSheetForm] = useState({
    status: 'Lunas',
    packageId: 'IPL_ONLY',
    nominal: 200000,
    autoJournal: true,
    catatan: ''
  });
  const [valPhotoBase64, setValPhotoBase64] = useState('');
  const [valPhotoName, setValPhotoName] = useState('');
  const [isSavingVal, setIsSavingVal] = useState(false);

  const openValidationSheet = (house) => {
    const pkgId = detectPackageByNominal(house.ipl_nominal);
    setActiveValHouse(house);
    setValSheetForm({
      status: 'Lunas',
      packageId: pkgId,
      nominal: house.ipl_nominal || 200000,
      autoJournal: true,
      catatan: house.ipl_catatan || ''
    });
    setValPhotoBase64('');
    setValPhotoName('');
  };

  const handleValFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressProofImage(file, 1024, 0.75);
      setValPhotoBase64(compressed);
      setValPhotoName(file.name || `Bukti_${activeValHouse?.id || 'IPL'}.jpg`);
    } catch (err) {
      showToast('error', 'Gagal memproses foto bukti', err.message);
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmitValidation = async (e) => {
    e.preventDefault();
    if (!activeValHouse || typeof onValidateIpl !== 'function') return;

    setIsSavingVal(true);
    try {
      const selectedPkg = PAYMENT_PACKAGES.find((p) => p.id === valSheetForm.packageId);
      const payload = {
        house_id: activeValHouse.id,
        nomor_rumah: activeValHouse.nomor_rumah,
        nama_warga: activeValHouse.nama_warga || activeValHouse.nama_kepala_keluarga || '',
        periode_bulan: selectedMonth,
        periode_tahun: Number(selectedYear) || 2026,
        status: valSheetForm.status,
        nominal: Number(valSheetForm.nominal) || 200000,
        paket_pembayaran: selectedPkg ? selectedPkg.label : 'IPL Saja',
        auto_journal: Boolean(valSheetForm.autoJournal && valSheetForm.status === 'Lunas'),
        catatan: valSheetForm.catatan.trim(),
        file_base64: valPhotoBase64 || '',
        file_name: valPhotoName || ''
      };

      const res = await onValidateIpl(payload);
      if (res && res.status === 'success') {
        showToast(
          'success',
          `${formatHouseLabel(activeValHouse)} → ${valSheetForm.status}`,
          valSheetForm.status === 'Lunas' && valSheetForm.autoJournal
            ? `${formatRupiah(payload.nominal)} tercatat & auto-jurnal ke Buku Kas.`
            : 'Status iuran berhasil diperbarui.'
        );
        setActiveValHouse(null);
      } else {
        showToast('error', 'Gagal memvalidasi warga', res?.message || 'Silakan coba lagi.');
      }
    } catch (err) {
      showToast('error', 'Error koneksi server', err?.message || 'Gagal menghubungi GAS.');
    } finally {
      setIsSavingVal(false);
    }
  };

  const filteredValidationList = useMemo(() => {
    const source =
      valTab === 'pending' ? pendingList : valTab === 'unpaid' ? unpaidList : paidList;
    const q = valSearch.trim().toLowerCase();
    if (!q) return source;
    return source.filter((h) => formatHouseLabel(h).toLowerCase().includes(q));
  }, [valTab, pendingList, unpaidList, paidList, valSearch]);

  /* --------------------------------------------------------------------------
   * STATE & HANDLER SUB 3: TUTUP BUKU & LAPORAN WA
   * -------------------------------------------------------------------------- */
  const [closingForm, setClosingForm] = useState({
    bulan: selectedMonth,
    tahun: Number(selectedYear) || 2026,
    target_wa: ''
  });
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setClosingForm((prev) => ({
      ...prev,
      bulan: selectedMonth,
      tahun: Number(selectedYear) || 2026
    }));
  }, [selectedMonth, selectedYear]);

  // Hitung ringkasan live periode tutup buku dari cashLedger
  const closingSummary = useMemo(() => {
    const periodTx = cashLedger.filter(
      (tx) =>
        String(tx.periode_bulan || '').toLowerCase() === String(closingForm.bulan).toLowerCase() &&
        Number(tx.periode_tahun || closingForm.tahun) === Number(closingForm.tahun)
    );
    const totalIn = periodTx
      .filter((t) => String(t.tipe || '').toUpperCase() === 'IN')
      .reduce((acc, t) => acc + (Number(t.nominal) || 0), 0);
    const totalOut = periodTx
      .filter((t) => String(t.tipe || '').toUpperCase() === 'OUT')
      .reduce((acc, t) => acc + (Number(t.nominal) || 0), 0);
    const totalProyek = periodTx
      .filter(
        (t) =>
          String(t.tipe || '').toUpperCase() === 'OUT' &&
          (t.is_proyek === true ||
            String(t.is_proyek).toLowerCase() === 'true' ||
            String(t.kategori || '').toLowerCase() === 'proyek')
      )
      .reduce((acc, t) => acc + (Number(t.nominal) || 0), 0);

    return {
      txCount: periodTx.length,
      totalIn,
      totalOut,
      totalProyek,
      currentBalance: Number(dashboardData?.current_balance) || 0
    };
  }, [cashLedger, closingForm.bulan, closingForm.tahun, dashboardData]);

  const handleRunClosingWa = async (e) => {
    e.preventDefault();
    if (typeof onCloseMonthWa !== 'function') return;
    setIsClosing(true);
    try {
      const res = await onCloseMonthWa(
        closingForm.bulan,
        Number(closingForm.tahun),
        closingForm.target_wa.trim()
      );
      if (res && res.status === 'success') {
        showToast(
          'success',
          `Tutup Buku ${closingForm.bulan} ${closingForm.tahun} Selesai`,
          `Status WA Fonnte: ${res.fonnte_status || 'Terkirim'}`
        );
      } else {
        showToast('error', 'Tutup buku belum berhasil', res?.message || 'Periksa konfigurasi Fonnte.');
      }
    } catch (err) {
      showToast('error', 'Error koneksi Tutup Buku', err?.message || 'Gagal menghubungi GAS.');
    } finally {
      setIsClosing(false);
    }
  };

  const handleCopyManualClosingWa = async () => {
    const text =
      `*LAPORAN KAS C-MONEY CMR*\n` +
      `Periode: *${closingForm.bulan} ${closingForm.tahun}*\n` +
      `────────────────────\n` +
      `• Uang Masuk Riil: *${formatRupiah(closingSummary.totalIn)}*\n` +
      `• Total Pengeluaran: *${formatRupiah(closingSummary.totalOut)}*\n` +
      `• Khusus Proyek: *${formatRupiah(closingSummary.totalProyek)}*\n` +
      `• Sisa Saldo Kas Nyata: *${formatRupiah(closingSummary.currentBalance)}*\n` +
      `• Status IPL: *${paidList.length}/${activeHousesWithIpl.length} Rumah Aktif Lunas*\n` +
      `────────────────────\n` +
      `Rincian lengkap & foto bukti dapat dicek transparan di aplikasi C-Money CMR.`;

    await copyToClipboardSafe(text);
    showToast('success', 'Draf Laporan WA Disalin!', 'Silakan tempel langsung ke Grup WA Warga.');
  };

  /* --------------------------------------------------------------------------
   * STATE & HANDLER SUB 4: SLIP GAJI & KASBON SECURITY
   * -------------------------------------------------------------------------- */
  const [payrollForm, setPayrollForm] = useState({
    nama_security: SECURITY_STAFF[0],
    periode_bulan: selectedMonth,
    gaji_pokok: 1500000,
    uang_konsumsi: 0,
    total_kasbon: 0,
    catatan: ''
  });
  const [isSavingPayroll, setIsSavingPayroll] = useState(false);

  const gajiBersih = useMemo(() => {
    return Math.max(
      0,
      (Number(payrollForm.gaji_pokok) || 0) +
        (Number(payrollForm.uang_konsumsi) || 0) -
        (Number(payrollForm.total_kasbon) || 0)
    );
  }, [payrollForm]);

  const handleRecordPayrollToLedger = async (e) => {
    e.preventDefault();
    if (gajiBersih <= 0) {
      showToast('error', 'Nominal Gaji Bersih harus lebih dari Rp 0');
      return;
    }
    if (typeof onSaveTransaction !== 'function') return;

    setIsSavingPayroll(true);
    try {
      const detail =
        `Gaji ${payrollForm.nama_security} (${payrollForm.periode_bulan} ${selectedYear}) • ` +
        `Pokok ${formatRupiah(payrollForm.gaji_pokok)}` +
        (Number(payrollForm.uang_konsumsi) > 0
          ? ` + Konsumsi ${formatRupiah(payrollForm.uang_konsumsi)}`
          : '') +
        (Number(payrollForm.total_kasbon) > 0
          ? ` - Potong Kasbon ${formatRupiah(payrollForm.total_kasbon)}`
          : '') +
        (payrollForm.catatan.trim() ? ` (${payrollForm.catatan.trim()})` : '');

      const res = await onSaveTransaction({
        tanggal: getTodayDateString(),
        periode_bulan: payrollForm.periode_bulan,
        periode_tahun: Number(selectedYear) || 2026,
        tipe: 'OUT',
        kategori: 'Gaji',
        is_proyek: false,
        nama_proyek: '',
        nominal: gajiBersih,
        keterangan: detail
      });

      if (res && res.status === 'success') {
        showToast(
          'success',
          `Gaji ${payrollForm.nama_security} Tercatat!`,
          `${formatRupiah(gajiBersih)} masuk Buku Kas Live.`
        );
        setPayrollForm((prev) => ({ ...prev, total_kasbon: 0, catatan: '' }));
      } else {
        showToast('error', 'Gagal mencatat gaji', res?.message || 'Silakan coba lagi.');
      }
    } catch (err) {
      showToast('error', 'Error koneksi server', err?.message);
    } finally {
      setIsSavingPayroll(false);
    }
  };

  const handleCopySlipWa = async () => {
    const slipText =
      `*SLIP GAJI SECURITY CMR*\n` +
      `Petugas: *${payrollForm.nama_security}*\n` +
      `Periode: *${payrollForm.periode_bulan} ${selectedYear}*\n` +
      `────────────────────\n` +
      `• Gaji Pokok: ${formatRupiah(payrollForm.gaji_pokok)}\n` +
      `• Uang Konsumsi: ${formatRupiah(payrollForm.uang_konsumsi)}\n` +
      `• Potongan Kasbon: -${formatRupiah(payrollForm.total_kasbon)}\n` +
      `• *Gaji Bersih Diterima: ${formatRupiah(gajiBersih)}*\n` +
      (payrollForm.catatan.trim() ? `• Catatan: ${payrollForm.catatan.trim()}\n` : '') +
      `Terima kasih atas dedikasi menjaga keamanan CMR 🙏`;

    await copyToClipboardSafe(slipText);
    showToast('success', 'Teks Slip Gaji Disalin!', 'Siap dikirim ke WA petugas security.');
  };

  /* --------------------------------------------------------------------------
   * RENDER SUB-HALAMAN KERJA (DIPAKAI BERSAMA OLEH MOBILE & DESKTOP KANAN)
   * -------------------------------------------------------------------------- */
  const renderSectionContent = (sectionKey) => {
    /* ---- SUB 1: CATAT MUTASI KAS ---- */
    if (sectionKey === 'mutasi') {
      const catList = txForm.tipe === 'OUT' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
      return (
        <div className="bg-white rounded-3xl border border-slate-200/85 shadow-xs p-4 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">Catat Mutasi Kas</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap transaksi langsung memperbarui Saldo Kas Nyata & Buku Kas warga secara live.
            </p>
          </div>

          <form onSubmit={handleSubmitTx} className="space-y-4">
            {/* Toggle Tipe OUT / IN */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100">
              <button
                type="button"
                onClick={() =>
                  setTxForm((prev) => ({
                    ...prev,
                    tipe: 'OUT',
                    kategori: EXPENSE_CATEGORIES[4]
                  }))
                }
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
                  txForm.tipe === 'OUT'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pengeluaran (OUT)
              </button>
              <button
                type="button"
                onClick={() =>
                  setTxForm((prev) => ({
                    ...prev,
                    tipe: 'IN',
                    kategori: INCOME_CATEGORIES[0],
                    is_proyek: false
                  }))
                }
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
                  txForm.tipe === 'IN'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pemasukan (IN)
              </button>
            </div>

            {/* Grid Adaptif 2 Kolom di SM/Desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Tanggal</label>
                <input
                  type="date"
                  required
                  value={txForm.tanggal}
                  onChange={(e) => setTxForm({ ...txForm, tanggal: e.target.value })}
                  className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-500 px-3.5 text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Periode Buku</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={txForm.periode_bulan}
                    onChange={(e) => setTxForm({ ...txForm, periode_bulan: e.target.value })}
                    className="col-span-2 h-11 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-500 px-3 text-sm font-bold outline-none"
                  >
                    {MONTHS_ID.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="2024"
                    max="2035"
                    value={txForm.periode_tahun}
                    onChange={(e) => setTxForm({ ...txForm, periode_tahun: Number(e.target.value) })}
                    className="h-11 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-500 px-2.5 text-sm font-bold text-center outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Kategori</label>
                <select
                  value={txForm.kategori}
                  onChange={(e) =>
                    setTxForm({
                      ...txForm,
                      kategori: e.target.value,
                      is_proyek: e.target.value === 'Proyek' ? true : txForm.is_proyek
                    })
                  }
                  className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-500 px-3.5 text-sm font-bold outline-none"
                >
                  {catList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-600">Nominal (Rp)</label>
                  {Number(txForm.nominal) > 0 && (
                    <span className="text-[11px] font-extrabold text-emerald-700">
                      {formatRupiah(txForm.nominal)}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  step="500"
                  placeholder="Contoh: 150000"
                  value={txForm.nominal}
                  onChange={(e) => setTxForm({ ...txForm, nominal: e.target.value })}
                  className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-500 px-3.5 text-sm font-extrabold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Keterangan Detail</label>
              <input
                type="text"
                required
                placeholder="Contoh: Token listrik pos security atau pembelian gembok gerbang"
                value={txForm.keterangan}
                onChange={(e) => setTxForm({ ...txForm, keterangan: e.target.value })}
                className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-500 px-3.5 text-sm font-medium outline-none"
              />
            </div>

            {txForm.tipe === 'OUT' && (
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={txForm.is_proyek}
                    onChange={(e) => setTxForm({ ...txForm, is_proyek: e.target.checked })}
                    className="w-4 h-4 rounded accent-emerald-600"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    Tandai sebagai Pengeluaran Khusus Proyek Cluster
                  </span>
                </label>

                {txForm.is_proyek && (
                  <input
                    type="text"
                    required
                    placeholder="Nama Proyek (contoh: Perbaikan Pagar & Saluran Air)"
                    value={txForm.nama_proyek}
                    onChange={(e) => setTxForm({ ...txForm, nama_proyek: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-emerald-500"
                  />
                )}
              </div>
            )}

            {/* Upload Foto Struk/Nota (Fail-Safe Opsional) */}
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-3.5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-teal-700 shrink-0">
                    <IconUpload size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-800 truncate">
                      {txPhotoName || 'Foto Nota / Struk (Opsional)'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Otomatis terkompresi & masuk Drive Struk_Pengeluaran_Kas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {txPhotoBase64 && (
                    <button
                      type="button"
                      onClick={() => {
                        setTxPhotoBase64('');
                        setTxPhotoName('');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold cursor-pointer"
                    >
                      Hapus
                    </button>
                  )}
                  <label className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 text-xs font-extrabold text-slate-700 cursor-pointer transition">
                    {txPhotoBase64 ? 'Ganti Foto' : 'Pilih Foto'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleTxFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {txPhotoBase64 && (
                <div className="mt-3">
                  <img
                    src={txPhotoBase64}
                    alt="Pratinjau Nota"
                    className="h-32 rounded-xl object-cover border border-slate-200"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSavingTx}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-extrabold shadow-md shadow-emerald-600/20 active:scale-[0.99] transition disabled:opacity-60 cursor-pointer"
            >
              {isSavingTx ? 'Menyimpan ke Buku Kas...' : 'Simpan ke Buku Kas Live'}
            </button>
          </form>
        </div>
      );
    }

    /* ---- SUB 2: VALIDASI LUNAS WARGA (GAYA AKTIVITAS GOJEK — 3 TAB PINTAR) ---- */
    if (sectionKey === 'validasi') {
      return (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/85 shadow-xs overflow-hidden">
            {/* Header & Pemilih Periode */}
            <div className="p-4 sm:p-5 pb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Validasi Lunas Warga
                </h2>
                <p className="text-xs text-slate-500">
                  {paidList.length}/{activeHousesWithIpl.length} rumah aktif lunas • Tap kartu untuk
                  validasi cepat + auto-jurnal
                </p>
              </div>

              {typeof onChangePeriod === 'function' && (
                <select
                  value={selectedMonth}
                  onChange={(e) => onChangePeriod(e.target.value, selectedYear)}
                  className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-extrabold text-slate-700 outline-none focus:border-emerald-500"
                >
                  {MONTHS_ID.map((m) => (
                    <option key={m} value={m}>
                      {m} {selectedYear}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 3 Tab Garis Bawah persis halaman Aktivitas Gojek */}
            <div className="grid grid-cols-3 border-b border-slate-200 px-2 sm:px-4">
              {[
                { id: 'pending', label: 'Perlu Validasi', count: pendingList.length },
                { id: 'unpaid', label: 'Belum Bayar', count: unpaidList.length },
                { id: 'paid', label: 'Sudah Lunas', count: paidList.length }
              ].map((t) => {
                const active = valTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setValTab(t.id)}
                    className={`py-3 text-xs sm:text-[13px] font-extrabold relative flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      active ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="truncate">{t.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        active
                          ? t.id === 'pending' && t.count > 0
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.count}
                    </span>
                    {active && (
                      <span className="absolute bottom-0 inset-x-3 h-[3px] rounded-t-full bg-emerald-600" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Pencarian Cepat */}
            <div className="p-3.5 sm:px-5 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <IconSearch
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={valSearch}
                  onChange={(e) => setValSearch(e.target.value)}
                  placeholder="Cari nomor rumah atau nama warga..."
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-xs font-semibold outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Daftar Kartu Warga (1 Kolom di Mobile, 2 Kolom di XL Desktop) */}
            <div className="p-3.5 sm:p-5">
              {filteredValidationList.length === 0 ? (
                <div className="py-8 flex flex-col items-center text-center">
                  <EmptyStateIllustration
                    type={valTab === 'pending' ? 'validation' : 'search'}
                    size={84}
                  />
                  <p className="text-sm font-extrabold text-slate-800 mt-3">
                    {valTab === 'pending'
                      ? 'Tidak Ada Antrean Validasi'
                      : valTab === 'unpaid'
                      ? 'Semua Rumah Aktif Sudah Lunas!'
                      : 'Belum Ada Data Lunas'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    {valTab === 'pending'
                      ? 'Semua konfirmasi pembayaran warga periode ini sudah diproses.'
                      : 'Coba ubah kata kunci pencarian atau pilih periode bulan lain.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {filteredValidationList.map((house) => (
                    <div
                      key={house.id}
                      className="rounded-2xl border border-slate-200/90 hover:border-emerald-300 bg-white p-3.5 flex flex-col justify-between gap-3 transition shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-slate-900 truncate">
                            {formatHouseLabel(house)}
                          </p>
                          <p className="text-xs font-bold text-slate-500 mt-0.5">
                            {formatRupiah(house.ipl_nominal)}
                            {house.ipl_tanggal ? ` • ${String(house.ipl_tanggal).slice(0, 10)}` : ''}
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${
                            house.ipl_status === 'Lunas'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : house.ipl_status === 'Menunggu Validasi'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {house.ipl_status}
                        </span>
                      </div>

                      {house.ipl_catatan && house.ipl_catatan !== '-' && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 rounded-xl px-2.5 py-1.5 line-clamp-2">
                          {house.ipl_catatan}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-0.5">
                        {house.ipl_bukti_url && (
                          <button
                            type="button"
                            onClick={() =>
                              typeof onOpenLightbox === 'function' &&
                              onOpenLightbox(
                                [house.ipl_bukti_url],
                                `Bukti Transfer • ${formatHouseLabel(house)} (${selectedMonth} ${selectedYear})`
                              )
                            }
                            className="h-9 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <IconPhoto size={15} />
                            <span>Bukti</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openValidationSheet(house)}
                          className={`flex-1 h-9 px-3.5 rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1 transition cursor-pointer ${
                            house.ipl_status === 'Lunas'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          <span>
                            {house.ipl_status === 'Lunas' ? 'Ubah Status' : 'Validasi Lunas'}
                          </span>
                          <IconChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    /* ---- SUB 3: TUTUP BUKU & LAPORAN WA ---- */
    if (sectionKey === 'tutup_buku') {
      return (
        <div className="bg-white rounded-3xl border border-slate-200/85 shadow-xs p-4 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Tutup Buku & Laporan WA
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rekap otomatis angka kas nyata bulanan lalu kirim langsung ke grup WA via Fonnte atau
              salin manual.
            </p>
          </div>

          {/* Kartu Ringkasan Angka Live */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200/70 p-3">
              <p className="text-[11px] font-bold text-emerald-700">Uang Masuk</p>
              <p className="text-sm font-black text-emerald-900 mt-0.5">
                {formatRupiah(closingSummary.totalIn)}
              </p>
            </div>
            <div className="rounded-2xl bg-rose-50/80 border border-rose-200/70 p-3">
              <p className="text-[11px] font-bold text-rose-700">Pengeluaran</p>
              <p className="text-sm font-black text-rose-900 mt-0.5">
                {formatRupiah(closingSummary.totalOut)}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50/80 border border-amber-200/70 p-3">
              <p className="text-[11px] font-bold text-amber-800">Khusus Proyek</p>
              <p className="text-sm font-black text-amber-950 mt-0.5">
                {formatRupiah(closingSummary.totalProyek)}
              </p>
            </div>
            <div className="rounded-2xl bg-teal-900 text-white p-3">
              <p className="text-[11px] font-bold text-emerald-200">Saldo Kas Nyata</p>
              <p className="text-sm font-black mt-0.5">
                {formatRupiah(closingSummary.currentBalance)}
              </p>
            </div>
          </div>

          <form onSubmit={handleRunClosingWa} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Periode Bulan</label>
                <select
                  value={closingForm.bulan}
                  onChange={(e) => setClosingForm({ ...closingForm, bulan: e.target.value })}
                  className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm font-bold outline-none focus:border-emerald-500"
                >
                  {MONTHS_ID.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Tahun</label>
                <input
                  type="number"
                  value={closingForm.tahun}
                  onChange={(e) => setClosingForm({ ...closingForm, tahun: Number(e.target.value) })}
                  className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm font-bold outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Target WA (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Default dari Spreadsheet"
                  value={closingForm.target_wa}
                  onChange={(e) => setClosingForm({ ...closingForm, target_wa: e.target.value })}
                  className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 text-xs font-semibold outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="submit"
                disabled={isClosing}
                className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-extrabold shadow-md shadow-emerald-600/20 transition disabled:opacity-60 cursor-pointer"
              >
                {isClosing ? 'Memproses Tutup Buku...' : 'Tutup Buku & Kirim WA via Fonnte'}
              </button>
              <button
                type="button"
                onClick={handleCopyManualClosingWa}
                className="h-12 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition cursor-pointer"
              >
                Salin Draf WA
              </button>
            </div>
          </form>
        </div>
      );
    }

    /* ---- SUB 4: SLIP GAJI & KASBON SECURITY ---- */
    if (sectionKey === 'payroll') {
      return (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/85 shadow-xs p-4 sm:p-6 space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Slip Gaji & Kasbon Security
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hitung otomatis potongan kasbon, catat sebagai pengeluaran Gaji ke Buku Kas, & salin
                slip WA.
              </p>
            </div>

            <form onSubmit={handleRecordPayrollToLedger} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Petugas</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SECURITY_STAFF.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setPayrollForm({ ...payrollForm, nama_security: name })}
                        className={`h-10 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                          payrollForm.nama_security === name
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Periode</label>
                  <select
                    value={payrollForm.periode_bulan}
                    onChange={(e) =>
                      setPayrollForm({ ...payrollForm, periode_bulan: e.target.value })
                    }
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold outline-none"
                  >
                    {MONTHS_ID.map((m) => (
                      <option key={m} value={m}>
                        {m} {selectedYear}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Gaji Pokok</label>
                  <input
                    type="number"
                    value={payrollForm.gaji_pokok}
                    onChange={(e) => setPayrollForm({ ...payrollForm, gaji_pokok: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-extrabold outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Uang Konsumsi</label>
                  <input
                    type="number"
                    value={payrollForm.uang_konsumsi}
                    onChange={(e) =>
                      setPayrollForm({ ...payrollForm, uang_konsumsi: e.target.value })
                    }
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-extrabold outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-rose-600 mb-1">Potong Kasbon</label>
                  <input
                    type="number"
                    value={payrollForm.total_kasbon}
                    onChange={(e) =>
                      setPayrollForm({ ...payrollForm, total_kasbon: e.target.value })
                    }
                    className="w-full h-10 rounded-xl border border-rose-200 bg-rose-50/50 px-3 text-xs font-extrabold text-rose-800 outline-none focus:bg-white focus:border-rose-400"
                  />
                </div>
              </div>

              <input
                type="text"
                placeholder="Catatan tambahan slip gaji (opsional)..."
                value={payrollForm.catatan}
                onChange={(e) => setPayrollForm({ ...payrollForm, catatan: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium outline-none focus:bg-white focus:border-emerald-500"
              />

              {/* Strip Gaji Bersih */}
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">Gaji Bersih Diterima</span>
                <span className="text-lg font-black text-emerald-900">
                  {formatRupiah(gajiBersih)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="submit"
                  disabled={isSavingPayroll}
                  className="flex-1 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition disabled:opacity-60 cursor-pointer"
                >
                  {isSavingPayroll ? 'Mencatat ke Buku Kas...' : 'Catat Gaji ke Buku Kas'}
                </button>
                <button
                  type="button"
                  onClick={handleCopySlipWa}
                  className="h-11 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition cursor-pointer"
                >
                  Salin Slip WA
                </button>
              </div>
            </form>
          </div>

          {/* Riwayat dari Sheet security_payroll */}
          {securityPayroll.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/85 shadow-xs p-4 sm:p-5 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Arsip Payroll di Spreadsheet
              </h3>
              <div className="divide-y divide-slate-100">
                {securityPayroll.slice(0, 6).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="py-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <p className="font-extrabold text-slate-800">
                        {item.nama_security || item.security_user_id || 'Petugas'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {item.periode_bulan || '-'} • Kasbon:{' '}
                        {formatRupiah(item.total_kasbon || 0)}
                      </p>
                    </div>
                    <span className="font-black text-emerald-700">
                      {formatRupiah(item.gaji_bersih_diterima || item.gaji_pokok || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    /* ---- SUB 5: STATUS SERVER & KONEKSI GAS ---- */
    return (
      <div className="bg-white rounded-3xl border border-slate-200/85 shadow-xs p-4 sm:p-6 space-y-5">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Status Server & Koneksi GAS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Diagnostik jalur tunggal Google Apps Script & sinkronisasi database Spreadsheet CMR.
          </p>
        </div>

        {isBackendOutdated && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-start gap-2.5">
            <IconAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              Versi backend terdeteksi <strong>{backendVersion || 'lama'}</strong>, target sistem{' '}
              <strong>{expectedBackendVersion}</strong>. Pastikan deployment Apps Script terbaru
              sudah terpasang di <code>src/config/gasConfig.js</code>.
            </span>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200/90 divide-y divide-slate-100 text-xs">
          <div className="p-3.5 flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-500">Status Koneksi</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-extrabold ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}
              />
              {isOnline ? 'Online (Live)' : 'Offline (Cadangan Lokal)'}
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-500">Versi Aplikasi & API</span>
            <span className="font-mono font-extrabold text-slate-800">
              C-Money V7 • API {backendVersion || expectedBackendVersion}
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-500">Sinkronisasi Terakhir</span>
            <span className="font-bold text-slate-800">{lastSyncTime || '-'}</span>
          </div>

          <div className="p-3.5 space-y-1">
            <span className="font-semibold text-slate-500 block">Endpoint GAS Aktif</span>
            <p className="font-mono text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 break-all">
              {gasUrlPreview || 'Terkonfigurasi lewat src/config/gasConfig.js'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            disabled={isRefreshing}
            onClick={() => typeof onRefresh === 'function' && onRefresh()}
            className="flex-1 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
          >
            <IconRefresh size={16} spinning={isRefreshing} />
            <span>{isRefreshing ? 'Menyinkronkan...' : 'Tes Sinkronisasi Sekarang'}</span>
          </button>

          {typeof onOpenPwaInstall === 'function' && (
            <button
              type="button"
              onClick={onOpenPwaInstall}
              className="h-11 px-4 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-extrabold inline-flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Icon3DInstallApp size={20} />
              <span>Pasang Aplikasi</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  /* --------------------------------------------------------------------------
   * PANEL MENU PROFILKU GOJEK (KOLOM UTAMA MOBILE & KOLOM KIRI DESKTOP)
   * -------------------------------------------------------------------------- */
  const activeMenuId = desktopSection;

  const renderProfileMenuColumn = () => (
    <div className="space-y-4">
      {/* Header Gradasi Mint + Ilustrasi Cluster + Kartu Profil Pengurus */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-teal-700 p-4 pt-4 shadow-sm">
        <ClusterHeaderIllustration className="absolute right-0 bottom-0 w-52 opacity-35" />

        {/* Tombol Kembali khusus Mobile saat di root menu */}
        <div className="relative z-10 flex items-center justify-between mb-3 lg:hidden">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 text-white font-extrabold text-sm cursor-pointer"
          >
            <span className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center">
              <IconArrowLeft size={18} />
            </span>
            <span>Ruang Pengurus</span>
          </button>

          {isSyncingBackground && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/20 text-white animate-pulse">
              Menyinkronkan...
            </span>
          )}
        </div>

        {/* Kartu Profil Putih di Dalam Banner */}
        <div className="relative z-10 bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-3.5 flex items-center gap-3">
            <div className="p-1.5 rounded-2xl bg-emerald-50 ring-1 ring-emerald-200/80 shrink-0">
              <CMoneyLogo src={logoUrl} size={42} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-900 truncate">Bendahara & Pengurus</p>
              <p className="text-[11px] font-semibold text-slate-500 truncate">
                Cluster Mutiara Residence Sumberjaya
              </p>
              <p className="text-[11px] font-extrabold text-emerald-700 mt-0.5">
                Kas Nyata: {formatRupiah(dashboardData?.current_balance || 0)}
              </p>
            </div>
          </div>

          {/* Strip Status Antrean Validasi (Ala Banner GoStar Gojek) */}
          <button
            type="button"
            onClick={() => {
              setValTab(pendingList.length > 0 ? 'pending' : 'unpaid');
              openSection('validasi');
            }}
            className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs font-extrabold transition cursor-pointer ${
              pendingList.length > 0
                ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-amber-950 hover:brightness-95'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span className="truncate">
              {pendingList.length > 0
                ? `${pendingList.length} Warga Menunggu Validasi`
                : `IPL ${selectedMonth}: ${paidList.length}/${activeHousesWithIpl.length} Aktif Lunas`}
            </span>
            <IconChevronRight size={16} className="shrink-0" />
          </button>
        </div>
      </div>

      {/* Grup 1: Keuangan & Kas */}
      <div className="space-y-1.5">
        <p className="px-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
          Keuangan & Kas
        </p>
        <div className="bg-white rounded-3xl border border-slate-200/85 shadow-xs divide-y divide-slate-100 overflow-hidden">
          <MenuRowButton
            icon={<IconPillPlus size={18} />}
            iconBg="bg-emerald-50 text-emerald-700"
            title="Catat Mutasi Kas"
            subtitle="Pemasukan, pengeluaran & foto nota"
            activeDesktop={activeMenuId === 'mutasi'}
            onClick={() => openSection('mutasi')}
          />
          <MenuRowButton
            icon={<IconPillCheck size={18} />}
            iconBg="bg-sky-50 text-sky-700"
            title="Validasi Lunas Warga"
            subtitle={`Periode ${selectedMonth} ${selectedYear}`}
            badge={pendingList.length > 0 ? `${pendingList.length} Baru` : ''}
            badgeColor="bg-amber-500 text-white"
            activeDesktop={activeMenuId === 'validasi'}
            onClick={() => openSection('validasi')}
          />
        </div>
      </div>

      {/* Grup 2: Bulanan & Security */}
      <div className="space-y-1.5">
        <p className="px-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
          Bulanan & Security
        </p>
        <div className="bg-white rounded-3xl border border-slate-200/85 shadow-xs divide-y divide-slate-100 overflow-hidden">
          <MenuRowButton
            icon={<IconPillWa size={18} />}
            iconBg="bg-teal-50 text-teal-700"
            title="Tutup Buku & Laporan WA"
            subtitle="Rekap bulanan & kirim via Fonnte"
            activeDesktop={activeMenuId === 'tutup_buku'}
            onClick={() => openSection('tutup_buku')}
          />
          <MenuRowButton
            icon={<IconPillPayroll size={18} />}
            iconBg="bg-indigo-50 text-indigo-700"
            title="Slip Gaji & Kasbon Security"
            subtitle="Pak Eko & Pak Mulyadi"
            activeDesktop={activeMenuId === 'payroll'}
            onClick={() => openSection('payroll')}
          />
        </div>
      </div>

      {/* Grup 3: Sistem & Akun */}
      <div className="space-y-1.5">
        <p className="px-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
          Sistem & Akun
        </p>
        <div className="bg-white rounded-3xl border border-slate-200/85 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {typeof onToggleDarkMode === 'function' && (
            <button
              type="button"
              onClick={onToggleDarkMode}
              role="switch"
              aria-checked={isDarkMode}
              className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/90 transition text-left cursor-pointer"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                  <IconPillTheme dark={isDarkMode} size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-extrabold text-slate-900 truncate">
                    Mode Gelap
                  </span>
                  <span className="block text-[11px] font-medium text-slate-500 truncate mt-0.5">
                    {isDarkMode ? 'Aktif • Tampilan gelap nyaman di mata' : 'Nonaktif • Tema terang'}
                  </span>
                </span>
              </span>

              {/* Toggle Switch Hijau Ala Gojek */}
              <span
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    isDarkMode ? 'translate-x-[22px]' : 'translate-x-[2px]'
                  }`}
                />
              </span>
            </button>
          )}
          <MenuRowButton
            icon={<IconPillServer size={18} />}
            iconBg="bg-slate-100 text-slate-700"
            title="Status Server & Koneksi GAS"
            subtitle={isOnline ? `API ${backendVersion || expectedBackendVersion} • Online` : 'Mode Offline'}
            badge={isBackendOutdated ? 'Perlu Cek' : ''}
            badgeColor="bg-amber-100 text-amber-800"
            activeDesktop={activeMenuId === 'server'}
            onClick={() => openSection('server')}
          />
          <button
            type="button"
            onClick={() => typeof onLogout === 'function' && onLogout()}
            className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-rose-50/70 transition text-left cursor-pointer"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <IconPillLogout size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold text-rose-600">
                  Keluar Mode Pengurus
                </span>
                <span className="block text-[11px] text-slate-400">
                  Kembali ke mode publik warga
                </span>
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Footer Versi Kecil (Ala Gojek Profilku) */}
      <p className="text-center text-[11px] font-semibold text-slate-400 pt-1">
        C-Money V7 • API {backendVersion || expectedBackendVersion}
      </p>
    </div>
  );

  const SECTION_TITLES = {
    mutasi: 'Catat Mutasi Kas',
    validasi: 'Validasi Lunas Warga',
    tutup_buku: 'Tutup Buku & Laporan WA',
    payroll: 'Slip Gaji Security',
    server: 'Status Server & GAS'
  };

  return (
    <div className="px-3.5 sm:px-5 lg:px-6 pt-3 sm:pt-5">
      {/* Banner Toast Non-Blocking (Selalu Terlihat di Atas) */}
      {toast && (
        <div
          className={`mb-4 rounded-2xl p-3.5 border shadow-sm flex items-start justify-between gap-3 animate-fade-in ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="min-w-0 text-xs space-y-0.5">
            <p className="font-extrabold">{toast.title}</p>
            {toast.detail && <p className="opacity-85">{toast.detail}</p>}
            {toast.linkUrl && (
              <button
                type="button"
                onClick={() =>
                  typeof onOpenLightbox === 'function' &&
                  onOpenLightbox([toast.linkUrl], 'Bukti Transaksi Baru')
                }
                className="inline-flex items-center gap-1 mt-1 font-extrabold text-teal-700 underline cursor-pointer"
              >
                <IconPhoto size={14} />
                <span>Lihat Foto Bukti</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-black/5 shrink-0 cursor-pointer"
          >
            <IconClose size={15} />
          </button>
        </div>
      )}

      {/* ====================================================================
          TAMPILAN MOBILE (< 1024px): DRILL-DOWN 1 KOLOM (1 PANAH KEMBALI)
      ==================================================================== */}
      <div className="lg:hidden">
        {mobileSection === 'menu' ? (
          renderProfileMenuColumn()
        ) : (
          <div className="space-y-3.5">
            {/* Bar Kembali Tunggal (Persis Privacy Settings / Aktivitas Gojek) */}
            <div className="sticky top-0 z-20 -mx-3.5 px-3.5 py-2.5 bg-[#F4F7F6]/95 backdrop-blur-md flex items-center justify-between gap-2 border-b border-slate-200/70">
              <button
                type="button"
                onClick={() => setMobileSection('menu')}
                className="inline-flex items-center gap-2.5 text-slate-900 font-black text-base cursor-pointer"
              >
                <span className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                  <IconArrowLeft size={18} />
                </span>
                <span>{SECTION_TITLES[mobileSection] || 'Ruang Pengurus'}</span>
              </button>

              {isSyncingBackground && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full animate-pulse">
                  Sinkron...
                </span>
              )}
            </div>

            {renderSectionContent(mobileSection)}
          </div>
        )}
      </div>

      {/* ====================================================================
          TAMPILAN DESKTOP (>= 1024px): MASTER-DETAIL 2 KOLOM DINAMIS
      ==================================================================== */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 xl:col-span-4">{renderProfileMenuColumn()}</div>
        <div className="lg:col-span-8 xl:col-span-8 space-y-4">
          {/* Sub-header ringkas di atas panel kerja Desktop */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-600 hover:text-emerald-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              <IconArrowLeft size={15} />
              <span>Kembali ke Tampilan Warga</span>
            </button>

            {isSyncingBackground && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full animate-pulse">
                Sinkronisasi latar berjalan...
              </span>
            )}
          </div>

          {renderSectionContent(desktopSection)}
        </div>
      </div>

      {/* ====================================================================
          SHEET VALIDASI CEPAT — BOTTOM SHEET (MOBILE) / MODAL (DESKTOP)
      ==================================================================== */}
      {activeValHouse && (
        <div
          onClick={() => !isSavingVal && setActiveValHouse(null)}
          className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-[2px] flex items-end sm:items-center justify-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 px-5 pt-3 sm:pt-5 max-h-[90vh] overflow-y-auto space-y-4 animate-fade-in"
          >
            <div className="w-11 h-1.5 rounded-full bg-slate-300 mx-auto sm:hidden" />

            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                  Validasi Periode {selectedMonth} {selectedYear}
                </p>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  {formatHouseLabel(activeValHouse)}
                </h3>
              </div>
              <button
                type="button"
                disabled={isSavingVal}
                onClick={() => setActiveValHouse(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <IconClose size={16} />
              </button>
            </div>

            {activeValHouse.ipl_bukti_url && (
              <button
                type="button"
                onClick={() =>
                  typeof onOpenLightbox === 'function' &&
                  onOpenLightbox(
                    [activeValHouse.ipl_bukti_url],
                    `Bukti Warga • ${formatHouseLabel(activeValHouse)}`
                  )
                }
                className="w-full py-2.5 px-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
              >
                <IconPhoto size={16} />
                <span>Periksa Bukti Transfer dari Warga</span>
              </button>
            )}

            <form onSubmit={handleSubmitValidation} className="space-y-3.5">
              {/* Pilihan Paket Netral */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Paket Pembayaran (Kas Nyata)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_PACKAGES.map((pkg) => {
                    const selected = valSheetForm.packageId === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() =>
                          setValSheetForm((prev) => ({
                            ...prev,
                            packageId: pkg.id,
                            nominal: pkg.nominal
                          }))
                        }
                        className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                          selected
                            ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <p className="text-xs font-extrabold text-slate-900">{pkg.label}</p>
                        <p className="text-[11px] font-black text-emerald-700 mt-0.5">
                          {formatRupiah(pkg.nominal)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status & Nominal Custom */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                  <select
                    value={valSheetForm.status}
                    onChange={(e) => setValSheetForm({ ...valSheetForm, status: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-extrabold outline-none"
                  >
                    <option value="Lunas">Lunas</option>
                    <option value="Menunggu Validasi">Menunggu Validasi</option>
                    <option value="Belum Bayar">Belum Bayar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    value={valSheetForm.nominal}
                    onChange={(e) =>
                      setValSheetForm({ ...valSheetForm, nominal: Number(e.target.value) })
                    }
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-extrabold outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Auto-Jurnal Checkbox */}
              {valSheetForm.status === 'Lunas' && (
                <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={valSheetForm.autoJournal}
                    onChange={(e) =>
                      setValSheetForm({ ...valSheetForm, autoJournal: e.target.checked })
                    }
                    className="w-4 h-4 mt-0.5 rounded accent-emerald-600"
                  />
                  <span className="text-[11px] font-bold text-emerald-900 leading-snug">
                    Auto-Jurnal ke Buku Kas (otomatis menambah Saldo Kas Nyata periode{' '}
                    {selectedMonth})
                  </span>
                </label>
              )}

              <input
                type="text"
                placeholder="Catatan validasi (opsional, misal: Tunai ke bendahara)..."
                value={valSheetForm.catatan}
                onChange={(e) => setValSheetForm({ ...valSheetForm, catatan: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium outline-none focus:bg-white focus:border-emerald-500"
              />

              {/* Opsional Upload Bukti dari Pengurus */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-600 font-semibold truncate">
                  {valPhotoName || 'Bukti tambahan (opsional)'}
                </span>
                <label className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-extrabold text-slate-700 cursor-pointer shrink-0">
                  {valPhotoBase64 ? 'Ganti' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleValFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isSavingVal}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-extrabold shadow-md shadow-emerald-600/20 transition disabled:opacity-60 cursor-pointer"
              >
                {isSavingVal ? 'Menyimpan Validasi...' : 'Simpan Validasi Sekarang'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Komponen Baris Menu Seragam ala Profilku Gojek
 */
function MenuRowButton({
  icon,
  iconBg = 'bg-slate-100 text-slate-700',
  title,
  subtitle = '',
  badge = '',
  badgeColor = 'bg-emerald-100 text-emerald-800',
  activeDesktop = false,
  onClick
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-4 py-3.5 flex items-center justify-between gap-3 transition text-left cursor-pointer ${
        activeDesktop
          ? 'lg:bg-emerald-50/90 hover:bg-emerald-50'
          : 'hover:bg-slate-50/90'
      }`}
    >
      <span className="flex items-center gap-3 min-w-0">
        <span
          className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}
        >
          {icon}
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="text-[13px] font-extrabold text-slate-900 truncate">{title}</span>
            {badge && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${badgeColor}`}
              >
                {badge}
              </span>
            )}
          </span>
          {subtitle && (
            <span className="block text-[11px] font-medium text-slate-500 truncate mt-0.5">
              {subtitle}
            </span>
          )}
        </span>
      </span>

      <IconChevronRight
        size={17}
        className={`shrink-0 ${activeDesktop ? 'lg:text-emerald-600 text-slate-400' : 'text-slate-400'}`}
      />
    </button>
  );
}
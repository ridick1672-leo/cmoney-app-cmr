import React, { useState, useRef, useMemo } from 'react';
import { compressMultipleImagesToBase64 } from '../services/apiService';
import SecurityAttendanceCard from './SecurityAttendanceCard';
import {
  Icon3DParking,
  Icon3DPackage,
  Icon3DSecurity,
  Icon3DReport,
  Icon3DSchedule,
  Icon3DPayroll,
  Icon3DIplCheck,
  Icon3DMore,
  Icon3DArchive,
  Icon3DRules,
  Icon3DInstallApp,
  Icon3DTheme,
  Icon3DSos,
  Icon3DCctv,
  IconPillLedger,
  IconPillCalendar,
  IconPillCheck,
  IconPillAdmin,
  IconPillQris,
  IconEye,
  IconArrowLeft,
  IconChevronRight,
  IconChevronDown,
  IconClose,
  IconSearch,
  IconPhoto,
  IconUpload,
  IconClock,
  IconAlert,
  ClusterHeaderIllustration,
  EmptyStateIllustration
} from './CMoneyIcons';

/**
 * ============================================================================
 * C-MONEY V7 — PUBLIC DASHBOARD (POLA GOJEK ADAPTIF MOBILE <-> DESKTOP)
 * ============================================================================
 * - 100% kompatibel dengan Code.gs V6.3, apiService.js, & SecurityAttendanceCard.jsx
 * - Saldo Kas Nyata 100% Live (Single Source of Truth dari cash_ledger)
 * - Nol duplikasi navigasi & nol duplikasi banner Paket Pos
 */

// SAKLAR FITUR (FEATURE FLAGS) — Ubah ke true bila ingin mengaktifkan SOS / CCTV
const SHOW_SOS_BUTTON = false;
const SHOW_CCTV_PANEL = false;

const MAX_SECURITY_PHOTOS = 5;

const MONTH_LIST = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_ORDER = {
  Januari: 1, Februari: 2, Maret: 3, April: 4, Mei: 5, Juni: 6,
  Juli: 7, Agustus: 8, September: 9, Oktober: 10, November: 11, Desember: 12
};

// Preset Pilihan Cepat Laporan Pos Security (3 Kategori — Absen Shift dikelola SecurityAttendanceCard)
const SECURITY_CATEGORY_TABS = [
  { id: 'PAKET_SURAT', label: 'Paket Warga', short: 'Paket' },
  { id: 'PATROLI', label: 'Patroli', short: 'Patroli' },
  { id: 'ANOMALI_FASILITAS', label: 'Kendala / Izin Pos', short: 'Kendala' }
];

const SECURITY_PRESETS = {
  PAKET_SURAT: [
    'Paket Tiba di Pos (Belum Diambil)',
    'Paket Sudah Diambil / Diantar ke Rumah',
    'Titip Uang / Paket COD di Pos'
  ],
  PATROLI: [
    'Patroli Pagi (10:00)',
    'Patroli Siang / Dzuhur',
    'Patroli Sore (17:00)',
    'Patroli Malam (22:00)',
    'Patroli Dini Hari (02:00)',
    'Patroli Subuh (05:00)'
  ],
  ANOMALI_FASILITAS: [
    'Izin Sholat Jumat / ISOMA (Gerbang Dikunci)',
    'Kendala Lampu / Listrik / Gerbang',
    'Tamu / Survei / Kurir (KTP Dicatat)',
    'Pengambilan Sampah / Isi Galon Pos',
    'Info Renovasi / Acara Warga'
  ]
};

const CUACA_815_OPTIONS = ['Cerah', 'Mendung', 'Gerimis', 'Hujan Deras', 'Panas Terik'];

const TITIK_PATROLI_OPTIONS = [
  '5 Titik (Pos, Gerbang, Gang Depan, Gang Belakang, Lapangan)',
  'Pos Utama & Gerbang Cluster',
  'Area Parkir Fasum & Lapangan',
  'Jalur Belakang & Keliling Blok'
];

const LOG_CATEGORY_BADGE = {
  PAKET_SURAT: { label: 'Paket', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  PATROLI: { label: 'Patroli', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  ABSEN_SHIFT: { label: 'Shift', cls: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  PARKIR_FASUM: { label: 'Parkir', cls: 'bg-sky-50 text-sky-800 border-sky-200' },
  ANOMALI_FASILITAS: { label: 'Kendala/Izin', cls: 'bg-rose-50 text-rose-800 border-rose-200' },
  TAMU_COD: { label: 'Tamu/COD', cls: 'bg-orange-50 text-orange-800 border-orange-200' },
  OPERASIONAL_POS: { label: 'Pos', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  INFO_WARGA: { label: 'Info', cls: 'bg-teal-50 text-teal-800 border-teal-200' },
  IZIN_POS: { label: 'Izin Pos', cls: 'bg-violet-50 text-violet-800 border-violet-200' }
};

const FALLBACK_CLOSINGS = [
  {
    id: 'CLS-2026-10',
    periode_bulan: 'Oktober',
    periode_tahun: 2026,
    saldo_awal: 2069200,
    uang_masuk: 4150000,
    total_pengeluaran: 4825000,
    pengeluaran_proyek: 350000,
    sisa_saldo: 1394200,
    status_tutup_buku: 'CLOSED'
  },
  {
    id: 'CLS-2026-09',
    periode_bulan: 'September',
    periode_tahun: 2026,
    saldo_awal: 2154200,
    uang_masuk: 4200000,
    total_pengeluaran: 4285000,
    pengeluaran_proyek: 450000,
    sisa_saldo: 2069200,
    status_tutup_buku: 'CLOSED'
  }
];

const EMPTY_PARKING_SLOTS = [
  { slot_id: 'SLOT-01', slot_number: 1, posisi_layout: 'KIRI_VERTIKAL_1', nama_slot: 'Slot 01', status_slot: 'Kosong', house_id: '-', nama_pemilik: '-', nomor_polisi: '-', jenis_paket: 'Tersedia', waktu_masuk: '-', catatan: 'Kosong — Klik untuk Check-In', updated_by: 'SYSTEM' },
  { slot_id: 'SLOT-02', slot_number: 2, posisi_layout: 'KIRI_VERTIKAL_2', nama_slot: 'Slot 02', status_slot: 'Kosong', house_id: '-', nama_pemilik: '-', nomor_polisi: '-', jenis_paket: 'Tersedia', waktu_masuk: '-', catatan: 'Kosong — Klik untuk Check-In', updated_by: 'SYSTEM' },
  { slot_id: 'SLOT-03', slot_number: 3, posisi_layout: 'KIRI_VERTIKAL_3', nama_slot: 'Slot 03', status_slot: 'Kosong', house_id: '-', nama_pemilik: '-', nomor_polisi: '-', jenis_paket: 'Tersedia', waktu_masuk: '-', catatan: 'Kosong — Klik untuk Check-In', updated_by: 'SYSTEM' },
  { slot_id: 'SLOT-04', slot_number: 4, posisi_layout: 'KIRI_VERTIKAL_4', nama_slot: 'Slot 04', status_slot: 'Kosong', house_id: '-', nama_pemilik: '-', nomor_polisi: '-', jenis_paket: 'Tersedia', waktu_masuk: '-', catatan: 'Kosong — Klik untuk Check-In', updated_by: 'SYSTEM' },
  { slot_id: 'SLOT-05', slot_number: 5, posisi_layout: 'KANAN_ATAS_5', nama_slot: 'Slot 05', status_slot: 'Kosong', house_id: '-', nama_pemilik: '-', nomor_polisi: '-', jenis_paket: 'Tersedia', waktu_masuk: '-', catatan: 'Kosong — Klik untuk Check-In', updated_by: 'SYSTEM' },
  { slot_id: 'SLOT-06', slot_number: 6, posisi_layout: 'KANAN_BAWAH_6', nama_slot: 'Slot 06', status_slot: 'Kosong', house_id: '-', nama_pemilik: '-', nomor_polisi: '-', jenis_paket: 'Tersedia', waktu_masuk: '-', catatan: 'Kosong — Klik untuk Check-In', updated_by: 'SYSTEM' }
];

function extractCleanNum(rawVal) {
  const digits = String(rawVal || '').replace(/[^0-9]/g, '');
  return digits ? digits.padStart(2, '0') : '';
}

function getLogPhotoUrls(log) {
  if (!log) return [];
  if (Array.isArray(log.photo_urls) && log.photo_urls.length > 0) {
    return log.photo_urls.filter((u) => u && u !== '-');
  }
  const raw =
    (log.url_foto && log.url_foto !== '-' ? log.url_foto : '') ||
    (log.url_bukti && log.url_bukti !== '-' ? log.url_bukti : '');
  if (!raw) return [];
  return String(raw)
    .split('|')
    .map((u) => u.trim())
    .filter((u) => u && u !== '-');
}

function generateSecuritySchedules(monthName = 'November', year = 2026) {
  const monthIdx = Math.max(0, MONTH_LIST.indexOf(monthName));
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const anchorSunday = new Date(2026, 10, 1);
  const list = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, monthIdx, d);
    const dow = dateObj.getDay();
    const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const diffDays = Math.floor((dateObj - anchorSunday) / (1000 * 60 * 60 * 24));
    const cycleWeek = Math.floor((diffDays + 1) / 7);
    const isEvenWeek = ((cycleWeek % 2) + 2) % 2 === 0;

    const shiftPagi = isEvenWeek ? 'Pak Eko' : 'Pak Mulyadi';
    let shiftMalam = isEvenWeek ? 'Pak Mulyadi' : 'Pak Eko';
    let statusJadwal = '2 Shift Normal';

    if (dow === 5) {
      shiftMalam = 'LIBUR (Gerbang Mandiri 20:00)';
      statusJadwal = 'Jumat Malam Libur';
    } else if (dow === 6) {
      shiftMalam = 'LIBUR (Gerbang Mandiri 20:00)';
      statusJadwal = 'Rotasi Pagi • Malam Libur';
    }

    list.push({
      id: `SCH-${dateStr}`,
      tanggal: dateStr,
      hari: dayNames[dow],
      shift_pagi: shiftPagi,
      shift_malam: shiftMalam,
      status_jadwal: statusJadwal
    });
  }
  return list;
}

function parseLogTimestamp(log) {
  if (!log || !log.tanggal) return null;
  const datePart = String(log.tanggal).slice(0, 10);
  const timePart = String(log.jam || '00:00').replace(/\./g, ':').slice(0, 5);
  const dt = new Date(`${datePart}T${timePart}:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

async function copyTextSafe(text) {
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

export default function PublicDashboard({
  data,
  dashboardData,
  hasServerData = false,
  selectedMonth = 'November',
  selectedYear = 2026,
  onChangePeriod,
  activeTab: externalActiveTab,
  setActiveTab: externalSetActiveTab,
  onOpenQris,
  onOpenAdmin,
  onOpenAdminLogin,
  onInputSecurityLog,
  onUpdateParkingSlot,
  onOpenLightbox,
  onOpenPwaInstall,
  isPwaInstalled = false,
  isDarkMode = false,
  onToggleDarkMode,
  formatHouseIdentity
}) {
  const sourceData = data || dashboardData || {};

  const [internalTab, setInternalTab] = useState('beranda');
  const activeTab = externalActiveTab || internalTab;
  const setActiveTab = externalSetActiveTab || setInternalTab;

  const [showBalance, setShowBalance] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState(selectedMonth || 'November');

  // Bottom Sheet Informatif dari Bar Menu Kapsul (Jadwal Bulanan / Transparansi Gaji / Tata Tertib)
  const [infoSheet, setInfoSheet] = useState(null); // null | 'schedule' | 'payroll' | 'rules'

  // Filter Tab Daftar Warga
  const [searchRumah, setSearchRumah] = useState('');
  const [filterStatusIpl, setFilterStatusIpl] = useState('ALL');

  // Filter Tab Buku Kas
  const [filterBulanKas, setFilterBulanKas] = useState('Semua');
  const [filterKategoriKas, setFilterKategoriKas] = useState('ALL');

  // State Denah 6 Slot Parkir (Tanpa Optimistic UI Palsu)
  const [activeParkingModalSlot, setActiveParkingModalSlot] = useState(null);
  const [isSavingSlot, setIsSavingSlot] = useState(false);
  const [parkingFeedback, setParkingFeedback] = useState({ type: '', text: '' });

  // State Pos Security & Multi-Foto
  const [secSubTab, setSecSubTab] = useState('jadwal'); // 'jadwal' (Absen) | 'paket' | 'lapor' | 'riwayat'
  const [filterLogCategory, setFilterLogCategory] = useState('ALL');
  const [copiedWaText, setCopiedWaText] = useState('');
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [updatingPkgId, setUpdatingPkgId] = useState('');
  const [secFeedback, setSecFeedback] = useState({ type: '', text: '' });

  const [secPhotos, setSecPhotos] = useState([]);
  const [isCompressingSecPhotos, setIsCompressingSecPhotos] = useState(false);

  const [secForm, setSecForm] = useState({
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'PAKET_SURAT',
    sub_kategori: SECURITY_PRESETS.PAKET_SURAT[0],
    house_id: 'H-01',
    titik_patroli: TITIK_PATROLI_OPTIONS[0],
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: ''
  });

  // State Tombol SOS (Hanya aktif jika SHOW_SOS_BUTTON = true)
  const [sosProgress, setSosProgress] = useState(0);
  const sosTimerRef = useRef(null);

  const monthlyClosingsRef = useRef(null);

  const formatRp = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');

  // Daftar 22 Rumah (Format Seragam "No. XX / Nama Warga")
  const houses = useMemo(() => {
    const raw = Array.isArray(sourceData.houses) ? sourceData.houses : [];
    return raw
      .map((h) => {
        const cleanNum = extractCleanNum(h.nomor_rumah || h.id) || '00';
        const cleanName = String(h.nama_warga || h.nama_kepala_keluarga || 'Warga').trim();
        return {
          ...h,
          nomor_rumah: cleanNum,
          nama_warga: cleanName,
          nama_kepala_keluarga: cleanName,
          display_label: `No. ${cleanNum} / ${cleanName}`
        };
      })
      .sort((a, b) => Number(a.nomor_rumah) - Number(b.nomor_rumah));
  }, [sourceData.houses]);

  const activeHouses = useMemo(
    () =>
      houses.filter(
        (h) => String(h.status_huni || 'Aktif').toLowerCase() !== 'tidak aktif' && h.id !== 'H-04'
      ),
    [houses]
  );

  const getHouseLabel = (houseOrId) => {
    if (!houseOrId || houseOrId === '-') return '-';

    if (typeof houseOrId === 'object') {
      const no = extractCleanNum(houseOrId.nomor_rumah || houseOrId.id) || '00';
      const nama = String(houseOrId.nama_warga || houseOrId.nama_kepala_keluarga || 'Warga').trim();
      return `No. ${no} / ${nama}`;
    }

    const rawStr = String(houseOrId).trim();
    const digits = extractCleanNum(rawStr);
    const matched = houses.find(
      (h) =>
        String(h.id || '').toUpperCase() === rawStr.toUpperCase() ||
        (digits && h.nomor_rumah === digits)
    );
    if (matched) return matched.display_label;

    if (typeof formatHouseIdentity === 'function') {
      return formatHouseIdentity(houseOrId);
    }
    return rawStr;
  };

  // Buku Kas (100% Data Riil Spreadsheet)
  const cashLedger = useMemo(() => {
    return Array.isArray(sourceData.cash_ledger) ? sourceData.cash_ledger : [];
  }, [sourceData.cash_ledger]);

  // Laporan Bulanan dengan KALKULASI LIVE untuk Bulan Berjalan (OPEN)
  const monthlyClosings = useMemo(() => {
    const rawList =
      Array.isArray(sourceData.monthly_closings) && sourceData.monthly_closings.length > 0
        ? sourceData.monthly_closings.map((item) => ({ ...item }))
        : hasServerData
        ? []
        : FALLBACK_CLOSINGS.map((item) => ({ ...item }));

    const closedRows = rawList
      .filter((c) => String(c.status_tutup_buku || '').toUpperCase() === 'CLOSED')
      .sort((a, b) => {
        const yDiff = Number(b.periode_tahun || 2026) - Number(a.periode_tahun || 2026);
        if (yDiff !== 0) return yDiff;
        return (MONTH_ORDER[b.periode_bulan] || 0) - (MONTH_ORDER[a.periode_bulan] || 0);
      });

    const lastClosedSaldo =
      closedRows.length > 0 ? Number(closedRows[0].sisa_saldo || 1394200) : 1394200;

    const hasSelected = rawList.some(
      (c) =>
        String(c.periode_bulan) === String(selectedMonth) &&
        Number(c.periode_tahun || 2026) === Number(selectedYear)
    );

    if (!hasSelected && selectedMonth) {
      rawList.push({
        id: `CLS-${selectedYear}-${selectedMonth}`,
        periode_bulan: selectedMonth,
        periode_tahun: Number(selectedYear),
        saldo_awal: lastClosedSaldo,
        uang_masuk: 0,
        total_pengeluaran: 0,
        pengeluaran_proyek: 0,
        sisa_saldo: lastClosedSaldo,
        status_tutup_buku: 'OPEN'
      });
    }

    const chronological = rawList.sort((a, b) => {
      const yDiff = Number(a.periode_tahun || 2026) - Number(b.periode_tahun || 2026);
      if (yDiff !== 0) return yDiff;
      return (MONTH_ORDER[a.periode_bulan] || 0) - (MONTH_ORDER[b.periode_bulan] || 0);
    });

    let runningSaldo = lastClosedSaldo;
    const computed = chronological.map((item) => {
      const isClosed = String(item.status_tutup_buku || '').toUpperCase() === 'CLOSED';
      if (isClosed) {
        runningSaldo = Number(item.sisa_saldo || 0);
        return item;
      }

      const monthTx = cashLedger.filter(
        (tx) =>
          String(tx.periode_bulan) === String(item.periode_bulan) &&
          Number(tx.periode_tahun || 2026) === Number(item.periode_tahun || 2026)
      );

      let uangMasuk = 0;
      let totalPengeluaran = 0;
      let pengeluaranProyek = 0;

      monthTx.forEach((tx) => {
        const nom = Number(tx.nominal || 0);
        const isProyek =
          tx.is_proyek === true || String(tx.is_proyek || '').toUpperCase() === 'TRUE';
        if (String(tx.tipe || '').toUpperCase() === 'IN') {
          uangMasuk += nom;
        } else {
          totalPengeluaran += nom;
          if (isProyek) pengeluaranProyek += nom;
        }
      });

      const saldoAwal = runningSaldo;
      const sisaSaldo = saldoAwal + uangMasuk - totalPengeluaran;
      runningSaldo = sisaSaldo;

      return {
        ...item,
        saldo_awal: saldoAwal,
        uang_masuk: uangMasuk,
        total_pengeluaran: totalPengeluaran,
        pengeluaran_proyek: pengeluaranProyek,
        sisa_saldo: sisaSaldo,
        status_tutup_buku: 'OPEN'
      };
    });

    return computed.sort((a, b) => {
      const yearDiff = Number(b.periode_tahun || 2026) - Number(a.periode_tahun || 2026);
      if (yearDiff !== 0) return yearDiff;
      return (MONTH_ORDER[b.periode_bulan] || 0) - (MONTH_ORDER[a.periode_bulan] || 0);
    });
  }, [sourceData.monthly_closings, cashLedger, selectedMonth, selectedYear, hasServerData]);

  // SALDO KAS NYATA 100% LIVE (SUMBER KEBENARAN TUNGGAL)
  const liveCurrentBalance = useMemo(() => {
    if (!hasServerData && cashLedger.length === 0) {
      return Number(sourceData.current_balance ?? 1394200);
    }

    const closedRows = monthlyClosings
      .filter((c) => String(c.status_tutup_buku || '').toUpperCase() === 'CLOSED')
      .sort((a, b) => {
        const yDiff = Number(b.periode_tahun || 2026) - Number(a.periode_tahun || 2026);
        if (yDiff !== 0) return yDiff;
        return (MONTH_ORDER[b.periode_bulan] || 0) - (MONTH_ORDER[a.periode_bulan] || 0);
      });

    let baseBalance = 1394200;
    let closedYear = 2026;
    let closedMonthNum = 10;

    if (closedRows.length > 0) {
      baseBalance = Number(closedRows[0].sisa_saldo || 0);
      closedYear = Number(closedRows[0].periode_tahun || 2026);
      closedMonthNum = MONTH_ORDER[closedRows[0].periode_bulan] || 10;
    }

    let totalInAfter = 0;
    let totalOutAfter = 0;

    cashLedger.forEach((tx) => {
      const txYear = Number(tx.periode_tahun || 2026);
      const txMonthNum = MONTH_ORDER[tx.periode_bulan] || 0;
      const isAfterClose =
        txYear > closedYear || (txYear === closedYear && txMonthNum > closedMonthNum);

      if (isAfterClose) {
        const nom = Number(tx.nominal || 0);
        if (String(tx.tipe || '').toUpperCase() === 'IN') {
          totalInAfter += nom;
        } else {
          totalOutAfter += nom;
        }
      }
    });

    return baseBalance + totalInAfter - totalOutAfter;
  }, [monthlyClosings, cashLedger, hasServerData, sourceData.current_balance]);

  // Denah 6 Slot Parkir (Sinkron Server, Default Semua KOSONG)
  const parkingSlots = useMemo(() => {
    const serverSlots = Array.isArray(sourceData.parking_slots) ? sourceData.parking_slots : [];
    if (serverSlots.length === 0) return EMPTY_PARKING_SLOTS;

    return EMPTY_PARKING_SLOTS.map((baseSlot, idx) => {
      const matched =
        serverSlots.find((s) => s.slot_id === baseSlot.slot_id) || serverSlots[idx] || {};
      const upperSt = String(matched.status_slot || 'Kosong').toUpperCase();
      const normStatus =
        upperSt === 'TERISI'
          ? 'Terisi'
          : upperSt === 'WEEKEND'
          ? 'Weekend'
          : upperSt === 'TAMU'
          ? 'Tamu'
          : 'Kosong';

      const houseId = normStatus === 'Kosong' ? '-' : matched.house_id || '-';
      const pemilikLabel =
        normStatus === 'Kosong'
          ? '-'
          : houseId !== '-'
          ? getHouseLabel(houseId)
          : matched.nama_pemilik || 'Tamu / Non-Warga';

      return {
        ...baseSlot,
        ...matched,
        slot_id: baseSlot.slot_id,
        slot_number: baseSlot.slot_number,
        posisi_layout: matched.posisi_layout || baseSlot.posisi_layout,
        nama_slot: matched.nama_slot || baseSlot.nama_slot,
        status_slot: normStatus,
        house_id: houseId,
        nama_pemilik: pemilikLabel,
        nomor_polisi: normStatus === 'Kosong' ? '-' : matched.nomor_polisi || matched.plat_nomor || '-',
        jenis_paket: normStatus === 'Kosong' ? 'Tersedia' : matched.jenis_paket || 'Parkir Bulanan (Rp 150.000)',
        waktu_masuk: normStatus === 'Kosong' ? '-' : matched.waktu_masuk || '-',
        catatan: normStatus === 'Kosong' ? 'Kosong — Klik untuk Check-In' : matched.catatan || '-'
      };
    });
  }, [sourceData.parking_slots, houses]);

  const occupiedParkingCount = parkingSlots.filter((s) => s.status_slot !== 'Kosong').length;

  // Log Security, Paket, & Jadwal
  const securityLogs = useMemo(() => {
    return Array.isArray(sourceData.security_logs) ? sourceData.security_logs : [];
  }, [sourceData.security_logs]);

  const filteredSecurityLogs = useMemo(() => {
    if (filterLogCategory === 'ALL') return securityLogs;
    return securityLogs.filter((l) => l.kategori_laporan === filterLogCategory);
  }, [securityLogs, filterLogCategory]);

  const packageLogs = useMemo(() => {
    return securityLogs.filter((log) => log.kategori_laporan === 'PAKET_SURAT');
  }, [securityLogs]);

  const waitingPackages = useMemo(() => {
    return packageLogs.filter(
      (p) => !String(p.sub_kategori || '').toLowerCase().includes('sudah')
    );
  }, [packageLogs]);

  const waitingPackagesCount = waitingPackages.length;

  const securitySchedules = useMemo(() => {
    if (Array.isArray(sourceData.security_schedules) && sourceData.security_schedules.length > 0) {
      return sourceData.security_schedules;
    }
    return generateSecuritySchedules(selectedMonth, selectedYear);
  }, [sourceData.security_schedules, selectedMonth, selectedYear]);

  // Deteksi Live Petugas yang Sedang Berjaga (Prioritas Absen Check-In 14 Jam Terakhir -> Fallback Jadwal)
  const onDutyInfo = useMemo(() => {
    const now = new Date();
    const absenLogs = securityLogs
      .filter((l) => String(l.kategori_laporan || '').toUpperCase() === 'ABSEN_SHIFT')
      .map((l) => ({ ...l, _ts: parseLogTimestamp(l) }))
      .filter((l) => l._ts)
      .sort((a, b) => b._ts.getTime() - a._ts.getTime());

    if (absenLogs.length > 0) {
      const latest = absenLogs[0];
      const diffHours = (now.getTime() - latest._ts.getTime()) / (1000 * 60 * 60);
      const subUp = String(latest.sub_kategori || '').toUpperCase();
      if (diffHours >= 0 && diffHours <= 14 && !subUp.includes('CHECK_OUT') && !subUp.includes('KELUAR')) {
        return {
          name: latest.nama_security || 'Petugas Pos',
          isLiveCheckIn: true,
          shift: latest.shift || (now.getHours() >= 20 || now.getHours() < 8 ? 'Malam' : 'Pagi')
        };
      }
    }

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const todaySch = securitySchedules.find((s) => String(s.tanggal).slice(0, 10) === todayStr);
    const isNight = now.getHours() >= 20 || now.getHours() < 8;

    if (todaySch) {
      const rawName = isNight ? todaySch.shift_malam : todaySch.shift_pagi;
      const isOff = String(rawName || '').toUpperCase().includes('LIBUR');
      return {
        name: isOff ? 'Malam Libur' : rawName || 'Pak Eko',
        isLiveCheckIn: false,
        shift: isNight ? 'Malam' : 'Pagi'
      };
    }

    return { name: 'Pak Eko', isLiveCheckIn: false, shift: isNight ? 'Malam' : 'Pagi' };
  }, [securityLogs, securitySchedules]);

  // Status IPL Daftar Warga pada Periode Terpilih
  const housesWithIpl = useMemo(() => {
    const iplList = Array.isArray(sourceData.ipl_status) ? sourceData.ipl_status : [];
    return houses.map((h) => {
      const isNonAktif =
        String(h.status_huni || '').toLowerCase() === 'tidak aktif' || h.id === 'H-04';

      const matchedIpl = iplList.find(
        (r) =>
          String(r.house_id).toUpperCase() === String(h.id).toUpperCase() &&
          (!r.periode_bulan || r.periode_bulan === selectedMonth)
      );

      const ledgerIpl = cashLedger.find(
        (tx) =>
          String(tx.tipe || '').toUpperCase() === 'IN' &&
          String(tx.house_id || '').toUpperCase() === String(h.id).toUpperCase() &&
          tx.periode_bulan === selectedMonth
      );

      let rawStatus = isNonAktif
        ? 'Tidak Aktif'
        : matchedIpl?.status_bayar || matchedIpl?.status || (ledgerIpl ? 'Lunas' : 'Belum Bayar');

      if (rawStatus === 'Belum Lunas') rawStatus = 'Belum Bayar';

      const nominalBayar = isNonAktif
        ? 0
        : Number(matchedIpl?.nominal_bayar || matchedIpl?.nominal || ledgerIpl?.nominal || 200000);

      const urlBukti = matchedIpl?.url_bukti || ledgerIpl?.url_bukti || '-';

      return {
        ...h,
        display_label: h.display_label,
        is_non_aktif: isNonAktif,
        status_bayar: rawStatus,
        nominal_bayar: nominalBayar,
        tanggal_bayar: matchedIpl?.tanggal_bayar || ledgerIpl?.tanggal || '-',
        catatan:
          matchedIpl?.catatan ||
          ledgerIpl?.keterangan ||
          (isNonAktif
            ? 'Unit Non-Aktif (Pihak BPR)'
            : `Periode Buku ${selectedMonth} ${selectedYear}`),
        url_bukti: urlBukti
      };
    });
  }, [houses, sourceData.ipl_status, cashLedger, selectedMonth, selectedYear]);

  const totalLunasCount = housesWithIpl.filter((h) => h.status_bayar === 'Lunas').length;
  const totalMenungguCount = housesWithIpl.filter(
    (h) => h.status_bayar === 'Menunggu Validasi'
  ).length;
  const totalBelumBayarCount = housesWithIpl.filter(
    (h) => !h.is_non_aktif && h.status_bayar !== 'Lunas' && h.status_bayar !== 'Menunggu Validasi'
  ).length;

  const filteredHouses = housesWithIpl.filter((h) => {
    const q = searchRumah.toLowerCase();
    const matchSearch =
      h.display_label.toLowerCase().includes(q) ||
      String(h.alias_keluarga || '').toLowerCase().includes(q);
    const matchStatus =
      filterStatusIpl === 'ALL' ||
      (filterStatusIpl === 'AKTIF' ? !h.is_non_aktif : h.status_bayar === filterStatusIpl);
    return matchSearch && matchStatus;
  });

  // Pembentuk Rincian Kategori & Proyek per Bulan dari Buku Kas
  const getMonthlyBreakdown = (bulan, tahun = 2026) => {
    const items = cashLedger.filter(
      (tx) => tx.periode_bulan === bulan && Number(tx.periode_tahun || 2026) === Number(tahun)
    );
    const pemasukanMap = {};
    const pengeluaranMap = {};
    const proyekList = [];

    items.forEach((tx) => {
      const nom = Number(tx.nominal || 0);
      const kat = tx.kategori || 'Lainnya';
      const ket = tx.keterangan || '-';
      const isProyek =
        tx.is_proyek === true || String(tx.is_proyek || '').toUpperCase() === 'TRUE';

      if (String(tx.tipe || '').toUpperCase() === 'IN') {
        pemasukanMap[kat] = (pemasukanMap[kat] || 0) + nom;
      } else {
        if (isProyek) {
          proyekList.push({
            nama: tx.nama_proyek || ket,
            nominal: nom,
            url_bukti: tx.url_bukti || '-'
          });
        }
        if (!pengeluaranMap[kat]) {
          pengeluaranMap[kat] = { total: 0, details: [] };
        }
        pengeluaranMap[kat].total += nom;
        pengeluaranMap[kat].details.push({
          text: `${ket} (${formatRp(nom)})`,
          url_bukti: tx.url_bukti || '-'
        });
      }
    });

    return { pemasukanMap, pengeluaranMap, proyekList };
  };

  // Filter Buku Kas
  const filteredLedger = cashLedger.filter((item) => {
    const matchBulan = filterBulanKas === 'Semua' || item.periode_bulan === filterBulanKas;
    const matchKat =
      filterKategoriKas === 'ALL' ||
      (filterKategoriKas === 'PROYEK'
        ? item.is_proyek === true || String(item.is_proyek || '').toUpperCase() === 'TRUE'
        : String(item.kategori || '').toLowerCase().includes(filterKategoriKas.toLowerCase()));
    return matchBulan && matchKat;
  });

  const totalMasukFilter = filteredLedger
    .filter((i) => String(i.tipe || '').toUpperCase() === 'IN')
    .reduce((acc, cur) => acc + Number(cur.nominal || 0), 0);
  const totalKeluarFilter = filteredLedger
    .filter((i) => String(i.tipe || '').toUpperCase() === 'OUT')
    .reduce((acc, cur) => acc + Number(cur.nominal || 0), 0);

  // Riwayat Transparansi Gaji Security (Dari security_payroll & mutasi kategori Gaji)
  const payrollTransparencyList = useMemo(() => {
    const ledgerSalary = cashLedger
      .filter((tx) => String(tx.kategori || '').toLowerCase().includes('gaji'))
      .slice(0, 10);
    const sheetPayroll = Array.isArray(sourceData.security_payroll)
      ? sourceData.security_payroll
      : [];
    return { ledgerSalary, sheetPayroll };
  }, [cashLedger, sourceData.security_payroll]);

  const triggerLightbox = (urlOrUrls, title, subtitle = '', initialIndex = 0) => {
    if (!urlOrUrls || urlOrUrls === '-') return;
    if (Array.isArray(urlOrUrls) && urlOrUrls.length === 0) return;

    if (typeof onOpenLightbox === 'function') {
      onOpenLightbox(urlOrUrls, title, subtitle, initialIndex);
    } else {
      const first = Array.isArray(urlOrUrls) ? urlOrUrls[0] : urlOrUrls;
      window.open(first, '_blank', 'noopener,noreferrer');
    }
  };

  const triggerAdminOpen = () => {
    if (typeof onOpenAdmin === 'function') onOpenAdmin();
    else if (typeof onOpenAdminLogin === 'function') onOpenAdminLogin();
  };

  const jumpToSecuritySub = (sub) => {
    setActiveTab('keamanan');
    setSecSubTab(sub);
    setSecFeedback({ type: '', text: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Handler Parkir 6 Slot ---
  const openParkingSlotModal = (slot) => {
    const isCurrentlyEmpty = slot.status_slot === 'Kosong';
    setParkingFeedback({ type: '', text: '' });
    setActiveParkingModalSlot({
      ...slot,
      status_slot: isCurrentlyEmpty ? 'Terisi' : slot.status_slot,
      house_id: isCurrentlyEmpty ? activeHouses[0]?.id || 'H-01' : slot.house_id,
      jenis_paket: isCurrentlyEmpty ? 'Parkir Bulanan (Rp 150.000)' : slot.jenis_paket,
      nomor_polisi: isCurrentlyEmpty ? '' : slot.nomor_polisi === '-' ? '' : slot.nomor_polisi,
      catatan: isCurrentlyEmpty
        ? 'Kondisi kendaraan terparkir rapi & aman'
        : slot.catatan === '-'
        ? ''
        : slot.catatan,
      updated_by: slot.updated_by && slot.updated_by !== 'SYSTEM' ? slot.updated_by : 'Pak Eko',
      shift: 'Malam',
      catat_ke_log_security: true
    });
  };

  const handleSaveParkingSlot = async (e) => {
    e.preventDefault();
    if (!activeParkingModalSlot) return;
    setIsSavingSlot(true);
    setParkingFeedback({ type: '', text: '' });

    try {
      const payload = {
        ...activeParkingModalSlot,
        nama_pemilik:
          activeParkingModalSlot.status_slot === 'Kosong'
            ? '-'
            : activeParkingModalSlot.house_id && activeParkingModalSlot.house_id !== '-'
            ? getHouseLabel(activeParkingModalSlot.house_id)
            : activeParkingModalSlot.nama_pemilik || 'Tamu / Non-Warga'
      };

      const res =
        typeof onUpdateParkingSlot === 'function' ? await onUpdateParkingSlot(payload) : null;

      if (res && res.status === 'success') {
        setActiveParkingModalSlot(null);
      } else {
        setParkingFeedback({
          type: 'error',
          text: res?.message || 'Gagal menyimpan perubahan slot parkir ke server.'
        });
      }
    } catch (err) {
      setParkingFeedback({
        type: 'error',
        text: `Error koneksi parkir: ${err.message}`
      });
    } finally {
      setIsSavingSlot(false);
    }
  };

  const handleQuickCheckoutSlot = async () => {
    if (!activeParkingModalSlot) return;
    setIsSavingSlot(true);
    setParkingFeedback({ type: '', text: '' });

    try {
      const checkoutPayload = {
        slot_id: activeParkingModalSlot.slot_id,
        status_slot: 'Kosong',
        house_id: '-',
        nama_pemilik: '-',
        nomor_polisi: '-',
        jenis_paket: 'Tersedia',
        waktu_masuk: '-',
        catatan: 'Kosong — Klik untuk Check-In',
        updated_by: activeParkingModalSlot.updated_by || 'Pak Eko',
        shift: activeParkingModalSlot.shift || 'Pagi',
        catat_ke_log_security: Boolean(activeParkingModalSlot.catat_ke_log_security)
      };

      const res =
        typeof onUpdateParkingSlot === 'function'
          ? await onUpdateParkingSlot(checkoutPayload)
          : null;

      if (res && res.status === 'success') {
        setActiveParkingModalSlot(null);
      } else {
        setParkingFeedback({
          type: 'error',
          text: res?.message || 'Gagal melakukan Check-Out slot parkir.'
        });
      }
    } catch (err) {
      setParkingFeedback({
        type: 'error',
        text: `Error koneksi parkir: ${err.message}`
      });
    } finally {
      setIsSavingSlot(false);
    }
  };

  // --- Handler Form Laporan Security Adaptif + Multi-Foto ---
  const handleSelectSecurityCategory = (catId) => {
    const firstPreset = SECURITY_PRESETS[catId]?.[0] || '';
    setSecFeedback({ type: '', text: '' });
    setSecForm((prev) => ({
      ...prev,
      kategori_laporan: catId,
      sub_kategori: firstPreset,
      house_id:
        catId === 'PAKET_SURAT'
          ? prev.house_id !== '-'
            ? prev.house_id
            : activeHouses[0]?.id || 'H-01'
          : '-'
    }));
  };

  const buildSecurityWaMessage = (formObj) => {
    const houseLabel =
      formObj.house_id && formObj.house_id !== '-' ? getHouseLabel(formObj.house_id) : '-';
    const jamNow = new Date()
      .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
      .replace(/\./g, ':');

    if (formObj.kategori_laporan === 'PAKET_SURAT') {
      return `*INFO PAKET WARGA DI POS SECURITY CMR*\nAssalamualaikum, izin menginformasikan laporan paket/surat warga pukul ${jamNow} WIB:\n• Tujuan Rumah: *${houseLabel}*\n• Status Paket: *${formObj.sub_kategori}*\n• Petugas Pos: *${formObj.nama_security} (Shift ${formObj.shift})*\n• Catatan: ${formObj.detail_catatan || 'Disimpan dengan aman di meja Pos Security.'}\n*Terima kasih* 🙏`;
    }

    if (formObj.kategori_laporan === 'ANOMALI_FASILITAS') {
      return `*INFO POS & KENDALA CLUSTER CMR*\nAssalamualaikum, izin melaporkan update pos pukul ${jamNow} WIB:\n• Kategori: *${formObj.sub_kategori}*${
        houseLabel !== '-' ? `\n• Rumah Terkait: *${houseLabel}*` : ''
      }\n• Petugas Jaga: *${formObj.nama_security} (Shift ${formObj.shift})*\n• Keterangan: ${formObj.detail_catatan || 'Dalam pantauan petugas keamanan.'}\n*Terima kasih* 🙏🫡`;
    }

    return `*LAPORAN PATROLI SECURITY CMR*\nAssalamualaikum, izin lapor petugas jaga (*${formObj.nama_security} - Shift ${formObj.shift}*) pukul ${jamNow} WIB:\n• Giat: *${formObj.sub_kategori}*\n• Titik Pantau: ${formObj.titik_patroli}\n• Situasi: ${formObj.detail_catatan || 'Aman kondusif tanpa taruna.'}\n• Cuaca 815: ${formObj.cuaca_815}\n*Terima kasih* 🙏🫡`;
  };

  const handleSecPhotosChange = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setSecFeedback({ type: '', text: '' });
    const remainingSlots = MAX_SECURITY_PHOTOS - secPhotos.length;

    if (remainingSlots <= 0) {
      setSecFeedback({
        type: 'error',
        text: `Batas maksimal ${MAX_SECURITY_PHOTOS} foto per laporan sudah tercapai.`
      });
      e.target.value = '';
      return;
    }

    setIsCompressingSecPhotos(true);
    try {
      const compressedList = await compressMultipleImagesToBase64(
        selectedFiles,
        remainingSlots,
        720,
        0.72
      );
      setSecPhotos((prev) => [...prev, ...compressedList].slice(0, MAX_SECURITY_PHOTOS));

      if (selectedFiles.length > remainingSlots) {
        setSecFeedback({
          type: 'error',
          text: `Hanya ${remainingSlots} foto tambahan yang dimuat (batas maks. ${MAX_SECURITY_PHOTOS} foto).`
        });
      }
    } catch (err) {
      setSecFeedback({
        type: 'error',
        text: err.message || 'Sebagian foto gagal dibaca/dikompresi. Silakan pilih ulang.'
      });
    } finally {
      setIsCompressingSecPhotos(false);
      e.target.value = '';
    }
  };

  const handleRemoveSecPhoto = (photoId) => {
    setSecPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleSubmitSecurityForm = async (e) => {
    e.preventDefault();
    if (isCompressingSecPhotos) {
      setSecFeedback({ type: 'error', text: 'Tunggu sebentar, foto masih dikompresi...' });
      return;
    }

    setIsSavingLog(true);
    setSecFeedback({ type: '', text: '' });

    try {
      const now = new Date();
      const useHouse =
        secForm.kategori_laporan === 'PAKET_SURAT' ||
        secForm.kategori_laporan === 'ANOMALI_FASILITAS';
      const finalHouseId = useHouse ? secForm.house_id : '-';
      const houseLabel = finalHouseId !== '-' ? getHouseLabel(finalHouseId) : '-';
      const waText = buildSecurityWaMessage({ ...secForm, house_id: finalHouseId });

      const payload = {
        tanggal: now.toISOString().slice(0, 10),
        jam: now
          .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
          .replace(/\./g, ':'),
        nama_security: secForm.nama_security,
        shift: secForm.shift,
        kategori_laporan: secForm.kategori_laporan,
        sub_kategori: secForm.sub_kategori,
        house_id: finalHouseId,
        nama_warga_tujuan: houseLabel,
        titik_patroli:
          secForm.kategori_laporan === 'PATROLI'
            ? secForm.titik_patroli
            : 'Pos Utama Security',
        cuaca_815: secForm.cuaca_815,
        status_gerbang: secForm.status_gerbang,
        detail_catatan:
          secForm.detail_catatan.trim() ||
          (secForm.kategori_laporan === 'PAKET_SURAT'
            ? `Paket untuk ${houseLabel} (${secForm.sub_kategori})`
            : `${secForm.sub_kategori} — Situasi aman kondusif.`),
        files_base64: secPhotos.map((p) => ({ base64: p.base64, name: p.name })),
        expect_photo: secPhotos.length > 0,
        teks_wa: waText
      };

      const res =
        typeof onInputSecurityLog === 'function' ? await onInputSecurityLog(payload) : null;

      if (res && res.status === 'success') {
        setCopiedWaText(waText);
        copyTextSafe(waText);
        setSecFeedback({
          type: 'success',
          text:
            res.message ||
            `Laporan tersimpan ke Database & Drive (${secPhotos.length} foto)! Teks WA disalin.`
        });
        setSecForm((prev) => ({ ...prev, detail_catatan: '' }));
        setSecPhotos([]);
      } else {
        setSecFeedback({
          type: 'error',
          text:
            res?.message ||
            'Gagal menyimpan laporan ke Database/Drive. Foto Anda masih aman, silakan kirim ulang.'
        });
      }
    } catch (err) {
      setSecFeedback({
        type: 'error',
        text: `Gagal terhubung ke server: ${err.message}`
      });
    } finally {
      setIsSavingLog(false);
    }
  };

  const handleMarkPackagePickedUp = async (pkgItem) => {
    setUpdatingPkgId(pkgItem.id);
    setSecFeedback({ type: '', text: '' });
    try {
      const updatedItem = {
        ...pkgItem,
        sub_kategori: 'Paket Sudah Diambil / Diantar ke Rumah',
        detail_catatan: `${pkgItem.detail_catatan} (Sudah diterima warga)`
      };

      const res =
        typeof onInputSecurityLog === 'function' ? await onInputSecurityLog(updatedItem) : null;

      if (!res || res.status !== 'success') {
        setSecFeedback({
          type: 'error',
          text: res?.message || 'Gagal memperbarui status paket di Spreadsheet.'
        });
      }
    } catch (err) {
      setSecFeedback({
        type: 'error',
        text: `Gagal memperbarui status paket: ${err.message}`
      });
    } finally {
      setUpdatingPkgId('');
    }
  };

  // SOS Panic Button (Hanya aktif jika SHOW_SOS_BUTTON = true)
  const startSosHold = () => {
    let current = 0;
    sosTimerRef.current = setInterval(() => {
      current += 10;
      setSosProgress(current);
      if (current >= 100) {
        clearInterval(sosTimerRef.current);
        setSosProgress(0);
        alert('SINYAL DARURAT SOS TERKIRIM KE POS SECURITY & GRUP WARGA CMR!');
      }
    }, 300);
  };

  const cancelSosHold = () => {
    if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    setSosProgress(0);
  };

  // Kartu Slot Parkir Horizontal
  const renderParkingSlotCard = (slot) => {
    const isEmpty = slot.status_slot === 'Kosong';
    const isWeekend = slot.status_slot === 'Weekend';
    const isTamu = slot.status_slot === 'Tamu';

    return (
      <button
        key={slot.slot_id}
        type="button"
        onClick={() => openParkingSlotModal(slot)}
        className={`w-full text-left p-3.5 rounded-2xl border-2 transition flex flex-col justify-between min-h-[116px] cursor-pointer hover:shadow-md ${
          isEmpty
            ? 'bg-slate-50/90 border-dashed border-slate-300 hover:border-sky-500 hover:bg-sky-50/30'
            : isWeekend
            ? 'bg-amber-50 border-amber-300 hover:border-amber-500'
            : isTamu
            ? 'bg-sky-50 border-sky-300 hover:border-sky-500'
            : 'bg-emerald-50 border-emerald-400 hover:border-emerald-600'
        }`}
      >
        <div className="flex items-center justify-between gap-2 w-full">
          <span className="font-black text-xs text-slate-900">
            {slot.nama_slot || slot.slot_id}
          </span>
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
              isEmpty
                ? 'bg-slate-200 text-slate-600'
                : isWeekend
                ? 'bg-amber-200 text-amber-900'
                : isTamu
                ? 'bg-sky-200 text-sky-900'
                : 'bg-emerald-200 text-emerald-900'
            }`}
          >
            {slot.status_slot}
          </span>
        </div>

        <div className="my-2">
          {isEmpty ? (
            <p className="text-xs font-bold text-slate-400">+ Ketuk untuk Check-In</p>
          ) : (
            <>
              <p className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-1">
                {slot.house_id && slot.house_id !== '-'
                  ? getHouseLabel(slot.house_id)
                  : slot.nama_pemilik}
              </p>
              <p className="text-[11px] font-semibold text-slate-600 mt-0.5 line-clamp-1">
                {slot.nomor_polisi && slot.nomor_polisi !== '-' ? `${slot.nomor_polisi} • ` : ''}
                {slot.jenis_paket}
              </p>
            </>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/70 w-full">
          <span className="truncate">
            {isEmpty ? 'Tersedia' : `Masuk: ${slot.waktu_masuk || '-'}`}
          </span>
          <span className="font-extrabold text-teal-700 shrink-0 ml-2">
            {isEmpty ? 'Check-In →' : 'Kelola →'}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-5">
      {/* ======================================================================
          TAB 1: BERANDA V7 — POLA GOJEK (ZERO DUPLICATION)
      ====================================================================== */}
      {activeTab === 'beranda' && (
        <div className="space-y-4 sm:space-y-5">
          {/* AREA HERO GRADASI MINT-TEAL + SILUET CLUSTER + 3 MENU UNGGULAN + BAR KAPSUL */}
          <section className="relative overflow-hidden bg-gradient-to-b from-emerald-100/90 via-teal-50/80 to-[#F4F7F6] px-3.5 sm:px-5 lg:px-6 pt-4 pb-2 lg:rounded-b-[2rem]">
            {/* Ilustrasi Siluet Cluster di pojok kanan atas */}
            <ClusterHeaderIllustration className="absolute right-0 top-0 w-56 sm:w-72 opacity-80" />

            <div className="relative z-10 space-y-3.5">
              {/* Baris Ringkas Identitas Cluster & Status Jaga Live */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800/80">
                    {sourceData.cluster_full_name || 'Cluster Mutiara Residence Sumberjaya'}
                  </p>
                  <h1 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    Layanan & Transparansi Kas Warga
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={() => jumpToSecuritySub('jadwal')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white border border-emerald-200/90 shadow-xs text-[11px] font-extrabold text-teal-900 transition cursor-pointer"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      onDutyInfo.name === 'Malam Libur'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500 animate-pulse'
                    }`}
                  />
                  <span>
                    {onDutyInfo.isLiveCheckIn ? 'Jaga Live:' : 'Shift:'}{' '}
                    <strong>{onDutyInfo.name}</strong>
                  </span>
                </button>
              </div>

              {/* 1. TIGA MENU UNGGULAN (KARTU PUTIH SOFT-3D ALA GOJEK) */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
                {/* Unggulan 1: Parkir Fasum */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('parkir');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group bg-white hover:bg-sky-50/40 rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 border border-emerald-200/80 hover:border-sky-300 shadow-xs hover:shadow-md transition flex flex-col items-center text-center cursor-pointer active:scale-[0.98]"
                >
                  <div className="group-hover:-translate-y-0.5 transition-transform">
                    <Icon3DParking size={44} className="w-10 h-10 sm:w-12 sm:h-12" />
                  </div>
                  <span
                    className={`mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-black leading-none ${
                      occupiedParkingCount > 0
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {occupiedParkingCount}/6 Terisi
                  </span>
                  <span className="mt-1 text-[11px] sm:text-xs font-extrabold text-slate-900 leading-tight">
                    Parkir Fasum
                  </span>
                </button>

                {/* Unggulan 2: Paket di Pos */}
                <button
                  type="button"
                  onClick={() => jumpToSecuritySub('paket')}
                  className="group bg-white hover:bg-amber-50/40 rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 border border-emerald-200/80 hover:border-amber-300 shadow-xs hover:shadow-md transition flex flex-col items-center text-center cursor-pointer active:scale-[0.98]"
                >
                  <div className="group-hover:-translate-y-0.5 transition-transform">
                    <Icon3DPackage size={44} className="w-10 h-10 sm:w-12 sm:h-12" />
                  </div>
                  <span
                    className={`mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-black leading-none ${
                      waitingPackagesCount > 0
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {waitingPackagesCount} Paket
                  </span>
                  <span className="mt-1 text-[11px] sm:text-xs font-extrabold text-slate-900 leading-tight">
                    Paket di Pos
                  </span>
                </button>

                {/* Unggulan 3: Absen Shift Security */}
                <button
                  type="button"
                  onClick={() => jumpToSecuritySub('jadwal')}
                  className="group bg-white hover:bg-emerald-50/50 rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 border border-emerald-200/80 hover:border-emerald-400 shadow-xs hover:shadow-md transition flex flex-col items-center text-center cursor-pointer active:scale-[0.98]"
                >
                  <div className="group-hover:-translate-y-0.5 transition-transform">
                    <Icon3DSecurity size={44} className="w-10 h-10 sm:w-12 sm:h-12" />
                  </div>
                  <span className="mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-black leading-none bg-emerald-100 text-emerald-800 max-w-full truncate">
                    {onDutyInfo.name}
                  </span>
                  <span className="mt-1 text-[11px] sm:text-xs font-extrabold text-slate-900 leading-tight">
                    Absen Shift
                  </span>
                </button>
              </div>

              {/* 2. BAR MENU KAPSUL PUTIH + EXPAND "LAINNYA" */}
              <div className="bg-white rounded-3xl border border-slate-200/85 shadow-xs overflow-hidden">
                <div className="grid grid-cols-5 gap-1 p-2.5 sm:p-3 text-center">
                  <CapsuleMenuButton
                    icon={<Icon3DReport size={32} />}
                    label="Lapor Pos"
                    onClick={() => jumpToSecuritySub('lapor')}
                  />
                  <CapsuleMenuButton
                    icon={<Icon3DSchedule size={32} />}
                    label="Jadwal"
                    onClick={() => setInfoSheet('schedule')}
                  />
                  <CapsuleMenuButton
                    icon={<Icon3DPayroll size={32} />}
                    label="Slip Gaji"
                    onClick={() => setInfoSheet('payroll')}
                  />
                  <CapsuleMenuButton
                    icon={<Icon3DIplCheck size={32} />}
                    label="Cek IPL"
                    onClick={() => setActiveTab('rumah')}
                  />
                  <CapsuleMenuButton
                    icon={<Icon3DMore size={32} expanded={showMoreMenu} />}
                    label={showMoreMenu ? 'Tutup' : 'Lainnya'}
                    active={showMoreMenu}
                    onClick={() => setShowMoreMenu((prev) => !prev)}
                  />
                </div>

                {/* Area Expand Menu Tambahan (Mulus saat "Lainnya" diklik) */}
                {showMoreMenu && (
                  <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-3 grid grid-cols-4 sm:grid-cols-6 gap-2 text-center animate-fade-in">
                    <CapsuleMenuButton
                      icon={<Icon3DArchive size={30} />}
                      label="Arsip Kas"
                      onClick={() => {
                        setShowMoreMenu(false);
                        monthlyClosingsRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    />
                    <CapsuleMenuButton
                      icon={<Icon3DReport size={30} />}
                      label="Log Pos"
                      onClick={() => {
                        setShowMoreMenu(false);
                        jumpToSecuritySub('riwayat');
                      }}
                    />
                    <CapsuleMenuButton
                      icon={<Icon3DRules size={30} />}
                      label="Tata Tertib"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setInfoSheet('rules');
                      }}
                    />
                    {!isPwaInstalled && typeof onOpenPwaInstall === 'function' && (
                      <CapsuleMenuButton
                        icon={<Icon3DInstallApp size={30} />}
                        label="Pasang App"
                        onClick={() => {
                          setShowMoreMenu(false);
                          onOpenPwaInstall();
                        }}
                      />
                    )}
                    {SHOW_SOS_BUTTON && (
                      <CapsuleMenuButton
                        icon={<Icon3DSos size={30} />}
                        label="Darurat SOS"
                        onClick={() => {
                          setShowMoreMenu(false);
                          jumpToSecuritySub('riwayat');
                        }}
                      />
                    )}
                    {SHOW_CCTV_PANEL && (
                      <CapsuleMenuButton
                        icon={<Icon3DCctv size={30} />}
                        label="CCTV Pos"
                        onClick={() => {
                          setShowMoreMenu(false);
                          jumpToSecuritySub('riwayat');
                        }}
                      />
                    )}
                  </div>
                )}

                {/* Area Expand Menu Tambahan — Grid Dinamis 100% Simetris Mobile & Desktop */}
                {showMoreMenu && (() => {
                  const moreItems = [
                    {
                      id: 'arsip',
                      label: 'Arsip Kas',
                      icon: <Icon3DArchive size={30} />,
                      onClick: () => {
                        setShowMoreMenu(false);
                        monthlyClosingsRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }
                    },
                    {
                      id: 'log',
                      label: 'Log Pos',
                      icon: <Icon3DReport size={30} />,
                      onClick: () => {
                        setShowMoreMenu(false);
                        jumpToSecuritySub('riwayat');
                      }
                    },
                    {
                      id: 'tatib',
                      label: 'Tata Tertib',
                      icon: <Icon3DRules size={30} />,
                      onClick: () => {
                        setShowMoreMenu(false);
                        setInfoSheet('rules');
                      }
                    }
                  ];

                  if (typeof onToggleDarkMode === 'function') {
                    moreItems.push({
                      id: 'theme',
                      label: isDarkMode ? 'Mode Terang' : 'Mode Gelap',
                      icon: <Icon3DTheme dark={isDarkMode} size={30} />,
                      onClick: () => onToggleDarkMode()
                    });
                  }

                  if (!isPwaInstalled && typeof onOpenPwaInstall === 'function') {
                    moreItems.push({
                      id: 'pwa',
                      label: 'Pasang App',
                      icon: <Icon3DInstallApp size={30} />,
                      onClick: () => {
                        setShowMoreMenu(false);
                        onOpenPwaInstall();
                      }
                    });
                  }

                  if (SHOW_SOS_BUTTON) {
                    moreItems.push({
                      id: 'sos',
                      label: 'Darurat SOS',
                      icon: <Icon3DSos size={30} />,
                      onClick: () => {
                        setShowMoreMenu(false);
                        jumpToSecuritySub('riwayat');
                      }
                    });
                  }

                  if (SHOW_CCTV_PANEL) {
                    moreItems.push({
                      id: 'cctv',
                      label: 'CCTV Pos',
                      icon: <Icon3DCctv size={30} />,
                      onClick: () => {
                        setShowMoreMenu(false);
                        jumpToSecuritySub('riwayat');
                      }
                    });
                  }

                  const gridColsClass =
                    moreItems.length === 5
                      ? 'grid-cols-5'
                      : moreItems.length === 4
                      ? 'grid-cols-4'
                      : moreItems.length === 3
                      ? 'grid-cols-3'
                      : 'grid-cols-3 sm:grid-cols-6';

                  return (
                    <div
                      className={`border-t border-slate-100 bg-slate-50/70 p-2.5 sm:p-3 grid ${gridColsClass} gap-1 text-center animate-fade-in`}
                    >
                      {moreItems.map((item) => (
                        <CapsuleMenuButton
                          key={item.id}
                          icon={item.icon}
                          label={item.label}
                          onClick={item.onClick}
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </section>

          {/* 3. CARD SALDO KOMPAK ALA GOPAY (MENU KEUANGAN DI DALAM CARD SALDO) */}
          <section className="px-3.5 sm:px-5 lg:px-6">
            <div className="bg-gradient-to-r from-sky-50/90 via-white to-emerald-50/90 rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Sisi Kiri: Saldo Kas Nyata Live + Status IPL */}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800">
                    Kas Nyata CMR
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowBalance((prev) => !prev)}
                    aria-label={showBalance ? 'Sembunyikan saldo' : 'Tampilkan saldo'}
                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
                  >
                    <IconEye hidden={!showBalance} size={14} />
                  </button>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Live
                  </span>
                </div>

                <p className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  {showBalance ? formatRp(liveCurrentBalance) : 'Rp ••••••••'}
                </p>

                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-semibold text-slate-500">
                  <span className="text-emerald-700 font-extrabold">
                    IPL {selectedMonth}: {totalLunasCount}/{activeHouses.length || 21} Lunas
                  </span>
                  <span>•</span>
                  <span>
                    Tarif {formatRp(sourceData.default_ipl_amount || 200000)} (21 Aktif • 1 Non-Aktif)
                  </span>
                </div>
              </div>

              {/* Sisi Kanan: 4 Tombol Aksi Keuangan Bulat Cyan-Teal (Ala GoPay) */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/70 shrink-0">
                <SaldoPillAction
                  icon={<IconPillLedger size={18} />}
                  label="Mutasi"
                  onClick={() => setActiveTab('mutasi')}
                />
                <SaldoPillAction
                  icon={<IconPillCheck size={18} />}
                  label="Cek IPL"
                  onClick={() => setActiveTab('rumah')}
                />

                {/* Pilih Periode Bulan (Native Select Transparan di atas Tombol Bulat — 1 Tap di iOS/Android/Desktop) */}
                <div className="relative flex flex-col items-center gap-1 group">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-sky-500 to-teal-500 group-hover:from-sky-600 group-hover:to-teal-600 text-white shadow-sm shadow-cyan-500/25 flex items-center justify-center transition">
                    <IconPillCalendar size={18} />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-700 leading-none inline-flex items-center gap-0.5">
                    {String(selectedMonth).slice(0, 3)} ▾
                  </span>
                  <select
                    aria-label="Pilih Periode Bulan Buku"
                    value={selectedMonth}
                    onChange={(e) => {
                      const nextMonth = e.target.value;
                      setExpandedMonth(nextMonth);
                      if (onChangePeriod) onChangePeriod(nextMonth, selectedYear);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  >
                    {MONTH_LIST.map((m) => (
                      <option key={m} value={m}>
                        {m} {selectedYear}
                      </option>
                    ))}
                  </select>
                </div>

                <SaldoPillAction
                  icon={<IconPillAdmin size={18} />}
                  label="Pengurus"
                  badgeCount={totalMenungguCount}
                  onClick={triggerAdminOpen}
                />
              </div>
            </div>
          </section>

          {/* 4. FEED INFORMASI BAWAH — BLOK 1: PAKET DI POS (CUKUP 1 BLOK, SEMBUNYI JIKA 0) */}
          {waitingPackagesCount > 0 && (
            <section className="px-3.5 sm:px-5 lg:px-6 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    Paket di Pos Security
                  </h2>
                  <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-amber-500 text-white text-[11px] font-black inline-flex items-center justify-center">
                    {waitingPackagesCount}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => jumpToSecuritySub('paket')}
                  className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Kelola Semua</span>
                  <IconChevronRight size={15} />
                </button>
              </div>

              {/* Mobile: Horizontal Swipe Strip • Desktop: Grid 3 Kolom */}
              <div className="flex lg:grid lg:grid-cols-3 gap-3 overflow-x-auto lg:overflow-visible pb-1 -mx-3.5 px-3.5 sm:-mx-5 sm:px-5 lg:mx-0 lg:px-0 snap-x snap-mandatory">
                {waitingPackages.slice(0, 6).map((pkg) => {
                  const photoUrls = getLogPhotoUrls(pkg);
                  const houseText =
                    pkg.house_id && pkg.house_id !== '-'
                      ? getHouseLabel(pkg.house_id)
                      : pkg.nama_warga_tujuan;

                  return (
                    <div
                      key={pkg.id}
                      className="min-w-[265px] sm:min-w-[290px] lg:min-w-0 snap-start bg-white rounded-2xl border border-amber-200/90 shadow-xs p-3.5 flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-black text-slate-900 truncate">
                            {houseText}
                          </p>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                            {pkg.detail_catatan}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold shrink-0">
                          Di Pos
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400 truncate">
                          {pkg.tanggal} • {pkg.jam} ({pkg.nama_security})
                        </span>
                        {photoUrls.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              triggerLightbox(
                                photoUrls,
                                `Foto Paket — ${houseText}`,
                                `${pkg.tanggal} • ${pkg.jam} WIB`
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-extrabold shrink-0 cursor-pointer"
                          >
                            <IconPhoto size={13} />
                            <span>{photoUrls.length > 1 ? `Foto (${photoUrls.length})` : 'Foto'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 5. FEED INFORMASI BAWAH — BLOK 2: LAPORAN & RINCIAN BUKU KAS BULANAN */}
          <section ref={monthlyClosingsRef} className="px-3.5 sm:px-5 lg:px-6">
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/85 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    Laporan & Rincian Buku Kas Bulanan
                  </h2>
                  <p className="text-xs text-slate-500">
                    Uang Kas Nyata • Bulan berjalan dihitung otomatis (Live) dari Buku Kas
                  </p>
                </div>
                <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-extrabold">
                  Terbaru di Atas
                </span>
              </div>

              <div className="space-y-3">
                {monthlyClosings.map((item) => {
                  const maxVal = Math.max(
                    5200000,
                    Number(item.uang_masuk || 0),
                    Number(item.total_pengeluaran || 0)
                  );
                  const inPct = Math.min(
                    100,
                    Math.round((Number(item.uang_masuk || 0) / maxVal) * 100)
                  );
                  const outPct = Math.min(
                    100,
                    Math.round((Number(item.total_pengeluaran || 0) / maxVal) * 100)
                  );
                  const isExpanded = expandedMonth === item.periode_bulan;
                  const isLiveOpen =
                    String(item.status_tutup_buku || '').toUpperCase() !== 'CLOSED';
                  const breakdown = getMonthlyBreakdown(item.periode_bulan, item.periode_tahun);

                  return (
                    <div
                      key={item.id || item.periode_bulan}
                      className="rounded-2xl bg-slate-50/90 border border-slate-200/85 overflow-hidden transition"
                    >
                      <div
                        onClick={() => setExpandedMonth(isExpanded ? '' : item.periode_bulan)}
                        className="p-3.5 sm:p-4 cursor-pointer hover:bg-slate-100/70 transition space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-sm">
                              {item.periode_bulan} {item.periode_tahun}
                            </span>
                            {isLiveOpen && (
                              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                ● Live
                              </span>
                            )}
                            <span className="text-[11px] text-slate-500">
                              Saldo Awal {formatRp(item.saldo_awal)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                              Sisa: {formatRp(item.sisa_saldo)}
                            </span>
                            <span className="w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center">
                              <IconChevronDown size={14} rotated={isExpanded} />
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <div className="flex justify-between text-emerald-700 font-bold mb-1">
                              <span>Uang Masuk Riil</span>
                              <span>{formatRp(item.uang_masuk)}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${inPct}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-rose-600 font-bold mb-1">
                              <span>
                                Total Pengeluaran
                                {Number(item.pengeluaran_proyek) > 0
                                  ? ` (Proyek ${formatRp(item.pengeluaran_proyek)})`
                                  : ''}
                              </span>
                              <span>{formatRp(item.total_pengeluaran)}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-rose-500 rounded-full transition-all"
                                style={{ width: `${outPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-3.5 sm:px-4 pb-4 pt-3 border-t border-slate-200/80 bg-white text-xs space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                            <div>
                              <span className="text-slate-400 block">Saldo Awal</span>
                              <span className="font-extrabold text-slate-800">
                                {formatRp(item.saldo_awal)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Uang Masuk</span>
                              <span className="font-extrabold text-emerald-700">
                                {formatRp(item.uang_masuk)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Total Keluar</span>
                              <span className="font-extrabold text-rose-600">
                                {formatRp(item.total_pengeluaran)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Khusus Proyek</span>
                              <span className="font-extrabold text-amber-700">
                                {formatRp(item.pengeluaran_proyek)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Sisa Saldo</span>
                              <span className="font-black text-teal-700">
                                {formatRp(item.sisa_saldo)}
                              </span>
                            </div>
                          </div>

                          {Object.keys(breakdown.pemasukanMap).length > 0 && (
                            <div>
                              <p className="font-extrabold text-slate-700 mb-1">
                                Rincian Pemasukan per Kategori:
                              </p>
                              <ul className="space-y-1 pl-2">
                                {Object.keys(breakdown.pemasukanMap).map((kat) => (
                                  <li key={kat} className="text-emerald-800 font-semibold">
                                    • {kat}: {formatRp(breakdown.pemasukanMap[kat])}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {Object.keys(breakdown.pengeluaranMap).length > 0 ? (
                            <div>
                              <p className="font-extrabold text-slate-700 mb-1.5">
                                Rincian Pengeluaran per Kategori:
                              </p>
                              <div className="space-y-1.5">
                                {Object.keys(breakdown.pengeluaranMap).map((kat) => {
                                  const group = breakdown.pengeluaranMap[kat];
                                  return (
                                    <div
                                      key={kat}
                                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                                    >
                                      <div className="flex items-center justify-between font-extrabold text-slate-800">
                                        <span>• {kat}</span>
                                        <span className="text-rose-600">
                                          {formatRp(group.total)}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] text-slate-600">
                                        {group.details.map((d, idx) => (
                                          <span
                                            key={idx}
                                            className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200"
                                          >
                                            <span>{d.text}</span>
                                            {d.url_bukti && d.url_bukti !== '-' && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  triggerLightbox(
                                                    d.url_bukti,
                                                    `Struk ${kat} (${item.periode_bulan})`,
                                                    d.text
                                                  )
                                                }
                                                className="inline-flex items-center gap-1 text-teal-700 font-extrabold hover:underline cursor-pointer"
                                              >
                                                <IconPhoto size={12} />
                                                <span>Bukti</span>
                                              </button>
                                            )}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">
                              Belum ada catatan pengeluaran pada periode {item.periode_bulan}{' '}
                              {item.periode_tahun}.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ======================================================================
          TAB 2: DAFTAR WARGA CMR (21 AKTIF + 1 NON-AKTIF BPR)
      ====================================================================== */}
      {activeTab === 'rumah' && (
        <section className="px-3.5 sm:px-5 lg:px-6 pt-4 space-y-4">
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/85 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900">
                  Daftar Warga CMR
                </h1>
                <p className="text-xs text-slate-500">
                  Status IPL {selectedMonth} {selectedYear} • 21 Hunian Aktif & 1 Unit Non-Aktif
                  (No. 04 BPR)
                </p>
              </div>

              <select
                value={selectedMonth}
                onChange={(e) => {
                  const nextMonth = e.target.value;
                  setExpandedMonth(nextMonth);
                  if (onChangePeriod) onChangePeriod(nextMonth, selectedYear);
                }}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-extrabold text-slate-800 outline-none focus:border-emerald-500"
              >
                {MONTH_LIST.map((m) => (
                  <option key={m} value={m}>
                    Buku {m} {selectedYear}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tab Pill Ringkas */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { id: 'ALL', label: `Semua (${housesWithIpl.length})` },
                { id: 'Lunas', label: `Lunas (${totalLunasCount})` },
                ...(totalMenungguCount > 0
                  ? [{ id: 'Menunggu Validasi', label: `Menunggu (${totalMenungguCount})` }]
                  : []),
                { id: 'Belum Bayar', label: `Belum Bayar (${totalBelumBayarCount})` }
              ].map((chip) => {
                const active = filterStatusIpl === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setFilterStatusIpl(chip.id)}
                    className={`px-3 py-1.5 rounded-full font-extrabold border transition cursor-pointer ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Pencarian Warga */}
            <div className="relative">
              <IconSearch
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Cari nomor rumah atau nama warga..."
                value={searchRumah}
                onChange={(e) => setSearchRumah(e.target.value)}
                className="w-full h-10 rounded-2xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:border-emerald-500 pl-10 pr-4 text-xs font-semibold outline-none transition"
              />
            </div>

            {/* Grid 22 Kartu Warga */}
            {filteredHouses.length === 0 ? (
              <div className="py-8 flex flex-col items-center text-center">
                <EmptyStateIllustration type="search" size={84} />
                <p className="text-sm font-extrabold text-slate-800 mt-3">
                  Warga tidak ditemukan
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ubah kata kunci pencarian atau pilih filter status lainnya.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredHouses.map((h) => {
                  const isLunas = h.status_bayar === 'Lunas';
                  const isWaiting = h.status_bayar === 'Menunggu Validasi';
                  const isNonAktif = h.is_non_aktif;

                  return (
                    <div
                      key={h.id}
                      className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${
                        isNonAktif
                          ? 'bg-slate-100/80 border-slate-200 opacity-80'
                          : isLunas
                          ? 'bg-emerald-50/45 border-emerald-200/90'
                          : isWaiting
                          ? 'bg-amber-50/55 border-amber-200/90'
                          : 'bg-white border-slate-200/90'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                            {h.display_label}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                              isNonAktif
                                ? 'bg-slate-200 text-slate-600'
                                : isLunas
                                ? 'bg-emerald-100 text-emerald-800'
                                : isWaiting
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isNonAktif ? 'Non-Aktif' : h.status_bayar}
                          </span>
                        </div>

                        {h.alias_keluarga && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            {h.alias_keluarga}
                          </p>
                        )}

                        <p className="text-xs font-bold text-slate-700 mt-1.5">
                          {isNonAktif
                            ? 'Bebas Tagihan IPL (Unit BPR)'
                            : isLunas
                            ? `Uang Masuk: ${formatRp(h.nominal_bayar)}`
                            : `Tagihan Dasar: ${formatRp(h.tarif_ipl || 200000)}`}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-400 truncate">
                          {isNonAktif
                            ? 'BPR'
                            : isLunas && h.tanggal_bayar !== '-'
                            ? `Tgl ${String(h.tanggal_bayar).slice(0, 10)}`
                            : `${selectedMonth} ${selectedYear}`}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {h.url_bukti && h.url_bukti !== '-' && (
                            <button
                              type="button"
                              onClick={() =>
                                triggerLightbox(
                                  h.url_bukti,
                                  `Bukti Pembayaran — ${h.display_label}`,
                                  `Periode Buku ${selectedMonth} ${selectedYear} • ${formatRp(
                                    h.nominal_bayar
                                  )}`
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-extrabold transition cursor-pointer"
                            >
                              <IconPhoto size={13} />
                              <span>Bukti</span>
                            </button>
                          )}

                          {!isNonAktif && !isLunas && (
                            <button
                              type="button"
                              onClick={() => onOpenQris && onOpenQris(h)}
                              className="inline-flex items-center gap-1 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-extrabold px-2.5 py-1 rounded-xl shadow-xs transition cursor-pointer"
                            >
                              <IconPillQris size={13} />
                              <span>Bayar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ======================================================================
          TAB 3: BUKU KAS (MUTASI KAS NYATA + LIGHTBOX BUKTI)
      ====================================================================== */}
      {activeTab === 'mutasi' && (
        <section className="px-3.5 sm:px-5 lg:px-6 pt-4 space-y-4">
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/85 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900">
                  Buku Kas Cluster
                </h1>
                <p className="text-xs text-slate-500">
                  100% Pencatatan Uang Kas Nyata • Urut terbaru ke terlama
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={filterBulanKas}
                  onChange={(e) => setFilterBulanKas(e.target.value)}
                  className="h-9 border border-slate-200 rounded-xl px-3 font-extrabold bg-slate-50 outline-none focus:border-emerald-500"
                >
                  <option value="Semua">Semua Bulan</option>
                  {MONTH_LIST.slice()
                    .reverse()
                    .map((b) => (
                      <option key={b} value={b}>
                        Buku {b} {selectedYear}
                      </option>
                    ))}
                </select>

                <select
                  value={filterKategoriKas}
                  onChange={(e) => setFilterKategoriKas(e.target.value)}
                  className="h-9 border border-slate-200 rounded-xl px-3 font-extrabold bg-slate-50 outline-none focus:border-emerald-500"
                >
                  <option value="ALL">Semua Kategori ({filteredLedger.length})</option>
                  <option value="Iuran">Iuran Warga (IPL)</option>
                  <option value="Parkir">Parkir Fasum</option>
                  <option value="Gaji">Gaji & Kasbon Security</option>
                  <option value="Sampah">Uang Sampah</option>
                  <option value="Perawatan">Perawatan Pos</option>
                  <option value="Listrik">Listrik Pos</option>
                  <option value="Air">Air Galon Pos</option>
                  <option value="Konsumsi">Konsumsi Pos</option>
                  <option value="Sosial">Dana Sosial</option>
                  <option value="PROYEK">Khusus Proyek Cluster</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block">Uang Masuk Terfilter</span>
                <span className="text-sm sm:text-base font-black text-emerald-700">
                  {formatRp(totalMasukFilter)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block">Pengeluaran Terfilter</span>
                <span className="text-sm sm:text-base font-black text-rose-600">
                  {formatRp(totalKeluarFilter)}
                </span>
              </div>
            </div>

            {filteredLedger.length === 0 ? (
              <div className="py-8 flex flex-col items-center text-center">
                <EmptyStateIllustration type="ledger" size={84} />
                <p className="text-sm font-extrabold text-slate-800 mt-3">
                  Belum Ada Transaksi di Filter Ini
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih periode bulan lain atau tampilkan semua kategori.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredLedger.map((tx) => {
                  const isIn = String(tx.tipe || '').toUpperCase() === 'IN';
                  const isProyek =
                    tx.is_proyek === true || String(tx.is_proyek || '').toUpperCase() === 'TRUE';
                  const hasProof = tx.url_bukti && tx.url_bukti !== '-';
                  const houseText =
                    tx.house_id && tx.house_id !== '-' && tx.house_id !== 'ALL'
                      ? getHouseLabel(tx.house_id)
                      : '';

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-emerald-200 hover:bg-slate-50/70 transition flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                            isIn
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isIn ? '↓' : '↑'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-900">{tx.kategori}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                              {tx.periode_bulan} {tx.periode_tahun || 2026}
                            </span>
                            {houseText && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-extrabold">
                                {houseText}
                              </span>
                            )}
                            {isProyek && (
                              <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-extrabold">
                                Proyek: {tx.nama_proyek || tx.keterangan}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 font-medium mt-1 leading-snug">
                            {tx.keterangan}
                          </p>
                          <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-slate-400">
                              {tx.tanggal} • {tx.id}
                            </span>
                            {hasProof && (
                              <button
                                type="button"
                                onClick={() =>
                                  triggerLightbox(
                                    tx.url_bukti,
                                    `Bukti Transaksi — ${tx.kategori}`,
                                    `${tx.keterangan} (${formatRp(tx.nominal)})`
                                  )
                                }
                                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-0.5 rounded-lg transition cursor-pointer"
                              >
                                <IconPhoto size={13} />
                                <span>Lihat Bukti</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-black text-xs sm:text-sm ${
                            isIn ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {isIn ? '+' : '-'} {formatRp(tx.nominal)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ======================================================================
          TAB 4: DENAH HORIZONTAL 6 SLOT PARKIR FASUM (DIAKSES DARI BERANDA)
      ====================================================================== */}
      {activeTab === 'parkir' && (
        <section className="px-3.5 sm:px-5 lg:px-6 pt-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('beranda')}
              className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700 hover:text-emerald-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              <IconArrowLeft size={16} />
              <span>Kembali ke Beranda</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-1 rounded-full font-extrabold">
                Terisi: {occupiedParkingCount}/6
              </span>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-extrabold">
                Kosong: {6 - occupiedParkingCount}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/85 space-y-4">
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900">
                Denah 6 Slot Parkir Fasum CMR
              </h1>
              <p className="text-xs text-slate-500">
                Seluruh slot dinamis & bebas • Petugas Security cukup ketuk kotak slot untuk
                Check-In / Check-Out kendaraan
              </p>
            </div>

            <div className="p-3.5 sm:p-5 rounded-3xl bg-slate-100/90 border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                <div className="lg:col-span-7 bg-white rounded-2xl p-3.5 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-slate-700 uppercase tracking-wider">
                      Area Kiri Fasum (Slot 01 – 04)
                    </span>
                    <span className="text-slate-400">Ketuk slot</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {parkingSlots.slice(0, 4).map((slot) => renderParkingSlotCard(slot))}
                  </div>
                </div>

                <div className="lg:col-span-1 flex lg:flex-col items-center justify-center py-2 lg:py-0 rounded-2xl bg-slate-200/80 border border-dashed border-slate-300 text-slate-500 text-[10px] font-extrabold tracking-widest uppercase">
                  <span className="lg:-rotate-90 whitespace-nowrap">Jalur Akses Mobil</span>
                </div>

                <div className="lg:col-span-4 bg-white rounded-2xl p-3.5 border border-slate-200 flex flex-col justify-between space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-slate-700 uppercase tracking-wider">
                      Area Kanan (Slot 05 – 06)
                    </span>
                    <span className="text-slate-400">Atas & Bawah</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 flex-1">
                    {parkingSlots.slice(4, 6).map((slot) => renderParkingSlotCard(slot))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 px-1">
                <span>
                  <strong>Kontribusi Parkir Fasum:</strong> 1 Mobil Rp 150.000/bln • 2 Mobil Rp
                  300.000/bln • Weekend Rp 50.000/bln
                </span>
                <button
                  type="button"
                  onClick={() => onOpenQris && onOpenQris(null)}
                  className="font-extrabold text-sky-700 hover:underline cursor-pointer"
                >
                  Bayar Parkir via QRIS →
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================================
          TAB 5: POS SECURITY (ABSEN GREATDAY + PAKET + FORM ADAPTIF + LOG POS)
      ====================================================================== */}
      {activeTab === 'keamanan' && (
        <section className="px-3.5 sm:px-5 lg:px-6 pt-4 space-y-4">
          {/* Sub-Navigasi 4 Tab Bersih */}
          <div className="bg-white rounded-3xl p-1.5 shadow-xs border border-slate-200/85 grid grid-cols-4 gap-1 text-xs">
            {[
              { id: 'jadwal', label: 'Absen' },
              { id: 'paket', label: 'Paket', badge: waitingPackagesCount },
              { id: 'lapor', label: 'Lapor' },
              { id: 'riwayat', label: `Log (${securityLogs.length})` }
            ].map((st) => {
              const active = secSubTab === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setSecSubTab(st.id);
                    setSecFeedback({ type: '', text: '' });
                  }}
                  className={`py-2.5 px-2 rounded-2xl font-extrabold transition flex items-center justify-center gap-1 cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{st.label}</span>
                  {st.badge > 0 && (
                    <span
                      className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black inline-flex items-center justify-center ${
                        active ? 'bg-amber-400 text-slate-950' : 'bg-amber-500 text-white'
                      }`}
                    >
                      {st.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {secFeedback.text && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold border flex items-start gap-2 ${
                secFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              <IconAlert size={16} className="shrink-0 mt-0.5" />
              <span>{secFeedback.text}</span>
            </div>
          )}

          {/* SUB-TAB 1: ABSENSI & SHIFT SECURITY (KOMPONEN TERKUNCI V6.3) */}
          {secSubTab === 'jadwal' && (
            <div className="space-y-3">
              <SecurityAttendanceCard
                securityLogs={securityLogs}
                securitySchedules={securitySchedules}
                waitingPackagesCount={waitingPackagesCount}
                onInputSecurityLog={onInputSecurityLog}
                onOpenLightbox={triggerLightbox}
              />

              {/* Tombol Pintasan Lihat Kalender Rotasi Bulanan & Denah Parkir */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setInfoSheet('schedule')}
                  className="p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/85 text-xs font-extrabold text-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <IconPillCalendar size={16} className="text-sky-600" />
                  <span>Kalender Shift Bulanan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('parkir')}
                  className="p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/85 text-xs font-extrabold text-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Icon3DParking size={20} />
                  <span>Parkir ({occupiedParkingCount}/6)</span>
                </button>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: DAFTAR PAKET WARGA DI POS SECURITY */}
          {secSubTab === 'paket' && (
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/85 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-black text-slate-900 text-base">
                    Daftar Paket & Surat di Pos Security
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pak Eko & Pak Mulyadi mencatat paket tiba + foto ke Drive Log_Absensi_Security
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectSecurityCategory('PAKET_SURAT');
                    setSecSubTab('lapor');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs cursor-pointer"
                >
                  + Catat Paket Tiba
                </button>
              </div>

              {packageLogs.length === 0 ? (
                <div className="py-8 flex flex-col items-center text-center">
                  <EmptyStateIllustration type="package" size={88} />
                  <p className="text-sm font-extrabold text-slate-800 mt-3">
                    Belum Ada Paket di Pos Security
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-xs">
                    Ketuk tombol <strong>+ Catat Paket Tiba</strong> saat kurir menitipkan kiriman
                    warga.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {packageLogs.map((pkg) => {
                    const isDelivered = String(pkg.sub_kategori || '')
                      .toLowerCase()
                      .includes('sudah');
                    const houseIdentity =
                      pkg.house_id && pkg.house_id !== '-'
                        ? getHouseLabel(pkg.house_id)
                        : pkg.nama_warga_tujuan;
                    const photoUrls = getLogPhotoUrls(pkg);

                    return (
                      <div
                        key={pkg.id}
                        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          isDelivered
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-amber-50/50 border-amber-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-sm">
                              {houseIdentity}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                isDelivered
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-200 text-amber-950'
                              }`}
                            >
                              {isDelivered ? 'Sudah Diambil / Diantar' : 'Menunggu di Pos'}
                            </span>
                          </div>
                          <p className="text-slate-700 font-medium">{pkg.detail_catatan}</p>
                          <p className="text-[11px] text-slate-400">
                            Dicatat: {pkg.nama_security} (Shift {pkg.shift}) • {pkg.tanggal} pukul{' '}
                            {pkg.jam} WIB
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          {photoUrls.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                triggerLightbox(
                                  photoUrls,
                                  `Foto Paket — ${houseIdentity}`,
                                  `${pkg.detail_catatan} (${pkg.tanggal} ${pkg.jam} WIB)`
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-sky-200 text-sky-700 font-extrabold hover:bg-sky-50 cursor-pointer"
                            >
                              <IconPhoto size={14} />
                              <span>
                                {photoUrls.length > 1
                                  ? `Foto (${photoUrls.length})`
                                  : 'Lihat Foto'}
                              </span>
                            </button>
                          )}

                          {pkg.teks_wa && pkg.teks_wa !== '-' && (
                            <button
                              type="button"
                              onClick={() => {
                                copyTextSafe(pkg.teks_wa);
                                setCopiedWaText(pkg.teks_wa);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                            >
                              Salin WA
                            </button>
                          )}

                          {!isDelivered && (
                            <button
                              type="button"
                              disabled={updatingPkgId === pkg.id}
                              onClick={() => handleMarkPackagePickedUp(pkg)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold shadow-xs cursor-pointer"
                            >
                              {updatingPkgId === pkg.id ? 'Menyimpan...' : 'Tandai Diambil'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 3: FORM LAPORAN POS ADAPTIF + PRESET + MULTI-FOTO (MAKS. 5) */}
          {secSubTab === 'lapor' && (
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/85 space-y-4">
              <div>
                <h2 className="font-black text-slate-900 text-base">
                  Form Laporan Pos & Paket (Tanpa Login)
                </h2>
                <p className="text-xs text-slate-500">
                  Pilih jenis laporan & tombol cepat • Mendukung hingga{' '}
                  <strong>{MAX_SECURITY_PHOTOS} foto</strong> sekaligus ke Google Drive
                </p>
              </div>

              <form onSubmit={handleSubmitSecurityForm} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">1. Petugas Jaga</label>
                    <select
                      value={secForm.nama_security}
                      onChange={(e) => setSecForm({ ...secForm, nama_security: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 font-extrabold bg-slate-50"
                    >
                      <option value="Pak Eko">Pak Eko</option>
                      <option value="Pak Mulyadi">Pak Mulyadi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">2. Shift Jaga</label>
                    <select
                      value={secForm.shift}
                      onChange={(e) => setSecForm({ ...secForm, shift: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 font-extrabold bg-slate-50"
                    >
                      <option value="Pagi">Pagi (08:00 - 20:00)</option>
                      <option value="Malam">Malam (20:00 - 08:00)</option>
                    </select>
                  </div>
                </div>

                {/* 3 Tombol Jenis Laporan */}
                <div>
                  <label className="block font-bold text-slate-600 mb-1.5">
                    3. Jenis Laporan Pos
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {SECURITY_CATEGORY_TABS.map((tab) => {
                      const isSelected = secForm.kategori_laporan === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleSelectSecurityCategory(tab.id)}
                          className={`py-2.5 px-3 rounded-xl font-extrabold border text-center transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preset Cepat */}
                <div>
                  <label className="block font-bold text-slate-600 mb-1.5">
                    4. Pilih Kegiatan / Status Cepat
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(SECURITY_PRESETS[secForm.kategori_laporan] || []).map((preset) => {
                      const isActive = secForm.sub_kategori === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setSecForm({ ...secForm, sub_kategori: preset })}
                          className={`px-3 py-2 rounded-xl font-bold border transition cursor-pointer ${
                            isActive
                              ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-500'
                          }`}
                        >
                          {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Kondisional 1: Rumah Warga Tujuan */}
                {(secForm.kategori_laporan === 'PAKET_SURAT' ||
                  secForm.kategori_laporan === 'ANOMALI_FASILITAS') && (
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">
                      {secForm.kategori_laporan === 'PAKET_SURAT'
                        ? 'Rumah Warga Tujuan Paket (Wajib Pilih)'
                        : 'Rumah Warga Terkait (Opsional)'}
                    </label>
                    <select
                      value={secForm.house_id}
                      onChange={(e) => setSecForm({ ...secForm, house_id: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 font-extrabold bg-slate-50"
                    >
                      {secForm.kategori_laporan !== 'PAKET_SURAT' && (
                        <option value="-">-- Umum / Seluruh Area Cluster --</option>
                      )}
                      {activeHouses.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.display_label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Kondisional 2: Titik Patroli & Cuaca 815 */}
                {secForm.kategori_laporan === 'PATROLI' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        Titik Area Patroli
                      </label>
                      <select
                        value={secForm.titik_patroli}
                        onChange={(e) => setSecForm({ ...secForm, titik_patroli: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-semibold"
                      >
                        {TITIK_PATROLI_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        Cuaca 815 Terkini
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {CUACA_815_OPTIONS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setSecForm({ ...secForm, cuaca_815: c })}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              secForm.cuaca_815 === c
                                ? 'bg-sky-600 text-white border-sky-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-sky-400'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    Catatan Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder={
                      secForm.kategori_laporan === 'PAKET_SURAT'
                        ? 'Contoh: 1 paket Shopee kardus besar disimpan di meja pos'
                        : 'Contoh: 5 titik aman terkendali tanpa taruna'
                    }
                    value={secForm.detail_catatan}
                    onChange={(e) => setSecForm({ ...secForm, detail_catatan: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Upload Multi-Foto (Maks. 5 Foto) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-emerald-300 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-emerald-700 flex items-center justify-center shrink-0">
                        <IconUpload size={17} />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900">
                          Foto Bukti Laporan (Maks. {MAX_SECURITY_PHOTOS} Foto)
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Tersimpan ke Drive <strong>Log_Absensi_Security</strong>
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {secPhotos.length} / {MAX_SECURITY_PHOTOS} Foto
                    </span>
                  </div>

                  {secPhotos.length < MAX_SECURITY_PHOTOS && (
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={isCompressingSecPhotos || isSavingLog}
                      onChange={handleSecPhotosChange}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                    />
                  )}

                  {isCompressingSecPhotos && (
                    <p className="text-[11px] font-bold text-amber-700">
                      Mengompresi foto agar cepat terunggah ke Google Drive...
                    </p>
                  )}

                  {secPhotos.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 pt-1">
                      {secPhotos.map((photo, idx) => (
                        <div
                          key={photo.id}
                          className="relative rounded-2xl overflow-hidden border border-emerald-300 bg-white shadow-xs"
                        >
                          <img
                            src={photo.base64}
                            alt={`Foto ${idx + 1}`}
                            onClick={() =>
                              triggerLightbox(
                                secPhotos.map((p) => p.base64),
                                'Pratinjau Multi-Foto Laporan Security',
                                `${secForm.sub_kategori} • Total ${secPhotos.length} Foto`,
                                idx
                              )
                            }
                            className="w-full h-20 object-cover cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSecPhoto(photo.id)}
                            title="Hapus foto ini"
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow cursor-pointer"
                          >
                            <IconClose size={12} />
                          </button>
                          <div className="px-1.5 py-0.5 text-[9px] font-bold text-slate-600 bg-slate-50 flex justify-between">
                            <span>#{idx + 1}</span>
                            <span>{photo.sizeKb} KB</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSavingLog || isCompressingSecPhotos}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white text-sm font-extrabold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  {isCompressingSecPhotos
                    ? 'Sedang Memproses Foto...'
                    : isSavingLog
                    ? `Menyimpan Laporan${
                        secPhotos.length > 0 ? ` & ${secPhotos.length} Foto...` : '...'
                      }`
                    : 'Simpan Laporan & Salin Format WhatsApp'}
                </button>
              </form>

              {copiedWaText && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-emerald-900">
                      Teks Laporan WhatsApp Siap Ditempel ke Grup CMR:
                    </span>
                    <button
                      type="button"
                      onClick={() => copyTextSafe(copiedWaText)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold cursor-pointer shrink-0"
                    >
                      Salin Ulang
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-slate-700 bg-white p-3 rounded-xl border border-emerald-100">
                    {copiedWaText}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 4: RIWAYAT LOG POS SECURITY */}
          {secSubTab === 'riwayat' && (
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/85 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-black text-slate-900 text-base">
                    Riwayat Log Pos Security ({filteredSecurityLogs.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ketuk tombol foto untuk membuka galeri slider di dalam aplikasi
                  </p>
                </div>

                <select
                  value={filterLogCategory}
                  onChange={(e) => setFilterLogCategory(e.target.value)}
                  className="h-9 border border-slate-200 rounded-xl px-3 text-xs font-extrabold bg-slate-50 outline-none"
                >
                  <option value="ALL">Semua Kategori ({securityLogs.length})</option>
                  <option value="ABSEN_SHIFT">Absen Shift</option>
                  <option value="PAKET_SURAT">Paket Warga</option>
                  <option value="PATROLI">Patroli</option>
                  <option value="PARKIR_FASUM">Kondisi Parkir</option>
                  <option value="ANOMALI_FASILITAS">Kendala / Izin Pos</option>
                </select>
              </div>

              {filteredSecurityLogs.length === 0 ? (
                <div className="py-8 flex flex-col items-center text-center">
                  <EmptyStateIllustration type="search" size={84} />
                  <p className="text-sm font-extrabold text-slate-800 mt-3">
                    Belum Ada Riwayat Log
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih kategori lain atau catat laporan pos baru.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSecurityLogs.map((log) => {
                    const photoUrls = getLogPhotoUrls(log);
                    const catBadge = LOG_CATEGORY_BADGE[log.kategori_laporan] || {
                      label: log.kategori_laporan || 'Log Pos',
                      cls: 'bg-slate-100 text-slate-700 border-slate-200'
                    };

                    return (
                      <div
                        key={log.id}
                        className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 hover:border-emerald-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${catBadge.cls}`}
                            >
                              {catBadge.label}
                            </span>
                            <span className="font-extrabold text-slate-900">
                              {log.sub_kategori}
                            </span>
                            {log.house_id && log.house_id !== '-' && (
                              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
                                {getHouseLabel(log.house_id)}
                              </span>
                            )}
                          </div>

                          <p className="text-slate-700 font-medium leading-relaxed">
                            {log.detail_catatan}
                          </p>

                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                            <span className="font-extrabold text-teal-800">
                              {log.nama_security} (Shift {log.shift})
                            </span>
                            <span>•</span>
                            <span>
                              {log.tanggal} • {log.jam} WIB
                            </span>
                            {log.cuaca_815 && log.cuaca_815 !== '-' && (
                              <>
                                <span>•</span>
                                <span>815: {log.cuaca_815}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          {photoUrls.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                triggerLightbox(
                                  photoUrls,
                                  `${log.sub_kategori} — ${log.nama_security}`,
                                  `${log.tanggal} • ${log.jam} WIB${
                                    log.house_id && log.house_id !== '-'
                                      ? ` • ${getHouseLabel(log.house_id)}`
                                      : ''
                                  }`
                                )
                              }
                              className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <IconPhoto size={14} />
                              <span>
                                {photoUrls.length > 1
                                  ? `Lihat Foto (${photoUrls.length})`
                                  : 'Lihat Foto'}
                              </span>
                            </button>
                          )}

                          {log.teks_wa && log.teks_wa !== '-' && (
                            <button
                              type="button"
                              onClick={() => {
                                copyTextSafe(log.teks_wa);
                                setCopiedWaText(log.teks_wa);
                              }}
                              className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer"
                            >
                              Salin WA
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* FITUR OPSIONAL DENGAN SAKLAR KODE (DEFAULT: FALSE) */}
          {SHOW_SOS_BUTTON && (
            <div className="bg-gradient-to-br from-rose-600 to-red-800 text-white rounded-3xl p-5 shadow-md">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                    Fitur Darurat Warga CMR
                  </span>
                  <h4 className="font-black text-lg mt-1">SOS Panic Button Pos Security</h4>
                  <p className="text-xs text-rose-100 mt-0.5">
                    Tekan dan tahan tombol selama 3 detik untuk mengirim sinyal darurat.
                  </p>
                </div>

                <button
                  type="button"
                  onMouseDown={startSosHold}
                  onMouseUp={cancelSosHold}
                  onMouseLeave={cancelSosHold}
                  onTouchStart={startSosHold}
                  onTouchEnd={cancelSosHold}
                  className="w-full sm:w-44 py-4 rounded-2xl bg-white text-rose-700 font-black text-sm shadow-xl active:scale-95 transition select-none relative overflow-hidden shrink-0"
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-rose-200 transition-all"
                    style={{ width: `${sosProgress}%` }}
                  />
                  <span className="relative z-10">
                    {sosProgress > 0 ? `Tahan... ${sosProgress}%` : 'TAHAN 3 DETIK (SOS)'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {SHOW_CCTV_PANEL && (
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/85">
              <h4 className="font-extrabold text-slate-900 text-base mb-3">
                Pantauan 4 Titik CCTV Lingkungan CMR
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'CAM 01 — Gerbang Utama & Pos Security',
                  'CAM 02 — Persimpangan Blok A',
                  'CAM 03 — Jembatan & Area Taman',
                  'CAM 04 — Jalur Belakang Cluster'
                ].map((cam, idx) => (
                  <div
                    key={idx}
                    className="aspect-video rounded-2xl bg-slate-900 text-white p-3.5 flex flex-col justify-between"
                  >
                    <span className="text-[11px] font-bold bg-black/50 px-2.5 py-0.5 rounded-md w-fit">
                      {cam}
                    </span>
                    <p className="text-xs text-slate-400 text-center">
                      Stream RTSP / WebRTC Siap Diaktifkan
                    </p>
                    <span className="text-[10px] text-emerald-400">● CH-0{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ======================================================================
          BOTTOM SHEET / MODAL CHECK-IN & CHECK-OUT SLOT PARKIR
      ====================================================================== */}
      {activeParkingModalSlot && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center sm:p-4"
          onClick={() => !isSavingSlot && setActiveParkingModalSlot(null)}
        >
          <div
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-2.5 pb-1 sm:hidden shrink-0">
              <div className="w-11 h-1.5 rounded-full bg-slate-300 mx-auto" />
            </div>

            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0 bg-sky-50/70">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
                  Kontrol Parkir Security (Tanpa Login)
                </p>
                <h3 className="text-base font-black text-slate-900">
                  {activeParkingModalSlot.nama_slot || activeParkingModalSlot.slot_id}
                </h3>
              </div>
              <button
                type="button"
                disabled={isSavingSlot}
                onClick={() => setActiveParkingModalSlot(null)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <IconClose size={16} />
              </button>
            </div>

            <form
              onSubmit={handleSaveParkingSlot}
              className="p-5 space-y-3.5 text-xs overflow-y-auto"
            >
              {parkingFeedback.text && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold">
                  {parkingFeedback.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    Petugas Security Pelapor
                  </label>
                  <select
                    value={activeParkingModalSlot.updated_by || 'Pak Eko'}
                    onChange={(e) =>
                      setActiveParkingModalSlot({
                        ...activeParkingModalSlot,
                        updated_by: e.target.value
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-extrabold"
                  >
                    <option value="Pak Eko">Pak Eko</option>
                    <option value="Pak Mulyadi">Pak Mulyadi</option>
                    <option value="Pengurus CMR">Pengurus CMR</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Status Slot</label>
                  <select
                    value={activeParkingModalSlot.status_slot}
                    onChange={(e) =>
                      setActiveParkingModalSlot({
                        ...activeParkingModalSlot,
                        status_slot: e.target.value
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-extrabold"
                  >
                    <option value="Terisi">Terisi (Parkir Warga)</option>
                    <option value="Weekend">Weekend (Akhir Pekan)</option>
                    <option value="Tamu">Tamu / Sementara</option>
                    <option value="Kosong">Kosong (Check-Out)</option>
                  </select>
                </div>
              </div>

              {activeParkingModalSlot.status_slot !== 'Kosong' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        Rumah Pemilik Kendaraan
                      </label>
                      <select
                        value={activeParkingModalSlot.house_id}
                        onChange={(e) =>
                          setActiveParkingModalSlot({
                            ...activeParkingModalSlot,
                            house_id: e.target.value
                          })
                        }
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-extrabold"
                      >
                        <option value="-">-- Tamu / Non-Warga --</option>
                        {activeHouses.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.display_label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        Paket Kontribusi Parkir
                      </label>
                      <select
                        value={activeParkingModalSlot.jenis_paket}
                        onChange={(e) =>
                          setActiveParkingModalSlot({
                            ...activeParkingModalSlot,
                            jenis_paket: e.target.value
                          })
                        }
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-extrabold"
                      >
                        <option value="Parkir Bulanan (Rp 150.000)">
                          Parkir 1 Mobil (Rp 150.000)
                        </option>
                        <option value="Parkir 2 Mobil (Rp 300.000)">
                          Parkir 2 Mobil (Rp 300.000)
                        </option>
                        <option value="Parkir Weekend (Rp 50.000)">
                          Parkir Weekend (Rp 50.000)
                        </option>
                        <option value="Tamu Sementara">Tamu / Acara Sementara</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        Nomor Polisi / Jenis Mobil
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: B 1234 XYZ / Avanza Hitam"
                        value={activeParkingModalSlot.nomor_polisi || ''}
                        onChange={(e) =>
                          setActiveParkingModalSlot({
                            ...activeParkingModalSlot,
                            nomor_polisi: e.target.value
                          })
                        }
                        className="w-full h-10 px-3 rounded-xl border border-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        Laporan Kondisi Parkir
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Terparkir rapi, kaca tertutup"
                        value={activeParkingModalSlot.catatan || ''}
                        onChange={(e) =>
                          setActiveParkingModalSlot({
                            ...activeParkingModalSlot,
                            catatan: e.target.value
                          })
                        }
                        className="w-full h-10 px-3 rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                <label className="flex items-center gap-2 font-bold text-sky-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(activeParkingModalSlot.catat_ke_log_security)}
                    onChange={(e) =>
                      setActiveParkingModalSlot({
                        ...activeParkingModalSlot,
                        catat_ke_log_security: e.target.checked
                      })
                    }
                    className="w-4 h-4 rounded accent-sky-600"
                  />
                  Catat otomatis kondisi parkir ini ke Log Pos Security
                </label>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSavingSlot}
                  className="flex-1 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold shadow-xs transition cursor-pointer"
                >
                  {isSavingSlot ? 'Menyimpan...' : 'Simpan Check-In / Kondisi'}
                </button>

                {parkingSlots.find((s) => s.slot_id === activeParkingModalSlot.slot_id)
                  ?.status_slot !== 'Kosong' && (
                  <button
                    type="button"
                    disabled={isSavingSlot}
                    onClick={handleQuickCheckoutSlot}
                    className="h-11 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-extrabold shadow-xs transition cursor-pointer"
                  >
                    Check-Out
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          BOTTOM SHEET / MODAL INFORMATIF (JADWAL BULANAN • SLIP GAJI • TATA TERTIB)
      ====================================================================== */}
      {infoSheet && (
        <div
          onClick={() => setInfoSheet(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
            className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-h-[88vh] flex flex-col overflow-hidden animate-fade-in"
          >
            <div className="pt-2.5 pb-1 sm:hidden shrink-0">
              <div className="w-11 h-1.5 rounded-full bg-slate-300 mx-auto" />
            </div>

            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {infoSheet === 'schedule'
                    ? `Kalender Shift Security (${selectedMonth} ${selectedYear})`
                    : infoSheet === 'payroll'
                    ? 'Transparansi Gaji & Kasbon Security'
                    : 'Tata Tertib & Ketentuan Cluster CMR'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {infoSheet === 'schedule'
                    ? 'Minggu–Kamis 2 Shift • Jumat Malam & Sabtu Malam Libur (Gerbang Mandiri)'
                    : infoSheet === 'payroll'
                    ? 'Ringkasan alokasi gaji petugas keamanan dari Buku Kas Nyata'
                    : 'Cluster Mutiara Residence Sumberjaya'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInfoSheet(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <IconClose size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
              {/* SHEET 1: KALENDER ROTASI BULANAN */}
              {infoSheet === 'schedule' && (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                        <th className="py-2.5 px-3 font-extrabold">Tanggal</th>
                        <th className="py-2.5 px-3 font-extrabold">Hari</th>
                        <th className="py-2.5 px-3 font-extrabold">Shift Pagi</th>
                        <th className="py-2.5 px-3 font-extrabold">Shift Malam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {securitySchedules.map((sch) => {
                        const isOffNight = String(sch.shift_malam || '').includes('LIBUR');
                        return (
                          <tr
                            key={sch.id || sch.tanggal}
                            className={isOffNight ? 'bg-amber-50/40' : 'hover:bg-slate-50'}
                          >
                            <td className="py-2 px-3 font-mono font-semibold text-slate-700">
                              {sch.tanggal}
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-800">{sch.hari}</td>
                            <td className="py-2 px-3 font-extrabold text-emerald-700">
                              {sch.shift_pagi}
                            </td>
                            <td
                              className={`py-2 px-3 font-bold ${
                                isOffNight ? 'text-amber-700' : 'text-indigo-700'
                              }`}
                            >
                              {sch.shift_malam}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SHEET 2: TRANSPARANSI GAJI SECURITY */}
              {infoSheet === 'payroll' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <p className="text-[11px] font-bold text-emerald-700">Petugas Keamanan</p>
                      <p className="text-sm font-black text-emerald-950 mt-0.5">
                        Pak Eko & Pak Mulyadi
                      </p>
                      <p className="text-[11px] text-emerald-800 mt-1">
                        Standar Rp 1.500.000 / orang / bulan
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200">
                      <p className="text-[11px] font-bold text-sky-700">Beban Gaji Rutin</p>
                      <p className="text-sm font-black text-sky-950 mt-0.5">Rp 3.000.000 / bln</p>
                      <p className="text-[11px] text-sky-800 mt-1">
                        Kasbon otomatis memotong gaji bulan berjalan
                      </p>
                    </div>
                  </div>

                  {payrollTransparencyList.ledgerSalary.length > 0 ? (
                    <div className="space-y-2">
                      <p className="font-extrabold text-slate-700">
                        Riwayat Pengeluaran Gaji & Kasbon di Buku Kas:
                      </p>
                      {payrollTransparencyList.ledgerSalary.map((tx) => (
                        <div
                          key={tx.id}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 truncate">
                              {tx.keterangan}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {tx.tanggal} • Buku {tx.periode_bulan} {tx.periode_tahun || 2026}
                            </p>
                          </div>
                          <span className="font-black text-rose-600 shrink-0">
                            {formatRp(tx.nominal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center py-4">
                      Belum ada catatan pengeluaran gaji di Buku Kas saat ini.
                    </p>
                  )}
                </div>
              )}

              {/* SHEET 3: TATA TERTIB & TARIF CLUSTER */}
              {infoSheet === 'rules' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                    <h4 className="font-black text-emerald-950">1. Iuran Wajib & Siklus Buku</h4>
                    <p className="text-slate-700 leading-relaxed">
                      • Tarif IPL dasar <strong>Rp 200.000/bulan</strong> untuk 21 unit hunian
                      aktif (1 unit No. 04 berstatus Non-Aktif BPR).
                      <br />• Siklus pembayaran mulai tanggal <strong>25</strong> otomatis masuk ke
                      buku iuran bulan berikutnya.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-1.5">
                    <h4 className="font-black text-sky-950">2. Ketentuan Parkir Fasum (6 Slot)</h4>
                    <p className="text-slate-700 leading-relaxed">
                      • 1 Mobil Bulanan: <strong>Rp 150.000/bln</strong> • 2 Mobil:{' '}
                      <strong>Rp 300.000/bln</strong> • Weekend: <strong>Rp 50.000/bln</strong>.
                      <br />• Slot tidak dikunci permanen dan dicatat dinamis (Check-In / Check-Out)
                      oleh petugas security yang berjaga.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                    <h4 className="font-black text-amber-950">3. SOP Gerbang & Jam Jaga Pos</h4>
                    <p className="text-slate-700 leading-relaxed">
                      • <strong>Minggu – Kamis:</strong> 2 Shift penuh (Pagi 08:00–20:00 & Malam
                      20:00–08:00).
                      <br />• <strong>Jumat & Sabtu Malam:</strong> Libur shift malam mulai pukul
                      20:00 WIB (gerbang utama dikunci mandiri oleh warga).
                      <br />• Pintu gerbang kecil selalu ditutup kembali sesuai SOP setelah melintas.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Tombol Satuan Bar Menu Kapsul (5 Ikon + Area Expand)
 */
function CapsuleMenuButton({ icon, label, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-start gap-1 py-1 px-1 rounded-2xl hover:bg-slate-50 active:scale-95 transition cursor-pointer"
    >
      <span className="flex items-center justify-center">{icon}</span>
      <span
        className={`text-[10px] sm:text-[11px] leading-tight line-clamp-1 ${
          active ? 'font-black text-emerald-700' : 'font-bold text-slate-700'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

/**
 * Tombol Aksi Keuangan Bulat di Dalam Card Saldo (Ala GoPay)
 */
function SaldoPillAction({ icon, label, badgeCount = 0, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 group cursor-pointer active:scale-95 transition"
    >
      <span className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-sky-500 to-teal-500 group-hover:from-sky-600 group-hover:to-teal-600 text-white shadow-sm shadow-cyan-500/25 flex items-center justify-center transition">
        {icon}
        {Number(badgeCount) > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
            {badgeCount}
          </span>
        )}
      </span>
      <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-700 leading-none">
        {label}
      </span>
    </button>
  );
}
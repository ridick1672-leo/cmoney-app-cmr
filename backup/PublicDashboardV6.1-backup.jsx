import React, { useState, useRef, useMemo, useEffect } from 'react';
import { compressImageToBase64 } from '../services/apiService';

// ============================================================================
// SAKLAR FITUR V6.1 (FEATURE FLAGS)
// Ubah nilai false menjadi true di bawah ini jika sewaktu-waktu ingin
// menampilkan kembali Tombol Darurat SOS atau 4 Panel Kamera CCTV di layar.
// ============================================================================
const SHOW_SOS_BUTTON = false;
const SHOW_CCTV_PANEL = false;

const MONTH_LIST = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_ORDER = {
  Januari: 1, Februari: 2, Maret: 3, April: 4, Mei: 5, Juni: 6,
  Juli: 7, Agustus: 8, September: 9, Oktober: 10, November: 11, Desember: 12
};

function extractCleanNum(rawVal) {
  const digits = String(rawVal || '').replace(/[^0-9]/g, '');
  return digits ? digits.padStart(2, '0') : '';
}

// Data Fallback Rekap Tutup Buku (Hanya dipakai saat Offline / Belum Ada Respon Server)
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

// Default 6 Slot Parkir Fasum: SELURUHNYA KOSONG (Menunggu Klik Check-In oleh Security)
const EMPTY_PARKING_SLOTS = [
  { slot_id: 'SLOT-01', slot_number: 1, posisi_layout: 'KIRI_VERTIKAL_1', nama_slot: 'Slot 01', status_slot: 'Kosong', house_id: '-', nama_pemilik: '-', nomor_polisi: '-', jenis_paket: 'Tersedia', waktu_masuk: '-', catatan: 'Kosong — Klik untuk Check-In', updated_by: 'SYSTEM' },
  { slot_id: 'SLOT-02', slot_number: 2, posisi_layout: 'KIRI_VERTIKAL_2', nama_slot: 'Slot 02', status_slot: 'Kosong', house_id: '-', nama_pemilik: '-', nomor_polisi: '-', jenis_paket: 'Tersedia', waktu_masuk: '-', catatan: 'Kosong — Klik untuk Check-In', updated_by: 'SYSTEM' },
  { slot_id: 'SLOT-03', slot_number: 3, posisi_layout: 'KIRI_VERTIKAL_3', nama_slot: 'Slot 03', status_slot: 'Kosong', house_id: '-', nama_pemilik: '-', nomor_polisi: '-', jenis_paket: 'Tersedia', waktu_masuk: '-', catatan: 'Kosong — Klik untuk Check-In', updated_by: 'SYSTEM' },
  { slot_id: 'SLOT-04', slot_number: 4, posisi_layout: 'KIRI_VERTIKAL_4', nama_slot: 'Slot 04', status_slot: 'Kosong', house_id: '-', nama_pemilik: '-', nomor_polisi: '-', jenis_paket: 'Tersedia', waktu_masuk: '-', catatan: 'Kosong — Klik untuk Check-In', updated_by: 'SYSTEM' },
  { slot_id: 'SLOT-05', slot_number: 5, posisi_layout: 'KANAN_ATAS_5', nama_slot: 'Slot 05', status_slot: 'Kosong', house_id: '-', nama_pemilik: '-', nomor_polisi: '-', jenis_paket: 'Tersedia', waktu_masuk: '-', catatan: 'Kosong — Klik untuk Check-In', updated_by: 'SYSTEM' },
  { slot_id: 'SLOT-06', slot_number: 6, posisi_layout: 'KANAN_BAWAH_6', nama_slot: 'Slot 06', status_slot: 'Kosong', house_id: '-', nama_pemilik: '-', nomor_polisi: '-', jenis_paket: 'Tersedia', waktu_masuk: '-', catatan: 'Kosong — Klik untuk Check-In', updated_by: 'SYSTEM' }
];

/**
 * Generator Kalender Rotasi Mingguan Security (Pak Eko & Pak Mulyadi)
 * Minggu-Kamis: 2 Shift Normal | Jumat: Malam Libur | Sabtu: Rotasi Pagi & Malam Libur
 */
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

export default function PublicDashboard({
  data,
  dashboardData,
  isLoading = false,
  isRefreshing = false,
  isOnline = true,
  hasServerData = false,
  liveClock = '',
  lastSyncTime = '',
  selectedMonth = 'November',
  selectedYear = 2026,
  onChangePeriod,
  activeTab: externalActiveTab,
  setActiveTab: externalSetActiveTab,
  onRefresh,
  onOpenQris,
  onOpenAdmin,
  onOpenAdminLogin,
  isAdminLoggedIn = false,
  onInputSecurityLog,
  onUpdateParkingSlot,
  onOpenLightbox,
  formatHouseIdentity
}) {
  const sourceData = data || dashboardData || {};

  // State Tab Navigasi (1 Menu Terpadu tanpa Bottom Bar HP)
  const [internalTab, setInternalTab] = useState('beranda');
  const activeTab = externalActiveTab || internalTab;
  const setActiveTab = externalSetActiveTab || setInternalTab;

  const [showBalance, setShowBalance] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [secretTapCount, setSecretTapCount] = useState(0);

  // Default buka rincian bulan berjalan (terbaru) di Beranda
  const [expandedMonth, setExpandedMonth] = useState(selectedMonth || 'November');

  // State Filter Tab 22 Rumah
  const [searchRumah, setSearchRumah] = useState('');
  const [filterStatusIpl, setFilterStatusIpl] = useState('ALL');

  // State Filter Tab Buku Kas
  const [filterBulanKas, setFilterBulanKas] = useState('Semua');
  const [filterKategoriKas, setFilterKategoriKas] = useState('ALL');

  // State Denah 6 Slot Parkir Dinamis (Klik oleh Security untuk Check-In / Check-Out)
  const [optimisticSlots, setOptimisticSlots] = useState(null);
  const [activeParkingModalSlot, setActiveParkingModalSlot] = useState(null);
  const [isSavingSlot, setIsSavingSlot] = useState(false);

  // State Pos Security & Daftar Paket di Pos
  const [optimisticLogs, setOptimisticLogs] = useState([]);
  const [secSubTab, setSecSubTab] = useState('paket'); // 'paket' | 'lapor' | 'jadwal' | 'riwayat'
  const [copiedWaText, setCopiedWaText] = useState('');
  const [isSavingLog, setIsSavingLog] = useState(false);

  // Reset optimistic state begitu data baru tiba dari server
  useEffect(() => {
    if (Array.isArray(sourceData.parking_slots) && sourceData.parking_slots.length > 0) {
      setOptimisticSlots(null);
    }
  }, [sourceData.parking_slots]);

  useEffect(() => {
    if (Array.isArray(sourceData.security_logs) && hasServerData) {
      setOptimisticLogs([]);
    }
  }, [sourceData.security_logs, hasServerData]);

  // Form Laporan Cepat Security & Paket Tiba di Pos
  const [secForm, setSecForm] = useState({
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'PAKET_SURAT',
    sub_kategori: 'Paket Tiba di Pos (Belum Diambil)',
    house_id: 'H-01',
    titik_patroli: '5 Titik (Pos, Gerbang, Gang Depan, Gang Belakang, Lapangan)',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: '',
    file_base64: '',
    file_name: ''
  });

  // State Tombol SOS (Hanya aktif jika SHOW_SOS_BUTTON = true)
  const [sosProgress, setSosProgress] = useState(0);
  const sosTimerRef = useRef(null);

  const formatRp = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');

  // Daftar 22 Rumah (Diseragamkan bebas bug "No. No." & "undefined")
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

  // Helper Standarisasi "No. XX / Nama Warga"
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

  // Buku Kas (100% Data Riil dari Spreadsheet saat online)
  const cashLedger = useMemo(() => {
    if (Array.isArray(sourceData.cash_ledger)) {
      return sourceData.cash_ledger;
    }
    return [];
  }, [sourceData.cash_ledger]);

  // Laporan Bulanan dengan KALKULASI LIVE untuk Bulan Berjalan (OPEN) — Fix November Rp 0
  const monthlyClosings = useMemo(() => {
    const rawList =
      Array.isArray(sourceData.monthly_closings) && sourceData.monthly_closings.length > 0
        ? sourceData.monthly_closings.map((item) => ({ ...item }))
        : hasServerData
        ? []
        : FALLBACK_CLOSINGS.map((item) => ({ ...item }));

    // Pastikan bulan berjalan (selectedMonth) selalu tampil di daftar laporan Beranda
    const hasSelected = rawList.some(
      (c) =>
        String(c.periode_bulan) === String(selectedMonth) &&
        Number(c.periode_tahun || 2026) === Number(selectedYear)
    );

    if (!hasSelected && selectedMonth) {
      const prevOct = rawList.find((c) => String(c.periode_bulan) === 'Oktober');
      const saldoAwalFallback = prevOct ? Number(prevOct.sisa_saldo || 1394200) : 1394200;
      rawList.unshift({
        id: `CLS-${selectedYear}-${selectedMonth}`,
        periode_bulan: selectedMonth,
        periode_tahun: Number(selectedYear),
        saldo_awal: saldoAwalFallback,
        uang_masuk: 0,
        total_pengeluaran: 0,
        pengeluaran_proyek: 0,
        sisa_saldo: saldoAwalFallback,
        status_tutup_buku: 'OPEN'
      });
    }

    // Hitung LIVE dari cash_ledger untuk setiap bulan yang belum CLOSED (status OPEN / berjalan)
    const computed = rawList.map((item) => {
      const isClosed = String(item.status_tutup_buku || '').toUpperCase() === 'CLOSED';
      const monthTx = cashLedger.filter(
        (tx) =>
          String(tx.periode_bulan) === String(item.periode_bulan) &&
          Number(tx.periode_tahun || 2026) === Number(item.periode_tahun || 2026)
      );

      // Jika belum CLOSED (atau nilai closing masih 0 padahal sudah ada transaksi di buku kas), hitung live!
      const shouldComputeLive =
        !isClosed ||
        (monthTx.length > 0 &&
          Number(item.uang_masuk || 0) === 0 &&
          Number(item.total_pengeluaran || 0) === 0);

      if (!shouldComputeLive) return item;

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

      const saldoAwal = Number(item.saldo_awal || 1394200);
      const sisaSaldo = saldoAwal + uangMasuk - totalPengeluaran;

      return {
        ...item,
        saldo_awal: saldoAwal,
        uang_masuk: uangMasuk,
        total_pengeluaran: totalPengeluaran,
        pengeluaran_proyek: pengeluaranProyek,
        sisa_saldo: sisaSaldo,
        status_tutup_buku: isClosed ? 'CLOSED' : 'OPEN'
      };
    });

    return computed.sort((a, b) => {
      const yearDiff = Number(b.periode_tahun || 2026) - Number(a.periode_tahun || 2026);
      if (yearDiff !== 0) return yearDiff;
      return (MONTH_ORDER[b.periode_bulan] || 0) - (MONTH_ORDER[a.periode_bulan] || 0);
    });
  }, [sourceData.monthly_closings, cashLedger, selectedMonth, selectedYear, hasServerData]);

  // Denah 6 Slot Parkir (Default SEMUA KOSONG, 100% sinkron dengan sheet parking_slots)
  const parkingSlots = useMemo(() => {
    if (optimisticSlots) return optimisticSlots;

    const serverSlots = Array.isArray(sourceData.parking_slots) ? sourceData.parking_slots : [];
    if (serverSlots.length === 0) return EMPTY_PARKING_SLOTS;

    return EMPTY_PARKING_SLOTS.map((baseSlot, idx) => {
      const matched =
        serverSlots.find((s) => s.slot_id === baseSlot.slot_id) || serverSlots[idx] || {};
      const rawStatus = String(matched.status_slot || 'Kosong');
      const upperSt = rawStatus.toUpperCase();
      const normStatus =
        upperSt === 'TERISI'
          ? 'Terisi'
          : upperSt === 'WEEKEND'
          ? 'Weekend'
          : upperSt === 'TAMU'
          ? 'Tamu'
          : 'Kosong';

      const houseId = normStatus === 'Kosong' ? '-' : (matched.house_id || '-');
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
        nomor_polisi: normStatus === 'Kosong' ? '-' : (matched.nomor_polisi || matched.plat_nomor || '-'),
        jenis_paket: normStatus === 'Kosong' ? 'Tersedia' : (matched.jenis_paket || 'Parkir Bulanan (Rp 150.000)'),
        waktu_masuk: normStatus === 'Kosong' ? '-' : (matched.waktu_masuk || '-'),
        catatan: normStatus === 'Kosong' ? 'Kosong — Klik untuk Check-In' : (matched.catatan || '-')
      };
    });
  }, [optimisticSlots, sourceData.parking_slots, houses]);

  const occupiedParkingCount = parkingSlots.filter((s) => s.status_slot !== 'Kosong').length;

  // Log Security & Paket di Pos (Hanya Data Nyata dari Server + Input Optimistic, tanpa dummy palsu)
  const securityLogs = useMemo(() => {
    const serverLogs = Array.isArray(sourceData.security_logs) ? sourceData.security_logs : [];
    const seenIds = new Set();
    const merged = [];

    [...optimisticLogs, ...serverLogs].forEach((log) => {
      if (!log || !log.id) return;
      if (seenIds.has(log.id)) return;
      seenIds.add(log.id);
      merged.push(log);
    });

    return merged;
  }, [optimisticLogs, sourceData.security_logs]);

  // Filter Khusus Daftar Paket Warga di Pos Security
  const packageLogs = useMemo(() => {
    return securityLogs.filter((log) => log.kategori_laporan === 'PAKET_SURAT');
  }, [securityLogs]);

  const waitingPackagesCount = useMemo(() => {
    return packageLogs.filter(
      (p) => !String(p.sub_kategori || '').toLowerCase().includes('sudah')
    ).length;
  }, [packageLogs]);

  // Kalender Rotasi Security
  const securitySchedules = useMemo(() => {
    if (Array.isArray(sourceData.security_schedules) && sourceData.security_schedules.length > 0) {
      return sourceData.security_schedules;
    }
    return generateSecuritySchedules(selectedMonth, selectedYear);
  }, [sourceData.security_schedules, selectedMonth, selectedYear]);

  // Status IPL 22 Rumah pada Periode Terpilih
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
        : matchedIpl?.status_bayar || (ledgerIpl ? 'Lunas' : 'Belum Bayar');

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

  // Trigger Buka Lightbox Gambar di Dalam Aplikasi
  const triggerLightbox = (url, title, subtitle = '') => {
    if (!url || url === '-') return;
    if (typeof onOpenLightbox === 'function') {
      onOpenLightbox(url, title, subtitle);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Trigger Buka Panel Pengurus
  const triggerAdminOpen = () => {
    if (typeof onOpenAdmin === 'function') onOpenAdmin();
    else if (typeof onOpenAdminLogin === 'function') onOpenAdminLogin();
  };

  const handleLogoTap = () => {
    const next = secretTapCount + 1;
    if (next >= 5) {
      setSecretTapCount(0);
      triggerAdminOpen();
    } else {
      setSecretTapCount(next);
    }
  };

  // Buka Modal Check-In / Check-Out Slot Parkir oleh Security
  const openParkingSlotModal = (slot) => {
    const isCurrentlyEmpty = slot.status_slot === 'Kosong';
    setActiveParkingModalSlot({
      ...slot,
      status_slot: isCurrentlyEmpty ? 'Terisi' : slot.status_slot,
      house_id: isCurrentlyEmpty ? (activeHouses[0]?.id || 'H-01') : slot.house_id,
      jenis_paket: isCurrentlyEmpty ? 'Parkir Bulanan (Rp 150.000)' : slot.jenis_paket,
      nomor_polisi: isCurrentlyEmpty ? '' : (slot.nomor_polisi === '-' ? '' : slot.nomor_polisi),
      catatan: isCurrentlyEmpty ? 'Kondisi kendaraan terparkir rapi & aman' : (slot.catatan === '-' ? '' : slot.catatan),
      updated_by: slot.updated_by && slot.updated_by !== 'SYSTEM' ? slot.updated_by : 'Pak Eko',
      shift: 'Malam',
      catat_ke_log_security: true
    });
  };

  // Simpan Check-In / Update Kondisi Slot Parkir
  const handleSaveParkingSlot = async (e) => {
    e.preventDefault();
    if (!activeParkingModalSlot) return;
    setIsSavingSlot(true);
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

      const updatedList = parkingSlots.map((s) =>
        s.slot_id === payload.slot_id ? { ...s, ...payload } : s
      );
      setOptimisticSlots(updatedList);

      if (typeof onUpdateParkingSlot === 'function') {
        await onUpdateParkingSlot(payload);
      }
      setActiveParkingModalSlot(null);
    } finally {
      setIsSavingSlot(false);
    }
  };

  // Tombol Cepat Check-Out (Kosongkan Slot Parkir)
  const handleQuickCheckoutSlot = async () => {
    if (!activeParkingModalSlot) return;
    setIsSavingSlot(true);
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

      const updatedList = parkingSlots.map((s) =>
        s.slot_id === checkoutPayload.slot_id ? { ...s, ...checkoutPayload } : s
      );
      setOptimisticSlots(updatedList);

      if (typeof onUpdateParkingSlot === 'function') {
        await onUpdateParkingSlot(checkoutPayload);
      }
      setActiveParkingModalSlot(null);
    } finally {
      setIsSavingSlot(false);
    }
  };

  // Generator Teks WA Otomatis untuk Laporan Security & Paket Pos
  const buildSecurityWaMessage = (formObj) => {
    const houseLabel =
      formObj.house_id && formObj.house_id !== '-' ? getHouseLabel(formObj.house_id) : '-';
    const jamNow = new Date()
      .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
      .replace(/\./g, ':');

    if (formObj.kategori_laporan === 'PAKET_SURAT') {
      return `*INFO PAKET WARGA DI POS SECURITY CMR*\nAssalamualaikum, izin menginformasikan laporan paket/surat warga pukul ${jamNow} WIB:\n• Tujuan Rumah: *${houseLabel}*\n• Status Paket: *${formObj.sub_kategori}*\n• Petugas Pos: *${formObj.nama_security} (Shift ${formObj.shift})*\n• Catatan: ${formObj.detail_catatan || 'Disimpan dengan aman di meja Pos Security.'}\n*Terima kasih* 🙏`;
    }

    if (formObj.kategori_laporan === 'ABSEN_SHIFT') {
      return `*ABSEN PERGANTIAN SHIFT SECURITY CMR*\nAssalamualaikum, izin melaporkan giat pos jaga pukul ${jamNow} WIB:\n• Petugas: *${formObj.nama_security} (Shift ${formObj.shift})*\n• Giat: *${formObj.sub_kategori}*\n• Status Gerbang: ${formObj.status_gerbang}\n• Situasi & 815: ${formObj.detail_catatan || 'Situasi aman kondusif tanpa taruna'}, cuaca ${formObj.cuaca_815}.\n*Terima kasih* 🙏🫡`;
    }

    return `*LAPORAN GIAT & PATROLI SECURITY CMR*\nAssalamualaikum, izin lapor petugas jaga (*${formObj.nama_security} - Shift ${formObj.shift}*) pukul ${jamNow} WIB:\n• Kategori: *${formObj.sub_kategori}*\n• Area / Titik: ${formObj.titik_patroli}\n• Situasi: ${formObj.detail_catatan || 'Aman terkendali tanpa taruna.'}\n• Cuaca 815: ${formObj.cuaca_815}\n*Terima kasih* 🙏🫡`;
  };

  const handleSecPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await compressImageToBase64(file);
    setSecForm((prev) => ({
      ...prev,
      file_base64: base64,
      file_name: file.name
    }));
  };

  const handleSubmitSecurityForm = async (e) => {
    e.preventDefault();
    setIsSavingLog(true);
    try {
      const now = new Date();
      const houseLabel =
        secForm.house_id && secForm.house_id !== '-' ? getHouseLabel(secForm.house_id) : '-';
      const waText = buildSecurityWaMessage(secForm);

      const payload = {
        id: `SEC-${Date.now()}`,
        tanggal: now.toISOString().slice(0, 10),
        jam: now
          .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
          .replace(/\./g, ':'),
        nama_security: secForm.nama_security,
        shift: secForm.shift,
        kategori_laporan: secForm.kategori_laporan,
        sub_kategori: secForm.sub_kategori,
        house_id: secForm.house_id,
        nama_warga_tujuan: houseLabel,
        titik_patroli: secForm.titik_patroli,
        cuaca_815: secForm.cuaca_815,
        status_gerbang: secForm.status_gerbang,
        detail_catatan:
          secForm.detail_catatan ||
          (secForm.kategori_laporan === 'PAKET_SURAT'
            ? `Paket untuk ${houseLabel} (${secForm.sub_kategori})`
            : 'Situasi aman kondusif tanpa taruna.'),
        url_foto: secForm.file_base64 || '-',
        file_base64: secForm.file_base64,
        file_name: secForm.file_name,
        teks_wa: waText
      };

      setOptimisticLogs((prev) => [payload, ...prev]);
      setCopiedWaText(waText);

      if (navigator.clipboard) {
        navigator.clipboard.writeText(waText).catch(() => {});
      }

      if (typeof onInputSecurityLog === 'function') {
        await onInputSecurityLog(payload);
      }

      setSecForm((prev) => ({
        ...prev,
        detail_catatan: '',
        file_base64: '',
        file_name: ''
      }));

      if (secForm.kategori_laporan === 'PAKET_SURAT') {
        setSecSubTab('paket');
      }
    } finally {
      setIsSavingLog(false);
    }
  };

  const handleMarkPackagePickedUp = async (pkgItem) => {
    const updatedItem = {
      ...pkgItem,
      sub_kategori: 'Paket Sudah Diambil / Diantar ke Rumah',
      detail_catatan: `${pkgItem.detail_catatan} (Sudah diterima warga)`
    };

    setOptimisticLogs((prev) => {
      const exists = prev.some((item) => item.id === pkgItem.id);
      if (exists) {
        return prev.map((item) => (item.id === pkgItem.id ? updatedItem : item));
      }
      return [updatedItem, ...prev];
    });

    if (typeof onInputSecurityLog === 'function') {
      try {
        await onInputSecurityLog(updatedItem);
      } catch (err) {
        console.warn('Update status paket tersimpan lokal:', err.message);
      }
    }
  };

  // Handler Tombol SOS (Hanya digunakan jika SHOW_SOS_BUTTON = true)
  const startSosHold = () => {
    let current = 0;
    sosTimerRef.current = setInterval(() => {
      current += 10;
      setSosProgress(current);
      if (current >= 100) {
        clearInterval(sosTimerRef.current);
        setSosProgress(0);
        alert('🚨 SINYAL DARURAT SOS TERKIRIM KE POS SECURITY & GRUP WARGA CMR!');
      }
    }, 300);
  };

  const cancelSosHold = () => {
    if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    setSosProgress(0);
  };

  const navItems = [
    { id: 'beranda', label: 'Beranda', icon: '🏠' },
    { id: 'rumah', label: '22 Rumah', icon: '🏘️' },
    { id: 'mutasi', label: 'Buku Kas', icon: '📑' },
    { id: 'parkir', label: 'Parkir', icon: '🅿️', badge: occupiedParkingCount },
    { id: 'keamanan', label: 'Pos Security', icon: '🛡️', badge: waitingPackagesCount }
  ];

  // Komponen Kartu Slot Denah Horizontal
  const renderParkingSlotCard = (slot) => {
    const isEmpty = slot.status_slot === 'Kosong';
    const isWeekend = slot.status_slot === 'Weekend';
    const isTamu = slot.status_slot === 'Tamu';

    return (
      <button
        key={slot.slot_id}
        type="button"
        onClick={() => openParkingSlotModal(slot)}
        className={`w-full text-left p-3.5 rounded-2xl border-2 transition flex flex-col justify-between min-h-[118px] cursor-pointer hover:shadow-md ${
          isEmpty
            ? 'bg-slate-50/80 border-dashed border-slate-300 hover:border-teal-600 hover:bg-teal-50/30'
            : isWeekend
            ? 'bg-amber-50 border-amber-300 hover:border-amber-500'
            : isTamu
            ? 'bg-sky-50 border-sky-300 hover:border-sky-500'
            : 'bg-emerald-50 border-emerald-400 hover:border-emerald-600'
        }`}
      >
        <div className="flex items-center justify-between gap-2 w-full">
          <span className="font-black text-xs text-slate-900">
            🅿️ {slot.nama_slot || slot.slot_id}
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
            <p className="text-xs font-bold text-slate-400">
              + Klik untuk Check-In Parkir
            </p>
          ) : (
            <>
              <p className="font-extrabold text-xs sm:text-sm text-teal-950 line-clamp-1">
                {slot.house_id && slot.house_id !== '-'
                  ? getHouseLabel(slot.house_id)
                  : slot.nama_pemilik}
              </p>
              <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
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
          <span className="font-extrabold text-teal-800 shrink-0 ml-2">
            {isEmpty ? 'Check-In →' : 'Update / Out →'}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-10">
      {/* HEADER UTAMA + STATUS LIVE ONLINE & TOMBOL REFRESH */}
      <header className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-800 text-white shadow-md sticky top-0 z-30">
        {/* Bar Status Live: Titik Lampu Hijau + Jam Detik WIB + Tombol Refresh */}
        <div className="bg-black/25 border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isRefreshing
                      ? 'bg-amber-400'
                      : isOnline
                      ? 'bg-emerald-400'
                      : 'bg-rose-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isRefreshing
                      ? 'bg-amber-400'
                      : isOnline
                      ? 'bg-emerald-400'
                      : 'bg-rose-500'
                  }`}
                />
              </span>
              <span className="font-bold text-emerald-200">
                {isRefreshing
                  ? 'Menyinkronkan Database...'
                  : isOnline
                  ? 'Online • Real Cash V6.1'
                  : 'Mode Cadangan Lokal'}
              </span>
              {lastSyncTime && (
                <span className="hidden sm:inline text-teal-200/80 font-mono">
                  | Sinkron: {lastSyncTime}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {liveClock && (
                <span className="bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-semibold">
                  🕒 {liveClock}
                </span>
              )}
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 text-slate-950 font-extrabold px-2.5 py-0.5 rounded-lg shadow-sm transition cursor-pointer"
              >
                <span className={isRefreshing ? 'animate-spin inline-block' : ''}>🔄</span>
                <span>{isRefreshing ? 'Memuat...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bar Identitas Aplikasi & Navigasi Desktop */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div
            onClick={handleLogoTap}
            className="cursor-pointer select-none flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center font-black text-lg shadow-inner overflow-hidden shrink-0">
              {!logoError ? (
                <img
                  src={sourceData.logo_url || '/assets/logo-cmoney.png'}
                  alt="Logo C-Money"
                  className="w-full h-full object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span>C</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wide">
                  {sourceData.app_name || 'C-Money'}
                </span>
                <span className="text-[10px] bg-emerald-400/20 border border-emerald-300/40 px-2 py-0.5 rounded-full font-bold">
                  V6.1 • Transparan
                </span>
              </div>
              <p className="text-xs text-teal-100 line-clamp-1">
                {sourceData.cluster_full_name || 'Cluster Mutiara Residence Sumberjaya'}
              </p>
            </div>
          </div>

          {/* Menu Desktop 5 Tab */}
          <nav className="hidden md:flex items-center gap-1.5 bg-black/20 p-1.5 rounded-2xl border border-white/10">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-white text-teal-900 shadow-sm'
                    : 'text-teal-100 hover:bg-white/10'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Tombol QRIS & Panel Pengurus */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenQris && onOpenQris(activeHouses[0] || null)}
              className="hidden sm:flex items-center gap-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow transition cursor-pointer"
            >
              📲 Bayar QRIS
            </button>
            <button
              type="button"
              onClick={triggerAdminOpen}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold transition cursor-pointer"
            >
              {isAdminLoggedIn ? '⚙️ Panel Pengurus' : '🔒 Pengurus'}
            </button>
          </div>
        </div>
      </header>

      {/* KONTEN UTAMA FULL-WIDTH (ATAS: RINGKASAN SALDO & 1 MENU TERPADU, BAWAH: KONTEN TAB PENUH) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* BAGIAN ATAS: KARTU SALDO KAS NYATA + CARD PAKET POS + 1 MENU UTAMA TERPADU */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Kiri (7 Kolom di Desktop): Kartu Saldo Kas Nyata (100% Real Cash) */}
          <div className="lg:col-span-7 bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-wider text-teal-200 font-bold">
                  Saldo Uang Kas Nyata (Real Cash)
                </span>
                <button
                  type="button"
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-xs text-teal-300 hover:text-white underline font-semibold cursor-pointer"
                >
                  {showBalance ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-3 mt-1.5">
                <div className="text-3xl sm:text-4xl font-black tracking-tight">
                  {showBalance ? formatRp(sourceData.current_balance ?? 1394200) : 'Rp ••••••••'}
                </div>

                {/* Pilihan Cepat Periode Buku */}
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                  <span className="text-teal-200 font-semibold">Buku IPL:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      const nextMonth = e.target.value;
                      setExpandedMonth(nextMonth);
                      if (onChangePeriod) onChangePeriod(nextMonth, selectedYear);
                    }}
                    className="bg-transparent text-emerald-300 font-extrabold focus:outline-none cursor-pointer"
                  >
                    {MONTH_LIST.map((m) => (
                      <option key={m} value={m} className="text-slate-900">
                        {m} {selectedYear}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full text-emerald-200 font-bold">
                <span>●</span>
                <span>
                  IPL {selectedMonth}: {totalLunasCount}/{activeHouses.length || 21} Rumah Aktif
                  Lunas
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-teal-100">
                <span>
                  Tarif Dasar:{' '}
                  <strong className="text-emerald-300">
                    {formatRp(sourceData.default_ipl_amount || 200000)}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  <strong>21</strong> Aktif • <strong>1</strong> Non-Aktif
                </span>
              </div>
            </div>
          </div>

          {/* Kanan (5 Kolom di Desktop): Card Daftar Paket Pos (Bubble Angka Saja) + 1 Menu Terpadu */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-3">
            {/* Card Daftar Paket di Pos Security (Bubble Oranye Angka Saja, Tanpa Kata "Menunggu") */}
            <div
              onClick={() => {
                setActiveTab('keamanan');
                setSecSubTab('paket');
              }}
              className="bg-white rounded-3xl p-4 shadow-sm border border-amber-200/80 flex items-center justify-between gap-3 cursor-pointer hover:border-amber-400 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl font-bold shrink-0">
                  📦
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">
                      Daftar Paket di Pos Security
                    </h3>
                    <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-amber-500 text-white text-[11px] font-black inline-flex items-center justify-center shadow-sm">
                      {waitingPackagesCount}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Cek kiriman paket warga & foto bukti di Pos Security
                  </p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-teal-800 shrink-0">Lihat →</span>
            </div>

            {/* 1 MENU UTAMA TERPADU (6 TOMBOL: QRIS + 5 TAB UTAMA — PENGGANTI BOTTOM BAR HP & BANNER HIJAU) */}
            <div className="bg-white rounded-3xl shadow-sm p-3 grid grid-cols-6 gap-1 text-center border border-slate-200/70">
              <button
                type="button"
                onClick={() => onOpenQris && onOpenQris(activeHouses[0] || null)}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-teal-700 text-white flex items-center justify-center text-base sm:text-lg shadow group-hover:scale-105 transition">
                  📲
                </div>
                <span className="text-[10px] font-extrabold text-teal-900 mt-1 leading-tight">
                  QRIS IPL
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('beranda')}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-base sm:text-lg border transition ${
                    activeTab === 'beranda'
                      ? 'bg-teal-800 text-white border-teal-800 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  🏠
                </div>
                <span className="text-[10px] font-bold text-slate-700 mt-1 leading-tight">
                  Beranda
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('rumah')}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-base sm:text-lg border transition ${
                    activeTab === 'rumah'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}
                >
                  🏘️
                </div>
                <span className="text-[10px] font-bold text-slate-700 mt-1 leading-tight">
                  22 Rumah
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mutasi')}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-base sm:text-lg border transition ${
                    activeTab === 'mutasi'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}
                >
                  📑
                </div>
                <span className="text-[10px] font-bold text-slate-700 mt-1 leading-tight">
                  Buku Kas
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('parkir')}
                className="flex flex-col items-center group relative cursor-pointer"
              >
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-base sm:text-lg border transition ${
                    activeTab === 'parkir'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-sky-50 text-sky-700 border-sky-100'
                  }`}
                >
                  🅿️
                </div>
                {occupiedParkingCount > 0 && (
                  <span className="absolute -top-1 right-1 bg-sky-600 text-white text-[9px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center">
                    {occupiedParkingCount}
                  </span>
                )}
                <span className="text-[10px] font-bold text-slate-700 mt-1 leading-tight">
                  Parkir
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('keamanan')}
                className="flex flex-col items-center group relative cursor-pointer"
              >
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-base sm:text-lg border transition ${
                    activeTab === 'keamanan'
                      ? 'bg-teal-900 text-white border-teal-900 shadow-sm'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  🛡️
                </div>
                {waitingPackagesCount > 0 && (
                  <span className="absolute -top-1 right-1 bg-amber-500 text-white text-[9px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center">
                    {waitingPackagesCount}
                  </span>
                )}
                <span className="text-[10px] font-bold text-slate-700 mt-1 leading-tight">
                  Security
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* ================= AREA KONTEN TAB AKTIF (FULL-WIDTH 100%) ================= */}
        <section className="space-y-5">
          {/* ================= TAB 1: BERANDA (LAPORAN KAS BULANAN LIVE + PAKET AKTIF) ================= */}
          {activeTab === 'beranda' && (
            <div className="space-y-4">
              {/* Ringkasan Paket Aktif di Pos (Hanya tampil jika benar-benar ada paket menunggu di server) */}
              {waitingPackagesCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="font-extrabold text-amber-950 text-xs sm:text-sm flex items-center gap-2">
                      <span>📦 Paket di Pos Security</span>
                      <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-amber-500 text-white text-[11px] font-black inline-flex items-center justify-center">
                        {waitingPackagesCount}
                      </span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('keamanan');
                        setSecSubTab('paket');
                      }}
                      className="text-xs font-extrabold text-teal-800 hover:underline cursor-pointer"
                    >
                      Kelola Semua Paket →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {packageLogs
                      .filter(
                        (p) => !String(p.sub_kategori || '').toLowerCase().includes('sudah')
                      )
                      .slice(0, 6)
                      .map((pkg) => (
                        <div
                          key={pkg.id}
                          className="bg-white p-3 rounded-2xl border border-amber-200/80 flex items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <p className="font-extrabold text-slate-900">
                              {pkg.house_id && pkg.house_id !== '-'
                                ? getHouseLabel(pkg.house_id)
                                : pkg.nama_warga_tujuan}
                            </p>
                            <p className="text-[11px] text-slate-600 line-clamp-1">
                              {pkg.detail_catatan}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {pkg.tanggal} • {pkg.jam} WIB ({pkg.nama_security})
                            </p>
                          </div>
                          {pkg.url_foto && pkg.url_foto !== '-' && (
                            <button
                              type="button"
                              onClick={() =>
                                triggerLightbox(
                                  pkg.url_foto,
                                  `Foto Paket — ${getHouseLabel(pkg.house_id)}`,
                                  `${pkg.tanggal} • ${pkg.jam} WIB`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 font-bold text-[11px] shrink-0 cursor-pointer"
                            >
                              🖼️ Foto
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Laporan & Rincian Kas Bulanan (Urut Terbaru di Atas & Live untuk Bulan Berjalan) */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">
                      Laporan & Rincian Buku Kas Bulanan (Uang Kas Nyata)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Urut dari periode terbaru • Bulan berjalan dihitung otomatis dari Buku Kas
                      (Live)
                    </p>
                  </div>
                  <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full font-bold">
                    Terbaru di Atas ↓
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
                    const breakdown = getMonthlyBreakdown(
                      item.periode_bulan,
                      item.periode_tahun
                    );

                    return (
                      <div
                        key={item.id || item.periode_bulan}
                        className="rounded-2xl bg-slate-50 border border-slate-200/80 overflow-hidden transition"
                      >
                        <div
                          onClick={() =>
                            setExpandedMonth(isExpanded ? '' : item.periode_bulan)
                          }
                          className="p-4 cursor-pointer hover:bg-slate-100/70 transition space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-900 text-sm">
                                {item.periode_bulan} {item.periode_tahun}
                              </span>
                              {isLiveOpen && (
                                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                  ● Berjalan (Live)
                                </span>
                              )}
                              <span className="text-[11px] text-slate-500">
                                (Saldo Awal: {formatRp(item.saldo_awal)})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                                Sisa Saldo: {formatRp(item.sisa_saldo)}
                              </span>
                              <span className="text-xs font-bold text-teal-700">
                                {isExpanded ? '▲ Tutup' : '▼ Rincian'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                            <div>
                              <div className="flex justify-between text-emerald-700 font-semibold mb-1">
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
                              <div className="flex justify-between text-rose-600 font-semibold mb-1">
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
                          <div className="px-4 pb-4 pt-3 border-t border-slate-200/80 bg-white text-xs space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                              <div>
                                <span className="text-slate-400 block">Saldo Awal</span>
                                <span className="font-bold text-slate-800">
                                  {formatRp(item.saldo_awal)}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Uang Masuk</span>
                                <span className="font-bold text-emerald-700">
                                  {formatRp(item.uang_masuk)}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Total Keluar</span>
                                <span className="font-bold text-rose-600">
                                  {formatRp(item.total_pengeluaran)}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Khusus Proyek</span>
                                <span className="font-bold text-amber-700">
                                  {formatRp(item.pengeluaran_proyek)}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Sisa Saldo</span>
                                <span className="font-extrabold text-teal-700">
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
                                        <div className="flex items-center justify-between font-bold text-slate-800">
                                          <span>• {kat}</span>
                                          <span className="text-rose-600">
                                            {formatRp(group.total)}
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-600">
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
                                                  className="text-teal-700 font-extrabold hover:underline cursor-pointer"
                                                >
                                                  [🖼️ Bukti]
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
            </div>
          )}

          {/* ================= TAB 2: 22 RUMAH (FORMAT SERAGAM "No. XX / Nama Warga" + LIGHTBOX BUKTI) ================= */}
          {activeTab === 'rumah' && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">
                    🏘️ Status Iuran 22 Unit Rumah CMR ({selectedMonth} {selectedYear})
                  </h4>
                  <p className="text-xs text-slate-500">
                    21 Unit Aktif & 1 Unit Non-Aktif (No. 04 — Dijual Pihak BPR)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Cari No. XX / Nama Warga..."
                    value={searchRumah}
                    onChange={(e) => setSearchRumah(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 flex-1 sm:w-56"
                  />
                  <select
                    value={filterStatusIpl}
                    onChange={(e) => setFilterStatusIpl(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 font-bold bg-slate-50"
                  >
                    <option value="ALL">Semua Unit (22)</option>
                    <option value="AKTIF">Hunian Aktif (21)</option>
                    <option value="Lunas">✅ Lunas ({totalLunasCount})</option>
                    {totalMenungguCount > 0 && (
                      <option value="Menunggu Validasi">
                        ⏳ Menunggu Validasi ({totalMenungguCount})
                      </option>
                    )}
                    <option value="Belum Bayar">❌ Belum Bayar ({totalBelumBayarCount})</option>
                  </select>
                </div>
              </div>

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
                          ? 'bg-slate-100/80 border-slate-300 opacity-80'
                          : isLunas
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : isWaiting
                          ? 'bg-sky-50/50 border-sky-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                            {h.display_label}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                              isNonAktif
                                ? 'bg-slate-200 text-slate-700'
                                : isLunas
                                ? 'bg-emerald-100 text-emerald-800'
                                : isWaiting
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
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

                        <p className="text-[11px] font-semibold text-slate-700 mt-1.5">
                          {isNonAktif
                            ? 'Bebas Tagihan IPL (Unit BPR)'
                            : isLunas
                            ? `Uang Masuk: ${formatRp(h.nominal_bayar)}`
                            : `Tagihan Dasar: ${formatRp(h.tarif_ipl || 200000)}`}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-400 truncate">
                          {isNonAktif
                            ? 'BPR'
                            : isLunas && h.tanggal_bayar !== '-'
                            ? `Tgl: ${h.tanggal_bayar}`
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
                              className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-extrabold transition cursor-pointer"
                            >
                              🖼️ Bukti
                            </button>
                          )}

                          {!isNonAktif && !isLunas && (
                            <button
                              type="button"
                              onClick={() => onOpenQris && onOpenQris(h)}
                              className="bg-teal-800 hover:bg-teal-900 text-white font-bold px-2.5 py-1 rounded-lg shadow-sm transition cursor-pointer"
                            >
                              Bayar QRIS →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 3: BUKU KAS (MUTASI KAS NYATA + LIGHTBOX BUKTI) ================= */}
          {activeTab === 'mutasi' && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">
                    📑 Rincian Buku Kas Cluster (Urut Terbaru ke Terlama)
                  </h4>
                  <p className="text-xs text-slate-500">
                    100% Pencatatan Uang Kas Nyata • Klik tombol Bukti untuk melihat foto nota di
                    layar
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <select
                    value={filterBulanKas}
                    onChange={(e) => setFilterBulanKas(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 font-bold bg-slate-50"
                  >
                    <option value="Semua">Semua Periode Bulan</option>
                    {MONTH_LIST.slice()
                      .reverse()
                      .map((b) => (
                        <option key={b} value={b}>
                          Buku {b} 2026
                        </option>
                      ))}
                  </select>

                  <select
                    value={filterKategoriKas}
                    onChange={(e) => setFilterKategoriKas(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 font-bold bg-slate-50"
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

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 block">Total Uang Masuk Terfilter</span>
                  <span className="text-sm sm:text-base font-extrabold text-emerald-700">
                    {formatRp(totalMasukFilter)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Pengeluaran Terfilter</span>
                  <span className="text-sm sm:text-base font-extrabold text-rose-600">
                    {formatRp(totalKeluarFilter)}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {filteredLedger.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">
                    Tidak ada mutasi kas yang cocok dengan filter ini.
                  </p>
                ) : (
                  filteredLedger.map((tx) => {
                    const isProyek =
                      tx.is_proyek === true ||
                      String(tx.is_proyek || '').toUpperCase() === 'TRUE';
                    const hasProof = tx.url_bukti && tx.url_bukti !== '-';
                    const houseText =
                      tx.house_id && tx.house_id !== '-' && tx.house_id !== 'ALL'
                        ? getHouseLabel(tx.house_id)
                        : '';

                    return (
                      <div
                        key={tx.id}
                        className="p-3.5 rounded-2xl border border-slate-100 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                              String(tx.tipe || '').toUpperCase() === 'IN'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {String(tx.tipe || '').toUpperCase() === 'IN' ? '↓' : '↑'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-800">{tx.kategori}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                                {tx.periode_bulan} {tx.periode_tahun || 2026}
                              </span>
                              {houseText && (
                                <span className="text-[10px] bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md font-bold">
                                  {houseText}
                                </span>
                              )}
                              {isProyek && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                                  Proyek: {tx.nama_proyek || tx.keterangan}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-700 font-medium mt-0.5">{tx.keterangan}</p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="text-[10px] text-slate-400">
                                Tanggal: {tx.tanggal} • ID: {tx.id}
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
                                  className="inline-flex items-center gap-1 text-[11px] font-extrabold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-lg transition cursor-pointer"
                                >
                                  🖼️ Lihat Foto Bukti
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-extrabold text-sm ${
                              String(tx.tipe || '').toUpperCase() === 'IN'
                                ? 'text-emerald-700'
                                : 'text-rose-600'
                            }`}
                          >
                            {String(tx.tipe || '').toUpperCase() === 'IN' ? '+' : '-'}{' '}
                            {formatRp(tx.nominal)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 4: DENAH HORIZONTAL 6 SLOT PARKIR FASUM (DEFAULT KOSONG, KLIK SECURITY) ================= */}
          {activeTab === 'parkir' && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">
                    🅿️ Denah 6 Slot Parkir Fasum CMR (Check-In / Check-Out oleh Security)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Seluruh slot bebas & dinamis • Security cukup klik kotak slot untuk mencatat
                    kendaraan masuk/keluar & melaporkan kondisinya
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold">
                    Terisi: {occupiedParkingCount}/6
                  </span>
                  <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full font-bold">
                    Kosong: {6 - occupiedParkingCount}
                  </span>
                </div>
              </div>

              {/* DENAH VISUAL HORIZONTAL: KIRI 4 SLOT (01-04) | JALUR AKSES | KANAN 2 SLOT ATAS-BAWAH (05-06) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-100/90 border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  {/* SISI KIRI: 4 SLOT PARKIR (01 - 04) */}
                  <div className="lg:col-span-7 bg-white rounded-2xl p-3.5 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-slate-700 uppercase tracking-wider">
                        Area Kiri Fasum (4 Slot: 01 – 04)
                      </span>
                      <span className="text-slate-400">Klik slot untuk update</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {parkingSlots.slice(0, 4).map((slot) => renderParkingSlotCard(slot))}
                    </div>
                  </div>

                  {/* JALUR AKSES TENGAH */}
                  <div className="lg:col-span-1 flex lg:flex-col items-center justify-center py-2 lg:py-0 rounded-2xl bg-slate-200/70 border border-dashed border-slate-300 text-slate-500 text-[10px] font-extrabold tracking-widest uppercase">
                    <span className="lg:-rotate-90 whitespace-nowrap">
                      ⬆️ Jalur Akses Mobil ⬇️
                    </span>
                  </div>

                  {/* SISI KANAN: 2 SLOT PARKIR ATAS-BAWAH (05 - 06) */}
                  <div className="lg:col-span-4 bg-white rounded-2xl p-3.5 border border-slate-200 flex flex-col justify-between space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-slate-700 uppercase tracking-wider">
                        Area Kanan (2 Slot: 05 – 06)
                      </span>
                      <span className="text-slate-400">Atas & Bawah</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 flex-1">
                      {parkingSlots.slice(4, 6).map((slot) => renderParkingSlotCard(slot))}
                    </div>
                  </div>
                </div>

                {/* Keterangan Tarif Kontribusi Netral */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 px-1">
                  <span>
                    💡 <strong>Tarif Kontribusi Parkir Fasum:</strong> 1 Mobil Rp 150.000/bln • 2
                    Mobil Rp 300.000/bln • Weekend Rp 50.000/bln
                  </span>
                  <span className="text-slate-400">Bebas dikunci — Siapa cepat & dinamis</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: POS SECURITY & DAFTAR PAKET DI POS ================= */}
          {activeTab === 'keamanan' && (
            <div className="space-y-4">
              {/* Sub-Navigasi Pos Security */}
              <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSecSubTab('paket')}
                  className={`py-2.5 px-3 rounded-2xl font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    secSubTab === 'paket'
                      ? 'bg-teal-800 text-white shadow'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>📦 Paket di Pos</span>
                  <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black inline-flex items-center justify-center">
                    {waitingPackagesCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSecSubTab('lapor')}
                  className={`py-2.5 px-3 rounded-2xl font-extrabold transition cursor-pointer ${
                    secSubTab === 'lapor'
                      ? 'bg-teal-800 text-white shadow'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  📝 Input Laporan & Paket
                </button>

                <button
                  type="button"
                  onClick={() => setSecSubTab('jadwal')}
                  className={`py-2.5 px-3 rounded-2xl font-extrabold transition cursor-pointer ${
                    secSubTab === 'jadwal'
                      ? 'bg-teal-800 text-white shadow'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  📅 Jadwal Shift
                </button>

                <button
                  type="button"
                  onClick={() => setSecSubTab('riwayat')}
                  className={`py-2.5 px-3 rounded-2xl font-extrabold transition cursor-pointer ${
                    secSubTab === 'riwayat'
                      ? 'bg-teal-800 text-white shadow'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  📋 Log Pos ({securityLogs.length})
                </button>
              </div>

              {/* SUB-TAB 1: DAFTAR PAKET WARGA DI POS SECURITY */}
              {secSubTab === 'paket' && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-base">
                        📦 Daftar Paket & Surat Warga di Pos Security
                      </h4>
                      <p className="text-xs text-slate-500">
                        Pak Eko & Pak Mulyadi dapat langsung mencatat paket tiba beserta foto
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSecForm((prev) => ({
                          ...prev,
                          kategori_laporan: 'PAKET_SURAT',
                          sub_kategori: 'Paket Tiba di Pos (Belum Diambil)'
                        }));
                        setSecSubTab('lapor');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-extrabold shadow-sm cursor-pointer"
                    >
                      + Catat Paket Baru Tiba
                    </button>
                  </div>

                  {packageLogs.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                      <p className="text-2xl mb-1">📭</p>
                      <p className="font-bold text-slate-700">
                        Belum ada paket yang tercatat di Pos Security.
                      </p>
                      <p className="text-[11px] mt-0.5">
                        Klik tombol <strong>+ Catat Paket Baru Tiba</strong> saat kurir menitipkan
                        paket warga.
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
                        const hasPhoto = pkg.url_foto && pkg.url_foto !== '-';

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
                                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                    isDelivered
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-200 text-amber-950'
                                  }`}
                                >
                                  {isDelivered ? '✅ Sudah Diambil / Diantar' : '📦 Di Pos'}
                                </span>
                              </div>
                              <p className="text-slate-700 font-medium">{pkg.detail_catatan}</p>
                              <p className="text-[11px] text-slate-400">
                                Dicatat oleh: {pkg.nama_security} (Shift {pkg.shift}) •{' '}
                                {pkg.tanggal} pukul {pkg.jam} WIB
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                              {hasPhoto && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    triggerLightbox(
                                      pkg.url_foto,
                                      `Foto Paket — ${houseIdentity}`,
                                      `${pkg.detail_catatan} (${pkg.tanggal} ${pkg.jam} WIB)`
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-xl bg-white border border-teal-200 text-teal-800 font-extrabold hover:bg-teal-50 cursor-pointer"
                                >
                                  🖼️ Lihat Foto
                                </button>
                              )}

                              {pkg.teks_wa && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(pkg.teks_wa);
                                    setCopiedWaText(pkg.teks_wa);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                                >
                                  📋 Salin WA
                                </button>
                              )}

                              {!isDelivered && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkPackagePickedUp(pkg)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-sm cursor-pointer"
                                >
                                  ✓ Tandai Sudah Diambil
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

              {/* SUB-TAB 2: FORM INPUT LAPORAN POS, PATROLI, & PAKET TIBA */}
              {secSubTab === 'lapor' && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-4">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">
                      📝 Form Laporan Cepat Pos Security & Paket Warga (Tanpa Login)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Otomatis membuat teks laporan WA siap tempel & menyimpan foto ke Google Drive
                    </p>
                  </div>

                  <form onSubmit={handleSubmitSecurityForm} className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">
                          Petugas Security
                        </label>
                        <select
                          value={secForm.nama_security}
                          onChange={(e) =>
                            setSecForm({ ...secForm, nama_security: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold bg-slate-50"
                        >
                          <option value="Pak Eko">Pak Eko</option>
                          <option value="Pak Mulyadi">Pak Mulyadi</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Shift Jaga</label>
                        <select
                          value={secForm.shift}
                          onChange={(e) => setSecForm({ ...secForm, shift: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold bg-slate-50"
                        >
                          <option value="Pagi">Pagi (08:00 - 20:00)</option>
                          <option value="Malam">Malam (20:00 - 08:00)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">
                          Jenis Laporan Pos
                        </label>
                        <select
                          value={secForm.kategori_laporan}
                          onChange={(e) => {
                            const kat = e.target.value;
                            const defaultSub =
                              kat === 'PAKET_SURAT'
                                ? 'Paket Tiba di Pos (Belum Diambil)'
                                : kat === 'ABSEN_SHIFT'
                                ? 'Serah Terima Shift Jaga'
                                : 'Patroli Keliling 5 Titik Area CMR';
                            setSecForm({
                              ...secForm,
                              kategori_laporan: kat,
                              sub_kategori: defaultSub
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold bg-slate-50"
                        >
                          <option value="PAKET_SURAT">📦 Paket / Surat Warga</option>
                          <option value="PATROLI">🔦 Patroli Lingkungan 5 Titik</option>
                          <option value="ABSEN_SHIFT">👮 Absen Serah Terima Shift</option>
                          <option value="ANOMALI_FASILITAS">⚠️ Kendala Fasilitas / Lampu</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">
                          Detail Sub-Kategori
                        </label>
                        <input
                          type="text"
                          value={secForm.sub_kategori}
                          onChange={(e) =>
                            setSecForm({ ...secForm, sub_kategori: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">
                          Rumah Warga Tujuan (No. XX / Nama Warga)
                        </label>
                        <select
                          value={secForm.house_id}
                          onChange={(e) => setSecForm({ ...secForm, house_id: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold bg-slate-50"
                        >
                          <option value="-">-- Umum / Seluruh Area Cluster --</option>
                          {activeHouses.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.display_label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        Keterangan Tambahan / Situasi Pos
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 1 Paket Shopee kardus disimpan di pos / Patroli 5 titik aman"
                        value={secForm.detail_catatan}
                        onChange={(e) =>
                          setSecForm({ ...secForm, detail_catatan: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      />
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-dashed border-slate-300">
                      <label className="block font-bold text-slate-700 mb-1">
                        📷 Foto Paket / Selfie Absen / Patroli (Tersimpan ke Google Drive)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSecPhotoChange}
                        className="w-full text-xs text-slate-600"
                      />
                      {secForm.file_base64 && (
                        <div className="mt-2 flex items-center gap-3">
                          <img
                            src={secForm.file_base64}
                            alt="Preview Foto Pos"
                            className="w-14 h-14 object-cover rounded-xl border border-slate-200"
                          />
                          <span className="font-bold text-emerald-700">
                            ✓ Foto siap disimpan & bisa dibuka di Lightbox
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingLog}
                      className="w-full py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold shadow-md transition cursor-pointer"
                    >
                      {isSavingLog
                        ? 'Menyimpan Laporan...'
                        : '🚀 Simpan Laporan & Salin Format WhatsApp'}
                    </button>
                  </form>

                  {copiedWaText && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-emerald-900">
                          ✅ Teks Laporan WhatsApp Siap Ditempel ke Grup CMR:
                        </span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard?.writeText(copiedWaText)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold cursor-pointer"
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

              {/* SUB-TAB 3: KALENDER JADWAL ROTASI SECURITY (READ-ONLY — EDIT VIA SPREADSHEET) */}
              {secSubTab === 'jadwal' && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-4">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">
                      📅 Jadwal Rotasi Mingguan Security ({selectedMonth} {selectedYear})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Minggu–Kamis: 2 Shift Normal • Jumat Malam: Libur • Sabtu: Rotasi Shift Pagi
                      & Malam Libur
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                          <th className="py-2.5 px-3 font-extrabold">Tanggal</th>
                          <th className="py-2.5 px-3 font-extrabold">Hari</th>
                          <th className="py-2.5 px-3 font-extrabold">Shift Pagi (08:00-20:00)</th>
                          <th className="py-2.5 px-3 font-extrabold">Shift Malam (20:00-08:00)</th>
                          <th className="py-2.5 px-3 font-extrabold">Keterangan</th>
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
                              <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                                {sch.tanggal}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-800">{sch.hari}</td>
                              <td className="py-2.5 px-3 font-extrabold text-teal-800">
                                {sch.shift_pagi}
                              </td>
                              <td
                                className={`py-2.5 px-3 font-bold ${
                                  isOffNight ? 'text-amber-700' : 'text-indigo-800'
                                }`}
                              >
                                {sch.shift_malam}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">{sch.status_jadwal}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: RIWAYAT LOG POS SECURITY */}
              {secSubTab === 'riwayat' && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-3">
                  <h4 className="font-extrabold text-slate-800 text-base">
                    📋 Riwayat Log Patroli, Parkir, Absen Shift, & Aktivitas Pos
                  </h4>
                  {securityLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      Belum ada riwayat log pos yang tersimpan.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {securityLogs.map((log) => {
                        const hasPhoto =
                          (log.url_foto && log.url_foto !== '-') ||
                          (log.url_bukti && log.url_bukti !== '-');
                        const photoUrl = log.url_foto !== '-' ? log.url_foto : log.url_bukti;

                        return (
                          <div
                            key={log.id}
                            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-teal-900">
                                  {log.nama_security} (Shift {log.shift})
                                </span>
                                <span className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                                  {log.sub_kategori}
                                </span>
                                {log.house_id && log.house_id !== '-' && (
                                  <span className="text-[10px] font-extrabold bg-teal-100 text-teal-900 px-2 py-0.5 rounded-md">
                                    {getHouseLabel(log.house_id)}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-700">{log.detail_catatan}</p>
                              <p className="text-[10px] text-slate-400">
                                {log.tanggal} • {log.jam} WIB • {log.titik_patroli}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {hasPhoto && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    triggerLightbox(
                                      photoUrl,
                                      `Foto Log Security — ${log.sub_kategori}`,
                                      `${log.nama_security} (${log.tanggal} ${log.jam} WIB)`
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-xl bg-white border border-teal-200 text-teal-800 font-extrabold cursor-pointer"
                                >
                                  🖼️ Lihat Foto
                                </button>
                              )}
                              {log.teks_wa && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(log.teks_wa);
                                    setCopiedWaText(log.teks_wa);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold cursor-pointer"
                                >
                                  📋 Salin WA
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

              {/* ===================================================================== */}
              {/* FITUR OPSIONAL DENGAN SAKLAR KODE (DEFAULT: FALSE / DISEMBUNYIKAN)   */}
              {/* ===================================================================== */}
              {SHOW_SOS_BUTTON && (
                <div className="bg-gradient-to-br from-rose-600 to-red-800 text-white rounded-3xl p-5 shadow-md">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                        Fitur Darurat Warga CMR
                      </span>
                      <h4 className="font-black text-lg mt-1">
                        🚨 SOS Panic Button Pos Security
                      </h4>
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
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70">
                  <h4 className="font-extrabold text-slate-800 text-base mb-3">
                    📹 Pantauan 4 Titik CCTV Lingkungan CMR
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
            </div>
          )}
        </section>
      </main>

      {/* MODAL CHECK-IN / CHECK-OUT SLOT PARKIR OLEH SECURITY */}
      {activeParkingModalSlot && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setActiveParkingModalSlot(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-gradient-to-r from-teal-900 to-sky-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  Kontrol Parkir Security (Tanpa Login)
                </span>
                <h3 className="text-base font-extrabold mt-1">
                  🅿️ {activeParkingModalSlot.nama_slot || activeParkingModalSlot.slot_id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveParkingModalSlot(null)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveParkingSlot} className="p-5 space-y-3.5 text-xs">
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    <option value="Terisi">🟢 Terisi (Parkir Warga)</option>
                    <option value="Weekend">🟡 Weekend (Akhir Pekan)</option>
                    <option value="Tamu">🔵 Tamu / Sementara</option>
                    <option value="Kosong">⚪ Kosong (Check-Out)</option>
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
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
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
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
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
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
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
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
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
                    className="rounded text-teal-700"
                  />
                  Catat otomatis laporan kondisi parkir ini ke Log Pos Security
                </label>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSavingSlot}
                  className="flex-1 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold shadow transition cursor-pointer"
                >
                  {isSavingSlot ? 'Menyimpan...' : '💾 Simpan Check-In / Kondisi'}
                </button>

                {parkingSlots.find((s) => s.slot_id === activeParkingModalSlot.slot_id)
                  ?.status_slot !== 'Kosong' && (
                  <button
                    type="button"
                    disabled={isSavingSlot}
                    onClick={handleQuickCheckoutSlot}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow transition cursor-pointer"
                  >
                    🚗 Check-Out
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
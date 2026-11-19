import React, { useState, useRef, useMemo } from 'react';
import { compressImageToBase64 } from '../services/apiService';

// ============================================================================
// SAKLAR FITUR V6.0 (FEATURE FLAGS)
// Ubah nilai false menjadi true di bawah ini jika sewaktu-waktu ingin
// menampilkan kembali Tombol Darurat SOS atau 4 Panel Kamera CCTV di layar.
// ============================================================================
const SHOW_SOS_BUTTON = false;
const SHOW_CCTV_PANEL = false;

const MONTH_LIST = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Data Fallback Rekap Tutup Buku 5 Bulan (Urut Terbaru Oktober -> Juni)
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
  },
  {
    id: 'CLS-2026-08',
    periode_bulan: 'Agustus',
    periode_tahun: 2026,
    saldo_awal: 2439200,
    uang_masuk: 4350000,
    total_pengeluaran: 4635000,
    pengeluaran_proyek: 600000,
    sisa_saldo: 2154200,
    status_tutup_buku: 'CLOSED'
  },
  {
    id: 'CLS-2026-07',
    periode_bulan: 'Juli',
    periode_tahun: 2026,
    saldo_awal: 2219200,
    uang_masuk: 4200000,
    total_pengeluaran: 3980000,
    pengeluaran_proyek: 0,
    sisa_saldo: 2439200,
    status_tutup_buku: 'CLOSED'
  },
  {
    id: 'CLS-2026-06',
    periode_bulan: 'Juni',
    periode_tahun: 2026,
    saldo_awal: 1989200,
    uang_masuk: 4200000,
    total_pengeluaran: 3970000,
    pengeluaran_proyek: 0,
    sisa_saldo: 2219200,
    status_tutup_buku: 'CLOSED'
  }
];

// Data Fallback Buku Kas (Urut Terbaru di Atas)
const FALLBACK_LEDGER = [
  { id: 'TX-202610-01', tanggal: '2026-10-28', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji Security', nominal: 1650000, keterangan: 'Gaji Security Pak Mulyadi (Full)', house_id: '-', url_bukti: '-', is_proyek: false, nama_proyek: '' },
  { id: 'TX-202610-02', tanggal: '2026-10-28', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji Security', nominal: 1300000, keterangan: 'Pelunasan Gaji Pak Eko (Dipotong Kasbon Rp 350.000)', house_id: '-', url_bukti: '-', is_proyek: false, nama_proyek: '' },
  { id: 'TX-202610-03', tanggal: '2026-10-15', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji Security', nominal: 350000, keterangan: 'Kasbon Gaji Pak Eko', house_id: '-', url_bukti: '-', is_proyek: false, nama_proyek: '' },
  { id: 'TX-202610-04', tanggal: '2026-10-20', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Uang Sampah', nominal: 600000, keterangan: 'Retribusi Pengangkutan Sampah Lingkungan (Bang Adi)', house_id: '-', url_bukti: '-', is_proyek: false, nama_proyek: '' },
  { id: 'TX-202610-05', tanggal: '2026-10-18', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik & Air Pos', nominal: 225000, keterangan: 'Token Listrik Pos Security & Isi Ulang 4 Galon Air Pos', house_id: '-', url_bukti: '-', is_proyek: false, nama_proyek: '' },
  { id: 'TX-202610-06', tanggal: '2026-10-14', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', nominal: 350000, keterangan: 'Penggantian Lampu Sorot Gerbang & Perbaikan MCB Pos', house_id: '-', url_bukti: '-', is_proyek: true, nama_proyek: 'Perbaikan Lampu Sorot & MCB Pos' },
  { id: 'TX-202610-07', tanggal: '2026-10-12', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi Pos', nominal: 350000, keterangan: 'Kopi, Gula, Teh & Perlengkapan Pos Jaga Security', house_id: '-', url_bukti: '-', is_proyek: false, nama_proyek: '' },
  { id: 'TX-202610-08', tanggal: '2026-10-10', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga (IPL)', nominal: 4000000, keterangan: 'Iuran IPL Warga 20 Unit Rumah Aktif @ Rp 200.000', house_id: '-', url_bukti: '-', is_proyek: false, nama_proyek: '' },
  { id: 'TX-202610-09', tanggal: '2026-10-10', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'IN', kategori: 'Parkir Fasum', nominal: 150000, keterangan: 'Kontribusi Parkir Fasum Bulanan', house_id: '-', url_bukti: '-', is_proyek: false, nama_proyek: '' },
  { id: 'TX-202609-01', tanggal: '2026-09-28', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji Security', nominal: 3200000, keterangan: 'Gaji 2 Personel Security (Pak Eko & Pak Mulyadi)', house_id: '-', url_bukti: '-', is_proyek: false, nama_proyek: '' },
  { id: 'TX-202609-02', tanggal: '2026-09-20', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Uang Sampah', nominal: 635000, keterangan: 'Retribusi Sampah & Kebersihan Lingkungan', house_id: '-', url_bukti: '-', is_proyek: false, nama_proyek: '' },
  { id: 'TX-202609-03', tanggal: '2026-09-14', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Proyek Cluster', nominal: 450000, keterangan: 'Jasa Tukang Las & Perbaikan Roda Pagar Utama', house_id: '-', url_bukti: '-', is_proyek: true, nama_proyek: 'Perbaikan Las Roda Pagar Utama' },
  { id: 'TX-202609-04', tanggal: '2026-09-10', periode_bulan: 'September', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga (IPL)', nominal: 4200000, keterangan: 'Iuran IPL Warga 21 Unit Aktif @ Rp 200.000', house_id: '-', url_bukti: '-', is_proyek: false, nama_proyek: '' }
];

// Data Fallback 6 Slot Parkir Fasum Dinamis (Netral & Dapat Diubah Kapan Saja)
const FALLBACK_PARKING_SLOTS = [
  { slot_id: 'SLOT-01', nama_slot: 'Slot Parkir 01 (Area Fasum Depan)', house_id: 'H-06', nomor_polisi: 'B 106 CMR', jenis_paket: 'Parkir Bulanan (Rp 150.000)', status_slot: 'Terisi', catatan: '1 Unit Mobil' },
  { slot_id: 'SLOT-02', nama_slot: 'Slot Parkir 02 (Area Fasum Depan)', house_id: 'H-16', nomor_polisi: 'B 116 CMR', jenis_paket: 'Parkir 2 Mobil (Rp 300.000)', status_slot: 'Terisi', catatan: 'Mobil ke-1' },
  { slot_id: 'SLOT-03', nama_slot: 'Slot Parkir 03 (Area Fasum Tengah)', house_id: 'H-16', nomor_polisi: 'B 216 CMR', jenis_paket: 'Parkir 2 Mobil (Rp 300.000)', status_slot: 'Terisi', catatan: 'Mobil ke-2' },
  { slot_id: 'SLOT-04', nama_slot: 'Slot Parkir 04 (Area Fasum Tengah)', house_id: 'H-19', nomor_polisi: 'B 119 CMR', jenis_paket: 'Parkir Weekend (Rp 50.000)', status_slot: 'Weekend', catatan: 'Parkir Akhir Pekan' },
  { slot_id: 'SLOT-05', nama_slot: 'Slot Parkir 05 (Area Lapangan)', house_id: '-', nomor_polisi: '-', jenis_paket: 'Tersedia', status_slot: 'Kosong', catatan: 'Slot Kosong / Cadangan Tamu' },
  { slot_id: 'SLOT-06', nama_slot: 'Slot Parkir 06 (Area Lapangan)', house_id: '-', nomor_polisi: '-', jenis_paket: 'Tersedia', status_slot: 'Kosong', catatan: 'Slot Kosong / Cadangan Tamu' }
];

// Data Fallback Log Security & Paket di Pos
const FALLBACK_SECURITY_LOGS = [
  {
    id: 'SEC-20261118-01',
    tanggal: '2026-11-18',
    jam: '14:20',
    nama_security: 'Pak Mulyadi',
    shift: 'Pagi',
    kategori_laporan: 'PAKET_SURAT',
    sub_kategori: 'Paket Tiba di Pos (Belum Diambil)',
    house_id: 'H-06',
    nama_warga_tujuan: 'No. 06 / Pak Andy',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: '1 Paket ekspedisi kardus sedang disimpan di meja Pos Security.',
    url_foto: '-',
    teks_wa: '*INFO PAKET TIBA DI POS SECURITY CMR*\nAssalamualaikum, selamat siang. Izin menginformasikan terdapat *1 Paket* tiba di Pos Security untuk *No. 06 / Pak Andy*.\n• Status Paket: *Paket Tiba di Pos (Belum Diambil)*\n• Petugas Jaga: *Pak Mulyadi*\n*Terima kasih* 🙏'
  },
  {
    id: 'SEC-20261118-02',
    tanggal: '2026-11-18',
    jam: '10:15',
    nama_security: 'Pak Mulyadi',
    shift: 'Pagi',
    kategori_laporan: 'PAKET_SURAT',
    sub_kategori: 'Paket Sudah Diambil / Diantar ke Rumah',
    house_id: 'H-13',
    nama_warga_tujuan: 'No. 13 / Pak Hery',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Paket sudah diantar langsung ke rumah No. 13 / Pak Hery.',
    url_foto: '-',
    teks_wa: '*INFO PAKET WARGA CMR*\nAssalamualaikum, selamat pagi. Paket untuk *No. 13 / Pak Hery* sudah diantar langsung ke rumah warga oleh petugas jaga (*Pak Mulyadi*). *Terima kasih* 🙏'
  },
  {
    id: 'SEC-20261118-03',
    tanggal: '2026-11-18',
    jam: '08:00',
    nama_security: 'Pak Mulyadi',
    shift: 'Pagi',
    kategori_laporan: 'ABSEN_SHIFT',
    sub_kategori: 'Serah Terima Malam ke Pagi (08:00)',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Serah terima tugas jaga pagi dari Pak Eko (Malam) kepada Pak Mulyadi (Pagi), situasi aman kondusif.',
    url_foto: '-',
    teks_wa: '*ABSEN PERGANTIAN SHIFT SECURITY CMR*\nAssalamualaikum, selamat pagi. Izin melaporkan serah terima tugas jaga Cluster Mutiara Residence:\n• Petugas Shift Malam (Balik Kanan): *Pak Eko*\n• Petugas Shift Pagi (Masuk Jaga): *Pak Mulyadi*\n• Situasi: Aman kondusif tanpa taruna.\n*Terima kasih* 🙏🫡'
  },
  {
    id: 'SEC-20261118-04',
    tanggal: '2026-11-18',
    jam: '04:45',
    nama_security: 'Pak Eko',
    shift: 'Malam',
    kategori_laporan: 'PATROLI',
    sub_kategori: 'Patroli Subuh 5 Titik (04:30 - 05:00)',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: '5 Titik (Pos, Gerbang, Gang Depan, Gang Belakang, Lapangan)',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Utama & Kecil Tertutup Rapat',
    detail_catatan: 'Patroli subuh pengecekan 5 titik area cluster aman terkendali, lampu jalan dimatikan bertahap.',
    url_foto: '-',
    teks_wa: '*LAPORAN PATROLI SECURITY CMR*\nAssalamualaikum, selamat pagi. Menjelang subuh izin lapor petugas jaga (*Pak Eko*) patroli keliling 5 titik area CMR. Situasi aman kondusif tanpa taruna, berikut 815 cuaca cerah. *Terima kasih* 🙏🫡'
  }
];

/**
 * Generator Kalender Rotasi Mingguan Security (Pak Eko & Pak Mulyadi)
 * Minggu-Kamis: 2 Shift Normal | Jumat: Malam Libur | Sabtu: Rotasi Pagi & Malam Libur
 */
function generateSecuritySchedules(monthName = 'November', year = 2026) {
  const monthIdx = Math.max(0, MONTH_LIST.indexOf(monthName));
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const anchorSunday = new Date(2026, 10, 1); // Minggu 1 Nov 2026
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

  // State Tab Navigasi (Mendukung kontrol dari App.jsx maupun internal)
  const [internalTab, setInternalTab] = useState('beranda');
  const activeTab = externalActiveTab || internalTab;
  const setActiveTab = externalSetActiveTab || setInternalTab;

  const [showBalance, setShowBalance] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [secretTapCount, setSecretTapCount] = useState(0);

  // State Buka/Tutup Rincian Laporan Bulanan di Beranda
  const [expandedMonth, setExpandedMonth] = useState('Oktober');

  // State Filter Tab 22 Rumah
  const [searchRumah, setSearchRumah] = useState('');
  const [filterStatusIpl, setFilterStatusIpl] = useState('ALL');

  // State Filter Tab Buku Kas
  const [filterBulanKas, setFilterBulanKas] = useState('Semua');
  const [filterKategoriKas, setFilterKategoriKas] = useState('ALL');

  // State Denah 6 Slot Parkir Dinamis
  const [localParkingSlots, setLocalParkingSlots] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [isSavingSlot, setIsSavingSlot] = useState(false);

  // State Pos Security & Daftar Paket di Pos
  const [localSecurityLogs, setLocalSecurityLogs] = useState([]);
  const [secSubTab, setSecSubTab] = useState('paket'); // 'paket' | 'lapor' | 'jadwal' | 'riwayat'
  const [copiedWaText, setCopiedWaText] = useState('');
  const [isSavingLog, setIsSavingLog] = useState(false);

  // Form Laporan Cepat Security & Paket Tiba di Pos
  const [secForm, setSecForm] = useState({
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'PAKET_SURAT',
    sub_kategori: 'Paket Tiba di Pos (Belum Diambil)',
    house_id: 'H-06',
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

  // Helper Standarisasi "No. XX / Nama Warga"
  const getHouseLabel = (houseOrId) => {
    if (typeof formatHouseIdentity === 'function') {
      return formatHouseIdentity(houseOrId);
    }
    if (!houseOrId || houseOrId === '-') return '-';
    if (typeof houseOrId === 'object') {
      const no = String(houseOrId.nomor_rumah || houseOrId.id || '')
        .replace(/^H-/i, '')
        .replace(/^No\.?\s*/i, '')
        .padStart(2, '0');
      const nama = houseOrId.nama_kepala_keluarga || houseOrId.nama_warga || 'Warga';
      return `No. ${no} / ${nama}`;
    }
    return String(houseOrId);
  };

  // Daftar 22 Rumah & 21 Rumah Aktif
  const houses = useMemo(() => {
    const raw = Array.isArray(sourceData.houses) && sourceData.houses.length > 0
      ? sourceData.houses
      : [];
    return raw.map((h) => ({
      ...h,
      display_label: getHouseLabel(h)
    }));
  }, [sourceData.houses]);

  const activeHouses = useMemo(
    () =>
      houses.filter(
        (h) => String(h.status_huni || 'Aktif').toLowerCase() !== 'tidak aktif' && h.id !== 'H-04'
      ),
    [houses]
  );

  // Buku Kas & Rekap Bulanan
  const cashLedger = useMemo(() => {
    return Array.isArray(sourceData.cash_ledger) && sourceData.cash_ledger.length > 0
      ? sourceData.cash_ledger
      : FALLBACK_LEDGER;
  }, [sourceData.cash_ledger]);

  const monthlyClosings = useMemo(() => {
    return Array.isArray(sourceData.monthly_closings) && sourceData.monthly_closings.length > 0
      ? sourceData.monthly_closings
      : FALLBACK_CLOSINGS;
  }, [sourceData.monthly_closings]);

  // Denah 6 Slot Parkir
  const parkingSlots = useMemo(() => {
    if (localParkingSlots) return localParkingSlots;
    if (Array.isArray(sourceData.parking_slots) && sourceData.parking_slots.length > 0) {
      return sourceData.parking_slots;
    }
    return FALLBACK_PARKING_SLOTS;
  }, [localParkingSlots, sourceData.parking_slots]);

  // Log Security & Paket di Pos (Gabungan Data Backend + Input Baru)
  const securityLogs = useMemo(() => {
    const base =
      Array.isArray(sourceData.security_logs) && sourceData.security_logs.length > 0
        ? sourceData.security_logs
        : FALLBACK_SECURITY_LOGS;
    return [...localSecurityLogs, ...base];
  }, [localSecurityLogs, sourceData.security_logs]);

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

  // Pengolahan Status IPL 22 Rumah pada Periode Terpilih
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

      // Cek juga di Buku Kas jika ada pembayaran IPL untuk rumah tsb pada bulan terpilih
      const ledgerIpl = cashLedger.find(
        (tx) =>
          tx.tipe === 'IN' &&
          String(tx.house_id).toUpperCase() === String(h.id).toUpperCase() &&
          tx.periode_bulan === selectedMonth
      );

      const statusBayar = isNonAktif
        ? 'Tidak Aktif'
        : matchedIpl?.status_bayar || (ledgerIpl ? 'Lunas' : 'Belum Bayar');

      const nominalBayar = isNonAktif
        ? 0
        : Number(matchedIpl?.nominal_bayar || matchedIpl?.nominal || ledgerIpl?.nominal || 200000);

      const urlBukti = matchedIpl?.url_bukti || ledgerIpl?.url_bukti || '-';

      return {
        ...h,
        display_label: getHouseLabel(h),
        is_non_aktif: isNonAktif,
        status_bayar: statusBayar,
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

  // Pembentuk Rincian Kategori & Proyek per Bulan
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
      const isProyek = Boolean(tx.is_proyek) && String(tx.is_proyek).toUpperCase() !== 'FALSE';

      if (tx.tipe === 'IN') {
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
        ? Boolean(item.is_proyek) && String(item.is_proyek).toUpperCase() !== 'FALSE'
        : item.kategori === filterKategoriKas);
    return matchBulan && matchKat;
  });

  const totalMasukFilter = filteredLedger
    .filter((i) => i.tipe === 'IN')
    .reduce((acc, cur) => acc + Number(cur.nominal || 0), 0);
  const totalKeluarFilter = filteredLedger
    .filter((i) => i.tipe === 'OUT')
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

  // Generator Teks WA Otomatis untuk Laporan Security & Paket Pos
  const buildSecurityWaMessage = (formObj) => {
    const houseLabel =
      formObj.house_id && formObj.house_id !== '-' ? getHouseLabel(formObj.house_id) : '-';
    const jamNow = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (formObj.kategori_laporan === 'PAKET_SURAT') {
      return `*INFO PAKET WARGA DI POS SECURITY CMR*\nAssalamualaikum, izin menginformasikan laporan paket/surat warga pukul ${jamNow} WIB:\n• Tujuan Rumah: *${houseLabel}*\n• Status Paket: *${formObj.sub_kategori}*\n• Petugas Pos: *${formObj.nama_security} (Shift ${formObj.shift})*\n• Catatan: ${formObj.detail_catatan || 'Disimpan dengan aman di meja Pos Security.'}\n*Terima kasih* 🙏`;
    }

    if (formObj.kategori_laporan === 'ABSEN_SHIFT') {
      return `*ABSEN PERGANTIAN SHIFT SECURITY CMR*\nAssalamualaikum, izin melaporkan giat pos jaga pukul ${jamNow} WIB:\n• Petugas: *${formObj.nama_security} (Shift ${formObj.shift})*\n• Giat: *${formObj.sub_kategori}*\n• Status Gerbang: ${formObj.status_gerbang}\n• Situasi & 815: ${formObj.detail_catatan || 'Situasi aman kondusif tanpa taruna'}, cuaca ${formObj.cuaca_815}.\n*Terima kasih* 🙏🫡`;
    }

    return `*LAPORAN GIAT & PATROLI SECURITY CMR*\nAssalamualaikum, izin lapor petugas jaga (*${formObj.nama_security} - Shift ${formObj.shift}*) pukul ${jamNow} WIB:\n• Kategori: *${formObj.sub_kategori}*\n• Area / Titik: ${formObj.titik_patroli}\n• Situasi: ${formObj.detail_catatan || 'Aman terkendali tanpa taruna.'}\n• Cuaca 815: ${formObj.cuaca_815}\n*Terima kasih* 🙏🫡`;
  };

  // Upload Foto Bukti pada Form Pos Security
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

  // Simpan Laporan Pos Security / Paket Baru
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
        jam: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
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

      setLocalSecurityLogs((prev) => [payload, ...prev]);
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

  // Tandai Paket di Pos Sudah Diambil oleh Warga
  const handleMarkPackagePickedUp = async (pkgItem) => {
    const updatedItem = {
      ...pkgItem,
      sub_kategori: 'Paket Sudah Diambil / Diantar ke Rumah',
      detail_catatan: `${pkgItem.detail_catatan} (Sudah diterima warga)`
    };

    setLocalSecurityLogs((prev) => {
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
        console.warn('Update status paket tersimpan secara lokal:', err.message);
      }
    }
  };

  // Simpan Perubahan Denah 6 Slot Parkir Fasum
  const handleSaveParkingSlot = async (e) => {
    e.preventDefault();
    if (!editingSlot) return;
    setIsSavingSlot(true);
    try {
      const updatedSlots = parkingSlots.map((s) =>
        s.slot_id === editingSlot.slot_id ? editingSlot : s
      );
      setLocalParkingSlots(updatedSlots);

      if (typeof onUpdateParkingSlot === 'function') {
        await onUpdateParkingSlot(editingSlot);
      }
      setEditingSlot(null);
    } finally {
      setIsSavingSlot(false);
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
    { id: 'parkir', label: 'Parkir', icon: '🅿️' },
    { id: 'keamanan', label: 'Pos Security', icon: '🛡️', badge: waitingPackagesCount }
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-24 md:pb-12">
      {/* HEADER UTAMA + STATUS ONLINE REAL-TIME & TOMBOL REFRESH */}
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
                  ? 'Online • Real Cash V6.0'
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

        {/* Bar Navigasi Utama */}
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
                  V6.0 • Transparan
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
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
              className="hidden sm:flex items-center gap-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow transition"
            >
              📲 Bayar QRIS
            </button>
            <button
              type="button"
              onClick={triggerAdminOpen}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold transition"
            >
              {isAdminLoggedIn ? '⚙️ Panel Pengurus' : '🔒 Pengurus'}
            </button>
          </div>
        </div>
      </header>

      {/* KONTEN UTAMA 2 KOLOM (KIRI: SALDO KAS NYATA & PINTASAN, KANAN: 5 TAB MENU) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* KOLOM KIRI: KARTU SALDO KAS NYATA (REAL CASH) & PINTASAN */}
        <div className="lg:col-span-4 space-y-4">
          {/* Kartu Saldo Kas Aktif Cluster (100% Real Cash Tanpa Embel-Embel Titipan) */}
          <div className="bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-teal-200 font-bold">
                Saldo Uang Kas Nyata (Real Cash)
              </span>
              <button
                type="button"
                onClick={() => setShowBalance(!showBalance)}
                className="text-xs text-teal-300 hover:text-white underline font-semibold"
              >
                {showBalance ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>

            <div className="text-3xl font-black mt-1.5 tracking-tight">
              {showBalance ? formatRp(sourceData.current_balance || 1394200) : 'Rp ••••••••'}
            </div>

            {/* Pilihan Cepat Periode Buku */}
            <div className="mt-3 flex items-center justify-between gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              <span className="text-teal-200 font-semibold">Periode Buku IPL:</span>
              <select
                value={selectedMonth}
                onChange={(e) =>
                  onChangePeriod && onChangePeriod(e.target.value, selectedYear)
                }
                className="bg-transparent text-emerald-300 font-extrabold focus:outline-none cursor-pointer"
              >
                {MONTH_LIST.map((m) => (
                  <option key={m} value={m} className="text-slate-900">
                    {m} {selectedYear}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 rounded-full text-emerald-200 font-bold">
              <span>●</span>
              <span>
                IPL {selectedMonth}: {totalLunasCount}/{activeHouses.length || 21} Rumah Aktif Lunas
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-white/15 text-xs">
              <div>
                <p className="text-teal-200 text-[11px]">Tarif Dasar IPL</p>
                <p className="font-extrabold text-emerald-300 mt-0.5">
                  {formatRp(sourceData.default_ipl_amount || 200000)} / bln
                </p>
              </div>
              <div>
                <p className="text-teal-200 text-[11px]">Unit Hunian CMR</p>
                <p className="font-extrabold text-white mt-0.5">
                  21 Aktif • 1 Non-Aktif
                </p>
              </div>
            </div>
          </div>

          {/* Notifikasi Cepat Paket Warga di Pos Security */}
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
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-xs text-slate-800">
                    Daftar Paket di Pos Security
                  </h3>
                  <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {waitingPackagesCount} Menunggu
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cek kiriman paket untuk No. XX / Nama Warga
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-teal-800 shrink-0">Lihat →</span>
          </div>

          {/* Pintasan Cepat 5 Menu */}
          <div className="bg-white rounded-3xl shadow-sm p-3.5 grid grid-cols-5 gap-1.5 text-center border border-slate-200/70">
            <button
              type="button"
              onClick={() => onOpenQris && onOpenQris(activeHouses[0] || null)}
              className="flex flex-col items-center group"
            >
              <div className="w-11 h-11 rounded-2xl bg-teal-700 text-white flex items-center justify-center text-lg shadow group-hover:scale-105 transition">
                📲
              </div>
              <span className="text-[10px] font-extrabold text-teal-900 mt-1">QRIS IPL</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rumah')}
              className="flex flex-col items-center group"
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg border transition ${
                  activeTab === 'rumah'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                }`}
              >
                🏘️
              </div>
              <span className="text-[10px] font-bold text-slate-700 mt-1">22 Rumah</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mutasi')}
              className="flex flex-col items-center group"
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg border transition ${
                  activeTab === 'mutasi'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}
              >
                📑
              </div>
              <span className="text-[10px] font-bold text-slate-700 mt-1">Buku Kas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('parkir')}
              className="flex flex-col items-center group"
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg border transition ${
                  activeTab === 'parkir'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-sky-50 text-sky-700 border-sky-100'
                }`}
              >
                🅿️
              </div>
              <span className="text-[10px] font-bold text-slate-700 mt-1">6 Parkir</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('keamanan')}
              className="flex flex-col items-center group"
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg border transition ${
                  activeTab === 'keamanan'
                    ? 'bg-teal-800 text-white border-teal-800'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                🛡️
              </div>
              <span className="text-[10px] font-bold text-slate-700 mt-1">Security</span>
            </button>
          </div>

          {/* Banner CTA Bayar QRIS & Parkir */}
          <div
            onClick={() => onOpenQris && onOpenQris(activeHouses[0] || null)}
            className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-4 flex items-center justify-between cursor-pointer shadow-sm hover:shadow-md transition"
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-bold">
                QRIS Resmi CMR • Bebas Admin
              </span>
              <h3 className="font-extrabold text-sm mt-1">
                Bayar IPL & Paket Parkir ({selectedMonth})
              </h3>
              <p className="text-xs text-emerald-100">
                Pilih No. XX / Nama Warga & unggah bukti transfer
              </p>
            </div>
            <div className="bg-white text-teal-900 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow shrink-0">
              Buka QRIS →
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: AREA KONTEN 5 TAB UTAMA */}
        <div className="lg:col-span-8 space-y-5">
          {/* ================= TAB 1: BERANDA (LAPORAN KAS BULANAN & PAKET TERBARU DI POS) ================= */}
          {activeTab === 'beranda' && (
            <div className="space-y-4">
              {/* Ringkasan Paket yang Sedang Menunggu di Pos Security */}
              {waitingPackagesCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="font-extrabold text-amber-950 text-xs sm:text-sm flex items-center gap-1.5">
                      <span>📦</span>
                      <span>
                        Paket Warga Menunggu Diambil di Pos Security ({waitingPackagesCount})
                      </span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('keamanan');
                        setSecSubTab('paket');
                      }}
                      className="text-xs font-extrabold text-teal-800 hover:underline"
                    >
                      Kelola Semua Paket →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {packageLogs
                      .filter(
                        (p) => !String(p.sub_kategori || '').toLowerCase().includes('sudah')
                      )
                      .slice(0, 4)
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
                              className="px-2.5 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 font-bold text-[11px] shrink-0"
                            >
                              🖼️ Foto
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Laporan & Rincian Kas Bulanan (Urut Terbaru di Atas) */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">
                      Laporan & Rincian Buku Kas Bulanan (Uang Kas Nyata)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Urut dari periode terbaru • Klik kartu bulan untuk melihat rincian per
                      kategori & proyek
                    </p>
                  </div>
                  <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full font-bold">
                    Terbaru di Atas ↓
                  </span>
                </div>

                <div className="space-y-3">
                  {monthlyClosings.map((item) => {
                    const maxVal = 5200000;
                    const inPct = Math.min(
                      100,
                      Math.round((Number(item.uang_masuk || 0) / maxVal) * 100)
                    );
                    const outPct = Math.min(
                      100,
                      Math.round((Number(item.total_pengeluaran || 0) / maxVal) * 100)
                    );
                    const isExpanded = expandedMonth === item.periode_bulan;
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
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-sm">
                                {item.periode_bulan} {item.periode_tahun}
                              </span>
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
                                  className="h-full bg-emerald-500 rounded-full"
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
                                  className="h-full bg-rose-500 rounded-full"
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

                            {Object.keys(breakdown.pengeluaranMap).length > 0 && (
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
                                              className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200"
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
                                                  className="text-teal-700 font-extrabold hover:underline"
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
                    Format Identitas Seragam No. XX / Nama Warga • 21 Unit Aktif & 1 Non-Aktif (No.
                    04 BPR)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Cari No. XX / Nama Warga..."
                    value={searchRumah}
                    onChange={(e) => setSearchRumah(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 flex-1"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
                              className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-extrabold transition"
                            >
                              🖼️ Bukti
                            </button>
                          )}

                          {!isNonAktif && !isLunas && (
                            <button
                              type="button"
                              onClick={() => onOpenQris && onOpenQris(h)}
                              className="bg-teal-800 hover:bg-teal-900 text-white font-bold px-2.5 py-1 rounded-lg shadow-sm transition"
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

          {/* ================= TAB 3: BUKU KAS (MUTASI KAS NYATA + TOMBOL LIGHTBOX BUKTI) ================= */}
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
                    <option value="Iuran Warga (IPL)">Iuran Warga (IPL)</option>
                    <option value="Parkir Fasum">Parkir Fasum</option>
                    <option value="Gaji Security">Gaji Security</option>
                    <option value="Uang Sampah">Uang Sampah</option>
                    <option value="Perawatan Pos">Perawatan Pos</option>
                    <option value="Listrik & Air Pos">Listrik & Air Pos</option>
                    <option value="Konsumsi Pos">Konsumsi Pos</option>
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
                {filteredLedger.map((tx) => {
                  const isProyek =
                    Boolean(tx.is_proyek) && String(tx.is_proyek).toUpperCase() !== 'FALSE';
                  const hasProof = tx.url_bukti && tx.url_bukti !== '-';
                  const houseText =
                    tx.house_id && tx.house_id !== '-' ? getHouseLabel(tx.house_id) : '';

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl border border-slate-100 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                            tx.tipe === 'IN'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {tx.tipe === 'IN' ? '↓' : '↑'}
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
                          <div className="flex items-center gap-3 mt-1">
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
                                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-lg transition"
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
                            tx.tipe === 'IN' ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {tx.tipe === 'IN' ? '+' : '-'} {formatRp(tx.nominal)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 4: DENAH 6 SLOT PARKIR FASUM DINAMIS (NETRAL) ================= */}
          {activeTab === 'parkir' && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">
                    🅿️ Denah 6 Slot Parkir Fasum Cluster Mutiara Residence
                  </h4>
                  <p className="text-xs text-slate-500">
                    Tarif Netral: 1 Mobil Rp 150.000/bln • 2 Mobil Rp 300.000/bln • Weekend Rp
                    50.000/bln
                  </p>
                </div>
                <span className="text-xs bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1 rounded-full font-bold">
                  6 Slot Fasum Dinamis
                </span>
              </div>

              {/* Grid 6 Slot Parkir */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {parkingSlots.map((slot) => {
                  const isOccupied = slot.status_slot === 'Terisi';
                  const isWeekend = slot.status_slot === 'Weekend';
                  const assignedHouseLabel =
                    slot.house_id && slot.house_id !== '-'
                      ? getHouseLabel(slot.house_id)
                      : 'Belum Ada Penghuni';

                  return (
                    <div
                      key={slot.slot_id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between transition ${
                        isOccupied
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : isWeekend
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-slate-800">
                            {slot.nama_slot}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isOccupied
                                ? 'bg-emerald-100 text-emerald-800'
                                : isWeekend
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {slot.status_slot}
                          </span>
                        </div>

                        <p className="font-extrabold text-teal-900 text-xs sm:text-sm mt-2">
                          {assignedHouseLabel}
                        </p>
                        <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                          Paket: {slot.jenis_paket || '-'}
                        </p>
                        {slot.nomor_polisi && slot.nomor_polisi !== '-' && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Nopol / Ket: {slot.nomor_polisi} ({slot.catatan || '-'})
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {slot.slot_id}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingSlot({ ...slot })}
                          className="text-[11px] font-extrabold text-teal-800 hover:underline"
                        >
                          ✏️ Ubah Slot
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Form Edit Slot Parkir Dinamis (Muncul Saat Klik "Ubah Slot") */}
              {editingSlot && (
                <form
                  onSubmit={handleSaveParkingSlot}
                  className="p-4 rounded-2xl bg-slate-50 border border-teal-200 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-extrabold text-teal-950">
                      ✏️ Atur Pengguna {editingSlot.nama_slot}
                    </h5>
                    <button
                      type="button"
                      onClick={() => setEditingSlot(null)}
                      className="text-slate-500 font-bold"
                    >
                      ✕ Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        No. Rumah / Nama Warga
                      </label>
                      <select
                        value={editingSlot.house_id}
                        onChange={(e) =>
                          setEditingSlot({ ...editingSlot, house_id: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                      >
                        <option value="-">-- Kosong / Tidak Terisi --</option>
                        {activeHouses.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.display_label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Status Slot</label>
                      <select
                        value={editingSlot.status_slot}
                        onChange={(e) =>
                          setEditingSlot({ ...editingSlot, status_slot: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                      >
                        <option value="Terisi">Terisi (Bulanan)</option>
                        <option value="Weekend">Weekend (Akhir Pekan)</option>
                        <option value="Kosong">Kosong / Tersedia</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        Paket Kontribusi Parkir
                      </label>
                      <select
                        value={editingSlot.jenis_paket}
                        onChange={(e) =>
                          setEditingSlot({ ...editingSlot, jenis_paket: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
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
                        <option value="Tersedia">Tersedia / Kosong</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        Nomor Polisi / Identitas Kendaraan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: B 1234 XYZ"
                        value={editingSlot.nomor_polisi}
                        onChange={(e) =>
                          setEditingSlot({ ...editingSlot, nomor_polisi: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Catatan Slot</label>
                      <input
                        type="text"
                        placeholder="Contoh: Mobil ke-1 / Parkir Malam"
                        value={editingSlot.catatan}
                        onChange={(e) =>
                          setEditingSlot({ ...editingSlot, catatan: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingSlot}
                    className="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold shadow"
                  >
                    {isSavingSlot ? 'Menyimpan Slot...' : '💾 Simpan Perubahan Slot Parkir'}
                  </button>
                </form>
              )}
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
                  className={`py-2.5 px-3 rounded-2xl font-extrabold transition flex items-center justify-center gap-1.5 ${
                    secSubTab === 'paket'
                      ? 'bg-teal-800 text-white shadow'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>📦 Paket di Pos</span>
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {waitingPackagesCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSecSubTab('lapor')}
                  className={`py-2.5 px-3 rounded-2xl font-extrabold transition ${
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
                  className={`py-2.5 px-3 rounded-2xl font-extrabold transition ${
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
                  className={`py-2.5 px-3 rounded-2xl font-extrabold transition ${
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
                        Transparansi kiriman paket warga • Pak Eko & Pak Mulyadi dapat langsung
                        mencatat paket tiba beserta foto
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
                      className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-extrabold shadow-sm"
                    >
                      + Catat Paket Baru Tiba
                    </button>
                  </div>

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
                                {isDelivered ? '✅ Sudah Diambil / Diantar' : '📦 Menunggu di Pos'}
                              </span>
                            </div>
                            <p className="text-slate-700 font-medium">{pkg.detail_catatan}</p>
                            <p className="text-[11px] text-slate-400">
                              Dicatat oleh: {pkg.nama_security} (Shift {pkg.shift}) • {pkg.tanggal}{' '}
                              pukul {pkg.jam} WIB
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
                                className="px-3 py-1.5 rounded-xl bg-white border border-teal-200 text-teal-800 font-extrabold hover:bg-teal-50"
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
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                              >
                                📋 Salin WA
                              </button>
                            )}

                            {!isDelivered && (
                              <button
                                type="button"
                                onClick={() => handleMarkPackagePickedUp(pkg)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-sm"
                              >
                                ✓ Tandai Sudah Diambil
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                      className="w-full py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold shadow-md transition"
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
                          className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold"
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

              {/* SUB-TAB 3: KALENDER JADWAL ROTASI SECURITY (READ-ONLY & BERSIH) */}
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
                    📋 Riwayat Log Patroli, Absen Shift, & Aktivitas Pos
                  </h4>
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
                                className="px-3 py-1.5 rounded-xl bg-white border border-teal-200 text-teal-800 font-extrabold"
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
                                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold"
                              >
                                📋 Salin WA
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ===================================================================== */}
              {/* FITUR OPSIONAL DENGAN SAKLAR KODE (DEFAULT: DISEMBUNYIKAN / FALSE)    */}
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
        </div>
      </main>

      {/* BOTTOM NAVIGATION BAR (KHUSUS HP / MOBILE < 768px) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-3 py-2 flex justify-between items-center text-[11px] z-30 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('beranda')}
          className={`flex flex-col items-center ${
            activeTab === 'beranda' ? 'text-teal-800 font-extrabold' : 'text-slate-400'
          }`}
        >
          <span className="text-base">🏠</span>
          <span>Beranda</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rumah')}
          className={`flex flex-col items-center ${
            activeTab === 'rumah' ? 'text-teal-800 font-extrabold' : 'text-slate-400'
          }`}
        >
          <span className="text-base">🏘️</span>
          <span>22 Rumah</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenQris && onOpenQris(activeHouses[0] || null)}
          className="flex flex-col items-center -mt-5"
        >
          <div className="w-12 h-12 rounded-full bg-teal-800 text-white flex items-center justify-center shadow-lg border-4 border-white text-lg">
            📲
          </div>
          <span className="text-[10px] font-extrabold text-teal-900">QRIS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mutasi')}
          className={`flex flex-col items-center ${
            activeTab === 'mutasi' ? 'text-teal-800 font-extrabold' : 'text-slate-400'
          }`}
        >
          <span className="text-base">📑</span>
          <span>Buku Kas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('keamanan')}
          className={`flex flex-col items-center relative ${
            activeTab === 'keamanan' ? 'text-teal-800 font-extrabold' : 'text-slate-400'
          }`}
        >
          <span className="text-base">🛡️</span>
          <span>Pos & Paket</span>
          {waitingPackagesCount > 0 && (
            <span className="absolute -top-1 right-1 bg-amber-500 text-white text-[9px] font-black px-1.5 rounded-full">
              {waitingPackagesCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
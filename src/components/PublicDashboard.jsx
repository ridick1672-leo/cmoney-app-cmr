import React, { useState, useMemo, useRef } from 'react';
import QrisPaymentModal from './QrisPaymentModal';

// Fallback 5 Bulan Rekap Tutup Buku (V2 Utuh - Urut Terbaru Oktober ke Juni)
const FALLBACK_CLOSINGS_V2 = [
  {
    id: 'CLS-2026-10',
    periode_bulan: 'Oktober',
    periode_tahun: 2026,
    saldo_awal: 1512200,
    uang_masuk: 4200000,
    total_pengeluaran: 4318000,
    pengeluaran_proyek: 0,
    sisa_saldo: 1394200,
    status_tutup_buku: 'CLOSED'
  },
  {
    id: 'CLS-2026-09',
    periode_bulan: 'September',
    periode_tahun: 2026,
    saldo_awal: 2316500,
    uang_masuk: 4100000,
    total_pengeluaran: 4904300,
    pengeluaran_proyek: 0,
    sisa_saldo: 1512200,
    status_tutup_buku: 'CLOSED'
  },
  {
    id: 'CLS-2026-08',
    periode_bulan: 'Agustus',
    periode_tahun: 2026,
    saldo_awal: 2816000,
    uang_masuk: 4300000,
    total_pengeluaran: 4398500,
    pengeluaran_proyek: 0,
    sisa_saldo: 2717500,
    status_tutup_buku: 'CLOSED'
  },
  {
    id: 'CLS-2026-07',
    periode_bulan: 'Juli',
    periode_tahun: 2026,
    saldo_awal: 2850800,
    uang_masuk: 4100000,
    total_pengeluaran: 5135800,
    pengeluaran_proyek: 500000,
    sisa_saldo: 1815000,
    status_tutup_buku: 'CLOSED'
  },
  {
    id: 'CLS-2026-06',
    periode_bulan: 'Juni',
    periode_tahun: 2026,
    saldo_awal: 3702000,
    uang_masuk: 3800000,
    total_pengeluaran: 5051200,
    pengeluaran_proyek: 2874600,
    sisa_saldo: 2450800,
    status_tutup_buku: 'CLOSED'
  }
];

// Fallback 55 Rincian Transaksi Kas 5 Bulan (V2 Utuh - Urut Terbaru di Atas ke Terlama di Bawah)
const FALLBACK_LEDGER_V2 = [
  // OKTOBER 2026
  { id: 'TX-202610-10', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Air', is_proyek: false, nama_proyek: '', nominal: 60000, keterangan: 'Air Minum Galon', url_bukti: '-' },
  { id: 'TX-202610-09', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Token Listrik', url_bukti: '-' },
  { id: 'TX-202610-08', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 350000, keterangan: 'Kasbon pak eko', url_bukti: '-' },
  { id: 'TX-202610-07', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Lampu jalan + jasa pasang', url_bukti: '-' },
  { id: 'TX-202610-06', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1300000, keterangan: 'Gaji pak eko (Sisa potong kasbon)', url_bukti: '-' },
  { id: 'TX-202610-05', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1650000, keterangan: 'Gaji pak mulyadi', url_bukti: '-' },
  { id: 'TX-202610-04', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 700000, keterangan: 'Uang sampah Oktober', url_bukti: '-' },
  { id: 'TX-202610-03', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 50000, keterangan: 'Ganti Fitting lampu dan jasa pasang', url_bukti: '-' },
  { id: 'TX-202610-02', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 8000, keterangan: 'Beli baterai jam pos', url_bukti: '-' },
  { id: 'TX-202610-01', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 4200000, keterangan: 'Iuran Warga Oktober (21 Rumah Aktif)', url_bukti: '-' },
  // SEPTEMBER 2026
  { id: 'TX-202609-12', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 210000, keterangan: 'Perbaikan Pagar', url_bukti: '-' },
  { id: 'TX-202609-11', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 500000, keterangan: 'Kasbon pak Eko 2x', url_bukti: '-' },
  { id: 'TX-202609-10', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 47000, keterangan: 'Alat kebersihan', url_bukti: '-' },
  { id: 'TX-202609-09', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Ganti dinamo kipas pos', url_bukti: '-' },
  { id: 'TX-202609-08', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi', is_proyek: false, nama_proyek: '', nominal: 57300, keterangan: 'Kopi dan Gula', url_bukti: '-' },
  { id: 'TX-202609-07', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sosial', is_proyek: false, nama_proyek: '', nominal: 300000, keterangan: 'Dana Sosial', url_bukti: '-' },
  { id: 'TX-202609-06', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 240000, keterangan: 'Plang Nama CMR + Rokok', url_bukti: '-' },
  { id: 'TX-202609-05', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 50000, keterangan: 'Lampu dan laminating', url_bukti: '-' },
  { id: 'TX-202609-04', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1100000, keterangan: 'Gaji pak Eko (Sisa potong kasbon)', url_bukti: '-' },
  { id: 'TX-202609-03', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1600000, keterangan: 'Gaji pak Mulyadi', url_bukti: '-' },
  { id: 'TX-202609-02', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 700000, keterangan: 'Uang Sampah September', url_bukti: '-' },
  { id: 'TX-202609-01', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 4100000, keterangan: 'Iuran Warga September', url_bukti: '-' },
  // AGUSTUS 2026
  { id: 'TX-202608-11', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Air', is_proyek: false, nama_proyek: '', nominal: 36000, keterangan: 'Galon Pos 6x', url_bukti: '-' },
  { id: 'TX-202608-10', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Listrik Pos Agustus', url_bukti: '-' },
  { id: 'TX-202608-09', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 235000, keterangan: 'Lampu Sorot 3 pcs', url_bukti: '-' },
  { id: 'TX-202608-08', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 112500, keterangan: 'Bendera Merah Putih & Umbul-umbul', url_bukti: '-' },
  { id: 'TX-202608-07', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi', is_proyek: false, nama_proyek: '', nominal: 145000, keterangan: 'Kopi, Gula, Teh Pos', url_bukti: '-' },
  { id: 'TX-202608-06', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 350000, keterangan: 'Kasbon Pak Eko', url_bukti: '-' },
  { id: 'TX-202608-05', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 120000, keterangan: 'Uang Lembur Security', url_bukti: '-' },
  { id: 'TX-202608-04', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1000000, keterangan: 'Gaji Pak Rizki', url_bukti: '-' },
  { id: 'TX-202608-03', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1600000, keterangan: 'Gaji Pak Eko', url_bukti: '-' },
  { id: 'TX-202608-02', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 700000, keterangan: 'Uang Sampah Agustus', url_bukti: '-' },
  { id: 'TX-202608-01', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 4300000, keterangan: 'Iuran Warga Agustus', url_bukti: '-' },
  // JULI 2026
  { id: 'TX-202607-11', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Proyek', is_proyek: true, nama_proyek: 'Penambahan Kabel & Lampu Jalan', nominal: 500000, keterangan: 'Proyek Penambahan Kabel & Lampu Jalan', url_bukti: '-' },
  { id: 'TX-202607-10', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Air', is_proyek: false, nama_proyek: '', nominal: 30000, keterangan: 'Galon Pos 5x', url_bukti: '-' },
  { id: 'TX-202607-09', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Listrik Pos Juli', url_bukti: '-' },
  { id: 'TX-202607-08', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 85800, keterangan: 'Gembok Pos & Kunci Cadangan', url_bukti: '-' },
  { id: 'TX-202607-07', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi', is_proyek: false, nama_proyek: '', nominal: 120000, keterangan: 'Kopi, Gula, Teh Pos', url_bukti: '-' },
  { id: 'TX-202607-06', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sosial', is_proyek: false, nama_proyek: '', nominal: 500000, keterangan: 'Dana Sosial Warga Sakit', url_bukti: '-' },
  { id: 'TX-202607-05', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 150000, keterangan: 'Kasbon Pak Eko', url_bukti: '-' },
  { id: 'TX-202607-04', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1450000, keterangan: 'Gaji Pak Eko (Sisa potong kasbon)', url_bukti: '-' },
  { id: 'TX-202607-03', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1500000, keterangan: 'Gaji Pak Rizki', url_bukti: '-' },
  { id: 'TX-202607-02', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 700000, keterangan: 'Uang Sampah Juli', url_bukti: '-' },
  { id: 'TX-202607-01', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 4100000, keterangan: 'Iuran Warga Juli', url_bukti: '-' },
  // JUNI 2026
  { id: 'TX-202606-10', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Proyek', is_proyek: true, nama_proyek: 'Pemasangan Lampu 2 dan Kebersihan', nominal: 1179000, keterangan: 'Pemasangan Lampu 2 dan Kebersihan', url_bukti: '-' },
  { id: 'TX-202606-09', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Proyek', is_proyek: true, nama_proyek: 'Perbaikan Pagar dan Jembatan', nominal: 1695600, keterangan: 'Perbaikan Pagar dan Jembatan', url_bukti: '-' },
  { id: 'TX-202606-08', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Air', is_proyek: false, nama_proyek: '', nominal: 30000, keterangan: 'Galon Pos 5x', url_bukti: '-' },
  { id: 'TX-202606-07', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Listrik Pos Juni', url_bukti: '-' },
  { id: 'TX-202606-06', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi', is_proyek: false, nama_proyek: '', nominal: 111600, keterangan: 'Kopi, Teh, Gula, Susu', url_bukti: '-' },
  { id: 'TX-202606-05', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sosial', is_proyek: false, nama_proyek: '', nominal: 300000, keterangan: 'Dana Sosial Juni', url_bukti: '-' },
  { id: 'TX-202606-04', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 350000, keterangan: 'Bibit tanaman pos dan jasa cat pagar', url_bukti: '-' },
  { id: 'TX-202606-03', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 585000, keterangan: 'Gaji + Uang Makan Pak Rizki Juni', url_bukti: '-' },
  { id: 'TX-202606-02', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 700000, keterangan: 'Periode Juni', url_bukti: '-' },
  { id: 'TX-202606-01', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 3800000, keterangan: 'Iuran Warga Juni', url_bukti: '-' }
];

// Helper validasi apakah kolom url_bukti berisi tautan bukti yang valid
function isValidEvidenceUrl(url) {
  if (!url) return false;
  const s = String(url).trim();
  if (!s || s === '-' || s === 'null' || s === 'undefined' || s.startsWith('ERROR_')) return false;
  return s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:image/');
}

// Helper ekstraksi link Google Drive dari detail_catatan log security (jika ada)
function extractEvidenceUrlFromText(text = '') {
  const match = String(text).match(/https?:\/\/[^\s\]]+/);
  return match ? match[0] : '';
}

function buildMonthCalendarSchedules(year, monthIndex, overrides = []) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayDow = new Date(year, monthIndex, 1).getDay();
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const anchorSunday = new Date(2026, 10, 1);

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, monthIndex, d);
    const dow = dateObj.getDay();
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const foundOverride = overrides.find((o) => String(o.tanggal).slice(0, 10) === dateStr);
    if (foundOverride) {
      days.push({
        ...foundOverride,
        dayNumber: d,
        dow
      });
      continue;
    }

    const diffDays = Math.floor((dateObj - anchorSunday) / (1000 * 60 * 60 * 24));
    const cycleWeek = Math.floor((diffDays + 1) / 7);
    const isEvenCycle = ((cycleWeek % 2) + 2) % 2 === 0;

    const morningGuard = isEvenCycle ? 'Pak Eko' : 'Pak Mulyadi';
    const nightGuard = isEvenCycle ? 'Pak Mulyadi' : 'Pak Eko';

    let shift_pagi = morningGuard;
    let jam_pagi = '08:00 - 20:00';
    let shift_malam = nightGuard;
    let jam_malam = '20:00 - 08:00';
    let status_jadwal = 'NORMAL_2_SHIFT';
    let catatan_jadwal = 'Penjagaan normal 2 shift (Pagi & Malam)';

    if (dow === 5) {
      shift_malam = 'LIBUR';
      jam_malam = 'Gerbang Mandiri (20:00)';
      status_jadwal = 'MALAM_LIBUR';
      catatan_jadwal = `Jumat: ${shift_pagi} bertugas shift pagi, shift malam LIBUR (Gerbang Mandiri mulai 20:00 WIB)`;
    } else if (dow === 6) {
      shift_malam = 'LIBUR';
      jam_malam = 'Gerbang Mandiri (20:00)';
      status_jadwal = 'ROTASI_MALAM_LIBUR';
      catatan_jadwal = `Sabtu (Rotasi Shift Mingguan): ${shift_pagi} naik ke shift pagi, shift malam LIBUR`;
    } else if (dow === 0) {
      catatan_jadwal = `Minggu: Penjagaan kembali normal 2 shift (${shift_pagi} Pagi, ${shift_malam} Malam)`;
    }

    days.push({
      id: `SCH-${dateStr.replace(/-/g, '')}`,
      tanggal: dateStr,
      hari: dayNames[dow],
      dayNumber: d,
      dow,
      periode_bulan: monthNames[monthIndex],
      periode_tahun: year,
      shift_pagi,
      jam_pagi,
      shift_malam,
      jam_malam,
      status_jadwal,
      catatan_jadwal
    });
  }

  return { firstDayDow, days, monthName: monthNames[monthIndex], year };
}

export default function PublicDashboard({
  dashboardData = {},
  loading = false,
  isAdminLoggedIn = false,
  onOpenAdminLogin,
  onInputSecurityLog,
  onUpdateSecuritySchedule,
  onConfirmQrisProof,
  onUploadIplProof
}) {
  const [activeTab, setActiveTab] = useState('beranda');
  const [showBalance, setShowBalance] = useState(true);
  const [isQrisOpen, setIsQrisOpen] = useState(false);
  const [qrisHouseId, setQrisHouseId] = useState('H-01');
  const [secretTapCount, setSecretTapCount] = useState(0);
  const [logoError, setLogoError] = useState(false);

  const [expandedMonth, setExpandedMonth] = useState('Oktober');
  const [copyMonthNotice, setCopyMonthNotice] = useState('');

  // Filter State untuk Tab Mutasi Kas & Tab 22 Rumah (V2 + Filter Bukti V4)
  const [filterBulanKas, setFilterBulanKas] = useState('Semua');
  const [filterKategoriKas, setFilterKategoriKas] = useState('ALL');
  const [searchRumah, setSearchRumah] = useState('');
  const [filterStatusIpl, setFilterStatusIpl] = useState('ALL');

  // State Tombol Darurat SOS (Tahan 3 Detik - V2)
  const [sosProgress, setSosProgress] = useState(0);
  const [sosTriggered, setSosTriggered] = useState(false);
  const sosTimerRef = useRef(null);

  // State Kalender Dinamis Security (V3)
  const [calMonthIndex, setCalMonthIndex] = useState(10);
  const [calYear, setCalYear] = useState(2026);
  const [selectedCalDay, setSelectedCalDay] = useState(null);
  const [scheduleEditForm, setScheduleEditForm] = useState(null);

  // State Generator Laporan WA & Log Security (V3 + V4 Drive Evidence)
  const nowDateStr = new Date().toISOString().slice(0, 10);
  const nowTimeStr = new Date().toTimeString().slice(0, 5);
  const [secGeneratorMode, setSecGeneratorMode] = useState('PATROLI');
  const [secOfficer, setSecOfficer] = useState('Pak Eko');
  const [secPartnerOfficer, setSecPartnerOfficer] = useState('Pak Mulyadi');
  const [secShift, setSecShift] = useState('Pagi');
  const [secDate, setSecDate] = useState(nowDateStr);
  const [secTime, setSecTime] = useState(nowTimeStr);
  const [secWeather815, setSecWeather815] = useState('Cerah');
  const [secGateStatus, setSecGateStatus] = useState('Pintu gerbang kecil ditutup sesuai SOP');

  const [absenSubType, setAbsenSubType] = useState('SERAH_TERIMA_PAGI');
  const [absenNote, setAbsenNote] = useState('Situasi aman kondusif tanpa taruna, tidak ada titipan tertinggal');

  const [patrolTimeSlot, setPatrolTimeSlot] = useState('Pagi (09:00 WIB)');
  const [patrolPoints, setPatrolPoints] = useState([
    'Pos Utama Security',
    'Gerbang Utama & Pintu Kecil',
    'Gang Depan (Blok A1 - A11)',
    'Gang Belakang / Side B (Blok A12 - A22)',
    'Area Lapangan & Parkir'
  ]);
  const [patrolActivity, setPatrolActivity] = useState('Nihil, situasi aman kondusif tanpa taruna apapun');

  const [pkgHouseId, setPkgHouseId] = useState('H-06');
  const [pkgRecipientCustom, setPkgRecipientCustom] = useState('');
  const [pkgType, setPkgType] = useState('1 Paket Reguler');
  const [pkgHandling, setPkgHandling] = useState('Disimpan di Pos Security (Menunggu diambil pemilik)');
  const [pkgCodAmount, setPkgCodAmount] = useState('');

  const [izinType, setIzinType] = useState('ISOMA & Sholat Dzuhur (Pukul 12:00 WIB)');
  const [izinDuration, setIzinDuration] = useState('Pagar utama ditutup/digembok sementara, selesai langsung dibuka kembali');

  const [anomalySubCategory, setAnomalySubCategory] = useState('Listrik PLN Padam / Gangguan Gardu');
  const [anomalyHouseId, setAnomalyHouseId] = useState('-');
  const [anomalyDetail, setAnomalyDetail] = useState('Listrik PLN padam, security sedang mengecek kondisi sekitar cluster');
  const [anomalyAction, setAnomalyAction] = useState('Sudah dicek langsung ke lokasi & dipantau dari pos');

  const [watermarkedPhotos, setWatermarkedPhotos] = useState([]);
  const [copyWaSuccess, setCopyWaSuccess] = useState('');
  const [logCategoryFilter, setLogCategoryFilter] = useState('ALL');

  const data = dashboardData;
  const houses = data.houses?.length ? data.houses : [];
  const cashLedger = data.cash_ledger?.length ? data.cash_ledger : FALLBACK_LEDGER_V2;
  const monthlyClosings = data.monthly_closings?.length ? data.monthly_closings : FALLBACK_CLOSINGS_V2;
  const securityPayroll = data.security_payroll || [];
  const securityLogs = data.security_logs || [];
  const securityConfig = data.security_config || {
    active_1: 'Pak Eko',
    active_2: 'Pak Mulyadi',
    shift_pagi_jam: '08:00 - 20:00 WIB',
    shift_malam_jam: '20:00 - 08:00 WIB',
    libur_malam_hari: 'Jumat,Sabtu',
    galon_count_bulan_ini: 4
  };

  const formatRp = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');

  const handleLogoTap = () => {
    const next = secretTapCount + 1;
    if (next >= 5) {
      setSecretTapCount(0);
      if (onOpenAdminLogin) onOpenAdminLogin();
    } else {
      setSecretTapCount(next);
    }
  };

  const openQrisForHouse = (houseId = 'H-01') => {
    setQrisHouseId(houseId);
    setIsQrisOpen(true);
  };

  const startSosHold = () => {
    let current = 0;
    sosTimerRef.current = setInterval(() => {
      current += 10;
      setSosProgress(current);
      if (current >= 100) {
        clearInterval(sosTimerRef.current);
        setSosProgress(0);
        setSosTriggered(true);
      }
    }, 300);
  };

  const cancelSosHold = () => {
    if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    setSosProgress(0);
  };

  const getMonthlyBreakdown = (bulan, tahun = 2026) => {
    const items = cashLedger.filter(
      (tx) => String(tx.periode_bulan).toLowerCase() === String(bulan).toLowerCase() && Number(tx.periode_tahun || 2026) === Number(tahun)
    );
    const pemasukanMap = {};
    const pengeluaranMap = {};
    const proyekList = [];

    items.forEach((tx) => {
      const nom = Number(tx.nominal || 0);
      const kat = tx.kategori || 'Lainnya';
      const ket = tx.keterangan || '-';
      const isProyek = Boolean(tx.is_proyek) && String(tx.is_proyek).toUpperCase() !== 'FALSE';

      if (String(tx.tipe).toUpperCase() === 'IN') {
        pemasukanMap[kat] = (pemasukanMap[kat] || 0) + nom;
      } else {
        if (isProyek) {
          proyekList.push({ nama: tx.nama_proyek || ket, nominal: nom, url_bukti: tx.url_bukti });
        }
        if (!pengeluaranMap[kat]) {
          pengeluaranMap[kat] = { total: 0, details: [], itemsRaw: [] };
        }
        pengeluaranMap[kat].total += nom;
        pengeluaranMap[kat].details.push(
          `${ket} (Rp ${Number(nom).toLocaleString('id-ID')})`
        );
        pengeluaranMap[kat].itemsRaw.push(tx);
      }
    });

    return { pemasukanMap, pengeluaranMap, proyekList };
  };

  const generateMonthlyFinanceWaText = (closingItem) => {
    const { pemasukanMap, pengeluaranMap, proyekList } = getMonthlyBreakdown(
      closingItem.periode_bulan,
      closingItem.periode_tahun
    );
    const lines = [
      `*C-Money | Laporan Bulanan ${data.cluster_full_name || 'Cluster Mutiara Residence Sumberjaya'}*`,
      `Periode: ${closingItem.periode_bulan} ${closingItem.periode_tahun}`,
      '',
      'Halo warga Mutiara Residence Sumberjaya, berikut rekap kas bulanan kita:',
      '',
      `Saldo Awal: ${formatRp(closingItem.saldo_awal)}`,
      `Uang Masuk: ${formatRp(closingItem.uang_masuk)}`,
      `Total Pengeluaran: ${formatRp(closingItem.total_pengeluaran)}`,
      `Pengeluaran Proyek: ${formatRp(closingItem.pengeluaran_proyek)}`,
      `Sisa Saldo: ${formatRp(closingItem.sisa_saldo)}`,
      '',
      '*Breakdown Pemasukan per Kategori*'
    ];
    Object.keys(pemasukanMap).forEach((k) => {
      lines.push(`- ${k}: ${formatRp(pemasukanMap[k])}`);
    });
    lines.push('');
    lines.push('*Breakdown Pengeluaran per Kategori*');
    Object.keys(pengeluaranMap).forEach((k) => {
      lines.push(`- ${k}: ${formatRp(pengeluaranMap[k].total)} | detail: ${pengeluaranMap[k].details.join(', ')}`);
    });
    if (proyekList.length > 0) {
      lines.push('');
      lines.push('*Detail Proyek:*');
      proyekList.forEach((p) => {
        lines.push(`- ${p.nama} - ${formatRp(p.nominal)}`);
      });
    }
    return lines.join('\n');
  };

  // Data Olahan Tab Mutasi Kas (V2 + Filter Evidence V4)
  const ledgerList = cashLedger.filter((item) => {
    const matchBulan = filterBulanKas === 'Semua' || item.periode_bulan === filterBulanKas;
    const matchKat =
      filterKategoriKas === 'ALL' ||
      (filterKategoriKas === 'PROYEK'
        ? Boolean(item.is_proyek) && String(item.is_proyek).toUpperCase() !== 'FALSE'
        : filterKategoriKas === 'WITH_EVIDENCE'
        ? isValidEvidenceUrl(item.url_bukti)
        : item.kategori === filterKategoriKas);
    return matchBulan && matchKat;
  });

  const totalMasukFilter = ledgerList
    .filter((i) => String(i.tipe).toUpperCase() === 'IN')
    .reduce((acc, cur) => acc + Number(cur.nominal || 0), 0);
  const totalKeluarFilter = ledgerList
    .filter((i) => String(i.tipe).toUpperCase() === 'OUT')
    .reduce((acc, cur) => acc + Number(cur.nominal || 0), 0);

  // Data Olahan Tab 22 Rumah (21 Aktif + 1 Tidak Aktif BPR + Evidence Link V4)
  const housesWithIpl = houses.map((h) => {
    const iplRow = (data.ipl_status || []).find((r) => r.house_id === h.id);
    const isNonAktif = h.status_huni === 'Tidak Aktif' || iplRow?.status_bayar === 'Tidak Aktif';
    return {
      ...h,
      is_non_aktif: isNonAktif,
      status_bayar: isNonAktif ? 'Tidak Aktif' : (iplRow?.status_bayar || 'Belum Lunas'),
      tanggal_bayar: iplRow?.tanggal_bayar || '-',
      url_bukti: iplRow?.url_bukti || '',
      catatan:
        iplRow?.catatan ||
        (isNonAktif ? 'Unit Dijual oleh Pihak BPR (Non-Aktif)' : 'Tagihan IPL November 2026')
    };
  });

  const activeHousesCount = housesWithIpl.filter((h) => !h.is_non_aktif).length || 21;
  const totalLunasCount = housesWithIpl.filter((h) => h.status_bayar === 'Lunas').length;
  const totalBelumLunasCount = housesWithIpl.filter((h) => h.status_bayar === 'Belum Lunas').length;

  const filteredHouses = housesWithIpl.filter((h) => {
    const q = searchRumah.toLowerCase();
    const matchSearch =
      h.nomor_rumah.toLowerCase().includes(q) ||
      h.nama_warga.toLowerCase().includes(q) ||
      String(h.alias_keluarga || '').toLowerCase().includes(q);
    const matchStatus =
      filterStatusIpl === 'ALL' ||
      (filterStatusIpl === 'AKTIF' ? !h.is_non_aktif : h.status_bayar === filterStatusIpl);
    return matchSearch && matchStatus;
  });

  const calendarData = useMemo(
    () =>
      buildMonthCalendarSchedules(
        calYear,
        calMonthIndex,
        data.security_schedules || []
      ),
    [calYear, calMonthIndex, data.security_schedules]
  );

  const todaySchedule = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const todayObj = new Date();
    const calCurrent = buildMonthCalendarSchedules(
      todayObj.getFullYear(),
      todayObj.getMonth(),
      data.security_schedules || []
    );
    return (
      calCurrent.days.find((d) => d.tanggal === todayIso) ||
      calendarData.days[0]
    );
  }, [data.security_schedules, calendarData]);

  const selectedPkgHouseObj = useMemo(
    () =>
      houses.find((h) => h.id === pkgHouseId) ||
      houses[0] || {
        id: 'H-06',
        nomor_rumah: 'No. 06',
        nama_warga: 'Pak Andy',
        alias_keluarga: 'Pak Agustian Ekandiarto (Pak Andi) / Ibu'
      },
    [houses, pkgHouseId]
  );

  // GENERATOR TEKS WA OTOMATIS SECURITY (V3 Utuh)
  const generatedSecurityWaText = useMemo(() => {
    const dObj = new Date(secDate + 'T00:00:00');
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const hariStr = isNaN(dObj.getTime()) ? 'Hari Ini' : dayNames[dObj.getDay()];
    const tglFormatted = secDate.split('-').reverse().join('/');

    const hourNum = Number((secTime || '08:00').split(':')[0]);
    let waktuSapaan = 'pagi';
    if (hourNum >= 11 && hourNum < 15) waktuSapaan = 'siang';
    else if (hourNum >= 15 && hourNum < 18) waktuSapaan = 'sore';
    else if (hourNum >= 18 || hourNum < 4) waktuSapaan = 'malam';

    if (secGeneratorMode === 'ABSEN_SHIFT') {
      if (absenSubType === 'TUTUP_POS_MALAM_LIBUR') {
        return [
          `*Assalamualaikum, selamat malam*`,
          `Izin lapor petugas jaga pagi (*${secOfficer}*) persiapan balik kanan pukul ${secTime} WIB.`,
          `Sesuai jadwal *${hariStr} malam libur penjagaan*, lampu lingkungan sudah dinyalakan, TV pos sudah diamankan/digembok, dan pintu gerbang utama sudah dikunci.`,
          `Mohon kerja sama Bapak/Ibu warga untuk buka-tutup gerbang mandiri malam ini.`,
          `Situasi aman kondusif tanpa taruna. *Terima kasih* 🙏🫡`
        ].join('\n');
      }

      const petugasPagi = absenSubType === 'SERAH_TERIMA_PAGI' ? secOfficer : secPartnerOfficer;
      const petugasMalam = absenSubType === 'SERAH_TERIMA_PAGI' ? secPartnerOfficer : secOfficer;

      return [
        `*ABSEN PERGANTIAN SHIFT*`,
        `Perumahan Cluster Mutiara Residence Sumberjaya`,
        ``,
        `Assalamualaikum, selamat ${waktuSapaan} mohon izin melaporkan:`,
        `• Hari / Tanggal : *${hariStr}, ${tglFormatted}*`,
        `• Jam : *${secTime} WIB*`,
        `• Giat : *Serah Terima Tugas Jaga Pengamanan Cluster*`,
        ``,
        `☀️ PETUGAS JAGA PAGI : *${petugasPagi}*`,
        `🌙 PETUGAS JAGA MALAM : *${petugasMalam}*`,
        `📋 Catatan Pos : ${absenNote}`,
        ``,
        `Keamanan diserahkan dalam keadaan aman kondusif tanpa taruna, untuk 1 personil izin balik kanan. *Terima kasih* 🙏🫡`
      ].join('\n');
    }

    if (secGeneratorMode === 'PATROLI') {
      const titikStr = patrolPoints.length ? patrolPoints.join(', ') : 'Pos Utama, Gerbang, Gang Depan & Belakang';
      return [
        `*Assalamualaikum, selamat ${waktuSapaan}*`,
        `Izin lapor petugas jaga (*${secOfficer}*) giat pengecekan dan patroli kontrol lokasi (*${patrolTimeSlot}*) update situasi terkini kondisi area CMR (${titikStr}).`,
        `Untuk saat ini area tetap aman kondusif tanpa taruna apapun, aktivitas warga: ${patrolActivity}.`,
        `Status gerbang: ${secGateStatus}, security tetap siaga pantau di pos.`,
        `Berikut 815 cuaca *${secWeather815.toLowerCase()}*. *Terima kasih* 🙏🫡`
      ].join('\n');
    }

    if (secGeneratorMode === 'PAKET_SURAT') {
      const namaTujuan = pkgRecipientCustom.trim()
        ? pkgRecipientCustom.trim()
        : (selectedPkgHouseObj.alias_keluarga || selectedPkgHouseObj.nama_warga);
      const codInfo = pkgCodAmount.trim() ? `\n• Nominal / Info COD: *Rp ${pkgCodAmount.trim()}*` : '';
      return [
        `*Assalamualaikum, selamat ${waktuSapaan}*`,
        `Izin lapor petugas jaga (*${secOfficer}*), ada *${pkgType}* tiba di Pos Security:`,
        `• Tujuan Blok : *Blok A ${selectedPkgHouseObj.nomor_rumah}*`,
        `• Atas Nama : *${namaTujuan}*${codInfo}`,
        `• Status Paket : *${pkgHandling}*`,
        `*(Keterangan isi barang disensor demi privasi warga)*. *Terima kasih* 🙏🫡`
      ].join('\n');
    }

    if (secGeneratorMode === 'IZIN_POS') {
      return [
        `*Assalamualaikum, selamat ${waktuSapaan}*`,
        `Izin lapor petugas jaga (*${secOfficer}*) pukul ${secTime} WIB izin meninggalkan pos sementara untuk *${izinType}*.`,
        `Keterangan: ${izinDuration}.`,
        `Situasi area CMR aman terkendali. *Terima kasih* 🙏🫡`
      ].join('\n');
    }

    const houseObj = houses.find((h) => h.id === anomalyHouseId);
    const lokasiInfo = houseObj
      ? `Blok A ${houseObj.nomor_rumah} (${houseObj.alias_keluarga || houseObj.nama_warga})`
      : 'Area Lingkungan Cluster CMR';

    return [
      `*Assalamualaikum, selamat ${waktuSapaan}*`,
      `Izin lapor update informasi lapangan oleh petugas jaga (*${secOfficer}*):`,
      `• Kategori : *${anomalySubCategory}*`,
      `• Titik / Unit : *${lokasiInfo}*`,
      `• Keterangan : ${anomalyDetail}`,
      `• Tindakan Security : ${anomalyAction}`,
      `Berikut 815 cuaca ${secWeather815.toLowerCase()}. Demikian informasi disampaikan, *terima kasih* 🙏🫡`
    ].join('\n');
  }, [
    secGeneratorMode, secOfficer, secPartnerOfficer, secDate, secTime, secWeather815, secGateStatus,
    absenSubType, absenNote, patrolTimeSlot, patrolPoints, patrolActivity,
    selectedPkgHouseObj, pkgRecipientCustom, pkgType, pkgHandling, pkgCodAmount,
    izinType, izinDuration, anomalySubCategory, anomalyHouseId, anomalyDetail, anomalyAction, houses
  ]);

  const handleCaptureWatermarkedPhoto = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.slice(0, 6).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxW = 900;
          const scale = img.width > maxW ? maxW / img.width : 1;
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const barH = Math.max(58, Math.round(canvas.height * 0.12));
          ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
          ctx.fillRect(0, canvas.height - barH, canvas.width, barH);

          ctx.fillStyle = '#10b981';
          ctx.fillRect(0, canvas.height - barH, 6, barH);

          const fontSize1 = Math.max(13, Math.round(canvas.width * 0.024));
          const fontSize2 = Math.max(11, Math.round(canvas.width * 0.019));
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${fontSize1}px sans-serif`;
          ctx.fillText(
            `POS SECURITY CMR • ${secOfficer.toUpperCase()} (${secShift.toUpperCase()})`,
            14,
            canvas.height - barH + fontSize1 + 8
          );

          ctx.fillStyle = '#cbd5e1';
          ctx.font = `${fontSize2}px sans-serif`;
          ctx.fillText(
            `📅 ${secDate} ⏰ ${secTime} WIB | 815: ${secWeather815} | Cluster Mutiara Residence Sumberjaya`,
            14,
            canvas.height - 10
          );

          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setWatermarkedPhotos((prev) => [
            ...prev.slice(-5),
            {
              id: `WM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: file.name,
              dataUrl
            }
          ]);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handler V4: Salin Teks WA + Simpan Log ke Spreadsheet + Kirim Foto Watermark ke Folder Log_Absensi_Security
  const handleCopyAndSaveSecurityReport = async (openWaDirect = false) => {
    try {
      await navigator.clipboard.writeText(generatedSecurityWaText);
    } catch (err) {
      console.warn('Clipboard fallback:', err);
    }

    let subKat = 'Patroli Rutin';
    let targetHouse = '-';
    let targetWarga = '-';
    let detailText = patrolActivity;
    let titikText = 'Pos Utama Security';

    if (secGeneratorMode === 'ABSEN_SHIFT') {
      subKat = absenSubType === 'TUTUP_POS_MALAM_LIBUR'
        ? 'Tutup Pos Malam Libur (Jumat/Sabtu)'
        : `Pergantian Shift (${secTime})`;
      detailText = absenNote;
    } else if (secGeneratorMode === 'PATROLI') {
      subKat = `Patroli ${patrolTimeSlot}`;
      titikText = `${patrolPoints.length} Titik (${patrolPoints.slice(0, 3).join(', ')}...)`;
      detailText = patrolActivity;
    } else if (secGeneratorMode === 'PAKET_SURAT') {
      subKat = pkgType;
      targetHouse = selectedPkgHouseObj.id;
      targetWarga = pkgRecipientCustom.trim() || selectedPkgHouseObj.alias_keluarga || selectedPkgHouseObj.nama_warga;
      detailText = `${pkgType} untuk ${selectedPkgHouseObj.nomor_rumah} (${targetWarga}) - ${pkgHandling}`;
    } else if (secGeneratorMode === 'IZIN_POS') {
      subKat = izinType;
      detailText = izinDuration;
    } else {
      subKat = anomalySubCategory;
      targetHouse = anomalyHouseId;
      const hObj = houses.find((h) => h.id === anomalyHouseId);
      targetWarga = hObj ? (hObj.alias_keluarga || hObj.nama_warga) : 'Lingkungan CMR';
      detailText = `${anomalyDetail} | Tindakan: ${anomalyAction}`;
    }

    const latestWatermarkedBase64 = watermarkedPhotos.length > 0
      ? watermarkedPhotos[watermarkedPhotos.length - 1].dataUrl
      : '';

    const logPayload = {
      tanggal: secDate,
      jam: secTime,
      nama_security: secOfficer,
      shift: secShift,
      kategori_laporan: secGeneratorMode === 'ANOMALI' ? 'ANOMALI_FASILITAS' : secGeneratorMode,
      sub_kategori: subKat,
      house_id: targetHouse,
      nama_warga_tujuan: targetWarga,
      titik_patroli: titikText,
      cuaca_815: secWeather815,
      status_gerbang: secGateStatus,
      detail_catatan: detailText,
      teks_wa: generatedSecurityWaText,
      file_base64: latestWatermarkedBase64
    };

    if (onInputSecurityLog) {
      await onInputSecurityLog(logPayload);
    }

    setCopyWaSuccess(
      latestWatermarkedBase64
        ? '✅ Teks WA disalin & Foto Watermark disimpan ke folder Drive Log_Absensi_Security!'
        : '✅ Teks Laporan WA berhasil disalin & tercatat di Database C-Money!'
    );
    setTimeout(() => setCopyWaSuccess(''), 4500);

    if (openWaDirect) {
      const encoded = encodeURIComponent(generatedSecurityWaText);
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  const filteredSecurityLogs = useMemo(() => {
    if (logCategoryFilter === 'ALL') return securityLogs;
    return securityLogs.filter((l) => String(l.kategori_laporan) === logCategoryFilter);
  }, [securityLogs, logCategoryFilter]);

  const handlePrevMonth = () => {
    if (calMonthIndex === 0) {
      setCalMonthIndex(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonthIndex((m) => m - 1);
    }
    setSelectedCalDay(null);
  };

  const handleNextMonth = () => {
    if (calMonthIndex === 11) {
      setCalMonthIndex(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonthIndex((m) => m + 1);
    }
    setSelectedCalDay(null);
  };

  const togglePatrolPoint = (pt) => {
    setPatrolPoints((prev) =>
      prev.includes(pt) ? prev.filter((item) => item !== pt) : [...prev, pt]
    );
  };

  const navItems = [
    { id: 'beranda', label: 'Beranda', icon: '🏠' },
    { id: 'mutasi', label: 'Mutasi Kas', icon: '📑' },
    { id: 'warga', label: '22 Rumah', icon: '🏘️' },
    { id: 'keamanan', label: 'Keamanan & SOS', icon: '🛡️' }
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-24 md:pb-12">
      {/* TOP NAVBAR RESPONSIVE (100% KERANGKA V2) */}
      <header className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div onClick={handleLogoTap} className="cursor-pointer select-none flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center font-black text-lg shadow-inner overflow-hidden shrink-0">
              {!logoError && data.logo_url ? (
                <img
                  src={data.logo_url}
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
                <span className="font-extrabold text-base tracking-wide">{data.app_name || 'C-Money'}</span>
                <span className="text-[10px] bg-emerald-400/20 border border-emerald-300/40 px-2 py-0.5 rounded-full font-semibold">
                  Publik • Tanpa Login
                </span>
              </div>
              <p className="text-xs text-teal-100">{data.cluster_full_name || 'Cluster Mutiara Residence Sumberjaya'}</p>
            </div>
          </div>

          {/* Menu Navigasi Desktop & Tablet */}
          <nav className="hidden md:flex items-center gap-2 bg-black/15 p-1.5 rounded-2xl border border-white/10">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === item.id
                    ? 'bg-white text-teal-900 shadow-sm'
                    : 'text-teal-100 hover:bg-white/10'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Tombol Aksi Kanan Atas */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => openQrisForHouse('H-01')}
              className="hidden sm:flex items-center gap-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow transition"
            >
              📲 Bayar QRIS
            </button>
            <button
              onClick={onOpenAdminLogin}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold transition"
            >
              {isAdminLoggedIn ? '⚙️ Panel Pengurus' : '🔒 Pengurus'}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER RESPONSIVE 12 KOLOM (100% KERANGKA V2) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* KOLOM KIRI (lg:col-span-4): KARTU SALDO M-BANKING, QUICK ACTIONS, CTA QRIS & INFO POS HARI INI */}
        <div className="lg:col-span-4 space-y-4">
          {/* Kartu Saldo Utama m-Banking */}
          <div className="bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-teal-200 font-semibold">
                Saldo Kas Aktif Cluster
              </span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-xs text-teal-300 hover:text-white underline"
              >
                {showBalance ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>

            <div className="text-3xl font-black mt-1.5 tracking-tight">
              {showBalance ? formatRp(data.current_balance || 1394200) : 'Rp ••••••••'}
            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] bg-white/10 px-2.5 py-1 rounded-full text-emerald-300">
              <span>●</span>
              <span>
                Status IPL Nov 2026: {totalLunasCount}/{activeHousesCount} Rumah Aktif Lunas
              </span>
              {loading && <span className="text-amber-300 animate-pulse ml-1">(Sync...)</span>}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-white/15 text-xs">
              <div>
                <p className="text-teal-200 text-[11px]">Iuran Wajib / Rumah</p>
                <p className="font-extrabold text-emerald-300 mt-0.5">
                  {formatRp(data.default_ipl_amount || 200000)} / bln
                </p>
              </div>
              <div>
                <p className="text-teal-200 text-[11px]">Total Unit Hunian</p>
                <p className="font-extrabold text-white mt-0.5">
                  22 Unit (21 Aktif • 1 BPR)
                </p>
              </div>
            </div>
          </div>

          {/* Menu Cepat 4 Ikon (Quick Actions V2) */}
          <div className="bg-white rounded-3xl shadow-sm p-4 grid grid-cols-4 gap-2 text-center border border-slate-200/70">
            <button
              onClick={() => openQrisForHouse('H-01')}
              className="flex flex-col items-center group"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl shadow group-hover:scale-105 transition">
                📲
              </div>
              <span className="text-[11px] font-bold text-teal-800 mt-1.5">Bayar QRIS</span>
            </button>

            <button
              onClick={() => setActiveTab('warga')}
              className="flex flex-col items-center group"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border transition group-hover:scale-105 ${
                  activeTab === 'warga'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                }`}
              >
                🏘️
              </div>
              <span className="text-[11px] font-semibold text-slate-700 mt-1.5">22 Rumah</span>
            </button>

            <button
              onClick={() => setActiveTab('mutasi')}
              className="flex flex-col items-center group"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border transition group-hover:scale-105 ${
                  activeTab === 'mutasi'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}
              >
                📊
              </div>
              <span className="text-[11px] font-semibold text-slate-700 mt-1.5">Buku Kas</span>
            </button>

            <button
              onClick={() => setActiveTab('keamanan')}
              className="flex flex-col items-center group"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border transition group-hover:scale-105 ${
                  activeTab === 'keamanan'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}
              >
                🚨
              </div>
              <span className="text-[11px] font-semibold text-slate-700 mt-1.5">Pos & SOS</span>
            </button>
          </div>

          {/* Banner CTA QRIS (V2) */}
          <div
            onClick={() => openQrisForHouse('H-01')}
            className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-4 flex items-center justify-between cursor-pointer shadow-sm hover:shadow-md transition"
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-bold">
                Bebas Biaya Admin • MDR 0%
              </span>
              <h3 className="font-extrabold text-sm mt-1">Bayar Iuran IPL Bulan November</h3>
              <p className="text-xs text-emerald-100">
                Tampilkan QRIS Resmi CMR & unggah bukti bayar
              </p>
            </div>
            <div className="bg-white text-teal-800 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow shrink-0">
              Buka QRIS →
            </div>
          </div>

          {/* Kartu Ringkas Status Jaga Pos Security Hari Ini (V3 di Sidebar Kiri) */}
          <div
            onClick={() => setActiveTab('keamanan')}
            className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/70 space-y-2.5 cursor-pointer hover:border-teal-300 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                🛡️ Pos Security Hari Ini ({todaySchedule?.hari || 'Hari Ini'})
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                🚰 Galon: {securityConfig.galon_count_bulan_ini || 4}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">☀️ PAGI (08:00-20:00)</span>
                <span className="font-extrabold text-slate-800">{todaySchedule?.shift_pagi || 'Pak Eko'}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">🌙 MALAM (20:00-08:00)</span>
                <span className="font-extrabold text-slate-800">
                  {todaySchedule?.shift_malam === 'LIBUR'
                    ? 'LIBUR (Mandiri)'
                    : todaySchedule?.shift_malam || 'Pak Mulyadi'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-teal-700 font-bold text-right">
              Buka Kalender & Generator Laporan WA →
            </p>
          </div>
        </div>

        {/* KOLOM KANAN (lg:col-span-8): AREA KONTEN DINAMIS 4 TAB */}
        <div className="lg:col-span-8 space-y-5">
          {/* ================= TAB 1: BERANDA (100% V2 UTUH + LINK BUKTI V4) ================= */}
          {activeTab === 'beranda' && (
            <>
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">
                      Laporan & Rincian Kas 5 Bulan Terakhir (Oktober – Juni 2026)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Diurutkan dari yang terbaru ke terlama • Klik bulan untuk melihat rincian per
                      kategori & proyek
                    </p>
                  </div>
                  <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full font-bold">
                    Terbaru di Atas ↓
                  </span>
                </div>

                {copyMonthNotice && (
                  <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                    {copyMonthNotice}
                  </div>
                )}

                <div className="space-y-3">
                  {monthlyClosings
                    .filter((c) => c.status_tutup_buku === 'CLOSED')
                    .map((item) => {
                      const maxVal = 5200000;
                      const inPct = Math.min(100, Math.round((item.uang_masuk / maxVal) * 100));
                      const outPct = Math.min(
                        100,
                        Math.round((item.total_pengeluaran / maxVal) * 100)
                      );
                      const isExpanded = expandedMonth === item.periode_bulan;
                      const breakdown = getMonthlyBreakdown(item.periode_bulan, item.periode_tahun);

                      return (
                        <div
                          key={item.id}
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
                                <button
                                  type="button"
                                  onClick={async (ev) => {
                                    ev.stopPropagation();
                                    const txt = generateMonthlyFinanceWaText(item);
                                    try {
                                      await navigator.clipboard.writeText(txt);
                                    } catch (e) {
                                      console.warn(e);
                                    }
                                    setCopyMonthNotice(`✅ Format WA Laporan ${item.periode_bulan} ${item.periode_tahun} berhasil disalin!`);
                                    setTimeout(() => setCopyMonthNotice(''), 3500);
                                  }}
                                  className="px-2.5 py-0.5 rounded-lg bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 font-bold text-[11px]"
                                >
                                  📋 Copas WA
                                </button>
                                <span className="text-xs font-bold text-teal-700">
                                  {isExpanded ? '▲ Tutup Rincian' : '▼ Lihat Rincian'}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                              <div>
                                <div className="flex justify-between text-emerald-700 font-semibold mb-1">
                                  <span>Uang Masuk</span>
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
                                    {item.pengeluaran_proyek > 0
                                      ? ` (Termasuk Proyek ${formatRp(item.pengeluaran_proyek)})`
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

                              <div>
                                <p className="font-extrabold text-slate-700 mb-1">
                                  Breakdown Pemasukan per Kategori:
                                </p>
                                <ul className="space-y-1 pl-2">
                                  {Object.keys(breakdown.pemasukanMap).map((kat) => (
                                    <li key={kat} className="text-emerald-800 font-semibold">
                                      • {kat}: {formatRp(breakdown.pemasukanMap[kat])}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <p className="font-extrabold text-slate-700 mb-1.5">
                                  Breakdown Pengeluaran per Kategori (Beserta Rincian & Bukti):
                                </p>
                                <div className="space-y-1.5">
                                  {Object.keys(breakdown.pengeluaranMap).map((kat) => {
                                    const group = breakdown.pengeluaranMap[kat];
                                    const evidenceItems = (group.itemsRaw || []).filter((tx) =>
                                      isValidEvidenceUrl(tx.url_bukti)
                                    );
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
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                          <span className="font-semibold text-slate-600">
                                            detail:
                                          </span>{' '}
                                          {group.details.join(', ')}
                                        </p>
                                        {evidenceItems.length > 0 && (
                                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                                            {evidenceItems.map((evTx) => (
                                              <a
                                                key={evTx.id}
                                                href={evTx.url_bukti}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100"
                                              >
                                                📎 Bukti: {evTx.keterangan}
                                              </a>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {breakdown.proyekList.length > 0 && (
                                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                                  <p className="font-extrabold text-amber-900 mb-1">
                                    Detail Proyek Bulan {item.periode_bulan}:
                                  </p>
                                  <ul className="space-y-1 text-amber-900 font-medium">
                                    {breakdown.proyekList.map((p, i) => (
                                      <li key={i} className="flex items-center justify-between">
                                        <span>
                                          • {p.nama} —{' '}
                                          <span className="font-bold">{formatRp(p.nominal)}</span>
                                        </span>
                                        {isValidEvidenceUrl(p.url_bukti) && (
                                          <a
                                            href={p.url_bukti}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[10px] font-extrabold text-teal-800 underline"
                                          >
                                            📎 Lihat Nota Proyek
                                          </a>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Kartu Ringkasan 2 Kolom: Gaji Security & Struktur Beban Rutin (V2 Utuh) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70">
                  <h4 className="font-extrabold text-slate-800 text-sm mb-3">
                    👮 Transparansi Gaji Security (Terbaru: Oktober)
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    {securityPayroll
                      .filter((p) => p.periode_bulan === 'Oktober')
                      .map((p) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-extrabold text-slate-800">{p.nama_security}</p>
                            <p className="text-[11px] text-slate-500">
                              Pokok {formatRp(p.gaji_pokok)} • Kasbon {formatRp(p.potongan_kasbon)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-emerald-700">
                              {formatRp(p.gaji_bersih)}
                            </span>
                            <p className="text-[10px] text-slate-400">{p.status_pembayaran}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70">
                  <h4 className="font-extrabold text-slate-800 text-sm mb-3">
                    📌 Struktur Hunian & Beban Wajib Bulanan CMR
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Total Hunian (21 Aktif + 1 Non-Aktif)</span>
                      <span className="font-bold text-slate-800">22 Rumah</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Potensi Maksimal IPL (21 x Rp 200rb)</span>
                      <span className="font-bold text-emerald-700">Rp 4.200.000</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Gaji 2 Security (@1,65 Jt)</span>
                      <span className="font-bold text-slate-800">Rp 3.300.000</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">Retribusi Sampah & Listrik Pos</span>
                      <span className="font-extrabold text-teal-700">Rp 800.000</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= TAB 2: MUTASI KAS (V2 UTUH + TOMBOL BUKTI GOOGLE DRIVE V4) ================= */}
          {activeTab === 'mutasi' && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">
                    📑 Rincian Buku Kas Cluster (Urut Terbaru ke Terlama)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Menampilkan seluruh rincian transaksi beserta tautan foto bukti (Evidence) di Google Drive
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <select
                    value={filterBulanKas}
                    onChange={(e) => setFilterBulanKas(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 font-bold bg-slate-50"
                  >
                    {['Semua', 'November', 'Oktober', 'September', 'Agustus', 'Juli', 'Juni'].map(
                      (b) => (
                        <option key={b} value={b}>
                          {b === 'Semua' ? 'Semua Bulan' : `Periode ${b}`}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    value={filterKategoriKas}
                    onChange={(e) => setFilterKategoriKas(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 font-bold bg-slate-50"
                  >
                    <option value="ALL">Semua Kategori ({ledgerList.length})</option>
                    <option value="WITH_EVIDENCE">📎 Khusus Ada Foto Bukti</option>
                    <option value="Iuran Warga">Iuran Warga (IN)</option>
                    <option value="Gaji">Gaji & Kasbon Security</option>
                    <option value="Sampah">Uang Sampah</option>
                    <option value="Perawatan Pos">Perawatan Pos & Lingkungan</option>
                    <option value="Konsumsi">Konsumsi Pos</option>
                    <option value="Sosial">Dana Sosial</option>
                    <option value="Listrik">Listrik Pos</option>
                    <option value="Air">Air Galon Pos</option>
                    <option value="PROYEK">Khusus Proyek Cluster</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 block">Total Pemasukan Terfilter</span>
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
                {ledgerList.map((tx) => {
                  const isProyek =
                    Boolean(tx.is_proyek) && String(tx.is_proyek).toUpperCase() !== 'FALSE';
                  const isIn = String(tx.tipe).toUpperCase() === 'IN';
                  const hasEvidence = isValidEvidenceUrl(tx.url_bukti);

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl border border-slate-100 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                            isIn
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isIn ? '↓' : '↑'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-800">{tx.kategori}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                              {tx.periode_bulan} {tx.periode_tahun}
                            </span>
                            {isProyek && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                                Proyek: {tx.nama_proyek}
                              </span>
                            )}
                            {hasEvidence && (
                              <span className="text-[10px] bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md font-extrabold">
                                ✓ Evidence Teridentifikasi
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 font-medium mt-0.5">{tx.keterangan}</p>
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            <p className="text-[10px] text-slate-400">
                              Tanggal: {String(tx.tanggal).slice(0, 10)} • Kode: {tx.id}
                            </p>
                            {hasEvidence && (
                              <a
                                href={tx.url_bukti}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-extrabold text-teal-700 hover:text-teal-900 underline"
                              >
                                📎 Lihat Foto Nota (Drive) →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-extrabold text-sm ${
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
            </div>
          )}

          {/* ================= TAB 3: STATUS 22 RUMAH (V2 UTUH + LINK BUKTI IPL V4) ================= */}
          {activeTab === 'warga' && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">
                    🏘️ Daftar 22 Unit Rumah CMR (21 Aktif • 1 Non-Aktif BPR)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Pak Baim 2 Unit (No. 16 & No. 22) • Pak Dwi 2 Unit (No. 14 & No. 03 Kontrak Pak
                    Upen) • No. 04 Dijual Pihak BPR
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Cari nomor / nama warga..."
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
                    <option value="AKTIF">Hunian Aktif ({activeHousesCount})</option>
                    <option value="Lunas">Lunas ({totalLunasCount})</option>
                    <option value="Belum Lunas">Belum Lunas ({totalBelumLunasCount})</option>
                    <option value="Tidak Aktif">Tidak Aktif / BPR (1)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredHouses.map((h) => {
                  const isLunas = h.status_bayar === 'Lunas';
                  const isNonAktif = h.is_non_aktif;
                  const hasIplProof = isValidEvidenceUrl(h.url_bukti);

                  return (
                    <div
                      key={h.id}
                      className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${
                        isNonAktif
                          ? 'bg-slate-100/80 border-slate-300 opacity-80'
                          : isLunas
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-800 text-sm">{h.nomor_rumah}</span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isNonAktif
                                ? 'bg-slate-200 text-slate-700'
                                : isLunas
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isNonAktif ? 'Tidak Aktif (BPR)' : h.status_bayar}
                          </span>
                        </div>
                        <p className="font-bold text-slate-800 text-xs mt-1">{h.nama_warga}</p>
                        {h.alias_keluarga && (
                          <p className="text-[10px] text-slate-400 truncate">{h.alias_keluarga}</p>
                        )}
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {isNonAktif
                            ? 'Dijual oleh Pihak BPR (Bebas IPL)'
                            : `Tarif IPL: ${formatRp(h.tarif_ipl || 200000)}`}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] gap-1">
                        <div className="flex flex-col">
                          <span className="text-slate-400">
                            {isNonAktif
                              ? 'Non-Aktif'
                              : isLunas
                              ? `Tgl: ${String(h.tanggal_bayar).slice(0, 10)}`
                              : 'Periode Nov 2026'}
                          </span>
                          {hasIplProof && (
                            <a
                              href={h.url_bukti}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-extrabold text-teal-700 underline mt-0.5"
                            >
                              📎 Lihat Bukti IPL
                            </a>
                          )}
                        </div>
                        {!isNonAktif && !isLunas && (
                          <button
                            onClick={() => openQrisForHouse(h.id)}
                            className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-2.5 py-1 rounded-lg shadow-sm transition shrink-0"
                          >
                            Bayar QRIS →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 4: KEAMANAN & SOS (V2 + V3 + BUKTI FOTO DRIVE V4) ================= */}
          {activeTab === 'keamanan' && (
            <div className="space-y-5">
              {/* 1. KARTU PANIC BUTTON SOS (PERSIS V2) */}
              <div className="bg-gradient-to-br from-rose-600 to-red-800 text-white rounded-3xl p-5 shadow-md">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                      Fitur Darurat Warga CMR
                    </span>
                    <h4 className="font-black text-lg mt-1">🚨 SOS Panic Button Pos Security</h4>
                    <p className="text-xs text-rose-100 mt-0.5">
                      Tekan dan tahan tombol selama 3 detik untuk membunyikan alarm darurat di Pos
                      Jaga & mengirim peringatan ke grup WhatsApp warga.
                    </p>
                  </div>

                  <button
                    type="button"
                    onMouseDown={startSosHold}
                    onMouseUp={cancelSosHold}
                    onMouseLeave={cancelSosHold}
                    onTouchStart={startSosHold}
                    onTouchEnd={cancelSosHold}
                    className="w-full sm:w-48 py-4 rounded-2xl bg-white text-rose-700 font-black text-sm shadow-xl active:scale-95 transition select-none relative overflow-hidden shrink-0"
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

                {sosTriggered && (
                  <div className="mt-3 p-3 rounded-2xl bg-black/25 border border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold">
                      ✅ Sinyal SOS Aktif! Teruskan peringatan darurat ke Grup WA Warga:
                    </span>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        '*🚨 PERINGATAN DARURAT SOS CMR 🚨*\nMohon bantuan segera petugas Security (' +
                          (todaySchedule?.shift_pagi || 'Pak Eko') +
                          ') & warga, terdapat kondisi darurat di lingkungan Cluster Mutiara Residence!'
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-white text-rose-800 font-extrabold px-3.5 py-1.5 rounded-xl shadow"
                    >
                      📲 Kirim SOS ke WA
                    </a>
                  </div>
                )}
              </div>

              {/* 2. KALENDER DINAMIS MINIMALIS 1 BULAN (V3) */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">
                      🗓️ Kalender Jadwal Security (Pak Eko & Pak Mulyadi)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Jumat & Sabtu tetap jaga Pagi, sedangkan Malam <strong>LIBUR</strong> (Gerbang Mandiri 20:00) • Minggu kembali normal 2 shift
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevMonth}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 font-extrabold text-sm"
                    >
                      ‹
                    </button>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-800 px-2">
                      {calendarData.monthName} {calendarData.year}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 font-extrabold text-sm"
                    >
                      ›
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                    ☀️ Shift Pagi (08:00 - 20:00): Eko / Mul
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
                    🌙 Shift Malam (20:00 - 08:00): Mul / Eko
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                    🔓 Jumat & Sabtu Malam: LIBUR (Gerbang Mandiri)
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-extrabold text-slate-400">
                  <div>Min</div>
                  <div>Sen</div>
                  <div>Sel</div>
                  <div>Rab</div>
                  <div>Kam</div>
                  <div className="text-amber-600">Jum</div>
                  <div className="text-amber-600">Sab</div>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: calendarData.firstDayDow }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-2xl bg-slate-50/60" />
                  ))}

                  {calendarData.days.map((d) => {
                    const isNightOff = d.shift_malam === 'LIBUR';
                    const isRotationSat = d.dow === 6;
                    const isSelected = selectedCalDay?.tanggal === d.tanggal;
                    const shortPagi = String(d.shift_pagi).replace('Pak ', '');
                    const shortMalam = isNightOff ? 'LIBUR' : String(d.shift_malam).replace('Pak ', '');

                    return (
                      <button
                        key={d.tanggal}
                        type="button"
                        onClick={() => {
                          setSelectedCalDay(d);
                          setScheduleEditForm({
                            tanggal: d.tanggal,
                            hari: d.hari,
                            periode_bulan: d.periode_bulan,
                            periode_tahun: d.periode_tahun,
                            shift_pagi: d.shift_pagi,
                            jam_pagi: d.jam_pagi,
                            shift_malam: d.shift_malam,
                            jam_malam: d.jam_malam,
                            status_jadwal: d.status_jadwal,
                            catatan_jadwal: d.catatan_jadwal
                          });
                        }}
                        className={`h-16 sm:h-20 rounded-2xl p-1.5 flex flex-col justify-between text-left border transition ${
                          isSelected
                            ? 'ring-2 ring-teal-600 border-teal-600 bg-teal-50/40'
                            : isNightOff
                            ? 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] font-extrabold text-slate-700">
                            {d.dayNumber}
                          </span>
                          {isRotationSat && (
                            <span className="text-[10px]" title="Pertukaran Shift Mingguan">
                              🔄
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 w-full">
                          <div className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-900 truncate">
                            ☀️ {shortPagi}
                          </div>
                          <div
                            className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded truncate ${
                              isNightOff
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-indigo-100 text-indigo-900'
                            }`}
                          >
                            🌙 {shortMalam}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedCalDay && scheduleEditForm && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-teal-700">
                          Detail & Penyesuaian Jadwal Harian
                        </span>
                        <h5 className="font-extrabold text-slate-800 text-sm">
                          {selectedCalDay.hari}, {selectedCalDay.tanggal}
                        </h5>
                      </div>
                      <button
                        onClick={() => setSelectedCalDay(null)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-xs text-slate-600">{selectedCalDay.catatan_jadwal}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          ☀️ Petugas Shift Pagi (08:00 - 20:00)
                        </label>
                        <select
                          value={scheduleEditForm.shift_pagi}
                          onChange={(e) =>
                            setScheduleEditForm({ ...scheduleEditForm, shift_pagi: e.target.value })
                          }
                          className="w-full border rounded-xl px-3 py-2 font-bold bg-white"
                        >
                          <option value="Pak Eko">Pak Eko</option>
                          <option value="Pak Mulyadi">Pak Mulyadi</option>
                          <option value="IZIN / GERBANG MANDIRI">IZIN / GERBANG MANDIRI</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          🌙 Petugas Shift Malam (20:00 - 08:00)
                        </label>
                        <select
                          value={scheduleEditForm.shift_malam}
                          onChange={(e) =>
                            setScheduleEditForm({
                              ...scheduleEditForm,
                              shift_malam: e.target.value,
                              jam_malam:
                                e.target.value === 'LIBUR'
                                  ? 'Gerbang Mandiri (20:00)'
                                  : '20:00 - 08:00'
                            })
                          }
                          className="w-full border rounded-xl px-3 py-2 font-bold bg-white"
                        >
                          <option value="Pak Mulyadi">Pak Mulyadi</option>
                          <option value="Pak Eko">Pak Eko</option>
                          <option value="LIBUR">LIBUR (Jumat/Sabtu Malam)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateSecuritySchedule) {
                          onUpdateSecuritySchedule(scheduleEditForm);
                        }
                        setSelectedCalDay(scheduleEditForm);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs shadow-sm"
                    >
                      💾 Simpan Jadwal Tanggal Ini
                    </button>
                  </div>
                )}
              </div>

              {/* 3. GENERATOR LAPORAN WA SIAP COPAS & KAMERA WATERMARK (V3 + AUTO-DRIVE V4) */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border-2 border-teal-600/25 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      Bebas Typo • Foto Tersimpan ke Drive Log_Absensi_Security
                    </span>
                    <h4 className="font-extrabold text-slate-800 text-base mt-1">
                      📋 Generator Absen, Patroli 5–6 Titik & Laporan WA Security
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      👮 Petugas Pelapor
                    </label>
                    <select
                      value={secOfficer}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSecOfficer(val);
                        setSecPartnerOfficer(val === 'Pak Eko' ? 'Pak Mulyadi' : 'Pak Eko');
                      }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 font-extrabold bg-slate-50"
                    >
                      <option value="Pak Eko">Pak Eko</option>
                      <option value="Pak Mulyadi">Pak Mulyadi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      🕒 Shift & Cuaca (815)
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <select
                        value={secShift}
                        onChange={(e) => setSecShift(e.target.value)}
                        className="border border-slate-200 rounded-xl px-2 py-2 font-bold bg-slate-50"
                      >
                        <option value="Pagi">☀️ Pagi</option>
                        <option value="Malam">🌙 Malam</option>
                      </select>
                      <select
                        value={secWeather815}
                        onChange={(e) => setSecWeather815(e.target.value)}
                        className="border border-slate-200 rounded-xl px-2 py-2 font-bold bg-slate-50"
                      >
                        <option value="Cerah">Cerah</option>
                        <option value="Panas Terik">Panas</option>
                        <option value="Mendung">Mendung</option>
                        <option value="Hujan">Hujan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      📅 Tanggal Laporan
                    </label>
                    <input
                      type="date"
                      value={secDate}
                      onChange={(e) => setSecDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 font-semibold bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      ⏰ Jam Laporan (WIB)
                    </label>
                    <input
                      type="time"
                      value={secTime}
                      onChange={(e) => setSecTime(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 font-semibold bg-slate-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-extrabold">
                  {[
                    { id: 'ABSEN_SHIFT', icon: '🤳', label: 'Absen Ganti Shift' },
                    { id: 'PATROLI', icon: '🔦', label: 'Patroli 5–6 Titik' },
                    { id: 'PAKET_SURAT', icon: '📦', label: 'Paket / Surat / COD' },
                    { id: 'IZIN_POS', icon: '🕌', label: 'Izin ISOMA / Jumatan' },
                    { id: 'ANOMALI', icon: '⚡', label: 'Anomali / Insiden' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSecGeneratorMode(m.id)}
                      className={`py-2.5 px-3 rounded-xl border transition flex items-center justify-center gap-1.5 ${
                        secGeneratorMode === m.id
                          ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  {/* Kolom Form Pilihan */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                    {secGeneratorMode === 'ABSEN_SHIFT' && (
                      <>
                        <div>
                          <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                            Jenis Absen / Pergantian Shift:
                          </label>
                          <select
                            value={absenSubType}
                            onChange={(e) => setAbsenSubType(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 font-bold bg-white"
                          >
                            <option value="SERAH_TERIMA_PAGI">
                              ☀️ Absen Pagi (08:00) — Selesai Malam ke Petugas Pagi
                            </option>
                            <option value="SERAH_TERIMA_MALAM">
                              🌙 Absen Malam (20:00) — Selesai Pagi ke Petugas Malam
                            </option>
                            <option value="TUTUP_POS_MALAM_LIBUR">
                              🔓 Tutup Pos Jumat/Sabtu Malam (20:00 — Malam Libur)
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            Catatan Serah Terima Pos / Titipan Paket:
                          </label>
                          <input
                            type="text"
                            value={absenNote}
                            onChange={(e) => setAbsenNote(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 bg-white"
                          />
                        </div>
                      </>
                    )}

                    {secGeneratorMode === 'PATROLI' && (
                      <>
                        <div>
                          <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                            Jadwal Patroli Rutin:
                          </label>
                          <select
                            value={patrolTimeSlot}
                            onChange={(e) => setPatrolTimeSlot(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 font-bold bg-white"
                          >
                            <option value="Pagi (09:00 WIB)">☀️ Patroli Pagi — Pukul 09:00 WIB</option>
                            <option value="Siang Jelang Dzuhur (12:00 WIB)">☀️ Patroli Siang — Pukul 12:00 WIB</option>
                            <option value="Sore (15:00 WIB)">🌤️ Patroli Sore — Pukul 15:00 WIB</option>
                            <option value="Jelang Maghrib & Lampu (17:45 WIB)">🌆 Patroli Maghrib — Pukul 17:45 WIB</option>
                            <option value="Malam Awal (19:00 / 22:00 WIB)">🌙 Patroli Malam — Pukul 22:00 WIB</option>
                            <option value="Tengah Malam (23:00 / 00:00 WIB)">🌙 Kontrol Gerbang — Pukul 23:00 WIB</option>
                            <option value="Dini Hari Rawan (02:00 WIB)">🦉 Patroli Dini Hari — Pukul 02:00 WIB</option>
                            <option value="Subuh (05:00 WIB)">🕌 Patroli Subuh — Pukul 05:00 WIB</option>
                            <option value="Pagi Akhir Shift (07:00 WIB)">🌅 Kontrol Pagi — Pukul 07:00 WIB</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            Checklist 5–6 Titik Lokasi yang Difoto:
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                            {[
                              'Pos Utama Security',
                              'Gerbang Utama & Pintu Kecil',
                              'Gang Depan (Blok A1 - A11)',
                              'Gang Belakang / Side B (Blok A12 - A22)',
                              'Area Lapangan & Parkir',
                              'Lampu Sorot & Gembok Pagar'
                            ].map((pt) => (
                              <label
                                key={pt}
                                className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={patrolPoints.includes(pt)}
                                  onChange={() => togglePatrolPoint(pt)}
                                />
                                <span className="truncate font-semibold">{pt}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            Status Pintu Gerbang SOP:
                          </label>
                          <select
                            value={secGateStatus}
                            onChange={(e) => setSecGateStatus(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 font-bold bg-white"
                          >
                            <option value="Pintu gerbang kecil ditutup sesuai SOP">
                              🔒 Pintu gerbang kecil ditutup sesuai SOP
                            </option>
                            <option value="Pintu gerbang utama & kecil dikunci penuh (Malam)">
                              🔐 Pintu gerbang utama & kecil dikunci penuh (Malam)
                            </option>
                            <option value="Pintu gerbang dibuka terpantau pos security">
                              🔓 Pintu gerbang dibuka terpantau pos security
                            </option>
                          </select>
                        </div>
                      </>
                    )}

                    {secGeneratorMode === 'PAKET_SURAT' && (
                      <>
                        <div>
                          <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                            Pilih Nomor Rumah Tujuan (Otomatis Nama Bapak/Ibu/Anak):
                          </label>
                          <select
                            value={pkgHouseId}
                            onChange={(e) => {
                              setPkgHouseId(e.target.value);
                              setPkgRecipientCustom('');
                            }}
                            className="w-full border rounded-xl px-3 py-2 font-extrabold bg-white"
                          >
                            {houses.map((h) => (
                              <option key={h.id} value={h.id}>
                                Blok A {h.nomor_rumah} — {h.alias_keluarga || h.nama_warga}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">
                              Jenis Paket / Surat
                            </label>
                            <select
                              value={pkgType}
                              onChange={(e) => setPkgType(e.target.value)}
                              className="w-full border rounded-xl px-2.5 py-2 font-bold bg-white"
                            >
                              <option value="1 Paket Reguler">📦 1 Paket Reguler</option>
                              <option value="2 Paket Reguler">📦 2 Paket Reguler</option>
                              <option value="Paket COD (Bayar di Tempat)">💵 Paket COD</option>
                              <option value="Surat Pribadi / Dokumen Bank">✉️ Surat / Dokumen Bank</option>
                              <option value="Titipan Makanan / GoFood">🍱 Titipan Makanan</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">
                              Status Posisi Paket
                            </label>
                            <select
                              value={pkgHandling}
                              onChange={(e) => setPkgHandling(e.target.value)}
                              className="w-full border rounded-xl px-2.5 py-2 font-bold bg-white"
                            >
                              <option value="Disimpan di Pos Security (Menunggu diambil)">
                                🏢 Disimpan di Pos
                              </option>
                              <option value="Sudah diantar langsung ke rumah warga oleh security">
                                🛵 Diantar ke Rumah
                              </option>
                              <option value="Sudah diambil langsung oleh Bapak / Ibu">
                                ✅ Sudah Diambil
                              </option>
                              <option value="Dibayar menggunakan uang titipan COD di Pos">
                                💰 Lunas Titipan COD Pos
                              </option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">
                              Nama Khusus (Opsional)
                            </label>
                            <input
                              type="text"
                              placeholder={selectedPkgHouseObj.alias_keluarga}
                              value={pkgRecipientCustom}
                              onChange={(e) => setPkgRecipientCustom(e.target.value)}
                              className="w-full border rounded-xl px-3 py-1.5 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">
                              Nominal COD (Jika COD)
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: 125.000"
                              value={pkgCodAmount}
                              onChange={(e) => setPkgCodAmount(e.target.value)}
                              className="w-full border rounded-xl px-3 py-1.5 bg-white"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {secGeneratorMode === 'IZIN_POS' && (
                      <>
                        <div>
                          <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                            Keperluan Izin Tinggalkan Pos Sementara:
                          </label>
                          <select
                            value={izinType}
                            onChange={(e) => setIzinType(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 font-bold bg-white"
                          >
                            <option value="ISOMA & Sholat Dzuhur (Pukul 12:00 WIB)">
                              🍱 ISOMA, Makan Siang & Sholat Dzuhur
                            </option>
                            <option value="Ibadah Sholat Jumat (Pukul 11:40 WIB)">
                              🕌 Ibadah Sholat Jumat
                            </option>
                            <option value="Sholat Maghrib / Isya Sementara">
                              🤲 Ibadah Sholat Maghrib / Isya
                            </option>
                            <option value="Beli Makan / Air Galon Pos Sebentar">
                              🚰 Beli Makan / Air Galon Pos
                            </option>
                            <option value="Izin Urusan Keluarga Mendesak / Sakit">
                              🏥 Izin Darurat Keluarga / Kurang Sehat
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            Status Pengamanan Gerbang Saat Ditinggal:
                          </label>
                          <input
                            type="text"
                            value={izinDuration}
                            onChange={(e) => setIzinDuration(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 bg-white"
                          />
                        </div>
                      </>
                    )}

                    {secGeneratorMode === 'ANOMALI' && (
                      <>
                        <div>
                          <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                            Kategori Kejadian / Anomali Lapangan:
                          </label>
                          <select
                            value={anomalySubCategory}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAnomalySubCategory(val);
                              if (val.includes('Galon')) {
                                setAnomalyDetail('Pengisian 1 galon air minum pos security (dicatat untuk reimburse bulanan bendahara).');
                                setAnomalyAction('Sudah dicatat di buku pos & counter galon C-Money');
                              } else if (val.includes('Sampah')) {
                                setAnomalyDetail('Pengambilan sampah mingguan warga cluster oleh Bang Adi sedang berlangsung.');
                                setAnomalyAction('Gerbang dibuka & warga diimbau mengeluarkan sampah');
                              } else if (val.includes('Tamu')) {
                                setAnomalyDetail('Tamu / kerabat warga datang mengambil barang atau survei unit rumah.');
                                setAnomalyAction('KTP tamu sudah difoto & nomor HP sudah dicatat sesuai SOP');
                              } else if (val.includes('Listrik')) {
                                setAnomalyDetail('Terjadi pemadaman listrik dari PLN / gangguan kabel sekitar cluster.');
                                setAnomalyAction('Sudah dicek langsung ke lokasi & dipantau dari pos');
                              } else if (val.includes('Pagar')) {
                                setAnomalyDetail('Kendala pada roda pagar utama / lampu sorot pos / MCB.');
                                setAnomalyAction('Dilaporkan ke pengurus untuk tindak lanjut perbaikan');
                              }
                            }}
                            className="w-full border rounded-xl px-3 py-2 font-bold bg-white"
                          >
                            <option value="Listrik PLN Padam / Gangguan Gardu">
                              ⚡ Listrik PLN Padam / Ledakan Kabel
                            </option>
                            <option value="Kerusakan Pagar / Lampu Sorot / CCTV">
                              🔧 Kerusakan Roda Pagar / Lampu Sorot / MCB
                            </option>
                            <option value="Tamu Ambil Barang / Survei Bank (Wajib KTP)">
                              🪪 Tamu Ambil Barang / Survei Unit (Verifikasi KTP)
                            </option>
                            <option value="Pengambilan Sampah Mingguan (Bang Adi)">
                              🚛 Pengambilan Sampah Mingguan (Bang Adi)
                            </option>
                            <option value="Pengisian Air Galon Pos Security (+1 Counter)">
                              🚰 Pengisian Air Galon Pos Security (+1 Reimburse)
                            </option>
                            <option value="Izin Parkir Lapangan / Acara / Renovasi Warga">
                              🚗 Izin Parkir Lapangan / Acara / Renovasi Rumah
                            </option>
                            <option value="Musibah / Info Darurat Warga">
                              🚑 Info Musibah / Darurat Warga Cluster
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            Terkait Rumah Nomor Berapa? (Opsional)
                          </label>
                          <select
                            value={anomalyHouseId}
                            onChange={(e) => setAnomalyHouseId(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 font-bold bg-white"
                          >
                            <option value="-">Seluruh Lingkungan Cluster CMR</option>
                            {houses.map((h) => (
                              <option key={h.id} value={h.id}>
                                Blok A {h.nomor_rumah} — {h.alias_keluarga || h.nama_warga}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            Keterangan Detail di Lapangan:
                          </label>
                          <input
                            type="text"
                            value={anomalyDetail}
                            onChange={(e) => setAnomalyDetail(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            Tindakan Security / SOP:
                          </label>
                          <input
                            type="text"
                            value={anomalyAction}
                            onChange={(e) => setAnomalyAction(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 bg-white"
                          />
                        </div>
                      </>
                    )}

                    {/* Kamera Watermark + Simpan Otomatis ke Folder Drive Log_Absensi_Security */}
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-extrabold text-teal-900">
                            📷 Kamera Watermark Realtime
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Otomatis masuk ke folder Drive: <strong>Log_Absensi_Security</strong>
                          </p>
                        </div>
                        <label className="cursor-pointer bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-extrabold px-3 py-2 rounded-xl shadow-sm shrink-0">
                          + Ambil Foto
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            onChange={handleCaptureWatermarkedPhoto}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {watermarkedPhotos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          {watermarkedPhotos.map((p) => (
                            <div key={p.id} className="rounded-xl overflow-hidden border border-teal-300 bg-black">
                              <img src={p.dataUrl} alt={p.name} className="w-full h-16 object-cover" />
                              <a
                                href={p.dataUrl}
                                download={`CMR_${secOfficer.replace(' ', '_')}_${secDate}.jpg`}
                                className="block text-center bg-teal-800 text-white text-[9px] font-bold py-1"
                              >
                                ⬇ Unduh WM
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kolom Preview Teks WA & Tombol Eksekusi */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase text-slate-500">
                        Preview Teks WhatsApp (Siap Copas):
                      </span>
                      <span className="text-[11px] text-emerald-700 font-bold">
                        0% Typo • Otomatis
                      </span>
                    </div>

                    <pre className="w-full whitespace-pre-wrap bg-slate-900 text-emerald-300 text-xs font-mono p-4 rounded-2xl border border-slate-700 leading-relaxed min-h-[180px]">
                      {generatedSecurityWaText}
                    </pre>

                    {copyWaSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-extrabold text-emerald-800">
                        {copyWaSuccess}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleCopyAndSaveSecurityReport(false)}
                        className="py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs shadow-md transition"
                      >
                        📋 Salin Teks & Simpan Log
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyAndSaveSecurityReport(true)}
                        className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition"
                      >
                        📲 Kirim ke WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. RIWAYAT LOG LAPORAN & CATATAN ANOMALI SECURITY (V3 + LINK FOTO DRIVE V4) */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">
                      🗂️ Riwayat Log & Anomali Lapangan (Terbaru di Atas)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Menampilkan {filteredSecurityLogs.length} rekaman absen, patroli, paket & insiden lingkungan
                    </p>
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-extrabold">
                    {[
                      { id: 'ALL', label: 'Semua Log' },
                      { id: 'ABSEN_SHIFT', label: 'Absen Shift' },
                      { id: 'PATROLI', label: 'Patroli' },
                      { id: 'PAKET_SURAT', label: 'Paket & COD' },
                      { id: 'ANOMALI_FASILITAS', label: 'Anomali/Insiden' },
                      { id: 'TAMU_COD', label: 'Tamu & Bank' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setLogCategoryFilter(cat.id)}
                        className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                          logCategoryFilter === cat.id
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                  {filteredSecurityLogs.map((log) => {
                    const logDriveUrl = extractEvidenceUrlFromText(log.detail_catatan);
                    const cleanCatatan = String(log.detail_catatan || '').replace(/\[Foto Bukti:.*?\]/g, '').trim();

                    return (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-teal-100 text-teal-900">
                                {log.nama_security} ({log.shift})
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                                {log.sub_kategori || log.kategori_laporan}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold shrink-0">
                              {String(log.tanggal).slice(0, 10)} • {log.jam}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-slate-800">{cleanCatatan}</p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 mt-2 border-t border-slate-200/70 gap-2">
                          <span className="truncate">
                            📍 {log.titik_patroli || 'Pos Security'} • 815: {log.cuaca_815 || 'Cerah'}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {logDriveUrl && (
                              <a
                                href={logDriveUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 font-extrabold hover:underline"
                              >
                                📎 Foto Drive
                              </a>
                            )}
                            {log.teks_wa && (
                              <button
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(log.teks_wa);
                                    setCopyWaSuccess(`✅ Teks WA log ${log.id} disalin ulang!`);
                                    setTimeout(() => setCopyWaSuccess(''), 3000);
                                  } catch (e) {
                                    console.warn(e);
                                  }
                                }}
                                className="text-teal-700 font-extrabold hover:underline"
                              >
                                📋 Copas WA
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. PETUGAS SECURITY AKTIF & RIWAYAT GAJI (PERSIS V2) */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-extrabold text-slate-800 text-base">
                    🛡️ Petugas Security Aktif & Riwayat Gaji (Terbaru di Atas)
                  </h4>
                  <span className="text-[11px] text-teal-700 font-bold">Oktober → September</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {securityPayroll.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800 text-sm">
                          {item.nama_security}
                        </span>
                        <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                          {item.periode_bulan} {item.periode_tahun}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Gaji Pokok:</span>
                        <span className="font-semibold text-slate-700">
                          {formatRp(item.gaji_pokok)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Potongan Kasbon:</span>
                        <span className="font-semibold text-rose-600">
                          - {formatRp(item.potongan_kasbon)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-slate-200 font-extrabold text-emerald-700">
                        <span>Diterima Bersih:</span>
                        <span>{formatRp(item.gaji_bersih)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. SLOT PANTAU 4 TITIK CCTV CLUSTER (PERSIS V2) */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">
                      📹 Pantauan CCTV Lingkungan CMR (iCSee & RTSP)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Pos Security Depan & Side B (Depan Rumah Pak Yose) • Dilarang hapus rekaman
                    </p>
                  </div>
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
                    4 Channel Aktif
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'CAM 01 — Gerbang Utama & Pos Security',
                    'CAM 02 — Side B (Area Belakang / Depan Pak Yose)',
                    'CAM 03 — Persimpangan Gang Depan Blok A',
                    'CAM 04 — Area Lapangan & Titik Kumpul'
                  ].map((cam, idx) => (
                    <div
                      key={idx}
                      className="aspect-video rounded-2xl bg-slate-900 text-white p-3.5 flex flex-col justify-between relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold bg-black/50 px-2.5 py-0.5 rounded-md">
                          {cam}
                        </span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          ● LIVE iCSee
                        </span>
                      </div>
                      <div className="text-center my-auto">
                        <p className="text-xs text-slate-400">
                          Stream iCSee / RTSP Pos Jaga CMR
                        </p>
                      </div>
                      <div className="text-[10px] text-slate-400 flex justify-between">
                        <span>Cluster Mutiara Residence</span>
                        <span>CH-0{idx + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* BOTTOM NAVIGATION BAR KHUSUS HP (md:hidden — PERSIS V2) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-5 py-2 flex justify-between items-center text-xs z-30 shadow-lg">
        <button
          onClick={() => setActiveTab('beranda')}
          className={`flex flex-col items-center ${
            activeTab === 'beranda' ? 'text-teal-700 font-extrabold' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">🏠</span>
          <span>Beranda</span>
        </button>

        <button
          onClick={() => setActiveTab('mutasi')}
          className={`flex flex-col items-center ${
            activeTab === 'mutasi' ? 'text-teal-700 font-extrabold' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">📑</span>
          <span>Mutasi Kas</span>
        </button>

        <button
          onClick={() => openQrisForHouse('H-01')}
          className="flex flex-col items-center -mt-6"
        >
          <div className="w-14 h-14 rounded-full bg-teal-700 text-white flex items-center justify-center shadow-lg border-4 border-white text-xl">
            📲
          </div>
          <span className="text-[10px] font-extrabold text-teal-800 mt-0.5">QRIS IPL</span>
        </button>

        <button
          onClick={() => setActiveTab('warga')}
          className={`flex flex-col items-center ${
            activeTab === 'warga' ? 'text-teal-700 font-extrabold' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">🏘️</span>
          <span>22 Rumah</span>
        </button>

        <button
          onClick={() => setActiveTab('keamanan')}
          className={`flex flex-col items-center ${
            activeTab === 'keamanan' ? 'text-teal-700 font-extrabold' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">🛡️</span>
          <span>Keamanan</span>
        </button>
      </div>

      {/* MODAL POP-UP QRIS (KOMPATIBEL DENGAN V2, V3 & V4 DRIVE UPLOAD) */}
      <QrisPaymentModal
        isOpen={isQrisOpen}
        onClose={() => setIsQrisOpen(false)}
        initialHouse={qrisHouseId}
        defaultSelectedHouse={qrisHouseId}
        merchantName={data.qris_merchant_name}
        nmid={data.qris_nmid}
        qrisImageUrl={data.qris_image_url}
        defaultAmount={data.default_ipl_amount}
        houses={houses}
        onConfirmUpload={onConfirmQrisProof || onUploadIplProof}
        onConfirmPayment={onConfirmQrisProof || onUploadIplProof}
      />
    </div>
  );
}
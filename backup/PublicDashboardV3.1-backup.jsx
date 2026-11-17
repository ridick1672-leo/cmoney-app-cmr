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
  { id: 'TX-202610-10', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Air', is_proyek: false, nama_proyek: '', nominal: 60000, keterangan: 'Air Minum Galon' },
  { id: 'TX-202610-09', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Token Listrik' },
  { id: 'TX-202610-08', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 350000, keterangan: 'Kasbon pak eko' },
  { id: 'TX-202610-07', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Lampu jalan + jasa pasang' },
  { id: 'TX-202610-06', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1300000, keterangan: 'Gaji pak eko (Sisa potong kasbon)' },
  { id: 'TX-202610-05', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1650000, keterangan: 'Gaji pak mulyadi' },
  { id: 'TX-202610-04', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 700000, keterangan: 'Uang sampah Oktober' },
  { id: 'TX-202610-03', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 50000, keterangan: 'Ganti Fitting lampu dan jasa pasang' },
  { id: 'TX-202610-02', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 8000, keterangan: 'Beli baterai jam pos' },
  { id: 'TX-202610-01', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 4200000, keterangan: 'Iuran Warga Oktober (21 Rumah Aktif)' },
  // SEPTEMBER 2026
  { id: 'TX-202609-12', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 210000, keterangan: 'Perbaikan Pagar' },
  { id: 'TX-202609-11', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 500000, keterangan: 'Kasbon pak Eko 2x' },
  { id: 'TX-202609-10', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 47000, keterangan: 'Alat kebersihan' },
  { id: 'TX-202609-09', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Ganti dinamo kipas pos' },
  { id: 'TX-202609-08', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi', is_proyek: false, nama_proyek: '', nominal: 57300, keterangan: 'Kopi dan Gula' },
  { id: 'TX-202609-07', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sosial', is_proyek: false, nama_proyek: '', nominal: 300000, keterangan: 'Dana Sosial' },
  { id: 'TX-202609-06', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 240000, keterangan: 'Plang Nama CMR + Rokok' },
  { id: 'TX-202609-05', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 50000, keterangan: 'Lampu dan laminating' },
  { id: 'TX-202609-04', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1100000, keterangan: 'Gaji pak Eko (Sisa potong kasbon)' },
  { id: 'TX-202609-03', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1600000, keterangan: 'Gaji pak Mulyadi' },
  { id: 'TX-202609-02', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 700000, keterangan: 'Uang Sampah September' },
  { id: 'TX-202609-01', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 4100000, keterangan: 'Iuran Warga September' },
  // AGUSTUS 2026
  { id: 'TX-202608-11', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Air', is_proyek: false, nama_proyek: '', nominal: 36000, keterangan: 'Galon Pos 6x' },
  { id: 'TX-202608-10', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Listrik Pos Agustus' },
  { id: 'TX-202608-09', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 235000, keterangan: 'Lampu Sorot 3 pcs' },
  { id: 'TX-202608-08', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 112500, keterangan: 'Bendera Merah Putih & Umbul-umbul' },
  { id: 'TX-202608-07', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi', is_proyek: false, nama_proyek: '', nominal: 145000, keterangan: 'Kopi, Gula, Teh Pos' },
  { id: 'TX-202608-06', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 350000, keterangan: 'Kasbon Pak Eko' },
  { id: 'TX-202608-05', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 120000, keterangan: 'Uang Lembur Security' },
  { id: 'TX-202608-04', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1000000, keterangan: 'Gaji Pak Rizki' },
  { id: 'TX-202608-03', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1600000, keterangan: 'Gaji Pak Eko' },
  { id: 'TX-202608-02', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 700000, keterangan: 'Uang Sampah Agustus' },
  { id: 'TX-202608-01', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 4300000, keterangan: 'Iuran Warga Agustus' },
  // JULI 2026
  { id: 'TX-202607-11', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Proyek', is_proyek: true, nama_proyek: 'Penambahan Kabel & Lampu Jalan', nominal: 500000, keterangan: 'Proyek Penambahan Kabel & Lampu Jalan' },
  { id: 'TX-202607-10', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Air', is_proyek: false, nama_proyek: '', nominal: 30000, keterangan: 'Galon Pos 5x' },
  { id: 'TX-202607-09', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Listrik Pos Juli' },
  { id: 'TX-202607-08', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 85800, keterangan: 'Gembok Pos & Kunci Cadangan' },
  { id: 'TX-202607-07', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi', is_proyek: false, nama_proyek: '', nominal: 120000, keterangan: 'Kopi, Gula, Teh Pos' },
  { id: 'TX-202607-06', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sosial', is_proyek: false, nama_proyek: '', nominal: 500000, keterangan: 'Dana Sosial Warga Sakit' },
  { id: 'TX-202607-05', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 150000, keterangan: 'Kasbon Pak Eko' },
  { id: 'TX-202607-04', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1450000, keterangan: 'Gaji Pak Eko (Sisa potong kasbon)' },
  { id: 'TX-202607-03', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1500000, keterangan: 'Gaji Pak Rizki' },
  { id: 'TX-202607-02', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 700000, keterangan: 'Uang Sampah Juli' },
  { id: 'TX-202607-01', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 4100000, keterangan: 'Iuran Warga Juli' },
  // JUNI 2026
  { id: 'TX-202606-10', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Proyek', is_proyek: true, nama_proyek: 'Pemasangan Lampu 2 dan Kebersihan', nominal: 1179000, keterangan: 'Pemasangan Lampu 2 dan Kebersihan' },
  { id: 'TX-202606-09', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Proyek', is_proyek: true, nama_proyek: 'Perbaikan Pagar dan Jembatan', nominal: 1695600, keterangan: 'Perbaikan Pagar dan Jembatan' },
  { id: 'TX-202606-08', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Air', is_proyek: false, nama_proyek: '', nominal: 30000, keterangan: 'Galon Pos 5x' },
  { id: 'TX-202606-07', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Listrik Pos Juni' },
  { id: 'TX-202606-06', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi', is_proyek: false, nama_proyek: '', nominal: 111600, keterangan: 'Kopi, Teh, Gula, Susu' },
  { id: 'TX-202606-05', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sosial', is_proyek: false, nama_proyek: '', nominal: 300000, keterangan: 'Dana Sosial Juni' },
  { id: 'TX-202606-04', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 350000, keterangan: 'Bibit tanaman pos dan jasa cat pagar' },
  { id: 'TX-202606-03', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 585000, keterangan: 'Gaji + Uang Makan Pak Rizki Juni' },
  { id: 'TX-202606-02', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 700000, keterangan: 'Periode Juni' },
  { id: 'TX-202606-01', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 3800000, keterangan: 'Iuran Warga Juni' }
];

// Helper generator jadwal kalender dinamis untuk bulan apa pun (mengikuti aturan Jumat & Sabtu malam libur)
function buildMonthCalendarSchedules(year, monthIndex, overrides = []) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayDow = new Date(year, monthIndex, 1).getDay(); // 0=Minggu .. 6=Sabtu
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const anchorSunday = new Date(2026, 10, 1); // Minggu, 1 Nov 2026: Pak Eko Pagi, Pak Mulyadi Malam

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
  onConfirmQrisProof
}) {
  const [activeTab, setActiveTab] = useState('beranda');
  const [showBalance, setShowBalance] = useState(true);
  const [isQrisOpen, setIsQrisOpen] = useState(false);
  const [selectedHouseForQris, setSelectedHouseForQris] = useState('H-01');
  const [logoError, setLogoError] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);

  // State Tab Beranda (Expand Rincian Bulan)
  const [expandedMonth, setExpandedMonth] = useState('Oktober');
  const [copyMonthNotice, setCopyMonthNotice] = useState('');

  // State Tab 22 Rumah
  const [houseFilter, setHouseFilter] = useState('ALL');
  const [houseSearch, setHouseSearch] = useState('');

  // State Tab Buku Kas (55 Transaksi)
  const [ledgerMonthFilter, setLedgerMonthFilter] = useState('ALL');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('ALL');

  // State Tab Keamanan & SOS (V2 + V3 Baru)
  const [sosHolding, setSosHolding] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const sosTimerRef = useRef(null);

  // State Kalender Dinamis Security (Default November 2026)
  const [calMonthIndex, setCalMonthIndex] = useState(10); // 10 = November
  const [calYear, setCalYear] = useState(2026);
  const [selectedCalDay, setSelectedCalDay] = useState(null);
  const [scheduleEditForm, setScheduleEditForm] = useState(null);

  // State Generator Laporan WA & Log Security (Pak Eko & Pak Mulyadi)
  const nowDateStr = new Date().toISOString().slice(0, 10);
  const nowTimeStr = new Date().toTimeString().slice(0, 5);
  const [secGeneratorMode, setSecGeneratorMode] = useState('PATROLI'); // ABSEN_SHIFT | PATROLI | PAKET_SURAT | IZIN_POS | ANOMALI
  const [secOfficer, setSecOfficer] = useState('Pak Eko');
  const [secPartnerOfficer, setSecPartnerOfficer] = useState('Pak Mulyadi');
  const [secShift, setSecShift] = useState('Pagi');
  const [secDate, setSecDate] = useState(nowDateStr);
  const [secTime, setSecTime] = useState(nowTimeStr);
  const [secWeather815, setSecWeather815] = useState('Cerah');
  const [secGateStatus, setSecGateStatus] = useState('Pintu gerbang kecil ditutup sesuai SOP');

  // Sub-state per Mode Generator
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

  // State Kamera Watermark Foto Realtime (Selfie Shift / 5-6 Titik Patroli)
  const [watermarkedPhotos, setWatermarkedPhotos] = useState([]);
  const [copyWaSuccess, setCopyWaSuccess] = useState('');
  const [logCategoryFilter, setLogCategoryFilter] = useState('ALL');

  // Gabungan Data V2 + V3 dengan Fallback Aman
  const houses = dashboardData.houses?.length ? dashboardData.houses : [];
  const activeHouses = useMemo(
    () => houses.filter((h) => h.status_huni !== 'Tidak Aktif'),
    [houses]
  );
  const iplStatus = dashboardData.ipl_status || [];
  const cashLedger = dashboardData.cash_ledger?.length
    ? dashboardData.cash_ledger
    : FALLBACK_LEDGER_V2;
  const monthlyClosings = dashboardData.monthly_closings?.length
    ? dashboardData.monthly_closings
    : FALLBACK_CLOSINGS_V2;
  const securityPayroll = dashboardData.security_payroll || [];
  const securityLogs = dashboardData.security_logs || [];
  const securityConfig = dashboardData.security_config || {
    active_1: 'Pak Eko',
    active_2: 'Pak Mulyadi',
    shift_pagi_jam: '08:00 - 20:00 WIB',
    shift_malam_jam: '20:00 - 08:00 WIB',
    libur_malam_hari: 'Jumat,Sabtu',
    galon_count_bulan_ini: 4
  };

  const formatRp = (num) => `Rp ${Number(num || 0).toLocaleString('id-ID')}`;

  // Hitung Progres IPL Bulan Berjalan
  const lunasCount = useMemo(
    () => iplStatus.filter((r) => r.status_bayar === 'Lunas').length,
    [iplStatus]
  );
  const totalActiveCount = activeHouses.length || 21;
  const iplProgressPct = Math.round((lunasCount / totalActiveCount) * 100);

  // Kalender Dinamis Bulan yang Dipilih
  const calendarData = useMemo(
    () =>
      buildMonthCalendarSchedules(
        calYear,
        calMonthIndex,
        dashboardData.security_schedules || []
      ),
    [calYear, calMonthIndex, dashboardData.security_schedules]
  );

  // Jadwal Hari Ini (Live Banner Security On-Duty)
  const todaySchedule = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const todayObj = new Date();
    const calCurrent = buildMonthCalendarSchedules(
      todayObj.getFullYear(),
      todayObj.getMonth(),
      dashboardData.security_schedules || []
    );
    return (
      calCurrent.days.find((d) => d.tanggal === todayIso) ||
      calendarData.days[0]
    );
  }, [dashboardData.security_schedules, calendarData]);

  // Helper Rincian Kategori & Proyek per Bulan untuk Kartu Beranda (V2 Utuh)
  const getMonthBreakdown = (bulanName) => {
    const rows = cashLedger.filter(
      (tx) => String(tx.periode_bulan).toLowerCase() === String(bulanName).toLowerCase()
    );
    const pemasukanMap = {};
    const pengeluaranMap = {};
    const proyekList = [];

    rows.forEach((r) => {
      const nom = Number(r.nominal || 0);
      const kat = r.kategori || 'Lainnya';
      const ket = r.keterangan || '-';
      const isProyek = Boolean(r.is_proyek) || String(r.is_proyek).toUpperCase() === 'TRUE';

      if (String(r.tipe).toUpperCase() === 'IN') {
        pemasukanMap[kat] = (pemasukanMap[kat] || 0) + nom;
      } else {
        if (isProyek) {
          proyekList.push({ nama: r.nama_proyek || ket, nominal: nom });
        }
        if (!pengeluaranMap[kat]) {
          pengeluaranMap[kat] = { total: 0, items: [] };
        }
        pengeluaranMap[kat].total += nom;
        pengeluaranMap[kat].items.push(`${ket} (${formatRp(nom)})`);
      }
    });

    return { pemasukanMap, pengeluaranMap, proyekList };
  };

  // Format Teks WA Laporan Bulanan Keuangan (V2 Utuh)
  const generateMonthlyFinanceWaText = (closingItem) => {
    const { pemasukanMap, pengeluaranMap, proyekList } = getMonthBreakdown(closingItem.periode_bulan);
    const lines = [
      `*C-Money | Laporan Bulanan ${dashboardData.cluster_full_name || 'Cluster Mutiara Residence Sumberjaya'}*`,
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
      lines.push(`- ${k}: ${formatRp(pengeluaranMap[k].total)} | detail: ${pengeluaranMap[k].items.join(', ')}`);
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

  // Rumah Terpilih untuk Laporan Paket Security (Bebas Typo)
  const selectedPkgHouseObj = useMemo(
    () => houses.find((h) => h.id === pkgHouseId) || houses[0] || { nomor_rumah: 'No. 06', nama_warga: 'Pak Andy', alias_keluarga: 'Pak Agustian Ekandiarto (Pak Andi) / Ibu' },
    [houses, pkgHouseId]
  );

  // GENERATOR TEKS WA OTOMATIS SECURITY (100% Tren Bahasa Pak Eko & Pak Mulyadi)
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

    // Mode ANOMALI / INSIDEN / TAMU / OPERASIONAL POS
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

  // Handler Ambil Foto Kamera + Otomatis Tambah Watermark Jam & Lokasi Pos CMR
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

          // Banner Watermark Bawah ala Kamera Timestamp Security CMR
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

  // Handler Klik Salin Teks WA & Simpan ke Database
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
      teks_wa: generatedSecurityWaText
    };

    if (onInputSecurityLog) {
      await onInputSecurityLog(logPayload);
    }

    setCopyWaSuccess('✅ Teks Laporan WA berhasil disalin & tercatat di Database C-Money!');
    setTimeout(() => setCopyWaSuccess(''), 4500);

    if (openWaDirect) {
      const encoded = encodeURIComponent(generatedSecurityWaText);
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  // Handler SOS Tahan 3 Detik (V2 Utuh)
  const startSosHold = () => {
    setSosHolding(true);
    sosTimerRef.current = setTimeout(() => {
      setSosHolding(false);
      setSosTriggered(true);
    }, 3000);
  };

  const cancelSosHold = () => {
    setSosHolding(false);
    if (sosTimerRef.current) clearTimeout(sosTimerRef.current);
  };

  // Filter Rumah & Transaksi & Log Security
  const filteredHouses = useMemo(() => {
    return houses.filter((h) => {
      const iplRow = iplStatus.find((r) => r.house_id === h.id);
      const statusBayar = h.status_huni === 'Tidak Aktif' ? 'Tidak Aktif' : (iplRow?.status_bayar || 'Belum Lunas');
      if (houseFilter === 'LUNAS' && statusBayar !== 'Lunas') return false;
      if (houseFilter === 'BELUM' && statusBayar !== 'Belum Lunas') return false;
      if (houseSearch.trim()) {
        const q = houseSearch.toLowerCase();
        return (
          String(h.nomor_rumah).toLowerCase().includes(q) ||
          String(h.nama_warga).toLowerCase().includes(q) ||
          String(h.alias_keluarga || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [houses, iplStatus, houseFilter, houseSearch]);

  const filteredLedger = useMemo(() => {
    return cashLedger.filter((tx) => {
      if (ledgerMonthFilter !== 'ALL' && String(tx.periode_bulan) !== ledgerMonthFilter) return false;
      if (ledgerTypeFilter !== 'ALL' && String(tx.tipe).toUpperCase() !== ledgerTypeFilter) return false;
      return true;
    });
  }, [cashLedger, ledgerMonthFilter, ledgerTypeFilter]);

  const filteredSecurityLogs = useMemo(() => {
    if (logCategoryFilter === 'ALL') return securityLogs;
    return securityLogs.filter((l) => String(l.kategori_laporan) === logCategoryFilter);
  }, [securityLogs, logCategoryFilter]);

  // Navigasi Bulan pada Kalender Dinamis
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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-24">
      <div className="max-w-lg mx-auto bg-slate-50 min-h-screen shadow-xl relative">
        {/* HEADER UTAMA + SLOT LOGO KUSTOM 512x512 (V2 UTUH) */}
        <div className="bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-800 text-white px-5 pt-5 pb-8 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between">
            <div
              onClick={() => {
                const next = logoTapCount + 1;
                if (next >= 5) {
                  setLogoTapCount(0);
                  onOpenAdminLogin && onOpenAdminLogin();
                } else {
                  setLogoTapCount(next);
                }
              }}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center overflow-hidden border border-white/25 shadow-inner">
                {!logoError && dashboardData.logo_url ? (
                  <img
                    src={dashboardData.logo_url}
                    alt="C-Money Logo"
                    onError={() => setLogoError(true)}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <span className="font-extrabold text-lg text-amber-300">C</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base tracking-tight">
                    {dashboardData.app_name || 'C-Money'}
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-300/30">
                    v3.0 Live
                  </span>
                </div>
                <p className="text-[11px] text-teal-100 font-medium">
                  {dashboardData.cluster_full_name || 'Cluster Mutiara Residence Sumberjaya'}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenAdminLogin}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition"
            >
              {isAdminLoggedIn ? '⚙️ Panel Aktif' : '🔒 Pengurus'}
            </button>
          </div>

          {/* KARTU SALDO UTAMA M-BANKING STYLE (V2 UTUH) */}
          <div className="mt-5 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-teal-100 font-bold">
                Saldo Kas Berjalan • {dashboardData.summary_periode?.bulan || 'November'} {dashboardData.summary_periode?.tahun || 2026}
              </span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-xs text-teal-100 hover:text-white font-semibold"
              >
                {showBalance ? '🙈 Sembunyikan' : '👁️ Tampilkan'}
              </button>
            </div>

            <div className="mt-1 flex items-baseline justify-between">
              <h2 className="text-2xl font-extrabold tracking-tight text-white">
                {showBalance ? formatRp(dashboardData.current_balance || 1394200) : 'Rp ••••••••'}
              </h2>
              {loading && (
                <span className="text-[10px] text-amber-200 animate-pulse font-semibold">
                  Sinkronisasi...
                </span>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-teal-200 text-[11px]">Iuran IPL / Bulan</p>
                <p className="font-bold text-white mt-0.5">
                  {formatRp(dashboardData.default_ipl_amount || 200000)}
                </p>
              </div>
              <div>
                <p className="text-teal-200 text-[11px]">Total Hunian Cluster</p>
                <p className="font-bold text-white mt-0.5">
                  22 Rumah <span className="text-[10px] text-amber-300">(21 Aktif • 1 Non-Aktif)</span>
                </p>
              </div>
            </div>

            {/* BAR PROGRES IPL BULAN BERJALAN */}
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-teal-100 mb-1">
                <span>Progres IPL Warga ({lunasCount}/{totalActiveCount} Rumah Aktif)</span>
                <span className="font-bold text-amber-300">{iplProgressPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-teal-950/50 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${Math.min(100, iplProgressPct)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS MENU (4 TOMBOL UTAMA V2 UTUH) */}
        <div className="px-4 -mt-5">
          <div className="bg-white rounded-2xl shadow-md p-3.5 grid grid-cols-4 gap-2 text-center border border-slate-100">
            <button
              onClick={() => setIsQrisOpen(true)}
              className="flex flex-col items-center group"
            >
              <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition">
                📲
              </div>
              <span className="text-[11px] font-bold text-teal-800 mt-1">Bayar QRIS</span>
            </button>

            <button
              onClick={() => setActiveTab('warga')}
              className="flex flex-col items-center group"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg border transition ${activeTab === 'warga' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                🏠
              </div>
              <span className="text-[11px] font-semibold text-slate-700 mt-1">22 Rumah</span>
            </button>

            <button
              onClick={() => setActiveTab('mutasi')}
              className="flex flex-col items-center group"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg border transition ${activeTab === 'mutasi' ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                📊
              </div>
              <span className="text-[11px] font-semibold text-slate-700 mt-1">Buku Kas</span>
            </button>

            <button
              onClick={() => setActiveTab('keamanan')}
              className="flex flex-col items-center group"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg border transition ${activeTab === 'keamanan' ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                🛡️
              </div>
              <span className="text-[11px] font-semibold text-slate-700 mt-1">Security & SOS</span>
            </button>
          </div>
        </div>

        {/* KONTEN UTAMA PER TAB */}
        <div className="px-4 mt-4 space-y-4">
          {/* ==========================================================
              TAB 1: BERANDA (LAPORAN 5 BULAN & BREAKDOWN KATEGORI V2 UTUH)
             ========================================================== */}
          {activeTab === 'beranda' && (
            <div className="space-y-4">
              {/* Banner Cepat Status Security Hari Ini di Beranda */}
              <div
                onClick={() => setActiveTab('keamanan')}
                className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl p-3.5 shadow-sm flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    🛡️ Pos Keamanan CMR Hari Ini ({todaySchedule?.hari || 'Hari Ini'})
                  </span>
                  <p className="text-xs font-extrabold mt-0.5">
                    ☀️ Pagi: {todaySchedule?.shift_pagi || 'Pak Eko'} • 🌙 Malam:{' '}
                    {todaySchedule?.shift_malam === 'LIBUR'
                      ? 'LIBUR (Gerbang Mandiri 20:00)'
                      : todaySchedule?.shift_malam || 'Pak Mulyadi'}
                  </p>
                </div>
                <span className="text-[11px] bg-white/10 px-2.5 py-1 rounded-xl font-bold">
                  Buka Pos →
                </span>
              </div>

              {/* Banner CTA Bayar IPL via QRIS */}
              <div className="bg-gradient-to-r from-amber-50 to-teal-50 border border-teal-200 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                    Bebas Biaya Admin (MDR 0%)
                  </span>
                  <h3 className="text-xs font-extrabold text-slate-800 mt-1">
                    Bayar Iuran IPL Rp 200.000 via QRIS
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    Scan dari BCA, Livin, BRImo, GoPay, OVO, DANA
                  </p>
                </div>
                <button
                  onClick={() => setIsQrisOpen(true)}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl shadow"
                >
                  Bayar
                </button>
              </div>

              {copyMonthNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                  {copyMonthNotice}
                </div>
              )}

              {/* Daftar Laporan Bulanan (Oktober -> Juni, Terbaru di Atas) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    📑 Arsip Laporan Bulanan (Terbaru di Atas)
                  </h3>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {monthlyClosings.length} Periode
                  </span>
                </div>

                {monthlyClosings.map((item) => {
                  const isExpanded = expandedMonth === item.periode_bulan;
                  const { pemasukanMap, pengeluaranMap, proyekList } = getMonthBreakdown(item.periode_bulan);

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                            {item.status_tutup_buku === 'OPEN' ? 'Periode Berjalan' : 'Tutup Buku Resmi'}
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-800 mt-1">
                            Periode {item.periode_bulan} {item.periode_tahun}
                          </h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-semibold">Sisa Saldo Akhir</p>
                          <p className="text-sm font-extrabold text-teal-700">
                            {formatRp(item.sisa_saldo)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-2.5 text-[11px]">
                        <div>
                          <span className="text-slate-400">Saldo Awal:</span>
                          <p className="font-bold text-slate-700">{formatRp(item.saldo_awal)}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Uang Masuk:</span>
                          <p className="font-bold text-emerald-600">+{formatRp(item.uang_masuk)}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Total Pengeluaran:</span>
                          <p className="font-bold text-rose-600">-{formatRp(item.total_pengeluaran)}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Pengeluaran Proyek:</span>
                          <p className="font-bold text-amber-700">{formatRp(item.pengeluaran_proyek)}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setExpandedMonth(isExpanded ? '' : item.periode_bulan)}
                          className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                        >
                          {isExpanded ? '▲ Tutup Rincian Kategori' : '▼ Lihat Rincian Kategori & Proyek'}
                        </button>
                        <button
                          onClick={async () => {
                            const txt = generateMonthlyFinanceWaText(item);
                            try {
                              await navigator.clipboard.writeText(txt);
                            } catch (e) {
                              console.warn(e);
                            }
                            setCopyMonthNotice(`✅ Format WA Laporan ${item.periode_bulan} ${item.periode_tahun} berhasil disalin!`);
                            setTimeout(() => setCopyMonthNotice(''), 3500);
                          }}
                          className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-[11px]"
                        >
                          📋 Copas WA
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                          <div>
                            <p className="font-extrabold text-emerald-800 text-[11px] uppercase">
                              Breakdown Pemasukan per Kategori:
                            </p>
                            {Object.keys(pemasukanMap).length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic">Belum ada rincian pemasukan.</p>
                            ) : (
                              Object.keys(pemasukanMap).map((k) => (
                                <p key={k} className="text-[11px] text-slate-700 mt-0.5">
                                  • <span className="font-bold">{k}:</span> {formatRp(pemasukanMap[k])}
                                </p>
                              ))
                            )}
                          </div>

                          <div>
                            <p className="font-extrabold text-rose-800 text-[11px] uppercase">
                              Breakdown Pengeluaran per Kategori:
                            </p>
                            {Object.keys(pengeluaranMap).length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic">Belum ada rincian pengeluaran.</p>
                            ) : (
                              Object.keys(pengeluaranMap).map((k) => (
                                <div key={k} className="text-[11px] text-slate-700 mt-1 bg-slate-50 p-2 rounded-lg">
                                  <p className="font-bold text-slate-800">
                                    • {k}: <span className="text-rose-600">{formatRp(pengeluaranMap[k].total)}</span>
                                  </p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">
                                    Detail: {pengeluaranMap[k].items.join(', ')}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>

                          {proyekList.length > 0 && (
                            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5">
                              <p className="font-extrabold text-amber-900 text-[11px] uppercase">
                                Detail Proyek Cluster:
                              </p>
                              {proyekList.map((p, idx) => (
                                <p key={idx} className="text-[11px] text-amber-900 font-semibold mt-0.5">
                                  • {p.nama} — {formatRp(p.nominal)}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB 2: 22 UNIT RUMAH (21 AKTIF + 1 NON-AKTIF BPR V2 UTUH)
             ========================================================== */}
          {activeTab === 'warga' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      🏠 Status IPL 22 Unit Rumah CMR
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      21 Hunian Aktif (@ Rp 200.000) • 1 Unit Non-Aktif (No. 04 Dijual BPR)
                    </p>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Cari nomor rumah, nama bapak/ibu..."
                  value={houseSearch}
                  onChange={(e) => setHouseSearch(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />

                <div className="flex gap-1.5 text-[11px] font-bold">
                  {[
                    { id: 'ALL', label: `Semua (${houses.length})` },
                    { id: 'LUNAS', label: `Lunas (${lunasCount})` },
                    { id: 'BELUM', label: `Belum Lunas (${totalActiveCount - lunasCount})` }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setHouseFilter(f.id)}
                      className={`flex-1 py-1.5 rounded-xl border transition ${
                        houseFilter === f.id
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {filteredHouses.map((h) => {
                  const iplRow = iplStatus.find((r) => r.house_id === h.id);
                  const isInactive = h.status_huni === 'Tidak Aktif';
                  const statusBayar = isInactive ? 'Tidak Aktif' : (iplRow?.status_bayar || 'Belum Lunas');

                  return (
                    <div
                      key={h.id}
                      className={`rounded-2xl p-3.5 border shadow-sm flex items-center justify-between ${
                        isInactive
                          ? 'bg-slate-100 border-slate-300 opacity-85'
                          : 'bg-white border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-xs ${
                            isInactive
                              ? 'bg-slate-300 text-slate-700'
                              : statusBayar === 'Lunas'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {h.nomor_rumah.replace('No. ', 'A-')}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-extrabold text-slate-800">
                              {h.nomor_rumah} — {h.nama_warga}
                            </h4>
                            {isInactive && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                Dijual BPR
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {h.alias_keluarga || h.nama_warga}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {isInactive
                              ? 'Bebas Tagihan IPL (Unit Non-Aktif)'
                              : `Tagihan IPL: ${formatRp(h.tarif_ipl || 200000)}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        {isInactive ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-600">
                            Non-Aktif
                          </span>
                        ) : statusBayar === 'Lunas' ? (
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✅ Lunas
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedHouseForQris(h.id);
                              setIsQrisOpen(true);
                            }}
                            className="text-[11px] font-extrabold px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                          >
                            📲 Bayar QRIS
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB 3: BUKU KAS (55 RINCIAN TRANSAKSI TERBARU DI ATAS V2 UTUH)
             ========================================================== */}
          {activeTab === 'mutasi' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      📊 Buku Kas Rinci (Terbaru di Atas)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Menampilkan {filteredLedger.length} rincian transaksi per kategori & proyek
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <select
                    value={ledgerMonthFilter}
                    onChange={(e) => setLedgerMonthFilter(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 font-bold bg-slate-50"
                  >
                    <option value="ALL">Semua Bulan (5 Bulan)</option>
                    {['November', 'Oktober', 'September', 'Agustus', 'Juli', 'Juni'].map((b) => (
                      <option key={b} value={b}>Bulan {b}</option>
                    ))}
                  </select>

                  <select
                    value={ledgerTypeFilter}
                    onChange={(e) => setLedgerTypeFilter(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 font-bold bg-slate-50"
                  >
                    <option value="ALL">Semua Mutasi (IN & OUT)</option>
                    <option value="IN">Uang Masuk (IN)</option>
                    <option value="OUT">Pengeluaran (OUT)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {filteredLedger.map((tx) => {
                  const isIn = String(tx.tipe).toUpperCase() === 'IN';
                  const isProyek = Boolean(tx.is_proyek) || String(tx.is_proyek).toUpperCase() === 'TRUE';

                  return (
                    <div
                      key={tx.id}
                      className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex items-center justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold mt-0.5 ${
                            isIn ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isIn ? '↓' : '↑'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {tx.kategori}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {tx.periode_bulan} {tx.periode_tahun}
                            </span>
                            {isProyek && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                Proyek
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-extrabold text-slate-800 mt-1">
                            {tx.keterangan}
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            ID: {tx.id} • Tanggal: {String(tx.tanggal).slice(0, 10)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-xs font-extrabold ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isIn ? '+' : '-'}{formatRp(tx.nominal)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB 4: KEAMANAN & SOS (FITUR V2 UTUH + SISTEM BARU V3 SECURITY)
             ========================================================== */}
          {activeTab === 'keamanan' && (
            <div className="space-y-4">
              {/* 1. BANNER STATUS LIVE SECURITY ON-DUTY HARI INI */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white rounded-2xl p-4 shadow-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    🛡️ Sistem Security CMR Aktif
                  </span>
                  <span className="text-[11px] text-slate-300 font-semibold">
                    🚰 Galon Pos Bulan Ini: <strong className="text-amber-300">{securityConfig.galon_count_bulan_ini || 4} Galon</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                    <p className="text-[10px] text-teal-200 font-bold">☀️ SHIFT PAGI (08:00 - 20:00)</p>
                    <p className="text-sm font-extrabold text-white mt-0.5">
                      {todaySchedule?.shift_pagi || 'Pak Eko'}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                    <p className="text-[10px] text-amber-200 font-bold">🌙 SHIFT MALAM (20:00 - 08:00)</p>
                    <p className="text-sm font-extrabold text-white mt-0.5">
                      {todaySchedule?.shift_malam === 'LIBUR'
                        ? '🔓 LIBUR (Gerbang Mandiri)'
                        : todaySchedule?.shift_malam || 'Pak Mulyadi'}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 bg-black/20 rounded-xl px-3 py-2">
                  📌 <strong>Aturan Jadwal:</strong> Jumat & Sabtu tetap bertugas shift pagi, sedangkan shift malam <strong>LIBUR</strong> (Gerbang Mandiri mulai 20:00 WIB). Sabtu pagi pertukaran shift mingguan, Minggu kembali normal 2 shift.
                </p>
              </div>

              {/* 2. KALENDER DINAMIS MINIMALIS 1 BULAN (JADWAL PAK EKO & PAK MULYADI) */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      🗓️ Kalender Jadwal Security
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Ketuk tanggal untuk lihat detail atau tukar shift/izin
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrevMonth}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-extrabold text-xs"
                    >
                      ‹
                    </button>
                    <span className="text-xs font-extrabold text-slate-800 px-2">
                      {calendarData.monthName} {calendarData.year}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-extrabold text-xs"
                    >
                      ›
                    </button>
                  </div>
                </div>

                {/* Legenda Warna Minimalis */}
                <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                    ☀️ Pagi: Eko / Mul
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                    🌙 Malam: Mul / Eko
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    🔓 Jumat & Sabtu Malam: LIBUR
                  </span>
                </div>

                {/* Header Nama Hari */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400">
                  <div>Min</div>
                  <div>Sen</div>
                  <div>Sel</div>
                  <div>Rab</div>
                  <div>Kam</div>
                  <div className="text-amber-600">Jum</div>
                  <div className="text-amber-600">Sab</div>
                </div>

                {/* Grid Tanggal 1 Bulan */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: calendarData.firstDayDow }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="h-14 rounded-xl bg-slate-50/50" />
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
                        className={`h-14 rounded-xl p-1 flex flex-col justify-between text-left border transition ${
                          isSelected
                            ? 'ring-2 ring-teal-600 border-teal-600 bg-teal-50/40'
                            : isNightOff
                            ? 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] font-extrabold text-slate-700">
                            {d.dayNumber}
                          </span>
                          {isRotationSat && (
                            <span className="text-[8px]" title="Tukar Shift Mingguan">
                              🔄
                            </span>
                          )}
                        </div>

                        <div className="space-y-0.5 w-full">
                          <div className="text-[8px] font-bold px-1 rounded bg-teal-100 text-teal-900 truncate">
                            ☀️{shortPagi}
                          </div>
                          <div
                            className={`text-[8px] font-bold px-1 rounded truncate ${
                              isNightOff
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-indigo-100 text-indigo-900'
                            }`}
                          >
                            🌙{shortMalam}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Detail & Form Ubah Jadwal Saat Tanggal Diklik */}
                {selectedCalDay && scheduleEditForm && (
                  <div className="mt-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-teal-700">
                          Detail Jadwal Harian
                        </span>
                        <h4 className="font-extrabold text-slate-800">
                          {selectedCalDay.hari}, {selectedCalDay.tanggal}
                        </h4>
                      </div>
                      <button
                        onClick={() => setSelectedCalDay(null)}
                        className="text-slate-400 font-bold text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      {selectedCalDay.catatan_jadwal}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          ☀️ Petugas Shift Pagi
                        </label>
                        <select
                          value={scheduleEditForm.shift_pagi}
                          onChange={(e) =>
                            setScheduleEditForm({ ...scheduleEditForm, shift_pagi: e.target.value })
                          }
                          className="w-full border rounded-xl px-2.5 py-1.5 font-bold bg-white"
                        >
                          <option value="Pak Eko">Pak Eko</option>
                          <option value="Pak Mulyadi">Pak Mulyadi</option>
                          <option value="IZIN / GERBANG MANDIRI">IZIN / GERBANG MANDIRI</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          🌙 Petugas Shift Malam
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
                          className="w-full border rounded-xl px-2.5 py-1.5 font-bold bg-white"
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
                      className="w-full py-2 rounded-xl bg-teal-700 text-white font-extrabold text-[11px]"
                    >
                      💾 Simpan Perubahan Jadwal Tanggal Ini
                    </button>
                  </div>
                )}
              </div>

              {/* 3. GENERATOR LAPORAN WA SIAP COPAS & KAMERA WATERMARK (PAK EKO & PAK MULYADI) */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-teal-600/30 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                      Bebas Typo • Siap Copas WA
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-800 mt-1">
                      📋 Generator Laporan & Absen Security
                    </h3>
                  </div>
                </div>

                {/* Baris Pilih Petugas, Shift, Jam & Cuaca 815 */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
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
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
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
                        <option value="Cerah">☀️ Cerah</option>
                        <option value="Panas Terik">🔥 Panas</option>
                        <option value="Mendung">⛅ Mendung</option>
                        <option value="Hujan">🌧️ Hujan</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      📅 Tanggal Laporan
                    </label>
                    <input
                      type="date"
                      value={secDate}
                      onChange={(e) => setSecDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-1.5 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      ⏰ Jam Laporan (WIB)
                    </label>
                    <input
                      type="time"
                      value={secTime}
                      onChange={(e) => setSecTime(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-1.5 font-semibold"
                    />
                  </div>
                </div>

                {/* 5 Tab Pilihan Jenis Laporan */}
                <div className="grid grid-cols-5 gap-1 text-[10px] font-extrabold text-center">
                  {[
                    { id: 'ABSEN_SHIFT', icon: '🤳', label: 'Absen Shift' },
                    { id: 'PATROLI', icon: '🔦', label: 'Patroli 5-6' },
                    { id: 'PAKET_SURAT', icon: '📦', label: 'Paket/COD' },
                    { id: 'IZIN_POS', icon: '🕌', label: 'Izin/ISOMA' },
                    { id: 'ANOMALI', icon: '⚡', label: 'Anomali/Lain' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSecGeneratorMode(m.id)}
                      className={`py-2 px-1 rounded-xl border transition flex flex-col items-center ${
                        secGeneratorMode === m.id
                          ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <span className="text-sm">{m.icon}</span>
                      <span className="mt-0.5 leading-tight">{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* FORM DINAMIS SESUAI MODE YANG DIPILIH */}
                {secGeneratorMode === 'ABSEN_SHIFT' && (
                  <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                    <label className="block text-[10px] font-extrabold uppercase text-slate-600">
                      Pilih Jenis Absen / Pergantian Shift:
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
                        🔓 Tutup Pos Jumat/Sabtu Malam (20:00 — Malam Libur / Gerbang Mandiri)
                      </option>
                    </select>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Catatan Serah Terima Pos / Titipan Paket:
                      </label>
                      <input
                        type="text"
                        value={absenNote}
                        onChange={(e) => setAbsenNote(e.target.value)}
                        className="w-full border rounded-xl px-3 py-2 bg-white"
                      />
                    </div>
                  </div>
                )}

                {secGeneratorMode === 'PATROLI' && (
                  <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                        Waktu Kontrol Patroli Rutin:
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
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Checklist 5–6 Titik Lokasi yang Difoto:
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
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
                            className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-slate-200 cursor-pointer"
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
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
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
                  </div>
                )}

                {secGeneratorMode === 'PAKET_SURAT' && (
                  <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                        Pilih Nomor Rumah Warga (Otomatis Nama Bapak/Ibu/Anak):
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
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Jenis Barang / Dokumen
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
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Status Posisi Paket
                        </label>
                        <select
                          value={pkgHandling}
                          onChange={(e) => setPkgHandling(e.target.value)}
                          className="w-full border rounded-xl px-2.5 py-2 font-bold bg-white"
                        >
                          <option value="Disimpan di Pos Security (Menunggu diambil)">
                            🏢 Disimpan di Pos Security
                          </option>
                          <option value="Sudah diantar langsung ke rumah warga oleh security">
                            🛵 Sudah Diantar ke Rumah
                          </option>
                          <option value="Sudah diambil langsung oleh Bapak / Ibu">
                            ✅ Sudah Diambil Pemilik
                          </option>
                          <option value="Dibayar menggunakan uang titipan COD di Pos">
                            💰 Lunas Pakai Titipan COD Pos
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Nama Tertulis di Paket (Opsional)
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
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
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
                  </div>
                )}

                {secGeneratorMode === 'IZIN_POS' && (
                  <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                        Keperluan Izin Meninggalkan Pos Sementara:
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
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Status Pengamanan Gerbang Saat Ditinggal:
                      </label>
                      <input
                        type="text"
                        value={izinDuration}
                        onChange={(e) => setIzinDuration(e.target.value)}
                        className="w-full border rounded-xl px-3 py-2 bg-white"
                      />
                    </div>
                  </div>
                )}

                {secGeneratorMode === 'ANOMALI' && (
                  <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                        Pilih Kategori Kejadian / Anomali Lapangan:
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
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
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
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
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
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Tindakan Security / SOP:
                      </label>
                      <input
                        type="text"
                        value={anomalyAction}
                        onChange={(e) => setAnomalyAction(e.target.value)}
                        className="w-full border rounded-xl px-3 py-2 bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* FITUR AMBIL FOTO SELFIE / 5-6 TITIK PATROLI DENGAN WATERMARK OTOMATIS */}
                <div className="bg-teal-50/60 border border-teal-200 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-extrabold text-teal-900">
                        📷 Kamera Watermark Realtime (Selfie Shift / 5–6 Titik)
                      </p>
                      <p className="text-[10px] text-teal-700">
                        Otomatis menempelkan jam, tanggal, cuaca 815 & nama petugas di foto
                      </p>
                    </div>
                    <label className="cursor-pointer bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-extrabold px-3 py-2 rounded-xl shadow-sm">
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
                        <div key={p.id} className="relative rounded-xl overflow-hidden border border-teal-300 bg-black">
                          <img src={p.dataUrl} alt={p.name} className="w-full h-20 object-cover" />
                          <a
                            href={p.dataUrl}
                            download={`CMR_${secOfficer.replace(' ', '_')}_${secDate}.jpg`}
                            className="block text-center bg-teal-800 text-white text-[9px] font-bold py-1"
                          >
                            ⬇ Simpan Foto WM
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* PREVIEW TEKS SIAP COPAS KE GRUP WA */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500">
                      Preview Teks WhatsApp (Siap Copas):
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      0% Typo • Otomatis Terformat
                    </span>
                  </div>
                  <pre className="w-full whitespace-pre-wrap bg-slate-900 text-emerald-300 text-[11px] font-mono p-3.5 rounded-2xl border border-slate-700 leading-relaxed">
                    {generatedSecurityWaText}
                  </pre>
                </div>

                {copyWaSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-extrabold text-emerald-800">
                    {copyWaSuccess}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyAndSaveSecurityReport(false)}
                    className="py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs shadow-md"
                  >
                    📋 Salin Teks & Simpan Log
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyAndSaveSecurityReport(true)}
                    className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md"
                  >
                    📲 Kirim ke WhatsApp
                  </button>
                </div>
              </div>

              {/* 4. RIWAYAT LOG LAPORAN & CATATAN ANOMALI SECURITY (URUT TERBARU DI ATAS) */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      🗂️ Riwayat Log & Anomali Lapangan
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Urutan terbaru di atas ({filteredSecurityLogs.length} catatan terekam)
                    </p>
                  </div>
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px] font-extrabold">
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
                      className={`px-2.5 py-1.5 rounded-xl border whitespace-nowrap ${
                        logCategoryFilter === cat.id
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {filteredSecurityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-teal-100 text-teal-900">
                            {log.nama_security} ({log.shift})
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                            {log.sub_kategori || log.kategori_laporan}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {String(log.tanggal).slice(0, 10)} • {log.jam}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-800">
                        {log.detail_catatan}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/70">
                        <span>
                          📍 {log.titik_patroli || 'Pos Security'} • 815: {log.cuaca_815 || 'Cerah'}
                        </span>
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
                            📋 Copas Ulang WA
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. TRANSPARANSI GAJI & POTONGAN KASBON SECURITY (FITUR V2 UTUH) */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      💵 Transparansi Gaji & Kasbon Security
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Otomatis menghitung hak gaji bersih setelah dipotong kasbon
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {securityPayroll.map((pay) => (
                    <div
                      key={pay.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-800">{pay.nama_security}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {pay.periode_bulan} {pay.periode_tahun}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Gaji Pokok: {formatRp(pay.gaji_pokok)} • Kasbon: -{formatRp(pay.potongan_kasbon)}
                        </p>
                        <p className="text-[10px] text-slate-400">{pay.catatan}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Diterima Bersih</p>
                        <p className="text-xs font-extrabold text-teal-700">
                          {formatRp(pay.gaji_bersih)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. PANTAUAN 4 TITIK CCTV CLUSTER & INFO ICSEE (FITUR V2 UTUH) */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      📹 Pantauan CCTV Lingkungan (iCSee)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Pos Security (Depan) & Side B (Depan Rumah Pak Yose)
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    4 Channel
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { ch: 'CAM 01', name: 'Pos Security Utama', loc: 'Area Gerbang Depan (Aktif iCSee)' },
                    { ch: 'CAM 02', name: 'Side B (Area Belakang)', loc: 'Depan Rumah Pak Yose (Aktif iCSee)' },
                    { ch: 'CAM 03', name: 'Jalur Gang Depan', loc: 'Blok A-01 s/d A-11' },
                    { ch: 'CAM 04', name: 'Area Lapangan & Parkir', loc: 'Titik Kumpul Warga' }
                  ].map((cam) => (
                    <div
                      key={cam.ch}
                      className="rounded-xl bg-slate-900 text-white p-3 border border-slate-800 flex flex-col justify-between h-24"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-600">
                          ● LIVE {cam.ch}
                        </span>
                        <span className="text-[9px] text-slate-400">RTSP / iCSee</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold">{cam.name}</p>
                        <p className="text-[10px] text-slate-400">{cam.loc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  ⚠️ <strong>SOP CCTV CMR:</strong> Dilarang menghapus rekaman tanpa instruksi pengurus. Jika arah kamera digeser saat memantau, wajib dikembalikan ke posisi semula.
                </p>
              </div>

              {/* 7. TOMBOL DARURAT SOS PANIC BUTTON TAHAN 3 DETIK (FITUR V2 UTUH) */}
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center space-y-2.5">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  🚨 Darurat Lingkungan CMR
                </span>
                <h3 className="text-sm font-extrabold text-rose-900">
                  SOS Panic Button (Tahan 3 Detik)
                </h3>
                <p className="text-[11px] text-rose-700">
                  Gunakan hanya saat keadaan darurat medis, kebakaran, atau ancaman keamanan.
                </p>

                <button
                  type="button"
                  onMouseDown={startSosHold}
                  onMouseUp={cancelSosHold}
                  onMouseLeave={cancelSosHold}
                  onTouchStart={startSosHold}
                  onTouchEnd={cancelSosHold}
                  className={`w-full py-4 rounded-2xl font-extrabold text-sm text-white shadow-lg transition transform ${
                    sosHolding
                      ? 'bg-rose-800 scale-95 animate-pulse'
                      : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700'
                  }`}
                >
                  {sosHolding
                    ? '⏳ Tahan Terus 3 Detik untuk Mengirim Sinyal SOS...'
                    : '🚨 TAHAN 3 DETIK — BUNYIKAN ALARM DARURAT POS'}
                </button>

                {sosTriggered && (
                  <div className="p-3 rounded-xl bg-rose-700 text-white text-xs font-bold space-y-2">
                    <p>✅ Sinyal Darurat SOS Aktif! Segera teruskan ke Grup WA / Pos Security:</p>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        '*🚨 PERINGATAN DARURAT SOS CMR 🚨*\nMohon bantuan segera petugas Security (' +
                          (todaySchedule?.shift_pagi || 'Pak Eko') +
                          ') & warga, terdapat kondisi darurat di lingkungan Cluster Mutiara Residence!'
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block bg-white text-rose-800 font-extrabold px-4 py-2 rounded-xl"
                    >
                      📲 Kirim Sinyal SOS ke Grup WA Sekarang
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION BAR (4 TAB UTAMA V2 UTUH) */}
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="max-w-lg mx-auto bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-2 grid grid-cols-4 gap-1 text-center shadow-lg">
            {[
              { id: 'beranda', icon: '🏦', label: 'Beranda' },
              { id: 'warga', icon: '🏠', label: '22 Rumah' },
              { id: 'mutasi', icon: '📊', label: 'Buku Kas' },
              { id: 'keamanan', icon: '🛡️', label: 'Security' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 rounded-xl flex flex-col items-center transition ${
                  activeTab === tab.id
                    ? 'text-teal-700 font-extrabold bg-teal-50'
                    : 'text-slate-400 font-semibold hover:text-slate-600'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="text-[10px] mt-0.5">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* MODAL POP-UP QRIS STATIS (MDR 0% — V2 UTUH) */}
        <QrisPaymentModal
          isOpen={isQrisOpen}
          onClose={() => setIsQrisOpen(false)}
          houses={activeHouses}
          defaultSelectedHouse={selectedHouseForQris}
          defaultAmount={dashboardData.default_ipl_amount || 200000}
          merchantName={dashboardData.qris_merchant_name || 'Cluster Mutiara Residence'}
          nmid={dashboardData.qris_nmid || 'ID1026000000CMR'}
          qrisImageUrl={dashboardData.qris_image_url || '/assets/qris-cmr-statis.png'}
          periodeBulan={dashboardData.summary_periode?.bulan || 'November'}
          periodeTahun={dashboardData.summary_periode?.tahun || 2026}
          onConfirmPayment={onConfirmQrisProof}
        />
      </div>
    </div>
  );
}
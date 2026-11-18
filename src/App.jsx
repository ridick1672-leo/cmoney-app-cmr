import React, { useState, useEffect } from 'react';
import PublicDashboard from './components/PublicDashboard';
import QrisPaymentModal from './components/QrisPaymentModal';
import { CMoneyAPI, compressImageToBase64, getSmartBookPeriod, MONTH_LIST_ID } from './services/apiService';

/**
 * GENERATOR KALENDER ROTASI MINGGUAN SECURITY (PAK EKO & PAK MULYADI)
 * - Anchor: Minggu, 1 November 2026 (Minggu ke-1: Pagi Pak Eko, Malam Pak Mulyadi)
 * - Minggu s/d Kamis: 2 Shift Normal (Pagi 08:00-20:00, Malam 20:00-08:00)
 * - Jumat: Pagi Normal, Malam LIBUR (Gerbang Mandiri mulai 20:00 WIB)
 * - Sabtu: Pagi TUKAR SHIFT, Malam LIBUR (Gerbang Mandiri mulai 20:00 WIB)
 * - Minggu berikutnya: Kembali 2 Shift Normal dengan rotasi personel yang sudah bertukar
 */
function generateDefaultSchedules(year = 2026, monthIndex = 10) {
  const daysId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const anchorDate = new Date(2026, 10, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const result = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, monthIndex, d);
    const dow = curDate.getDay();
    const diffDays = Math.floor((curDate - anchorDate) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(diffDays / 7);
    const isEvenWeek = ((weekIndex % 2) + 2) % 2 === 0;

    const normalMorning = isEvenWeek ? 'Pak Eko' : 'Pak Mulyadi';
    const normalNight = isEvenWeek ? 'Pak Mulyadi' : 'Pak Eko';

    let shiftPagi = normalMorning;
    let shiftMalam = normalNight;
    let jamPagi = '08:00 - 20:00';
    let jamMalam = '20:00 - 08:00';
    let statusJadwal = 'NORMAL_2_SHIFT';
    let catatanJadwal = 'Jaga normal 2 shift (Pagi & Malam)';

    if (dow === 5) {
      shiftMalam = 'LIBUR (Gerbang Mandiri)';
      jamMalam = '20:00 - 08:00 (Mandiri)';
      statusJadwal = 'MALAM_LIBUR';
      catatanJadwal = 'Jumat malam security libur • Pukul 20.00 WIB gerbang ditutup mandiri';
    } else if (dow === 6) {
      shiftPagi = normalNight;
      shiftMalam = 'LIBUR (Gerbang Mandiri)';
      jamMalam = '20:00 - 08:00 (Mandiri)';
      statusJadwal = 'TUKAR_SHIFT_DAN_MALAM_LIBUR';
      catatanJadwal = 'Sabtu pagi tukar shift jaga • Sabtu malam security libur';
    }

    const yyyy = curDate.getFullYear();
    const mm = String(curDate.getMonth() + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');

    result.push({
      id: `SCH-${yyyy}${mm}${dd}`,
      tanggal: `${yyyy}-${mm}-${dd}`,
      hari: daysId[dow],
      periode_bulan: monthNames[monthIndex],
      periode_tahun: year,
      shift_pagi: shiftPagi,
      jam_pagi: jamPagi,
      shift_malam: shiftMalam,
      jam_malam: jamMalam,
      status_jadwal: statusJadwal,
      catatan_jadwal: catatanJadwal
    });
  }
  return result;
}

/**
 * DATA 22 UNIT RUMAH ASLI CLUSTER MUTIARA RESIDENCE + ALIAS KELUARGA (ANTI-TYPO WA)
 */
const INITIAL_HOUSES = [
  { id: 'H-01', nomor_rumah: '01', nama_kepala_keluarga: 'Pak Suharso', alias_keluarga: 'Pak Suharso / Ibu Suharso', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-02', nomor_rumah: '02', nama_kepala_keluarga: 'Pak Refza Muhammad', alias_keluarga: 'Pak Refza Muhammad / Ibu Reza Wandira', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-03', nomor_rumah: '03', nama_kepala_keluarga: 'Pak Upen (Kontrak Unit Pak Dwi)', alias_keluarga: 'Pak Upen / Ibu Upen (Unit Pak Dwi)', status_huni: 'Aktif (Dikontrakkan)', tarif_ipl: 200000 },
  { id: 'H-04', nomor_rumah: '04', nama_kepala_keluarga: 'Unit Dijual (Pihak BPR)', alias_keluarga: 'Unit BPR (Kosong / Dijual)', status_huni: 'Tidak Aktif (Dijual BPR)', tarif_ipl: 0 },
  { id: 'H-05', nomor_rumah: '05', nama_kepala_keluarga: 'Pak Taufik', alias_keluarga: 'Pak Taufik / Ibu Taufik', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-06', nomor_rumah: '06', nama_kepala_keluarga: 'Pak Sonny Ilham', alias_keluarga: 'Pak Sonny Ilham / Ibu Sonny', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-07', nomor_rumah: '07', nama_kepala_keluarga: 'PakKis (Kiswanto)', alias_keluarga: 'Pak Kiswanto (PakKis) / Ibu Kiswanto', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-08', nomor_rumah: '08', nama_kepala_keluarga: 'Pak성우 (Rizky)', alias_keluarga: 'Pak Rizky / Ibu Rizky', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-09', nomor_rumah: '09', nama_kepala_keluarga: 'Pak Zakaria', alias_keluarga: 'Pak Zakaria (Bang Jak) / Ibu Negara', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-10', nomor_rumah: '10', nama_kepala_keluarga: 'Pak Danang', alias_keluarga: 'Pak Danang / Ibu Danang', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-11', nomor_rumah: '11', nama_kepala_keluarga: 'Pak kemal', alias_keluarga: 'Pak Kemal / Ibu Kemal', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-12', nomor_rumah: '12', nama_kepala_keluarga: 'Pak Uji', alias_keluarga: 'Pak Uji / Ibu Uji', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-13', nomor_rumah: '13', nama_kepala_keluarga: 'Pak Ramon', alias_keluarga: 'Pak Ramon / Ibu Yuska / Abang Rasya', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-14', nomor_rumah: '14', nama_kepala_keluarga: 'Pak Dwi', alias_keluarga: 'Pak Dwi / Ibu Dwi', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-15', nomor_rumah: '15', nama_kepala_keluarga: 'Pak Dani', alias_keluarga: 'Pak Dani / Ibu Dani', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-16', nomor_rumah: '16', nama_kepala_keluarga: 'Pak Baim (Unit 1)', alias_keluarga: 'Pak Baim / Ibu Baim (No. 16)', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-17', nomor_rumah: '17', nama_kepala_keluarga: 'Pak Sam', alias_keluarga: 'Pak Sam / Ibu Sam', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-18', nomor_rumah: '18', nama_kepala_keluarga: 'Pak Endang', alias_keluarga: 'Pak Endang / Ibu Endang', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-19', nomor_rumah: '19', nama_kepala_keluarga: 'Pak Suwandi', alias_keluarga: 'Pak Suwandi / Ibu Marlina', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-20', nomor_rumah: '20', nama_kepala_keluarga: 'Pak Fian', alias_keluarga: 'Pak Fian / Ibu Fian', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-21', nomor_rumah: '21', nama_kepala_keluarga: 'Pak Joko', alias_keluarga: 'Pak Joko / Ibu Joko', status_huni: 'Aktif', tarif_ipl: 200000 },
  { id: 'H-22', nomor_rumah: '22', nama_kepala_keluarga: 'Pak Baim (Unit 2)', alias_keluarga: 'Pak Baim / Ibu Baim (No. 22)', status_huni: 'Aktif', tarif_ipl: 200000 }
];

/**
 * DATA DEFAULT 6 SLOT PARKIR FASUM (DENAH HORIZONTAL: 1-4 KIRI VERTIKAL, 5-6 KANAN BERSUSUN)
 */
const INITIAL_PARKING_SLOTS = [
  {
    slot_id: 'SLOT-01',
    slot_number: 1,
    posisi_layout: 'KIRI_VERTIKAL_1',
    status_slot: 'KOSONG',
    kategori_parkir: '-',
    house_id: '-',
    nama_pemilik: '-',
    plat_nomor: '-',
    keterangan_kendaraan: 'Slot Parkir Fasum #1 (Baris Kiri)',
    waktu_masuk: '-',
    periode_bulan: 'November',
    periode_tahun: 2026,
    status_bayar_parkir: '-',
    nominal_parkir: 0,
    url_bukti_parkir: '-'
  },
  {
    slot_id: 'SLOT-02',
    slot_number: 2,
    posisi_layout: 'KIRI_VERTIKAL_2',
    status_slot: 'KOSONG',
    kategori_parkir: '-',
    house_id: '-',
    nama_pemilik: '-',
    plat_nomor: '-',
    keterangan_kendaraan: 'Slot Parkir Fasum #2 (Baris Kiri)',
    waktu_masuk: '-',
    periode_bulan: 'November',
    periode_tahun: 2026,
    status_bayar_parkir: '-',
    nominal_parkir: 0,
    url_bukti_parkir: '-'
  },
  {
    slot_id: 'SLOT-03',
    slot_number: 3,
    posisi_layout: 'KIRI_VERTIKAL_3',
    status_slot: 'KOSONG',
    kategori_parkir: '-',
    house_id: '-',
    nama_pemilik: '-',
    plat_nomor: '-',
    keterangan_kendaraan: 'Slot Parkir Fasum #3 (Baris Kiri)',
    waktu_masuk: '-',
    periode_bulan: 'November',
    periode_tahun: 2026,
    status_bayar_parkir: '-',
    nominal_parkir: 0,
    url_bukti_parkir: '-'
  },
  {
    slot_id: 'SLOT-04',
    slot_number: 4,
    posisi_layout: 'KIRI_VERTIKAL_4',
    status_slot: 'KOSONG',
    kategori_parkir: '-',
    house_id: '-',
    nama_pemilik: '-',
    plat_nomor: '-',
    keterangan_kendaraan: 'Slot Parkir Fasum #4 (Baris Kiri)',
    waktu_masuk: '-',
    periode_bulan: 'November',
    periode_tahun: 2026,
    status_bayar_parkir: '-',
    nominal_parkir: 0,
    url_bukti_parkir: '-'
  },
  {
    slot_id: 'SLOT-05',
    slot_number: 5,
    posisi_layout: 'KANAN_ATAS_5',
    status_slot: 'KOSONG',
    kategori_parkir: '-',
    house_id: '-',
    nama_pemilik: '-',
    plat_nomor: '-',
    keterangan_kendaraan: 'Slot Parkir Fasum #5 (Kanan Atas)',
    waktu_masuk: '-',
    periode_bulan: 'November',
    periode_tahun: 2026,
    status_bayar_parkir: '-',
    nominal_parkir: 0,
    url_bukti_parkir: '-'
  },
  {
    slot_id: 'SLOT-06',
    slot_number: 6,
    posisi_layout: 'KANAN_BAWAH_6',
    status_slot: 'KOSONG',
    kategori_parkir: '-',
    house_id: '-',
    nama_pemilik: '-',
    plat_nomor: '-',
    keterangan_kendaraan: 'Slot Parkir Fasum #6 (Kanan Bawah)',
    waktu_masuk: '-',
    periode_bulan: 'November',
    periode_tahun: 2026,
    status_bayar_parkir: '-',
    nominal_parkir: 0,
    url_bukti_parkir: '-'
  }
];

/**
 * RIWAYAT LOG AKTIVITAS & ANOMALI SECURITY DARI GRUP WA (TERBARU DI ATAS)
 */
const INITIAL_SECURITY_LOGS = [
  {
    id: 'SEC-20261116-0500',
    tanggal: '2026-11-16',
    jam: '05:00',
    nama_security: 'Pak Mulyadi',
    shift: 'Malam',
    kategori_laporan: 'PATROLI',
    sub_kategori: 'Patroli Subuh & Lampu Jalan',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Keliling 5 Titik Cluster (No.01, No.08, No.12, No.22, Pos Utama)',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Situasi Cluster Mutiara Residence aman terkendali, lampu jalan dimatikan pukul 05.30 WIB.',
    teks_wa: 'Selamat pagi komandan izin melaporkan giat kontrol keliling situasi Cluster Mutiara Residence aman terkendali (815 cerah).'
  },
  {
    id: 'SEC-20261115-2210',
    tanggal: '2026-11-15',
    jam: '22:10',
    nama_security: 'Pak Mulyadi',
    shift: 'Malam',
    kategori_laporan: 'PATROLI',
    sub_kategori: 'Patroli Malam 5 Titik',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Pos Utama, Blok A No.01, Blok A No.08, Blok B No.12, Blok B No.22',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Giat kontrol keliling 5 titik pantau selesai, gerbang utama dirapatkan.',
    teks_wa: 'Selamat malam izin melaporkan giat kontrol keliling 5 titik situasi Cluster Mutiara Residence dalam keadaan aman terkendali (815 cerah).'
  },
  {
    id: 'SEC-20261115-1615',
    tanggal: '2026-11-15',
    jam: '16:15',
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'PAKET_TAMU',
    sub_kategori: 'Titipan Paket di Pos',
    house_id: 'H-13',
    nama_warga_tujuan: 'Pak Ramon / Ibu Yuska / Abang Rasya',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Cerah',
    status_gerbang: 'Standby Pos Utama',
    detail_catatan: 'Titipan paket kurir untuk No. 13 (Ibu Yuska / Abang Rasya) disimpan aman di meja pos security.',
    teks_wa: 'Selamat sore izin menginformasikan ada titipan paket untuk Rumah No. 13 (Pak Ramon / Ibu Yuska / Abang Rasya) sudah diamankan di Pos Security. Terima kasih.'
  },
  {
    id: 'SEC-20261115-0800',
    tanggal: '2026-11-15',
    jam: '08:00',
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'ABSEN_SHIFT',
    sub_kategori: 'Serah Terima Tugas Pagi',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Masuk tugas jaga shift pagi (08:00 - 20:00 WIB) bersama inventaris pos lengkap.',
    teks_wa: 'Selamat pagi izin melaporkan masuk tugas jaga shift pagi (08:00 - 20:00 WIB). Situasi Cluster Mutiara Residence aman terkendali, 815 cerah.'
  },
  {
    id: 'SEC-20261114-2000',
    tanggal: '2026-11-14',
    jam: '20:00',
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'TUTUP_POS_MALAM_LIBUR',
    sub_kategori: 'Tutup Pos Malam Libur (Sabtu Malam)',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Pos Utama & Gerbang Cluster',
    cuaca_815: 'Cerah',
    status_gerbang: 'Gerbang Utama Ditutup (Akses Mandiri Warga)',
    detail_catatan: 'Sabtu malam security libur. Pukul 20.00 WIB gerbang ditutup dan kunci gembok stanby.',
    teks_wa: 'Selamat malam Bapak/Ibu warga Cluster Mutiara Residence, izin melaporkan tugas jaga shift pagi selesai pukul 20.00 WIB. Mengingat malam ini jadwal libur security, pintu gerbang sudah kami tutup. Mohon kerja sama warga yang keluar/masuk untuk menutup kembali gerbang. Terima kasih.'
  },
  {
    id: 'SEC-20261114-0802',
    tanggal: '2026-11-14',
    jam: '08:02',
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'ABSEN_SHIFT',
    sub_kategori: 'Tukar Shift Sabtu Pagi',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Tukar jadwal rutin Sabtu pagi (Pak Eko masuk pagi s/d 20:00 WIB).',
    teks_wa: 'Selamat pagi izin melaporkan pelaksanaan tugas jaga Sabtu pagi (pertukaran shift mingguan). Situasi Cluster Mutiara Residence aman terkendali, 815 cerah.'
  },
  {
    id: 'SEC-20261113-2000',
    tanggal: '2026-11-13',
    jam: '20:00',
    nama_security: 'Pak Mulyadi',
    shift: 'Pagi',
    kategori_laporan: 'TUTUP_POS_MALAM_LIBUR',
    sub_kategori: 'Tutup Pos Malam Libur (Jumat Malam)',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Pos Utama & Gerbang Cluster',
    cuaca_815: 'Cerah',
    status_gerbang: 'Gerbang Utama Ditutup (Akses Mandiri Warga)',
    detail_catatan: 'Jumat malam jadwal libur security, lampu jalan sudah dinyalakan dan gerbang ditutup pukul 20.00 WIB.',
    teks_wa: 'Selamat malam Bapak/Ibu warga Cluster Mutiara Residence, izin melaporkan tugas jaga selesai pukul 20.00 WIB. Mengingat Jumat malam jadwal libur security, gerbang utama sudah ditutup dan lampu jalan sudah dinyalakan. Terima kasih.'
  },
  {
    id: 'SEC-20261113-1145',
    tanggal: '2026-11-13',
    jam: '11:45',
    nama_security: 'Pak Mulyadi',
    shift: 'Pagi',
    kategori_laporan: 'IZIN_ISOMA',
    sub_kategori: 'Izin Sholat Jumat',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Dirapatkan Sementara',
    detail_catatan: 'Izin meninggalkan pos sementara untuk melaksanakan ibadah Sholat Jumat.',
    teks_wa: 'Selamat siang Bapak/Ibu warga CMR, izin meninggalkan pos sementara untuk melaksanakan ibadah Sholat Jumat. Pintu gerbang dirapatkan sementara. Terima kasih.'
  },
  {
    id: 'SEC-20261111-1420',
    tanggal: '2026-11-11',
    jam: '14:20',
    nama_security: 'Pak Mulyadi',
    shift: 'Pagi',
    kategori_laporan: 'PAKET_TAMU',
    sub_kategori: 'Titipan Paket di Pos',
    house_id: 'H-09',
    nama_warga_tujuan: 'Pak Zakaria (Bang Jak) / Ibu Negara',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Cerah',
    status_gerbang: 'Standby Pos Utama',
    detail_catatan: 'Titipan paket atas nama Ibu Negara (Rumah No. 09 - Bang Jak) diterima di pos.',
    teks_wa: 'Selamat siang izin menginformasikan ada paket untuk Rumah No. 09 (Pak Zakaria / Ibu Negara) sudah diterima dan diamankan di Pos Security.'
  },
  {
    id: 'SEC-20261109-1030',
    tanggal: '2026-11-09',
    jam: '10:30',
    nama_security: 'Pak Mulyadi',
    shift: 'Pagi',
    kategori_laporan: 'ANOMALI_INSIDEN',
    sub_kategori: 'Isi Ulang Galon Pos Security',
    house_id: 'H-07',
    nama_warga_tujuan: 'PakKis (Kiswanto)',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Cerah',
    status_gerbang: 'Standby Pos Utama',
    detail_catatan: 'Pembelian isi ulang air galon pos security (tercatat otomatis ke counter reimburse bendahara).',
    teks_wa: 'Selamat pagi Pak Kiswanto (Bendahara), izin melaporkan pengisian ulang air galon Pos Security hari ini. Nota/bukti disimpan di pos. Terima kasih.'
  },
  {
    id: 'SEC-20261014-0915',
    tanggal: '2026-10-14',
    jam: '09:15',
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'ANOMALI_INSIDEN',
    sub_kategori: 'Perbaikan Fasilitas (Las Roda Pagar)',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Gerbang Utama Cluster',
    cuaca_815: 'Cerah',
    status_gerbang: 'Perbaikan Roda Pagar Gerbang',
    detail_catatan: 'Pendampingan pengerjaan las roda pagar gerbang utama yang macet/aus (Biaya kas Rp100.000).',
    teks_wa: 'Selamat pagi izin melaporkan giat perbaikan dan pengelasan roda pintu pagar gerbang utama Cluster Mutiara Residence agar kembali lancar dibuka-tutup.'
  },
  {
    id: 'SEC-20260921-1930',
    tanggal: '2026-09-21',
    jam: '19:30',
    nama_security: 'Pak Mulyadi',
    shift: 'Malam',
    kategori_laporan: 'ANOMALI_INSIDEN',
    sub_kategori: 'Gangguan Listrik PLN / Kabel Meledak',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Area Gardu & Tiang Depan Cluster',
    cuaca_815: 'Gerimis',
    status_gerbang: 'Siaga Penuh Pos Utama',
    detail_catatan: 'Terjadi suara ledakan pada jaringan kabel PLN di luar cluster yang menyebabkan listrik sempat padam; petugas PLN sudah dihubungi.',
    teks_wa: 'Selamat malam Bapak/Ibu warga CMR, izin melaporkan terjadi gangguan/ledakan kabel listrik PLN yang berdampak mati lampu di area kita. Saat ini kami tetap siaga memantau keamanan lingkungan sambil menunggu penanganan petugas PLN.'
  },
  {
    id: 'SEC-20260912-1845',
    tanggal: '2026-09-12',
    jam: '18:45',
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'ANOMALI_INSIDEN',
    sub_kategori: 'Lampu Sorot / MCB Pos Mati',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Pos Utama & Tiang Lampu Jalan',
    cuaca_815: 'Cerah',
    status_gerbang: 'Standby Pos Utama',
    detail_catatan: 'MCB lampu jalan sempat turun dan 1 lampu sorot pos putus, sudah dilakukan pengecekan bersama pengurus.',
    teks_wa: 'Selamat malam izin melaporkan MCB lampu penerangan sempat turun dan lampu sorot pos perlu penggantian. Sudah dicek agar penerangan lingkungan kembali normal.'
  },
  {
    id: 'SEC-20260905-1215',
    tanggal: '2026-09-05',
    jam: '12:15',
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'IZIN_ISOMA',
    sub_kategori: 'Izin Pulang Sebentar (ISOMA / Makan & Sholat)',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Izin pulang sebentar untuk makan siang dan sholat Dzuhur, pintu gerbang kecil dirapatkan.',
    teks_wa: 'Selamat siang Bapak/Ibu, izin meninggalkan pos sebentar untuk istirahat makan siang dan sholat Dzuhur. Pintu gerbang sudah dirapatkan. Terima kasih.'
  },
  {
    id: 'SEC-20260829-1510',
    tanggal: '2026-08-29',
    jam: '15:10',
    nama_security: 'Pak Mulyadi',
    shift: 'Pagi',
    kategori_laporan: 'PAKET_TAMU',
    sub_kategori: 'Paket Warga Diterima di Pos',
    house_id: 'H-02',
    nama_warga_tujuan: 'Pak Refza Muhammad / Ibu Reza Wandira',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Cerah',
    status_gerbang: 'Standby Pos Utama',
    detail_catatan: 'Paket kurir untuk Rumah No. 02 (Pak Refza Muhammad / Ibu Reza Wandira) diterima di pos.',
    teks_wa: 'Selamat sore izin menginformasikan ada paket untuk Rumah No. 02 (Pak Refza Muhammad / Ibu Reza Wandira) sudah diamankan di Pos Security.'
  },
  {
    id: 'SEC-20260818-2100',
    tanggal: '2026-08-18',
    jam: '21:00',
    nama_security: 'Pak Eko',
    shift: 'Malam',
    kategori_laporan: 'ANOMALI_INSIDEN',
    sub_kategori: 'Penutupan Pintu Gerbang Kecil (SOP)',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Gerbang Utama Cluster',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Menindaklanjuti arahan pengurus, pintu gerbang kecil selalu ditutup kembali setelah warga lewat untuk mencegah tamu tak dikenal/sales masuk tanpa izin.',
    teks_wa: 'Selamat malam izin melaporkan pintu gerbang kecil sudah ditutup rapat sesuai SOP keamanan lingkungan Cluster Mutiara Residence.'
  },
  {
    id: 'SEC-20260725-1700',
    tanggal: '2026-07-25',
    jam: '17:00',
    nama_security: 'Pak Mulyadi',
    shift: 'Pagi',
    kategori_laporan: 'PAKET_TAMU',
    sub_kategori: 'Paket Warga Diterima di Pos',
    house_id: 'H-19',
    nama_warga_tujuan: 'Pak Suwandi / Ibu Marlina',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Cerah',
    status_gerbang: 'Standby Pos Utama',
    detail_catatan: 'Titipan paket untuk Rumah No. 19 (Pak Suwandi / Ibu Marlina) disimpan di pos.',
    teks_wa: 'Selamat sore izin menginformasikan ada titipan paket untuk Rumah No. 19 (Pak Suwandi / Ibu Marlina) di Pos Security.'
  },
  {
    id: 'SEC-20260708-0800',
    tanggal: '2026-07-08',
    jam: '08:00',
    nama_security: 'Pak Mulyadi',
    shift: 'Pagi',
    kategori_laporan: 'ANOMALI_INSIDEN',
    sub_kategori: 'Tukar Jaga Sementara (Personel Izin Sakit)',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Cerah',
    status_gerbang: 'Standby Pos Utama',
    detail_catatan: 'Pak Mulyadi membackup shift pagi karena rekan personel sedang izin sakit/istirahat.',
    teks_wa: 'Selamat pagi Bapak/Ibu warga CMR, izin melaporkan pagi ini saya (Pak Mulyadi) membackup tugas jaga pagi dikarenakan rekan sedang izin kurang sehat. Situasi 815 cerah dan aman terkendali.'
  }
];

const INITIAL_DASHBOARD_DATA = {
  backend_version: 'v5.0',
  app_name: 'C-Money',
  cluster_full_name: 'Cluster Mutiara Residence Sumberjaya',
  logo_url: '/assets/logo-cmoney.png',
  current_balance: 1394200,
  balance_breakdown: {
    periode_bulan: 'November',
    periode_tahun: 2026,
    saldo_buku_berjalan: 1394200,
    pemasukan_bulan_ini: 0,
    pengeluaran_bulan_ini: 0,
    pemasukan_parkir_bulan_ini: 0,
    next_periode_bulan: 'Desember',
    next_periode_tahun: 2026,
    titipan_ipl_bulan_depan: 0,
    saldo_fisik_termasuk_titipan: 1394200
  },
  smart_period: getSmartBookPeriod(25),
  default_ipl_amount: 200000,
  total_houses: 22,
  total_active_houses: 21,
  qris_merchant_name: 'Cluster Mutiara Residence',
  qris_nmid: 'ID1026000000CMR',
  qris_image_url: '/assets/qris-cmr-statis.png',
  security_config: {
    active_1: 'Pak Eko',
    active_2: 'Pak Mulyadi',
    shift_pagi_jam: '08:00 - 20:00 WIB',
    shift_malam_jam: '20:00 - 08:00 WIB',
    libur_malam_hari: 'Jumat,Sabtu',
    galon_count_bulan_ini: 4,
    anchor_sunday_date: '2026-11-01'
  },
  parking_config: {
    total_slots: 6,
    fee_monthly: 100000,
    fee_weekend: 50000,
    fee_daily: 10000,
    free_guest_nights: 3,
    cutoff_day_ipl: 25,
    rules_note: 'Parkir Siang Gratis • Tamu Menginap Gratis maks 3 malam/bln • Member Bulanan Rp100.000 • Paket Weekend Rp50.000'
  },
  parking_slots: INITIAL_PARKING_SLOTS,
  parking_night_stats: [],
  summary_periode: { bulan: 'November', tahun: 2026 },
  houses: INITIAL_HOUSES,
  ipl_status: INITIAL_HOUSES.map((h) => ({
    id: `IPL-NOV2026-${h.id}`,
    house_id: h.id,
    nomor_rumah: h.nomor_rumah,
    nama_kepala_keluarga: h.nama_kepala_keluarga,
    alias_keluarga: h.alias_keluarga,
    periode_bulan: 'November',
    periode_tahun: 2026,
    tarif_ipl: h.tarif_ipl,
    status_bayar: h.status_huni.includes('Tidak Aktif') ? 'Non-Aktif (BPR)' : 'Belum Lunas',
    tanggal_bayar: '-',
    url_bukti: '-',
    catatan: h.status_huni.includes('Tidak Aktif') ? 'Unit Dijual oleh Pihak BPR (Bebas Tagihan)' : ''
  })),
  ipl_all_periods: [],
  monthly_closings: [
    {
      id: 'CLS-2026-10',
      periode_bulan: 'Oktober',
      periode_tahun: 2026,
      saldo_awal: 1452200,
      uang_masuk: 4100000,
      total_pengeluaran: 4158000,
      pengeluaran_proyek: 0,
      sisa_saldo: 1394200,
      status_tutup_buku: 'FINAL'
    },
    {
      id: 'CLS-2026-09',
      periode_bulan: 'September',
      periode_tahun: 2026,
      saldo_awal: 1383700,
      uang_masuk: 4200000,
      total_pengeluaran: 4131500,
      pengeluaran_proyek: 0,
      sisa_saldo: 1452200,
      status_tutup_buku: 'FINAL'
    },
    {
      id: 'CLS-2026-08',
      periode_bulan: 'Agustus',
      periode_tahun: 2026,
      saldo_awal: 1525700,
      uang_masuk: 4000000,
      total_pengeluaran: 4142000,
      pengeluaran_proyek: 0,
      sisa_saldo: 1383700,
      status_tutup_buku: 'FINAL'
    },
    {
      id: 'CLS-2026-07',
      periode_bulan: 'Juli',
      periode_tahun: 2026,
      saldo_awal: 1621700,
      uang_masuk: 4000000,
      total_pengeluaran: 4096000,
      pengeluaran_proyek: 0,
      sisa_saldo: 1525700,
      status_tutup_buku: 'FINAL'
    },
    {
      id: 'CLS-2026-06',
      periode_bulan: 'Juni',
      periode_tahun: 2026,
      saldo_awal: 2309700,
      uang_masuk: 4200000,
      total_pengeluaran: 4888000,
      pengeluaran_proyek: 816000,
      sisa_saldo: 1621700,
      status_tutup_buku: 'FINAL'
    }
  ],
  cash_ledger: [],
  security_payroll: [
    {
      id: 'PAY-202610-01',
      nama_security: 'Pak Eko',
      periode_bulan: 'Oktober',
      periode_tahun: 2026,
      gaji_pokok: 1650000,
      uang_konsumsi: 0,
      potongan_kasbon: 550000,
      gaji_bersih: 1100000,
      status_pembayaran: 'Ditransfer',
      catatan: 'Gaji Oktober Rp1.650.000 dikurangi kasbon Rp550.000'
    },
    {
      id: 'PAY-202610-02',
      nama_security: 'Pak Mulyadi',
      periode_bulan: 'Oktober',
      periode_tahun: 2026,
      gaji_pokok: 1650000,
      uang_konsumsi: 0,
      potongan_kasbon: 300000,
      gaji_bersih: 1350000,
      status_pembayaran: 'Ditransfer',
      catatan: 'Gaji Oktober Rp1.650.000 dikurangi kasbon Rp300.000'
    }
  ],
  security_schedules: generateDefaultSchedules(2026, 10),
  security_logs: INITIAL_SECURITY_LOGS
};

export default function App() {
  const [dashboardData, setDashboardData] = useState(INITIAL_DASHBOARD_DATA);
  const [loading, setLoading] = useState(false);

  // V5.0: Periode Buku Aktif yang sedang dipilih di Dashboard & Tab 22 Rumah
  const initialSmart = getSmartBookPeriod(25);
  const [activeBookBulan, setActiveBookBulan] = useState('November');
  const [activeBookTahun, setActiveBookTahun] = useState(2026);

  // State Jam Detik Real-Time, Waktu Sinkronisasi, Status Online, & Tab Aktif
  const [liveClock, setLiveClock] = useState(new Date());
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // State Modal QRIS Warga
  const [isQrisOpen, setIsQrisOpen] = useState(false);
  const [selectedHouseForQris, setSelectedHouseForQris] = useState(null);

  // State Login & Buka/Tutup Pop-up Pengurus
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // State Form 1: Input Mutasi Kas Pengurus + File Asli & Base64
  const [txForm, setTxForm] = useState({
    periode_bulan: 'November',
    periode_tahun: 2026,
    tipe: 'OUT',
    kategori: 'Perawatan Pos',
    is_proyek: false,
    nama_proyek: '',
    nominal: '',
    keterangan: '',
    file_base64: '',
    file_name: ''
  });
  const [txRawFile, setTxRawFile] = useState(null);
  const [isCompressingTxPhoto, setIsCompressingTxPhoto] = useState(false);

  // State Form 2: Update Status Lunas IPL Warga + Pilihan Bulan Buku + Paket Parkir + Auto-Jurnal
  const [iplForm, setIplForm] = useState({
    house_id: 'H-01',
    periode_bulan: initialSmart.default_ipl_bulan || 'November',
    periode_tahun: initialSmart.default_ipl_tahun || 2026,
    status_bayar: 'Lunas',
    nominal_ipl: 200000,
    paket_parkir: 'NONE', // NONE | WEEKEND | MONTHLY | CUSTOM
    nominal_parkir: 0,
    kategori_parkir: '',
    auto_journal: true,
    catatan: 'Validasi Lunas Pengurus',
    file_base64: '',
    file_name: ''
  });
  const [iplRawFile, setIplRawFile] = useState(null);
  const [isCompressingIplPhoto, setIsCompressingIplPhoto] = useState(false);

  // State Form 5 (V5.0): Pengaturan Fleksibel Tarif Parkir Fasum & Tanggal Cut-Off Buku
  const [parkingConfigForm, setParkingConfigForm] = useState({
    cutoff_day_ipl: 25,
    total_slots: 6,
    fee_monthly: 100000,
    fee_weekend: 50000,
    fee_daily: 10000,
    free_guest_nights: 3,
    rules_note: 'Parkir Siang Gratis • Tamu Menginap Gratis maks 3 malam/bln • Member Bulanan Rp100.000 • Paket Weekend Rp50.000'
  });

  const [adminStatusMsg, setAdminStatusMsg] = useState('');
  const [lastUploadedProofUrl, setLastUploadedProofUrl] = useState('');

  // Jam Digital Real-Time dengan Detik
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboard = async (bulanParam, tahunParam) => {
    const targetBulan = bulanParam || activeBookBulan || 'November';
    const targetTahun = Number(tahunParam || activeBookTahun || 2026);
    try {
      setLoading(true);
      const res = await CMoneyAPI.getPublicDashboard(targetBulan, targetTahun);
      if (res && res.status === 'success') {
        setDashboardData((prev) => ({
          ...prev,
          ...res,
          houses: res.houses?.length ? res.houses : prev.houses,
          security_schedules: res.security_schedules?.length
            ? res.security_schedules
            : prev.security_schedules,
          security_logs: res.security_logs?.length
            ? res.security_logs
            : prev.security_logs,
          parking_slots: res.parking_slots?.length
            ? res.parking_slots
            : prev.parking_slots
        }));

        // Sinkronkan form pengaturan parkir fleksibel dengan nilai terbaru dari database
        if (res.parking_config) {
          setParkingConfigForm({
            cutoff_day_ipl: Number(res.parking_config.cutoff_day_ipl || 25),
            total_slots: Number(res.parking_config.total_slots || 6),
            fee_monthly: Number(res.parking_config.fee_monthly || 100000),
            fee_weekend: Number(res.parking_config.fee_weekend || 50000),
            fee_daily: Number(res.parking_config.fee_daily || 10000),
            free_guest_nights: Number(res.parking_config.free_guest_nights || 3),
            rules_note: res.parking_config.rules_note || ''
          });
        }

        setLastSyncTime(new Date());
        setIsOnline(true);
      }
    } catch (err) {
      console.warn('Menggunakan data baseline lokal:', err.message);
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(activeBookBulan, activeBookTahun);
    const savedToken = localStorage.getItem('cmoney_pengurus_token');
    if (savedToken) {
      setIsAdminLoggedIn(true);
    }
  }, []);

  // Ganti Periode Bulan Buku dari Tab 22 Rumah / Beranda
  const handleChangeBookPeriod = async (newBulan, newTahun = 2026) => {
    setActiveBookBulan(newBulan);
    setActiveBookTahun(Number(newTahun));
    await fetchDashboard(newBulan, Number(newTahun));
  };

  const handleOpenQris = (house = null) => {
    setSelectedHouseForQris(house);
    setIsQrisOpen(true);
  };

  const handleOpenAdminButton = () => {
    if (isAdminLoggedIn) {
      setIsAdminPanelOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  // Handler Pilih Foto Nota Transaksi Pengurus
  const handleSelectTxPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTxRawFile(file);
    try {
      setIsCompressingTxPhoto(true);
      const base64Data = await compressImageToBase64(file, 800, 0.75);
      setTxForm((prev) => ({
        ...prev,
        file_base64: base64Data,
        file_name: file.name
      }));
    } catch (err) {
      alert('Gagal memproses foto nota: ' + err.message);
    } finally {
      setIsCompressingTxPhoto(false);
    }
  };

  // Handler Pilih Foto Bukti IPL di Panel Pengurus
  const handleSelectIplPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIplRawFile(file);
    try {
      setIsCompressingIplPhoto(true);
      const base64Data = await compressImageToBase64(file, 800, 0.75);
      setIplForm((prev) => ({
        ...prev,
        file_base64: base64Data,
        file_name: file.name
      }));
    } catch (err) {
      alert('Gagal memproses foto bukti IPL: ' + err.message);
    } finally {
      setIsCompressingIplPhoto(false);
    }
  };

  // Handler Pilihan Paket Parkir di Form 2 (Validasi IPL + Parkir)
  const handleSelectIplParkingPackage = (pkgType) => {
    const pCfg = dashboardData.parking_config || parkingConfigForm;
    if (pkgType === 'NONE') {
      setIplForm((prev) => ({
        ...prev,
        paket_parkir: 'NONE',
        nominal_parkir: 0,
        kategori_parkir: ''
      }));
    } else if (pkgType === 'WEEKEND') {
      setIplForm((prev) => ({
        ...prev,
        paket_parkir: 'WEEKEND',
        nominal_parkir: Number(pCfg.fee_weekend || 50000),
        kategori_parkir: 'Paket Weekend'
      }));
    } else if (pkgType === 'MONTHLY') {
      setIplForm((prev) => ({
        ...prev,
        paket_parkir: 'MONTHLY',
        nominal_parkir: Number(pCfg.fee_monthly || 100000),
        kategori_parkir: 'Member Bulanan'
      }));
    } else {
      setIplForm((prev) => ({
        ...prev,
        paket_parkir: 'CUSTOM',
        nominal_parkir: Number(pCfg.fee_daily || 10000),
        kategori_parkir: 'Parkir Harian/Tamu'
      }));
    }
  };

  // Handler Login 1 Akun Pengurus
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await CMoneyAPI.loginPengurus(username, password);
      if (res.status === 'success') {
        setIsAdminLoggedIn(true);
        setIsAdminPanelOpen(true);
        setIsLoginModalOpen(false);
        setUsername('');
        setPassword('');
      } else {
        setAuthError(res.message || 'Username atau password salah.');
      }
    } catch (err) {
      if (username === 'pengurus_cmr' && password === 'cmr_admin_2026') {
        localStorage.setItem('cmoney_pengurus_token', 'LOCAL_DEV_TOKEN');
        setIsAdminLoggedIn(true);
        setIsAdminPanelOpen(true);
        setIsLoginModalOpen(false);
      } else {
        setAuthError('Gagal terhubung ke server GAS. Periksa koneksi / kredensial.');
      }
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('cmoney_pengurus_token');
    setIsAdminLoggedIn(false);
    setIsAdminPanelOpen(false);
    setAdminStatusMsg('');
    setLastUploadedProofUrl('');
  };

  // Handler Form 1: Submit Transaksi Kas Baru + Upload Foto ke Struk_Pengeluaran_Kas
  const handleInputTransaction = async (e) => {
    e.preventDefault();
    setLastUploadedProofUrl('');
    try {
      let finalBase64 = txForm.file_base64;
      if (!finalBase64 && txRawFile) {
        setAdminStatusMsg('⏳ Mengompresi foto bukti transaksi...');
        finalBase64 = await compressImageToBase64(txRawFile, 800, 0.75);
      }

      setAdminStatusMsg(
        finalBase64
          ? '⏳ Mengunggah foto nota ke Google Drive & menyimpan transaksi...'
          : '⏳ Menyimpan transaksi ke Spreadsheet...'
      );

      const res = await CMoneyAPI.inputTransaction({
        ...txForm,
        file_base64: finalBase64,
        nominal: Number(txForm.nominal)
      });

      if (res.status === 'success') {
        const driveUrl =
          res.url_bukti && String(res.url_bukti).startsWith('http') ? res.url_bukti : '';
        setLastUploadedProofUrl(driveUrl);
        setAdminStatusMsg(
          driveUrl
            ? `✅ Transaksi Buku ${txForm.periode_bulan} & Foto Nota berhasil masuk ke Google Drive!`
            : `✅ Transaksi Buku ${txForm.periode_bulan} berhasil disimpan (Tanpa lampiran foto).`
        );
        setTxForm((prev) => ({
          ...prev,
          nominal: '',
          keterangan: '',
          nama_proyek: '',
          file_base64: '',
          file_name: ''
        }));
        setTxRawFile(null);
        await fetchDashboard(activeBookBulan, activeBookTahun);
      } else {
        setAdminStatusMsg(`⚠️ Gagal: ${res.message || 'Periksa kembali sesi login pengurus.'}`);
      }
    } catch (err) {
      setAdminStatusMsg(`❌ Error Koneksi GAS: ${err.message}`);
    }
  };

  // Handler Form 2: Update Status IPL Warga + Auto-Jurnal ke cash_ledger + Paket Parkir
  const handleUpdateIplStatus = async (e) => {
    e.preventDefault();
    if (iplForm.house_id === 'H-04') {
      setAdminStatusMsg('⚠️ Rumah No. 04 berstatus Tidak Aktif (Dijual BPR) dan bebas tagihan.');
      return;
    }
    setLastUploadedProofUrl('');
    try {
      let finalBase64 = iplForm.file_base64;
      if (!finalBase64 && iplRawFile) {
        setAdminStatusMsg('⏳ Mengompresi foto bukti transfer IPL...');
        finalBase64 = await compressImageToBase64(iplRawFile, 800, 0.75);
      }

      setAdminStatusMsg(
        `⏳ Memperbarui status IPL ${iplForm.house_id} (Buku ${iplForm.periode_bulan} ${iplForm.periode_tahun})...`
      );

      const res = await CMoneyAPI.updateIplStatus({
        ...iplForm,
        file_base64: finalBase64,
        nominal_ipl: Number(iplForm.nominal_ipl || 200000),
        nominal_parkir: Number(iplForm.nominal_parkir || 0)
      });

      if (res.status === 'success') {
        const driveUrl =
          res.url_bukti && String(res.url_bukti).startsWith('http') ? res.url_bukti : '';
        setLastUploadedProofUrl(driveUrl);
        setAdminStatusMsg(
          `✅ ${res.message || `Status IPL rumah ${iplForm.house_id} berhasil diperbarui!`}`
        );
        setIplForm((prev) => ({ ...prev, file_base64: '', file_name: '' }));
        setIplRawFile(null);
        setActiveBookBulan(iplForm.periode_bulan);
        setActiveBookTahun(Number(iplForm.periode_tahun));
        await fetchDashboard(iplForm.periode_bulan, iplForm.periode_tahun);
      } else {
        setAdminStatusMsg(`⚠️ Gagal: ${res.message || 'Tidak dapat mengupdate IPL.'}`);
      }
    } catch (err) {
      setAdminStatusMsg(`❌ Error Koneksi GAS: ${err.message}`);
    }
  };

  // Handler Form 5 (V5.0): Simpan Pengaturan Tarif Parkir Fleksibel & Tanggal Cut-Off
  const handleSaveParkingConfig = async (e) => {
    e.preventDefault();
    try {
      setAdminStatusMsg('⏳ Menyimpan aturan tarif parkir & tanggal cut-off ke database...');
      const res = await CMoneyAPI.updateParkingConfig(parkingConfigForm);
      if (res.status === 'success') {
        setAdminStatusMsg('✅ Aturan Tarif Parkir Fleksibel & Tanggal Cut-Off berhasil diperbarui!');
        await fetchDashboard(activeBookBulan, activeBookTahun);
      } else {
        setAdminStatusMsg(`⚠️ Gagal menyimpan pengaturan: ${res.message || ''}`);
      }
    } catch (err) {
      setAdminStatusMsg(`❌ Error Koneksi GAS: ${err.message}`);
    }
  };

  // Handler Tutup Buku & Kirim WA Grup via Fonnte
  const handleTriggerFonnteClosing = async (periodeBulan = activeBookBulan, periodeTahun = activeBookTahun) => {
    setAdminStatusMsg(`⏳ Memproses Tutup Buku ${periodeBulan} ${periodeTahun} & mengirim WA via Fonnte...`);
    try {
      const res = await CMoneyAPI.closeMonthAndSendWa(periodeBulan, periodeTahun);
      if (res.status === 'success') {
        setAdminStatusMsg(
          `✅ Laporan ${periodeBulan} ${periodeTahun} siap! Status Fonnte: ${res.fonnte_status}`
        );
        await fetchDashboard(activeBookBulan, activeBookTahun);
      } else {
        setAdminStatusMsg(`⚠️ Gagal mengirim WA: ${res.message}`);
      }
    } catch (err) {
      setAdminStatusMsg(`❌ Error Koneksi GAS: ${err.message}`);
    }
  };

  // Handler Simpan Laporan WA & Log Security + Ceklis Parkir Malam + Foto Watermark
  const handleAddSecurityLog = async (logPayload) => {
    const newLogItem = {
      id: `SEC-${Date.now()}`,
      ...logPayload
    };

    setDashboardData((prev) => {
      const isGalon =
        String(logPayload.sub_kategori || '').toLowerCase().includes('galon') ||
        String(logPayload.detail_catatan || '').toLowerCase().includes('galon');
      return {
        ...prev,
        security_config: {
          ...prev.security_config,
          galon_count_bulan_ini: isGalon
            ? Number(prev.security_config?.galon_count_bulan_ini || 0) + 1
            : Number(prev.security_config?.galon_count_bulan_ini || 0)
        },
        security_logs: [newLogItem, ...(prev.security_logs || [])]
      };
    });

    try {
      const res = await CMoneyAPI.inputSecurityLog(logPayload);
      if (res && res.status === 'success') {
        await fetchDashboard(activeBookBulan, activeBookTahun);
      }
      return res;
    } catch (err) {
      console.warn('Log disimpan di state lokal:', err.message);
      return { status: 'local_only' };
    }
  };

  // Handler Override Jadwal Kalender Security
  const handleUpdateSecuritySchedule = async (schedulePayload) => {
    setDashboardData((prev) => ({
      ...prev,
      security_schedules: (prev.security_schedules || []).map((item) =>
        item.tanggal === schedulePayload.tanggal ? { ...item, ...schedulePayload } : item
      )
    }));

    try {
      await CMoneyAPI.updateSecuritySchedule(schedulePayload);
      await fetchDashboard(activeBookBulan, activeBookTahun);
    } catch (err) {
      console.warn('Jadwal diupdate secara lokal:', err.message);
    }
  };

  // Handler Upload Konfirmasi Bukti QRIS oleh Warga (Mendukung Paket IPL + Parkir & Cut-Off Tgl 25)
  const handleCitizenUploadProof = async (proofPayload) => {
    const res = await CMoneyAPI.uploadIplProof(proofPayload);
    const targetBulan = proofPayload.periode_bulan || activeBookBulan;
    const targetTahun = Number(proofPayload.periode_tahun || activeBookTahun);
    setActiveBookBulan(targetBulan);
    setActiveBookTahun(targetTahun);
    await fetchDashboard(targetBulan, targetTahun);
    return res;
  };

  // Handler V5.0: Interaksi Klik Kotak Denah Parkir 1-6 (Check-In / Kosongkan Slot / Upload Bukti Parkir)
  const handleUpdateParkingSlot = async (slotPayload) => {
    // Optimistic UI update agar kotak slot langsung berubah warna seketika
    setDashboardData((prev) => ({
      ...prev,
      parking_slots: (prev.parking_slots || INITIAL_PARKING_SLOTS).map((s) =>
        Number(s.slot_number) === Number(slotPayload.slot_number)
          ? {
              ...s,
              ...slotPayload,
              status_slot: slotPayload.status_slot || 'TERISI'
            }
          : s
      )
    }));

    const res = await CMoneyAPI.updateParkingSlot({
      ...slotPayload,
      periode_bulan: slotPayload.periode_bulan || activeBookBulan,
      periode_tahun: Number(slotPayload.periode_tahun || activeBookTahun)
    });
    if (res && res.status === 'success') {
      await fetchDashboard(activeBookBulan, activeBookTahun);
    }
    return res;
  };

  // Helper Pintasan Tab dari Pop-up Pengurus ke Layar Utama
  const handleJumpToTabFromAdmin = (tabId) => {
    setActiveTab(tabId);
    setIsAdminPanelOpen(false);
  };

  const smartPeriodInfo = dashboardData.smart_period || getSmartBookPeriod(parkingConfigForm.cutoff_day_ipl || 25);

  return (
    <div className="min-h-screen w-full overflow-x-hidden overflow-y-auto bg-slate-100 text-slate-800 relative">
      {/* DASHBOARD PUBLIK WARGA & SECURITY */}
      <PublicDashboard
        data={dashboardData}
        loading={loading}
        isRefreshing={loading}
        onRefresh={() => fetchDashboard(activeBookBulan, activeBookTahun)}
        liveClock={liveClock}
        lastSyncTime={lastSyncTime}
        isOnline={isOnline}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeBookBulan={activeBookBulan}
        activeBookTahun={activeBookTahun}
        onChangeBookPeriod={handleChangeBookPeriod}
        onOpenQris={handleOpenQris}
        onOpenAdminLogin={handleOpenAdminButton}
        isAdminLoggedIn={isAdminLoggedIn}
        onAddSecurityLog={handleAddSecurityLog}
        onUpdateSecuritySchedule={handleUpdateSecuritySchedule}
        onUploadIplProof={handleCitizenUploadProof}
        onUpdateParkingSlot={handleUpdateParkingSlot}
      />

      {/* MODAL QRIS STATIS + UPLOAD BUKTI KE DRIVE Bukti_Iuran_Warga + PAKET PARKIR */}
      <QrisPaymentModal
        isOpen={isQrisOpen}
        onClose={() => setIsQrisOpen(false)}
        selectedHouse={selectedHouseForQris}
        houses={dashboardData.houses}
        qrisImageUrl={dashboardData.qris_image_url}
        merchantName={dashboardData.qris_merchant_name}
        defaultAmount={dashboardData.default_ipl_amount}
        parkingConfig={dashboardData.parking_config || parkingConfigForm}
        smartPeriod={smartPeriodInfo}
        activeBookBulan={activeBookBulan}
        activeBookTahun={activeBookTahun}
        onUploadIplProof={handleCitizenUploadProof}
        onConfirmQrisProof={handleCitizenUploadProof}
      />

      {/* TOMBOL MENGAMBANG PEMBUKA PANEL PENGURUS SAAT POP-UP DITUTUP SEMENTARA */}
      {isAdminLoggedIn && !isAdminPanelOpen && (
        <div className="fixed bottom-5 right-5 z-40">
          <button
            onClick={() => setIsAdminPanelOpen(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-xl border-2 border-white transition active:scale-95"
          >
            <span>⚙️ Buka Panel Pengurus</span>
            <span className="bg-slate-900 text-amber-300 px-2 py-0.5 rounded-lg text-[10px]">
              Aktif
            </span>
          </button>
        </div>
      )}

      {/* MODAL LOGIN 1 AKUN PENGURUS (TANPA GMAIL) */}
      {isLoginModalOpen && !isAdminLoggedIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn my-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                  Hidden Access
                </span>
                <h3 className="text-lg font-extrabold text-slate-800 mt-1">
                  Login Pengurus CMR
                </h3>
              </div>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold"
                title="Tutup"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Username Tunggal
                </label>
                <input
                  type="text"
                  required
                  placeholder="pengurus_cmr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Password Pengurus
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {authError && (
                <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-xl font-medium">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm shadow-md transition"
              >
                Masuk Panel Pengurus
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PANEL KENDALI PENGURUS (V5.0: CUT-OFF TGL 25 + AUTO-JURNAL + TARIF PARKIR FLEKSIBEL) */}
      {isAdminLoggedIn && isAdminPanelOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
          onClick={() => setIsAdminPanelOpen(false)}
        >
          <div
            className="bg-slate-900 text-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-teal-500/30 max-h-[92vh] overflow-y-auto my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Atas Pop-up Pengurus */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">
                    Mode Pengurus Aktif (V5.0)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    GAS API: {dashboardData.backend_version || 'v5.0'}
                  </span>
                </div>
                <h4 className="font-extrabold text-base sm:text-lg mt-1">
                  Panel Kendali Bendahara & Pengurus CMR
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdminPanelOpen(false)}
                  className="text-xs font-bold bg-teal-700 hover:bg-teal-600 text-white px-3 py-2 rounded-xl transition flex items-center gap-1 shadow"
                >
                  <span>← Kembali ke Layar Utama</span>
                </button>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="text-xs bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white px-3 py-2 rounded-xl font-bold transition"
                >
                  Logout
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdminPanelOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-extrabold flex items-center justify-center"
                  title="Tutup Jendela (Layar Utama Tetap Bisa Diakses)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Info Siklus Buku Cut-Off Tanggal 25 */}
            <div className="mb-3 bg-teal-950/70 border border-teal-700/50 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-teal-300">
                  📅 Siklus Buku Cut-Off Tgl {smartPeriodInfo.cutoff_day}:
                </span>{' '}
                <span className="text-slate-200">
                  {smartPeriodInfo.is_after_cutoff
                    ? `Hari ini tgl ${smartPeriodInfo.current_day} (Sudah lewat tgl ${smartPeriodInfo.cutoff_day}) → Default Iuran IPL otomatis diarahkan ke Buku ${smartPeriodInfo.default_ipl_bulan} ${smartPeriodInfo.default_ipl_tahun}.`
                    : `Hari ini tgl ${smartPeriodInfo.current_day} (Sebelum tgl ${smartPeriodInfo.cutoff_day}) → Default Iuran IPL masuk ke Buku ${smartPeriodInfo.default_ipl_bulan} ${smartPeriodInfo.default_ipl_tahun}.`}
                </span>
              </div>
              <span className="bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-lg font-bold text-[11px]">
                Buku Dilihat: {activeBookBulan} {activeBookTahun}
              </span>
            </div>

            {/* Bar Pintasan Interaksi 5 Tab Menu Layar Utama */}
            <div className="mb-4 bg-slate-800/90 border border-slate-700 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-300 font-semibold pl-1">
                🧭 Lihat Menu Layar Utama:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleJumpToTabFromAdmin('overview')}
                  className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-teal-600 text-white transition"
                >
                  🏠 Beranda
                </button>
                <button
                  type="button"
                  onClick={() => handleJumpToTabFromAdmin('houses')}
                  className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-teal-600 text-white transition"
                >
                  🏘️ 22 Rumah
                </button>
                <button
                  type="button"
                  onClick={() => handleJumpToTabFromAdmin('ledger')}
                  className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-teal-600 text-white transition"
                >
                  📑 Buku Kas
                </button>
                <button
                  type="button"
                  onClick={() => handleJumpToTabFromAdmin('parking')}
                  className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-teal-600 text-white transition"
                >
                  🅿️ Parkir Fasum
                </button>
                <button
                  type="button"
                  onClick={() => handleJumpToTabFromAdmin('security')}
                  className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-teal-600 text-white transition"
                >
                  🛡️ Pos & SOS
                </button>
              </div>
            </div>

            {adminStatusMsg && (
              <div className="mb-4 text-xs bg-teal-950/90 border border-teal-500/40 text-teal-200 px-3.5 py-2.5 rounded-xl font-medium space-y-1">
                <div>{adminStatusMsg}</div>
                {lastUploadedProofUrl && (
                  <div>
                    <a
                      href={lastUploadedProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-amber-300 underline font-bold hover:text-amber-200"
                    >
                      📎 Buka Foto Bukti di Google Drive →
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FORM 1: INPUT MUTASI KAS + UPLOAD STRUK KE DRIVE */}
              <form
                onSubmit={handleInputTransaction}
                className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2.5"
              >
                <p className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                  1. Input Mutasi Kas + Bukti Struk Drive
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">
                      Bulan Buku Anggaran
                    </label>
                    <select
                      value={txForm.periode_bulan}
                      onChange={(e) => setTxForm({ ...txForm, periode_bulan: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                    >
                      {MONTH_LIST_ID.map((m) => (
                        <option key={m} value={m}>
                          Buku {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">
                      Tahun Buku
                    </label>
                    <input
                      type="number"
                      value={txForm.periode_tahun}
                      onChange={(e) => setTxForm({ ...txForm, periode_tahun: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={txForm.tipe}
                    onChange={(e) => setTxForm({ ...txForm, tipe: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                  >
                    <option value="OUT">Kas Keluar (OUT)</option>
                    <option value="IN">Kas Masuk (IN)</option>
                  </select>
                  <select
                    value={txForm.kategori}
                    onChange={(e) => setTxForm({ ...txForm, kategori: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                  >
                    <option value="Gaji">Gaji</option>
                    <option value="Sampah">Sampah</option>
                    <option value="Perawatan Pos">Perawatan Pos</option>
                    <option value="Konsumsi">Konsumsi</option>
                    <option value="Sosial">Sosial</option>
                    <option value="Listrik">Listrik</option>
                    <option value="Air">Air</option>
                    <option value="Iuran Warga">Iuran Warga</option>
                    <option value="Parkir Fasum">Parkir Fasum</option>
                  </select>
                </div>

                <input
                  type="number"
                  required
                  placeholder="Nominal (Contoh: 150000)"
                  value={txForm.nominal}
                  onChange={(e) => setTxForm({ ...txForm, nominal: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />

                <input
                  type="text"
                  required
                  placeholder="Keterangan detail (Contoh: Beli lampu sorot pos)"
                  value={txForm.keterangan}
                  onChange={(e) => setTxForm({ ...txForm, keterangan: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={txForm.is_proyek}
                    onChange={(e) => setTxForm({ ...txForm, is_proyek: e.target.checked })}
                  />
                  Tandai sebagai Pengeluaran Proyek
                </label>

                {txForm.is_proyek && (
                  <input
                    type="text"
                    placeholder="Nama Proyek (Contoh: Perbaikan Pagar)"
                    value={txForm.nama_proyek}
                    onChange={(e) => setTxForm({ ...txForm, nama_proyek: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                )}

                <div className="bg-slate-900/90 border border-dashed border-teal-500/50 rounded-xl p-2.5">
                  <label className="block text-[11px] font-bold text-teal-300 mb-1">
                    📷 Upload Foto Nota / Bukti (Drive: Struk_Pengeluaran_Kas)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSelectTxPhoto}
                    className="w-full text-[11px] text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-teal-700 file:text-white hover:file:bg-teal-600"
                  />
                  {isCompressingTxPhoto && (
                    <p className="text-[10px] text-amber-300 mt-1">
                      ⏳ Mengompresi foto nota...
                    </p>
                  )}
                  {txForm.file_base64 && (
                    <div className="mt-2 flex items-center justify-between bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                      <div className="flex items-center gap-2">
                        <img
                          src={txForm.file_base64}
                          alt="Preview Nota"
                          className="w-10 h-10 object-cover rounded border border-teal-500/40"
                        />
                        <div className="text-[10px] text-emerald-300 font-semibold truncate max-w-[130px]">
                          ✓ {txForm.file_name || 'Foto siap diunggah'} (
                          {Math.round(txForm.file_base64.length / 1024)} KB)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTxForm((prev) => ({ ...prev, file_base64: '', file_name: '' }));
                          setTxRawFile(null);
                        }}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-bold px-2"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isCompressingTxPhoto}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 rounded-xl font-bold text-xs shadow transition"
                >
                  Simpan Transaksi ke Buku {txForm.periode_bulan}
                </button>
              </form>

              {/* FORM 2: VALIDASI LUNAS IPL + PAKET PARKIR + AUTO-JURNAL KE BUKU KAS */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col justify-between space-y-3">
                <form onSubmit={handleUpdateIplStatus} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                      2. Validasi Lunas IPL & Parkir Warga
                    </p>
                    <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full font-bold">
                      Auto-Jurnal Kas
                    </span>
                  </div>

                  {/* Pilihan Bulan Buku & Tahun Buku IPL */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">
                        Periode Bulan IPL
                      </label>
                      <select
                        value={iplForm.periode_bulan}
                        onChange={(e) => setIplForm({ ...iplForm, periode_bulan: e.target.value })}
                        className="w-full bg-slate-900 border border-teal-500/50 rounded-xl px-2.5 py-2 text-xs text-amber-300 font-bold"
                      >
                        {MONTH_LIST_ID.map((m) => (
                          <option key={m} value={m}>
                            Buku {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">
                        Tahun Buku
                      </label>
                      <input
                        type="number"
                        value={iplForm.periode_tahun}
                        onChange={(e) => setIplForm({ ...iplForm, periode_tahun: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={iplForm.house_id}
                      onChange={(e) => setIplForm({ ...iplForm, house_id: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                    >
                      {dashboardData.houses
                        .filter((h) => !h.status_huni?.includes('Tidak Aktif') && h.id !== 'H-04')
                        .map((h) => (
                          <option key={h.id} value={h.id}>
                            No. {h.nomor_rumah} - {h.nama_kepala_keluarga}
                          </option>
                        ))}
                    </select>

                    <select
                      value={iplForm.status_bayar}
                      onChange={(e) => setIplForm({ ...iplForm, status_bayar: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                    >
                      <option value="Lunas">Lunas</option>
                      <option value="Belum Lunas">Belum Lunas</option>
                    </select>
                  </div>

                  {/* Pilihan Paket Tambahan Parkir Fasum Saat Bayar IPL */}
                  <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 space-y-2">
                    <label className="block text-[10px] font-bold text-amber-300 uppercase">
                      🅿️ Tambahan Paket Parkir Fasum (Opsional):
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectIplParkingPackage('NONE')}
                        className={`text-[11px] py-1.5 px-2 rounded-lg font-bold border transition ${
                          iplForm.paket_parkir === 'NONE'
                            ? 'bg-teal-700 border-teal-400 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        IPL Saja (Rp200rb)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectIplParkingPackage('WEEKEND')}
                        className={`text-[11px] py-1.5 px-2 rounded-lg font-bold border transition ${
                          iplForm.paket_parkir === 'WEEKEND'
                            ? 'bg-teal-700 border-teal-400 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        + Weekend (Rp{(parkingConfigForm.fee_weekend / 1000).toFixed(0)}rb)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectIplParkingPackage('MONTHLY')}
                        className={`text-[11px] py-1.5 px-2 rounded-lg font-bold border transition ${
                          iplForm.paket_parkir === 'MONTHLY'
                            ? 'bg-teal-700 border-teal-400 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        + Member (Rp{(parkingConfigForm.fee_monthly / 1000).toFixed(0)}rb)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectIplParkingPackage('CUSTOM')}
                        className={`text-[11px] py-1.5 px-2 rounded-lg font-bold border transition ${
                          iplForm.paket_parkir === 'CUSTOM'
                            ? 'bg-teal-700 border-teal-400 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        + Parkir Kustom
                      </button>
                    </div>

                    {iplForm.paket_parkir !== 'NONE' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[10px] text-slate-400">Nominal Parkir (Rp)</label>
                          <input
                            type="number"
                            value={iplForm.nominal_parkir}
                            onChange={(e) =>
                              setIplForm({ ...iplForm, nominal_parkir: Number(e.target.value) })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400">Label Kategori</label>
                          <input
                            type="text"
                            value={iplForm.kategori_parkir}
                            onChange={(e) =>
                              setIplForm({ ...iplForm, kategori_parkir: e.target.value })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Centang Auto-Jurnal ke cash_ledger */}
                  <label className="flex items-center gap-2 text-[11px] text-emerald-300 font-semibold cursor-pointer bg-emerald-950/40 border border-emerald-700/40 px-2.5 py-1.5 rounded-xl">
                    <input
                      type="checkbox"
                      checked={iplForm.auto_journal}
                      onChange={(e) => setIplForm({ ...iplForm, auto_journal: e.target.checked })}
                    />
                    <span>
                      Otomatis catat Rp
                      {(Number(iplForm.nominal_ipl || 200000) + Number(iplForm.nominal_parkir || 0)).toLocaleString('id-ID')}{' '}
                      ke Buku Kas ({iplForm.periode_bulan})
                    </span>
                  </label>

                  <div className="bg-slate-900/90 border border-dashed border-teal-500/50 rounded-xl p-2.5">
                    <label className="block text-[11px] font-bold text-teal-300 mb-1">
                      📷 Lampirkan Bukti Transfer Warga (Drive: Bukti_Iuran_Warga)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSelectIplPhoto}
                      className="w-full text-[11px] text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-teal-700 file:text-white hover:file:bg-teal-600"
                    />
                    {isCompressingIplPhoto && (
                      <p className="text-[10px] text-amber-300 mt-1">
                        ⏳ Mengompresi bukti transfer...
                      </p>
                    )}
                    {iplForm.file_base64 && (
                      <div className="mt-2 flex items-center justify-between bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-2">
                          <img
                            src={iplForm.file_base64}
                            alt="Preview IPL"
                            className="w-9 h-9 object-cover rounded border border-teal-500/40"
                          />
                          <span className="text-[10px] text-emerald-300 font-semibold truncate max-w-[130px]">
                            ✓ {iplForm.file_name || 'Bukti siap dikirim'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIplForm((prev) => ({ ...prev, file_base64: '', file_name: '' }));
                            setIplRawFile(null);
                          }}
                          className="text-[10px] text-rose-400 font-bold px-2"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isCompressingIplPhoto}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl font-bold text-xs shadow transition"
                  >
                    Validasi Lunas ({iplForm.periode_bulan}) & Masuk Buku Kas
                  </button>
                </form>

                {/* FORM 4: TUTUP BUKU & AUTO-SEND WA FONNTE */}
                <div className="pt-3 border-t border-slate-700">
                  <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                    3. Tutup Buku Bulanan & Broadcast WA (Fonnte)
                  </p>
                  <button
                    type="button"
                    onClick={() => handleTriggerFonnteClosing(activeBookBulan, activeBookTahun)}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-extrabold text-xs shadow-lg transition"
                  >
                    📲 Tutup Buku {activeBookBulan} {activeBookTahun} & Kirim WA Grup
                  </button>
                </div>
              </div>
            </div>

            {/* FORM 5 (BARU V5.0): PENGATURAN FLEKSIBEL TARIF PARKIR FASUM & CUT-OFF TANGGAL 25 */}
            <form
              onSubmit={handleSaveParkingConfig}
              className="mt-4 bg-slate-800/90 p-4 rounded-2xl border border-amber-500/30 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                    4. Pengaturan Fleksibel Tarif Parkir Fasum & Tanggal Cut-Off Buku (Database)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Jika hasil musyawarah warga berubah, Pengurus cukup mengubah angka di bawah ini tanpa perlu menyentuh kodingan.
                  </p>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow transition"
                >
                  💾 Simpan Aturan ke Database
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                <div>
                  <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                    Tgl Cut-Off IPL
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={parkingConfigForm.cutoff_day_ipl}
                    onChange={(e) =>
                      setParkingConfigForm({
                        ...parkingConfigForm,
                        cutoff_day_ipl: Number(e.target.value)
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                    Jumlah Slot (6-8)
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="10"
                    value={parkingConfigForm.total_slots}
                    onChange={(e) =>
                      setParkingConfigForm({
                        ...parkingConfigForm,
                        total_slots: Number(e.target.value)
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                    Member/Bln (Rp)
                  </label>
                  <input
                    type="number"
                    value={parkingConfigForm.fee_monthly}
                    onChange={(e) =>
                      setParkingConfigForm({
                        ...parkingConfigForm,
                        fee_monthly: Number(e.target.value)
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-emerald-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                    Weekend/Bln (Rp)
                  </label>
                  <input
                    type="number"
                    value={parkingConfigForm.fee_weekend}
                    onChange={(e) =>
                      setParkingConfigForm({
                        ...parkingConfigForm,
                        fee_weekend: Number(e.target.value)
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-sky-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                    Harian/Mlm (Rp)
                  </label>
                  <input
                    type="number"
                    value={parkingConfigForm.fee_daily}
                    onChange={(e) =>
                      setParkingConfigForm({
                        ...parkingConfigForm,
                        fee_daily: Number(e.target.value)
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                    Gratis Tamu (Mlm)
                  </label>
                  <input
                    type="number"
                    value={parkingConfigForm.free_guest_nights}
                    onChange={(e) =>
                      setParkingConfigForm({
                        ...parkingConfigForm,
                        free_guest_nights: Number(e.target.value)
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                  Catatan Aturan Parkir Fasum (Tampil di Halaman Warga):
                </label>
                <input
                  type="text"
                  value={parkingConfigForm.rules_note}
                  onChange={(e) =>
                    setParkingConfigForm({ ...parkingConfigForm, rules_note: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
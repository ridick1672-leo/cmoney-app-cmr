import React, { useState, useEffect } from 'react';
import PublicDashboard from './components/PublicDashboard';
import { CMoneyAPI, compressImageToBase64 } from './services/apiService';

// Data 22 Unit Rumah CMR beserta Alias Keluarga (Terkunci V2 & V3)
const BASELINE_HOUSES = [
  { id: 'H-01', nomor_rumah: 'No. 01', nama_warga: 'Pak Suharso', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Suharso / Ibu Suharso' },
  { id: 'H-02', nomor_rumah: 'No. 02', nama_warga: 'Pak Refza', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Refza Muhammad / Ibu Reza Wandira' },
  { id: 'H-03', nomor_rumah: 'No. 03', nama_warga: 'Pak Upen', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Upen / Keluarga (Unit Kontrak Pak Dwi)' },
  { id: 'H-04', nomor_rumah: 'No. 04', nama_warga: 'Dijual', status_huni: 'Tidak Aktif', tarif_ipl: 0, alias_keluarga: 'Unit Kosong - Dijual Pihak BPR' },
  { id: 'H-05', nomor_rumah: 'No. 05', nama_warga: 'Pak Anggi', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Anggi Hakim / Ibu / Abang Rafa' },
  { id: 'H-06', nomor_rumah: 'No. 06', nama_warga: 'Pak Andy', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Agustian Ekandiarto (Pak Andi) / Ibu' },
  { id: 'H-07', nomor_rumah: 'No. 07', nama_warga: 'Pak Romy', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Romy (Ketua Cluster) / Ibu' },
  { id: 'H-08', nomor_rumah: 'No. 08', nama_warga: 'Pak Sony', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Sonny Ilham / Ibu' },
  { id: 'H-09', nomor_rumah: 'No. 09', nama_warga: 'Pak Robi', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Robisan (Kang Robi) / Ibu / Kakak Aca' },
  { id: 'H-10', nomor_rumah: 'No. 10', nama_warga: 'Pak Ridick', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Ridick / Ibu' },
  { id: 'H-11', nomor_rumah: 'No. 11', nama_warga: 'Pak Zakaria', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Zakaria (Bang Jak) / Ibu Negara' },
  { id: 'H-12', nomor_rumah: 'No. 12', nama_warga: 'Pak Kiswanto', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Kiswanto (Bendahara) / Ibu' },
  { id: 'H-13', nomor_rumah: 'No. 13', nama_warga: 'Pak Hery', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Hermawan (Pak Hery) / Ibu Dewi' },
  { id: 'H-14', nomor_rumah: 'No. 14', nama_warga: 'Pak Dwi', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Dwi JokaW / Ibu Tuti' },
  { id: 'H-15', nomor_rumah: 'No. 15', nama_warga: 'Pak Juhairi', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Juhairi (Ex-Unit Pak Yanuar) / Ibu' },
  { id: 'H-16', nomor_rumah: 'No. 16', nama_warga: 'Pak Baim', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Adi Wiyatno (Pak Baim) / Ibu' },
  { id: 'H-17', nomor_rumah: 'No. 17', nama_warga: 'Pak Yose', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Yose Rizal / Ibu' },
  { id: 'H-18', nomor_rumah: 'No. 18', nama_warga: 'Pak Jihad', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Jihad / Ibu' },
  { id: 'H-19', nomor_rumah: 'No. 19', nama_warga: 'Pak Jacob', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Opa Jacob / Ibu' },
  { id: 'H-20', nomor_rumah: 'No. 20', nama_warga: 'Pak Ramon', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Ramon / Ibu Yuska / Abang Rasya' },
  { id: 'H-21', nomor_rumah: 'No. 21', nama_warga: 'Pak Suwandi', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Suwandi / Ibu Marlina' },
  { id: 'H-22', nomor_rumah: 'No. 22', nama_warga: 'Pak Baim', status_huni: 'Aktif', tarif_ipl: 200000, alias_keluarga: 'Pak Adi Wiyatno (Pak Baim) / Keluarga' }
];

/**
 * Generator Kalender Dinamis Security (Terkunci V3):
 * - Minggu s/d Kamis: Penjagaan normal 2 shift (Pagi 08:00-20:00 & Malam 20:00-08:00)
 * - Jumat: Shift pagi tetap bertugas, sedangkan shift malam LIBUR (Gerbang Mandiri 20:00)
 * - Sabtu: Pertukaran shift mingguan (Petugas malam naik ke Pagi), sedangkan shift malam LIBUR
 * - Minggu dst: Kembali normal 2 shift dengan posisi petugas yang sudah bertukar
 */
function generateDefaultSecuritySchedules(year = 2026, monthIndex = 10) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const anchorSunday = new Date(2026, 10, 1);
  const result = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, monthIndex, d);
    const dow = dateObj.getDay();
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const diffDays = Math.floor((dateObj - anchorSunday) / (1000 * 60 * 60 * 24));
    const cycleWeek = Math.floor((diffDays + 1) / 7);
    const isEvenCycle = ((cycleWeek % 2) + 2) % 2 === 0;

    const morningGuard = isEvenCycle ? 'Pak Eko' : 'Pak Mulyadi';
    const nightGuard = isEvenCycle ? 'Pak Mulyadi' : 'Pak Eko';

    let shiftPagi = morningGuard;
    let jamPagi = '08:00 - 20:00';
    let shiftMalam = nightGuard;
    let jamMalam = '20:00 - 08:00';
    let statusJadwal = 'NORMAL_2_SHIFT';
    let catatanJadwal = 'Penjagaan normal 2 shift (Pagi & Malam)';

    if (dow === 5) {
      shiftMalam = 'LIBUR';
      jamMalam = 'Gerbang Mandiri (20:00)';
      statusJadwal = 'MALAM_LIBUR';
      catatanJadwal = `Jumat: ${shiftPagi} bertugas shift pagi, shift malam LIBUR (Gerbang Mandiri mulai 20:00 WIB)`;
    } else if (dow === 6) {
      shiftMalam = 'LIBUR';
      jamMalam = 'Gerbang Mandiri (20:00)';
      statusJadwal = 'ROTASI_MALAM_LIBUR';
      catatanJadwal = `Sabtu (Rotasi Mingguan): ${shiftPagi} naik ke shift pagi, shift malam LIBUR (Gerbang Mandiri mulai 20:00 WIB)`;
    } else if (dow === 0) {
      catatanJadwal = `Minggu: Kembali normal 2 shift (${shiftPagi} Pagi, ${shiftMalam} Malam)`;
    }

    result.push({
      id: `SCH-${year}${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      tanggal: dateStr,
      hari: dayNames[dow],
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

// Histori Log & Anomali Nyata dari Grup WA Cluster Mutiara Residence (Terkunci V3)
const BASELINE_SECURITY_LOGS = [
  {
    id: 'SEC-20261014-01',
    tanggal: '2026-10-14',
    jam: '05:05',
    nama_security: 'Pak Eko',
    shift: 'Malam',
    kategori_laporan: 'PATROLI',
    sub_kategori: 'Patroli Subuh (05:00)',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: '5 Titik (Pos, Gerbang, Gang Depan, Gang Belakang, Lapangan)',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Kecil & Utama Ditutup Sesuai SOP',
    detail_catatan: 'Patroli subuh kontrol 5 titik lokasi aman tanpa taruna, lampu jalan dimatikan bertahap.',
    teks_wa: '*Assalamualaikum, selamat pagi*\nMenjelang subuh izin lapor petugas jaga (*Pak Eko*) pengecekan dan patroli kembali update situasi terkini kondisi area CMR dan sekitarnya. Untuk saat ini situasi tetap aman kondusif tanpa taruna apapun, aktivitas warga nihil. Berikut 815 cuaca cerah. *Terima kasih* 🙏🫡'
  },
  {
    id: 'SEC-20261013-03',
    tanggal: '2026-10-13',
    jam: '20:00',
    nama_security: 'Pak Eko',
    shift: 'Malam',
    kategori_laporan: 'ABSEN_SHIFT',
    sub_kategori: 'Serah Terima Pagi ke Malam (20:00)',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Serah terima tugas jaga malam dari Pak Mulyadi (Pagi) kepada Pak Eko (Malam) beserta foto selfie realtime.',
    teks_wa: '*ABSEN PERGANTIAN SHIFT SECURITY CMR*\nAssalamualaikum, selamat malam. Izin melaporkan serah terima tugas jaga pengamanan Cluster Mutiara Residence:\n• Petugas Jaga Pagi (Balik Kanan): *Pak Mulyadi*\n• Petugas Jaga Malam (Masuk Jaga): *Pak Eko*\n• Catatan Pos: Situasi aman kondusif tanpa taruna.\n*Terima kasih* 🙏🫡'
  },
  {
    id: 'SEC-20261013-02',
    tanggal: '2026-10-13',
    jam: '14:11',
    nama_security: 'Pak Mulyadi',
    shift: 'Pagi',
    kategori_laporan: 'PAKET_SURAT',
    sub_kategori: 'Paket Reguler di Pos',
    house_id: 'H-06',
    nama_warga_tujuan: 'Pak Agustian Ekandiarto (Pak Andi) / Ibu',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Panas Terik',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Paket tiba di pos untuk Blok A No. 06 (Pak Andy), disimpan di pos security.',
    teks_wa: '*Assalamualaikum, selamat siang*\nIzin lapor ada *1 Paket* di Pos Security untuk *Blok A No. 06* atas nama *Pak Agustian Ekandiarto (Pak Andi) / Ibu*. Status paket: *Disimpan di Pos Security*. *Terima kasih* 🙏'
  },
  {
    id: 'SEC-20261011-01',
    tanggal: '2026-10-11',
    jam: '19:47',
    nama_security: 'Pak Eko',
    shift: 'Malam',
    kategori_laporan: 'ABSEN_SHIFT',
    sub_kategori: 'Mulai Shift Minggu Malam (Kembali Normal 2 Shift)',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Masuk jaga Minggu malam pasca libur malam akhir pekan, serah terima dari Pak Mulyadi.',
    teks_wa: '*ABSEN PERGANTIAN SHIFT SECURITY CMR*\nAssalamualaikum, selamat malam. Izin lapor keamanan Minggu malam kembali normal 2 shift, diserahkan dari *Pak Mulyadi* (Pagi) kepada *Pak Eko* (Malam). Situasi aman kondusif. *Terima kasih* 🙏🫡'
  },
  {
    id: 'SEC-20261010-01',
    tanggal: '2026-10-10',
    jam: '20:00',
    nama_security: 'Pak Mulyadi',
    shift: 'Pagi',
    kategori_laporan: 'ABSEN_SHIFT',
    sub_kategori: 'Tutup Pos Malam Libur (Sabtu Malam)',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Pos Utama & Gerbang',
    cuaca_815: 'Cerah',
    status_gerbang: 'Gerbang Utama Dikunci (Buka-Tutup Mandiri Warga)',
    detail_catatan: 'Pertukaran shift Sabtu pagi selesai, gerbang dikunci karena Sabtu malam libur penjagaan.',
    teks_wa: '*Assalamualaikum, selamat malam*\nIzin lapor petugas jaga pagi (*Pak Mulyadi*) persiapan balik kanan pukul 20:00 WIB. Sesuai jadwal Sabtu malam libur penjagaan, lampu lingkungan sudah dinyalakan dan pintu gerbang utama sudah dikunci untuk buka-tutup mandiri warga. *Terima kasih* 🙏'
  },
  {
    id: 'SEC-20261009-02',
    tanggal: '2026-10-09',
    jam: '20:09',
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'ABSEN_SHIFT',
    sub_kategori: 'Tutup Pos Malam Libur (Jumat Malam)',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Pos Utama & Gerbang',
    cuaca_815: 'Cerah',
    status_gerbang: 'Gerbang Utama Dikunci (Buka-Tutup Mandiri Warga)',
    detail_catatan: 'Selesai tugas Jumat pagi, TV pos diamankan/digembok dan gerbang dikunci karena Jumat malam libur.',
    teks_wa: '*Assalamualaikum, selamat malam*\nIzin lapor petugas jaga pagi (*Pak Eko*) persiapan balik kanan pukul 20:00 WIB. Sesuai jadwal Jumat malam libur penjagaan, TV pos sudah diamankan/digembok dan pintu gerbang utama sudah dikunci. *Terima kasih* 🙏🫡'
  },
  {
    id: 'SEC-20261008-01',
    tanggal: '2026-10-08',
    jam: '10:25',
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'PAKET_SURAT',
    sub_kategori: 'Paket Diantar ke Rumah',
    house_id: 'H-13',
    nama_warga_tujuan: 'Pak Hermawan (Pak Hery) / Ibu Dewi & Ibu Marlina (No. 21)',
    titik_patroli: 'Blok A No. 13 & No. 21',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Paket sudah diantar langsung ke 2 rumah warga: Ibu Dewi (No. 13) dan Ibu Marlina (No. 21).',
    teks_wa: '*Assalamualaikum, selamat pagi*\nIzin lapor paket untuk *Blok A No. 13 (Ibu Dewi)* dan *Blok A No. 21 (Ibu Marlina)* sudah diantar langsung ke rumah warga oleh security. *Terima kasih* 🙏🏾'
  },
  {
    id: 'SEC-20261004-01',
    tanggal: '2026-10-04',
    jam: '16:53',
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'INFO_WARGA',
    sub_kategori: 'Izin Parkir Lapangan & Acara Warga',
    house_id: 'H-19',
    nama_warga_tujuan: 'Opa Jacob / Ibu',
    titik_patroli: 'Area Lapangan & Parkir Cluster',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Dibuka Sementara Acara',
    detail_catatan: 'Izin parkir mobil di area lapangan dan kegiatan acara keluarga di kediaman Opa Jacob (No. 19) pukul 18:45 WIB.',
    teks_wa: '*Assalamualaikum, selamat sore*\nIzin lapor update kegiatan warga: terdapat izin parkir kendaraan di area lapangan dan acara keluarga di kediaman *Opa Jacob (No. 19)* mulai pukul 18:45 WIB. Security siaga membantu pengaturan parkir. *Terima kasih* 🙏🫡'
  },
  {
    id: 'SEC-20261002-01',
    tanggal: '2026-10-02',
    jam: '11:42',
    nama_security: 'Pak Mulyadi',
    shift: 'Pagi',
    kategori_laporan: 'IZIN_POS',
    sub_kategori: 'Izin Sholat Jumat (Gerbang Dikunci)',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Pos Utama & Gerbang',
    cuaca_815: 'Panas Terik',
    status_gerbang: 'Gerbang Utama Digembok Sementara (Jumatan)',
    detail_catatan: 'Izin keluar melaksanakan Sholat Jumat pukul 11:42 WIB, pagar utama dikunci sementara.',
    teks_wa: '*Assalamualaikum, selamat siang*\nIzin lapor petugas jaga (*Pak Mulyadi*) pukul 11:42 WIB izin keluar melaksanakan ibadah *Sholat Jumat*. Pintu pagar utama ditutup/dikunci sementara dan dibuka kembali selesai Jumatan. *Terima kasih* 🙏'
  },
  {
    id: 'SEC-20260914-01',
    tanggal: '2026-09-14',
    jam: '12:05',
    nama_security: 'Pak Mulyadi',
    shift: 'Pagi',
    kategori_laporan: 'ANOMALI_FASILITAS',
    sub_kategori: 'Perbaikan Las Roda Pagar Utama',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Gerbang Utama Cluster',
    cuaca_815: 'Panas Terik',
    status_gerbang: 'Pagar Dalam Perbaikan Tukang Las',
    detail_catatan: 'Anomali Fasilitas: Perbaikan pengelasan roda pagar utama yang seret/rusak bersama pengurus, security tetap siaga penuh di pos.',
    teks_wa: '*Assalamualaikum, selamat siang*\nMenjelang adzan Dzuhur izin lapor petugas jaga (*Pak Mulyadi*) pengecekan dan patroli kembali update situasi terkini kondisi area CMR tetap aman tanpa taruna. Pagar utama sedang dalam perbaikan pengelasan, security tetap siaga di pos. Berikut 815 cuaca panas. *Terima kasih* 🙏'
  },
  {
    id: 'SEC-20260829-01',
    tanggal: '2026-08-29',
    jam: '10:29',
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'INFO_WARGA',
    sub_kategori: 'Pengerjaan Renovasi Rumah Warga',
    house_id: 'H-08',
    nama_warga_tujuan: 'Pak Sonny Ilham / Ibu',
    titik_patroli: 'Blok A No. 08',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Terdapat pengerjaan bangunan/renovasi di rumah Blok A No. 08 (Pak Sonny Ilham), keluar-masuk tukang terpantau aman.',
    teks_wa: '*Assalamualaikum, selamat pagi*\nIzin lapor update aktivitas lingkungan: terdapat kegiatan pengerjaan bangunan/renovasi di kediaman *Pak Sonny Ilham (No. 08)*. Keluar-masuk material dan pekerja bangunan dalam pantauan pos security. *Terima kasih* 🙏🫡'
  },
  {
    id: 'SEC-20260820-01',
    tanggal: '2026-08-20',
    jam: '10:04',
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'TAMU_COD',
    sub_kategori: 'Antisipasi Kurir COD Saat Rumah Kosong',
    house_id: '-',
    nama_warga_tujuan: 'Seluruh Warga CMR',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Anomali Keamanan: Imbauan SOP penitipan uang paket COD di pos security disertai catatan nama & blok rumah guna mencegah orang asing masuk area cluster.',
    teks_wa: '*Assalamualaikum, selamat pagi*\nIzin lapor update informasi keamanan oleh petugas jaga (*Pak Eko*): apabila Bapak/Ibu memesan paket dengan sistem *COD* saat sedang tidak ada di rumah, uang pembayaran dapat dititipkan di Pos Security (ditulis nama & nomor blok rumah) untuk mencegah orang luar masuk ke area cluster. *Terima kasih* 🙏🏾'
  },
  {
    id: 'SEC-20260811-01',
    tanggal: '2026-08-11',
    jam: '11:10',
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'ANOMALI_FASILITAS',
    sub_kategori: 'Listrik PLN Padam & Ledakan Kabel Belakang',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Area Belakang Kampung Cluster & Gardu',
    cuaca_815: 'Panas Terik',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Anomali Utilitas: Listrik PLN padam disertai suara ledakan dari kabel semrawut di belakang kampung cluster pukul 11:10 WIB. Dicek langsung oleh Pak Eko dan menyala kembali pukul 11:27 WIB.',
    teks_wa: '*Assalamualaikum, selamat siang*\nIzin lapor update darurat utilitas oleh petugas jaga (*Pak Eko*): terjadi *padam listrik dari PLN* setelah terdengar suara ledakan di area kabel belakang kampung cluster. Petugas sudah mengecek titik lokasi, alhamdulillah pukul 11:27 WIB listrik sudah menyala normal kembali. *Terima kasih* 🙏🏾'
  },
  {
    id: 'SEC-20260806-01',
    tanggal: '2026-08-06',
    jam: '11:52',
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'TAMU_COD',
    sub_kategori: 'Kunjungan Petugas Bank BSI / Survei Unit',
    house_id: 'H-04',
    nama_warga_tujuan: 'Unit Kosong - Dijual Pihak BPR / Pendampingan Pak Anggi',
    titik_patroli: 'Blok A No. 04 & Pos Security',
    cuaca_815: 'Panas Terik',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Kunjungan petugas Bank/BSI dan calon pembeli survei unit rumah didampingi pengurus (Pak Anggi), identitas name tag telah diperiksa.',
    teks_wa: '*Assalamualaikum, selamat siang*\nIzin lapor tamu masuk area cluster: petugas Bank (name tag terverifikasi) beserta calon pembeli melakukan pengecekan/survei unit didampingi *Pak Anggi*. Situasi aman terkendali. *Terima kasih* 🙏🏾'
  },
  {
    id: 'SEC-20260805-01',
    tanggal: '2026-08-05',
    jam: '17:45',
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'ANOMALI_FASILITAS',
    sub_kategori: '3 Lampu Sorot Gerbang Mati (MCB Drop)',
    house_id: '-',
    nama_warga_tujuan: '-',
    titik_patroli: 'Pos Utama & Tiang Lampu Sorot',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Anomali Fasilitas: Ketiga lampu sorot area gerbang mati bersamaan saat hendak dinyalakan sore hari akibat kendala MCB.',
    teks_wa: '*Assalamualaikum, selamat sore*\nIzin lapor kendala fasilitas pos oleh petugas jaga (*Pak Eko*): *3 lampu sorot utama mati semua* (indikasi MCB pos perlu pengecekan). Mohon arahan pengurus, *terima kasih* 🙏🏾'
  },
  {
    id: 'SEC-20260723-01',
    tanggal: '2026-07-23',
    jam: '16:50',
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'OPERASIONAL_POS',
    sub_kategori: 'Pengambilan Sampah Mingguan (Bang Adi)',
    house_id: '-',
    nama_warga_tujuan: 'Seluruh Warga CMR',
    titik_patroli: 'Seluruh Blok A-01 s/d A-22',
    cuaca_815: 'Cerah',
    status_gerbang: 'Gerbang Utama Dibuka untuk Armada Sampah',
    detail_catatan: 'Kegiatan rutin pengangkutan sampah mingguan cluster oleh Bang Adi berjalan lancar.',
    teks_wa: '*Assalamualaikum, selamat sore*\nIzin lapor giat operasional lingkungan: pengambilan sampah warga mingguan oleh *Bang Adi* sedang berlangsung di area cluster. Bagi Bapak/Ibu yang masih ada sampah di dalam rumah silakan dikeluarkan. *Terima kasih* 🙏'
  },
  {
    id: 'SEC-20260716-02',
    tanggal: '2026-07-16',
    jam: '17:16',
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'TAMU_COD',
    sub_kategori: 'Tamu Ambil Barang Warga (Verifikasi KTP & No HP)',
    house_id: '-',
    nama_warga_tujuan: 'Kerabat Warga (Verifikasi KTP)',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Anomali Tamu: Tamu kerabat warga datang mengambil motor mainan anak. Sesuai instruksi Pak Andi, KTP tamu telah difoto dan nomor HP dicatat di pos.',
    teks_wa: '*Assalamualaikum, selamat sore*\nIzin lapor giat pemeriksaan tamu oleh petugas jaga (*Pak Eko*): tamu kerabat warga yang mengambil barang (motor mainan anak) sudah *difoto KTP dan dicatat nomor HP-nya* di buku pos sesuai SOP keamanan. *Terima kasih* 🙏🏾'
  },
  {
    id: 'SEC-20260716-01',
    tanggal: '2026-07-16',
    jam: '10:44',
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'OPERASIONAL_POS',
    sub_kategori: 'Pengisian Air Galon Pos Security',
    house_id: '-',
    nama_warga_tujuan: 'Pos Security CMR',
    titik_patroli: 'Pos Utama Security',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Pembelian isi ulang air minum galon pos security dicatat untuk rekap penggantian (reimburse) bulanan bendahara Pak Kiswanto.',
    teks_wa: '*Assalamualaikum, selamat pagi*\nIzin lapor pencatatan operasional pos (*Pak Eko*): pengisian *1 Galon Air Minum Pos Security* hari ini sudah dicatat pada rekap bulanan pos sesuai arahan Bendahara (Pak Kiswanto). *Terima kasih* 🙏🏾'
  }
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
  security_config: {
    active_1: 'Pak Eko',
    active_2: 'Pak Mulyadi',
    shift_pagi_jam: '08:00 - 20:00 WIB',
    shift_malam_jam: '20:00 - 08:00 WIB',
    libur_malam_hari: 'Jumat,Sabtu',
    galon_count_bulan_ini: 4,
    anchor_sunday_date: '2026-11-01'
  },
  summary_periode: { bulan: 'November', tahun: 2026 },
  houses: BASELINE_HOUSES,
  ipl_status: BASELINE_HOUSES.map((h, i) => ({
    id: `IPL-202611-${h.id.replace('-', '')}`,
    house_id: h.id,
    periode_bulan: 'November',
    periode_tahun: 2026,
    nominal: h.status_huni === 'Tidak Aktif' ? 0 : 200000,
    status_bayar: h.status_huni === 'Tidak Aktif' ? 'Tidak Aktif' : (i < 14 ? 'Lunas' : 'Belum Lunas'),
    tanggal_bayar: h.status_huni === 'Tidak Aktif' ? '' : (i < 14 ? '2026-11-05' : ''),
    url_bukti: '',
    catatan: h.status_huni === 'Tidak Aktif' ? 'Unit Dijual oleh Pihak BPR (Non-Aktif)' : 'Tagihan IPL November 2026'
  })),
  security_schedules: generateDefaultSecuritySchedules(2026, 10),
  security_logs: BASELINE_SECURITY_LOGS,
  security_payroll: [
    { id: 'PAY-202610-01', nama_security: 'Pak Mulyadi', periode_bulan: 'Oktober', periode_tahun: 2026, gaji_pokok: 1650000, uang_konsumsi: 0, potongan_kasbon: 0, gaji_bersih: 1650000, status_pembayaran: 'Ditransfer', catatan: 'Gaji Oktober 2026 full' },
    { id: 'PAY-202610-02', nama_security: 'Pak Eko', periode_bulan: 'Oktober', periode_tahun: 2026, gaji_pokok: 1650000, uang_konsumsi: 0, potongan_kasbon: 350000, gaji_bersih: 1300000, status_pembayaran: 'Ditransfer', catatan: 'Potongan kasbon Rp 350.000' },
    { id: 'PAY-202609-01', nama_security: 'Pak Mulyadi', periode_bulan: 'September', periode_tahun: 2026, gaji_pokok: 1600000, uang_konsumsi: 0, potongan_kasbon: 0, gaji_bersih: 1600000, status_pembayaran: 'Ditransfer', catatan: 'Gaji September 2026 full' },
    { id: 'PAY-202609-02', nama_security: 'Pak Eko', periode_bulan: 'September', periode_tahun: 2026, gaji_pokok: 1600000, uang_konsumsi: 0, potongan_kasbon: 500000, gaji_bersih: 1100000, status_pembayaran: 'Ditransfer', catatan: 'Potongan kasbon Rp 500.000 (Gaji pokok Rp 1.600.000)' }
  ]
};

export default function App() {
  const [dashboardData, setDashboardData] = useState(INITIAL_FALLBACK_DATA);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Mode Pengurus (1 Akun Tunggal Tanpa Gmail)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    Boolean(localStorage.getItem('cmoney_pengurus_token'))
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // State Form 1: Input Transaksi Pengurus + Upload Foto Nota V4
  const [txForm, setTxForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
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

  // State Form 2: Update Status IPL Warga oleh Pengurus + Upload Bukti V4
  const [iplUpdateForm, setIplUpdateForm] = useState({
    house_id: 'H-01',
    periode_bulan: 'November',
    periode_tahun: 2026,
    status_bayar: 'Lunas',
    catatan: 'Lunas via Transfer / QRIS',
    file_base64: '',
    file_name: ''
  });

  // State Form 3: Tutup Buku & Trigger Fonnte WA
  const [closingPeriod, setClosingPeriod] = useState({
    bulan: 'November',
    tahun: 2026,
    target_wa: ''
  });
  const [actionStatus, setActionStatus] = useState('');
  const [lastUploadedDriveUrl, setLastUploadedDriveUrl] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await CMoneyAPI.getPublicDashboard('November', 2026);
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
            : prev.security_logs
        }));
      }
    } catch (err) {
      console.warn('Menggunakan data baseline C-Money:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await CMoneyAPI.loginPengurus(username, password);
      if (res.status === 'success') {
        setIsAdminLoggedIn(true);
        setIsLoginModalOpen(false);
        setUsername('');
        setPassword('');
      } else {
        setAuthError(res.message || 'Username atau password pengurus salah.');
      }
    } catch (err) {
      if (username === 'pengurus_cmr' && password === 'cmr_admin_2026') {
        localStorage.setItem('cmoney_pengurus_token', 'LOCAL_DEV_TOKEN');
        setIsAdminLoggedIn(true);
        setIsLoginModalOpen(false);
      } else {
        setAuthError('Gagal terhubung ke server atau kredensial salah.');
      }
    }
  };

  const handleLogoutAdmin = () => {
    localStorage.removeItem('cmoney_pengurus_token');
    setIsAdminLoggedIn(false);
  };

  // Handler Pilih Foto Nota / Struk pada Form 1 (Otomatis Kompresi ke Base64)
  const handleSelectTxPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setActionStatus('Mengompresi foto bukti transaksi...');
      const base64Str = await compressImageToBase64(file, 1000, 0.82);
      setTxForm((prev) => ({
        ...prev,
        file_base64: base64Str,
        file_name: file.name
      }));
      setActionStatus(`📷 Foto "${file.name}" siap diunggah ke folder Drive Struk_Pengeluaran_Kas.`);
    } catch (err) {
      setActionStatus(`❌ Gagal membaca file foto: ${err.message}`);
    }
  };

  // Handler Pilih Foto Bukti IPL pada Form 2 (Otomatis Kompresi ke Base64)
  const handleSelectIplPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64Str = await compressImageToBase64(file, 1000, 0.82);
      setIplUpdateForm((prev) => ({
        ...prev,
        file_base64: base64Str,
        file_name: file.name
      }));
      setActionStatus(`📷 Bukti IPL "${file.name}" siap disimpan ke folder Drive Bukti_Iuran_Warga.`);
    } catch (err) {
      setActionStatus(`❌ Gagal membaca file bukti IPL: ${err.message}`);
    }
  };

  // Handler Simpan Transaksi Kas + Upload Foto ke Struk_Pengeluaran_Kas
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLastUploadedDriveUrl('');
    setActionStatus(
      txForm.file_base64
        ? '⏳ Mengunggah foto bukti ke Google Drive (Struk_Pengeluaran_Kas) & menyimpan ke Spreadsheet...'
        : '⏳ Menyimpan transaksi ke Spreadsheet...'
    );

    try {
      const res = await CMoneyAPI.inputTransaction({
        ...txForm,
        nominal: Number(txForm.nominal)
      });
      if (res.status === 'success') {
        const driveUrl = res.url_bukti && res.url_bukti !== '-' ? res.url_bukti : '';
        if (driveUrl) setLastUploadedDriveUrl(driveUrl);

        setActionStatus(
          `✅ Transaksi ${res.tx_id} berhasil disimpan di urutan teratas! Saldo baru: Rp ${Number(
            res.new_balance
          ).toLocaleString('id-ID')}${driveUrl ? ' • Foto Bukti tersimpan di Google Drive.' : ''}`
        );
        setTxForm({
          ...txForm,
          nominal: '',
          keterangan: '',
          nama_proyek: '',
          file_base64: '',
          file_name: ''
        });
        fetchDashboard();
      } else {
        setActionStatus(`❌ Gagal: ${res.message}`);
      }
    } catch (err) {
      setActionStatus(`❌ Error koneksi: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Simpan Update Status IPL + Upload Bukti ke Bukti_Iuran_Warga
  const handleSaveIplStatus = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLastUploadedDriveUrl('');
    setActionStatus(
      iplUpdateForm.file_base64
        ? '⏳ Mengunggah bukti IPL ke Google Drive (Bukti_Iuran_Warga) & memperbarui status...'
        : '⏳ Memperbarui status IPL warga...'
    );
    try {
      const res = await CMoneyAPI.updateIplStatus(iplUpdateForm);
      if (res.status === 'success') {
        if (res.url_bukti) setLastUploadedDriveUrl(res.url_bukti);
        setActionStatus(
          `✅ ${res.message}${res.url_bukti ? ' • Foto bukti tersimpan di Drive Bukti_Iuran_Warga.' : ''}`
        );
        setIplUpdateForm((prev) => ({
          ...prev,
          file_base64: '',
          file_name: ''
        }));
        fetchDashboard();
      } else {
        setActionStatus(`❌ Gagal: ${res.message}`);
      }
    } catch (err) {
      setActionStatus(`❌ Error koneksi: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerClosingWa = async () => {
    setIsSubmitting(true);
    setActionStatus('⏳ Memproses Tutup Buku & Mengirim Laporan WA via Fonnte...');
    try {
      const res = await CMoneyAPI.closeMonthAndSendWa(
        closingPeriod.bulan,
        closingPeriod.tahun,
        closingPeriod.target_wa
      );
      if (res.status === 'success') {
        setActionStatus(`✅ Tutup Buku Selesai! Status WA Fonnte: ${res.fonnte_status}`);
      } else {
        setActionStatus(`❌ Gagal: ${res.message}`);
      }
    } catch (err) {
      setActionStatus(`❌ Error koneksi: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Simpan Laporan WA & Log Security (Otomatis Urut Paling Atas + Foto Watermark ke Drive)
  const handleInputSecurityLog = async (newLogPayload) => {
    const optimisticLog = {
      id: `SEC-${Date.now()}`,
      ...newLogPayload,
      created_at: new Date().toISOString()
    };

    const isGalon =
      String(newLogPayload.sub_kategori || '').toLowerCase().includes('galon') ||
      String(newLogPayload.detail_catatan || '').toLowerCase().includes('galon');

    setDashboardData((prev) => ({
      ...prev,
      security_logs: [optimisticLog, ...(prev.security_logs || [])],
      security_config: {
        ...(prev.security_config || {}),
        galon_count_bulan_ini:
          Number(prev.security_config?.galon_count_bulan_ini || 0) + (isGalon ? 1 : 0)
      }
    }));

    try {
      await CMoneyAPI.inputSecurityLog(newLogPayload);
      fetchDashboard();
    } catch (err) {
      console.warn('Log security tersimpan di state lokal:', err.message);
    }
  };

  // Handler Update Jadwal Kalender Security (Tukar Shift / Izin Sakit)
  const handleUpdateSecuritySchedule = async (updatedItem) => {
    setDashboardData((prev) => {
      const existing = prev.security_schedules || [];
      const idx = existing.findIndex((s) => s.tanggal === updatedItem.tanggal);
      let nextSchedules;
      if (idx !== -1) {
        nextSchedules = [...existing];
        nextSchedules[idx] = { ...nextSchedules[idx], ...updatedItem };
      } else {
        nextSchedules = [...existing, updatedItem];
      }
      return { ...prev, security_schedules: nextSchedules };
    });

    try {
      await CMoneyAPI.updateSecuritySchedule(updatedItem);
    } catch (err) {
      console.warn('Jadwal kalender diperbarui secara lokal:', err.message);
    }
  };

  return (
    <div className="relative">
      <PublicDashboard
        dashboardData={dashboardData}
        loading={loading}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminLogin={() => {
          if (!isAdminLoggedIn) setIsLoginModalOpen(true);
        }}
        onInputSecurityLog={handleInputSecurityLog}
        onUpdateSecuritySchedule={handleUpdateSecuritySchedule}
        onConfirmQrisProof={async (proof) => {
          try {
            await CMoneyAPI.uploadIplProof(proof);
            fetchDashboard();
          } catch (e) {
            console.warn(e.message);
          }
        }}
      />

      {/* PANEL KHUSUS PENGURUS (HIDDEN VIEW + FITUR UPLOAD EVIDENCE V4) */}
      {isAdminLoggedIn && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex justify-center overflow-y-auto p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 my-auto shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                  Hidden View • Mode Pengurus
                </span>
                <h2 className="text-base font-extrabold text-slate-800 mt-1">
                  Panel Kendali Pengurus C-Money
                </h2>
              </div>
              <button
                onClick={handleLogoutAdmin}
                className="text-xs bg-rose-50 text-rose-700 font-bold px-3 py-1.5 rounded-xl border border-rose-200"
              >
                Keluar
              </button>
            </div>

            {actionStatus && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-900 space-y-1.5">
                <p>{actionStatus}</p>
                {lastUploadedDriveUrl && (
                  <a
                    href={lastUploadedDriveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-extrabold text-teal-700 underline"
                  >
                    📎 Buka Foto Bukti di Google Drive →
                  </a>
                )}
              </div>
            )}

            {/* FORM 1: INPUT MUTASI KAS + UPLOAD FOTO NOTA KE DRIVE Struk_Pengeluaran_Kas */}
            <form onSubmit={handleSaveTransaction} className="space-y-3 text-xs">
              <h3 className="font-extrabold text-slate-700 uppercase tracking-wider">
                1. Input Mutasi Kas (Terbaru di Atas)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">Tipe Transaksi</label>
                  <select
                    value={txForm.tipe}
                    onChange={(e) => setTxForm({ ...txForm, tipe: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 font-bold bg-slate-50"
                  >
                    <option value="OUT">Pengeluaran (OUT)</option>
                    <option value="IN">Pemasukan (IN)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Kategori</label>
                  <select
                    value={txForm.kategori}
                    onChange={(e) =>
                      setTxForm({
                        ...txForm,
                        kategori: e.target.value,
                        is_proyek: e.target.value === 'Proyek'
                      })
                    }
                    className="w-full border rounded-xl px-3 py-2 font-bold bg-slate-50"
                  >
                    <option value="Iuran Warga">Iuran Warga</option>
                    <option value="Gaji">Gaji / Kasbon Security</option>
                    <option value="Sampah">Sampah</option>
                    <option value="Listrik">Listrik Pos</option>
                    <option value="Air">Air Galon Pos</option>
                    <option value="Konsumsi">Konsumsi Pos</option>
                    <option value="Perawatan Pos">Perawatan Pos</option>
                    <option value="Sosial">Sosial</option>
                    <option value="Proyek">Proyek Cluster</option>
                  </select>
                </div>
              </div>

              {txForm.is_proyek && (
                <div>
                  <label className="block text-slate-500 mb-1">Nama Proyek Cluster</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Perbaikan Las Roda Pagar"
                    value={txForm.nama_proyek}
                    onChange={(e) => setTxForm({ ...txForm, nama_proyek: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="200000"
                    value={txForm.nominal}
                    onChange={(e) => setTxForm({ ...txForm, nominal: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Bulan Buku</label>
                  <select
                    value={txForm.periode_bulan}
                    onChange={(e) => setTxForm({ ...txForm, periode_bulan: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 bg-slate-50"
                  >
                    {['Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Detail Keterangan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gaji Pak Eko / Token Listrik"
                  value={txForm.keterangan}
                  onChange={(e) => setTxForm({ ...txForm, keterangan: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2"
                />
              </div>

              {/* INPUT BARU V4: UPLOAD FOTO NOTA / STRUK BUKTI TRANSAKSI KE GOOGLE DRIVE */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-dashed border-teal-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-extrabold text-teal-900 text-[11px]">
                      📷 Upload Foto Nota / Bukti Transaksi (Opsional)
                    </label>
                    <p className="text-[10px] text-slate-500">
                      Otomatis masuk ke folder Drive: <strong>Struk_Pengeluaran_Kas</strong>
                    </p>
                  </div>
                  {txForm.file_base64 && (
                    <button
                      type="button"
                      onClick={() => setTxForm({ ...txForm, file_base64: '', file_name: '' })}
                      className="text-[10px] font-bold text-rose-600 hover:underline"
                    >
                      ✕ Hapus Foto
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSelectTxPhoto}
                  className="w-full text-[11px] file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-extrabold file:bg-teal-700 file:text-white hover:file:bg-teal-800 cursor-pointer"
                />

                {txForm.file_base64 && (
                  <div className="flex items-center gap-2.5 pt-1">
                    <img
                      src={txForm.file_base64}
                      alt="Preview Bukti"
                      className="w-14 h-14 object-cover rounded-xl border border-teal-300 shadow-sm"
                    />
                    <div className="text-[10px] text-slate-600">
                      <p className="font-bold text-slate-800 truncate max-w-[200px]">
                        {txForm.file_name}
                      </p>
                      <p className="text-emerald-700 font-semibold">
                        ✓ Terkompresi & siap dikirim ke Google Drive
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-400 text-white font-extrabold shadow transition"
              >
                {isSubmitting ? '⏳ Menyimpan ke Drive & Database...' : '💾 Simpan Transaksi ke Database'}
              </button>
            </form>

            {/* FORM 2: VALIDASI STATUS IPL WARGA + UPLOAD BUKTI KE Bukti_Iuran_Warga */}
            <form onSubmit={handleSaveIplStatus} className="pt-4 border-t border-slate-200 space-y-2.5 text-xs">
              <h3 className="font-extrabold text-slate-700 uppercase tracking-wider">
                2. Update Status Lunas IPL Warga
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={iplUpdateForm.house_id}
                  onChange={(e) => setIplUpdateForm({ ...iplUpdateForm, house_id: e.target.value })}
                  className="border rounded-xl px-3 py-2 font-bold bg-slate-50"
                >
                  {dashboardData.houses
                    .filter((h) => h.status_huni !== 'Tidak Aktif')
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.nomor_rumah} - {h.nama_warga}
                      </option>
                    ))}
                </select>
                <select
                  value={iplUpdateForm.status_bayar}
                  onChange={(e) => setIplUpdateForm({ ...iplUpdateForm, status_bayar: e.target.value })}
                  className="border rounded-xl px-3 py-2 font-bold bg-slate-50"
                >
                  <option value="Lunas">✅ Lunas</option>
                  <option value="Belum Lunas">⏳ Belum Lunas</option>
                </select>
              </div>

              {/* Lampirkan Foto Bukti Transfer Warga (Masuk ke Folder Bukti_Iuran_Warga) */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600">
                    📎 Lampirkan Bukti Transfer IPL (Folder Drive: <strong>Bukti_Iuran_Warga</strong>)
                  </span>
                  {iplUpdateForm.file_base64 && (
                    <button
                      type="button"
                      onClick={() => setIplUpdateForm({ ...iplUpdateForm, file_base64: '', file_name: '' })}
                      className="text-[10px] text-rose-600 font-bold"
                    >
                      ✕ Batal
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSelectIplPhoto}
                  className="w-full text-[11px] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-800 file:text-white cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-bold transition"
              >
                {isSubmitting ? '⏳ Memperbarui...' : 'Perbarui Status IPL Rumah'}
              </button>
            </form>

            {/* FORM 3: TUTUP BUKU & AUTO-SEND WA */}
            <div className="pt-4 border-t border-slate-200 space-y-3 text-xs">
              <h3 className="font-extrabold text-slate-700 uppercase tracking-wider">
                3. Tutup Buku & Kirim Laporan WA (Fonnte)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={closingPeriod.bulan}
                  onChange={(e) => setClosingPeriod({ ...closingPeriod, bulan: e.target.value })}
                  className="border rounded-xl px-3 py-2 font-bold bg-slate-50"
                >
                  {['Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((b) => (
                    <option key={b} value={b}>Periode {b}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="ID Grup WA (Opsional)"
                  value={closingPeriod.target_wa}
                  onChange={(e) => setClosingPeriod({ ...closingPeriod, target_wa: e.target.value })}
                  className="border rounded-xl px-3 py-2"
                />
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleTriggerClosingWa}
                className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-extrabold shadow-md transition"
              >
                📲 Tutup Buku & Kirim WA via Fonnte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOGIN PENGURUS */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">
                🔒 Login Khusus Pengurus CMR
              </h3>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="text-slate-400 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAdminLogin} className="mt-4 space-y-3 text-xs">
              {authError && (
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 font-semibold">
                  {authError}
                </div>
              )}
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="pengurus_cmr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Password / PIN</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-teal-700 text-white font-extrabold shadow-md"
              >
                Masuk ke Panel Pengurus
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
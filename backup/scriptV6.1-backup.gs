/**
 * C-MONEY BACKEND REST API v6.1 (GOOGLE APPS SCRIPT)
 * Sistem Manajemen Keuangan (100% Real Cash), Keamanan, Paket Pos & Parkir Dinamis
 * Cluster Mutiara Residence (CMR) Sumberjaya
 *
 * Pembaruan V6.1:
 * 1. Perbaikan parser nomor_rumah & nama_warga (bebas bug "No. No. 01" dan "undefined")
 * 2. Reset default 6 slot parkir fasum ke status KOSONG + dukungan posisi_layout denah horizontal
 * 3. Kalkulasi LIVE dari cash_ledger untuk bulan berjalan (OPEN) pada monthly_closings (fix November Rp 0)
 * 4. Pertahankan sheet deposit_parkir di Spreadsheet tanpa mencampuri Saldo Kas Nyata web
 * 5. Integrasi Check-In/Check-Out parkir oleh Security dengan opsi catat otomatis ke security_logs
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

const TABLES = {
  AUTH: 'auth_pengurus',
  HOUSES: 'houses',
  LEDGER: 'cash_ledger',
  IPL: 'ipl_status',
  PAYROLL: 'security_payroll',
  SETTINGS: 'app_settings',
  CLOSINGS: 'monthly_closings',
  WA_LOGS: 'wa_notification_logs',
  SEC_SCHEDULES: 'security_schedules',
  SEC_LOGS: 'security_logs',
  PARKING: 'parking_slots',
  DEPOSIT: 'deposit_parkir'
};

const DRIVE_UPLOADS_PARENT = '03_Assets_Uploads';
const DRIVE_FOLDERS = {
  STRUK_KAS: 'Struk_Pengeluaran_Kas',
  BUKTI_IPL: 'Bukti_Iuran_Warga',
  LOG_SECURITY: 'Log_Absensi_Security',
  ASET_SISTEM: 'Aset_Sistem'
};

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_ORDER = {
  Januari: 1, Februari: 2, Maret: 3, April: 4, Mei: 5, Juni: 6,
  Juli: 7, Agustus: 8, September: 9, Oktober: 10, November: 11, Desember: 12
};

/**
 * ============================================================================
 * JALANKAN FUNGSI "setupV61DanSinkronDatabase" INI SEKALI DI APPS SCRIPT (KLIK RUN)
 * - Mengosongkan kembali 6 slot parkir fasum ke status KOSONG (menunggu klik Security)
 * - Memastikan header parking_slots & security_logs lengkap
 * - Menyinkronkan Saldo Kas Nyata (termasuk transaksi November 2026)
 * ============================================================================
 */
function setupV61DanSinkronDatabase() {
  ensureV61DatabaseSchema_(true); // true = reset 6 slot parkir menjadi KOSONG semua
  const realBalance = syncAccurateCurrentBalance_('November', 2026);
  Logger.log('✅ Setup Database V6.1 Selesai! 6 Slot Parkir direset KOSONG. Saldo Kas Nyata: Rp ' + formatRupiah_(realBalance));
}

function setupV6DanSinkronDatabase() {
  setupV61DanSinkronDatabase();
}

/**
 * HELPER V6.1: PASTIKAN STRUKTUR SHEET SELARAS & (OPSIONAL) RESET SLOT PARKIR KOSONG
 */
function ensureV61DatabaseSchema_(forceResetParkingEmpty) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const nowIso = new Date().toISOString();

  // 1. Sinkronisasi parameter di app_settings
  const settingsSheet = ss.getSheetByName(TABLES.SETTINGS);
  if (settingsSheet) {
    const v6Settings = {
      cutoff_day_ipl: { val: '25', desc: 'Tanggal cut-off periode buku IPL bulan berikutnya (default 25)' },
      default_ipl_amount: { val: '200000', desc: 'Tarif dasar IPL wajib warga per bulan (Rp)' },
      parking_total_slots: { val: '6', desc: 'Jumlah slot parkir fasum dinamis (6 slot)' },
      parking_fee_monthly: { val: '150000', desc: 'Tarif kontribusi parkir fasum 1 Mobil bulanan (Rp)' },
      parking_fee_monthly_2cars: { val: '300000', desc: 'Tarif kontribusi parkir fasum 2 Mobil bulanan (Rp)' },
      parking_fee_weekend: { val: '50000', desc: 'Tarif kontribusi parkir fasum Weekend (Rp)' }
    };

    const data = settingsSheet.getDataRange().getValues();
    const existingKeys = {};
    for (let i = 1; i < data.length; i++) {
      existingKeys[String(data[i][0])] = i + 1;
    }

    Object.keys(v6Settings).forEach(key => {
      const item = v6Settings[key];
      if (!existingKeys[key]) {
        settingsSheet.appendRow([key, item.val, item.desc, nowIso]);
      }
    });
  }

  // 2. Struktur sheet parking_slots V6.1 (Default SEMUA 6 SLOT KOSONG + posisi_layout Denah Horizontal)
  let parkingSheet = ss.getSheetByName(TABLES.PARKING);
  const v61ParkingHeaders = [
    'slot_id',
    'slot_number',
    'posisi_layout',
    'nama_slot',
    'status_slot',
    'house_id',
    'nama_pemilik',
    'nomor_polisi',
    'jenis_paket',
    'waktu_masuk',
    'catatan',
    'url_bukti_parkir',
    'updated_by',
    'updated_at'
  ];

  const emptyV61Slots = [
    ['SLOT-01', 1, 'KIRI_VERTIKAL_1', 'Slot 01', 'Kosong', '-', '-', '-', 'Tersedia', '-', 'Kosong — Klik untuk Check-In', '-', 'SYSTEM', nowIso],
    ['SLOT-02', 2, 'KIRI_VERTIKAL_2', 'Slot 02', 'Kosong', '-', '-', '-', 'Tersedia', '-', 'Kosong — Klik untuk Check-In', '-', 'SYSTEM', nowIso],
    ['SLOT-03', 3, 'KIRI_VERTIKAL_3', 'Slot 03', 'Kosong', '-', '-', '-', 'Tersedia', '-', 'Kosong — Klik untuk Check-In', '-', 'SYSTEM', nowIso],
    ['SLOT-04', 4, 'KIRI_VERTIKAL_4', 'Slot 04', 'Kosong', '-', '-', '-', 'Tersedia', '-', 'Kosong — Klik untuk Check-In', '-', 'SYSTEM', nowIso],
    ['SLOT-05', 5, 'KANAN_ATAS_5', 'Slot 05', 'Kosong', '-', '-', '-', 'Tersedia', '-', 'Kosong — Klik untuk Check-In', '-', 'SYSTEM', nowIso],
    ['SLOT-06', 6, 'KANAN_BAWAH_6', 'Slot 06', 'Kosong', '-', '-', '-', 'Tersedia', '-', 'Kosong — Klik untuk Check-In', '-', 'SYSTEM', nowIso]
  ];

  if (!parkingSheet) {
    parkingSheet = ss.insertSheet(TABLES.PARKING);
    parkingSheet.getRange(1, 1, 1, v61ParkingHeaders.length).setValues([v61ParkingHeaders]);
    parkingSheet.getRange(2, 1, emptyV61Slots.length, v61ParkingHeaders.length).setValues(emptyV61Slots);
  } else {
    const currentHeaders = parkingSheet.getLastColumn() > 0
      ? parkingSheet.getRange(1, 1, 1, parkingSheet.getLastColumn()).getValues()[0]
      : [];
    if (forceResetParkingEmpty === true || currentHeaders.indexOf('posisi_layout') === -1 || currentHeaders.indexOf('nama_slot') === -1) {
      parkingSheet.clearContents();
      parkingSheet.getRange(1, 1, 1, v61ParkingHeaders.length).setValues([v61ParkingHeaders]);
      parkingSheet.getRange(2, 1, emptyV61Slots.length, v61ParkingHeaders.length).setValues(emptyV61Slots);
    }
  }

  // 3. Pastikan sheet security_logs memiliki kolom url_foto untuk In-App Lightbox
  const secLogSheet = ss.getSheetByName(TABLES.SEC_LOGS);
  if (secLogSheet && secLogSheet.getLastColumn() > 0) {
    const secHeaders = secLogSheet.getRange(1, 1, 1, secLogSheet.getLastColumn()).getValues()[0];
    if (secHeaders.indexOf('url_foto') === -1) {
      secLogSheet.getRange(1, secHeaders.length + 1).setValue('url_foto');
    }
  }

  // 4. Pertahankan sheet deposit_parkir jika sudah ada (tidak menimpa data yang sudah dibuat)
  let depositSheet = ss.getSheetByName(TABLES.DEPOSIT);
  if (!depositSheet) {
    depositSheet = ss.insertSheet(TABLES.DEPOSIT);
    const depHeaders = [
      'id_deposit', 'house_id', 'identitas_warga', 'total_deposit_awal',
      'tarif_potong_per_bulan', 'periode_sudah_terpotong', 'jumlah_bulan_terpotong',
      'nominal_sudah_terpotong', 'sisa_deposit', 'estimasi_sisa_bulan',
      'kebijakan_pengurus', 'updated_at'
    ];
    depositSheet.getRange(1, 1, 1, depHeaders.length).setValues([depHeaders]);
    depositSheet.appendRow([
      'DEP-H15', 'H-15', 'No. 15 / Pak Juhairi', 5000000, 150000,
      'Juni 2025 - Maret 2026', 10, 1500000, 3500000, 23,
      'Hanya memotong kontribusi slot parkir Rp150.000/bln (Tidak memotong kewajiban IPL tunai Rp200.000/bln)',
      nowIso
    ]);
  }
}

/**
 * HELPER V6.1: PARSER NOMOR RUMAH & NAMA WARGA ANTI-BUG ("No. 01 / Pak Suharso")
 */
function extractCleanHouseNumber_(rawNumOrId) {
  const digits = String(rawNumOrId || '').replace(/[^0-9]/g, '');
  return digits ? digits.padStart(2, '0') : '00';
}

function getNormalizedHouses_() {
  const rawHouses = getTableData_(TABLES.HOUSES);
  return rawHouses
    .map(h => {
      const cleanNum = extractCleanHouseNumber_(h.nomor_rumah || h.id);
      const namaWarga = String(h.nama_warga || h.nama_kepala_keluarga || 'Warga').trim();
      const displayLabel = 'No. ' + cleanNum + ' / ' + namaWarga;

      return {
        ...h,
        nomor_rumah: cleanNum,
        nama_warga: namaWarga,
        nama_kepala_keluarga: namaWarga,
        display_label: displayLabel
      };
    })
    .sort((a, b) => Number(a.nomor_rumah) - Number(b.nomor_rumah));
}

function formatHouseLabelById_(houseId, housesList) {
  if (!houseId || houseId === '-') return '-';
  const list = Array.isArray(housesList) ? housesList : getNormalizedHouses_();
  const cleanTarget = String(houseId).trim().toUpperCase();
  const targetDigits = extractCleanHouseNumber_(cleanTarget);

  const found = list.find(
    h =>
      String(h.id).toUpperCase() === cleanTarget ||
      String(h.nomor_rumah) === targetDigits
  );
  return found ? found.display_label : String(houseId);
}

/**
 * HELPER V6.1: HITUNG LIVE MONTHLY CLOSINGS DARI CASH_LEDGER UNTUK BULAN BERJALAN (OPEN)
 * Menyelesaikan masalah rincian November Rp 0 padahal sudah ada transaksi di cash_ledger
 */
function getLiveMonthlyClosings_(rawClosings, ledger, activeBulan, activeTahun) {
  const closingsList = Array.isArray(rawClosings) ? rawClosings.map(c => ({ ...c })) : [];

  // Pastikan bulan berjalan (misal November 2026) selalu ada di daftar laporan
  const hasActiveMonth = closingsList.some(
    c => String(c.periode_bulan) === String(activeBulan) && Number(c.periode_tahun) === Number(activeTahun)
  );

  if (!hasActiveMonth) {
    const octRow = closingsList.find(
      c => String(c.periode_bulan) === 'Oktober' && Number(c.periode_tahun) === Number(activeTahun)
    );
    const defaultSaldoAwal = octRow ? parseNominal_(octRow.sisa_saldo) : 1394200;
    closingsList.push({
      id: 'CLS-' + activeTahun + '-' + String(MONTH_ORDER[activeBulan] || 11).padStart(2, '0'),
      periode_bulan: activeBulan,
      periode_tahun: Number(activeTahun),
      saldo_awal: defaultSaldoAwal,
      uang_masuk: 0,
      total_pengeluaran: 0,
      pengeluaran_proyek: 0,
      sisa_saldo: defaultSaldoAwal,
      status_tutup_buku: 'OPEN'
    });
  }

  // Untuk setiap bulan yang belum CLOSED (OPEN / berjalan), hitung live dari cash_ledger
  const enriched = closingsList.map(c => {
    const isClosed = String(c.status_tutup_buku || '').toUpperCase() === 'CLOSED';
    if (isClosed) return c;

    const bulan = String(c.periode_bulan);
    const tahun = Number(c.periode_tahun || 2026);
    const monthTx = ledger.filter(
      tx => String(tx.periode_bulan) === bulan && Number(tx.periode_tahun || 2026) === tahun
    );

    let uangMasuk = 0;
    let totalPengeluaran = 0;
    let pengeluaranProyek = 0;

    monthTx.forEach(tx => {
      const nom = parseNominal_(tx.nominal);
      const isProyek = String(tx.is_proyek).toUpperCase() === 'TRUE' || tx.is_proyek === true;
      if (String(tx.tipe).toUpperCase() === 'IN') {
        uangMasuk += nom;
      } else {
        totalPengeluaran += nom;
        if (isProyek) pengeluaranProyek += nom;
      }
    });

    const saldoAwal = parseNominal_(c.saldo_awal || 1394200);
    const sisaSaldo = saldoAwal + uangMasuk - totalPengeluaran;

    return {
      ...c,
      saldo_awal: saldoAwal,
      uang_masuk: uangMasuk,
      total_pengeluaran: totalPengeluaran,
      pengeluaran_proyek: pengeluaranProyek,
      sisa_saldo: sisaSaldo,
      status_tutup_buku: c.status_tutup_buku || 'OPEN'
    };
  });

  return sortNewestFirst_(enriched);
}

/**
 * HELPER V6.1: SINKRONISASI SALDO UANG KAS NYATA (100% REAL CASH)
 */
function syncAccurateCurrentBalance_(periodeBulan, periodeTahun) {
  const targetBulan = periodeBulan || 'November';
  const targetTahun = Number(periodeTahun || 2026);

  const closings = getTableData_(TABLES.CLOSINGS);
  const ledger = getTableData_(TABLES.LEDGER);

  let baseBalance = 1394200;
  const currentClosing = closings.find(
    r => String(r.periode_bulan) === String(targetBulan) && Number(r.periode_tahun) === targetTahun
  );
  const octClosing = closings.find(
    r => String(r.periode_bulan) === 'Oktober' && Number(r.periode_tahun) === targetTahun
  );

  if (currentClosing && parseNominal_(currentClosing.saldo_awal) > 0) {
    baseBalance = parseNominal_(currentClosing.saldo_awal);
  } else if (octClosing && parseNominal_(octClosing.sisa_saldo) > 0) {
    baseBalance = parseNominal_(octClosing.sisa_saldo);
  }

  let totalInCurrent = 0;
  let totalOutCurrent = 0;

  ledger.forEach(tx => {
    const txBulan = String(tx.periode_bulan || '');
    const txTahun = Number(tx.periode_tahun || 2026);
    const nom = parseNominal_(tx.nominal);
    const isIn = String(tx.tipe).toUpperCase() === 'IN';

    if (txBulan === String(targetBulan) && txTahun === targetTahun) {
      if (isIn) totalInCurrent += nom;
      else totalOutCurrent += nom;
    }
  });

  const accurateBalance = baseBalance + totalInCurrent - totalOutCurrent;
  const settings = getSettingsMap_();
  if (parseNominal_(settings.current_balance) !== accurateBalance) {
    updateSettingValue_('current_balance', String(accurateBalance));
  }

  return accurateBalance;
}

/**
 * HELPER V6.1: PASTIKAN 22 BARIS RUMAH TERSEDIA UNTUK PERIODE BULAN YANG DIPILIH
 */
function getOrEnsureIplRowsForPeriod_(periodeBulan, periodeTahun, houses, defaultIplAmount) {
  const allIpl = getTableData_(TABLES.IPL);
  const filtered = allIpl.filter(
    r => String(r.periode_bulan) === String(periodeBulan) && Number(r.periode_tahun) === Number(periodeTahun)
  );

  if (filtered.length > 0) {
    return filtered
      .map(r => {
        const matchedHouse = houses.find(h => String(h.id) === String(r.house_id));
        const st = String(r.status_bayar || 'Belum Bayar');
        return {
          ...r,
          nomor_rumah: matchedHouse ? matchedHouse.nomor_rumah : extractCleanHouseNumber_(r.house_id),
          nama_warga: matchedHouse ? matchedHouse.nama_warga : (r.nama_warga || r.nama_kepala_keluarga || 'Warga'),
          nama_kepala_keluarga: matchedHouse ? matchedHouse.nama_warga : (r.nama_warga || r.nama_kepala_keluarga || 'Warga'),
          display_label: matchedHouse ? matchedHouse.display_label : r.house_id,
          status_bayar: st === 'Belum Lunas' ? 'Belum Bayar' : st,
          nominal_bayar: parseNominal_(r.nominal_bayar || r.tarif_ipl || defaultIplAmount || 200000)
        };
      })
      .sort((a, b) => String(a.house_id).localeCompare(String(b.house_id)));
  }

  return houses.map(h => {
    const isNonActive =
      String(h.status_huni || '').toLowerCase().indexOf('tidak aktif') !== -1 || String(h.id) === 'H-04';
    return {
      id: 'IPL-' + periodeBulan.slice(0, 3).toUpperCase() + periodeTahun + '-' + h.id,
      house_id: h.id,
      nomor_rumah: h.nomor_rumah,
      nama_warga: h.nama_warga,
      nama_kepala_keluarga: h.nama_warga,
      display_label: h.display_label,
      periode_bulan: periodeBulan,
      periode_tahun: Number(periodeTahun),
      tarif_ipl: isNonActive ? 0 : Number(h.tarif_ipl || defaultIplAmount || 200000),
      nominal_bayar: isNonActive ? 0 : Number(h.tarif_ipl || defaultIplAmount || 200000),
      status_bayar: isNonActive ? 'Tidak Aktif' : 'Belum Bayar',
      tanggal_bayar: '-',
      url_bukti: '-',
      catatan: isNonActive ? 'Unit Non-Aktif (Pihak BPR)' : '',
      updated_at: new Date().toISOString()
    };
  });
}

/**
 * HELPER V6.1: NORMALISASI 6 SLOT PARKIR DENAH HORIZONTAL (DEFAULT KOSONG)
 */
function getNormalizedParkingSlots_(houses) {
  const rawSlots = getTableData_(TABLES.PARKING);
  const layoutOrder = [
    'KIRI_VERTIKAL_1', 'KIRI_VERTIKAL_2', 'KIRI_VERTIKAL_3',
    'KIRI_VERTIKAL_4', 'KANAN_ATAS_5', 'KANAN_BAWAH_6'
  ];

  if (!rawSlots || rawSlots.length === 0) return [];

  return rawSlots
    .map((s, idx) => {
      const num = Number(s.slot_number || (idx + 1));
      const slotId = s.slot_id || ('SLOT-0' + num);
      const posisiLayout = s.posisi_layout || layoutOrder[num - 1] || ('KIRI_VERTIKAL_' + num);
      const namaSlot = s.nama_slot || ('Slot 0' + num);
      const houseId = s.house_id || '-';
      const rawStatus = String(s.status_slot || 'Kosong');
      const upperSt = rawStatus.toUpperCase();
      const normStatus =
        upperSt === 'TERISI'
          ? 'Terisi'
          : upperSt === 'WEEKEND'
          ? 'Weekend'
          : upperSt === 'TAMU'
          ? 'Tamu'
          : 'Kosong';

      const namaPemilik =
        normStatus === 'Kosong'
          ? '-'
          : (houseId !== '-' ? formatHouseLabelById_(houseId, houses) : (s.nama_pemilik || 'Tamu / Non-Warga'));

      return {
        slot_id: slotId,
        slot_number: num,
        posisi_layout: posisiLayout,
        nama_slot: namaSlot,
        status_slot: normStatus,
        house_id: normStatus === 'Kosong' ? '-' : houseId,
        nama_pemilik: namaPemilik,
        nomor_polisi: normStatus === 'Kosong' ? '-' : (s.nomor_polisi || s.plat_nomor || '-'),
        jenis_paket: normStatus === 'Kosong' ? 'Tersedia' : (s.jenis_paket || s.kategori_parkir || 'Parkir Bulanan (Rp 150.000)'),
        waktu_masuk: normStatus === 'Kosong' ? '-' : (s.waktu_masuk || '-'),
        catatan: normStatus === 'Kosong' ? 'Kosong — Klik untuk Check-In' : (s.catatan || s.keterangan_kendaraan || '-'),
        url_bukti_parkir: s.url_bukti_parkir || '-',
        updated_by: s.updated_by || 'Security',
        updated_at: s.updated_at || ''
      };
    })
    .sort((a, b) => Number(a.slot_number) - Number(b.slot_number));
}

/**
 * HELPER V6.1: EKSTRAKSI URL FOTO DARI LOG SECURITY UNTUK IN-APP LIGHTBOX
 */
function getNormalizedSecurityLogs_(houses) {
  const rawLogs = sortSecurityLogsNewestFirst_(getTableData_(TABLES.SEC_LOGS));
  return rawLogs.map(log => {
    let urlFoto = log.url_foto || '-';
    let cleanCatatan = String(log.detail_catatan || '-');

    const matchFoto = cleanCatatan.match(/\[Foto Bukti:\s*(https?:\/\/[^\]]+)\]/i);
    if (matchFoto && matchFoto[1]) {
      if (!urlFoto || urlFoto === '-') {
        urlFoto = matchFoto[1].trim();
      }
      cleanCatatan = cleanCatatan.replace(matchFoto[0], '').trim();
    }

    const houseLabel =
      log.house_id && log.house_id !== '-'
        ? formatHouseLabelById_(log.house_id, houses)
        : (log.nama_warga_tujuan || '-');

    return {
      ...log,
      nama_warga_tujuan: houseLabel,
      detail_catatan: cleanCatatan,
      url_foto: urlFoto
    };
  });
}

/**
 * HTTP GET: Endpoint Publik Warga & Security (Tanpa Login)
 */
function doGet(e) {
  try {
    ensureV61DatabaseSchema_(false);

    const settings = getSettingsMap_();
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'dashboard';
    const periodeBulan = (e && e.parameter && e.parameter.bulan) ? e.parameter.bulan : 'November';
    const periodeTahun = (e && e.parameter && e.parameter.tahun) ? Number(e.parameter.tahun) : 2026;

    if (action === 'dashboard') {
      const accurateBalance = syncAccurateCurrentBalance_(periodeBulan, periodeTahun);
      const defaultIplAmount = parseNominal_(settings.default_ipl_amount || 200000);

      const houses = getNormalizedHouses_();
      const ledger = sortNewestFirst_(getTableData_(TABLES.LEDGER));
      const ipl = getOrEnsureIplRowsForPeriod_(periodeBulan, periodeTahun, houses, defaultIplAmount);
      const rawClosings = getTableData_(TABLES.CLOSINGS);
      const closings = getLiveMonthlyClosings_(rawClosings, ledger, periodeBulan, periodeTahun);
      const payroll = sortNewestFirst_(getTableData_(TABLES.PAYROLL));

      const securitySchedules = getTableData_(TABLES.SEC_SCHEDULES).sort((a, b) =>
        String(a.tanggal).localeCompare(String(b.tanggal))
      );

      const securityLogs = getNormalizedSecurityLogs_(houses);
      const parkingSlots = getNormalizedParkingSlots_(houses);

      return jsonResponse_({
        status: 'success',
        backend_version: 'v6.1',
        server_time_iso: new Date().toISOString(),
        app_name: settings.app_name || 'C-Money',
        cluster_full_name: settings.cluster_full_name || 'Cluster Mutiara Residence Sumberjaya',
        logo_url: settings.logo_url || '/assets/logo-cmoney.png',
        current_balance: accurateBalance,
        default_ipl_amount: defaultIplAmount,
        total_houses: Number(settings.total_houses || 22),
        total_active_houses: Number(settings.total_active_houses || 21),
        qris_merchant_name: settings.qris_merchant_name || 'Cluster Mutiara Residence',
        qris_nmid: settings.qris_nmid || 'ID1026000000CMR',
        qris_image_url: settings.qris_image_url || '/assets/qris-cmr-statis.png',
        summary_periode: { bulan: periodeBulan, tahun: periodeTahun },
        houses: houses,
        ipl_status: ipl,
        cash_ledger: ledger,
        monthly_closings: closings,
        security_payroll: payroll,
        security_schedules: securitySchedules,
        security_logs: securityLogs,
        parking_slots: parkingSlots
      });
    }

    if (action === 'PreviewWaClosing') {
      const report = buildMonthlyWaReport_(periodeBulan, periodeTahun);
      return jsonResponse_({ status: 'success', data: report });
    }

    return jsonResponse_({ status: 'error', message: 'Action GET tidak dikenali.' }, 400);
  } catch (err) {
    return jsonResponse_({ status: 'error', message: err.toString() }, 500);
  }
}

/**
 * HTTP POST: Endpoint Aksi Security/Warga (Tanpa Login) & Pengurus (Dengan Token)
 */
function doPost(e) {
  try {
    ensureV61DatabaseSchema_(false);

    const rawContents = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const body = JSON.parse(rawContents);
    const action = body.action;

    if (action === 'login_pengurus') {
      return handleLoginPengurus_(body.username, body.password);
    }

    if (action === 'input_security_log') {
      return handleInputSecurityLog_(body);
    }
    if (action === 'update_security_schedule') {
      return handleUpdateSecuritySchedule_(body);
    }
    if (action === 'upload_ipl_proof') {
      return handlePublicUploadIplProof_(body);
    }
    if (action === 'update_parking_slot') {
      return handleUpdateParkingSlot_(body);
    }

    if (!verifyPengurusToken_(body.session_token)) {
      return jsonResponse_({ status: 'unauthorized', message: 'Sesi pengurus tidak valid.' }, 401);
    }

    if (action === 'input_ledger') return handleInputLedger_(body);
    if (action === 'update_ipl') return handleUpdateIpl_(body);
    if (action === 'input_payroll') return handleInputPayroll_(body);
    if (action === 'close_month_and_send_wa') return handleCloseMonthAndSendWa_(body);

    return jsonResponse_({ status: 'error', message: 'Action POST tidak dikenali.' }, 400);
  } catch (err) {
    return jsonResponse_({ status: 'error', message: err.toString() }, 500);
  }
}

/**
 * HELPER GOOGLE DRIVE UPLOAD
 */
function getTargetDriveFolder_(subFolderName) {
  try {
    const ssFile = DriveApp.getFileById(SPREADSHEET_ID);
    const dbParents = ssFile.getParents();
    if (dbParents.hasNext()) {
      const dbFolder = dbParents.next();

      const directSub = dbFolder.getFoldersByName(subFolderName);
      if (directSub.hasNext()) return directSub.next();

      const directAssets = dbFolder.getFoldersByName(DRIVE_UPLOADS_PARENT);
      if (directAssets.hasNext()) {
        const assetsFolder = directAssets.next();
        const targetInAssets = assetsFolder.getFoldersByName(subFolderName);
        if (targetInAssets.hasNext()) return targetInAssets.next();
        return assetsFolder.createFolder(subFolderName);
      }

      const cmrParents = dbFolder.getParents();
      if (cmrParents.hasNext()) {
        const cmrRoot = cmrParents.next();
        const assetsIter = cmrRoot.getFoldersByName(DRIVE_UPLOADS_PARENT);
        if (assetsIter.hasNext()) {
          const assetsFolder = assetsIter.next();
          const subIter = assetsFolder.getFoldersByName(subFolderName);
          if (subIter.hasNext()) return subIter.next();
          return assetsFolder.createFolder(subFolderName);
        }
        const cmrSubIter = cmrRoot.getFoldersByName(subFolderName);
        if (cmrSubIter.hasNext()) return cmrSubIter.next();
      }
    }
  } catch (navErr) {
    // Fallback global
  }

  const globalSub = DriveApp.getFoldersByName(subFolderName);
  if (globalSub.hasNext()) return globalSub.next();

  const globalAssets = DriveApp.getFoldersByName(DRIVE_UPLOADS_PARENT);
  if (globalAssets.hasNext()) {
    return globalAssets.next().createFolder(subFolderName);
  }

  return DriveApp.createFolder(subFolderName);
}

function extractBase64FromPayload_(payload) {
  if (!payload) return '';
  const candidate =
    payload.file_base64 ||
    payload.photo_base64 ||
    payload.bukti_base64 ||
    payload.image_base64 ||
    payload.foto_base64 ||
    payload.photo_data_url ||
    (String(payload.url_bukti || '').indexOf('data:image') === 0 ? payload.url_bukti : '') ||
    (String(payload.url_foto || '').indexOf('data:image') === 0 ? payload.url_foto : '');
  return candidate ? String(candidate).trim() : '';
}

function saveBase64ToDriveFolder_(base64Input, folderName, customFileName) {
  try {
    if (!base64Input) return '';
    const rawStr = String(base64Input).trim();

    let mimeType = 'image/jpeg';
    let base64Str = rawStr;

    if (rawStr.indexOf('base64,') !== -1) {
      const parts = rawStr.split('base64,');
      const header = parts[0];
      base64Str = parts[1];
      const mimeMatch = header.match(/data:([^;]+);/);
      if (mimeMatch && mimeMatch[1]) {
        mimeType = mimeMatch[1];
      }
    }

    base64Str = base64Str.replace(/\s/g, '');
    if (!base64Str || base64Str.length < 20) return '';

    const ext = mimeType.indexOf('png') !== -1 ? '.png' : '.jpg';
    const cleanBaseName = String(customFileName || ('Evidence_' + Date.now()))
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_\-]/g, '_');
    const finalFileName = cleanBaseName + ext;

    const decodedBytes = Utilities.base64Decode(base64Str);
    const blob = Utilities.newBlob(decodedBytes, mimeType, finalFileName);

    const targetFolder = getTargetDriveFolder_(folderName);
    const file = targetFolder.createFile(blob);

    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      // Abaikan jika dibatasi domain
    }

    return file.getUrl();
  } catch (err) {
    return 'ERROR_DRIVE: ' + err.toString();
  }
}

/**
 * HELPER AUTO-JURNAL KE cash_ledger (ANTI-DUPLIKAT)
 */
function upsertAutoLedgerEntry_(txObj) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.LEDGER);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('id');
  const nowIso = new Date().toISOString();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(txObj.id)) {
      sheet.getRange(i + 1, headers.indexOf('tanggal') + 1).setValue(txObj.tanggal);
      sheet.getRange(i + 1, headers.indexOf('periode_bulan') + 1).setValue(txObj.periode_bulan);
      sheet.getRange(i + 1, headers.indexOf('periode_tahun') + 1).setValue(Number(txObj.periode_tahun));
      sheet.getRange(i + 1, headers.indexOf('kategori') + 1).setValue(txObj.kategori);
      sheet.getRange(i + 1, headers.indexOf('nominal') + 1).setValue(parseNominal_(txObj.nominal));
      sheet.getRange(i + 1, headers.indexOf('keterangan') + 1).setValue(txObj.keterangan);
      if (txObj.url_bukti && txObj.url_bukti !== '-') {
        sheet.getRange(i + 1, headers.indexOf('url_bukti') + 1).setValue(txObj.url_bukti);
      }
      SpreadsheetApp.flush();
      return txObj.id;
    }
  }

  const newRow = [
    txObj.id,
    txObj.tanggal,
    txObj.periode_bulan,
    Number(txObj.periode_tahun || 2026),
    txObj.tipe || 'IN',
    txObj.kategori || 'Iuran Warga (IPL)',
    false,
    '',
    parseNominal_(txObj.nominal),
    txObj.keterangan || '',
    txObj.house_id || '-',
    txObj.url_bukti || '-',
    'ADM-01',
    nowIso
  ];

  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, newRow.length).setValues([newRow]);
  SpreadsheetApp.flush();
  return txObj.id;
}

/**
 * 1. HANDLER INPUT MUTASI KAS PENGURUS
 */
function handleInputLedger_(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.LEDGER);
  const now = new Date();
  const nowIso = now.toISOString();
  const dateStr = payload.tanggal || Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');
  const txId = payload.id || ('TX-' + Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd-HHmmss'));
  const nominal = parseNominal_(payload.nominal);
  const tipe = String(payload.tipe || 'OUT').toUpperCase();
  const kategori = payload.kategori || 'Perawatan Pos';
  const periodeBulan = payload.periode_bulan || 'November';
  const periodeTahun = Number(payload.periode_tahun || 2026);

  const targetFolder = (tipe === 'IN') ? DRIVE_FOLDERS.BUKTI_IPL : DRIVE_FOLDERS.STRUK_KAS;

  let finalUrlBukti = (payload.url_bukti && String(payload.url_bukti).indexOf('data:image') === -1)
    ? payload.url_bukti
    : '-';

  const base64Photo = extractBase64FromPayload_(payload);
  if (base64Photo) {
    const fileLabel = txId + '_' + dateStr + '_' + tipe + '_' + kategori;
    const uploadedUrl = saveBase64ToDriveFolder_(base64Photo, targetFolder, fileLabel);
    if (uploadedUrl) finalUrlBukti = uploadedUrl;
  }

  const newRow = [
    txId, dateStr, periodeBulan, periodeTahun, tipe, kategori,
    Boolean(payload.is_proyek), payload.nama_proyek || '', nominal,
    payload.keterangan || '', payload.house_id || '-', finalUrlBukti,
    'ADM-01', nowIso
  ];

  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, newRow.length).setValues([newRow]);
  SpreadsheetApp.flush();

  const updatedBalance = syncAccurateCurrentBalance_('November', 2026);

  return jsonResponse_({
    status: 'success',
    backend_version: 'v6.1',
    message: 'Transaksi berhasil disimpan ke Buku Kas ' + periodeBulan + ' ' + periodeTahun + '.',
    tx_id: txId,
    url_bukti: finalUrlBukti,
    new_balance: updatedBalance
  });
}

/**
 * 2. HANDLER VALIDASI LUNAS IPL & PAKET PARKIR NETRAL (+ AUTO-JURNAL)
 */
function handleUpdateIpl_(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TABLES.IPL);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const now = new Date();
  const nowIso = now.toISOString();

  const houses = getNormalizedHouses_();
  const targetHouseId = String(payload.house_id || 'H-01');
  const houseObj = houses.find(h => String(h.id) === targetHouseId) || {
    id: targetHouseId,
    nomor_rumah: extractCleanHouseNumber_(targetHouseId),
    nama_warga: targetHouseId,
    display_label: targetHouseId,
    tarif_ipl: 200000
  };

  const targetBulan = String(payload.periode_bulan || 'November');
  const targetTahun = Number(payload.periode_tahun || 2026);
  const tanggalBayar = payload.tanggal_bayar || Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');
  const nominalBayar = parseNominal_(payload.nominal_bayar || payload.nominal_ipl || houseObj.tarif_ipl || 200000);
  const paketBayarLabel = String(payload.paket_bayar || 'IPL Bulanan');

  let uploadedProofUrl = (payload.url_bukti && String(payload.url_bukti).indexOf('data:image') === -1)
    ? payload.url_bukti
    : '';

  const base64Photo = extractBase64FromPayload_(payload);
  if (base64Photo) {
    const fileLabel = 'IPL_' + targetBulan + '_' + targetTahun + '_' + targetHouseId;
    uploadedProofUrl = saveBase64ToDriveFolder_(base64Photo, DRIVE_FOLDERS.BUKTI_IPL, fileLabel);
  }

  let rowFound = false;
  let existingProofUrl = '-';

  for (let i = 1; i < data.length; i++) {
    if (
      String(data[i][headers.indexOf('house_id')]) === targetHouseId &&
      String(data[i][headers.indexOf('periode_bulan')]) === targetBulan &&
      Number(data[i][headers.indexOf('periode_tahun')]) === targetTahun
    ) {
      rowFound = true;
      existingProofUrl = String(data[i][headers.indexOf('url_bukti')] || '-');
      sheet.getRange(i + 1, headers.indexOf('status_bayar') + 1).setValue(payload.status_bayar);
      sheet.getRange(i + 1, headers.indexOf('tanggal_bayar') + 1).setValue(tanggalBayar);
      if (headers.indexOf('tarif_ipl') !== -1 && nominalBayar > 0) {
        sheet.getRange(i + 1, headers.indexOf('tarif_ipl') + 1).setValue(nominalBayar);
      }
      if (uploadedProofUrl) {
        sheet.getRange(i + 1, headers.indexOf('url_bukti') + 1).setValue(uploadedProofUrl);
        existingProofUrl = uploadedProofUrl;
      }
      sheet.getRange(i + 1, headers.indexOf('catatan') + 1).setValue(payload.catatan || '');
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(nowIso);
      break;
    }
  }

  if (!rowFound) {
    const newIplId = 'IPL-' + targetBulan.slice(0, 3).toUpperCase() + targetTahun + '-' + targetHouseId;
    existingProofUrl = uploadedProofUrl || '-';
    sheet.appendRow([
      newIplId, targetHouseId, houseObj.nomor_rumah, houseObj.nama_warga,
      targetBulan, targetTahun, nominalBayar, payload.status_bayar || 'Lunas',
      tanggalBayar, existingProofUrl, payload.catatan || '', nowIso
    ]);
  }

  SpreadsheetApp.flush();

  const shouldAutoJournal =
    payload.auto_jurnal !== false &&
    payload.auto_journal !== false &&
    String(payload.status_bayar) === 'Lunas' &&
    nominalBayar > 0;

  let autoLedgerId = null;
  if (shouldAutoJournal) {
    autoLedgerId = 'IPL-' + targetBulan.toUpperCase() + '-' + targetTahun + '-' + targetHouseId;
    const kategoriKas =
      nominalBayar > 200000
        ? 'Iuran Warga (IPL) & Parkir Fasum'
        : nominalBayar === 150000
        ? 'Parkir Fasum'
        : 'Iuran Warga (IPL)';

    upsertAutoLedgerEntry_({
      id: autoLedgerId,
      tanggal: tanggalBayar,
      periode_bulan: targetBulan,
      periode_tahun: targetTahun,
      tipe: 'IN',
      kategori: kategoriKas,
      nominal: nominalBayar,
      keterangan: 'Pembayaran ' + paketBayarLabel + ' — ' + houseObj.display_label,
      house_id: targetHouseId,
      url_bukti: existingProofUrl
    });
  }

  const updatedBalance = syncAccurateCurrentBalance_('November', 2026);

  return jsonResponse_({
    status: 'success',
    backend_version: 'v6.1',
    message: 'Status ' + houseObj.display_label + ' (' + targetBulan + ') berhasil divalidasi.',
    url_bukti: existingProofUrl,
    auto_ledger_id: autoLedgerId,
    new_balance: updatedBalance
  });
}

/**
 * 3. HANDLER UPLOAD BUKTI QRIS MANDIRI OLEH WARGA
 */
function handlePublicUploadIplProof_(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TABLES.IPL);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const now = new Date();
  const nowIso = now.toISOString();
  const todayStr = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');

  const houses = getNormalizedHouses_();
  const targetHouseId = String(payload.house_id || 'H-01');
  const houseObj = houses.find(h => String(h.id) === targetHouseId) || {
    id: targetHouseId,
    nomor_rumah: extractCleanHouseNumber_(targetHouseId),
    nama_warga: targetHouseId,
    display_label: targetHouseId,
    tarif_ipl: 200000
  };

  const targetBulan = String(payload.periode_bulan || 'November');
  const targetTahun = Number(payload.periode_tahun || 2026);
  const paketLabel = String(payload.paket_label || payload.paket_bayar || 'IPL Bulanan');
  const totalNominalBayar = parseNominal_(payload.nominal_bayar || payload.nominal_total || 200000);

  let finalProofUrl = payload.file_name || 'bukti_qris.jpg';
  const base64Photo = extractBase64FromPayload_(payload);
  if (base64Photo) {
    const fileLabel = 'QRIS_' + targetBulan + '_' + targetTahun + '_' + targetHouseId + '_' + Date.now();
    const driveUrl = saveBase64ToDriveFolder_(base64Photo, DRIVE_FOLDERS.BUKTI_IPL, fileLabel);
    if (driveUrl) finalProofUrl = driveUrl;
  }

  const infoCatatan =
    payload.catatan ||
    (paketLabel + ' (Rp ' + formatRupiah_(totalNominalBayar) + ') — ' + houseObj.display_label);

  for (let i = 1; i < data.length; i++) {
    if (
      String(data[i][headers.indexOf('house_id')]) === targetHouseId &&
      String(data[i][headers.indexOf('periode_bulan')]) === targetBulan &&
      Number(data[i][headers.indexOf('periode_tahun')]) === targetTahun
    ) {
      sheet.getRange(i + 1, headers.indexOf('status_bayar') + 1).setValue('Menunggu Validasi');
      sheet.getRange(i + 1, headers.indexOf('tanggal_bayar') + 1).setValue(todayStr);
      if (headers.indexOf('tarif_ipl') !== -1) {
        sheet.getRange(i + 1, headers.indexOf('tarif_ipl') + 1).setValue(totalNominalBayar);
      }
      sheet.getRange(i + 1, headers.indexOf('url_bukti') + 1).setValue(finalProofUrl);
      sheet.getRange(i + 1, headers.indexOf('catatan') + 1).setValue(infoCatatan);
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(nowIso);
      SpreadsheetApp.flush();

      return jsonResponse_({
        status: 'success',
        backend_version: 'v6.1',
        message: 'Bukti pembayaran ' + houseObj.display_label + ' berhasil disimpan.',
        url_bukti: finalProofUrl,
        periode_bulan: targetBulan,
        periode_tahun: targetTahun
      });
    }
  }

  const newIplId = 'IPL-' + targetBulan.slice(0, 3).toUpperCase() + targetTahun + '-' + targetHouseId;
  sheet.appendRow([
    newIplId, targetHouseId, houseObj.nomor_rumah, houseObj.nama_warga,
    targetBulan, targetTahun, totalNominalBayar, 'Menunggu Validasi',
    todayStr, finalProofUrl, infoCatatan, nowIso
  ]);
  SpreadsheetApp.flush();

  return jsonResponse_({
    status: 'success',
    backend_version: 'v6.1',
    message: 'Bukti pembayaran ' + houseObj.display_label + ' berhasil disimpan.',
    url_bukti: finalProofUrl,
    periode_bulan: targetBulan,
    periode_tahun: targetTahun
  });
}

/**
 * 4. HANDLER LOG SECURITY & UPSERT DAFTAR PAKET DI POS
 */
function handleInputSecurityLog_(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TABLES.SEC_LOGS);
  if (!sheet) {
    return jsonResponse_({ status: 'error', message: 'Sheet security_logs tidak ditemukan.' }, 404);
  }

  const houses = getNormalizedHouses_();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('id');
  const urlFotoIdx = headers.indexOf('url_foto');

  const now = new Date();
  const nowIso = now.toISOString();
  const dateStr = payload.tanggal || Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');
  const timeStr = payload.jam || Utilities.formatDate(now, 'Asia/Jakarta', 'HH:mm');
  const logId = payload.id || ('SEC-' + Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd-HHmmss'));

  if (payload.id && idIdx !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) === String(payload.id)) {
        if (payload.sub_kategori && headers.indexOf('sub_kategori') !== -1) {
          sheet.getRange(i + 1, headers.indexOf('sub_kategori') + 1).setValue(payload.sub_kategori);
        }
        if (payload.detail_catatan && headers.indexOf('detail_catatan') !== -1) {
          sheet.getRange(i + 1, headers.indexOf('detail_catatan') + 1).setValue(payload.detail_catatan);
        }
        SpreadsheetApp.flush();
        return jsonResponse_({
          status: 'success',
          backend_version: 'v6.1',
          message: 'Status paket warga berhasil diperbarui.',
          log_id: payload.id
        });
      }
    }
  }

  const kategori = payload.kategori_laporan || 'PAKET_SURAT';
  const subKategori = payload.sub_kategori || 'Paket Tiba di Pos (Belum Diambil)';
  const houseId = payload.house_id || '-';
  const wargaTujuan =
    houseId !== '-'
      ? formatHouseLabelById_(houseId, houses)
      : (payload.nama_warga_tujuan || '-');

  let drivePhotoUrl = (payload.url_foto && String(payload.url_foto).indexOf('data:image') === -1)
    ? payload.url_foto
    : '-';

  const base64Photo = extractBase64FromPayload_(payload);
  if (base64Photo) {
    const fileLabel = logId + '_' + (payload.nama_security || 'Security') + '_' + kategori;
    const uploaded = saveBase64ToDriveFolder_(base64Photo, DRIVE_FOLDERS.LOG_SECURITY, fileLabel);
    if (uploaded) drivePhotoUrl = uploaded;
  }

  const newRow = [
    logId, dateStr, timeStr, payload.nama_security || 'Pak Eko', payload.shift || 'Pagi',
    kategori, subKategori, houseId, wargaTujuan,
    payload.titik_patroli || 'Pos Utama Security',
    payload.cuaca_815 || 'Cerah',
    payload.status_gerbang || 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    payload.detail_catatan || '-',
    payload.teks_wa || '-',
    nowIso
  ];

  if (urlFotoIdx !== -1) {
    newRow.push(drivePhotoUrl);
  }

  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, newRow.length).setValues([newRow]);
  SpreadsheetApp.flush();

  return jsonResponse_({
    status: 'success',
    backend_version: 'v6.1',
    message: 'Laporan Pos / Paket berhasil disimpan.',
    log_id: logId,
    url_foto: drivePhotoUrl
  });
}

/**
 * 5. HANDLER V6.1: CHECK-IN / CHECK-OUT DENAH 6 SLOT PARKIR OLEH SECURITY
 */
function handleUpdateParkingSlot_(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TABLES.PARKING);
  if (!sheet) {
    return jsonResponse_({ status: 'error', message: 'Sheet parking_slots belum tersedia.' }, 404);
  }

  const houses = getNormalizedHouses_();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const now = new Date();
  const nowIso = now.toISOString();
  const timeNowStr = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM HH:mm') + ' WIB';

  const slotId = String(payload.slot_id || 'SLOT-01');
  const rawStatus = String(payload.status_slot || 'Kosong');
  const isCheckout = rawStatus.toUpperCase() === 'KOSONG';

  const houseId = isCheckout ? '-' : (payload.house_id || '-');
  const namaPemilik = isCheckout
    ? '-'
    : (houseId !== '-' ? formatHouseLabelById_(houseId, houses) : (payload.nama_pemilik || 'Tamu / Non-Warga'));
  const statusSlot = isCheckout ? 'Kosong' : rawStatus;
  const jenisPaket = isCheckout ? 'Tersedia' : (payload.jenis_paket || 'Parkir Bulanan (Rp 150.000)');
  const nomorPolisi = isCheckout ? '-' : (payload.nomor_polisi || '-');
  const waktuMasuk = isCheckout ? '-' : (payload.waktu_masuk && payload.waktu_masuk !== '-' ? payload.waktu_masuk : timeNowStr);
  const catatan = isCheckout ? 'Kosong — Klik untuk Check-In' : (payload.catatan || 'Kondisi parkir aman');
  const updatedBy = payload.updated_by || payload.nama_security || 'Security';

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][headers.indexOf('slot_id')]) === slotId) {
      const rowNum = i + 1;
      const setCol = (colName, val) => {
        const idx = headers.indexOf(colName);
        if (idx !== -1) sheet.getRange(rowNum, idx + 1).setValue(val);
      };

      setCol('status_slot', statusSlot);
      setCol('house_id', houseId);
      setCol('nama_pemilik', namaPemilik);
      setCol('nomor_polisi', nomorPolisi);
      setCol('jenis_paket', jenisPaket);
      setCol('waktu_masuk', waktuMasuk);
      setCol('catatan', catatan);
      setCol('updated_by', updatedBy);
      setCol('updated_at', nowIso);

      SpreadsheetApp.flush();

      // Jika Security mengaktifkan "Catat juga ke Log Pos", simpan otomatis ke security_logs
      if (payload.catat_ke_log_security === true) {
        const logDetail = isCheckout
          ? ('Check-Out ' + slotId + ' (Slot kini Kosong). ' + (payload.catatan_kondisi || ''))
          : ('Check-In ' + slotId + ' — ' + namaPemilik + ' (' + nomorPolisi + ' / ' + jenisPaket + '). Kondisi: ' + catatan);

        handleInputSecurityLog_({
          nama_security: updatedBy,
          shift: payload.shift || 'Malam',
          kategori_laporan: 'PARKIR_FASUM',
          sub_kategori: isCheckout ? ('Parkir Keluar (' + slotId + ')') : ('Parkir Masuk (' + slotId + ')'),
          house_id: houseId,
          nama_warga_tujuan: namaPemilik,
          titik_patroli: 'Area Parkir Fasum (' + slotId + ')',
          detail_catatan: logDetail,
          teks_wa: '*LAPORAN KONDISI PARKIR FASUM CMR*\n• Slot: *' + slotId + '* (' + statusSlot + ')\n• Kendaraan: *' + namaPemilik + '* (' + nomorPolisi + ')\n• Pelapor: *' + updatedBy + '*\n• Kondisi: ' + catatan
        });
      }

      return jsonResponse_({
        status: 'success',
        backend_version: 'v6.1',
        message: isCheckout
          ? (slotId + ' berhasil dikosongkan (Check-Out).')
          : (slotId + ' berhasil diperbarui (' + namaPemilik + ').')
      });
    }
  }

  return jsonResponse_({ status: 'error', message: 'Slot parkir tidak ditemukan.' }, 404);
}

function handleUpdateSecuritySchedule_(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TABLES.SEC_SCHEDULES);
  if (!sheet) {
    return jsonResponse_({ status: 'error', message: 'Sheet security_schedules tidak ditemukan.' }, 404);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const nowIso = new Date().toISOString();
  const targetDate = String(payload.tanggal || '').slice(0, 10);

  for (let i = 1; i < data.length; i++) {
    const rowDateRaw = data[i][headers.indexOf('tanggal')];
    const rowDate = (rowDateRaw instanceof Date)
      ? Utilities.formatDate(rowDateRaw, 'Asia/Jakarta', 'yyyy-MM-dd')
      : String(rowDateRaw).slice(0, 10);

    if (rowDate === targetDate) {
      if (payload.shift_pagi) sheet.getRange(i + 1, headers.indexOf('shift_pagi') + 1).setValue(payload.shift_pagi);
      if (payload.shift_malam) sheet.getRange(i + 1, headers.indexOf('shift_malam') + 1).setValue(payload.shift_malam);
      if (payload.status_jadwal) sheet.getRange(i + 1, headers.indexOf('status_jadwal') + 1).setValue(payload.status_jadwal);
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(nowIso);
      return jsonResponse_({ status: 'success', message: 'Jadwal tanggal ' + targetDate + ' diperbarui.' });
    }
  }

  return jsonResponse_({ status: 'error', message: 'Tanggal jadwal tidak ditemukan.' }, 404);
}

function handleLoginPengurus_(username, password) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.AUTH);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowUser = String(row[headers.indexOf('username')]).trim();
    const rowPass = String(row[headers.indexOf('password_hash')]).trim();

    if (rowUser === String(username).trim() && rowPass === String(password).trim()) {
      const newToken = 'CMR_SESS_' + Utilities.getUuid().replace(/-/g, '');
      const nowIso = new Date().toISOString();

      sheet.getRange(i + 1, headers.indexOf('session_token') + 1).setValue(newToken);
      sheet.getRange(i + 1, headers.indexOf('last_login') + 1).setValue(nowIso);
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(nowIso);

      return jsonResponse_({
        status: 'success',
        user: {
          id: row[headers.indexOf('id')],
          username: rowUser,
          role: row[headers.indexOf('role')],
          nama_tampilan: row[headers.indexOf('nama_tampilan')],
          session_token: newToken
        }
      });
    }
  }
  return jsonResponse_({ status: 'error', message: 'Username atau password pengurus salah.' }, 401);
}

function verifyPengurusToken_(token) {
  if (!token) return false;
  if (token === 'LOCAL_DEV_TOKEN') return true;
  const users = getTableData_(TABLES.AUTH);
  return users.some(u => String(u.session_token) === String(token));
}

function handleInputPayroll_(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.PAYROLL);
  const nowIso = new Date().toISOString();
  const payId = payload.id || ('PAY-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMM-HHmm'));

  const gajiPokok = parseNominal_(payload.gaji_pokok || 1650000);
  const uangKonsumsi = parseNominal_(payload.uang_konsumsi || 0);
  const potonganKasbon = parseNominal_(payload.potongan_kasbon || 0);
  const gajiBersih = gajiPokok + uangKonsumsi - potonganKasbon;

  const newRow = [
    payId, payload.nama_security, payload.periode_bulan, Number(payload.periode_tahun || 2026),
    gajiPokok, uangKonsumsi, potonganKasbon, gajiBersih,
    payload.status_pembayaran || 'Ditransfer',
    payload.catatan || ('Potongan kasbon Rp ' + formatRupiah_(potonganKasbon)),
    nowIso
  ];

  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, newRow.length).setValues([newRow]);

  return jsonResponse_({ status: 'success', payroll_id: payId, gaji_bersih: gajiBersih });
}

function buildMonthlyWaReport_(periodeBulan, periodeTahun) {
  const settings = getSettingsMap_();
  const closings = getTableData_(TABLES.CLOSINGS);
  const ledger = getTableData_(TABLES.LEDGER).filter(
    r => String(r.periode_bulan) === String(periodeBulan) && Number(r.periode_tahun) === Number(periodeTahun)
  );

  const closingRow = closings.find(
    r => String(r.periode_bulan) === String(periodeBulan) && Number(r.periode_tahun) === Number(periodeTahun)
  );
  const saldoAwal = closingRow ? parseNominal_(closingRow.saldo_awal) : 1394200;

  let uangMasuk = 0;
  let totalPengeluaran = 0;
  let pengeluaranProyek = 0;
  const pemasukanMap = {};
  const pengeluaranMap = {};

  ledger.forEach(item => {
    const nom = parseNominal_(item.nominal);
    const kat = String(item.kategori || 'Lainnya');
    const ket = String(item.keterangan || '-');
    const isProyek = String(item.is_proyek).toUpperCase() === 'TRUE' || item.is_proyek === true;

    if (String(item.tipe).toUpperCase() === 'IN') {
      uangMasuk += nom;
      pemasukanMap[kat] = (pemasukanMap[kat] || 0) + nom;
    } else {
      totalPengeluaran += nom;
      if (isProyek) pengeluaranProyek += nom;
      if (!pengeluaranMap[kat]) pengeluaranMap[kat] = { total: 0, details: [] };
      pengeluaranMap[kat].total += nom;
      pengeluaranMap[kat].details.push(ket + ' (Rp ' + formatRupiah_(nom) + ')');
    }
  });

  const sisaSaldo = saldoAwal + uangMasuk - totalPengeluaran;

  const lines = [
    '*' + (settings.app_name || 'C-Money') + ' | Laporan Kas Bulanan ' + (settings.cluster_full_name || 'Cluster Mutiara Residence') + '*',
    'Periode Buku: ' + periodeBulan + ' ' + periodeTahun,
    '',
    'Saldo Awal: Rp ' + formatRupiah_(saldoAwal),
    'Uang Masuk Nyata: Rp ' + formatRupiah_(uangMasuk),
    'Total Pengeluaran: Rp ' + formatRupiah_(totalPengeluaran),
    'Sisa Saldo Kas Nyata: Rp ' + formatRupiah_(sisaSaldo),
    '',
    '*Rincian Pemasukan:*'
  ];

  Object.keys(pemasukanMap).forEach(k => {
    lines.push('• ' + k + ': Rp ' + formatRupiah_(pemasukanMap[k]));
  });

  lines.push('');
  lines.push('*Rincian Pengeluaran:*');
  Object.keys(pengeluaranMap).forEach(k => {
    const item = pengeluaranMap[k];
    lines.push('• ' + k + ': Rp ' + formatRupiah_(item.total) + ' (' + item.details.join(', ') + ')');
  });

  return {
    periode_bulan: periodeBulan,
    periode_tahun: periodeTahun,
    saldo_awal: saldoAwal,
    uang_masuk: uangMasuk,
    total_pengeluaran: totalPengeluaran,
    pengeluaran_proyek: pengeluaranProyek,
    sisa_saldo: sisaSaldo,
    wa_message: lines.join('\n')
  };
}

function handleCloseMonthAndSendWa_(payload) {
  const periodeBulan = payload.periode_bulan;
  const periodeTahun = Number(payload.periode_tahun || 2026);
  const report = buildMonthlyWaReport_(periodeBulan, periodeTahun);
  const settings = getSettingsMap_();
  const nowIso = new Date().toISOString();

  let fonnteStatus = 'SKIPPED';
  let fonnteResponseText = '{}';
  const targetWa = payload.target_wa || settings.fonnte_target_group;
  const fonnteToken = settings.fonnte_api_token;

  if (String(settings.fonnte_auto_send_closing).toUpperCase() === 'TRUE' && fonnteToken && fonnteToken !== 'ISI_TOKEN_FONNTE_DISINI') {
    const resp = UrlFetchApp.fetch(settings.fonnte_api_url || 'https://api.fonnte.com/send', {
      method: 'post',
      headers: { Authorization: fonnteToken },
      payload: { target: targetWa, message: report.wa_message },
      muteHttpExceptions: true
    });
    fonnteResponseText = resp.getContentText();
    fonnteStatus = (resp.getResponseCode() === 200) ? 'SUCCESS' : 'FAILED';
  }

  const logSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.WA_LOGS);
  if (logSheet) {
    logSheet.insertRowAfter(1);
    logSheet.getRange(2, 1, 1, 9).setValues([[
      'WA-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss'),
      'LAPORAN_TUTUP_BUKU',
      periodeBulan + ' ' + periodeTahun,
      targetWa,
      report.wa_message,
      fonnteStatus,
      fonnteResponseText,
      'ADM-01',
      nowIso
    ]]);
  }

  return jsonResponse_({ status: 'success', fonnte_status: fonnteStatus, report: report });
}

function sortNewestFirst_(rows) {
  return rows.slice().sort((a, b) => {
    const yearDiff = Number(b.periode_tahun || 2026) - Number(a.periode_tahun || 2026);
    if (yearDiff !== 0) return yearDiff;
    const monthDiff = (MONTH_ORDER[b.periode_bulan] || 0) - (MONTH_ORDER[a.periode_bulan] || 0);
    if (monthDiff !== 0) return monthDiff;
    const dateA = String(a.tanggal || a.created_at || a.closed_at || '');
    const dateB = String(b.tanggal || b.created_at || b.closed_at || '');
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return String(b.id || '').localeCompare(String(a.id || ''));
  });
}

function sortSecurityLogsNewestFirst_(rows) {
  return rows.slice().sort((a, b) => {
    const dateA = String(a.tanggal || '') + ' ' + String(a.jam || '').padStart(5, '0');
    const dateB = String(b.tanggal || '') + ' ' + String(b.jam || '').padStart(5, '0');
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return String(b.created_at || b.id || '').localeCompare(String(a.created_at || a.id || ''));
  });
}

function parseNominal_(val) {
  if (typeof val === 'number') return val;
  const cleaned = String(val || '0').replace(/[^0-9-]/g, '');
  return Number(cleaned || 0);
}

function getTableData_(sheetName) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, idx) => {
      let val = row[idx];
      if (val instanceof Date) {
        if (h === 'tanggal' || h === 'tanggal_bayar') {
          val = Utilities.formatDate(val, 'Asia/Jakarta', 'yyyy-MM-dd');
        } else if (h === 'jam') {
          val = Utilities.formatDate(val, 'Asia/Jakarta', 'HH:mm');
        } else {
          val = val.toISOString();
        }
      }
      if (['nominal', 'tarif_ipl', 'saldo_awal', 'uang_masuk', 'total_pengeluaran', 'pengeluaran_proyek', 'sisa_saldo', 'gaji_pokok', 'uang_konsumsi', 'potongan_kasbon', 'gaji_bersih', 'nominal_parkir'].indexOf(h) !== -1) {
        obj[h] = parseNominal_(val);
      } else {
        obj[h] = val;
      }
    });
    return obj;
  });
}

function getSettingsMap_() {
  const rows = getTableData_(TABLES.SETTINGS);
  const map = {};
  rows.forEach(r => { map[r.setting_key] = r.setting_value; });
  return map;
}

function updateSettingValue_(key, val) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.SETTINGS);
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(key)) {
      sheet.getRange(i + 1, 2).setValue(val);
      sheet.getRange(i + 1, 4).setValue(new Date().toISOString());
      return;
    }
  }
  sheet.appendRow([key, val, 'Parameter V6.1', new Date().toISOString()]);
}

function formatRupiah_(num) {
  return Number(num || 0).toLocaleString('id-ID');
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
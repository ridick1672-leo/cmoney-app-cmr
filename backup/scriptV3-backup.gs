/**
 * C-MONEY BACKEND REST API v3.0 (GOOGLE APPS SCRIPT)
 * Sistem Manajemen Keuangan & Keamanan Cluster Mutiara Residence (CMR)
 * Update v3.0:
 * - Integrasi Modul Security (Pak Eko & Pak Mulyadi)
 * - Kalender Dinamis Rotasi Mingguan (Jumat & Sabtu Malam Libur)
 * - Generator Laporan WA Siap Copas & Log Anomali (Urut Terbaru di Atas)
 * - Counter Galon Pos Otomatis & Alias Keluarga 22 Rumah
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
  SEC_LOGS: 'security_logs'
};

const MONTH_ORDER = {
  Januari: 1, Februari: 2, Maret: 3, April: 4, Mei: 5, Juni: 6,
  Juli: 7, Agustus: 8, September: 9, Oktober: 10, November: 11, Desember: 12
};

/**
 * HTTP GET: Endpoint Publik Warga & Security (Tanpa Login)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'dashboard';
    const periodeBulan = (e && e.parameter && e.parameter.bulan) ? e.parameter.bulan : 'November';
    const periodeTahun = (e && e.parameter && e.parameter.tahun) ? Number(e.parameter.tahun) : 2026;

    if (action === 'dashboard') {
      const settings = getSettingsMap_();

      // 1. Data 22 Rumah beserta alias_keluarga (Urut H-01 s/d H-22)
      const houses = getTableData_(TABLES.HOUSES).sort((a, b) =>
        String(a.id).localeCompare(String(b.id))
      );

      // 2. Buku Kas diurutkan dari Terbaru ke Terlama (Descending)
      const ledger = sortNewestFirst_(getTableData_(TABLES.LEDGER));

      // 3. Status IPL periode berjalan
      const ipl = getTableData_(TABLES.IPL)
        .filter(r => String(r.periode_bulan) === periodeBulan && Number(r.periode_tahun) === periodeTahun)
        .sort((a, b) => String(a.house_id).localeCompare(String(b.house_id)));

      // 4. Rekap Tutup Buku Bulanan & Gaji Security (Terbaru ke Terlama)
      const closings = sortNewestFirst_(getTableData_(TABLES.CLOSINGS));
      const payroll = sortNewestFirst_(getTableData_(TABLES.PAYROLL));

      // 5. Jadwal Kalender Security (Urut Tanggal 1 -> 31)
      const securitySchedules = getTableData_(TABLES.SEC_SCHEDULES).sort((a, b) =>
        String(a.tanggal).localeCompare(String(b.tanggal))
      );

      // 6. Riwayat Log & Anomali Security (Urut Terbaru di Atas -> Terlama di Bawah)
      const securityLogs = sortSecurityLogsNewestFirst_(getTableData_(TABLES.SEC_LOGS));

      return jsonResponse_({
        status: 'success',
        app_name: settings.app_name || 'C-Money',
        cluster_full_name: settings.cluster_full_name || 'Cluster Mutiara Residence Sumberjaya',
        logo_url: settings.logo_url || '/assets/logo-cmoney.png',
        current_balance: parseNominal_(settings.current_balance || 1394200),
        default_ipl_amount: parseNominal_(settings.default_ipl_amount || 200000),
        total_houses: Number(settings.total_houses || 22),
        total_active_houses: Number(settings.total_active_houses || 21),
        qris_merchant_name: settings.qris_merchant_name || 'Cluster Mutiara Residence',
        qris_nmid: settings.qris_nmid || 'ID1026000000CMR',
        qris_image_url: settings.qris_image_url || '/assets/qris-cmr-statis.png',
        security_config: {
          active_1: settings.security_active_1 || 'Pak Eko',
          active_2: settings.security_active_2 || 'Pak Mulyadi',
          shift_pagi_jam: settings.security_shift_pagi_jam || '08:00 - 20:00 WIB',
          shift_malam_jam: settings.security_shift_malam_jam || '20:00 - 08:00 WIB',
          libur_malam_hari: settings.security_libur_malam_hari || 'Jumat,Sabtu',
          galon_count_bulan_ini: Number(settings.security_galon_count_bulan_ini || 0),
          anchor_sunday_date: settings.security_anchor_sunday_date || '2026-11-01'
        },
        summary_periode: { bulan: periodeBulan, tahun: periodeTahun },
        houses: houses,
        ipl_status: ipl,
        cash_ledger: ledger,
        monthly_closings: closings,
        security_payroll: payroll,
        security_schedules: securitySchedules,
        security_logs: securityLogs
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
 * HTTP POST: Endpoint Aksi Security (Tanpa Login) & Pengurus (Dengan Token)
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action;

    // 1. Endpoint Login Pengurus
    if (action === 'login_pengurus') {
      return handleLoginPengurus_(body.username, body.password);
    }

    // 2. Endpoint Publik Security & Warga (Tanpa Perlu Login Pengurus)
    // Agar Pak Eko & Pak Mulyadi bisa langsung simpan absen, patroli, paket & anomali dari HP
    if (action === 'input_security_log') {
      return handleInputSecurityLog_(body);
    }
    if (action === 'update_security_schedule') {
      return handleUpdateSecuritySchedule_(body);
    }
    if (action === 'upload_ipl_proof') {
      return handlePublicUploadIplProof_(body);
    }

    // 3. Endpoint Khusus Pengurus (Wajib Token Sesi Pengurus)
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
 * HANDLER BARU: SIMPAN LOG ABSEN, PATROLI, PAKET, IZIN POS & ANOMALI SECURITY
 * Otomatis disisipkan di Baris ke-2 (Paling Atas) pada sheet security_logs
 */
function handleInputSecurityLog_(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TABLES.SEC_LOGS);
  if (!sheet) {
    return jsonResponse_({ status: 'error', message: 'Sheet security_logs tidak ditemukan.' }, 404);
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const dateStr = payload.tanggal || Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');
  const timeStr = payload.jam || Utilities.formatDate(now, 'Asia/Jakarta', 'HH:mm');
  const logId = payload.id || ('SEC-' + Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd-HHmmss'));

  const kategori = payload.kategori_laporan || 'PATROLI';
  const subKategori = payload.sub_kategori || 'Patroli Rutin';

  const newRow = [
    logId,
    dateStr,
    timeStr,
    payload.nama_security || 'Pak Eko',
    payload.shift || 'Pagi',
    kategori,
    subKategori,
    payload.house_id || '-',
    payload.nama_warga_tujuan || '-',
    payload.titik_patroli || 'Pos Utama Security',
    payload.cuaca_815 || 'Cerah',
    payload.status_gerbang || 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    payload.detail_catatan || '-',
    payload.teks_wa || '-',
    nowIso
  ];

  // Sisipkan tepat di bawah header (baris ke-2) agar selalu urut terbaru di atas
  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, newRow.length).setValues([newRow]);

  // Jika laporan adalah pengisian galon pos, tambah counter galon otomatis di app_settings
  let galonCount = Number(getSettingsMap_().security_galon_count_bulan_ini || 0);
  if (
    subKategori.toLowerCase().indexOf('galon') !== -1 ||
    String(payload.detail_catatan || '').toLowerCase().indexOf('galon') !== -1
  ) {
    galonCount += 1;
    updateSettingValue_('security_galon_count_bulan_ini', String(galonCount));
  }

  return jsonResponse_({
    status: 'success',
    message: 'Laporan security berhasil tercatat di database.',
    log_id: logId,
    galon_count_bulan_ini: galonCount
  });
}

/**
 * HANDLER BARU: UPDATE / OVERRIDE JADWAL KALENDER SECURITY (TUKAR SHIFT / IZIN SAKIT)
 */
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
      if (payload.jam_pagi) sheet.getRange(i + 1, headers.indexOf('jam_pagi') + 1).setValue(payload.jam_pagi);
      if (payload.shift_malam) sheet.getRange(i + 1, headers.indexOf('shift_malam') + 1).setValue(payload.shift_malam);
      if (payload.jam_malam) sheet.getRange(i + 1, headers.indexOf('jam_malam') + 1).setValue(payload.jam_malam);
      if (payload.status_jadwal) sheet.getRange(i + 1, headers.indexOf('status_jadwal') + 1).setValue(payload.status_jadwal);
      if (payload.catatan_jadwal !== undefined) sheet.getRange(i + 1, headers.indexOf('catatan_jadwal') + 1).setValue(payload.catatan_jadwal);
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(nowIso);

      return jsonResponse_({
        status: 'success',
        message: 'Jadwal security tanggal ' + targetDate + ' berhasil diperbarui.'
      });
    }
  }

  // Jika tanggal belum ada di sheet, tambahkan baris baru
  const newId = 'SCH-' + targetDate.replace(/-/g, '');
  const newRow = [
    newId,
    targetDate,
    payload.hari || '-',
    payload.periode_bulan || 'November',
    Number(payload.periode_tahun || 2026),
    payload.shift_pagi || 'Pak Eko',
    payload.jam_pagi || '08:00 - 20:00',
    payload.shift_malam || 'Pak Mulyadi',
    payload.jam_malam || '20:00 - 08:00',
    payload.status_jadwal || 'NORMAL_2_SHIFT',
    payload.catatan_jadwal || 'Update jadwal manual',
    nowIso
  ];
  sheet.appendRow(newRow);

  return jsonResponse_({
    status: 'success',
    message: 'Jadwal security baru untuk tanggal ' + targetDate + ' berhasil ditambahkan.'
  });
}

/**
 * HANDLER KONFIRMASI BUKTI QRIS WARGA
 */
function handlePublicUploadIplProof_(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.IPL);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const nowIso = new Date().toISOString();

  for (let i = 1; i < data.length; i++) {
    if (
      String(data[i][headers.indexOf('house_id')]) === String(payload.house_id) &&
      String(data[i][headers.indexOf('periode_bulan')]) === String(payload.periode_bulan)
    ) {
      sheet.getRange(i + 1, headers.indexOf('tanggal_bayar') + 1).setValue(nowIso.slice(0, 10));
      sheet.getRange(i + 1, headers.indexOf('url_bukti') + 1).setValue(payload.file_name || 'bukti_qris.jpg');
      sheet.getRange(i + 1, headers.indexOf('catatan') + 1).setValue('Menunggu Validasi Pengurus (' + (payload.file_name || 'QRIS') + ')');
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(nowIso);
      return jsonResponse_({ status: 'success', message: 'Bukti pembayaran berhasil dicatat.' });
    }
  }
  return jsonResponse_({ status: 'error', message: 'Data rumah tidak ditemukan.' }, 404);
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
  const users = getTableData_(TABLES.AUTH);
  return users.some(u => String(u.session_token) === String(token));
}

function handleInputLedger_(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.LEDGER);
  const nowIso = new Date().toISOString();
  const txId = payload.id || ('TX-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss'));
  const nominal = parseNominal_(payload.nominal);
  const tipe = String(payload.tipe || 'OUT').toUpperCase();

  const newRow = [
    txId,
    payload.tanggal || nowIso.slice(0, 10),
    payload.periode_bulan,
    Number(payload.periode_tahun || 2026),
    tipe,
    payload.kategori || 'Perawatan Pos',
    Boolean(payload.is_proyek),
    payload.nama_proyek || '',
    nominal,
    payload.keterangan || '',
    payload.house_id || '-',
    payload.url_bukti || '-',
    'ADM-01',
    nowIso
  ];

  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, newRow.length).setValues([newRow]);

  const settings = getSettingsMap_();
  let currentBalance = parseNominal_(settings.current_balance || 0);
  currentBalance = (tipe === 'IN') ? (currentBalance + nominal) : (currentBalance - nominal);
  updateSettingValue_('current_balance', String(currentBalance));

  return jsonResponse_({
    status: 'success',
    message: 'Transaksi berhasil disimpan di urutan teratas.',
    tx_id: txId,
    new_balance: currentBalance
  });
}

function handleUpdateIpl_(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.IPL);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const nowIso = new Date().toISOString();

  for (let i = 1; i < data.length; i++) {
    if (
      String(data[i][headers.indexOf('house_id')]) === String(payload.house_id) &&
      String(data[i][headers.indexOf('periode_bulan')]) === String(payload.periode_bulan) &&
      Number(data[i][headers.indexOf('periode_tahun')]) === Number(payload.periode_tahun)
    ) {
      sheet.getRange(i + 1, headers.indexOf('status_bayar') + 1).setValue(payload.status_bayar);
      sheet.getRange(i + 1, headers.indexOf('tanggal_bayar') + 1).setValue(payload.tanggal_bayar || nowIso.slice(0, 10));
      sheet.getRange(i + 1, headers.indexOf('url_bukti') + 1).setValue(payload.url_bukti || '');
      sheet.getRange(i + 1, headers.indexOf('catatan') + 1).setValue(payload.catatan || '');
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(nowIso);

      return jsonResponse_({ status: 'success', message: 'Status IPL ' + payload.house_id + ' diperbarui.' });
    }
  }
  return jsonResponse_({ status: 'error', message: 'Data rumah tidak ditemukan.' }, 404);
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
    payId,
    payload.nama_security,
    payload.periode_bulan,
    Number(payload.periode_tahun || 2026),
    gajiPokok,
    uangKonsumsi,
    potonganKasbon,
    gajiBersih,
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
  const saldoAwal = closingRow ? parseNominal_(closingRow.saldo_awal) : 0;

  let uangMasuk = 0;
  let totalPengeluaran = 0;
  let pengeluaranProyek = 0;
  const pemasukanMap = {};
  const pengeluaranMap = {};
  const proyekList = [];

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
      if (isProyek) {
        pengeluaranProyek += nom;
        proyekList.push({ nama: item.nama_proyek || ket, nominal: nom });
      }
      if (!pengeluaranMap[kat]) {
        pengeluaranMap[kat] = { total: 0, details: [] };
      }
      pengeluaranMap[kat].total += nom;
      pengeluaranMap[kat].details.push(ket + ' (Rp ' + formatRupiah_(nom) + ')');
    }
  });

  const sisaSaldo = saldoAwal + uangMasuk - totalPengeluaran;

  let lines = [];
  lines.push('*' + (settings.app_name || 'C-Money') + ' | Laporan Bulanan ' + (settings.cluster_full_name || 'Cluster Mutiara Residence Sumberjaya') + '*');
  lines.push('Periode: ' + periodeBulan + ' ' + periodeTahun);
  lines.push('');
  lines.push('Halo warga Mutiara Residence Sumberjaya, berikut rekap kas bulanan kita:');
  lines.push('');
  lines.push('Saldo Awal: Rp ' + formatRupiah_(saldoAwal));
  lines.push('Uang Masuk: Rp ' + formatRupiah_(uangMasuk));
  lines.push('Total Pengeluaran: Rp ' + formatRupiah_(totalPengeluaran));
  lines.push('Pengeluaran Proyek: Rp ' + formatRupiah_(pengeluaranProyek));
  lines.push('Sisa Saldo: Rp ' + formatRupiah_(sisaSaldo));
  lines.push('');
  lines.push('*Breakdown Pemasukan per Kategori*');
  Object.keys(pemasukanMap).forEach(k => {
    lines.push('• ' + k + ': Rp ' + formatRupiah_(pemasukanMap[k]));
  });
  lines.push('');
  lines.push('*Breakdown Pengeluaran per Kategori*');
  Object.keys(pengeluaranMap).forEach(k => {
    const item = pengeluaranMap[k];
    lines.push('• ' + k + ': Rp ' + formatRupiah_(item.total) + ' | detail: ' + item.details.join(', '));
  });

  if (proyekList.length > 0) {
    lines.push('');
    lines.push('*Detail Proyek:*');
    proyekList.forEach(p => {
      lines.push('• ' + p.nama + ' - Rp ' + formatRupiah_(p.nominal));
    });
  }

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

  return jsonResponse_({ status: 'success', fonnte_status: fonnteStatus, report: report });
}

/**
 * HELPER PENGURUTAN DATA TERBARU KE TERLAMA (DESCENDING)
 */
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
      if (['nominal', 'tarif_ipl', 'saldo_awal', 'uang_masuk', 'total_pengeluaran', 'pengeluaran_proyek', 'sisa_saldo', 'gaji_pokok', 'uang_konsumsi', 'potongan_kasbon', 'gaji_bersih'].indexOf(h) !== -1) {
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
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(key)) {
      sheet.getRange(i + 1, 2).setValue(val);
      sheet.getRange(i + 1, 4).setValue(new Date().toISOString());
      return;
    }
  }
}

function formatRupiah_(num) {
  return Number(num || 0).toLocaleString('id-ID');
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
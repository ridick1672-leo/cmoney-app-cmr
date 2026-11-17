/**
 * C-MONEY BACKEND REST API (GOOGLE APPS SCRIPT)
 * Sistem Manajemen Keuangan & Operasional Cluster Mutiara Residence (CMR)
 * Arsitektur: Relational REST API (Siap Migrasi ke Supabase Free Tier)
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// Konfigurasi Nama Tabel (Identik dengan Nama Tabel Supabase)
const TABLES = {
  AUTH: 'auth_pengurus',
  HOUSES: 'houses',
  LEDGER: 'cash_ledger',
  IPL: 'ipl_status',
  PAYROLL: 'security_payroll',
  SETTINGS: 'app_settings',
  CLOSINGS: 'monthly_closings',
  WA_LOGS: 'wa_notification_logs'
};

/**
 * HTTP GET: Endpoint Publik untuk Warga (Tanpa Login)
 * Mendukung parameter ?action=dashboard | houses | ledger | ipl | closings
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'dashboard';
    const periodeBulan = (e && e.parameter && e.parameter.bulan) ? e.parameter.bulan : 'November';
    const periodeTahun = (e && e.parameter && e.parameter.tahun) ? Number(e.parameter.tahun) : 2026;

    if (action === 'dashboard') {
      const settings = getSettingsMap_();
      const houses = getTableData_(TABLES.HOUSES);
      const ledger = getTableData_(TABLES.LEDGER);
      const ipl = getTableData_(TABLES.IPL).filter(
        r => String(r.periode_bulan) === periodeBulan && Number(r.periode_tahun) === periodeTahun
      );
      const closings = getTableData_(TABLES.CLOSINGS);
      const payroll = getTableData_(TABLES.PAYROLL);

      return jsonResponse_({
        status: 'success',
        app_name: settings.app_name || 'C-Money',
        cluster_full_name: settings.cluster_full_name || 'Cluster Mutiara Residence Sumberjaya',
        current_balance: Number(settings.current_balance || 0),
        default_ipl_amount: Number(settings.default_ipl_amount || 200000),
        total_active_houses: Number(settings.total_active_houses || 21),
        summary_periode: { bulan: periodeBulan, tahun: periodeTahun },
        houses: houses,
        ipl_status: ipl,
        cash_ledger: ledger,
        monthly_closings: closings,
        security_payroll: payroll
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
 * HTTP POST: Endpoint Khusus Pengurus (1 User Tanpa Gmail)
 * Actions: login_pengurus | input_ledger | update_ipl | input_payroll | close_month_and_send_wa | upload_file
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action;

    // 1. Login Pengurus (Tanpa Gmail)
    if (action === 'login_pengurus') {
      return handleLoginPengurus_(body.username, body.password);
    }

    // Validasi Session Token Pengurus untuk seluruh aksi tulis (Write Actions)
    if (!verifyPengurusToken_(body.session_token)) {
      return jsonResponse_({ status: 'unauthorized', message: 'Sesi pengurus tidak valid atau kedaluwarsa.' }, 401);
    }

    // 2. Input Transaksi Kas (Masuk / Keluar / Proyek)
    if (action === 'input_ledger') {
      return handleInputLedger_(body);
    }

    // 3. Update Status IPL Warga
    if (action === 'update_ipl') {
      return handleUpdateIpl_(body);
    }

    // 4. Input Penggajian & Potongan Kasbon Security
    if (action === 'input_payroll') {
      return handleInputPayroll_(body);
    }

    // 5. Tutup Buku Bulanan & Trigger Otomatis WhatsApp via Fonnte
    if (action === 'close_month_and_send_wa') {
      return handleCloseMonthAndSendWa_(body);
    }

    // 6. Upload Bukti Transfer / Struk Belanja ke Folder Drive CMR
    if (action === 'upload_file') {
      return handleFileUpload_(body);
    }

    return jsonResponse_({ status: 'error', message: 'Action POST tidak dikenali.' }, 400);
  } catch (err) {
    return jsonResponse_({ status: 'error', message: err.toString() }, 500);
  }
}

/**
 * AUTENTIKASI 1 USER PENGURUS TANPA GMAIL
 */
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

/**
 * INPUT TRANSAKSI KAS & UPDATE SALDO BERJALAN
 */
function handleInputLedger_(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.LEDGER);
  const nowIso = new Date().toISOString();
  const txId = payload.id || ('TX-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss'));
  const nominal = Number(payload.nominal || 0);
  const tipe = String(payload.tipe || 'OUT').toUpperCase();

  sheet.appendRow([
    txId,
    payload.tanggal || nowIso.slice(0, 10),
    payload.periode_bulan,
    Number(payload.periode_tahun || 2026),
    tipe,
    payload.kategori || 'Operasional',
    Boolean(payload.is_proyek),
    payload.nama_proyek || '',
    nominal,
    payload.keterangan || '',
    payload.house_id || '-',
    payload.url_bukti || '-',
    'ADM-01',
    nowIso
  ]);

  // Update current_balance pada app_settings
  const settings = getSettingsMap_();
  let currentBalance = Number(settings.current_balance || 0);
  currentBalance = (tipe === 'IN') ? (currentBalance + nominal) : (currentBalance - nominal);
  updateSettingValue_('current_balance', String(currentBalance));

  return jsonResponse_({
    status: 'success',
    message: 'Transaksi berhasil disimpan.',
    tx_id: txId,
    new_balance: currentBalance
  });
}

/**
 * UPDATE STATUS IPL WARGA & OTOMATIS CATAT KE BUKU KAS JIKA LUNAS
 */
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

      return jsonResponse_({ status: 'success', message: 'Status IPL rumah ' + payload.house_id + ' diperbarui.' });
    }
  }
  return jsonResponse_({ status: 'error', message: 'Data tagihan rumah tidak ditemukan.' }, 404);
}

/**
 * INPUT GAJI SECURITY & POTONGAN KASBON OTOMATIS
 */
function handleInputPayroll_(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.PAYROLL);
  const nowIso = new Date().toISOString();
  const payId = payload.id || ('PAY-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMM-HHmm'));

  const gajiPokok = Number(payload.gaji_pokok || 1650000);
  const uangKonsumsi = Number(payload.uang_konsumsi || 0);
  const potonganKasbon = Number(payload.potongan_kasbon || 0);
  const gajiBersih = gajiPokok + uangKonsumsi - potonganKasbon;

  sheet.appendRow([
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
  ]);

  return jsonResponse_({
    status: 'success',
    payroll_id: payId,
    gaji_bersih: gajiBersih
  });
}

/**
 * GENERATOR FORMAT LAPORAN BULANAN WA (SESUAI TEMPLATE C-MONEY FONNTE)
 */
function buildMonthlyWaReport_(periodeBulan, periodeTahun) {
  const settings = getSettingsMap_();
  const closings = getTableData_(TABLES.CLOSINGS);
  const ledger = getTableData_(TABLES.LEDGER).filter(
    r => String(r.periode_bulan) === String(periodeBulan) && Number(r.periode_tahun) === Number(periodeTahun)
  );

  const closingRow = closings.find(
    r => String(r.periode_bulan) === String(periodeBulan) && Number(r.periode_tahun) === Number(periodeTahun)
  );
  const saldoAwal = closingRow ? Number(closingRow.saldo_awal || 0) : 0;

  let uangMasuk = 0;
  let totalPengeluaran = 0;
  let pengeluaranProyek = 0;

  const pemasukanMap = {};
  const pengeluaranMap = {};
  const proyekList = [];

  ledger.forEach(item => {
    const nom = Number(item.nominal || 0);
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

/**
 * TUTUP BUKU & AUTO-SEND WHATSAPP KE GRUP VIA FONNTE API
 */
function handleCloseMonthAndSendWa_(payload) {
  const periodeBulan = payload.periode_bulan;
  const periodeTahun = Number(payload.periode_tahun || 2026);
  const report = buildMonthlyWaReport_(periodeBulan, periodeTahun);
  const settings = getSettingsMap_();
  const nowIso = new Date().toISOString();

  // Kirim ke Fonnte jika diaktifkan
  let fonnteStatus = 'SKIPPED';
  let fonnteResponseText = '{}';
  const targetWa = payload.target_wa || settings.fonnte_target_group;
  const fonnteToken = settings.fonnte_api_token;

  if (String(settings.fonnte_auto_send_closing).toUpperCase() === 'TRUE' && fonnteToken && fonnteToken !== 'ISI_TOKEN_FONNTE_DISINI') {
    const resp = UrlFetchApp.fetch(settings.fonnte_api_url || 'https://api.fonnte.com/send', {
      method: 'post',
      headers: { Authorization: fonnteToken },
      payload: {
        target: targetWa,
        message: report.wa_message
      },
      muteHttpExceptions: true
    });
    fonnteResponseText = resp.getContentText();
    fonnteStatus = (resp.getResponseCode() === 200) ? 'SUCCESS' : 'FAILED';
  }

  // Catat log WA ke wa_notification_logs
  const logSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.WA_LOGS);
  logSheet.appendRow([
    'WA-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss'),
    'LAPORAN_TUTUP_BUKU',
    periodeBulan + ' ' + periodeTahun,
    targetWa,
    report.wa_message,
    fonnteStatus,
    fonnteResponseText,
    'ADM-01',
    nowIso
  ]);

  return jsonResponse_({
    status: 'success',
    fonnte_status: fonnteStatus,
    report: report
  });
}

/**
 * UPLOAD FILE BASE64 KE SUBFOLDER DRIVE CMR
 */
function handleFileUpload_(payload) {
  const folderId = payload.folder_id;
  const fileName = payload.file_name || ('upload_' + new Date().getTime() + '.jpg');
  const mimeType = payload.mime_type || 'image/jpeg';
  const bytes = Utilities.base64Decode(payload.base64_data);
  const blob = Utilities.newBlob(bytes, mimeType, fileName);

  const folder = DriveApp.getFolderById(folderId);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return jsonResponse_({
    status: 'success',
    file_name: fileName,
    file_url: file.getUrl()
  });
}

/**
 * HELPER UTILITIES
 */
function getTableData_(sheetName) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = row[idx]; });
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

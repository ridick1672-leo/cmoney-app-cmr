/**
 * C-MONEY API SERVICE ADAPTER v3.0
 * Mendukung Google Apps Script (GAS) & Siap Migrasi ke Supabase Free Tier
 */

const BACKEND_PROVIDER = import.meta.env.VITE_BACKEND_PROVIDER || 'gas';
const GAS_WEBAPP_URL = import.meta.env.VITE_GAS_WEBAPP_URL || '';

async function requestGasGet(params = {}) {
  if (!GAS_WEBAPP_URL) {
    throw new Error('VITE_GAS_WEBAPP_URL belum diatur di .env / Vercel.');
  }
  const url = new URL(GAS_WEBAPP_URL);
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    redirect: 'follow'
  });
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
  return response.json();
}

async function requestGasPost(payload = {}) {
  if (!GAS_WEBAPP_URL) {
    throw new Error('VITE_GAS_WEBAPP_URL belum diatur di .env / Vercel.');
  }
  const token = localStorage.getItem('cmoney_pengurus_token') || '';
  const bodyData = {
    ...payload,
    session_token: payload.session_token || token
  };

  // Menggunakan text/plain agar bebas blokir CORS preflight pada Google Apps Script
  const response = await fetch(GAS_WEBAPP_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(bodyData)
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
  return response.json();
}

export const CMoneyAPI = {
  // 1. Ambil seluruh data Dashboard Publik, Kalender Security & Log (Tanpa Login)
  async getPublicDashboard(bulan = 'November', tahun = 2026) {
    if (BACKEND_PROVIDER === 'gas') {
      return requestGasGet({ action: 'dashboard', bulan, tahun });
    }
    throw new Error('Provider belum didukung.');
  },

  // 2. Login 1 Akun Pengurus (Tanpa Gmail)
  async loginPengurus(username, password) {
    const res = await requestGasPost({
      action: 'login_pengurus',
      username,
      password
    });
    if (res && res.status === 'success' && res.user?.session_token) {
      localStorage.setItem('cmoney_pengurus_token', res.user.session_token);
    }
    return res;
  },

  // 3. Input Transaksi Kas Masuk / Keluar / Proyek (Pengurus)
  async inputTransaction(txData) {
    return requestGasPost({
      action: 'input_ledger',
      ...txData
    });
  },

  // 4. Update Status Lunas IPL Warga (Pengurus)
  async updateIplStatus(iplData) {
    return requestGasPost({
      action: 'update_ipl',
      ...iplData
    });
  },

  // 5. Unggah Konfirmasi Bukti Bayar QRIS oleh Warga (Tanpa Login)
  async uploadIplProof(proofData) {
    return requestGasPost({
      action: 'upload_ipl_proof',
      ...proofData
    });
  },

  // 6. Input Gaji & Kasbon Security (Pengurus)
  async inputPayroll(payrollData) {
    return requestGasPost({
      action: 'input_payroll',
      ...payrollData
    });
  },

  // 7. Tutup Buku Bulanan & Auto-Send WA Grup via Fonnte (Pengurus)
  async closeMonthAndSendWa(periode_bulan, periode_tahun = 2026, target_wa = '') {
    return requestGasPost({
      action: 'close_month_and_send_wa',
      periode_bulan,
      periode_tahun,
      target_wa
    });
  },

  // 8. BARU: Simpan Laporan WA & Log Aktivitas/Anomali Security (Tanpa Login untuk Pak Eko & Pak Mulyadi)
  async inputSecurityLog(logData) {
    return requestGasPost({
      action: 'input_security_log',
      ...logData
    });
  },

  // 9. BARU: Update / Override Jadwal Kalender Security (Tukar Shift / Izin Sakit)
  async updateSecuritySchedule(scheduleData) {
    return requestGasPost({
      action: 'update_security_schedule',
      ...scheduleData
    });
  }
};
const PROVIDER = import.meta.env.VITE_BACKEND_PROVIDER || 'gas';
const GAS_URL = import.meta.env.VITE_GAS_WEBAPP_URL;

export const CMoneyAPI = {
  // 1. Ambil Seluruh Data Dashboard Publik (Warga Tanpa Login)
  async getPublicDashboard(periodeBulan = 'November', periodeTahun = 2026) {
    if (PROVIDER === 'gas') {
      const url = `${GAS_URL}?action=dashboard&bulan=${encodeURIComponent(periodeBulan)}&tahun=${periodeTahun}`;
      const res = await fetch(url);
      return await res.json();
    }
    // Fallback Supabase Free Tier saat migrasi
    throw new Error('Supabase client akan diaktifkan saat VITE_BACKEND_PROVIDER=supabase');
  },

  // 2. Login 1 User Tunggal Pengurus (Tanpa Gmail)
  async loginPengurus(username, password) {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'login_pengurus', username, password })
    });
    const result = await res.json();
    if (result.status === 'success' && result.user?.session_token) {
      localStorage.setItem('cmoney_pengurus_token', result.user.session_token);
    }
    return result;
  },

  // 3. Input Transaksi Kas (Masuk / Keluar / Proyek)
  async inputTransaction(payload) {
    const token = localStorage.getItem('cmoney_pengurus_token');
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'input_ledger',
        session_token: token,
        ...payload
      })
    });
    return await res.json();
  },

  // 4. Update Status IPL Warga (21 Rumah)
  async updateIplStatus(payload) {
    const token = localStorage.getItem('cmoney_pengurus_token');
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'update_ipl',
        session_token: token,
        ...payload
      })
    });
    return await res.json();
  },

  // 5. Tutup Buku Bulanan & Trigger Auto-Send WA Fonnte
  async closeMonthAndSendWa(periodeBulan, periodeTahun, targetWa) {
    const token = localStorage.getItem('cmoney_pengurus_token');
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'close_month_and_send_wa',
        session_token: token,
        periode_bulan: periodeBulan,
        periode_tahun: periodeTahun,
        target_wa: targetWa
      })
    });
    return await res.json();
  }
};

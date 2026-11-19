/**
 * KONFIGURASI TUNGGAL KONEKSI BACKEND C-MONEY (V6.3)
 * ----------------------------------------------------------------------------
 * Cukup ubah 1 baris GAS_WEBAPP_URL di bawah ini jika suatu saat link /exec
 * berubah, lalu Simpan (Ctrl + S) -> Commit & Push ke GitHub.
 * Tidak perlu lagi mengubah Environment Variables di Vercel atau file .env.
 */

export const BACKEND_PROVIDER = 'gas';

export const EXPECTED_BACKEND_VERSION = 'v6.3';

// PENTING: Pastikan URL di bawah ini PERSIS SAMA dengan URL /exec yang barusan
// Anda tes di browser dan memunculkan {"status":"success","backend_version":"v6.3",...}
export const GAS_WEBAPP_URL =
  'https://script.google.com/macros/s/AKfycbyRv-0ImwuxqbZRxI71wYAvy-qTs721jX7kkeKajnGJeqS5hQ3le-FDrZ_kKJpGtLMt7A/exec';
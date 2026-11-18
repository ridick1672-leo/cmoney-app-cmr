import React, { useState, useEffect, useMemo } from 'react';
import { compressImageToBase64, MONTH_LIST_ID, getSmartBookPeriod } from '../services/apiService';

function formatRp(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

export default function QrisPaymentModal({
  isOpen,
  onClose,
  selectedHouse,
  houses = [],
  qrisImageUrl = '/assets/qris-cmr-statis.png',
  merchantName = 'Cluster Mutiara Residence',
  defaultAmount = 200000,
  parkingConfig = {},
  smartPeriod = null,
  activeBookBulan = 'November',
  activeBookTahun = 2026,
  onUploadIplProof,
  onConfirmQrisProof
}) {
  // Saring hanya 21 rumah aktif (Rumah No. 04 Non-Aktif BPR otomatis dikecualikan)
  const activeHouses = useMemo(() => {
    return (houses || []).filter(
      (h) => !String(h.status_huni || '').includes('Tidak Aktif') && h.id !== 'H-04'
    );
  }, [houses]);

  const cutoffDay = Number(parkingConfig?.cutoff_day_ipl || 25);
  const computedSmart = smartPeriod || getSmartBookPeriod(cutoffDay);

  const feeMonthly = Number(parkingConfig?.fee_monthly || 100000);
  const feeWeekend = Number(parkingConfig?.fee_weekend || 50000);
  const feeDaily = Number(parkingConfig?.fee_daily || 10000);
  const baseIpl = Number(defaultAmount || 200000);

  // State Form Konfirmasi Pembayaran Warga
  const [houseId, setHouseId] = useState('H-01');
  const [periodeBulan, setPeriodeBulan] = useState(
    computedSmart.default_ipl_bulan || activeBookBulan || 'November'
  );
  const [periodeTahun, setPeriodeTahun] = useState(
    Number(computedSmart.default_ipl_tahun || activeBookTahun || 2026)
  );
  const [paketBayar, setPaketBayar] = useState('IPL_ONLY'); // IPL_ONLY | IPL_PLUS_WEEKEND | IPL_PLUS_MONTHLY | PARKIR_ONLY
  const [customParkirOnlyAmount, setCustomParkirOnlyAmount] = useState(feeWeekend);

  // State File Bukti Transfer / Screenshot QRIS
  const [rawFile, setRawFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [fileName, setFileName] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  // State Status Pengiriman & UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [uploadedDriveUrl, setUploadedDriveUrl] = useState('');
  const [qrisImgError, setQrisImgError] = useState(false);
  const [copiedNominal, setCopiedNominal] = useState(false);

  // Sinkronkan rumah & periode bulan saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      if (selectedHouse && selectedHouse.id !== 'H-04' && selectedHouse.house_id !== 'H-04') {
        setHouseId(selectedHouse.house_id || selectedHouse.id || 'H-01');
      } else if (activeHouses.length > 0) {
        setHouseId(activeHouses[0].id);
      }

      // Gunakan periode pintar Cut-Off Tanggal 25 saat pertama dibuka
      const defaultBulan = computedSmart.is_after_cutoff
        ? computedSmart.default_ipl_bulan
        : activeBookBulan || computedSmart.default_ipl_bulan || 'November';
      const defaultTahun = computedSmart.is_after_cutoff
        ? computedSmart.default_ipl_tahun
        : activeBookTahun || computedSmart.default_ipl_tahun || 2026;

      setPeriodeBulan(defaultBulan);
      setPeriodeTahun(Number(defaultTahun));
      setPaketBayar('IPL_ONLY');
      setRawFile(null);
      setFileBase64('');
      setFileName('');
      setStatusMessage('');
      setUploadedDriveUrl('');
    }
  }, [isOpen, selectedHouse]);

  // Hitung Total Nominal Berdasarkan Paket yang Dipilih Warga
  const totalNominalBayar = useMemo(() => {
    if (paketBayar === 'IPL_ONLY') return baseIpl;
    if (paketBayar === 'IPL_PLUS_WEEKEND') return baseIpl + feeWeekend;
    if (paketBayar === 'IPL_PLUS_MONTHLY') return baseIpl + feeMonthly;
    if (paketBayar === 'PARKIR_ONLY') return Number(customParkirOnlyAmount || feeWeekend);
    return baseIpl;
  }, [paketBayar, baseIpl, feeWeekend, feeMonthly, customParkirOnlyAmount]);

  const paketLabelDeskripsi = useMemo(() => {
    if (paketBayar === 'IPL_ONLY') return `Iuran IPL Bulanan (${formatRp(baseIpl)})`;
    if (paketBayar === 'IPL_PLUS_WEEKEND') {
      return `IPL (${formatRp(baseIpl)}) + Parkir Weekend (${formatRp(feeWeekend)})`;
    }
    if (paketBayar === 'IPL_PLUS_MONTHLY') {
      return `IPL (${formatRp(baseIpl)}) + Member Parkir Bulanan (${formatRp(feeMonthly)})`;
    }
    return `Kontribusi Parkir Fasum (${formatRp(customParkirOnlyAmount)})`;
  }, [paketBayar, baseIpl, feeWeekend, feeMonthly, customParkirOnlyAmount]);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawFile(file);
    setFileName(file.name);
    setStatusMessage('');
    try {
      setIsCompressing(true);
      const compressed = await compressImageToBase64(file, 800, 0.75);
      setFileBase64(compressed);
    } catch (err) {
      setStatusMessage('⚠️ Gagal mengompresi gambar: ' + err.message);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleCopyNominal = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(String(totalNominalBayar));
      setCopiedNominal(true);
      setTimeout(() => setCopiedNominal(false), 2000);
    }
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    setUploadedDriveUrl('');

    let finalBase64 = fileBase64;
    if (!finalBase64 && rawFile) {
      setIsCompressing(true);
      finalBase64 = await compressImageToBase64(rawFile, 800, 0.75);
      setIsCompressing(false);
    }

    if (!finalBase64) {
      setStatusMessage('⚠️ Mohon pilih foto / screenshot bukti pembayaran terlebih dahulu.');
      return;
    }

    const submitFn = onUploadIplProof || onConfirmQrisProof;
    if (!submitFn) {
      setStatusMessage('⚠️ Fungsi pengiriman belum terhubung.');
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage(
        `⏳ Mengunggah bukti ${paketLabelDeskripsi} ke Google Drive (Buku ${periodeBulan} ${periodeTahun})...`
      );

      const res = await submitFn({
        house_id: houseId,
        periode_bulan: periodeBulan,
        periode_tahun: Number(periodeTahun),
        paket_bayar: paketBayar,
        nominal_total: totalNominalBayar,
        file_name: fileName || `QRIS_${houseId}_${periodeBulan}.jpg`,
        file_base64: finalBase64
      });

      if (res && res.status === 'success') {
        const driveLink =
          res.url_bukti && String(res.url_bukti).startsWith('http') ? res.url_bukti : '';
        setUploadedDriveUrl(driveLink);
        setStatusMessage(
          `✅ Bukti pembayaran Rumah ${houseId} (Buku ${periodeBulan} ${periodeTahun}) berhasil tersimpan di Google Drive & menunggu validasi Bendahara!`
        );
        setRawFile(null);
        setFileBase64('');
        setFileName('');
      } else {
        setStatusMessage(
          `⚠️ Gagal mengirim bukti: ${res?.message || 'Periksa koneksi internet Anda.'}`
        );
      }
    } catch (err) {
      setStatusMessage(`❌ Gagal terhubung ke server GAS: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedHouseObj = activeHouses.find((h) => h.id === houseId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto my-auto animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL QRIS */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                QRIS Statis Resmi CMR (MDR 0%)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                Cut-Off Buku Tgl {cutoffDay}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
              📲 Pembayaran Iuran IPL & Kontribusi Parkir Fasum
            </h3>
            <p className="text-xs text-slate-500">
              Pindai kode QRIS menggunakan m-Banking / e-Wallet, lalu unggah bukti bayar di sebelah kanan.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold flex items-center justify-center shrink-0"
            title="Tutup"
          >
            ✕
          </button>
        </div>

        {/* BANNER INFO SIKLUS BUKU TANGGAL 25 */}
        <div className="mb-4 bg-teal-50/90 border border-teal-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-teal-950">
          <div>
            <span className="font-extrabold">📅 Info Siklus Buku Tanggal {cutoffDay}: </span>
            {computedSmart.is_after_cutoff ? (
              <span>
                Karena hari ini sudah melewati tanggal {cutoffDay}, pembayaran iuran otomatis diarahkan ke{' '}
                <strong className="underline">
                  Buku {computedSmart.default_ipl_bulan} {computedSmart.default_ipl_tahun}
                </strong>
                .
              </span>
            ) : (
              <span>
                Pembayaran tanggal 1 s/d {cutoffDay - 1} dicatat untuk periode berjalan{' '}
                <strong>
                  Buku {computedSmart.default_ipl_bulan} {computedSmart.default_ipl_tahun}
                </strong>
                .
              </span>
            )}
          </div>
          <span className="bg-teal-800 text-amber-300 font-extrabold px-2.5 py-1 rounded-xl text-[11px]">
            Periode Dipilih: {periodeBulan} {periodeTahun}
          </span>
        </div>

        {/* GRID 2 KOLOM DI DESKTOP, 1 KOLOM DI HP */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* KOLOM KIRI (5 Kolom): KARTU GAMBAR QRIS STATIS & TOTAL NOMINAL */}
          <div className="md:col-span-5 bg-gradient-to-b from-slate-900 to-teal-950 text-white rounded-3xl p-4 flex flex-col justify-between border border-teal-800 shadow-lg">
            <div>
              <div className="text-center border-b border-slate-800 pb-2.5 mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-teal-300">
                  Merchant Resmi
                </p>
                <h4 className="font-black text-sm sm:text-base text-white">{merchantName}</h4>
              </div>

              {/* Bingkai Gambar QRIS */}
              <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-inner min-h-[220px]">
                {!qrisImgError && qrisImageUrl ? (
                  <img
                    src={qrisImageUrl}
                    alt="QRIS Cluster Mutiara Residence"
                    className="w-full max-w-[210px] h-auto object-contain rounded-lg"
                    onError={() => setQrisImgError(true)}
                  />
                ) : (
                  <div className="text-center p-4 text-slate-700 space-y-2">
                    <div className="w-36 h-36 mx-auto border-4 border-dashed border-teal-700 rounded-2xl flex flex-col items-center justify-center bg-teal-50">
                      <span className="text-3xl">🏁</span>
                      <span className="text-[11px] font-extrabold text-teal-900 mt-1">
                        QRIS STATIS CMR
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Taruh file gambar QRIS di{' '}
                      <code className="font-mono font-bold text-teal-800">
                        public/assets/qris-cmr-statis.png
                      </code>
                    </p>
                  </div>
                )}
              </div>

              {/* Kotak Nominal yang Harus Ditransfer */}
              <div className="mt-3 bg-slate-950/70 border border-teal-600/50 rounded-2xl p-3 text-center">
                <p className="text-[10px] text-teal-300 font-semibold">
                  Nominal yang Ditransfer ({paketLabelDeskripsi}):
                </p>
                <p className="text-xl sm:text-2xl font-black text-amber-300 my-1">
                  {formatRp(totalNominalBayar)}
                </p>
                <button
                  type="button"
                  onClick={handleCopyNominal}
                  className="text-[11px] font-bold bg-teal-800 hover:bg-teal-700 text-white px-3 py-1 rounded-xl border border-teal-600 transition"
                >
                  {copiedNominal ? '✓ Nominal Tersalin!' : '📋 Salin Angka Nominal'}
                </button>
              </div>
            </div>

            {!qrisImgError && qrisImageUrl && (
              <a
                href={qrisImageUrl}
                download="QRIS-Cluster-Mutiara-Residence.png"
                className="mt-3 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-center text-xs font-bold text-teal-200 transition block"
              >
                ⬇️ Unduh Gambar QRIS ke HP
              </a>
            )}
          </div>

          {/* KOLOM KANAN (7 Kolom): FORM PILIH RUMAH, BULAN BUKU, PAKET PARKIR & UPLOAD BUKTI */}
          <form onSubmit={handleSubmitProof} className="md:col-span-7 space-y-3.5 text-xs">
            {/* 1. Pilih Nomor Rumah (Hanya 21 Rumah Aktif) */}
            <div>
              <label className="block font-extrabold text-slate-700 mb-1">
                1. Pilih Nomor Rumah Anda (21 Unit Aktif)
              </label>
              <select
                value={houseId}
                onChange={(e) => setHouseId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {activeHouses.map((h) => (
                  <option key={h.id} value={h.id}>
                    Rumah No. {h.nomor_rumah} — {h.nama_kepala_keluarga}
                  </option>
                ))}
              </select>
              {selectedHouseObj?.alias_keluarga && (
                <p className="text-[11px] text-teal-700 font-medium mt-1">
                  👨‍👩‍👧‍👦 Keluarga: {selectedHouseObj.alias_keluarga}
                </p>
              )}
            </div>

            {/* 2. Pilih Periode Bulan Buku & Tahun Buku */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block font-extrabold text-slate-700 mb-1">
                  2. Untuk Periode Bulan Buku
                </label>
                <select
                  value={periodeBulan}
                  onChange={(e) => setPeriodeBulan(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-teal-500 bg-teal-50/60 font-extrabold text-teal-950"
                >
                  {MONTH_LIST_ID.map((m) => (
                    <option key={m} value={m}>
                      Buku {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Tahun Buku</label>
                <input
                  type="number"
                  value={periodeTahun}
                  onChange={(e) => setPeriodeTahun(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 bg-slate-50"
                />
              </div>
            </div>

            {/* 3. Pilih Paket Pembayaran (IPL Saja / + Parkir Weekend / + Member Parkir / Parkir Saja) */}
            <div>
              <label className="block font-extrabold text-slate-700 mb-1">
                3. Pilih Paket Pembayaran (IPL / Kontribusi Parkir Fasum)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaketBayar('IPL_ONLY')}
                  className={`p-2.5 rounded-2xl border text-left transition ${
                    paketBayar === 'IPL_ONLY'
                      ? 'bg-teal-800 text-white border-teal-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-extrabold text-xs">🏠 IPL Bulanan Saja</p>
                  <p className="text-[11px] opacity-90 font-bold mt-0.5">{formatRp(baseIpl)}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaketBayar('IPL_PLUS_WEEKEND')}
                  className={`p-2.5 rounded-2xl border text-left transition ${
                    paketBayar === 'IPL_PLUS_WEEKEND'
                      ? 'bg-teal-800 text-white border-teal-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-extrabold text-xs">🔵 IPL + Parkir Weekend</p>
                  <p className="text-[11px] opacity-90 font-bold mt-0.5">
                    {formatRp(baseIpl + feeWeekend)} (+{formatRp(feeWeekend)})
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaketBayar('IPL_PLUS_MONTHLY')}
                  className={`p-2.5 rounded-2xl border text-left transition ${
                    paketBayar === 'IPL_PLUS_MONTHLY'
                      ? 'bg-teal-800 text-white border-teal-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-extrabold text-xs">🟢 IPL + Member Parkir</p>
                  <p className="text-[11px] opacity-90 font-bold mt-0.5">
                    {formatRp(baseIpl + feeMonthly)} (+{formatRp(feeMonthly)})
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaketBayar('PARKIR_ONLY')}
                  className={`p-2.5 rounded-2xl border text-left transition ${
                    paketBayar === 'PARKIR_ONLY'
                      ? 'bg-teal-800 text-white border-teal-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-extrabold text-xs">🅿️ Khusus Parkir Fasum Saja</p>
                  <p className="text-[11px] opacity-90 font-bold mt-0.5">
                    Bayar terpisah (Weekend/Member/Harian)
                  </p>
                </button>
              </div>

              {paketBayar === 'PARKIR_ONLY' && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2">
                  <span className="font-bold text-amber-950">Nominal Parkir Saja (Rp):</span>
                  <div className="flex gap-1.5">
                    {[feeDaily, feeWeekend, feeMonthly].map((nom) => (
                      <button
                        key={nom}
                        type="button"
                        onClick={() => setCustomParkirOnlyAmount(nom)}
                        className={`px-2 py-1 rounded-lg font-bold text-[11px] border ${
                          Number(customParkirOnlyAmount) === Number(nom)
                            ? 'bg-amber-500 text-slate-950 border-amber-600'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        {formatRp(nom)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Upload Screenshot / Foto Bukti Bayar ke Drive Bukti_Iuran_Warga */}
            <div className="bg-slate-50 border-2 border-dashed border-teal-500/60 rounded-2xl p-3.5">
              <label className="block font-extrabold text-teal-900 mb-1">
                4. 📷 Unggah Screenshot / Foto Bukti Transfer (Otomatis Masuk Google Drive)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-teal-800 file:text-white hover:file:bg-teal-700"
              />

              {isCompressing && (
                <p className="text-[11px] text-amber-700 font-semibold mt-1.5">
                  ⏳ Mengompresi gambar bukti pembayaran...
                </p>
              )}

              {fileBase64 && (
                <div className="mt-2.5 flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={fileBase64}
                      alt="Preview Bukti QRIS"
                      className="w-11 h-11 object-cover rounded-lg border border-teal-500/40"
                    />
                    <div>
                      <p className="text-[11px] font-bold text-emerald-700 truncate max-w-[180px]">
                        ✓ {fileName || 'Bukti siap diunggah'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Ukuran ringan: ~{Math.round(fileBase64.length / 1024)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRawFile(null);
                      setFileBase64('');
                      setFileName('');
                    }}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-bold px-2"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>

            {/* Pesan Status & Link Bukti Google Drive */}
            {statusMessage && (
              <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 font-semibold space-y-1">
                <p>{statusMessage}</p>
                {uploadedDriveUrl && (
                  <a
                    href={uploadedDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-teal-800 underline font-extrabold hover:text-teal-600"
                  >
                    📎 Lihat Bukti Pembayaran Anda di Google Drive →
                  </a>
                )}
              </div>
            )}

            {/* Tombol Kirim Bukti */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isCompressing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition"
              >
                {isSubmitting
                  ? '⏳ Mengirim ke Google Drive...'
                  : `📤 Kirim Bukti (${formatRp(totalNominalBayar)} • Buku ${periodeBulan})`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
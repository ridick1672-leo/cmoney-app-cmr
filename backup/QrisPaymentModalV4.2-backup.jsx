import React, { useState, useEffect } from 'react';
import { compressImageToBase64 } from '../services/apiService';

export default function QrisPaymentModal({
  isOpen,
  onClose,
  initialHouse,
  defaultHouseId,
  merchantName,
  qrisMerchantName,
  nmid,
  qrisNmid,
  qrisImageUrl = '/assets/qris-cmr-statis.png',
  defaultAmount = 200000,
  periodeBulan = 'November',
  periodeTahun = 2026,
  houses = [],
  onConfirmUpload,
  onUploadSuccess
}) {
  const activeHouses = (houses || []).filter(
    (h) => h.status_huni !== 'Tidak Aktif' && h.id !== 'H-04'
  );

  const [selectedHouse, setSelectedHouse] = useState(
    initialHouse || defaultHouseId || 'H-01'
  );
  const [selectedPeriod, setSelectedPeriod] = useState(periodeBulan || 'November');
  const [rawFile, setRawFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileBase64, setFileBase64] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [qrisImgError, setQrisImgError] = useState(false);
  const [copiedNominal, setCopiedNominal] = useState(false);

  useEffect(() => {
    if (initialHouse || defaultHouseId) {
      const target = initialHouse || defaultHouseId;
      setSelectedHouse(target === 'H-04' ? 'H-01' : target);
    }
  }, [initialHouse, defaultHouseId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUploadResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const finalMerchantName =
    merchantName || qrisMerchantName || 'Cluster Mutiara Residence';
  const finalNmid = nmid || qrisNmid || 'ID1026000000CMR';
  const formatRp = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');

  const handleCopyNominal = () => {
    navigator.clipboard.writeText(String(defaultAmount || 200000));
    setCopiedNominal(true);
    setTimeout(() => setCopiedNominal(false), 2000);
  };

  // Pilih & Kompresi Foto Bukti Transfer QRIS Warga ke Base64
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawFile(file);
    setFileName(file.name);
    setUploadResult(null);

    try {
      const base64Str = await compressImageToBase64(file, 800, 0.75);
      setFileBase64(base64Str);
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (ev) => setFileBase64(ev.target?.result || '');
      reader.readAsDataURL(file);
    }
  };

  // Kirim Bukti QRIS Warga ke Google Drive (Folder: Bukti_Iuran_Warga) & Sheet ipl_status
  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!rawFile && !fileBase64) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      let finalBase64 = fileBase64;
      if (rawFile && !finalBase64) {
        finalBase64 = await compressImageToBase64(rawFile, 800, 0.75);
      }

      const payload = {
        house_id: selectedHouse,
        periode_bulan: selectedPeriod,
        periode_tahun: Number(periodeTahun || 2026),
        nominal: Number(defaultAmount || 200000),
        file_name: fileName || 'bukti_qris_warga.jpg',
        file_base64: finalBase64
      };

      const uploadHandler = onConfirmUpload || onUploadSuccess;
      let res = null;
      if (uploadHandler) {
        res = await uploadHandler(payload);
      }

      const driveUrl =
        res && res.url_bukti && String(res.url_bukti).startsWith('http')
          ? res.url_bukti
          : '';

      setUploadResult({
        success: true,
        message: `✅ Bukti pembayaran IPL rumah ${selectedHouse} (${selectedPeriod} ${periodeTahun}) berhasil dikirim & tersimpan di Google Drive!`,
        driveUrl
      });

      setRawFile(null);
      setFileName('');
      setFileBase64('');
    } catch (err) {
      setUploadResult({
        success: false,
        message: `❌ Gagal mengunggah bukti: ${err.message}`
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-start md:items-center justify-center overflow-y-auto p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-3xl p-5 my-4 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto border border-slate-200"
      >
        {/* Header Modal QRIS dengan Tombol Back & Tanda Silang (X) */}
        <div className="sticky top-0 bg-white z-10 pb-3 border-b border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            <span>←</span>
            <span>Kembali</span>
          </button>

          <div className="text-center">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-teal-50 text-teal-800 rounded-md border border-teal-200">
              QRIS Statis Resmi • MDR 0%
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black flex items-center justify-center text-sm transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Kartu Kode QRIS Cluster Mutiara Residence */}
        <div className="bg-gradient-to-b from-slate-50 to-teal-50/40 border border-teal-200/80 rounded-2xl p-4 text-center space-y-2.5">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">
              {finalMerchantName}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">NMID: {finalNmid}</p>
          </div>

          <div className="w-56 h-56 mx-auto bg-white rounded-2xl border-2 border-teal-600/30 p-2.5 flex items-center justify-center shadow-sm overflow-hidden">
            {!qrisImgError && qrisImageUrl ? (
              <img
                src={qrisImageUrl}
                alt="QRIS Cluster Mutiara Residence"
                onError={() => setQrisImgError(true)}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-xs text-slate-500 space-y-1 p-3">
                <p className="text-2xl">📲</p>
                <p className="font-extrabold text-slate-700">QRIS STATIS CMR</p>
                <p className="text-[10px] text-slate-400">
                  Simpan gambar QRIS di public/assets/qris-cmr-statis.png
                </p>
              </div>
            )}
          </div>

          {/* Nominal Tagihan & Tombol Salin Nominal */}
          <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="text-left">
              <span className="text-[10px] text-slate-400 block">
                Nominal Iuran IPL Wajib
              </span>
              <strong className="text-base font-black text-teal-800">
                {formatRp(defaultAmount)}
              </strong>
            </div>
            <button
              type="button"
              onClick={handleCopyNominal}
              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-extrabold text-[11px] border border-teal-200 transition cursor-pointer"
            >
              {copiedNominal ? '✅ Tersalin' : '📋 Salin Nominal'}
            </button>
          </div>
        </div>

        {/* Form Konfirmasi & Upload Bukti Transfer ke Google Drive (Bukti_Iuran_Warga) */}
        <form onSubmit={handleSubmitProof} className="space-y-3 text-xs">
          <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
            Konfirmasi & Unggah Bukti Pembayaran Warga
          </h4>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-500 mb-1 font-semibold">
                Pilih Unit Rumah (21 Aktif)
              </label>
              <select
                value={selectedHouse}
                onChange={(e) => setSelectedHouse(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 font-bold bg-slate-50"
              >
                {activeHouses.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nomor_rumah} - {h.nama_warga}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1 font-semibold">
                Periode Bulan IPL
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 font-bold bg-slate-50"
              >
                {[
                  'Juni',
                  'Juli',
                  'Agustus',
                  'September',
                  'Oktober',
                  'November',
                  'Desember'
                ].map((b) => (
                  <option key={b} value={b}>
                    {b} {periodeTahun}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-dashed border-teal-300 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block font-extrabold text-teal-900 text-[11px]">
                  📎 Pilih Screenshot / Foto Bukti Bayar QRIS
                </label>
                <p className="text-[10px] text-slate-500">
                  Otomatis masuk ke folder Drive: <strong>Bukti_Iuran_Warga</strong>
                </p>
              </div>
              {fileBase64 && (
                <button
                  type="button"
                  onClick={() => {
                    setRawFile(null);
                    setFileName('');
                    setFileBase64('');
                  }}
                  className="text-[10px] font-bold text-rose-600"
                >
                  ✕ Hapus
                </button>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              required={!fileBase64}
              onChange={handleFileChange}
              className="w-full text-[11px] file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:font-extrabold file:bg-teal-700 file:text-white hover:file:bg-teal-800 cursor-pointer"
            />

            {fileBase64 && (
              <div className="flex items-center gap-2.5 pt-1">
                <img
                  src={fileBase64}
                  alt="Preview Bukti QRIS"
                  className="w-14 h-14 object-cover rounded-xl border border-teal-300 shadow-sm"
                />
                <div className="text-[10px] text-slate-600">
                  <p className="font-bold text-slate-800 truncate max-w-[190px]">
                    {fileName}
                  </p>
                  <p className="text-emerald-700 font-semibold">
                    ✓ Siap diunggah ke Google Drive
                  </p>
                </div>
              </div>
            )}
          </div>

          {uploadResult && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold space-y-1 ${
                uploadResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              <p>{uploadResult.message}</p>
              {uploadResult.driveUrl && (
                <a
                  href={uploadResult.driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-extrabold text-teal-800 underline"
                >
                  📎 Lihat Bukti di Google Drive →
                </a>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading || (!rawFile && !fileBase64)}
            className="w-full py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-extrabold shadow-md transition cursor-pointer"
          >
            {isUploading
              ? '⏳ Mengunggah Bukti ke Google Drive...'
              : '📤 Kirim Bukti Pembayaran IPL'}
          </button>
        </form>
      </div>
    </div>
  );
}
import React, { useState } from 'react';

export default function QrisPaymentModal({
  isOpen,
  onClose,
  merchantName = 'Cluster Mutiara Residence',
  nmid = 'ID1026000000CMR',
  qrisImageUrl = '/assets/qris-cmr-statis.png',
  defaultAmount = 200000
}) {
  const [selectedHouse, setSelectedHouse] = useState('H-01');
  const [selectedMonth, setSelectedMonth] = useState('November');
  const [proofFile, setProofFile] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const housesList = Array.from({ length: 21 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    return { id: `H-${num}`, label: `Rumah No. ${num}` };
  });

  const handleCopyNominal = () => {
    navigator.clipboard.writeText(String(defaultAmount));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto shadow-2xl animate-slide-up">
        {/* Header Modal QRIS */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md">
              QRIS Nasional • Bebas Potongan (MDR 0%)
            </span>
            <h3 className="text-base font-extrabold text-slate-800 mt-1">
              Bayar Iuran IPL Warga
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Pilihan Nomor Rumah & Periode */}
        <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
          <div>
            <label className="font-semibold text-slate-600 block mb-1">
              Pilih Nomor Rumah
            </label>
            <select
              value={selectedHouse}
              onChange={(e) => setSelectedHouse(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 bg-slate-50"
            >
              {housesList.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-semibold text-slate-600 block mb-1">
              Periode Bulan
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 bg-slate-50"
            >
              {['November', 'Desember', 'Januari'].map((m) => (
                <option key={m} value={m}>
                  {m} 2026
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Frame Kartu Standar QRIS */}
        <div className="mt-4 bg-gradient-to-b from-slate-50 to-white border-2 border-slate-200 rounded-2xl p-4 text-center relative">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2 px-2">
            <span>QRIS</span>
            <span className="text-teal-700">GPN • Standar Pembayaran Nasional</span>
          </div>

          <p className="font-extrabold text-sm text-slate-900 uppercase">
            {merchantName}
          </p>
          <p className="text-[11px] text-slate-500 mb-3">NMID: {nmid}</p>

          {/* Gambar Kode QRIS */}
          <div className="w-52 h-52 mx-auto bg-white p-3 rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center">
            <img
              src={qrisImageUrl}
              alt="QRIS Cluster Mutiara Residence"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=QRIS_CMR_200000';
              }}
            />
          </div>

          {/* Box Nominal Tagihan */}
          <div className="mt-3 bg-teal-50 border border-teal-100 rounded-xl p-2.5 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] text-teal-700 block">
                Nominal Iuran ({selectedHouse} • {selectedMonth})
              </span>
              <span className="text-base font-extrabold text-teal-900">
                Rp {Number(defaultAmount).toLocaleString('id-ID')}
              </span>
            </div>
            <button
              onClick={handleCopyNominal}
              className="text-xs bg-white text-teal-700 border border-teal-200 px-3 py-1.5 rounded-lg font-bold shadow-sm"
            >
              {copied ? '✓ Tersalin' : 'Salin Angka'}
            </button>
          </div>

          {/* Tombol Unduh QRIS ke Galeri HP */}
          <a
            href={qrisImageUrl}
            download={`QRIS_${merchantName}_${selectedHouse}.png`}
            className="mt-3 inline-block w-full py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition"
          >
            ⬇️ Simpan Gambar QRIS ke Galeri HP
          </a>
        </div>

        {/* Form Unggah Bukti Pembayaran */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
          <label className="font-bold text-slate-700 block mb-1.5">
            Sudah Bayar? Unggah Screenshot Bukti Transfer:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
            className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
          />
          <button
            disabled={!proofFile}
            onClick={() => {
              alert(
                `Bukti pembayaran ${selectedHouse} (${selectedMonth}) berhasil dikirim ke folder Bukti_Iuran_Warga untuk divalidasi Bendahara.`
              );
              onClose();
            }}
            className="mt-3 w-full py-3 rounded-xl bg-teal-700 disabled:bg-slate-300 text-white font-extrabold text-xs shadow-md transition"
          >
            ✅ Kirim Bukti Pembayaran IPL
          </button>
        </div>
      </div>
    </div>
  );
}

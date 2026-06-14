import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface DynamicQRProps {
  upiId: string;
  amount: number;
  orderId: string;
}

export const DynamicQR: React.FC<DynamicQRProps> = ({ upiId, amount, orderId }) => {
  const [copied, setCopied] = useState(false);

  const payeeName = "SKB COMPUTER AND SERVICE";
  const notes = `SKB_ORDER_${orderId}`;
  
  // Format standard UPI Deep link
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&tn=${encodeURIComponent(notes)}&cu=INR`;
  
  // Google QR Code API rendering
  const qrCodeUrl = `https://chart.googleapis.com/chart?chs=260x260&cht=qr&chl=${encodeURIComponent(upiLink)}&choe=UTF-8`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center justify-center max-w-sm mx-auto text-center gap-4">
      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
        Scan & Pay with UPI App
      </span>

      <div className="bg-white p-4 rounded-xl shadow-xl border border-emerald-500/10">
        <img 
          src={qrCodeUrl} 
          alt="UPI Payment QR Code" 
          className="w-56 h-56 object-contain"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="w-full flex flex-col gap-1 items-center">
        <span className="text-xl font-mono underline font-bold text-gray-900">
          ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
        <span className="text-xs text-gray-500">Order Ref: {orderId}</span>
      </div>

      <div className="w-full border-t border-gray-200/50 pt-4 flex flex-col gap-2">
        <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">Payee UPI ID</span>
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg py-2 px-3 gap-2 w-full">
          <code className="text-sm font-mono text-emerald-800 break-all select-all font-semibold">
            {upiId}
          </code>
          <button
            type="button"
            onClick={copyToClipboard}
            className="text-gray-400 hover:text-emerald-600 transition-colors shrink-0"
            title="Copy UPI ID"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

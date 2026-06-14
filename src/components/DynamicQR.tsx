import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface DynamicQRProps {
  upiId: string;
  amount: number;
  orderId: string;
  customQrUrl?: string;
}

export const DynamicQR: React.FC<DynamicQRProps> = ({ upiId, amount, orderId, customQrUrl }) => {
  const [copied, setCopied] = useState(false);

  const payeeName = "SKB COMPUTER AND SERVICE";
  const notes = `SKB_ORDER_${orderId}`;
  
  // Format standard UPI Deep link
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&tn=${encodeURIComponent(notes)}&cu=INR`;
  
  // Use custom QR URL if provided, otherwise generate standard dynamic Google Charts API QR
  const qrCodeUrl = customQrUrl || `https://chart.googleapis.com/chart?chs=260x260&cht=qr&chl=${encodeURIComponent(upiLink)}&choe=UTF-8`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-4 font-sans select-none">
      
      {/* Dynamic Kotak UPI Payment Board */}
      <div className="bg-[#F6F9FC] border border-gray-200/60 rounded-[2.5rem] p-6 shadow-md flex flex-col items-center relative overflow-hidden">
        
        {/* Header logos: Kotak and Powered by UPI */}
        <div className="w-full flex items-center justify-between mb-8">
          {/* Kotak Mahindra Bank Logo Accent */}
          <div className="flex items-center gap-1.5">
            {/* Kotak Brand Icon */}
            <div className="w-7 h-7 bg-[#ED1C24] rounded-full flex items-center justify-center shadow-sm relative shrink-0">
              {/* Outer logo stylized white infinity curve emblem */}
              <svg viewBox="0 0 100 100" className="w-5 h-5 text-white fill-current">
                <path d="M50 20C33.4 20 20 33.4 20 50s13.4 30 30 30 30-13.4 30-30-13.4-30-30-30zm0 46c-8.8 0-16-7.2-16-16s7.2-16 16-16 16 7.2 16 16-7.2 16-16 16z" />
                <path d="M50 40c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10z" />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-black text-[#012B5C] tracking-tight">kotak</span>
              <span className="text-[7.5px] font-bold text-[#8692A6] uppercase tracking-[0.02em]">Kotak Mahindra Bank</span>
            </div>
          </div>

          {/* Powered by UPI */}
          <div className="flex flex-col items-end leading-none">
            <span className="text-[6.5px] uppercase tracking-wider text-gray-400 font-bold">POWERED BY</span>
            <div className="flex items-center gap-0.5 mt-0.5">
              <span className="text-xs font-black italic text-[#0F6F50] tracking-tight">U</span>
              <span className="text-xs font-black italic text-[#E58021] tracking-tight">P</span>
              <span className="text-xs font-black italic text-[#084F8C] tracking-tight">I</span>
              {/* Colored arrows */}
              <div className="flex flex-col ml-0.5 gap-[1px]">
                <div className="w-1.5 h-[3px] bg-[#0F6F50] transform -skew-x-12" />
                <div className="w-1.5 h-[3px] bg-[#E58021] transform skew-x-12" />
              </div>
            </div>
          </div>
        </div>

        {/* Pay to Name Title */}
        <div className="text-center mb-5">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">Pay to</p>
          <h3 className="text-xl font-extrabold text-[#111827] tracking-tight uppercase">SKBCOMPUTER</h3>
        </div>

        {/* White Card surrounding the QR Code with logo inside */}
        <div className="bg-white px-5 pt-5 pb-4 rounded-[2.2rem] shadow-lg border border-gray-100 flex flex-col items-center w-full max-w-[270px] relative">
          
          {/* QR Code Graphic Container */}
          <div className="relative w-[210px] h-[210px] flex items-center justify-center bg-white rounded-2xl overflow-hidden shadow-inner p-1">
            <img 
              src={qrCodeUrl} 
              alt="UPI Payment QR Code" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
            
            {/* Center icon watermark (Kotak Red style loop inside white circle badge) - only show for standard generated QR */}
            {!customQrUrl && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-0.5 shadow border border-gray-100 flex items-center justify-center w-9 h-9">
                <div className="w-full h-full bg-[#012B5C] rounded-full flex items-center justify-center">
                  {/* White loop logo */}
                  <svg viewBox="0 0 100 100" className="w-5 h-5 text-white fill-current">
                    <path d="M50 20C33.4 20 20 33.4 20 50s13.4 30 30 30 30-13.4 30-30-13.4-30-30-30zm0 46c-8.8 0-16-7.2-16-16s7.2-16 16-16 16 7.2 16 16-7.2 16-16 16z" />
                    <path d="M50 40c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10z" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* UPI ID text row in white card */}
          <div className="mt-3.5 text-center">
            <span className="text-[11px] font-bold text-gray-500 font-sans uppercase tracking-wider block">
              UPI ID: <span className="text-[#374151] font-mono lowercase normal-case tracking-normal">{upiId}</span>
            </span>
          </div>
        </div>

        {/* Footer pay using any UPI app styling */}
        <div className="w-full flex flex-col items-center mt-6 text-center">
          <p className="text-[9.5px] font-bold text-gray-400 uppercase tracking-widest">Pay using any UPI app</p>
          
          {/* Mini dynamic vectors of primary Indian payment brands */}
          <div className="flex items-center gap-4 mt-3">
            {/* GPay */}
            <div className="flex items-center gap-0.5" title="Google Pay">
              <span className="text-[10px] font-black tracking-tight text-gray-600">G</span>
              <div className="flex items-center gap-[1px]">
                <div className="w-1 h-3 bg-[#4285F4] rounded-sm transform rotate-12" />
                <div className="w-1 h-2.5 bg-[#EA4335] rounded-sm transform -rotate-12" />
                <div className="w-1 h-2 bg-[#FBBC05] rounded-sm transform rotate-45" />
                <div className="w-1 h-3 bg-[#34A853] rounded-sm transform -rotate-12" />
              </div>
              <span className="text-[10px] font-black tracking-tight text-gray-600">Pay</span>
            </div>

            {/* PhonePe */}
            <div className="flex items-center gap-1 bg-[#5F259F]/5 px-2 py-0.5 rounded border border-[#5F259F]/10 font-sans" title="PhonePe">
              <div className="w-2.5 h-2.5 bg-[#5F259F] rounded flex items-center justify-center">
                <span className="text-[6px] font-bold text-white font-serif italic">P</span>
              </div>
              <span className="text-[9px] font-black text-[#5F259F] tracking-tighter">PhonePe</span>
            </div>

            {/* BHIM / UPI logo tiny */}
            <div className="flex items-center" title="BHIM / UPI">
              <span className="text-[9.5px] font-black text-emerald-800 tracking-tight italic">BHIM</span>
            </div>

            {/* Paytm */}
            <div className="flex items-center gap-0.5" title="Paytm">
              <span className="text-[10px] font-black text-[#002E6E]">Pay</span>
              <span className="text-[10px] font-bold text-[#00B9F5]">tm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copying details and Amount Indicator below Kotak graphic card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3.5 shadow-sm">
        
        {/* Exact amount block */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <div className="flex flex-col">
            <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest">Order Reference</span>
            <span className="text-xs font-semibold text-gray-600 font-mono mt-0.5">#{orderId}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest">Payable Amount</span>
            <span className="text-base font-extrabold text-[#0D530E] mt-0.5 font-mono">
              ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Copy button field row */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200/80 rounded-xl py-2 px-3 gap-2">
            <code className="text-xs font-mono text-emerald-800 break-all select-all font-semibold">
              {upiId}
            </code>
            <button
              type="button"
              onClick={copyToClipboard}
              className="text-gray-400 hover:text-emerald-700 transition-all shrink-0 hover:scale-105 p-1 rounded-md hover:bg-white border border-transparent hover:border-gray-100"
              title="Copy UPI ID"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </button>
          </div>
          {copied && (
            <span className="text-[10px] text-emerald-600 font-bold self-end mr-1 mt-0.5">
              Payee ID copied to clipboard!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

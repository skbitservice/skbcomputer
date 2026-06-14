import React from "react";

interface FooterProps {
  setView: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setView }) => {
  const currentYear = new Date().getFullYear();

  const handleNavClick = (view: string) => {
    setView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#E7E1B1] border-t border-[#0d530e]/12 mt-16 pt-16 pb-24 md:pb-16 relative z-10 text-[#0d530e]">
      <div className="max-w-[1160px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 pb-12">
        {/* Brand Column */}
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => handleNavClick("home")} 
            className="flex items-center gap-3 text-left focus:outline-none"
          >
            <span className="font-mono font-bold text-xs bg-[#306D29] text-[#FBF5DD] px-2 py-1 select-none">
              SKB
            </span>
            <div className="flex flex-col">
              <span className="font-sans font-bold text-[#0D530E] text-base leading-tight">
                SKB COMPUTER
              </span>
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-[#4A6B43]">
                Laptop &amp; PC Service
              </span>
            </div>
          </button>
          <p className="text-[#4A6B43] text-sm max-w-sm leading-relaxed">
            Honest laptop &amp; computer repair operations in New Delhi. Servicing screens, motherboards, chip-level micro soldering, and hardware updates with unmatched transparency.
          </p>
        </div>

        {/* Links Column */}
        <div className="flex flex-col gap-4 md:pl-16">
          <h4 className="font-sans font-bold text-[#0D530E] text-sm uppercase tracking-wider">Quick Actions</h4>
          <div className="flex flex-col gap-2.5 font-semibold text-sm">
            <button onClick={() => handleNavClick("home")} className="text-left text-[#4A6B43] hover:text-[#306D29] transition">
              Home Page
            </button>
            <button onClick={() => handleNavClick("catalog")} className="text-left text-[#4A6B43] hover:text-[#306D29] transition">
              Services &amp; Parts Catalog
            </button>
            <a href="#about" onClick={() => handleNavClick("home")} className="text-[#4A6B43] hover:text-[#306D29] transition">
              About Us
            </a>
            <a href="#faq" onClick={() => handleNavClick("home")} className="text-[#4A6B43] hover:text-[#306D29] transition">
              FAQ Help
            </a>
          </div>
        </div>

        {/* Contact info Column */}
        <div className="flex flex-col gap-4">
          <h4 className="font-sans font-bold text-[#0D530E] text-sm uppercase tracking-wider">Contact Details</h4>
          <div className="flex flex-col gap-3 text-sm text-[#4A6B43]">
            <a href="tel:7011396007" className="font-mono font-bold text-[#306D29] hover:underline text-base block">
              +91 7011396007
            </a>
            <a href="mailto:skbitservice@gmail.com" className="hover:underline text-xs block">
              skbitservice@gmail.com
            </a>
            <p className="text-xs">
              <strong className="text-[#0D530E]">Main Centres:</strong> Nehru Place &amp; Nangloi, New Delhi, India
            </p>
          </div>
        </div>
      </div>

      {/* Footer copyright bottom */}
      <div className="max-w-[1160px] mx-auto px-6 border-t border-[#0d530e]/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-[#4A6B43]">
        <p>&copy; {currentYear} SKB Computer. All rights reserved.</p>
        <p className="text-[10px]">Production Staging Environment Secured by Firebase Cloud Firestore Auth</p>
      </div>
    </footer>
  );
};

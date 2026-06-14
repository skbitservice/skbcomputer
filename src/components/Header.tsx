import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { ShoppingCart, LogOut, LayoutDashboard, User, MessageSquare, PhoneCall, AlertTriangle } from "lucide-react";

interface HeaderProps {
  currentView: string;
  setView: (view: string) => void;
  openCartDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setView, openCartDrawer }) => {
  const { user, userProfile, logOut, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: string) => {
    setView(view);
    setMobileMenuOpen(false);
  };

  const dashboardViewField = isAdmin ? "admin-panel" : "user-dashboard";

  return (
    <header className="sticky top-0 z-50 bg-[#FBF5DD]/85 backdrop-blur-md border-b border-[#0d530e]/12">
      <div className="max-w-[1160px] mx-auto px-6 h-[72px] flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <button 
          onClick={() => handleNavClick("home")} 
          className="flex items-center gap-3 text-left focus:outline-none"
        >
          <span className="font-mono font-bold text-xs bg-[#306D29] text-[#FBF5DD] px-2 py-1.5 rounded tracking-widest animate-pulse">
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

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 font-sans font-semibold text-sm">
          <button 
            onClick={() => handleNavClick("home")}
            className={`transition-all hover:text-[#306D29] relative py-1 ${currentView === "home" ? "text-[#306D29]" : "text-[#4A6B43]"}`}
          >
            Home
            {currentView === "home" && <span className="absolute left-0 bottom-0 w-full h-0.5 bg-[#306D29]" />}
          </button>
          <button 
            onClick={() => handleNavClick("catalog")}
            className={`transition-all hover:text-[#306D29] relative py-1 ${currentView === "catalog" ? "text-[#306D29]" : "text-[#4A6B43]"}`}
          >
            Products &amp; Services
            {currentView === "catalog" && <span className="absolute left-0 bottom-0 w-full h-0.5 bg-[#306D29]" />}
          </button>
          <a 
            href="#faq"
            onClick={() => handleNavClick("home")}
            className="text-[#4A6B43] hover:text-[#306D29] transition-all"
          >
            FAQ
          </a>
          <a 
            href="#policy"
            onClick={() => handleNavClick("home")}
            className="text-[#4A6B43] hover:text-[#306D29] transition-all"
          >
            Policies
          </a>
        </nav>

        {/* Action Panel */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Phone Call Button */}
          <a 
            href="tel:7011396007" 
            className="hidden sm:flex items-center gap-2 font-mono text-xs text-[#0D530E] border border-[#0d530e]/12 px-3.5 py-1.5 rounded-lg hover:border-[#306D29] transition"
          >
            <span className="w-2 h-2 rounded-full bg-[#306D29] shadow-[0_0_0_4px_rgba(48,109,41,0.15)] animate-ping mr-1" />
            7011396007
          </a>

          {/* Cart Icon trigger */}
          <button 
            onClick={openCartDrawer}
            className="relative p-2 rounded-lg border border-[#0d530e]/12 bg-[#FBF5DD] text-[#0D530E] hover:border-[#306D29] transition group focus:outline-none"
            aria-label="View Cart"
          >
            <ShoppingCart size={18} className="group-hover:scale-110 transition" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#E7912E] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-[#FBF5DD] shadow">
                {itemCount}
              </span>
            )}
          </button>

          {/* auth link / session logic */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavClick(dashboardViewField)}
                className="hidden md:flex items-center gap-2 font-sans text-xs bg-[#306D29] text-[#FBF5DD] hover:bg-[#0D530E] px-4 py-2 rounded-lg font-bold transition-all shadow-[0_4px_12px_rgba(48,109,41,0.2)]"
              >
                <LayoutDashboard size={14} />
                <span>{isAdmin ? "Admin Panel" : "My Dashboard"}</span>
              </button>

              <button
                onClick={() => handleNavClick(dashboardViewField)}
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-full bg-[#306D29] text-[#FBF5DD] font-bold shadow text-sm"
                title={isAdmin ? "Admin Panel" : "My Dashboard"}
              >
                {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : "U"}
              </button>

              <button
                onClick={logOut}
                className="hidden sm:flex p-2 rounded-lg border border-[#0d530e]/12 text-[#4A6B43] hover:text-[#C0392B] hover:border-[#C0392B] transition"
                title="Log Out"
                id="headerLogoutBtn"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleNavClick("auth")}
              className="flex items-center gap-2 font-sans text-xs bg-[#306D29] text-[#FBF5DD] hover:bg-[#0D530E] px-4 py-2 rounded-lg font-bold transition shadow-[0_4px_12px_rgba(48,109,41,0.2)]"
            >
              <User size={14} />
              <span>Login / Sign Up</span>
            </button>
          )}

          {/* Nav toggle hamburger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden flex flex-col justify-center items-end gap-1.5 p-2 focus:outline-none"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Navigation"
          >
            <div className={`h-[2px] bg-[#0D530E] rounded transition-all duration-300 ${mobileMenuOpen ? "w-6 rotate-45 translate-y-[8px]" : "w-6"}`} />
            <div className={`h-[2px] bg-[#0D530E] rounded transition-all duration-300 ${mobileMenuOpen ? "w-0 opacity-0" : "w-4"}`} />
            <div className={`h-[2px] bg-[#0D530E] rounded transition-all duration-300 ${mobileMenuOpen ? "w-6 -rotate-45 -translate-y-[8px]" : "w-5"}`} />
          </button>
        </div>
      </div>

      {/* Expanded mobile navigation menu sheet */}
      {mobileMenuOpen && (
        <div className="md:hidden h-auto bg-[#FBF5DD] border-b border-[#0d530e]/12 animate-fadeDown">
          <div className="px-6 py-6 flex flex-col gap-4 font-sans font-bold text-sm">
            <button 
              onClick={() => handleNavClick("home")}
              className={`text-left py-2 border-b border-[#0d530e]/5 ${currentView === "home" ? "text-[#306D29]" : "text-[#4A6B43]"}`}
            >
              Home
            </button>
            <button 
              onClick={() => handleNavClick("catalog")}
              className={`text-left py-2 border-b border-[#0d530e]/5 ${currentView === "catalog" ? "text-[#306D29]" : "text-[#4A6B43]"}`}
            >
              Products &amp; Services Catalog
            </button>
            {user ? (
              <>
                <button 
                  onClick={() => handleNavClick(dashboardViewField)}
                  className={`text-left py-2 border-b border-[#0d530e]/5 text-[#306D29] flex items-center gap-2`}
                >
                  <LayoutDashboard size={16} />
                  <span>{isAdmin ? "Admin Workstation" : "User Area Dashboard"}</span>
                </button>
                <button 
                  onClick={() => {
                    logOut();
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 font-semibold text-red-600 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <button 
                onClick={() => handleNavClick("auth")}
                className="text-left py-2 text-[#306D29] flex items-center gap-2"
              >
                <User size={16} />
                <span>Log In / Create Account</span>
              </button>
            )}
            <div className="pt-2">
              <a 
                href="tel:7011396007"
                className="flex items-center justify-center gap-2 bg-[#306D29] text-white py-3 rounded-lg text-xs"
              >
                <PhoneCall size={14} />
                <span>Call Hotline: 7011396007</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

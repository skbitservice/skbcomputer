import React from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Home, Compass, ShoppingCart, User, LayoutDashboard } from "lucide-react";

interface MobileBottomNavProps {
  currentView: string;
  setView: (view: string) => void;
  openCartDrawer: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ 
  currentView, 
  setView, 
  openCartDrawer 
}) => {
  const { user, isAdmin } = useAuth();
  const { itemCount } = useCart();

  const dashboardViewField = user 
    ? (isAdmin ? "admin-panel" : "user-dashboard") 
    : "auth";

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FBF5DD]/95 backdrop-blur-md border-t border-[#0d530e]/12 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-4 py-2 flex items-center justify-around h-16 safe-bottom">
      {/* Home Tab */}
      <button
        onClick={() => setView("home")}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
          currentView === "home" ? "text-[#306D29] scale-105" : "text-[#4A6B43] hover:text-[#306D29]"
        }`}
        id="mob-nav-home"
      >
        <Home size={20} className={currentView === "home" ? "stroke-[2.5]" : "stroke-[1.8]"} />
        <span className="text-[10px] font-sans font-bold mt-1 tracking-wider uppercase">Home</span>
      </button>

      {/* Catalog Tab */}
      <button
        onClick={() => setView("catalog")}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
          currentView === "catalog" ? "text-[#306D29] scale-105" : "text-[#4A6B43] hover:text-[#306D29]"
        }`}
        id="mob-nav-catalog"
      >
        <Compass size={20} className={currentView === "catalog" ? "stroke-[2.5]" : "stroke-[1.8]"} />
        <span className="text-[10px] font-sans font-bold mt-1 tracking-wider uppercase">Catalog</span>
      </button>

      {/* Cart Drawer Trigger */}
      <button
        onClick={openCartDrawer}
        className="flex flex-col items-center justify-center flex-1 py-1 relative text-[#4A6B43] hover:text-[#306D29] transition-all"
        id="mob-nav-cart"
      >
        <div className="relative">
          <ShoppingCart size={20} className="stroke-[1.8]" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#E7912E] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-[#FBF5DD] shadow font-sans">
              {itemCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-sans font-bold mt-1 tracking-wider uppercase">Cart</span>
      </button>

      {/* Account / Dashboard Tab */}
      <button
        onClick={() => setView(dashboardViewField)}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
          ["auth", "user-dashboard", "admin-panel"].includes(currentView) 
            ? "text-[#306D29] scale-105" 
            : "text-[#4A6B43] hover:text-[#306D29]"
        }`}
        id="mob-nav-profile"
      >
        {user ? (
          isAdmin ? (
            <LayoutDashboard size={20} className={currentView === "admin-panel" ? "stroke-[2.5]" : "stroke-[1.8]"} />
          ) : (
            <User size={20} className={currentView === "user-dashboard" ? "stroke-[2.5]" : "stroke-[1.8]"} />
          )
        ) : (
          <User size={20} className={currentView === "auth" ? "stroke-[2.5]" : "stroke-[1.8]"} />
        )}
        <span className="text-[10px] font-sans font-bold mt-1 tracking-wider uppercase">
          {user ? (isAdmin ? "Admin" : "Account") : "Login"}
        </span>
      </button>
    </div>
  );
};

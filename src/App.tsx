import React, { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Catalog } from "./pages/Catalog";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { AdminPanel } from "./pages/AdminPanel";
import { CheckoutCart } from "./components/CheckoutCart";
import { Product } from "./types";
import { auth } from "./firebase";

export default function App() {
  // Simple clientside view-state router: "home" | "catalog" | "auth" | "user-dashboard" | "admin-panel"
  const [view, setView] = useState<string>("home");
  
  // Checkout cart toggle drawer
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Buy Now direct selected item structure
  const [directBuyProduct, setDirectBuyProduct] = useState<Product | null>(null);

  // Switch view on scroll top
  const handleSetView = (nextView: string) => {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Direct buy handler passed to ProductCard components
  const handleBuyNowDirect = (product: Product) => {
    setDirectBuyProduct(product);
    setIsCartOpen(true);
  };

  const handleClearDirectBuy = () => {
    setDirectBuyProduct(null);
  };

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#FBF5DD]/20 to-[#E7E1B1]/10 text-gray-800 antialiased selection:bg-[#306D29] selection:text-[#FBF5DD]">
          
          {/* Main header block */}
          <Header 
            currentView={view} 
            setView={handleSetView} 
            openCartDrawer={() => setIsCartOpen(true)} 
          />

          {/* Dynamic route render based on active view */}
          <main className="flex-grow">
            {view === "home" && (
              <Home setView={handleSetView} />
            )}
            
            {view === "catalog" && (
              <Catalog onBuyNowDirect={handleBuyNowDirect} />
            )}
            
            {view === "auth" && (
              <Auth 
                setView={handleSetView} 
                onSuccess={() => {
                  const userEmail = auth?.currentUser?.email || "";
                  if (userEmail.toLowerCase() === "skbitservice@gmail.com") {
                    handleSetView("admin-panel");
                  } else {
                    handleSetView("user-dashboard");
                  }
                }} 
              />
            )}
            
            {view === "user-dashboard" && (
              <Dashboard />
            )}
            
            {view === "admin-panel" && (
              <AdminPanel />
            )}
          </main>

          {/* Slideout Checkout and shopping cart overlay */}
          <CheckoutCart 
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            setView={handleSetView}
            directBuyProduct={directBuyProduct}
            clearDirectBuy={handleClearDirectBuy}
          />

          {/* Universal Footer section list */}
          <Footer setView={handleSetView} />

        </div>
      </CartProvider>
    </AuthProvider>
  );
}

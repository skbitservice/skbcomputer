import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Address, Order, OrderStatus, OrderPaymentStatus } from "../types";
import { dbService } from "../services/dbService";
import { DynamicQR } from "./DynamicQR";
import { 
  X, Trash2, Plus, Minus, CreditCard, Clock, CheckCircle, 
  MapPin, Landmark, ArrowRight, ShieldCheck, HelpCircle, Loader 
} from "lucide-react";

interface CheckoutCartProps {
  isOpen: boolean;
  onClose: () => void;
  setView: (view: string) => void;
  directBuyProduct: any; // If passed via Direct Buy trigger
  clearDirectBuy: () => void;
}

export const CheckoutCart: React.FC<CheckoutCartProps> = ({ 
  isOpen, 
  onClose, 
  setView, 
  directBuyProduct, 
  clearDirectBuy 
}) => {
  const { user, userProfile } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  
  // Checkout Stages: "cart" -> "shipping" -> "payment" -> "receipt"
  const [stage, setStage] = useState<"cart" | "shipping" | "payment" | "receipt">("cart");
  const [upiId, setUpiId] = useState("7011396007@paytm");

  // Address System States
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [savingAddress, setSavingAddress] = useState(false);

  // Custom Shipping Form States
  const [shipFullName, setShipFullName] = useState("");
  const [shipPhone, setShipPhone] = useState("");
  const [shipStreet, setShipStreet] = useState("");
  const [shipCity, setShipCity] = useState("New Delhi");
  const [shipState, setShipState] = useState("Delhi");
  const [shipPinCode, setShipPinCode] = useState("");
  const [addrError, setAddrError] = useState("");

  // UPI Verification Form States
  const [txnId, setTxnId] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [screenshotBase64, setScreenshotBase64] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Sync addresses if user changes or logged in
  useEffect(() => {
    const fetchAddrs = async () => {
      if (user) {
        const list = await dbService.getAddresses(user.uid);
        setAddresses(list);
        const def = list.find(a => a.isDefault);
        if (def) {
          setSelectedAddressId(def.id);
        } else if (list.length > 0) {
          setSelectedAddressId(list[0].id);
        }
      }
    };
    fetchAddrs();
  }, [user, stage]);

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      const settings = await dbService.getGlobalSettings();
      if (settings && settings.upiId) {
        setUpiId(settings.upiId);
      }
    };
    fetchGlobalSettings();
  }, [stage]);

  // Handle direct Buy Now logic override
  useEffect(() => {
    if (directBuyProduct) {
      setStage("shipping");
    }
  }, [directBuyProduct]);

  if (!isOpen) return null;

  // Resolve active items
  const activeItems = directBuyProduct 
    ? [{
        productId: directBuyProduct.id,
        name: directBuyProduct.name,
        category: directBuyProduct.category,
        price: directBuyProduct.price,
        quantity: 1,
        stock: directBuyProduct.stock,
      }]
    : cart;

  const activeTotal = directBuyProduct ? directBuyProduct.price : cartTotal;

  // Form Validation helper
  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAddrError("");

    if (!shipFullName || !shipPhone || !shipStreet || !shipCity || !shipState || !shipPinCode) {
      setAddrError("All address fields are required.");
      return;
    }

    // Phone / Pin validation
    if (!/^\d{10}$/.test(shipPhone)) {
      setAddrError("Phone number must have exactly 10 digits.");
      return;
    }
    if (!/^\d{6}$/.test(shipPinCode)) {
      setAddrError("PIN code must have exactly 6 digits.");
      return;
    }

    setSavingAddress(true);
    try {
      const saved = await dbService.saveAddress(user.uid, {
        fullName: shipFullName,
        phone: shipPhone,
        street: shipStreet,
        city: shipCity,
        state: shipState,
        pinCode: shipPinCode,
        isDefault: addresses.length === 0
      });

      const nextList = await dbService.getAddresses(user.uid);
      setAddresses(nextList);
      setSelectedAddressId(saved.id || "");
      // Clear inputs
      setShipFullName("");
      setShipPhone("");
      setShipStreet("");
      setShipPinCode("");
    } catch (err) {
      setAddrError("Failed to store address information.");
    } finally {
      setSavingAddress(false);
    }
  };

  // Screenshot handler (convert to Base64 to support direct database preview)
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.2 * 1024 * 1024) {
      alert("Screenshot must be under 1.2MB for cloud network delivery optimization.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotBase64(reader.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Submit payment order
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login first to submit proof of payment.");
      setStage("cart");
      return;
    }

    if (!txnId || !refNumber) {
      alert("UPI Transaction ID and UPI Reference Number are required.");
      return;
    }

    const selectedAddr = addresses.find(a => a.id === selectedAddressId);
    if (!selectedAddr) {
      alert("A validated shipping address is required.");
      return;
    }

    setIsPlacingOrder(true);

    try {
      const orderPayload: Omit<Order, "id"> = {
        userId: user.uid,
        userEmail: user.email || "guest@gmail.com",
        items: activeItems as any,
        billingAddress: selectedAddr,
        totalAmount: activeTotal,
        paymentMethod: "UPI",
        paymentStatus: "pending",
        orderStatus: "placed",
        transactionId: txnId,
        upiRefNumber: refNumber,
        screenshotUrl: screenshotBase64 || "simulated_upload_placeholder_id",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const finalOrder = await dbService.placeOrder(orderPayload);
      setConfirmedOrder(finalOrder);
      
      // Clear Cart state upon purchase completion
      if (!directBuyProduct) {
        clearCart();
      } else {
        clearDirectBuy();
      }

      setStage("receipt");
    } catch (err) {
      console.error(err);
      alert("Error placing order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleStageNavigation = (nextStage: "cart" | "shipping" | "payment") => {
    if (!user && nextStage === "shipping") {
      alert("Please Login / Sign Up first to finalize purchases!");
      setView("auth");
      onClose();
      return;
    }
    setStage(nextStage);
  };

  const selectedAddrObj = addresses.find(a => a.id === selectedAddressId);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/50 backdrop-blur-sm animate-fadeIn font-sans text-gray-800">
      
      {/* Sidebar container card */}
      <div className="w-full max-w-lg bg-white h-full flex flex-col justify-between shadow-2xl relative select-none animate-slideLeft">
        
        {/* Header Block */}
        <div className="p-5 border-b border-[#0d530e]/12 flex justify-between items-center bg-[#FBF5DD] text-[#0D530E]">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#4A6B43] font-bold">Shopping Hub</span>
            <h2 className="text-lg font-sans font-bold flex items-center gap-2">
              {stage === "receipt" ? "Order Placed Successfully!" : "Select Products &amp; Pay"}
            </h2>
          </div>
          <button 
            type="button"
            onClick={() => {
              clearDirectBuy();
              onClose();
            }}
            className="p-1 rounded-full text-[#4A6B43] hover:bg-emerald-50 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Content scroll area */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">

          {/* STAGE 1: CART OVERVIEW */}
          {stage === "cart" && (
            <div className="space-y-4">
              {activeItems.length > 0 ? (
                <>
                  <div className="flex justify-between items-center border-b border-gray-150 pb-2">
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-gray-500">Cart Item List</span>
                    <span className="text-xs text-[#306D29] font-semibold">Total Price calculated in Indian Rupees (INR)</span>
                  </div>

                  <div className="space-y-3">
                    {activeItems.map((item) => (
                      <div key={item.productId} className="flex gap-4 p-3 bg-gray-50 rounded-xl items-center border border-gray-200/50 justify-between">
                        <div className="flex flex-col gap-1 flex-grow">
                          <span className="font-sans font-bold text-[#0D530E] text-sm break-all">{item.name}</span>
                          <span className="text-xs font-mono font-bold text-gray-500">₹{item.price.toLocaleString("en-IN")} × {item.quantity}</span>
                        </div>

                        {/* Adjust quantities */}
                        <div className="flex items-center gap-2.5 bg-white border border-gray-200 px-2 py-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1 hover:text-[#306D29] transition"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-mono font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1 hover:text-[#306D29] transition"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Trash */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          className="p-2 text-gray-400 hover:text-red-500 transition"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Total block */}
                  <div className="border-t border-gray-200/80 pt-4 flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-semibold text-gray-500">
                      <span>Accessory &amp; Repairs Subtotal</span>
                      <span>₹{activeTotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-gray-500">
                      <span>Staging Taxes &amp; Fees</span>
                      <span className="text-green-600">₹0.00 (Standard)</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-150 pt-2">
                      <span>Total Invoice</span>
                      <span>₹{activeTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="min-h-[220px] bg-gray-50 border border-gray-200 rounded-2xl flex flex-col justify-center items-center text-center p-8 gap-3">
                  <span className="text-xs font-mono font-bold text-gray-400 uppercase">Cart is Empty</span>
                  <p className="text-xs text-gray-500 max-w-xs">
                    You have not allocated items to checkout yet. Return to catalog and insert hardware parts or repair configurations.
                  </p>
                  <button 
                    onClick={() => {
                      setView("catalog");
                      onClose();
                    }}
                    className="text-xs font-bold text-[#306D29] underline hover:text-[#0D530E]"
                  >
                    Load catalog catalog &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STAGE 2: SHIPPING DETAILS */}
          {stage === "shipping" && (
            <div className="space-y-6">
              
              {/* Profile Address Selection */}
              <div className="space-y-3">
                <span className="text-xs font-bold font-mono tracking-wider uppercase text-gray-500 flex items-center gap-2">
                  <MapPin size={14} className="text-[#306D29]" />
                  <span>Select Delivery Address</span>
                </span>

                {addresses.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5">
                    {addresses.map((addr) => (
                      <label 
                        key={addr.id} 
                        className={`flex gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer border hover:border-[#306D29] transition ${
                          selectedAddressId === addr.id ? "border-[#306D29] bg-emerald-50/10" : "border-gray-200/50"
                        }`}
                      >
                        <input
                          required
                          type="radio"
                          name="selectedAddress"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 text-[#306D29] focus:ring-[#306D29]"
                        />
                        <div className="text-xs leading-relaxed flex-grow">
                          <strong className="text-gray-900 text-sm font-sans flex items-center gap-2">
                            <span>{addr.fullName}</span>
                            {addr.isDefault && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-1.5 py-0.5 rounded tracking-wide font-mono uppercase">
                                Default
                              </span>
                            )}
                          </strong>
                          <p className="text-gray-600 mt-1">{addr.street}</p>
                          <p className="text-gray-500 font-semibold">{addr.city}, {addr.state} - {addr.pinCode}</p>
                          <p className="text-gray-400 font-mono mt-1">Ph: {addr.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#4A6B43] bg-emerald-50 border border-emerald-300/30 p-3 rounded-lg leading-relaxed">
                    No shipping addresses registered. Create a default address profile using the form below to initiate checkout deliveries.
                  </p>
                )}
              </div>

              {/* Add New Address Form Section */}
              <form onSubmit={handleAddNewAddress} className="bg-gray-50 border border-gray-200 p-5 rounded-2xl space-y-3">
                <h4 className="font-bold font-sans text-xs uppercase tracking-wider text-gray-500">Register New Shipping Destination</h4>
                
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <input
                      required
                      type="text"
                      placeholder="Receiver full name"
                      value={shipFullName}
                      onChange={(e) => setShipFullName(e.target.value)}
                      className="w-full bg-white border border-gray-200 py-2.5 px-3 rounded-lg text-xs focus:outline-none focus:border-[#306D29]"
                    />
                  </div>

                  <div>
                    <input
                      required
                      type="tel"
                      placeholder="Destination Phone Number (10 digits)"
                      value={shipPhone}
                      onChange={(e) => setShipPhone(e.target.value)}
                      className="w-full bg-white border border-gray-200 py-2.5 px-3 rounded-lg text-xs focus:outline-none focus:border-[#306D29]"
                    />
                  </div>

                  <div>
                    <input
                      required
                      type="text"
                      placeholder="Street/Apt Address"
                      value={shipStreet}
                      onChange={(e) => setShipStreet(e.target.value)}
                      className="w-full bg-white border border-gray-200 py-2.5 px-3 rounded-lg text-xs focus:outline-none focus:border-[#306D29]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      disabled
                      placeholder="Delhi"
                      className="w-full bg-gray-100 border border-gray-200 py-2.5 px-3 rounded-lg text-xs text-gray-500"
                    />
                    <input
                      required
                      type="text"
                      placeholder="PIN Code (6 digits)"
                      value={shipPinCode}
                      onChange={(e) => setShipPinCode(e.target.value)}
                      className="w-full bg-white border border-gray-200 py-2.5 px-3 rounded-lg text-xs focus:outline-none focus:border-[#306D29]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingAddress}
                  className="w-full py-2.5 bg-[#4A6B43] hover:bg-[#306D29] text-white rounded-lg font-sans font-bold text-xs transition cursor-pointer"
                >
                  {savingAddress ? "Registering Address..." : "Add Delivery Destination"}
                </button>

                {addrError && <p className="text-[11px] text-red-600 font-semibold">{addrError}</p>}
              </form>
            </div>
          )}

          {/* STAGE 3: UPI DYNAMIC PAYMENT */}
          {stage === "payment" && selectedAddrObj && (
            <div className="space-y-6">
              
              {/* Dynamic QR Code Render */}
              <DynamicQR 
                upiId={upiId} 
                amount={activeTotal} 
                orderId={directBuyProduct ? "DIRECT_BUY" : "CART_MUTATION_FLOW"} 
              />

              {/* UPI Verification submission form */}
              <form onSubmit={handlePaymentSubmit} className="bg-[#E7E1B1]/20 border border-[#0d530e]/12 p-5 rounded-2xl space-y-4">
                <h4 className="font-bold font-sans text-xs text-gray-900 border-b border-gray-200 pb-2 mb-2 uppercase tracking-widest font-mono">
                  UPI Transaction Verification Proof
                </h4>

                <div>
                  <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">UPI Transaction ID</label>
                  <input
                    required
                    type="text"
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value)}
                    placeholder="e.g. TXN20261109283401"
                    className="w-full bg-white border border-[#0d530e]/12 p-3 font-mono font-bold rounded-lg text-xs text-[#0D530E] focus:outline-none focus:border-[#306D29]"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block leading-relaxed font-semibold">
                    * Make sure to enter the exact Transaction ID seen in GooglePay, PhonePe, or Paytm.
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">UPI Reference / UTR Number</label>
                  <input
                    required
                    type="text"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    placeholder="e.g. 6140321894"
                    className="w-full bg-white border border-[#0d530e]/12 p-3 font-mono font-bold rounded-lg text-xs text-[#0D530E] focus:outline-none focus:border-[#306D29]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Upload Payment Screenshot</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="w-full text-xs text-gray-500 border border-[#0d530e]/12 p-2.5 rounded-lg bg-white"
                  />
                  {isUploading && <span className="text-[10px] text-[#306D29] font-bold mt-1 block">Encoding screenshot asset...</span>}
                  {screenshotBase64 && (
                    <span className="text-[10px] text-[#306D29] font-bold mt-1 block">✓ Screenshot ready for cloud upload.</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPlacingOrder || isUploading}
                  className="w-full py-3.5 bg-[#306D29] hover:bg-[#0D530E] text-[#FBF5DD] font-sans font-bold text-xs tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader size={14} className="animate-spin" />
                      <span>Placing your order...</span>
                    </>
                  ) : (
                    <span>Submit Proof &amp; Complete Checkout</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STAGE 4: CHECKOUT RECEIPT (CONFIRMATION) */}
          {stage === "receipt" && confirmedOrder && (
            <div className="flex flex-col items-center justify-center text-center gap-6 py-6 animate-scaleUp">
              <CheckCircle size={56} className="text-[#306D29] animate-bounce" />
              
              <div className="space-y-2">
                <span className="text-xs uppercase font-mono tracking-widest text-[#306D29] bg-[#306D29]/5 py-1 px-3 rounded-full font-bold">
                  Payment Verification Pending
                </span>
                <h3 className="text-xl font-sans font-bold text-gray-900 leading-tight">Order Confirmed! Reference ID:</h3>
                <code className="text-sm font-mono text-emerald-800 bg-emerald-50 border border-emerald-300/30 px-3 py-1.5 rounded-md font-bold block select-all">
                  #{confirmedOrder.id}
                </code>
              </div>

              <p className="text-xs text-[#4A6B43] leading-relaxed max-w-sm font-semibold">
                Thanks for your order! Your billing proof (UTR: {confirmedOrder.upiRefNumber}) has been secure logged with our admins. A customer service technician will contact you on <strong className="text-gray-900">{confirmedOrder.billingAddress.phone}</strong> within <strong className="text-gray-900">20 minutes</strong> to dispatch parts or coordinate repair pickups!
              </p>

              <div className="w-full border-t border-gray-200/50 pt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const isAdmin = userProfile?.role === "admin" || 
                                    userProfile?.email?.toLowerCase() === "skbitservice@gmail.com" || 
                                    user?.email?.toLowerCase() === "skbitservice@gmail.com";
                    setView(isAdmin ? "admin-panel" : "user-dashboard");
                    clearDirectBuy();
                    onClose();
                  }}
                  className="w-full py-3 bg-[#306D29] text-white hover:bg-[#0D530E] font-sans font-bold text-xs tracking-wide rounded-lg transition cursor-pointer"
                >
                  Track Order inside Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearDirectBuy();
                    onClose();
                  }}
                  className="w-full py-3 text-[#4A6B43] hover:text-[#0D530E] font-sans font-semibold text-xs transition"
                >
                  Continue Browsing Catalog
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Bar */}
        {stage !== "receipt" && activeItems.length > 0 && (
          <div className="p-5 border-t border-[#0d530e]/12 bg-[#FBF5DD] space-y-4">
            
            {/* Show dynamic price summary in side rail */}
            <div className="flex justify-between items-center text-sm font-bold text-gray-900">
              <span>Invoice Subtotal:</span>
              <span className="text-[#306D29]">₹{activeTotal.toLocaleString("en-IN")}</span>
            </div>

            {stage === "cart" && (
              <button
                type="button"
                onClick={() => handleStageNavigation("shipping")}
                className="w-full py-3.5 bg-[#306D29] text-white font-sans font-extrabold text-xs tracking-wider uppercase rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-[#306D29]/20 hover:bg-[#0D530E] transition cursor-pointer"
              >
                <span>Navigate to Shipping</span>
                <ArrowRight size={14} />
              </button>
            )}

            {stage === "shipping" && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleStageNavigation("cart")}
                  className="py-3 bg-white border border-[#0d530e]/12 text-[#4A6B43] font-sans font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Return to Cart
                </button>
                <button
                  type="button"
                  disabled={!selectedAddressId}
                  onClick={() => handleStageNavigation("payment")}
                  className="py-3 bg-[#E7912E] hover:bg-[#c9741c] text-white font-sans font-extrabold text-xs tracking-wide uppercase rounded-lg transition"
                >
                  Initiate UPI Payment
                </button>
              </div>
            )}

            {stage === "payment" && (
              <button
                type="button"
                onClick={() => handleStageNavigation("shipping")}
                className="w-full py-3 text-center text-xs text-[#306D29] font-bold"
              >
                &larr; Return to Shipping Destinations
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Product, Order, SupportTicket, ContactMessage, OrderStatus, OrderPaymentStatus } from "../types";
import { dbService } from "../services/dbService";
import { isMockFirebase } from "../firebase";
import { 
  Users, Package, TrendingUp, CreditCard, MessageSquare, 
  Settings, CheckCircle, XCircle, Plus, Edit3, Trash2, Mail, Loader, Check, CircleSlash 
} from "lucide-react";

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  
  // Tabs: "overview" | "products" | "orders" | "tickets" | "contacts" | "settings"
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "tickets" | "contacts" | "settings">("overview");

  // Database lists
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [upiId, setUpiId] = useState("skbcomputer86@kotak");
  const [upiQrUrl, setUpiQrUrl] = useState("");
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  // Loading & statuses
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  // Product CRUD states (Modals)
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [pName, setPName] = useState("");
  const [pCategory, setPCategory] = useState<"service" | "accessory">("service");
  const [pPrice, setPPrice] = useState("");
  const [pStock, setPStock] = useState("");
  const [pImages, setPImages] = useState<string[]>([""]);
  const [pDescription, setPDescription] = useState("");
  const [pActive, setPActive] = useState(true);

  // Tickets messaging admin chat states
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  // Sync admin view data lists
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [prodList, ordList, ticketList, contactList, settings] = await Promise.all([
        dbService.getProducts(),
        dbService.getOrders(),
        dbService.getTickets(),
        dbService.getContacts(),
        dbService.getGlobalSettings()
      ]);
      setProducts(prodList);
      setOrders(ordList);
      setTickets(ticketList);
      setContacts(contactList);
      if (settings) {
        if (settings.upiId) setUpiId(settings.upiId);
        if (settings.upiQrUrl) setUpiQrUrl(settings.upiQrUrl);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  // Calculations for Admin Analytics overview stats
  const totalProducts = products.length;
  const totalOrdersCount = orders.length;
  // Estimate unique buyers from orders
  const uniqueUsersCount = Array.from(new Set(orders.map(o => o.userId))).length || 4; // fallback seed user counts
  
  const pendingPaymentsCount = orders.filter(o => o.paymentStatus === "pending").length;
  const pendingOrdersCount = orders.filter(o => o.orderStatus !== "completed" && o.orderStatus !== "cancelled").length;

  // Verified revenue totals sums (in INR)
  const totalRevenue = orders
    .filter(o => o.paymentStatus === "verified")
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  // Handle setting active Payee UPI
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId) return;

    try {
      await dbService.updateGlobalSettings(upiId, upiQrUrl);
      setActionMsg("Default UPI payee ID and static QR code updated successfully!");
      setTimeout(() => setActionMsg(""), 3000);
    } catch (err) {
      alert("Failed to store UPI settings.");
    }
  };

  // Convert uploaded QR image to Base64 to save directly into system settings
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.2 * 1024 * 1024) {
      alert("QR Code Image must be under 1.2MB for cloud network delivery optimization.");
      return;
    }

    setIsUploadingQr(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUpiQrUrl(reader.result as string);
      setIsUploadingQr(false);
    };
    reader.readAsDataURL(file);
  };

  // Create or Update Product
  const handleProductSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pPrice) return;

    try {
      const validImages = pImages.filter(img => img.trim() !== "");
      const payload: Partial<Product> = {
        name: pName,
        category: pCategory,
        price: parseFloat(pPrice) || 0,
        stock: pCategory === "accessory" ? parseInt(pStock) || 0 : 999,
        image_url: validImages[0] || "",
        image_urls: validImages,
        description: pDescription,
        active: pActive
      };

      if (editingProductId) {
        payload.id = editingProductId;
      }

      await dbService.saveProduct(payload);
      setActionMsg(`Product "${payload.name}" was successfully uploaded and refreshed in the catalog inventory!`);
      setTimeout(() => setActionMsg(""), 4500);

      setShowProductModal(false);
      // Reset
      setPName("");
      setPPrice("");
      setPStock("");
      setPImages([""]);
      setPDescription("");
      setPActive(true);
      setEditingProductId(null);
      // Reload
      await loadAdminData();
    } catch (err) {
      alert("Failed to write product.");
    }
  };

  const handleEditProductClick = (p: Product) => {
    setEditingProductId(p.id || null);
    setPName(p.name);
    setPCategory(p.category);
    setPPrice(p.price.toString());
    setPStock(p.stock.toString());
    if (p.image_urls && p.image_urls.length > 0) {
      setPImages(p.image_urls);
    } else {
      setPImages(p.image_url ? [p.image_url] : [""]);
    }
    setPDescription(p.description);
    setPActive(p.active);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing from catalog?")) return;
    try {
      await dbService.deleteProduct(id);
      setActionMsg("Product listing was successfully removed from catalog inventory.");
      setTimeout(() => setActionMsg(""), 4500);
      loadAdminData();
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  // Verify, Approve, or Reject Orders Payments
  const handleUpdatePaymentStatus = async (orderId: string, status: OrderPaymentStatus) => {
    try {
      let resolvedOrderStatus: OrderStatus = "placed";
      if (status === "verified") {
        resolvedOrderStatus = "processing";
      }
      await dbService.updateOrder(orderId, { 
        paymentStatus: status,
        orderStatus: resolvedOrderStatus
      });
      setActionMsg(`Order order-payment status successfully changed to ${status}!`);
      setTimeout(() => setActionMsg(""), 3000);
      loadAdminData();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await dbService.updateOrder(orderId, { orderStatus: status });
      setActionMsg(`Order milestone status successfully changed to ${status}!`);
      setTimeout(() => setActionMsg(""), 3000);
      loadAdminData();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  // Submit Admin ticket responses
  const handleAdminTicketReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !adminReply.trim()) return;

    setIsReplying(true);
    try {
      const activeTicket = tickets.find(t => t.id === selectedTicketId);
      if (activeTicket) {
        const nextMessages = [
          ...activeTicket.messages,
          {
            sender: "admin" as const,
            senderEmail: user?.email || "skbitservice@gmail.com",
            message: adminReply.trim(),
            timestamp: new Date().toISOString()
          }
        ];
        await dbService.updateTicket(selectedTicketId, {
          messages: nextMessages,
          status: "open", // Keep it open
          updatedAt: new Date().toISOString()
        });
        setAdminReply("");
        // Reload
        const nextTickets = await dbService.getTickets();
        setTickets(nextTickets);
      }
    } catch (err) {
      alert("Failed to reply.");
    } finally {
      setIsReplying(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      await dbService.updateTicket(ticketId, { status: "closed" });
      const nextTickets = await dbService.getTickets();
      setTickets(nextTickets);
    } catch (err) {
      alert("Failed to close ticket.");
    }
  };

  return (
    <div className="animate-fadeIn max-w-[1160px] mx-auto px-6 py-12 text-[#0D530E] grid grid-cols-1 md:grid-cols-4 gap-8">
      
      {/* 1. Left Nav Tabs Panel */}
      <div className="md:col-span-1 bg-[#E7E1B1]/30 p-5 rounded-2xl border border-[#0d530e]/10 h-fit space-y-4 font-sans select-none">
        <div className="border-b border-[#0d530e]/10 pb-4 text-center md:text-left">
          <span className="font-mono text-[9px] uppercase tracking-wider text-gray-500 font-bold">Admin workstation</span>
          <h2 className="text-[#0D530E] font-bold text-sm tracking-wide mt-1">SKB Control Panel</h2>
          {(() => {
            const isSimulated = isMockFirebase || localStorage.getItem("skb_use_simulated_db") === "true";
            return (
              <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border tracking-wide leading-none ${
                isSimulated 
                  ? "bg-amber-100 text-amber-800 border-amber-300" 
                  : "bg-emerald-100 text-emerald-800 border-emerald-300"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSimulated ? "bg-amber-600 animate-pulse" : "bg-emerald-600"}`} />
                {isSimulated ? "⚡ Interactive Sandbox Only" : "🛡️ Live Cloud Firestore"}
              </div>
            );
          })()}
        </div>

        <div className="flex flex-row md:flex-col gap-2 font-sans font-bold text-xs overflow-x-auto pb-2 md:pb-0 scrollbar-none w-full">
          {[
            { id: "overview", label: "Stats & Analytics", icon: <TrendingUp size={14} /> },
            { id: "orders", label: "Orders & Payments", icon: <CreditCard size={14} /> },
            { id: "products", label: "Product Inventory", icon: <Package size={14} /> },
            { id: "tickets", label: "Support Tickets", icon: <MessageSquare size={14} /> },
            { id: "contacts", label: "Contact Requests", icon: <Mail size={14} /> },
            { id: "settings", label: "Website Settings", icon: <Settings size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSelectedTicketId(null);
              }}
              className={`py-3 px-4 rounded-xl flex items-center gap-2 transition text-left cursor-pointer border shrink-0 md:w-full ${
                activeTab === tab.id
                  ? "bg-[#306D29] border-[#306D29] text-white shadow shadow-[#306D29]/20"
                  : "border-transparent text-[#4A6B43] hover:text-[#0D530E] hover:bg-[#E7E1B1]/10"
              }`}
            >
              {tab.icon}
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Right Main Operations Panel */}
      <div className="md:col-span-3 space-y-6">
        
        {actionMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-xs font-semibold px-4 py-3 rounded-lg leading-relaxed animate-pulse">
            {actionMsg}
          </div>
        )}

        {loading ? (
          <div className="min-h-[300px] flex flex-col justify-center items-center gap-3">
            <Loader size={32} className="animate-spin text-[#306D29]" />
            <span className="text-xs font-mono font-bold text-[#4A6B43]">Retrieving Store Cloud Lists...</span>
          </div>
        ) : (
          <>
            
            {/* OVERVIEW / STATS TAB */}
            {activeTab === "overview" && (
              <div className="space-y-8 select-none">
                <div className="border-b border-gray-150 pb-3 flex justify-between items-center">
                  <h2 className="text-2xl font-sans font-bold text-gray-900">Analytics overview</h2>
                  <span className="text-xs text-gray-500 font-mono tracking-wide px-3 py-1 bg-gray-50 uppercase rounded-full border">
                    India staging metrics
                  </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200/50 shadow-sm flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Verified Revenue</span>
                    <span className="text-2xl font-mono text-gray-900 font-extrabold text-[#306D29]">₹{totalRevenue.toLocaleString("en-IN")}</span>
                    <span className="text-[9px] text-[#4A6B43] font-semibold mt-1">Sum of verified receipts</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200/50 shadow-sm flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Orders</span>
                    <span className="text-2xl font-mono text-gray-900 font-extrabold">{totalOrdersCount}</span>
                    <span className="text-[9px] text-[#4A6B43] font-semibold mt-1">Pending payments: {pendingPaymentsCount}</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200/50 shadow-sm flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sourced Products</span>
                    <span className="text-2xl font-mono text-gray-900 font-extrabold">{totalProducts}</span>
                    <span className="text-[9px] text-[#4A6B43] font-semibold mt-1">Repair catalogues &amp; parts</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200/50 shadow-sm flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Unique Buyers</span>
                    <span className="text-2xl font-mono text-gray-900 font-extrabold">{uniqueUsersCount}</span>
                    <span className="text-[9px] text-[#4A6B43] font-semibold mt-1">Active customer bases</span>
                  </div>
                </div>

                {/* Staging warning alert banner */}
                <div className="bg-amber-50 border border-amber-300/50 rounded-2xl p-5 text-amber-800 leading-relaxed text-xs">
                  <strong className="block text-sm mb-1 font-bold">Technician Notification Center</strong>
                  UPI receipts with pending statuses should be reconciled within 20 minutes of transaction receipt submissions to coordinate part dispatch workflows immediately. Update order milestones via the Payments subtab below!
                </div>
              </div>
            )}

            {/* ORDERS & PAYMENTS TAB */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <div className="border-b border-gray-150 pb-3">
                  <h2 className="text-2xl font-sans font-bold text-gray-900">Manage Orders &amp; UPI Payments</h2>
                  <p className="text-xs text-[#4A6B43] font-semibold uppercase tracking-wider mt-1 font-mono">Approve customer transaction references &amp; screenshot sheets</p>
                </div>

                {orders.length > 0 ? (
                  <div className="space-y-4 font-sans">
                    {orders.map((ord) => (
                      <div key={ord.id} className="bg-white border border-[#0d530e]/12 p-6 rounded-2xl flex flex-col gap-4 shadow-sm hover:border-[#306D29] transition-all">
                        
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-150 pb-3">
                          <div>
                            <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase block font-bold">Order ID</span>
                            <code className="text-sm font-semibold font-mono text-gray-900">#{ord.id}</code>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Payment approvals trigger selects */}
                            <select
                              value={ord.paymentStatus}
                              onChange={(e) => handleUpdatePaymentStatus(ord.id!, e.target.value as OrderPaymentStatus)}
                              className="bg-gray-50 border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-mono font-bold focus:outline-none"
                            >
                              <option value="pending">Payment: PENDING</option>
                              <option value="verified">Payment: VERIFIED &amp; APPROVED</option>
                              <option value="rejected">Payment: REJECTED</option>
                            </select>

                            {/* Order general process selects */}
                            <select
                              value={ord.orderStatus}
                              onChange={(e) => handleUpdateOrderStatus(ord.id!, e.target.value as OrderStatus)}
                              className="bg-gray-50 border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-mono font-bold focus:outline-none"
                            >
                              <option value="placed">Status: Placed</option>
                              <option value="processing">Status: Processing</option>
                              <option value="shipped">Status: Shipped</option>
                              <option value="completed">Status: Completed</option>
                              <option value="cancelled">Status: Cancelled</option>
                            </select>
                          </div>
                        </div>

                        {/* Customer billing address & Transaction reference metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                          <div className="md:col-span-2 space-y-1.5 text-xs text-gray-600 leading-relaxed">
                            <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Billing &amp; Delivery Destination</span>
                            <p className="font-bold text-gray-900 text-sm mt-1">{ord.billingAddress.fullName}</p>
                            <p>{ord.billingAddress.street}</p>
                            <p className="font-semibold text-gray-500">{ord.billingAddress.city}, {ord.billingAddress.state} - {ord.billingAddress.pinCode}</p>
                            <p className="font-mono text-[11px] font-bold text-[#306D29]">Contact Call: {ord.billingAddress.phone}</p>
                          </div>

                          <div className="md:col-span-2 space-y-1.5 text-xs">
                            <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Reference Details</span>
                            <p>Transaction ID: <code className="font-bold font-mono text-[#0D530E]">{ord.transactionId || "—"}</code></p>
                            <p>UTR Reference Number: <code className="font-bold font-mono text-[#0D530E]">{ord.upiRefNumber || "—"}</code></p>
                            <p className="font-semibold text-gray-700">Account: <span className="underline">{ord.userEmail}</span></p>
                          </div>

                          <div className="md:col-span-1 flex flex-col select-none">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono block">Order value</span>
                            <span className="text-base font-mono text-gray-900 font-bold mt-1">₹{ord.totalAmount.toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        {/* Items ordered lists */}
                        <div className="border-t border-gray-150/50 pt-3 flex flex-wrap gap-2">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono w-full">Line items</span>
                          {ord.items.map((line, idx) => (
                            <div key={idx} className="bg-gray-50 border border-gray-150 rounded-lg p-2.5 text-xs leading-none flex gap-6 items-center">
                              <span><strong>{line.name}</strong> × {line.quantity}</span>
                              <span className="font-mono text-gray-400">₹{line.price * line.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {/* If screenshot exists, display preview trigger */}
                        {ord.screenshotUrl && ord.screenshotUrl !== "simulated_upload_placeholder_id" && (
                          <div className="border-t border-gray-150/50 pt-3 space-y-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono block">Uploaded Proof Screenshot:</span>
                            <div className="bg-gray-100 p-2.5 rounded-lg border border-dashed border-gray-300">
                              <img 
                                src={ord.screenshotUrl} 
                                alt="Payment Screenshot Check" 
                                className="max-h-36 object-contain rounded border pointer-events-auto"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-3 border-t border-gray-150/50 text-[10px] font-mono text-gray-400">
                          <span>Received timestamp: {new Date(ord.createdAt).toLocaleString("en-IN")}</span>
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="min-h-[220px] bg-white border border-[#0d530e]/10 rounded-2xl flex flex-col justify-center items-center text-center p-8 gap-3">
                    <span className="text-xs font-mono font-bold text-gray-400 uppercase">No orders registered</span>
                    <p className="text-xs text-[#4A6B43]">
                      No orders or transactions have been completed yet on this staging block.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* PRODUCTS CRUD TAB */}
            {activeTab === "products" && (
              <div className="space-y-6">
                
                {/* Header panel */}
                <div className="flex justify-between items-center border-b border-gray-150 pb-3">
                  <div>
                    <h2 className="text-2xl font-sans font-bold text-gray-900">Manage Store catalog</h2>
                    <p className="text-xs text-[#4A6B43] mt-1 font-semibold uppercase tracking-wider font-mono">Create, Edit, or delete repair products &amp; computer accessories</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProductId(null);
                      setPName("");
                      setPCategory("service");
                      setPPrice("");
                      setPStock("");
                      setPImages([""]);
                      setPDescription("");
                      setPActive(true);
                      setShowProductModal(true);
                    }}
                    className="bg-[#306D29] text-white hover:bg-[#0D530E] text-xs font-sans font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow"
                  >
                    <Plus size={14} />
                    <span>Add Product</span>
                  </button>
                </div>

                {/* Product Form modal sheet */}
                {showProductModal && (
                  <form onSubmit={handleProductSave} className="bg-white border border-[#0d530e]/12 p-6 rounded-2xl space-y-4 animate-scaleUp">
                    <h3 className="font-sans font-bold text-sm">{editingProductId ? "Modify Listing Details" : "Register New catalog Product"}</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Product Name</label>
                        <input
                          required
                          type="text"
                          value={pName}
                          onChange={(e) => setPName(e.target.value)}
                          placeholder="e.g. Dell Latitude Battery Swap"
                          className="w-full bg-white border border-[#0d530e]/12 p-3 font-sans font-semibold rounded-lg text-xs text-[#0D530E] focus:outline-none focus:border-[#306D29]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Category</label>
                        <select
                          value={pCategory}
                          onChange={(e) => setPCategory(e.target.value as any)}
                          className="w-full bg-white border border-[#0d530e]/12 p-3 font-sans font-semibold rounded-lg text-xs text-[#0D530E] focus:outline-none focus:border-[#306D29]"
                        >
                          <option value="service">Service (Starting price ranges)</option>
                          <option value="accessory">Accessory (Strict inventories)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Pricing (₹ INR)</label>
                        <input
                          required
                          type="number"
                          value={pPrice}
                          onChange={(e) => setPPrice(e.target.value)}
                          placeholder="e.g. 1899"
                          className="w-full bg-white border border-[#0d530e]/12 p-3 font-mono font-bold rounded-lg text-xs text-[#0D530E] focus:outline-none focus:border-[#306D29]"
                        />
                      </div>

                      {pCategory === "accessory" && (
                        <div>
                          <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Stock Quantity</label>
                          <input
                            required
                            type="number"
                            value={pStock}
                            onChange={(e) => setPStock(e.target.value)}
                            placeholder="e.g. 25"
                            className="w-full bg-white border border-[#0d530e]/12 p-3 font-mono font-bold rounded-lg text-xs text-[#0D530E] focus:outline-none focus:border-[#306D29]"
                          />
                        </div>
                      )}

                      <div className="sm:col-span-2 space-y-2">
                        <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1">Product Images (URLs)</label>
                        <div className="space-y-2">
                          {pImages.map((img, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={img}
                                onChange={(e) => {
                                  const next = [...pImages];
                                  next[idx] = e.target.value;
                                  setPImages(next);
                                }}
                                placeholder={`Image URL #${idx + 1} (e.g. https://images.unsplash.com/...)`}
                                className="flex-grow bg-white border border-[#0d530e]/12 p-3 text-xs rounded-lg focus:outline-none focus:border-[#306D29] font-medium"
                              />
                              {pImages.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = pImages.filter((_, i) => i !== idx);
                                    setPImages(next);
                                  }}
                                  className="text-red-500 hover:text-red-700 font-sans font-extrabold px-3 py-2.5 border border-red-200 hover:bg-red-50 rounded-lg text-xs cursor-pointer transition"
                                  title="Remove Image"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setPImages([...pImages, ""])}
                          className="py-1.5 px-3 bg-[#4a6b43]/10 hover:bg-[#4a6b43]/20 text-[#306D29] text-[11px] font-bold font-sans rounded-lg transition cursor-pointer"
                        >
                          + Add Another Image URL
                        </button>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Informational Description</label>
                        <textarea
                          required
                          rows={3}
                          value={pDescription}
                          onChange={(e) => setPDescription(e.target.value)}
                          placeholder="Provide details about speedups, compatibility bounds etc."
                          className="w-full bg-white border border-[#0d530e]/12 p-3 text-xs rounded-lg focus:outline-none focus:border-[#306D29] font-medium"
                        />
                      </div>

                      <div className="flex items-center gap-2.5">
                        <input 
                          type="checkbox" 
                          checked={pActive}
                          onChange={(e) => setPActive(e.target.checked)}
                          className="h-4 w-4 text-[#306D29] focus:ring-[#306D29]"
                        />
                        <span className="text-xs text-[#4A6B43] font-semibold">Active catalog visibility</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowProductModal(false)}
                        className="bg-white border border-[#0d530e]/12 py-2.5 px-4 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="py-2.5 px-6 bg-[#306D29] hover:bg-[#0D530E] text-[#FBF5DD] rounded-lg text-xs font-bold cursor-pointer transition animate-scaleUp"
                      >
                        {editingProductId ? "Save Modifications" : "Add Product"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Sublist mapping */}
                {!showProductModal && (
                  <div className="grid grid-cols-1 gap-2.5 font-sans">
                    {products.map((p) => (
                      <div key={p.id} className="bg-white border border-[#0d530e]/12 p-4 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="flex flex-col gap-1 overflow-hidden">
                          <strong className="text-sm font-sans text-gray-900 group-hover:text-[#306D29] transition truncate max-w-sm">
                            {p.name}
                          </strong>
                          <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
                            <span className="font-bold text-[#E7912E]">₹{p.price.toLocaleString("en-IN")}</span>
                            <span>Stock: {p.category === "service" ? "Available" : p.stock}</span>
                            <span>Status: {p.active ? "Active" : "Inactive"}</span>
                          </div>
                        </div>

                        {/* Change product trigger edits */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleEditProductClick(p)}
                            className="bg-white border border-gray-200 text-[#0d530e] hover:border-[#306D29] hover:text-[#306D29] p-2 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id!)}
                            className="bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-600 p-2 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* SUPPORT CHAT TAB (Multi-user) */}
            {activeTab === "tickets" && (
              <div className="space-y-6">
                
                <div className="border-b border-gray-150 pb-3">
                  <h2 className="text-2xl font-sans font-bold text-gray-900">Support Chat &amp; Ticket Center</h2>
                  <p className="text-xs text-[#4A6B43] mt-1 font-semibold uppercase tracking-wider font-mono">Reply to queries and update warranty issues</p>
                </div>

                {/* Ticket messaging view */}
                {selectedTicketId ? (
                  <div className="bg-white border border-[#0d530e]/12 rounded-2xl overflow-hidden flex flex-col justify-between h-[450px] animate-scaleUp">
                    
                    <div className="p-4 border-b border-gray-150 bg-[#FBF5DD] text-[#0D530E] flex justify-between items-center select-none font-sans">
                      <div>
                        <span className="text-[10px] font-mono tracking-widest block uppercase text-gray-500 font-bold">Client: {tickets.find(t => t.id === selectedTicketId)?.userEmail}</span>
                        <h4 className="font-bold text-sm truncate max-w-sm">
                          {tickets.find(t => t.id === selectedTicketId)?.subject}
                        </h4>
                      </div>
                      
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => handleCloseTicket(selectedTicketId)}
                          className="text-xs text-red-600 font-semibold flex items-center gap-1 hover:underline"
                        >
                          <CircleSlash size={12} />
                          <span>Close Ticket</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTicketId(null)}
                          className="text-xs text-[#306D29] font-bold hover:underline"
                        >
                          Back to all tickets
                        </button>
                      </div>
                    </div>

                    <div className="flex-grow p-5 space-y-4 overflow-y-auto bg-gray-50 flex flex-col">
                      {tickets.find(t => t.id === selectedTicketId)?.messages.map((chat, cIdx) => (
                        <div 
                          key={cIdx} 
                          className={`flex flex-col max-w-xs sm:max-w-sm rounded-xl p-3 ${
                            chat.sender === "admin"
                              ? "bg-[#306D29] text-white self-end rounded-tr-none shadow"
                              : "bg-white border border-[#0d530e]/12 text-[#0D530E] self-start rounded-tl-none shadow-sm"
                          }`}
                        >
                          <span className="text-[9px] uppercase tracking-wider font-bold mb-1 opacity-70 block font-mono">
                            {chat.sender === "admin" ? "You (Admin)" : chat.senderEmail}
                          </span>
                          <span className="text-xs sm:text-sm font-sans leading-relaxed">{chat.message}</span>
                          <span className="text-[8px] text-right mt-1.5 block opacity-50 font-mono">
                            {new Date(chat.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAdminTicketReplySubmit} className="p-3 bg-white border-t border-gray-150 flex gap-2">
                      <input 
                        type="text" 
                        value={adminReply}
                        onChange={(e) => setAdminReply(e.target.value)}
                        placeholder="Type reply message and press enter..."
                        className="flex-grow px-3.5 py-2.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#306D29]"
                      />
                      <button
                        type="submit"
                        disabled={isReplying || !adminReply.trim()}
                        className="bg-[#306D29] text-white py-2.5 px-4 rounded-lg hover:bg-[#0D530E] transition shrink-0 cursor-pointer text-xs font-bold disabled:opacity-50"
                      >
                        Reply
                      </button>
                    </form>

                  </div>
                ) : (
                  <div className="space-y-3 font-sans">
                    {tickets.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2.5">
                        {tickets.map((t) => (
                          <div 
                            key={t.id}
                            onClick={() => setSelectedTicketId(t.id || null)}
                            className="bg-white border border-[#0d530e]/12 p-4 rounded-xl flex items-center justify-between shadow-sm cursor-pointer hover:border-[#306D29] hover:bg-emerald-50/5 transition duration-200"
                          >
                            <div className="flex flex-col gap-1 overflow-hidden">
                              <span className="block text-[9px] font-mono font-bold tracking-widest uppercase text-gray-400">Owner: {t.userEmail}</span>
                              <strong className="text-sm font-sans text-gray-900 truncate max-w-sm">
                                {t.subject}
                              </strong>
                              <span className="text-xs text-gray-500 truncate max-w-md">
                                {t.message}
                              </span>
                            </div>

                            <span className={`text-[9px] font-mono uppercase tracking-wider font-bold py-1 px-3 rounded-full ${
                              t.status === "open" ? "bg-amber-100 text-amber-800" : "bg-gray-150 text-gray-700"
                            }`}>
                              {t.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="min-h-[220px] bg-white border border-[#0d530e]/10 rounded-2xl flex flex-col justify-center items-center text-center p-8 gap-3">
                        <span className="text-xs font-mono font-bold text-gray-400 uppercase">No customer support tickets registered</span>
                        <p className="text-xs text-[#4A6B43]">All client registries are clean or closed.</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* CONTACT REQUESTS TAB */}
            {activeTab === "contacts" && (
              <div className="space-y-6">
                
                <div className="border-b border-gray-150 pb-3 select-none">
                  <h2 className="text-2xl font-sans font-bold text-gray-900">Lead Contact Inquiries</h2>
                  <p className="text-xs text-[#4A6B43] mt-1 font-semibold uppercase tracking-wider font-mono">Inbound repair requests submitted from the landing contact form sheet</p>
                </div>

                {contacts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5 font-sans">
                    {contacts.map((c) => (
                      <div key={c.id} className="bg-white border border-[#0d530e]/12 p-5 rounded-2xl flex flex-col gap-2">
                        <div className="flex justify-between items-start border-b border-gray-150 pb-2">
                          <div>
                            <strong className="text-gray-900 text-sm block font-sans">{c.name}</strong>
                            <a href={`tel:${c.phone}`} className="font-mono text-xs font-bold text-[#306D29] hover:underline block pt-0.5">Phone Call: {c.phone}</a>
                          </div>
                          <span className="text-[9px] font-mono text-gray-400">Received: {new Date(c.createdAt).toLocaleDateString("en-IN")}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
                          <strong className="text-gray-900">Fault breakdown:</strong> {c.issue}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="min-h-[220px] bg-white border border-[#0d530e]/10 rounded-2xl flex flex-col justify-center items-center text-center p-8 gap-3">
                    <span className="text-xs font-mono font-bold text-gray-400 uppercase">No landing inquiries submitted</span>
                    <p className="text-xs text-[#4A6B43]">Contact logs are empty.</p>
                  </div>
                )}
              </div>
            )}

            {/* WEBSITE SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="border-b border-gray-150 pb-3 select-none">
                  <h2 className="text-2xl font-sans font-bold text-gray-900">Website Customizations &amp; Settings</h2>
                  <p className="text-xs text-[#4A6B43] mt-1 font-semibold uppercase tracking-wider font-mono">Adjust static parameters that appear dynamically during checkout payment QR flows</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                  {/* Settings Form */}
                  <form onSubmit={handleSettingsSubmit} className="bg-white border border-[#0d530e]/12 p-6 sm:p-8 rounded-2xl space-y-5">
                    <div>
                      <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Direct Payee UPI ID Address</label>
                      <input
                        required
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. skbcomputer86@kotak"
                        className="w-full bg-white border border-[#0d530e]/12 p-3 font-mono font-bold rounded-lg text-xs text-[#0D530E] focus:outline-none focus:border-[#306D29]"
                      />
                      <span className="text-[10px] text-gray-500 mt-1.5 block leading-normal font-semibold">
                        * Modifying this UPI ID replaces the target payee inside checkout's generated Dynamic QR codes seamlessly!
                      </span>
                    </div>

                    <div className="border-t border-gray-100 pt-4 space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Custom UPI QR Code (Image URL or Base64)</label>
                        <input
                          type="text"
                          value={upiQrUrl}
                          onChange={(e) => setUpiQrUrl(e.target.value)}
                          placeholder="Paste QR Code online Image link..."
                          className="w-full bg-white border border-[#0d530e]/12 p-3 text-xs rounded-lg focus:outline-none focus:border-[#306D29] font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Or Upload QR Code Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrUpload}
                          className="w-full text-xs text-gray-500 border border-[#0d530e]/12 p-2.5 rounded-lg bg-white"
                        />
                        {isUploadingQr && <span className="text-[10px] text-[#306D29] font-bold mt-1 block">Encoding QR code asset...</span>}
                      </div>

                      {upiQrUrl && (
                        <button
                          type="button"
                          onClick={() => setUpiQrUrl("")}
                          className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline cursor-pointer flex items-center gap-1 font-mono transition"
                        >
                          ✕ Clear Custom UPI QR Code Image
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isUploadingQr}
                      className="w-full py-3 bg-[#306D29] hover:bg-[#0D530E] text-[#FBF5DD] rounded-xl font-bold font-sans text-xs tracking-wider uppercase transition cursor-pointer disabled:opacity-50"
                    >
                      Save Payee Settings
                    </button>
                  </form>

                  {/* Settings Live QR Code Preview Card */}
                  <div className="bg-[#FBF5DD] border border-[#0d530e]/12 p-6 sm:p-8 rounded-2xl flex flex-col justify-between max-w-sm">
                    <div className="space-y-4">
                      <div className="select-none">
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded tracking-widest font-mono uppercase">
                          QR PREVIEW
                        </span>
                        <h4 className="font-bold text-sm text-gray-900 mt-2 font-sans">Payment Checkout QR Code</h4>
                        <p className="text-xs text-gray-500 font-medium">This is how the custom or automatically generated QR code displays to customers during billing checkout.</p>
                      </div>

                      <div className="flex justify-center bg-white p-4 rounded-xl border border-[#0d530e]/8 shadow-inner relative max-w-[240px] mx-auto aspect-square overflow-hidden items-center">
                        {upiQrUrl ? (
                          <img
                            src={upiQrUrl}
                            alt="Custom uploaded UPI QR Code preview"
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          // Live fallback showing the deep link generated QR Code
                          <img
                            src={`https://chart.googleapis.com/chart?chs=220x220&cht=qr&chl=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=SKB_COMPUTER_AND_SERVICE&am=0.00&cu=INR`)}&choe=UTF-8`}
                            alt="Default dynamic UPI QR Code preview"
                            className="w-full h-full object-contain opacity-80"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        
                        {/* Overlay subtle watermark context */}
                        {!upiQrUrl && (
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-0.5 shadow border border-gray-100 flex items-center justify-center w-7 h-7">
                            <div className="w-full h-full bg-[#012B5C] rounded-full flex items-center justify-center">
                              <span className="text-[5px] text-white font-extrabold tracking-tighter">LIVE</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-[10px] text-gray-500 font-semibold border-t border-[#0d530e]/10 pt-4 leading-normal">
                      {upiQrUrl ? (
                        <span className="text-emerald-700 font-bold">✓ Active: Customers see your uploaded QR Code. Ensure valid payee coordinates matches the inputted UPI ID ({upiId}).</span>
                      ) : (
                        <span>✨ Active: Customers see dynamic generation built on-the-fly linking exact checkout bill values directly to payee address ({upiId}).</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </>
        )}

      </div>
    </div>
  );
};

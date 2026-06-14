import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Order, Address, SupportTicket } from "../types";
import { dbService } from "../services/dbService";
import { 
  User, Package, MapPin, MessageSquare, ShieldCheck, 
  FileText, Clock, Plus, Trash2, CheckCircle2, ChevronRight, Send, Loader
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user, userProfile, updateProfile } = useAuth();
  
  // Dashboard Tabs: "profile" | "orders" | "addresses" | "tickets"
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "addresses" | "tickets">("orders");

  // Profile Form state
  const [newName, setNewName] = useState(userProfile?.displayName || "");
  const [newPhone, setNewPhone] = useState(userProfile?.phone || "");
  const [profileMsg, setProfileMsg] = useState("");

  // Orders and Addresses lists
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  
  // Support Tickets lists
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  
  // Ticket Creation States
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketBody, setTicketBody] = useState("");
  
  // Selected active support ticket for messaging
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketReply, setTicketReply] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  // Address creation states
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [fullName, setFullName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("New Delhi");
  const [state, setState] = useState("Delhi");
  const [pinCode, setPinCode] = useState("");
  const [addrError, setAddrError] = useState("");
  const [addrSuccess, setAddrSuccess] = useState("");

  // Invoice view simulator state
  const [simulatedInvoiceOrder, setSimulatedInvoiceOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(true);

  // Sync profile form states when user profile resolves
  useEffect(() => {
    if (userProfile) {
      setNewName(prev => prev || userProfile.displayName || "");
      setNewPhone(prev => prev || userProfile.phone || "");
    }
  }, [userProfile]);

  // Sync data on tab or user update
  useEffect(() => {
    if (!user) return;

    const loadDashData = async () => {
      setLoading(true);
      try {
        const [ordersList, addrList, ticketsList] = await Promise.all([
          dbService.getOrders(user.uid),
          dbService.getAddresses(user.uid),
          dbService.getTickets(user.uid)
        ]);
        setOrders(ordersList);
        setAddresses(addrList);
        setTickets(ticketsList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDashData();
  }, [user, activeTab]);

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg("");
    if (!newName || !newPhone) {
      setProfileMsg("Form details cannot be blank.");
      return;
    }
    if (!/^\d{10}$/.test(newPhone)) {
      setProfileMsg("Contact phone must carry 10 digits.");
      return;
    }

    try {
      await updateProfile({ displayName: newName, phone: newPhone });
      setProfileMsg("Your user metadata profile was updated.");
    } catch (err) {
      setProfileMsg("Error updating profile. Try calling support.");
    }
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!ticketSubject || !ticketBody) return;

    try {
      const payload: Omit<SupportTicket, "id"> = {
        userId: user.uid,
        userEmail: user.email || "guest@gmail.com",
        subject: ticketSubject,
        message: ticketBody,
        status: "open",
        messages: [
          {
            sender: "user",
            senderEmail: user.email || "guest@gmail.com",
            message: ticketBody,
            timestamp: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await dbService.submitTicket(payload);
      setTicketSubject("");
      setTicketBody("");
      setShowAddTicket(false);
      // Reload tickets
      const nextTickets = await dbService.getTickets(user.uid);
      setTickets(nextTickets);
    } catch (err) {
      alert("Failed to register ticket. Call direct engineer hotline.");
    }
  };

  const handleTicketReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicketId || !ticketReply.trim()) return;

    setIsReplying(true);
    try {
      const activeTicket = tickets.find(t => t.id === selectedTicketId);
      if (activeTicket) {
        const nextMessages = [
          ...activeTicket.messages,
          {
            sender: "user" as const,
            senderEmail: user.email || "guest@gmail.com",
            message: ticketReply.trim(),
            timestamp: new Date().toISOString()
          }
        ];
        await dbService.updateTicket(selectedTicketId, {
          messages: nextMessages,
          updatedAt: new Date().toISOString()
        });
        setTicketReply("");
        // Reload
        const nextTickets = await dbService.getTickets(user.uid);
        setTickets(nextTickets);
      }
    } catch (err) {
      alert("Failed to submit reply.");
    } finally {
      setIsReplying(false);
    }
  };

  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAddrError("");

    if (!fullName || !addrPhone || !street || !city || !state || !pinCode) {
      setAddrError("All fields are mandatory.");
      return;
    }
    if (!/^\d{10}$/.test(addrPhone)) {
      setAddrError("Receiver phone must contain 10 digits.");
      return;
    }
    if (!/^\d{6}$/.test(pinCode)) {
      setAddrError("PIN coordinates must carry 6 digits.");
      return;
    }

    try {
      await dbService.saveAddress(user.uid, {
        fullName,
        phone: addrPhone,
        street,
        city,
        state,
        pinCode,
        isDefault: addresses.length === 0
      });
      setAddrSuccess("Address saved successfully!");
      setTimeout(() => setAddrSuccess(""), 4500);
      // Clear inputs & reload
      setFullName("");
      setAddrPhone("");
      setStreet("");
      setPinCode("");
      setShowAddAddr(false);
      const list = await dbService.getAddresses(user.uid);
      setAddresses(list);
    } catch (err) {
      setAddrError("Failed to store address.");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await dbService.deleteAddress(user.uid, id);
      setAddrSuccess("Address successfully deleted!");
      setTimeout(() => setAddrSuccess(""), 4500);
      const list = await dbService.getAddresses(user.uid);
      setAddresses(list);
    } catch (err) {
      setAddrError("Failed to delete address.");
    }
  };

  const handleToggleDefaultAddress = async (id: string) => {
    if (!user) return;
    try {
      await dbService.setDefaultAddress(user.uid, id);
      setAddrSuccess("Default shipping address updated successfully!");
      setTimeout(() => setAddrSuccess(""), 4500);
      const list = await dbService.getAddresses(user.uid);
      setAddresses(list);
    } catch (err) {
      setAddrError("Failed to make default.");
    }
  };

  return (
    <div className="animate-fadeIn max-w-[1160px] mx-auto px-6 py-12 text-[#0D530E] grid grid-cols-1 md:grid-cols-4 gap-8">
      
      {/* 1. Left Nav list panels */}
      <div className="md:col-span-1 bg-[#E7E1B1]/30 p-5 rounded-2xl border border-[#0d530e]/10 h-fit space-y-4 font-sans select-none">
        
        {/* Welcome Avatar block */}
        <div className="flex items-center gap-3 border-b border-[#0d530e]/10 pb-4">
          <div className="h-10 w-10 bg-[#306D29] text-white flex items-center justify-center font-bold text-sm rounded-full shrink-0 shadow">
            {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-xs uppercase tracking-wider text-gray-500">My Area</span>
            <span className="text-[#0D530E] font-bold text-sm truncate">{userProfile?.displayName || "Guest Customer"}</span>
          </div>
        </div>

        {/* Tab Links */}
        <div className="flex flex-row md:flex-col gap-2 font-sans font-bold text-xs overflow-x-auto pb-2 md:pb-0 scrollbar-none w-full">
          {[
            { id: "orders", label: "Track My Orders", icon: <Package size={14} /> },
            { id: "tickets", label: "Support Tickets", icon: <MessageSquare size={14} /> },
            { id: "addresses", label: "My Addresses", icon: <MapPin size={14} /> },
            { id: "profile", label: "Manage Profile", icon: <User size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSelectedTicketId(null);
                setShowAddTicket(false);
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

      {/* 2. Right Main Tab Content */}
      <div className="md:col-span-3 space-y-6">
        
        {loading ? (
          <div className="min-h-[300px] flex flex-col justify-center items-center gap-3">
            <Loader size={32} className="animate-spin text-[#306D29]" />
            <span className="text-xs font-mono font-bold text-[#4A6B43]">Refreshing Dashboard Assets...</span>
          </div>
        ) : (
          <>
            {/* TBC: TRACK ORDERS TAB */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center select-none border-b border-[#0d530e]/10 pb-3">
                  <h2 className="text-2xl font-sans font-bold text-gray-900 leading-tight">My Purchase Orders</h2>
                  <span className="text-xs font-mono font-bold text-gray-500 tracking-wide bg-gray-50 py-1 px-3 rounded-full uppercase border">
                    Sorted by recency
                  </span>
                </div>

                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((ord) => (
                      <div key={ord.id} className="bg-white border border-[#0d530e]/12 p-6 rounded-2xl flex flex-col gap-4 shadow-sm hover:border-[#306D29] transition-all">
                        
                        {/* Order Header strip */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-150 pb-3">
                          <div>
                            <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase block font-bold">Order Reference ID</span>
                            <code className="text-sm font-semibold font-mono text-[#0D530E]">#{ord.id}</code>
                          </div>
                          <div className="flex items-center gap-2.5">
                            {/* Order milestones */}
                            <span className={`text-[10px] font-mono tracking-wider font-bold py-1 px-3 rounded-full uppercase ${
                              ord.orderStatus === "completed" 
                                ? "bg-emerald-100 text-emerald-800" 
                                : ord.orderStatus === "cancelled" 
                                  ? "bg-red-100 text-[#C0392B]" 
                                  : "bg-blue-100 text-[#0d530e]"
                            }`}>
                              Milestone: {ord.orderStatus}
                            </span>
                            {/* Payment Milestone status */}
                            <span className={`text-[10px] font-mono tracking-wider font-bold py-1 px-3 rounded-full uppercase ${
                              ord.paymentStatus === "verified"
                                ? "bg-emerald-500/10 text-emerald-700"
                                : ord.paymentStatus === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}>
                              Payment: {ord.paymentStatus}
                            </span>
                          </div>
                        </div>

                        {/* Order info details lists */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div className="md:col-span-3 space-y-2">
                            <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Purchased Item Catalogue</span>
                            <div className="space-y-1">
                              {ord.items.map((line, lIdx) => (
                                <p key={lIdx} className="text-xs text-gray-700 font-medium">
                                  <strong>{line.name}</strong> × {line.quantity} <span className="font-mono text-[10px] text-gray-400 block pt-0.5">₹{line.price.toLocaleString("en-IN")} per item</span>
                                </p>
                              ))}
                            </div>
                          </div>

                          <div className="md:col-span-1 flex flex-col font-sans">
                            <span className="text-[10px] text-gray-400 font-mono tracking-wider font-bold uppercase block">Paid Invoice</span>
                            <span className="text-sm font-mono text-gray-900 font-bold mt-1">₹{ord.totalAmount.toLocaleString("en-IN")}</span>
                          </div>

                          {/* Quick details & simulates invoice downloads */}
                          <div className="md:col-span-1 flex justify-end shrink-0 items-center">
                            <button
                              type="button"
                              onClick={() => setSimulatedInvoiceOrder(ord)}
                              className="text-xs font-bold text-[#306D29] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <FileText size={14} />
                              <span>View Invoice</span>
                            </button>
                          </div>
                        </div>

                        {/* Order bottom tracking milestones text representation */}
                        <div className="pt-3 border-t border-gray-150/50 flex flex-wrap gap-4 text-xs font-mono text-gray-500 items-center">
                          <span>UTR: <code className="font-bold text-gray-900">{ord.upiRefNumber || "—"}</code></span>
                          <span>TXN ID: <code className="font-bold text-gray-900">{ord.transactionId || "—"}</code></span>
                          <span className="ml-auto text-[10px] text-gray-400">Checked out: {new Date(ord.createdAt).toLocaleDateString("en-IN")}</span>
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="min-h-[220px] bg-white border border-[#0d530e]/10 rounded-2xl flex flex-col justify-center items-center text-center p-8 gap-3">
                    <span className="text-xs font-mono font-bold text-gray-400 uppercase">No orders registered yet</span>
                    <p className="text-xs text-[#4A6B43] max-w-xs">
                      You haven't initiated invoice purchases. Visit the parts catalogue to select products and trigger checkouts.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TBC: SUPPORT TICKETS TAB */}
            {activeTab === "tickets" && (
              <div className="space-y-6">
                
                {/* Tickets list header */}
                <div className="flex justify-between items-center select-none border-b border-[#0d530e]/10 pb-3">
                  <h2 className="text-2xl font-sans font-bold text-gray-900">Support Ticket Registries</h2>
                  
                  {!showAddTicket && !selectedTicketId && (
                    <button
                      onClick={() => setShowAddTicket(true)}
                      className="bg-[#306D29] text-white hover:bg-[#0D530E] text-xs font-bold font-sans py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition"
                    >
                      <Plus size={14} />
                      <span>Create Ticket</span>
                    </button>
                  )}
                </div>

                {/* Create support ticket screen form */}
                {showAddTicket && (
                  <form onSubmit={handleCreateTicketSubmit} className="bg-white border border-[#0d530e]/12 p-6 rounded-2xl space-y-4 animate-scaleUp">
                    <h3 className="font-bold font-sans text-base">Submit New Support Query</h3>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Ticket Subject</label>
                      <input
                        required
                        type="text"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder="e.g. Broken screen replacement warranty query"
                        className="w-full bg-white border border-[#0d530e]/12 p-3 font-sans font-semibold rounded-lg text-xs text-[#0D530E] focus:outline-none focus:border-[#306D29]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Detailed query text</label>
                      <textarea
                        required
                        rows={4}
                        value={ticketBody}
                        onChange={(e) => setTicketBody(e.target.value)}
                        placeholder="Provide details about your query here so our engineers can assess..."
                        className="w-full bg-white border border-[#0d530e]/12 p-3 font-sans rounded-lg text-xs text-[#0D530E] focus:outline-none focus:border-[#306D29]"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddTicket(false)}
                        className="bg-white border border-[#0d530e]/12 py-2.5 px-4 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="py-2.5 px-6 bg-[#306D29] hover:bg-[#0D530E] text-[#FBF5DD] rounded-lg text-xs font-bold cursor-pointer transition"
                      >
                        Submit Ticket
                      </button>
                    </div>
                  </form>
                )}

                {/* Active Chat Conversation inside Dashboard */}
                {selectedTicketId && (
                  <div className="bg-white border border-[#0d530e]/12 rounded-2xl overflow-hidden flex flex-col justify-between h-[450px] animate-scaleUp">
                    {/* Active Conversation header info */}
                    <div className="p-4 border-b border-gray-150 bg-[#FBF5DD] text-[#0D530E] flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-mono tracking-widest block uppercase text-gray-500 font-bold">In Conversation</span>
                        <h4 className="font-bold text-sm truncate font-sans max-w-sm">
                          {tickets.find(t => t.id === selectedTicketId)?.subject}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedTicketId(null)}
                        className="text-xs text-[#306D29] font-bold hover:underline"
                      >
                        Back to tickets
                      </button>
                    </div>

                    {/* Chat Bubble Scroll list */}
                    <div className="flex-grow p-5 space-y-4 overflow-y-auto bg-gray-50 flex flex-col">
                      {tickets.find(t => t.id === selectedTicketId)?.messages.map((chat, cIdx) => (
                        <div 
                          key={cIdx} 
                          className={`flex flex-col max-w-xs sm:max-w-sm rounded-xl p-3 ${
                            chat.sender === "user"
                              ? "bg-[#306D29] text-white self-end rounded-tr-none shadow"
                              : "bg-white border border-[#0d530e]/12 text-[#0D530E] self-start rounded-tl-none shadow-sm"
                          }`}
                        >
                          <span className="text-[9px] uppercase tracking-wider font-bold mb-1 opacity-70 block font-mono">
                            {chat.sender === "user" ? "You" : "SKB Tech Support"}
                          </span>
                          <span className="text-xs sm:text-sm font-sans leading-relaxed">{chat.message}</span>
                          <span className="text-[8px] text-right mt-1.5 block opacity-50 font-mono">
                            {new Date(chat.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Chat messaging input triggers */}
                    <form onSubmit={handleTicketReplySubmit} className="p-3 bg-white border-t border-gray-150 flex gap-2">
                      <input 
                        type="text" 
                        value={ticketReply}
                        onChange={(e) => setTicketReply(e.target.value)}
                        placeholder="Reply message..."
                        className="flex-grow px-3.5 py-2.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#306D29]"
                      />
                      <button
                        type="submit"
                        disabled={isReplying || !ticketReply.trim()}
                        className="bg-[#306D29] text-white p-2.5 rounded-lg hover:bg-[#0D530E] transition shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        <Send size={16} />
                      </button>
                    </form>
                  </div>
                )}

                {/* Sub-tab lists */}
                {!showAddTicket && !selectedTicketId && (
                  <div className="space-y-3">
                    {tickets.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2.5 font-sans">
                        {tickets.map((t) => (
                          <div 
                            key={t.id}
                            onClick={() => setSelectedTicketId(t.id || null)}
                            className="bg-white border border-[#0d530e]/12 p-4 rounded-xl flex items-center justify-between shadow-sm cursor-pointer hover:border-[#306D29] hover:bg-emerald-50/5 transition duration-200"
                          >
                            <div className="flex flex-col gap-1 overflow-hidden">
                              <span className="block text-[9px] font-mono tracking-widest uppercase font-bold text-gray-400">Ref #{t.id}</span>
                              <strong className="text-sm font-sans text-gray-900 group-hover:text-[#306D29] transition truncate max-w-sm">
                                {t.subject}
                              </strong>
                              <span className="text-xs text-gray-500 truncate max-w-md">
                                {t.message}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`text-[9px] font-mono uppercase tracking-wider font-bold py-1 px-3 rounded-full ${
                                t.status === "open" ? "bg-amber-100 text-amber-800" : "bg-gray-150 text-gray-700"
                              }`}>
                                {t.status}
                              </span>
                              <ChevronRight size={16} className="text-[#4A6B43]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="min-h-[220px] bg-white border border-[#0d530e]/10 rounded-2xl flex flex-col justify-center items-center text-center p-8 gap-3">
                        <span className="text-xs font-mono font-bold text-gray-400 uppercase">No active support tickets</span>
                        <p className="text-xs text-[#4A6B43] max-w-xs">
                          You do not have active query tickets registered. Create queries or message engineers concerning warranties directly.
                        </p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* TBC: SHIPPING ADDRESSES TAB */}
            {activeTab === "addresses" && (
              <div className="space-y-6">
                
                {/* Address block header */}
                <div className="flex justify-between items-center select-none border-b border-[#0d530e]/10 pb-3">
                  <h2 className="text-2xl font-sans font-bold text-gray-900">Manage Shipping Destinations</h2>
                  
                  {!showAddAddr && (
                    <button
                      onClick={() => setShowAddAddr(true)}
                      className="bg-[#306D29] text-white hover:bg-[#0D530E] text-xs font-bold font-sans py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition animate-scaleUp"
                    >
                      <Plus size={14} />
                      <span>Add Address</span>
                    </button>
                  )}
                </div>

                {/* Create Address Profile form sheet */}
                {showAddAddr && (
                  <form onSubmit={handleAddAddressSubmit} className="bg-white border border-[#0d530e]/12 p-6 rounded-2xl space-y-4 animate-scaleUp">
                    <h3 className="font-bold font-sans text-sm">Add New Destination</h3>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Recipient Full Name</label>
                        <input
                          required
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full bg-white border border-[#0d530e]/12 p-3 font-sans font-semibold rounded-lg text-xs text-[#0D530E] focus:outline-none focus:border-[#306D29]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Contact phone (10 digits)</label>
                        <input
                          required
                          type="tel"
                          value={addrPhone}
                          onChange={(e) => setAddrPhone(e.target.value)}
                          placeholder="e.g. 7011396007"
                          className="w-full bg-white border border-[#0d530e]/12 p-3 font-sans font-semibold rounded-lg text-xs text-[#0D530E] focus:outline-none focus:border-[#306D29]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Street Details</label>
                        <input
                          required
                          type="text"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="Flat, Road coordinates, Sector references"
                          className="w-full bg-white border border-[#0d530e]/12 p-3 font-sans font-semibold rounded-lg text-xs text-[#0D530E] focus:outline-none focus:border-[#306D29]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">City State</label>
                          <input
                            type="text"
                            disabled
                            placeholder="New Delhi, Delhi"
                            className="w-full bg-gray-100 border border-gray-200 p-3 rounded-lg text-xs text-gray-500 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">6-Digit Pin Coordinate</label>
                          <input
                            required
                            type="text"
                            value={pinCode}
                            onChange={(e) => setPinCode(e.target.value)}
                            placeholder="e.g. 110041"
                            className="w-full bg-white border border-[#0d530e]/12 p-3 font-sans font-semibold rounded-lg text-xs text-[#0D530E] focus:outline-none focus:border-[#306D29]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddAddr(false)}
                        className="bg-white border border-[#0d530e]/12 py-2.5 px-4 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="py-2.5 px-6 bg-[#306D29] hover:bg-[#0D530E] text-[#FBF5DD] rounded-lg text-xs font-bold cursor-pointer transition"
                      >
                        Save Address
                      </button>
                    </div>

                    {addrSuccess && <p className="text-[11px] text-emerald-700 font-bold">{addrSuccess}</p>}
                    {addrError && <p className="text-[11px] text-red-600 font-semibold">{addrError}</p>}
                  </form>
                )}

                {/* Sublist mapping */}
                {!showAddAddr && (
                  <div className="space-y-4">
                    {addrSuccess && (
                      <div className="bg-emerald-50 border border-emerald-300 text-xs font-semibold px-4 py-3 rounded-lg leading-relaxed animate-pulse">
                        {addrSuccess}
                      </div>
                    )}
                    {addrError && (
                      <div className="bg-red-50 border border-red-300 text-xs font-semibold px-4 py-3 rounded-lg leading-relaxed text-red-600">
                        {addrError}
                      </div>
                    )}
                    {addresses.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {addresses.map((addr) => (
                          <div 
                            key={addr.id} 
                            className="bg-white border border-[#0d530e]/12 p-5 rounded-2xl flex items-center justify-between gap-6"
                          >
                            <div className="text-xs leading-relaxed flex-grow">
                              <span className="font-sans font-bold text-gray-900 text-sm flex items-center gap-2">
                                <span>{addr.fullName}</span>
                                {addr.isDefault && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-1.5 py-0.5 rounded tracking-wide uppercase font-mono">
                                    Default Address
                                  </span>
                                )}
                              </span>
                              <p className="text-gray-600 mt-1">{addr.street}</p>
                              <p className="text-gray-500 font-semibold">{addr.city}, {addr.state} - {addr.pinCode}</p>
                              <p className="text-gray-400 font-mono mt-1">Ph Contact: {addr.phone}</p>
                            </div>

                            {/* Address actions panel */}
                            <div className="flex items-center gap-3 shrink-0">
                              {!addr.isDefault && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleDefaultAddress(addr.id)}
                                  className="text-[10px] font-bold text-[#306D29] hover:underline"
                                >
                                  Set Default
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="text-gray-400 hover:text-red-600 transition"
                                title="Delete address"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="min-h-[220px] bg-white border border-[#0d530e]/10 rounded-2xl flex flex-col justify-center items-center text-center p-8 gap-3">
                        <span className="text-xs font-mono font-bold text-gray-400 uppercase">No Addresses registered</span>
                        <p className="text-xs text-[#4A6B43] max-w-xs">
                          You haven't added addresses under your profile. Register destinations above to accelerate future checkouts.
                        </p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* TBC: MANAGE PROFILE TAB */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="select-none border-b border-[#0d530e]/10 pb-3">
                  <h2 className="text-2xl font-sans font-bold text-gray-900 leading-tight border-b border-gray-150 pb-2 mb-2">My Profile Identity Details</h2>
                  <p className="text-xs text-[#4A6B43] uppercase tracking-wider font-mono">Manage email references and profile metadata</p>
                </div>

                <form onSubmit={handleUpdateProfileSubmit} className="bg-white border border-[#0d530e]/12 p-6 sm:p-8 rounded-2xl space-y-4 max-w-md">
                  <div>
                    <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Registered Email Reference</label>
                    <input
                      type="text"
                      disabled
                      value={user?.email || "guest@gmail.com"}
                      className="w-full bg-gray-100 border border-gray-200 p-3 rounded-lg text-xs text-gray-400 font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Display Name</label>
                    <input
                      required
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Amit Kumar"
                      className="w-full bg-white border border-[#0d530e]/12 p-3 font-sans font-semibold rounded-lg text-xs text-[#0D530E] focus:outline-none focus:border-[#306D29]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Primary Ph Contact</label>
                    <input
                      required
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-white border border-[#0d530e]/12 p-3 font-sans font-semibold rounded-lg text-xs text-[#0D530E] focus:outline-none focus:border-[#306D29]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#306D29] hover:bg-[#0D530E] text-[#FBF5DD] rounded-xl font-bold font-sans text-xs tracking-wider uppercase transition cursor-pointer"
                  >
                    Save Changes
                  </button>

                  {profileMsg && (
                    <p className="text-[11px] text-[#0D530E] font-bold text-center bg-emerald-50 border border-emerald-300 p-2.5 rounded-lg animate-pulse">
                      {profileMsg}
                    </p>
                  )}
                </form>
              </div>
            )}
          </>
        )}

      </div>

      {/* Invoice Download Simulation overlay modal */}
      {simulatedInvoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
          <div className="bg-[#FBF5DD] rounded-2xl max-w-lg w-full p-8 relative border border-[#0d530e]/20 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSimulatedInvoiceOrder(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black font-bold h-8 w-8 hover:bg-emerald-50 rounded-full flex items-center justify-center"
            >
              ✕
            </button>
            
            {/* Invoice Print layout */}
            <div className="space-y-6 text-[#0D530E]">
              <div className="border-b border-gray-200 pb-4 flex justify-between items-end">
                <div>
                  <h3 className="font-sans font-bold text-base select-none text-[#0D530E]">SKB COMPUTER SERVICE</h3>
                  <span className="text-[10px] font-mono text-gray-400 block pt-0.5">Nehru Place &amp; Nangloi, New Delhi</span>
                </div>
                <div className="text-right">
                  <h4 className="font-sans font-extrabold text-xs uppercase tracking-widest text-[#E7912E]">Tax Invoice Receipt</h4>
                  <span className="text-[10px] font-mono block pt-0.5 text-gray-500">Ref: #{simulatedInvoiceOrder.id}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <strong className="block text-gray-400 font-mono text-[9px] uppercase tracking-wider">Client Billing Details</strong>
                  <p className="font-bold pt-0.5 text-sm">{simulatedInvoiceOrder.billingAddress.fullName}</p>
                  <p className="text-gray-500 mt-1">{simulatedInvoiceOrder.billingAddress.street}</p>
                  <p className="text-gray-500">{simulatedInvoiceOrder.billingAddress.city}, {simulatedInvoiceOrder.billingAddress.state} - {simulatedInvoiceOrder.billingAddress.pinCode}</p>
                  <p className="text-gray-400 font-mono mt-1">Ph: {simulatedInvoiceOrder.billingAddress.phone}</p>
                </div>
                <div className="text-right">
                  <strong className="block text-gray-400 font-mono text-[9px] uppercase tracking-wider">Stamp Details</strong>
                  <p className="mt-1 font-semibold text-gray-700">Date: {new Date(simulatedInvoiceOrder.createdAt).toLocaleDateString("en-IN")}</p>
                  <p className="text-gray-600 font-mono mt-1">Payment Method: {simulatedInvoiceOrder.paymentMethod}</p>
                  <p className="text-gray-600 font-mono">Status: {simulatedInvoiceOrder.paymentStatus.toUpperCase()}</p>
                </div>
              </div>

              {/* Items details table */}
              <div className="border-t border-b border-gray-150 py-3 space-y-2">
                <div className="grid grid-cols-5 font-mono text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                  <span className="col-span-3">Item particulars</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Amount (INR)</span>
                </div>
                {simulatedInvoiceOrder.items.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-5 text-xs text-gray-700 leading-normal">
                    <span className="col-span-3 font-semibold text-gray-900">{line.name}</span>
                    <span className="text-center font-bold">{line.quantity}</span>
                    <span className="text-right font-mono font-bold">₹{(line.price * line.quantity).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>

              {/* Grand summary */}
              <div className="flex justify-between items-center text-sm font-bold text-gray-900 mt-2">
                <span>UTR Transaction Reference:</span>
                <span className="font-mono text-emerald-800 break-all select-all">{simulatedInvoiceOrder.upiRefNumber}</span>
              </div>
              
              <div className="flex flex-col gap-1 text-right border-t border-gray-150 pt-3">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Grand Subtotal</span>
                  <span>₹{simulatedInvoiceOrder.totalAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-[#0D530E] font-bold text-base border-t border-[#0d530e]/10 pt-1 mt-1 font-mono">
                  <span>Grand Total Payable</span>
                  <span>₹{simulatedInvoiceOrder.totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-gray-200/50">
                <span className="text-[10px] text-gray-400 font-mono">Thank you for working with SKB Computer. This constitutes a secure staging order record document.</span>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

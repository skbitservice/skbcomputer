import React, { useState } from "react";
import { dbService } from "../services/dbService";
import { CircleCheck, Phone, Mail, MapPin, Send, HelpCircle, FileText, ChevronDown } from "lucide-react";

interface HomeProps {
  setView: (view: string) => void;
}

const ESTIMATE_DATA: Record<string, { label: string; min: number; max: number; note: string }> = {
  screen: { label: "Screen Replacement", min: 2000, max: 6000, note: "Final price depends on screen size, resolution (HD/FHD/Touch) and panel availability." },
  battery: { label: "Battery Replacement", min: 1800, max: 5000, note: "Original batteries carry manufacturer warranties; compatible alternatives cost less." },
  keyboard: { label: "Keyboard Replacement", min: 1200, max: 3500, note: "Backlit keyboards and specific internal rivets involve additional labor." },
  motherboard: { label: "Chip-Level / Motherboard Repair", min: 1500, max: 8000, note: "Fault isolation can take time; complex power-rail rebuilds involve IC parts." },
  data: { label: "Data Recovery", min: 1000, max: 6000, note: "Price matches drive parameters and block recovery efforts on bad sectors." },
  virus: { label: "Software Cleanup / Virus Removal", min: 500, max: 1500, note: "Includes malware sweeps, registry cleaner run, and firewall installation." },
  charging: { label: "Charging Port / Power Jack Repair", min: 800, max: 2500, note: "Precision board re-soldering or replacement of DC-In harness sockets." },
  upgrade: { label: "RAM / SSD Upgrade", min: 1800, max: 6000, note: "SSD upgrades supply extreme bootspeed jumps. Price includes parts." }
};

const DEVICE_MULTIPLIER: Record<string, number> = {
  laptop: 1.0,
  desktop: 0.85,
  macbook: 1.6
};

const BRAND_MULTIPLIER: Record<string, number> = {
  standard: 1.0,
  premium: 1.5
};

export const Home: React.FC<HomeProps> = ({ setView }) => {
  // Estimator States
  const [device, setDevice] = useState("laptop");
  const [issue, setIssue] = useState("screen");
  const [brand, setBrand] = useState("standard");
  const [estimateResult, setEstimateResult] = useState<{ min: number; max: number; label: string; note: string } | null>(null);

  // Contact Form States
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState("");

  // FAQ Accordion Toggles
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({});

  const handleCalculateEstimate = () => {
    const base = ESTIMATE_DATA[issue];
    const devMult = DEVICE_MULTIPLIER[device] || 1;
    const brandMult = BRAND_MULTIPLIER[brand] || 1;

    let minCalculated = Math.round((base.min * devMult * brandMult) / 50) * 50;
    let maxCalculated = Math.round((base.max * devMult * brandMult) / 50) * 50;

    setEstimateResult({
      min: minCalculated,
      max: maxCalculated,
      label: base.label,
      note: base.note
    });
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone || !contactMessage) return;

    setIsSubmitting(true);
    setSubmitFeedback("");

    try {
      await dbService.submitContact({
        name: contactName,
        phone: contactPhone,
        issue: contactMessage,
        createdAt: new Date().toISOString()
      });
      setContactName("");
      setContactPhone("");
      setContactMessage("");
      setSubmitFeedback("Thank you! Your repair inquiry was successfully sent. Our team will contact you within 20 minutes!");
    } catch (err) {
      setSubmitFeedback("Failed to submit message. Please call our direct helpline 7011396007.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="animate-fadeIn font-sans text-[#0D530E]">
      
      {/* 1. HERO SECTION */}
      <section id="home" className="py-16 md:py-24 max-w-[1160px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-6">
          <span className="font-mono text-xs text-[#306D29] bg-[#306D29]/5 py-1 px-3 self-start rounded-full uppercase tracking-wider font-semibold">
            // Nehru Place &amp; Nangloi, New Delhi
          </span>
          <h1 className="text-4xl md:text-5xl font-sans font-bold leading-tight select-none">
            We fix what your laptop can't tell you is wrong.
          </h1>
          <p className="text-[#4A6B43] text-sm md:text-base leading-relaxed">
            SKB Computer diagnoses, repairs, and tunes up laptops &amp; desktops &mdash; screen swaps, motherboard chip-level repair, genuine parts upgrades, data recovery and more. Visit our lab or call for home pickups.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <a 
              href="tel:7011396007" 
              className="bg-[#306D29] text-white py-3.5 px-8 rounded-lg font-sans font-bold text-sm hover:bg-[#0D530E] transition shadow-lg shadow-[#306D29]/20"
            >
              Call 7011396007
            </a>
            <button 
              onClick={() => setView("catalog")}
              className="border border-[#4A6B43] text-[#0D530E] py-3.5 px-8 rounded-lg font-sans font-bold text-sm hover:border-[#306D29] hover:bg-emerald-50/10 transition"
            >
              Order Parts Catalog
            </button>
          </div>

          {/* Counters strip */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[#0d530e]/12 mt-4 text-center sm:text-left">
            <div>
              <strong className="text-2xl md:text-3xl font-sans font-bold text-[#306D29]">10+ Yrs</strong>
              <span className="block text-xs text-[#4A6B43] font-semibold">Reputable Repairs</span>
            </div>
            <div>
              <strong className="text-2xl md:text-3xl font-sans font-bold text-[#306D29]">2 Labs</strong>
              <span className="block text-xs text-[#4A6B43] font-semibold">Service Centres</span>
            </div>
            <div>
              <strong className="text-2xl md:text-3xl font-sans font-bold text-[#306D29]">24h</strong>
              <span className="block text-xs text-[#4A6B43] font-semibold">Avg Turnaround</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Log Panel */}
        <div className="bg-[#0D530E] rounded-xl overflow-hidden border border-[#0d530e]/20 shadow-2xl p-6 font-mono text-xs text-emerald-400 max-w-md mx-auto w-full select-none">
          <div className="flex gap-1.5 mb-4 border-b border-white/5 pb-3">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-2 text-[10px] text-emerald-400/60 font-mono">skb-diagnostics.log</span>
          </div>
          <div className="flex flex-col gap-2 leading-relaxed">
            <p><span className="text-emerald-500">[OK]</span> Core processor pipeline tests passed.</p>
            <p><span className="text-amber-400">[WARN]</span> Device CPU core temperature: 84°C (Dried Pastes)</p>
            <p><span className="text-emerald-500">[OK]</span> RAM module dynamic validation completed.</p>
            <p><span className="text-red-500">[ERR]</span> Hardware Smart HDD bad blocks detected.</p>
            <p className="border-t border-white/5 pt-2 mt-2 font-bold text-white text-xs">Recommended Resolution:</p>
            <p className="text-amber-300">&gt; Refresh copper heatpaste &amp; upgrade to Kingston solid-states.</p>
            <p className="animate-pulse font-bold text-white mt-4">skb-desktop:~$ _</p>
          </div>
        </div>
      </section>

      {/* 2. REPAIR COST ESTIMATOR */}
      <section className="bg-[#E7E1B1]/40 border-y border-[#0d530e]/12 py-16">
        <div className="max-w-[1160px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="font-mono text-xs text-[#306D29] bg-[#306D29]/5 py-1 px-2.5 rounded uppercase tracking-wider font-semibold">
              Instant Estimation
            </span>
            <h2 className="text-3xl font-sans font-extrabold mt-3 mb-6 select-none leading-snug">
              Get an instant repair cost idea
            </h2>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A6B43] uppercase tracking-wider mb-2">Device Form Factor</label>
                <select 
                  value={device} 
                  onChange={(e) => setDevice(e.target.value)}
                  className="w-full bg-[#FBF5DD] border border-[#0d530e]/12 p-3 font-semibold rounded-lg text-sm text-[#0D530E] focus:outline-none focus:border-[#306D29]"
                >
                  <option value="laptop">Standard Laptop</option>
                  <option value="desktop">Desktop / Custom Tower</option>
                  <option value="macbook">Apple MacBook Core / Pro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A6B43] uppercase tracking-wider mb-2">What is the fault?</label>
                <select 
                  value={issue} 
                  onChange={(e) => setIssue(e.target.value)}
                  className="w-full bg-[#FBF5DD] border border-[#0d530e]/12 p-3 font-semibold rounded-lg text-sm text-[#0D530E] focus:outline-none focus:border-[#306D29]"
                >
                  <option value="screen">Cracked / Dead Screen Display</option>
                  <option value="battery">Battery Drainage / No Hold</option>
                  <option value="keyboard">Sticky Keys / Faulty Board</option>
                  <option value="motherboard">No Startup Power (Dead Chip-Level)</option>
                  <option value="data">Formatted / Deleted Data Extraction</option>
                  <option value="virus">Infections, Sluggish OS Boot</option>
                  <option value="charging">Power Connector loose / Broken Charger</option>
                  <option value="upgrade">RAM Expansion or Solid State Speedups</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A6B43] uppercase tracking-wider mb-2">Device tiering</label>
                <select 
                  value={brand} 
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-[#FBF5DD] border border-[#0d530e]/12 p-3 font-semibold rounded-lg text-sm text-[#0D530E] focus:outline-none focus:border-[#306D29]"
                >
                  <option value="standard">Standard (HP, Lenovo, Asus, Acer, Dell)</option>
                  <option value="premium">Premium (Apple, Alienware gaming rigs)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleCalculateEstimate}
                className="w-full py-3.5 bg-[#306D29] hover:bg-[#0D530E] text-[#FBF5DD] font-sans font-bold text-sm tracking-wide rounded-lg transition-all"
              >
                Perform Cost Estimation
              </button>
            </div>
          </div>

          {/* Pricing display wrapper */}
          <div className="bg-[#0D530E] text-white p-8 rounded-2xl flex flex-col justify-center items-center text-center gap-6 min-h-[340px] shadow-xl">
            {estimateResult ? (
              <div className="flex flex-col gap-4 animate-scaleUp">
                <span className="text-xs font-mono uppercase tracking-widest text-[#E7E1B1]/60">Estimated Cost Range</span>
                <span className="text-4xl md:text-5xl font-mono font-bold text-[#FBF5DD]">
                  ₹{estimateResult.min.toLocaleString("en-IN")} - ₹{estimateResult.max.toLocaleString("en-IN")}
                </span>
                <p className="text-sm text-emerald-150 leading-relaxed max-w-sm">
                  {estimateResult.note}
                </p>
                <a 
                  href="#contact-form" 
                  className="bg-[#E7912E] hover:bg-[#c9741c] text-white font-sans font-bold py-3 px-6 text-xs uppercase tracking-wide rounded-lg transition max-w-xs self-center"
                >
                  Book Pickup Now
                </a>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center gap-3">
                <HelpCircle size={44} className="text-[#E7E1B1] opacity-60 animate-bounce" />
                <p className="text-[#E7E1B1] text-sm leading-relaxed max-w-sm mt-2">
                  Select your product configurations and push the estimator button to calculate a pricing bracket. Values adjust to genuine spare markets dynamically.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. CORE ADAPTIVE SERVICES */}
      <section className="py-20 max-w-[1160px] mx-auto px-6">
        <h2 className="text-3xl font-sans font-bold mb-12 select-none border-b border-[#0d530e]/10 pb-4">
          Services We Specialize In
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: "S1", title: "Display Screen Swaps", text: "Replacement of bleeding, vertical lined, flickering, or fully smashed LCD/LED modules." },
            { id: "S2", title: "Micro-soldering Chip Repair", block: "Repositioning IC-bus controllers, short circuit isolations on motherboard capacitor banks." },
            { id: "S3", title: "Instant OS Re-installs", text: "Clean installations of Windows or Mac assemblies with updated drivers and utility packages." },
            { id: "S4", title: "Deep Physical Spa Cycles", block: "Cleaning dust from fans, refreshing dried heatpaste with premium copper options." },
            { id: "S5", title: "Disaster Data Restores", text: "Recovering files from corrupt partitions, formatted storage blocks, and non-mounting media." },
            { id: "S6", title: "AMC Corporate Support", text: "IT hardware management contracts, server diagnostics, and periodic fleet upkeep for offices." }
          ].map((item, index) => (
            <div 
              key={item.id}
              className="bg-[#FBF5DD] border border-[#0d530e]/12 p-6 rounded-xl relative hover:border-[#306D29] hover:-translate-y-1 transition duration-300"
            >
              <span className="font-mono text-[10px] text-[#306D29] border border-[#306D29]/20 px-2.5 py-1 rounded-md mb-4 inline-block font-bold">
                {item.id}
              </span>
              <h3 className="font-sans font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-xs text-[#4A6B43] leading-relaxed">{item.text || item.block}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. MISSION & VISION STATEMENTS */}
      <section className="bg-[#E7E1B1]/40 py-16 border-y border-[#0d530e]/10">
        <div className="max-w-[1160px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#FBF5DD] p-8 rounded-xl border border-[#0d530e]/12">
            <h3 className="text-xl font-bold mb-3">Our Dedicated Mission</h3>
            <p className="text-[#4A6B43] text-sm leading-relaxed">
              We strive to empower IT operations across Delhi NCR by delivering fast, remarkably transparent, and affordable repair services. We treat every client's machinery with identical integrity, safeguarding user files and ensuring long-lasting fixes without exception.
            </p>
          </div>
          <div className="bg-[#FBF5DD] p-8 rounded-xl border border-[#0d530e]/12">
            <h3 className="text-xl font-bold mb-3">Our Ultimate Vision</h3>
            <p className="text-[#4A6B43] text-sm leading-relaxed">
              We envision scaling SKB Computer into Delhi's premier client-centric computer repair brand. By strictly setting high benchmarks on chip-level quality checks and maintaining robust spare parts supplies, we aim to be the most trusted name in independent IT service.
            </p>
          </div>
        </div>
      </section>

      {/* 5. CONTACT FORM & INFO SHEET */}
      <section id="contact-form" className="py-20 max-w-[1160px] mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-12">
        <div className="md:col-span-2 flex flex-col gap-6">
          <span className="font-mono text-xs text-[#306D29]">@ SKB COMPUTER HUB</span>
          <h2 className="text-3xl font-sans font-bold">Get In Touch</h2>
          <p className="text-sm text-[#4A6B43] leading-relaxed">
            Feel free to call our main engineers or send an online message. We provide rapid diagnosis and precise assessments over phone calls or direct drop-offs.
          </p>

          <div className="flex flex-col gap-5 text-sm mt-4">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 flex items-center justify-center bg-[#306D29]/5 rounded-lg text-[#306D29]">
                <Phone size={18} />
              </span>
              <div>
                <span className="block text-[10px] text-gray-400 font-mono font-bold uppercase tracking-widest">Call Helpline</span>
                <a href="tel:7011396007" className="font-mono text-gray-900 font-bold hover:underline">7011396007</a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="h-10 w-10 flex items-center justify-center bg-[#306D29]/5 rounded-lg text-[#306D29]">
                <Mail size={18} />
              </span>
              <div>
                <span className="block text-[10px] text-gray-400 font-mono font-bold uppercase tracking-widest">Email Delivery</span>
                <a href="mailto:skbitservice@gmail.com" className="font-sans font-semibold text-gray-900">skbitservice@gmail.com</a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="h-10 w-10 flex items-center justify-center bg-[#306D29]/5 rounded-lg text-[#306D29]">
                <MapPin size={18} />
              </span>
              <div>
                <span className="block text-[10px] text-gray-400 font-mono font-bold uppercase tracking-widest">Workstations</span>
                <span className="text-gray-900 leading-tight block text-xs">Nehru Place &amp; Nangloi, New Delhi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact form inputs */}
        <form onSubmit={handleContactSubmit} className="md:col-span-3 bg-[#E7E1B1]/30 border border-[#0d530e]/10 p-6 sm:p-8 rounded-2xl flex flex-col gap-4">
          <h3 className="font-sans font-bold text-lg mb-2">Book a Service Request</h3>
          
          <div>
            <label className="block text-xs font-bold text-[#4A6B43] mb-2 uppercase tracking-wide">Your full name</label>
            <input 
              required
              type="text" 
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full bg-white border border-[#0d530e]/12 p-3 rounded-lg text-sm text-[#0D530E] focus:outline-none focus:border-[#306D29] font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A6B43] mb-2 uppercase tracking-wide">Phone number</label>
            <input 
              required
              type="tel" 
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full bg-white border border-[#0d530e]/12 p-3 rounded-lg text-sm text-[#0D530E] focus:outline-none focus:border-[#306D29] font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A6B43] mb-2 uppercase tracking-wide">What is the laptop issue?</label>
            <textarea 
              required
              rows={4}
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Provide make and details: e.g. HP Pavilion no power-up after tea spill."
              className="w-full bg-white border border-[#0d530e]/12 p-3 rounded-lg text-sm text-[#0D530E] focus:outline-none focus:border-[#306D29] font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#306D29] hover:bg-[#0D530E] text-[#FBF5DD] font-sans font-bold text-sm tracking-wide rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Send size={14} />
            <span>{isSubmitting ? "Submitting Inquiry..." : "Submit Message"}</span>
          </button>

          {submitFeedback && (
            <p className="text-xs font-semibold text-[#0D530E] bg-emerald-50 border border-emerald-300/30 p-3 rounded-lg leading-relaxed">
              {submitFeedback}
            </p>
          )}
        </form>
      </section>

      {/* 6. FAQ HELP */}
      <section id="faq" className="bg-[#E7E1B1]/40 border-t border-[#0d530e]/10 py-20">
        <div className="max-w-[760px] mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-sans font-bold text-center mb-10 select-none">
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-4">
            {[
              { q: "How long does a typical repair process take?", a: "Most diagnostic assessments, screen changes, keyboards, and clean installs are completed in 24 to 48 hours. Motherboard micro-soldering tasks can take 2 to 5 working days depending on necessary IC spare arrivals." },
              { q: "Do you supply warranty covers on replacements?", a: "Yes. All replacement screens and genuine accessories carry a complete warranty (up to 3 months relative to specifications). Exact coverage durations are clearly specified on your orders invoice." },
              { q: "Is basic diagnosis free at your service spots?", a: "Walk-in customers receive basic assessment at zero cost. Nominal analysis fees are only assigned for motherboard tracking which are adjusted inside final work billing should you choose to repair with us." },
              { q: "Do you handle pick and drop services?", a: "Yes. Home pickup and drop-offs are available across Delhi NCR locations at nominal travel costs. Please dial 7011396007 directly to program your pickup slot with engineers." }
            ].map((faq, idx) => (
              <div key={idx} className="bg-[#FBF5DD] border border-[#0d530e]/12 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 text-left font-sans font-bold text-[#0D530E] flex items-center justify-between text-sm sm:text-base focus:outline-none hover:text-[#306D29]"
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className={`transform transition-transform duration-300 ${faqOpen[idx] ? "rotate-180" : ""}`} />
                </button>
                {faqOpen[idx] && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#4A6B43] leading-relaxed animate-fadeDown">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. POLICIES OUTLINES */}
      <section id="policy" className="py-20 h-auto max-w-[1160px] mx-auto px-6">
        <h2 className="text-2xl font-sans font-bold mb-8 text-center select-none">Our Repair Policies</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-[#0d530e]/12 p-6 rounded-xl flex flex-col gap-2 bg-[#FBF5DD]/50">
            <h4 className="font-bold font-sans text-[#306D29]">Quote Approvals</h4>
            <p className="text-xs text-[#4A6B43] leading-relaxed">
              No soldering or physical repair operation commences without explicit verbal/electronic diagnostics approval from the owner. Estimates are detailed and carry zero surprise charges.
            </p>
          </div>
          <div className="border border-[#0d530e]/12 p-6 rounded-xl flex flex-col gap-2 bg-[#FBF5DD]/50">
            <h4 className="font-bold font-sans text-[#306D29]">Address Dispatch</h4>
            <p className="text-xs text-[#4A6B43] leading-relaxed">
              Items purchased from our catalog are dispatched to validated regional Delhi shipping addresses with active updates on tracking.
            </p>
          </div>
          <div className="border border-[#0d530e]/12 p-6 rounded-xl flex flex-col gap-2 bg-[#FBF5DD]/50">
            <h4 className="font-bold font-sans text-[#306D29]">Warranty Boundaries</h4>
            <p className="text-xs text-[#4A6B43] leading-relaxed">
              Warranties exclude instances representing physical drop fractures, visible motherboard water corrosion marks, or custom sealing stickers torn after repairs.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { Product } from "../types";
import { dbService } from "../services/dbService";
import { ProductCard } from "../components/ProductCard";
import { Search, Loader } from "lucide-react";

interface CatalogProps {
  onBuyNowDirect: (p: Product) => void;
}

export const Catalog: React.FC<CatalogProps> = ({ onBuyNowDirect }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const data = await dbService.getProducts();
        // Show active listings
        setProducts(data.filter((p) => p.active));
      } catch (err) {
        console.error("Failed to query products database.", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Filter & Search logic
  const filteredProducts = products.filter((p) => {
    const matchesCategory = categoryFilter ? p.category === categoryFilter : true;
    const matchesSearch = searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="animate-fadeIn max-w-[1160px] mx-auto px-6 py-12 text-[#0D530E]">
      <div className="mb-10 text-center sm:text-left">
        <span className="font-mono text-xs text-[#306D29] bg-[#306D29]/5 py-1 px-3 rounded-full uppercase tracking-wider font-semibold select-none">
          // Our Comprehensive Catalogue
        </span>
        <h1 className="text-3xl md:text-4xl font-sans font-bold text-gray-900 mt-3 select-none leading-tight">
          Services, Spares &amp; PC Accessories
        </h1>
        <p className="text-xs sm:text-sm text-[#4A6B43] mt-2 max-w-xl leading-relaxed">
          Search repair service ranges or purchase authentic compatible hardware accessories. Motherboard estimates depend on exact device revisions.
        </p>
      </div>

      {/* Catalog Search & Filtering Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#E7E1B1]/30 border border-[#0d530e]/10 p-4 rounded-2xl mb-8">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto py-1 scrollbar-none shrink-0 font-sans">
          {[
            { label: "All Products", value: "" },
            { label: "Services", value: "service" },
            { label: "Accessories", value: "accessory" },
          ].map((pill) => (
            <button
              key={pill.value}
              onClick={() => setCategoryFilter(pill.value)}
              className={`py-2 px-5 text-xs font-bold rounded-full border transition cursor-pointer select-none whitespace-nowrap ${
                categoryFilter === pill.value
                  ? "bg-[#306D29] border-[#306D29] text-white shadow-md shadow-[#306D29]/25"
                  : "border-[#0d530e]/10 hover:border-[#306D29] bg-white text-[#4A6B43] hover:text-[#0D530E]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search input with search icon */}
        <div className="relative w-full sm:max-w-xs shrink">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items or keywords..."
            className="w-full bg-white border border-[#0d530e]/12 pl-10 pr-4 py-2.5 rounded-xl text-xs text-[#0D530E] focus:outline-none focus:border-[#306D29] font-medium"
          />
          <span className="absolute left-3.5 top-3.5 text-[#4A6B43]">
            <Search size={14} />
          </span>
        </div>
      </div>

      {/* Catalog Grid View */}
      {loading ? (
        <div className="min-h-[280px] flex flex-col justify-center items-center gap-3">
          <Loader className="animate-spin text-[#306D29]" size={28} />
          <span className="text-xs text-[#4A6B43] font-mono tracking-wider font-bold">Querying Catalog Database...</span>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((item) => (
            <ProductCard 
              key={item.id} 
              product={item} 
              onBuyNow={onBuyNowDirect} 
            />
          ))}
        </div>
      ) : (
        <div className="min-h-[220px] bg-white border border-[#0d530e]/10 rounded-2xl flex flex-col justify-center items-center text-center p-8 gap-2">
          <h4 className="font-bold font-sans text-[#0D530E] text-base select-none">No active items located</h4>
          <p className="text-xs text-[#4A6B43] max-w-xs">
            We couldn't source any directory listings conforming to your query. Clear active toggles and retry.
          </p>
        </div>
      )}
    </div>
  );
};

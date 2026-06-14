import React, { useState } from "react";
import { Product } from "../types";
import { useCart } from "../context/CartContext";
import { ShoppingBag, ZoomIn, Check } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onBuyNow: (p: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onBuyNow }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const isService = product.category === "service";
  const outOfStock = !isService && product.stock <= 0;
  const lowStock = !isService && product.stock > 0 && product.stock <= 5;

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Image Gallery fallbacks
  const mainImage = product.image_url || "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&q=80";
  const extraImages = [
    mainImage,
    "https://images.unsplash.com/photo-1601524909162-be87252be298?w=500&q=80",
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80",
  ];

  return (
    <div className="bg-[#FBF5DD] border border-[#0d530e]/12 rounded-xl overflow-hidden flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg hover:border-[#306D29] transition-all group duration-300">
      
      {/* Product Image Section */}
      <div className="relative aspect-video w-full overflow-hidden bg-emerald-950/20 select-none">
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        
        {/* Category Tag */}
        <span className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase font-bold rounded-full ${
          isService ? "bg-[#306D29] text-white" : "bg-[#E7912E] text-white"
        }`}>
          {product.category}
        </span>

        {/* View Details/Gallery Button */}
        <button
          onClick={() => setShowGallery(true)}
          className="absolute right-3 top-3 bg-white/80 backdrop-blur-md p-2 rounded-full text-[#0D530E] opacity-0 group-hover:opacity-100 transition-opacity"
          title="View Image Gallery"
        >
          <ZoomIn size={14} />
        </button>
      </div>

      {/* Product Details */}
      <div className="p-5 flex-grow flex flex-col justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h3 className="font-sans font-bold text-[#0D530E] text-base leading-snug group-hover:text-[#306D29] transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-[#4A6B43] text-xs leading-relaxed line-clamp-3">
            {product.description}
          </p>
        </div>

        {/* Price & Stock info */}
        <div className="w-full flex items-center justify-between border-t border-[#0d530e]/5 pt-3">
          <div className="flex flex-col">
            <span className="text-xs text-[#4A6B43]">
              {isService ? "Starts From" : "Retail Price"}
            </span>
            <span className="text-base font-sans font-bold text-gray-900">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="text-right">
            {isService ? (
              <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Available
              </span>
            ) : outOfStock ? (
              <span className="text-[10px] font-mono font-bold bg-red-100 text-[#C0392B] px-2.5 py-1 rounded-full uppercase tracking-wider">
                Sold Out
              </span>
            ) : lowStock ? (
              <span className="text-[10px] font-mono font-bold bg-amber-100 text-[#A8601B] px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                Only {product.stock} Left
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-[#0D530E] px-2.5 py-1 rounded-full uppercase tracking-wider">
                In Stock
              </span>
            )}
          </div>
        </div>

        {/* Call-to-actions */}
        <div className="grid grid-cols-2 gap-2 pb-1">
          <button
            type="button"
            disabled={outOfStock}
            onClick={handleAddToCart}
            className={`w-full py-2 px-2 rounded-lg font-sans font-bold text-xs border tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              added 
                ? "bg-emerald-600 border-emerald-600 text-white" 
                : "border-[#306D29] text-[#306D29] hover:bg-[#306D29] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {added ? (
              <>
                <Check size={14} />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingBag size={14} />
                <span>Add to Cart</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={outOfStock}
            onClick={() => onBuyNow(product)}
            className="w-full py-2 px-2 bg-[#E7912E] hover:bg-[#c9741c] text-white rounded-lg font-sans font-bold text-xs tracking-wide transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setShowGallery(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black font-bold focus:outline-none"
            >
              ✕
            </button>
            <h4 className="font-bold text-lg mb-4 text-[#0D530E]">{product.name} Photos</h4>
            
            <div className="grid grid-cols-1 gap-4 mb-4 select-none">
              <img src={mainImage} alt={product.name} className="w-full h-48 object-cover rounded-xl" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {extraImages.map((img, i) => (
                <img 
                  key={i} 
                  src={img} 
                  alt="Gallery thumb" 
                  className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-85 transition" 
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-4 leading-relaxed font-semibold">
              * The display showcases the device profile. Final visual layout in store may fluctuate depending on exactly supported laptop revisions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

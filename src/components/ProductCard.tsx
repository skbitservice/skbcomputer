import React, { useState } from "react";
import { Product } from "../types";
import { useCart } from "../context/CartContext";
import { ShoppingBag, ZoomIn, Check, ChevronLeft, ChevronRight } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onBuyNow: (p: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onBuyNow }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const isService = product.category === "service";
  const outOfStock = !isService && product.stock <= 0;
  const lowStock = !isService && product.stock > 0 && product.stock <= 5;

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Build the list of images
  const defaultFallback = "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&q=80";
  const mainImage = product.image_url || defaultFallback;
  
  // Use product's custom array of images if available, otherwise fallback
  const sliderImages = (product.image_urls && product.image_urls.length > 0)
    ? product.image_urls
    : [
        mainImage,
        "https://images.unsplash.com/photo-1601524909162-be87252be298?w=500&q=80",
        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80",
      ];

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSlideIndex((prev) => (prev === 0 ? sliderImages.length - 1 : prev - 1));
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSlideIndex((prev) => (prev === sliderImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-[#FBF5DD] border border-[#0d530e]/12 rounded-xl overflow-hidden flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg hover:border-[#306D29] transition-all group duration-300">
      
      {/* Product Image Slider Section */}
      <div className="relative aspect-video w-full overflow-hidden bg-emerald-950/20 select-none">
        
        {/* Active Image */}
        <img
          src={sliderImages[activeSlideIndex] || defaultFallback}
          alt={`${product.name} - slide ${activeSlideIndex + 1}`}
          className="w-full h-full object-cover transition-all duration-500 ease-out"
          referrerPolicy="no-referrer"
        />

        {/* Carousel Arrow Controls (only if multiple images survive) */}
        {sliderImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-[#0D530E] p-1.5 rounded-full transition duration-200 z-10 cursor-pointer shadow-sm md:opacity-0 md:group-hover:opacity-100"
              title="Previous Image"
              id={`prev-slide-${product.id}`}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-[#0D530E] p-1.5 rounded-full transition duration-200 z-10 cursor-pointer shadow-sm md:opacity-0 md:group-hover:opacity-100"
              title="Next Image"
              id={`next-slide-${product.id}`}
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Carousel indicators dots */}
        {sliderImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/25 backdrop-blur-xs py-1 px-2 rounded-full">
            {sliderImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSlideIndex(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  activeSlideIndex === idx ? "bg-white scale-125 w-2.5" : "bg-white/50"
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
        
        {/* Category Tag */}
        <span className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase font-bold rounded-full z-10 ${
          isService ? "bg-[#306D29] text-white" : "bg-[#E7912E] text-white"
        }`}>
          {product.category}
        </span>

        {/* View Details/Gallery Button */}
        <button
          onClick={() => setShowGallery(true)}
          className="absolute right-3 top-3 bg-white/80 backdrop-blur-md p-2 rounded-full text-[#0D530E] opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
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
          <p className="text-[#4A6B43] text-xs leading-relaxed line-clamp-3 font-medium">
            {product.description}
          </p>
        </div>

        {/* Price & Stock info */}
        <div className="w-full flex items-center justify-between border-t border-[#0d530e]/5 pt-3">
          <div className="flex flex-col">
            <span className="text-xs text-[#4A6B43] font-semibold">
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
              className="absolute top-4 right-4 text-gray-500 hover:text-black font-extrabold focus:outline-none p-1.5 rounded-lg hover:bg-gray-100 text-sm cursor-pointer"
            >
              ✕
            </button>
            <h4 className="font-bold text-lg mb-4 text-[#0D530E]">{product.name} Photos</h4>
            
            <div className="grid grid-cols-1 gap-4 mb-4 select-none">
              <img 
                src={sliderImages[activeSlideIndex] || defaultFallback} 
                alt={product.name} 
                className="w-full h-56 object-cover rounded-xl border border-gray-100" 
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {sliderImages.map((img, i) => (
                <img 
                  key={i} 
                  src={img || defaultFallback} 
                  alt="Gallery thumb" 
                  onClick={() => setActiveSlideIndex(i)}
                  className={`w-full h-16 object-cover rounded-lg cursor-pointer transition border-2 ${
                    activeSlideIndex === i ? "border-[#306D29] opacity-100" : "border-transparent opacity-70 hover:opacity-100"
                  }`} 
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-4 leading-relaxed font-semibold">
              * This catalog showcase exhibits detail profiles. Final dynamic parts or physical layout may vary slightly based on actual configurations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

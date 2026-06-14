import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem, Product } from "../types";

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_CART_KEY = "skb_cart_items";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Initialize cart from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to restore cart state", err);
    }
  }, []);

  // Save cart changes to localStorage
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(newCart));
    } catch (err) {
      console.error("Failed to persist cart state", err);
    }
  };

  const addToCart = (product: Product, quantity = 1) => {
    if (!product.id) return;
    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    const updated = [...cart];

    if (existingIndex > -1) {
      const nextQty = updated[existingIndex].quantity + quantity;
      // Impose stock limit if it's an accessory
      if (product.category === "accessory" && nextQty > product.stock) {
        updated[existingIndex].quantity = product.stock;
      } else {
        updated[existingIndex].quantity = nextQty;
      }
    } else {
      updated.push({
        productId: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        quantity: Math.min(quantity, product.category === "accessory" ? product.stock : 999),
        stock: product.stock,
        image_url: product.image_url,
      });
    }
    saveCart(updated);
  };

  const removeFromCart = (productId: string) => {
    const updated = cart.filter((item) => item.productId !== productId);
    saveCart(updated);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updated = cart.map((item) => {
      if (item.productId === productId) {
        // Enforce accessory stock ceiling
        const resolvedQty = item.category === "accessory" && quantity > item.stock ? item.stock : quantity;
        return { ...item, quantity: resolvedQty };
      }
      return item;
    });
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartTotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const itemCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

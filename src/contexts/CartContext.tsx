import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity?: number;
  imageUrl?: string;
  total?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (gift: CartItem, maxAmount?: number) => boolean;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  getItemTotalAmount: (id: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const getItemTotalAmount = (id: string) => {
    const item = items.find(i => i._id === id);
    if (!item) return 0;
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    const quantity = item.quantity || 1;
    return price * quantity;
  };

  const addToCart = (gift: CartItem, maxAmount?: number): boolean => {
    const giftPrice = typeof gift.price === 'string' ? parseFloat(gift.price) : gift.price;
    const quantity = gift.quantity || 1;
    const newAmount = giftPrice * quantity;

    // Si hay un monto máximo especificado, validar
    if (maxAmount !== undefined) {
      const existingItem = items.find(item => item._id === gift._id);
      const existingAmount = existingItem 
        ? (typeof existingItem.price === 'string' ? parseFloat(existingItem.price) : existingItem.price) * (existingItem.quantity || 1)
        : 0;
      
      const totalAmount = existingAmount + newAmount;
      
      if (totalAmount > maxAmount) {
        return false; // No agregar si excede el máximo
      }
    }

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === gift._id);
      
      // Si el producto ya está en el carrito, no agregar otro (ya que cada producto solo puede tener una contribución)
      if (existingItem) {
        return prevItems; // No hacer nada, ya está en el carrito
      }
      
      return [...prevItems, { ...gift, quantity: gift.quantity || 1 }];
    });
    
    return true; // Agregado exitosamente
  };

  const removeFromCart = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item._id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems(prevItems =>
      prevItems.map(item => {
        if (item._id === id) {
          const maxQty = item.total || 1;
          const newQty = Math.min(quantity, maxQty);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalPrice = items.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    const quantity = item.quantity || 1;
    return sum + price * quantity;
  }, 0);

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    getItemTotalAmount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

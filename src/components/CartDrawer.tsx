"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { cartItems, removeFromCart, cartTotal } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-xl text-primary">
                  <ShoppingBag size={24} />
                </div>
                <h2 className="text-xl font-black text-slate-900">Your Cart</h2>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-sm font-bold">
                  {cartItems.length}
                </span>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900"
              >
                <X size={24} />
              </button>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <ShoppingBag size={64} className="opacity-20" />
                  <p className="font-medium text-lg text-slate-500">Your cart is empty</p>
                  <button 
                    onClick={onClose}
                    className="text-primary font-bold hover:underline"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                      <img 
                        src={item.imageUrl || "/images/course_thumb.png"} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 line-clamp-2 leading-tight">{item.title}</h3>
                        {item.type && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1 block">
                            {item.type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-black text-lg text-slate-900">₹{item.price}</span>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-slate-100 p-6 bg-white space-y-4">
                <div className="flex items-center justify-between text-slate-600 mb-2">
                  <span className="font-medium text-slate-500">Subtotal</span>
                  <span className="font-black text-2xl text-slate-900">₹{cartTotal}</span>
                </div>
                
                <button 
                  onClick={onCheckout}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <ArrowRight size={18} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

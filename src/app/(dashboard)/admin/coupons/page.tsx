"use client";

import { useState, useEffect } from "react";
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, toggleCouponActive } from "@/actions/coupons";
import { Plus, Tag, Calendar, Percent, Banknote, Power, PowerOff, MoreVertical, Edit2, Trash2 } from "lucide-react";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [showOnCheckout, setShowOnCheckout] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    const data = await getCoupons();
    setCoupons(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        code: code.toUpperCase(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        expiry_date: expiryDate ? new Date(expiryDate).toISOString() : undefined,
        show_on_checkout: showOnCheckout,
      };

      if (editingId) {
        await updateCoupon(editingId, payload);
        alert("Coupon updated successfully!");
        setEditingId(null);
      } else {
        await createCoupon(payload);
        alert("Coupon created successfully!");
      }

      setCode("");
      setDiscountValue("");
      setExpiryDate("");
      setShowOnCheckout(true);
      fetchCoupons();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (coupon: any) => {
    setEditingId(coupon.id);
    setCode(coupon.code);
    setDiscountType(coupon.discount_type);
    setDiscountValue(coupon.discount_value.toString());
    setExpiryDate(coupon.expiry_date ? coupon.expiry_date.split('T')[0] : "");
    setShowOnCheckout(coupon.show_on_checkout ?? true);
    setActiveMenuId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this coupon?")) {
      try {
        await deleteCoupon(id);
        fetchCoupons();
      } catch (err: any) {
        alert("Error: " + err.message);
      }
    }
    setActiveMenuId(null);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await toggleCouponActive(id, !currentStatus);
      fetchCoupons();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Discount Coupons</h1>
          <p className="text-muted-foreground text-sm">Create and manage promo codes for courses.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <form onSubmit={handleSubmit} className="bg-card p-5 rounded-2xl border border-border space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{editingId ? "Edit Coupon" : "Create New Coupon"}</h3>
              {editingId && (
                <button type="button" onClick={() => {
                  setEditingId(null); setCode(""); setDiscountValue(""); setExpiryDate(""); setShowOnCheckout(true);
                }} className="text-sm text-red-500 hover:underline">Cancel</button>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Coupon Code</label>
              <div className="relative">
                <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  required 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none uppercase" 
                  placeholder="e.g. DIWALI50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select 
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                >
                  <option value="flat">Flat (₹)</option>
                  <option value="percent">Percent (%)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                <input 
                  required 
                  type="number" 
                  min="1"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full p-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none" 
                  placeholder="e.g. 500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date (Optional)</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="date" 
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none" 
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input 
                type="checkbox" 
                id="show_checkout" 
                checked={showOnCheckout} 
                onChange={(e) => setShowOnCheckout(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label htmlFor="show_checkout" className="text-sm text-slate-700 cursor-pointer">
                Show on Checkout Page
              </label>
            </div>

            <button 
              disabled={loading}
              type="submit" 
              className="w-full bg-primary text-white py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              {loading ? "Saving..." : <>{editingId ? <Edit2 size={18} /> : <Plus size={18} />} {editingId ? "Update Coupon" : "Create Coupon"}</>}
            </button>
          </form>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3 rounded-tl-2xl">Code</th>
                  <th className="px-5 py-3">Discount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Expiry</th>
                  <th className="px-5 py-3 text-right rounded-tr-2xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-800">{coupon.code}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 text-slate-600 font-medium">
                        {coupon.discount_type === 'flat' ? <Banknote size={14} className="text-green-600"/> : <Percent size={14} className="text-blue-600"/>}
                        {coupon.discount_type === 'flat' ? `₹${coupon.discount_value}` : `${coupon.discount_value}%`}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {coupon.expiry_date 
                        ? new Date(coupon.expiry_date).toLocaleDateString()
                        : <span className="text-slate-400">Never</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="relative inline-block text-left">
                        <button 
                          onClick={() => setActiveMenuId(activeMenuId === coupon.id ? null : coupon.id)}
                          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                          <MoreVertical size={18} className="text-slate-500" />
                        </button>

                        {activeMenuId === coupon.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)}></div>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                            <button 
                              onClick={() => handleEdit(coupon)}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit2 size={14} /> Edit Coupon
                            </button>
                            
                            <button 
                              onClick={() => {
                                handleToggle(coupon.id, coupon.is_active);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              {coupon.is_active ? <PowerOff size={14} className="text-red-500" /> : <Power size={14} className="text-green-500" />}
                              {coupon.is_active ? "Deactivate" : "Activate"}
                            </button>
                            
                            <div className="h-px bg-slate-100 my-1"></div>
                            
                            <button 
                              onClick={() => handleDelete(coupon.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                            >
                              <Trash2 size={14} /> Delete Coupon
                            </button>
                          </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">No coupons found. Create one to get started.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

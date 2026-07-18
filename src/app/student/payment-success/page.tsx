"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Download, Home, FileText } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const receiptId = searchParams.get("receipt_id");
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const [purchase, setPurchase] = useState<Record<string, unknown> | null>(null);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReceipt() {
      if (!receiptId) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          courses (title, price)
        `)
        .eq('receipt_id', receiptId)
        .single();
        
      if (error) {
        console.error("Supabase Error:", error);
        setDebugError(error.message || JSON.stringify(error));
      }
        
      if (data) {
        // Fetch user data separately with select(*) so it doesn't crash if columns are missing
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.student_id)
          .single();
          
        if (userData) {
          data.users = userData;
        }
        setPurchase(data);
      }
      
      const { data: adminData } = await supabase
        .from('users')
        .select('address, map_location')
        .eq('role', 'admin')
        .limit(1)
        .single();
      if (adminData) setAdminInfo(adminData);
      setLoading(false);
    }
    
    fetchReceipt();
  }, [receiptId]);

  const handleDownloadPDF = () => {
    const studentName = (purchase?.users as any)?.full_name || "Student";
    const originalTitle = document.title;
    document.title = `Mishra Classes Receipt - ${studentName} - ${receiptId}`;
    window.print();
    
    // Slight delay to ensure the print dialog uses the new title before reverting
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  if (loading) return <div className="p-20 text-center">Loading receipt...</div>;
  if (!purchase) return (
    <div className="p-20 text-center text-red-500">
      <h2 className="text-xl font-bold mb-4">Receipt not found or invalid URL.</h2>
      {debugError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left inline-block">
          <p className="font-mono text-sm text-red-800">Debug Error: {debugError}</p>
        </div>
      )}
    </div>
  );

  const originalPrice = (purchase.courses as any)?.price || 0;
  const amountPaid = (purchase.amount_paid as number) ?? 0;
  const discount = originalPrice > amountPaid ? originalPrice - amountPaid : 0;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center print:bg-white print:py-0 print:min-h-0 print:block">
      
      <div className="text-center mb-8 print:hidden">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800">Payment Successful!</h1>
        <p className="text-slate-500 mt-2">Thank you for enrolling. Your transaction is complete.</p>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 print:border-none print:shadow-none print:mb-0 print:max-w-none">
        {/* Printable Area */}
        <div ref={invoiceRef} className="relative p-8 bg-white text-slate-800">
          {/* Watermark Logo */}
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10 pointer-events-none overflow-hidden">
            <img src="/logo.png" alt="Mishra Classes Watermark" className="w-full max-w-lg object-contain blur-[1px]" />
          </div>

          <div className="relative z-10 flex justify-between items-start mb-10 border-b border-slate-100 pb-8">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Mishra Classes Logo" className="w-16 h-16 object-contain" />
              <div>
                <h2 className="text-2xl font-black text-blue-600 tracking-tight">MISHRA CLASSES</h2>
                <p className="text-sm text-slate-500 mt-1">Transforming Education</p>
                {adminInfo?.address ? (
                  adminInfo?.map_location ? (
                    <a href={adminInfo.map_location} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-4 block whitespace-pre-wrap">{adminInfo.address}</a>
                  ) : (
                    <p className="text-xs text-slate-400 mt-4 whitespace-pre-wrap">{adminInfo.address}</p>
                  )
                ) : (
                  <p className="text-xs text-slate-400 mt-4">classessmishra@gmail.com</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md uppercase tracking-wider mb-2">
                PAID RECEIPT
              </div>
              <p className="text-sm font-semibold text-slate-700">Receipt No: <span className="font-mono text-slate-500">{receiptId}</span></p>
              <p className="text-sm font-semibold text-slate-700 mt-1">Date: <span className="font-mono text-slate-500">{purchase.created_at ? new Date(purchase.created_at as string).toLocaleDateString() : ""}</span></p>
            </div>
          </div>

          <div className="mb-10 flex justify-between relative z-10">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
              <p className="font-bold text-slate-800">{(purchase.users as any)?.full_name || "Student"}</p>
              <p className="text-sm text-slate-500">{(purchase.users as any)?.email || ""}</p>
              <p className="text-sm text-slate-500">{(purchase.users as any)?.phone || ""}</p>
              
              {((purchase.users as any)?.address || (purchase.users as any)?.city) && (
                <div className="mt-2 text-sm text-slate-500">
                  <p>{(purchase.users as any)?.address || ""}</p>
                  <p>
                    {[(purchase.users as any)?.city, (purchase.users as any)?.pincode].filter(Boolean).join(" - ")}
                  </p>
                </div>
              )}
            </div>
            <div className="text-right">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Transaction Ref</h3>
              <p className="font-mono text-sm text-slate-800">{purchase.razorpay_payment_id as string || "N/A"}</p>
              {Boolean(purchase.coupon_code) && <p className="text-sm text-blue-600 mt-1 font-semibold">Coupon: {purchase.coupon_code as string}</p>}
            </div>
          </div>

          <table className="w-full text-left mb-8 relative z-10">
            <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-bold border-y border-slate-200 print:bg-transparent">
              <tr>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-4 px-4">
                  <p className="font-bold text-slate-800">{(purchase.courses as any)?.title || "Course Enrollment"}</p>
                  <p className="text-xs text-slate-500">Digital Course Access</p>
                </td>
                <td className="py-4 px-4 text-right font-medium">₹{originalPrice.toFixed(2)}</td>
              </tr>
              {discount > 0 && (
                <tr>
                  <td className="py-3 px-4 text-right font-medium text-slate-500">Discount Applied</td>
                  <td className="py-3 px-4 text-right font-medium text-green-600">- ₹{discount.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td className="py-4 px-4 text-right font-bold text-slate-800 border-t border-slate-200">Total Paid</td>
                <td className="py-4 px-4 text-right font-black text-xl text-slate-900 border-t border-slate-200">₹{amountPaid.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="text-center pt-8 border-t border-slate-100 text-xs text-slate-400 relative z-10">
            <p>This is a computer-generated receipt and does not require a physical signature.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 print:hidden">
        <button 
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors"
        >
          <Download size={18} /> Download PDF
        </button>
        <Link 
          href="/student"
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-colors"
        >
          <Home size={18} /> Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans text-slate-500">Loading receipt...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

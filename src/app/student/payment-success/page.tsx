"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Download, Home, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const receiptId = searchParams.get("receipt_id");
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const [purchase, setPurchase] = useState<Record<string, unknown> | null>(null);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

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
        .maybeSingle();
        
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

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setIsDownloading(true);
    
    try {
      // MAGIC FIX: Clone the element and render it at desktop width off-screen
      const originalElement = invoiceRef.current;
      const clone = originalElement.cloneNode(true) as HTMLElement;
      
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.left = '0';
      clone.style.width = '800px';
      clone.style.height = 'max-content';
      clone.style.backgroundColor = '#ffffff';
      
      document.body.appendChild(clone);
      
      const canvas = await htmlToImage.toCanvas(clone, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: true,
        style: { width: '800px' }
      });
      
      document.body.removeChild(clone);
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      
      const studentName = (purchase?.users as any)?.full_name || "Student";
      const filename = `Mishra_Classes_Receipt_${studentName.replace(/\s+/g, '_')}_${receiptId}.pdf`;
      
      if (typeof window !== 'undefined' && (window as any).ReactNativeWebView && (window as any).ReactNativeWebView.postMessage) {
        const base64 = pdf.output('datauristring');
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'DOWNLOAD_PDF',
          base64: base64,
          filename: filename
        }));
      } else {
        pdf.save(filename);
      }
    } catch (err: any) {
      console.error("Error generating PDF:", err);
      setPdfError("Failed to generate PDF: " + (err.message || JSON.stringify(err)));
    } finally {
      setIsDownloading(false);
    }
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

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 print:border-none print:shadow-none print:mb-0 print:w-full print:max-w-none">
        {/* Printable Area */}
        <div ref={invoiceRef} className="relative p-6 sm:p-8 bg-white text-slate-800">
          {/* Watermark Logo */}
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10 pointer-events-none overflow-hidden">
            <img src="/logo.png" alt="Mishra Classes Watermark" className="w-full max-w-lg object-contain blur-[1px]" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6 mb-10 border-b border-slate-100 pb-8 print:flex-row print:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <img src="/logo.png" alt="Mishra Classes Logo" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-blue-600 tracking-tight leading-tight">MISHRA CLASSES</h2>
                <p className="text-[10px] sm:text-sm text-slate-500 mt-0.5">Transforming Education</p>
                {adminInfo?.address ? (
                  adminInfo?.map_location ? (
                    <a href={adminInfo.map_location} target="_blank" rel="noopener noreferrer" className="text-[10px] sm:text-xs text-blue-500 hover:underline mt-2 sm:mt-4 block whitespace-pre-wrap">{adminInfo.address}</a>
                  ) : (
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-2 sm:mt-4 whitespace-pre-wrap">{adminInfo.address}</p>
                  )
                ) : (
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-2 sm:mt-4">classessmishra@gmail.com</p>
                )}
              </div>
            </div>
            <div className="text-left sm:text-right print:text-right">
              <div className="inline-block px-2 sm:px-3 py-1 bg-green-50 text-green-700 text-[10px] sm:text-xs font-bold rounded-md uppercase tracking-wider mb-2">
                PAID RECEIPT
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">Receipt No: <span className="font-mono text-slate-500">{receiptId}</span></p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5 sm:mt-1">Date: <span className="font-mono text-slate-500">{purchase.created_at ? new Date(purchase.created_at as string).toLocaleDateString() : ""}</span></p>
            </div>
          </div>

          <div className="mb-8 flex flex-col sm:flex-row justify-between gap-4 sm:gap-6 relative z-10 print:flex-row print:mb-10">
            <div>
              <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 sm:mb-2">Billed To</h3>
              <p className="text-sm sm:text-base font-bold text-slate-800">{(purchase.users as any)?.full_name || "Student"}</p>
              <p className="text-xs sm:text-sm text-slate-500 break-all sm:break-normal">{(purchase.users as any)?.email || ""}</p>
              <p className="text-xs sm:text-sm text-slate-500">{(purchase.users as any)?.phone || ""}</p>
              
              {((purchase.users as any)?.address || (purchase.users as any)?.city) && (
                <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">
                  <p>{(purchase.users as any)?.address || ""}</p>
                  <p>
                    {[(purchase.users as any)?.city, (purchase.users as any)?.pincode].filter(Boolean).join(" - ")}
                  </p>
                </div>
              )}
            </div>
            <div className="text-left sm:text-right print:text-right mt-2 sm:mt-0 border-t border-slate-100 sm:border-0 pt-4 sm:pt-0">
              <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 sm:mb-2">Transaction Ref</h3>
              <p className="font-mono text-xs sm:text-sm text-slate-800 break-all sm:break-normal">{purchase.razorpay_payment_id as string || "N/A"}</p>
              {Boolean(purchase.coupon_code) && <p className="text-xs sm:text-sm text-blue-600 mt-1 font-semibold">Coupon: {purchase.coupon_code as string}</p>}
            </div>
          </div>

          <div className="mb-8 relative z-10 print:overflow-visible">
            <div className="w-full text-left min-w-[300px] flex flex-col">
              <div className="bg-slate-50/50 text-slate-500 text-[10px] sm:text-xs uppercase font-bold border-y border-slate-200 flex justify-between print:bg-transparent">
                <div className="py-2 sm:py-3 px-3 sm:px-4 flex-1">Description</div>
                <div className="py-2 sm:py-3 px-3 sm:px-4 text-right">Amount</div>
              </div>
              <div className="flex flex-col divide-y divide-slate-100">
                <div className="flex justify-between items-center py-3 sm:py-4 px-3 sm:px-4">
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-bold text-slate-800">{(purchase.courses as any)?.title || "Course Enrollment"}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500">Digital Course Access</p>
                  </div>
                  <div className="text-right text-sm sm:text-base font-medium">₹{originalPrice.toFixed(2)}</div>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center py-2 sm:py-3 px-3 sm:px-4">
                    <div className="flex-1 text-right text-xs sm:text-sm font-medium text-slate-500 pr-4">Discount Applied</div>
                    <div className="text-right text-xs sm:text-sm font-medium text-green-600">- ₹{discount.toFixed(2)}</div>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center py-3 sm:py-4 px-3 sm:px-4 border-t border-slate-200">
                <div className="flex-1 text-right text-sm sm:text-base font-bold text-slate-800 pr-4">Total Paid</div>
                <div className="text-right font-black text-lg sm:text-xl text-slate-900">₹{amountPaid.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="text-center pt-6 border-t border-slate-100 text-[10px] sm:text-xs text-slate-400 relative z-10">
            <p>This is a computer-generated receipt and does not require a physical signature.</p>
            {pdfError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-center font-medium">
                {pdfError}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:gap-4 print:hidden mb-20 sm:mb-0">
        <button 
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex justify-center items-center gap-2 bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-xl font-bold shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors w-full sm:w-auto text-sm sm:text-base disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isDownloading ? <Loader2 size={18} className="shrink-0 animate-spin" /> : <Download size={18} className="shrink-0" />} 
          {isDownloading ? "Generating PDF..." : "Download PDF"}
        </button>
        <Link 
          href="/student"
          className="flex justify-center items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 sm:px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-colors w-full sm:w-auto text-sm sm:text-base"
        >
          <Home size={18} className="shrink-0" /> Go to Dashboard
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

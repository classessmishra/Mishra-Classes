"use client";

import { useEffect, useState, useRef } from "react";
import { getInvoiceDetails } from "@/actions/checkout";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();

export default function InvoicePage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [invoiceData, setInvoiceData] = useState<any[] | null>(null);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      const data = await getInvoiceDetails(orderId);
      setInvoiceData(data);
      
      const { data: adminData } = await supabase
        .from('users')
        .select('address, map_location')
        .eq('role', 'admin')
        .limit(1)
        .single();
      if (adminData) setAdminInfo(adminData);
      
      setLoading(false);
    }
    if (orderId) {
      loadData();
    }
  }, [orderId]);
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    
    try {
      const studentInfo = invoiceData?.[0]?.users || {};
      const filename = `Mishra_Classes_Invoice_${studentInfo.full_name?.replace(/\s+/g, '_') || 'Student'}_${orderId}.pdf`;
      
      if (typeof window !== 'undefined' && (window as any).ReactNativeWebView && (window as any).ReactNativeWebView.postMessage) {
        // Get the full HTML
        let htmlContent = document.documentElement.outerHTML;
        
        // Fetch and inline all CSS to ensure perfect rendering in expo-print without network race conditions
        const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        let inlinedCss = '';
        for (const link of styleLinks) {
          try {
            const href = (link as HTMLLinkElement).href;
            if (href) {
              const res = await fetch(href);
              const cssText = await res.text();
              inlinedCss += cssText + '\n';
            }
          } catch (e) {
            console.error("Failed to fetch CSS", e);
          }
        }
        
        // Inject <base> tag and inlined CSS
        const baseUrl = window.location.origin;
        htmlContent = htmlContent.replace('<head>', `<head>
          <base href="${baseUrl}/" />
          <style>
            ${inlinedCss}
            /* Explicitly add Tailwind print utility classes just in case */
            @media print {
              .print\\:hidden { display: none !important; }
              .print\\:bg-transparent { background-color: transparent !important; }
              .print\\:border-none { border: none !important; }
              .print\\:shadow-none { box-shadow: none !important; }
              .print\\:block { display: block !important; }
              .print\\:m-0 { margin: 0 !important; }
              .print\\:p-0 { padding: 0 !important; }
              .print\\:bg-white { background-color: white !important; }
            }
          </style>
        `);
        
        // Send HTML to Native App
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PRINT_HTML',
          html: htmlContent,
          filename: filename
        }));
        
        setTimeout(() => setIsDownloading(false), 2000);
      } else {
        // Standard desktop browser print dialog
        window.print();
        setIsDownloading(false);
      }
    } catch (err: any) {
      console.error("Error generating PDF:", err);
      setPdfError("Failed to generate PDF: " + (err.message || JSON.stringify(err)));
      setIsDownloading(false);
    }
  };

  if (loading) {
    return <div className="p-20 text-center text-slate-500 font-medium">Loading invoice...</div>;
  }

  if (!invoiceData || invoiceData.length === 0) {
    return <div className="p-20 text-center text-red-500 font-bold text-xl">Invoice not found</div>;
  }

  const purchase = invoiceData[0];
  const studentInfo = purchase.users || {};
  const date = purchase.created_at ? new Date(purchase.created_at).toLocaleDateString("en-IN", {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : "";
  
  const course = purchase.courses || {};
  const originalPrice = course.price || 0;
  const amountPaid = purchase.amount_paid ?? originalPrice; // Fallback
  const discount = originalPrice > amountPaid ? originalPrice - amountPaid : 0;
  const receiptId = purchase.receipt_id || "N/A";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center print:bg-white print:py-0 print:min-h-0 print:block">
      
      {/* Controls - Hidden when printing */}
      <div className="w-full max-w-2xl flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 mb-8 print:hidden">
        <Link href="/student" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium transition-colors self-start sm:self-auto">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
        <button 
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
          {isDownloading ? "Generating PDF..." : "Print / Download PDF"}
        </button>
      </div>

      <div className="w-full max-w-2xl bg-white sm:rounded-2xl shadow-sm border border-slate-200 mb-6 print:border-none print:shadow-none print:mb-0 print:max-w-none">
        {/* Printable Area */}
        <div ref={invoiceRef} className="relative p-5 sm:p-8 bg-white text-slate-800">
          {/* Watermark Logo */}
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10 pointer-events-none overflow-hidden">
            <img src="/logo.png" alt="Mishra Classes Watermark" className="w-full max-w-lg object-contain blur-[1px]" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start mb-8 sm:mb-10 border-b border-slate-100 pb-6 sm:pb-8 gap-6 sm:gap-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <img src="/logo.png" alt="Mishra Classes Logo" className="w-14 h-14 sm:w-16 sm:h-16 object-contain" />
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
            <div className="text-left sm:text-right w-full sm:w-auto">
              <div className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md uppercase tracking-wider mb-2">
                PAID RECEIPT
              </div>
              <p className="text-sm font-semibold text-slate-700">Receipt No: <span className="font-mono text-slate-500">{receiptId}</span></p>
              <p className="text-sm font-semibold text-slate-700 mt-1">Date: <span className="font-mono text-slate-500">{date}</span></p>
            </div>
          </div>

          <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row justify-between gap-6 relative z-10">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
              <p className="font-bold text-slate-800">{studentInfo.full_name || "Student"}</p>
              <p className="text-sm text-slate-500">{studentInfo.email}</p>
              {studentInfo.phone && <p className="text-sm text-slate-500">{studentInfo.phone}</p>}
              
              {(studentInfo.address || studentInfo.city) && (
                <div className="mt-2 text-sm text-slate-500">
                  <p>{studentInfo.address}</p>
                  <p>{[studentInfo.city, studentInfo.pincode].filter(Boolean).join(" - ")}</p>
                </div>
              )}
            </div>
            <div className="text-left sm:text-right">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Transaction Ref</h3>
              <p className="font-mono text-sm text-slate-800">{orderId || "N/A"}</p>
              {Boolean(purchase.coupon_code) && <p className="text-sm text-blue-600 mt-1 font-semibold">Coupon: {purchase.coupon_code as string}</p>}
            </div>
          </div>

          <div className="w-full text-left mb-8 relative z-10 flex flex-col">
            <div className="bg-slate-50/50 text-slate-500 text-xs uppercase font-bold border-y border-slate-200 flex justify-between print:bg-transparent">
              <div className="py-3 px-4 flex-1">Description</div>
              <div className="py-3 px-4 text-right">Amount</div>
            </div>
            <div className="flex flex-col divide-y divide-slate-100">
              <div className="flex justify-between items-center py-4 px-4">
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{course.title || "Course Enrollment"}</p>
                  <p className="text-xs text-slate-500">Digital Course Access</p>
                </div>
                <div className="text-right font-medium">₹{originalPrice.toFixed(2)}</div>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center py-3 px-4">
                  <div className="flex-1 text-right font-medium text-slate-500 pr-4">Discount Applied</div>
                  <div className="text-right font-medium text-green-600">- ₹{discount.toFixed(2)}</div>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center py-4 px-4 border-t border-slate-200">
              <div className="flex-1 text-right font-bold text-slate-800 pr-4">Total Paid</div>
              <div className="text-right font-black text-lg sm:text-xl text-slate-900">₹{amountPaid.toFixed(2)}</div>
            </div>
          </div>

          <div className="text-center pt-8 border-t border-slate-100 text-xs text-slate-400 relative z-10">
            <p>This is a computer-generated receipt and does not require a physical signature.</p>
            {pdfError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-center font-medium">
                {pdfError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

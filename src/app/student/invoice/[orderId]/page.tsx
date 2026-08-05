"use client";

import { useEffect, useState, useRef } from "react";
import { getInvoiceDetails } from "@/actions/checkout";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function InvoicePage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [invoiceData, setInvoiceData] = useState<any[] | null>(null);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
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
    if (!invoiceRef.current) return;
    setIsDownloading(true);
    
    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      const studentInfo = invoiceData?.[0]?.users || {};
      pdf.save(`Mishra_Classes_Invoice_${studentInfo.full_name?.replace(/\s+/g, '_') || 'Student'}_${orderId}.pdf`);
    } catch (err: any) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF: " + (err.message || JSON.stringify(err)));
    } finally {
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

      <div className="w-full max-w-2xl bg-white sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 print:border-none print:shadow-none print:mb-0 print:max-w-none">
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
                  <p className="font-bold text-slate-800">{course.title || "Course Enrollment"}</p>
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
                <td className="py-4 px-4 text-right font-black text-lg sm:text-xl text-slate-900 border-t border-slate-200">₹{amountPaid.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="text-center pt-8 border-t border-slate-100 text-xs text-slate-400 relative z-10">
            <p>This is a computer-generated receipt and does not require a physical signature.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

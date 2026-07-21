"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Layout, Save, Upload, Check, Loader2, MoreVertical, Edit2 } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import AdCarousel from "@/components/AdCarousel";
import BentoGridAds from "@/components/BentoGridAds";
import PromoBanner from "@/components/PromoBanner";
import ScrollingMarquee from "@/components/ScrollingMarquee";
import PhotoAds from "@/components/PhotoAds";
import { getAdvertisements, createAdvertisement, updateAdvertisement, deleteAdvertisement, uploadAdvertisementImage } from "@/actions/advertisements";

const sectionTypes = [
  { id: 'hero', name: 'Hero Banner' },
  { id: 'carousel', name: 'Ad Carousel' },
  { id: 'bento', name: 'Bento Grid Ads' },
  { id: 'promo', name: 'Promo Banner' },
  { id: 'marquee', name: 'Scrolling Marquee' },
  { id: 'photo', name: 'Static Photo Ads' }
];

const tailwindGradients = [
  { name: 'Indigo Purple', value: 'from-indigo-500 to-purple-600' },
  { name: 'Blue Cyan', value: 'from-blue-600 to-cyan-500' },
  { name: 'Amber Orange', value: 'from-amber-400 to-orange-500' },
  { name: 'Emerald Teal', value: 'from-emerald-400 to-teal-500' },
  { name: 'Slate Gray', value: 'from-slate-700 to-slate-900' },
  { name: 'Rose Pink', value: 'from-rose-400 to-pink-600' },
  { name: 'Fuchsia Violet', value: 'from-fuchsia-500 to-violet-600' },
  { name: 'Sky Blue', value: 'from-sky-400 to-blue-600' },
  { name: 'Lime Green', value: 'from-lime-400 to-green-600' },
  { name: 'Red Rose', value: 'from-red-500 to-rose-600' },
  { name: 'Yellow Amber', value: 'from-yellow-400 to-amber-500' },
  { name: 'Subtle Blue', value: 'from-blue-600/30 to-purple-600/30' }
];

const iconOptions = [
  { id: 'Rocket', name: 'Rocket (Launch/Boost)' },
  { id: 'Tag', name: 'Tag (Offers/Discounts)' },
  { id: 'BookOpen', name: 'Book (Study/Notes)' },
  { id: 'GraduationCap', name: 'Graduation Cap (Success/Alumni)' },
  { id: 'Percent', name: 'Percentage (Discount)' },
  { id: 'Megaphone', name: 'Megaphone (Announcement)' },
  { id: 'Trophy', name: 'Trophy (Achievement/Rank)' },
  { id: 'Star', name: 'Star (Featured)' },
  { id: 'Award', name: 'Award (Quality/Winner)' },
  { id: 'Sparkles', name: 'Sparkles (New/Magic)' },
  { id: 'Gift', name: 'Gift (Surprise/Bonus)' },
  { id: 'Zap', name: 'Zap (Fast/Flash Sale)' }
];

export default function AdvertisementBuilder() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [editingAd, setEditingAd] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState<any>({
    section_type: 'hero',
    headline: '',
    subheadline: '',
    cta_text: '',
    cta_link: '',
    secondary_cta_text: '',
    bg_gradient: '',
    image_url: '',
    order_index: 1,
    is_active: true
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>('');

  const [drafts, setDrafts] = useState<Record<number, any>>({});
  const [draftImages, setDraftImages] = useState<Record<number, File | null>>({});

  useEffect(() => {
    if (formData.order_index) {
      setDrafts(prev => ({ ...prev, [formData.order_index]: formData }));
    }
  }, [formData]);

  useEffect(() => {
    if (formData.order_index) {
      setDraftImages(prev => ({ ...prev, [formData.order_index]: imageFile }));
    }
  }, [imageFile, formData.order_index]);

  useEffect(() => {
    fetchAds(activeSection);
  }, [activeSection]);

  const fetchAds = async (section: string) => {
    setLoading(true);
    const data = await getAdvertisements(section);
    setAds(data || []);
    setLoading(false);
    
    // Auto-select first ad if exists, or clear form
    if (data && data.length > 0) {
      handleSelectAd(data[0]);
    } else {
      resetForm(section);
    }
  };

  const resetForm = (section: string) => {
    setEditingAd(null);
    setFormData({
      section_type: section,
      headline: '',
      subheadline: '',
      cta_text: '',
      cta_link: '',
      secondary_cta_text: '',
      bg_gradient: '',
      image_url: '',
      order_index: (ads?.length || 0) + 1,
      is_active: true
    });
    setImageFile(null);
    setPreviewImage('');
  };

  const handleSelectAd = (ad: any) => {
    setEditingAd(ad);
    setFormData({
      section_type: ad.section_type,
      headline: ad.headline || '',
      subheadline: ad.subheadline || '',
      cta_text: ad.cta_text || '',
      cta_link: ad.cta_link || '',
      secondary_cta_text: ad.secondary_cta_text || '',
      bg_gradient: ad.bg_gradient || '',
      image_url: ad.image_url || '',
      order_index: ad.order_index || 1,
      is_active: ad.is_active
    });
    setImageFile(null);
    setPreviewImage(ad.image_url || '');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
      setFormData({ ...formData, image_url: URL.createObjectURL(file) });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const sectionDrafts = Object.values(drafts).filter(d => d.section_type === activeSection);
      const itemsToSave = sectionDrafts.length > 0 ? sectionDrafts : [formData];

      await Promise.all(itemsToSave.map(async (draft) => {
        const file = draftImages[draft.order_index];
        let finalImageUrl = draft.image_url || '';
        
        if (file) {
          const uploadData = new FormData();
          uploadData.append('file', file);
          const res = await uploadAdvertisementImage(uploadData);
          finalImageUrl = res.url;
        }
        
        const payload = { ...draft, image_url: finalImageUrl };
        const existingAd = ads.find(a => a.order_index === draft.order_index);
        
        if (existingAd) {
          await updateAdvertisement(existingAd.id, payload);
        } else {
          // Only create if it has some content
          if (payload.headline || payload.subheadline || payload.cta_text || payload.image_url || file) {
            await createAdvertisement(payload);
          }
        }
      }));
      
      await fetchAds(activeSection);
      setDrafts({});
      setDraftImages({});
      alert("All changes saved successfully!");
    } catch (err: any) {
      alert("Error saving: " + err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this advertisement?")) {
      await deleteAdvertisement(id);
      await fetchAds(activeSection);
    }
  };

  const isMarquee = formData.section_type === 'marquee';
  const isPhoto = formData.section_type === 'photo';
  const isHero = formData.section_type === 'hero';
  const isBento = formData.section_type === 'bento';
  const isCarousel = formData.section_type === 'carousel';
  const isPromo = formData.section_type === 'promo';
  
  // Conditionally hide fields based on Bento box
  const isBentoBox1 = isBento && formData.order_index === 1;
  const isBentoBox2 = isBento && formData.order_index === 2;
  const isBentoBox3 = isBento && formData.order_index === 3;
  const isBentoBox4 = isBento && formData.order_index === 4;

  const showHeadline = true; // Everyone uses headline/title
  const showSubheadline = isHero || isCarousel || isBento || isPromo || isMarquee;
  const showBadge = isHero || isCarousel || isBentoBox1 || isPromo;
  const showCtaText = isHero || isCarousel || isPromo || isMarquee; // Marquee uses it for Rank
  const showCtaLink = isHero || isCarousel || isBento || isPromo || isPhoto; // Marquee doesn't click
  const showGradient = isCarousel || isBentoBox1 || isBentoBox2 || isBentoBox3 || isPromo || isMarquee; // Marquee uses it for Score
  const showImage = isHero || isBento || isPhoto || isMarquee;

  // Live preview injection
  const mergedPreviewData = [...ads];
  
  // 1. Overlay all drafts for the active section
  const sectionDrafts = Object.values(drafts).filter(d => d.section_type === activeSection);
  for (const draft of sectionDrafts) {
    const draftImageFile = draftImages[draft.order_index];
    // Create temporary URL for draft images if they exist (memory leak is negligible for a few previews)
    const temporaryImageUrl = draftImageFile ? URL.createObjectURL(draftImageFile) : draft.image_url;
    const draftWithImage = { ...draft, image_url: temporaryImageUrl };

    const existingIndex = mergedPreviewData.findIndex(ad => ad.order_index === draft.order_index);
    if (existingIndex !== -1) {
      mergedPreviewData[existingIndex] = { ...mergedPreviewData[existingIndex], ...draftWithImage };
    } else {
      mergedPreviewData.push({ ...draftWithImage, id: `draft-${draft.order_index}` });
    }
  }

  // 2. Overlay the current formData (always wins for the active box)
  const currentFormWithImage = { ...formData, image_url: previewImage || formData.image_url };
  const currentDraftIndex = mergedPreviewData.findIndex(ad => ad.order_index === formData.order_index);
  
  if (currentDraftIndex !== -1) {
    mergedPreviewData[currentDraftIndex] = { ...mergedPreviewData[currentDraftIndex], ...currentFormWithImage };
  } else {
    mergedPreviewData.push({ ...currentFormWithImage, id: 'preview-current' });
  }

  // Sort preview array just like backend
  mergedPreviewData.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  const previewData = mergedPreviewData;

  const renderPreview = () => {
    switch (formData.section_type) {
      case 'hero': return <HeroSection previewData={previewData} isPreview={true} />;
      case 'carousel': return <AdCarousel previewData={previewData} isPreview={true} />;
      case 'bento': return <BentoGridAds previewData={previewData} isPreview={true} />;
      case 'promo': return <PromoBanner previewData={formData} isPreview={true} />;
      case 'marquee': return <ScrollingMarquee previewData={previewData} isPreview={true} />;
      case 'photo': return <PhotoAds previewData={previewData} isPreview={true} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-8 min-h-screen bg-slate-50 -m-6 p-6">
      
      {/* TOP HALF: EDITOR FORM */}
      <div className="flex flex-col border border-slate-200 bg-white shadow-xl z-20 shrink-0 rounded-2xl overflow-hidden">
        
        {/* Header & Section Selector */}
        <div className="p-6 border-b border-slate-100 bg-white shrink-0">
          <h1 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
            <Layout className="text-blue-600" /> Ad Builder
          </h1>
          
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {sectionTypes.map(s => (
              <button 
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${
                  activeSection === s.id 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div>
              <p className="font-bold text-blue-900 text-sm">Managing: {sectionTypes.find(s => s.id === activeSection)?.name}</p>
              <p className="text-blue-600 text-xs mt-1">Select an item below or create a new one.</p>
            </div>
            <button onClick={() => resetForm(activeSection)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors">
              <Plus size={16} /> New {activeSection}
            </button>
          </div>

          {/* List of existing ads for this section */}
          {ads.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {ads.map((ad, idx) => (
                <div 
                  key={ad.id} 
                  className={`group relative shrink-0 p-4 w-56 h-20 rounded-2xl border-2 cursor-pointer transition-all overflow-hidden ${editingAd?.id === ad.id ? 'border-blue-500 bg-blue-50/50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm hover:shadow-md'}`}
                >
                  <div className="flex justify-between items-start gap-2 h-full relative z-10 pointer-events-none">
                    <div className="flex-1 overflow-hidden">
                      <div className="text-xs font-black text-slate-400 mb-1 uppercase tracking-wider">
                        {isBento ? `Box ${ad.order_index}` : isCarousel ? `Slide ${ad.order_index}` : `Item ${ad.order_index || idx + 1}`}
                      </div>
                      <div className="font-bold text-slate-800 text-sm truncate">{ad.headline || 'Untitled Advertisement'}</div>
                    </div>
                    
                    {/* 3-Dot Icon (Decorative to indicate menu) */}
                    <div className="text-slate-400 p-1">
                      <MoreVertical size={18} />
                    </div>
                  </div>

                  {/* Premium Action Overlay (Fixes clipping issue!) */}
                  <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center gap-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSelectAd(ad); }}
                      className="text-white hover:text-blue-400 flex flex-col items-center group/btn transition-colors"
                    >
                      <div className="p-2 bg-slate-800 rounded-full group-hover/btn:bg-blue-500/20 mb-1 transition-colors">
                        <Edit2 size={16} />
                      </div>
                      <span className="text-[10px] font-bold tracking-widest uppercase">Edit</span>
                    </button>
                    
                    <div className="w-px h-8 bg-slate-700" />
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(ad.id); }}
                      className="text-white hover:text-red-400 flex flex-col items-center group/btn transition-colors"
                    >
                      <div className="p-2 bg-slate-800 rounded-full group-hover/btn:bg-red-500/20 mb-1 transition-colors">
                        <Trash2 size={16} />
                      </div>
                      <span className="text-[10px] font-bold tracking-widest uppercase">Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-5">
            {/* Position Dropdown */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                {isBento ? "Display Box" : isCarousel ? "Select Slide" : isMarquee ? "Student Sequence" : isPhoto ? "Poster Sequence" : "Banner Sequence"}
              </label>
              <select 
                value={formData.order_index} 
                onChange={e => {
                  const newIndex = parseInt(e.target.value);
                  if (drafts[newIndex]) {
                    setFormData(drafts[newIndex]);
                    setImageFile(draftImages[newIndex] || null);
                    setPreviewImage(drafts[newIndex].image_url || (draftImages[newIndex] ? URL.createObjectURL(draftImages[newIndex] as File) : ''));
                    const existingAd = ads.find(a => a.order_index === newIndex);
                    setEditingAd(existingAd || null);
                  } else {
                    const existingAd = ads.find(a => a.order_index === newIndex);
                    if (existingAd) {
                      setEditingAd(existingAd);
                      setFormData(existingAd);
                      setPreviewImage(existingAd.image_url || '');
                      setImageFile(null);
                    } else {
                      setEditingAd(null);
                      setFormData({
                        section_type: activeSection,
                        headline: '',
                        subheadline: '',
                        cta_text: '',
                        cta_link: '',
                        secondary_cta_text: '',
                        image_url: '',
                        bg_gradient: '',
                        order_index: newIndex,
                        is_active: true
                      });
                      setPreviewImage('');
                      setImageFile(null);
                    }
                  }
                }} 
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              >
                {isBento ? (
                  <>
                    <option value={1}>Box 1 (Main Large Feature)</option>
                    <option value={2}>Box 2 (Top Right Rectangle)</option>
                    <option value={3}>Box 3 (Bottom Left Square)</option>
                    <option value={4}>Box 4 (Bottom Right Square)</option>
                  </>
                ) : (
                  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>
                      {isCarousel ? `Slide ${n}` : isMarquee ? `Student ${n}` : isPhoto ? `Poster ${n}` : `Banner ${n}`}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Badge Text */}
            {showBadge && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {isHero ? "Top Badge Text (e.g., Registration Open)" : isCarousel ? "Feature Update Text (Badge)" : "Badge Text"}
                </label>
                <input type="text" value={formData.secondary_cta_text} onChange={e => setFormData({...formData, secondary_cta_text: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Premium Batch" />
              </div>
            )}

            {/* Headline */}
            {showHeadline && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {isMarquee ? "Student Name" : isPhoto ? "Internal Reference Name" : isCarousel ? "Heading" : "Main Headline"}
                </label>
                <input type="text" value={formData.headline} onChange={e => setFormData({...formData, headline: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder={isMarquee ? "e.g. Rahul S." : "Heading text"} />
              </div>
            )}

            {/* Sub-headline */}
            {showSubheadline && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {isMarquee ? "Exam Name" : isCarousel ? "Sub-heading" : "Sub-headline"}
                </label>
                <textarea rows={2} value={formData.subheadline} onChange={e => setFormData({...formData, subheadline: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder={isMarquee ? "e.g. Board Exams '25" : "Supporting text"} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* CTA Link */}
              {showCtaLink && (
                <div className={showCtaText ? "col-span-1" : "col-span-2"}>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Redirect Link URL</label>
                  <input type="text" value={formData.cta_link} onChange={e => setFormData({...formData, cta_link: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="/store or https://t.me/..." />
                </div>
              )}
              
              {/* CTA Text / Icon Selector */}
              {showCtaText && (
                <div className={showCtaLink ? "col-span-1" : "col-span-2"}>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    {isMarquee ? "Rank (e.g. State Rank 1)" : isCarousel ? "Front Icon" : "Button Text"}
                  </label>
                  {isCarousel ? (
                    <select value={formData.cta_text} onChange={e => setFormData({...formData, cta_text: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">Default Icon (Rocket)</option>
                      {iconOptions.map(icon => <option key={icon.id} value={icon.id}>{icon.name}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={formData.cta_text} onChange={e => setFormData({...formData, cta_text: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder={isMarquee ? "AIR 14" : "Start Learning"} />
                  )}
                </div>
              )}
            </div>

            {/* Background Gradient / Score */}
            {showGradient && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {isMarquee ? "Score/Percentage" : "Background Gradient"}
                </label>
                {isMarquee ? (
                  <input type="text" value={formData.bg_gradient} onChange={e => setFormData({...formData, bg_gradient: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="99.8%" />
                ) : (
                  <select value={formData.bg_gradient} onChange={e => setFormData({...formData, bg_gradient: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select a premium gradient</option>
                    {tailwindGradients.map(g => <option key={g.name} value={g.value}>{g.name}</option>)}
                  </select>
                )}
              </div>
            )}

            {/* Image Upload */}
            {showImage && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {isHero ? "Hero Background Image" : isPhoto ? "Poster Image" : isMarquee ? "Student Profile Photo" : "Background Image"}
                </label>
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors relative overflow-hidden">
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="h-32 object-contain rounded-lg" />
                  ) : (
                    <>
                      <Upload size={24} className="text-slate-400 mb-2" />
                      <span className="text-sm font-medium text-slate-500">Upload new image</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="isActive" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-5 h-5 rounded text-blue-600" />
              <label htmlFor="isActive" className="text-sm font-bold text-slate-700 cursor-pointer">Set as Active</label>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 border-t border-slate-100 bg-white shrink-0">
          <button 
            disabled={saving} 
            onClick={handleSave} 
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-lg hover:bg-slate-800 transition-colors flex justify-center items-center gap-2 shadow-lg"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {editingAd ? "Update Advertisement" : "Save New Advertisement"}
          </button>
        </div>

      </div>

      {/* BOTTOM HALF: LIVE PREVIEW */}
      <div className="bg-slate-900 p-8 flex flex-col relative shrink-0 rounded-2xl overflow-hidden shadow-2xl min-h-[600px]">
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full text-xs font-black tracking-widest uppercase border border-green-500/30 z-20">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Live Preview
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-start relative z-10 w-full max-w-6xl mx-auto h-full overflow-hidden">
          {/* Simulated Browser Frame */}
          <div className="w-full h-full flex flex-col rounded-2xl bg-slate-800 shadow-2xl border border-slate-700 overflow-hidden transform transition-all duration-300">
            <div className="h-8 bg-slate-900 border-b border-slate-700 flex items-center px-4 gap-2 shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            
            <div className="p-4 md:p-8 bg-white flex-1 overflow-hidden">
              {renderPreview()}
            </div>
          </div>
        </div>
        
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
      </div>
      
    </div>
  );
}

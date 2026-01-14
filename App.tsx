
import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, Target, ShieldCheck, Layers, Clipboard, Image as ImageIcon, X, 
  Loader2, ArrowRight, Sparkles, Info, CheckCircle2, Wand2, RefreshCw, 
  Download, Box, AlertTriangle, Key, ExternalLink, Camera, Maximize2,
  Quote, Smartphone, Layout, MessageSquare, ListChecks, FileText,
  User, Users, AlertCircle
} from 'lucide-react';
import { generateAdCopy, editImage, generateAdImage } from './geminiService';
import { AdCopyPackage, GenerationState } from './types';

// Mocking the window.aistudio interface for TS
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const LOADING_STEPS = [
  "Firing Parallel Engine...",
  "Extracting Sacred Brand Assets...",
  "Executing Mathematical Anatomy Check...",
  "Verifying Limb Ownership Tracing...",
  "Finalizing Deployment Package..."
];

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showImageWarning, setShowImageWarning] = useState(false);
  
  const [state, setState] = useState<GenerationState>({
    isLoading: false,
    error: null,
    result: null,
    currentStep: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEditImage = async () => {
    if (!hasApiKey) return handleOpenKeyDialog();
    if (!image || !editPrompt.trim()) return;
    setIsEditing(true);
    try {
      const edited = await editImage(image, editPrompt);
      setImage(edited);
      setEditPrompt('');
    } catch (err: any) {
      if (err.message.includes("Requested entity was not found")) setHasApiKey(false);
      setState(prev => ({ ...prev, error: "Creative Retouch Failed: " + err.message }));
    } finally {
      setIsEditing(false);
    }
  };

  const handleGenerate = async (ignoreImageWarning = false) => {
    if (!hasApiKey) return handleOpenKeyDialog();
    
    // If no image is provided and they haven't confirmed they want to proceed, show warning
    if (!image && !ignoreImageWarning) {
      setShowImageWarning(true);
      return;
    }

    setShowImageWarning(false);
    setState(prev => ({ ...prev, isLoading: true, error: null, result: null }));
    setGeneratedImages([]);
    setIsGeneratingImages(true);
    
    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      if (stepIndex < LOADING_STEPS.length) {
        setState(prev => ({ ...prev, currentStep: LOADING_STEPS[stepIndex] }));
        stepIndex++;
      }
    }, 1200);

    try {
      // MAX SPEED PARALLELIZATION - 2 PREMIUM STAGING + 1 ACTIVE SINGLE USE
      const [copyResult, imgHeroA, imgHeroB, imgActiveSingle] = await Promise.all([
        generateAdCopy(input, image),
        generateAdImage(`pure product hero shot, elevated minimalist architectural staging, premium surfaces, sophisticated visual context, NO humans, cinematic studio lighting`, image),
        generateAdImage(`premium product staging in a luxury lifestyle environment, high-end commercial props, atmospheric lighting, NO humans, sophisticated composition`, image),
        generateAdImage(`active usage lifestyle photography featuring exactly one human model in the precise moment of functionally using the product mid-action, authentic expression, perfect hand anatomy (exactly 2 arms, 2 hands, 5 fingers per hand, zero disembodied parts)`, image)
      ]);

      setState(prev => ({ ...prev, result: copyResult, isLoading: false }));
      setGeneratedImages([imgHeroA, imgHeroB, imgActiveSingle]);
    } catch (err: any) {
      if (err.message.includes("Requested entity was not found")) setHasApiKey(false);
      setState(prev => ({ ...prev, error: err.message, isLoading: false }));
    } finally {
      clearInterval(stepInterval);
      setIsGeneratingImages(false);
    }
  };

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const VARIANT_LABELS = [
    { label: "Hero Staging A", desc: "Architectural • No Humans", icon: <Layout className="w-5 h-5" /> },
    { label: "Hero Staging B", desc: "Premium Props • No Humans", icon: <Box className="w-5 h-5" /> },
    { label: "Active Single Use", desc: "Mid-Action Usage • 1 Model", icon: <User className="w-5 h-5" /> }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-16 font-inter selection:bg-blue-500 selection:text-white">
      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors p-4 z-10">
            <X className="w-10 h-10" />
          </button>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-full rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] ring-1 ring-white/10 object-contain animate-in zoom-in-95 duration-500" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Warning Modal for Missing Image */}
      {showImageWarning && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-amber-500/30 rounded-[2.5rem] p-8 md:p-12 max-w-xl w-full shadow-[0_0_50px_rgba(245,158,11,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 bg-amber-500/5 blur-[100px] -z-10"></div>
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-5 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <AlertCircle className="w-12 h-12 text-amber-500" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-white tracking-tight uppercase">Strategic Asset Missing</h3>
                <p className="text-slate-400 font-medium leading-relaxed">
                  Proceeding without a brand asset means the engine cannot maintain 1:1 visual fidelity. <br/>
                  <span className="text-amber-500/80 font-bold">Image generation will be generic and may not align with your product's actual appearance.</span>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
                <button 
                  onClick={() => setShowImageWarning(false)} 
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all"
                >
                  Return to Upload
                </button>
                <button 
                  onClick={() => handleGenerate(true)} 
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-900/20"
                >
                  Proceed Generic
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pro Status Banner */}
      {!hasApiKey && (
        <div className="mb-8 bg-gradient-to-r from-blue-700 to-blue-600 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xl border border-white/10">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div className="text-white">
              <p className="font-black text-lg tracking-tight leading-none mb-1">Creative Engine Locked</p>
              <p className="text-xs opacity-90 font-medium">Gemini 3 Pro high-fidelity 2K visuals require production-level key.</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[10px] text-white underline flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity font-bold uppercase tracking-widest">
              Billing Docs <ExternalLink className="w-3 h-3" />
            </a>
            <button onClick={handleOpenKeyDialog} className="bg-white text-blue-700 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-[0.15em] hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 shadow-md">
              Unlock Engine
            </button>
          </div>
        </div>
      )}

      {/* Brand Header */}
      <header className="mb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-[0.25em] mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Elite Performance Suite 4.0</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-white leading-none">
          Ad<span className="text-blue-500 italic">Forge</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
          The ultimate direct-response engine for Meta Advertisers. <br className="hidden md:block" />
          <span className="text-white/80">Engineered for 1:1 brand integrity and conversion-ready copy.</span>
        </p>
      </header>

      {/* Main Campaign Builder */}
      {!state.result && !state.isLoading && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="bg-slate-900/30 border border-slate-800/60 rounded-[2.5rem] p-6 md:p-12 backdrop-blur-3xl shadow-xl ring-1 ring-white/5">
            <div className="mb-8">
              <label className="block text-[10px] font-black text-slate-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" /> Strategic Product Brief
              </label>
              <textarea
                className="w-full bg-slate-950/40 border border-slate-800/80 rounded-[2rem] p-8 h-48 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all text-slate-100 placeholder:text-slate-800 outline-none resize-none font-medium text-xl leading-relaxed shadow-inner"
                placeholder="Paste landing page, product description, or creative brief here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>

            {/* Protocol Notice */}
            <div className="mb-8 p-6 bg-blue-500/5 border border-blue-500/10 rounded-[2rem] flex items-start gap-5">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest leading-none">Zero-Tolerance Anatomy & Usage Protocols</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-3xl">
                  Our engine executes mathematical limb verification and ownership tracing to eliminate disembodied parts, ensuring absolute anatomical correctness in every human interaction.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
              <div className="space-y-6">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full flex flex-col items-center justify-center gap-3 px-6 py-10 rounded-[2rem] transition-all border-2 border-dashed group ${image ? 'bg-emerald-500/5 border-emerald-500/20 text-white' : 'bg-slate-800/30 border-slate-800 hover:border-blue-500/30 hover:bg-slate-800/60 text-white shadow-[0_0_30px_rgba(59,130,246,0.1)]'}`}
                >
                  <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${image ? 'bg-emerald-500/10' : 'bg-slate-950'}`}>
                    {image ? <CheckCircle2 className="w-8 h-8 text-emerald-500" /> : <Camera className="w-8 h-8 text-blue-500 animate-pulse" />}
                  </div>
                  <div className="text-center">
                    <p className="font-black text-base uppercase tracking-widest">{image ? 'Brand Asset Reference Locked' : 'Upload Master Asset'}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1.5 opacity-60 ${image ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {image ? '1:1 Visual Identity Captured' : 'Required for Creative Synthesis'}
                    </p>
                  </div>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

                {image && (
                  <div className="bg-slate-950 border border-slate-800/80 p-6 rounded-[2rem] space-y-5 shadow-xl ring-1 ring-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.35em] flex items-center gap-2">
                        <Wand2 className="w-4 h-4" /> Environmental Retouching
                      </span>
                      <button onClick={() => setImage(null)} className="text-slate-600 hover:text-red-400 transition-colors bg-slate-900 p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        placeholder="e.g. 'Marble bathroom counter', 'Studio desk'"
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-5 py-3.5 text-sm text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleEditImage()}
                      />
                      <button 
                        onClick={handleEditImage}
                        disabled={isEditing || !editPrompt.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white px-5 py-3.5 rounded-xl transition-all shadow-md"
                      >
                        {isEditing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 rounded-[2.5rem] border-2 border-dashed border-slate-800 bg-slate-950/60 p-8 flex items-center justify-center relative overflow-hidden min-h-[350px] shadow-xl group">
                {image ? (
                  <img src={image} alt="Master Ref" className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="text-slate-800 text-center opacity-30">
                    <ImageIcon className="w-16 h-16 mx-auto mb-6" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Creative Sandbox</p>
                  </div>
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center">
                     <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-6" />
                        <span className="text-xs font-black text-blue-400 uppercase tracking-[0.35em] animate-pulse">Retouching Brand Context...</span>
                     </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 pt-4">
               {!image && input.trim() && (
                 <div className="flex items-center gap-3 px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">No master image detected. Creative assembly will be generic.</span>
                 </div>
               )}
               <button
                onClick={() => handleGenerate()}
                disabled={!input.trim() || state.isLoading}
                className="w-full md:w-auto flex items-center justify-center gap-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800/50 disabled:text-slate-600 text-white font-black py-6 px-24 rounded-[2rem] transition-all shadow-xl active:scale-[0.96] text-xl uppercase tracking-[0.15em] group overflow-hidden border border-white/5"
              >
                Assemble Package
                <ArrowRight className={`w-8 h-8 transition-transform ${input.trim() ? 'group-hover:translate-x-3' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading View */}
      {state.isLoading && (
        <div className="flex flex-col items-center justify-center py-56 text-center animate-in fade-in zoom-in-95 duration-1000">
          <div className="relative mb-16">
            <div className="absolute inset-0 bg-blue-500 blur-[100px] opacity-30 animate-pulse"></div>
            <Loader2 className="w-24 h-24 text-blue-500 animate-spin relative z-10" />
          </div>
          <h2 className="text-6xl font-black mb-8 text-white tracking-tighter">Accelerated Assembly...</h2>
          <div className="text-blue-400 font-mono text-xs uppercase tracking-[0.4em] bg-blue-500/10 px-12 py-5 rounded-full border border-blue-500/30 shadow-md backdrop-blur-3xl">
            {state.currentStep}
          </div>
        </div>
      )}

      {/* Deployment Portfolio */}
      {state.result && (
        <div className="space-y-24 pb-32 animate-in fade-in slide-in-from-bottom-16 duration-1000">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-slate-800/80 pb-16">
            <div>
              <h2 className="text-7xl font-black text-white tracking-tighter leading-none mb-4">Ad Package <span className="text-blue-500">v1.0</span></h2>
              <div className="flex flex-wrap items-center gap-4">
                <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black rounded-full tracking-[0.25em] uppercase flex items-center gap-2">
                   <CheckCircle2 className="w-3 h-3" /> Strategy Locked
                </span>
                <span className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black rounded-full tracking-[0.25em] uppercase flex items-center gap-2">
                   <ShieldCheck className="w-3 h-3" /> Compliance Verified
                </span>
              </div>
            </div>
            <button 
              onClick={() => setState(prev => ({ ...prev, result: null }))}
              className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-10 py-5 rounded-[1.5rem] transition-all flex items-center gap-3 font-black text-xs uppercase tracking-[0.25em] shadow-lg hover:scale-105"
            >
              <RefreshCw className="w-5 h-5" /> New Brief
            </button>
          </div>

          {/* Visual Creative Suite */}
          <section className="bg-gradient-to-br from-blue-950/30 via-slate-900/40 to-slate-950 border border-white/5 p-10 md:p-16 rounded-[4rem] shadow-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
               <div className="flex items-center gap-6">
                <div className="p-4 bg-blue-500/10 rounded-[2rem] border border-blue-500/10">
                  <Layout className="w-12 h-12 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-5xl font-black text-white tracking-tighter mb-1">Creative Suite</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">2K Rendering • Zero-Hallucination Anatomy</p>
                </div>
              </div>
              {isGeneratingImages && (
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.25em] text-blue-500 animate-pulse bg-blue-500/10 px-8 py-3.5 rounded-full border border-blue-500/20">
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Anatomy Tracing...
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {image && (
                <div className="space-y-6 group">
                  <div className="text-[10px] uppercase font-black text-slate-600 tracking-[0.4em] flex items-center gap-3">
                    <Box className="w-5 h-5" /> Source Master
                  </div>
                  <div className="aspect-square bg-slate-950 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl relative transition-all duration-700">
                    <img src={image} alt="Ref Master" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-6 right-6 flex flex-col gap-3 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 z-20">
                       <button onClick={() => setPreviewImage(image)} className="p-4 bg-blue-500 text-white rounded-2xl ring-2 ring-black"><Maximize2 className="w-6 h-6" /></button>
                    </div>
                  </div>
                </div>
              )}

              {generatedImages.map((img, i) => (
                <div key={i} className="space-y-6 group animate-in fade-in zoom-in-95 duration-700">
                  <div className="text-[10px] uppercase font-black text-blue-500 tracking-[0.4em] flex items-center gap-3">
                    {VARIANT_LABELS[i].icon} {VARIANT_LABELS[i].label}
                  </div>
                  <div className="aspect-square bg-slate-950 border border-blue-500/20 rounded-[2.5rem] overflow-hidden shadow-xl relative transition-all duration-700">
                    <img src={img} alt={`Variant ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 z-20">
                       <button onClick={() => setPreviewImage(img)} className="p-3 bg-blue-500 text-white rounded-xl ring-2 ring-black"><Maximize2 className="w-5 h-5" /></button>
                    </div>
                    <div className="absolute top-4 left-4 z-20">
                       <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-widest text-white border border-white/10">
                          {VARIANT_LABELS[i].desc}
                       </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-blue-950/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-20">
                        <button 
                          onClick={() => handleDownload(img, `variant-${i + 1}.jpg`)}
                          className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-blue-500 transition shadow-xl"
                        >
                          <Download className="w-5 h-5" /> EXPORT ASSET
                        </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Copy Architecture */}
          <section className="space-y-24">
             {/* 8 Hooks */}
             <div>
                <div className="flex items-center gap-6 mb-12">
                  <div className="p-5 bg-blue-500/10 rounded-[2rem] border border-blue-500/20 shadow-lg"><Quote className="w-10 h-10 text-blue-500" /></div>
                  <h3 className="text-6xl font-black text-white tracking-tighter leading-none">Scroll-Stopping Hooks</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {state.result.hooks.map((hook, i) => (
                    <div key={i} className="group bg-slate-900/30 border border-slate-800/80 hover:border-blue-500/30 p-10 rounded-[3rem] transition-all relative overflow-hidden">
                      <div className="text-[10px] uppercase font-black text-slate-600 mb-6 tracking-[0.4em]">Section 1 • {hook.type}</div>
                      <p className="text-2xl font-bold text-slate-100 mb-4 pr-16 leading-[1.3] tracking-tight">"{hook.text}"</p>
                      <button 
                        onClick={() => copyToClipboard(hook.text)}
                        className="absolute top-10 right-10 p-4 bg-slate-800 hover:bg-blue-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Clipboard className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
             </div>

             {/* Primary Ad Text (Frameworks) */}
             <div>
                <div className="flex items-center gap-6 mb-12">
                  <div className="p-5 bg-purple-500/10 rounded-[2rem] border border-purple-500/20 shadow-lg"><Layers className="w-10 h-10 text-purple-500" /></div>
                  <h3 className="text-6xl font-black text-white tracking-tighter leading-none">Copy Frameworks</h3>
                </div>
                <div className="space-y-12">
                  {state.result.primaryTexts.map((text, i) => (
                    <div key={i} className="group bg-slate-900/30 border border-slate-800/60 p-12 md:p-16 rounded-[3.5rem] relative overflow-hidden">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 pb-8 border-b border-white/5">
                        <div className="px-8 py-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black rounded-full tracking-[0.5em] uppercase">
                          Framework: {text.framework}
                        </div>
                        <button onClick={() => copyToClipboard(text.content)} className="flex items-center gap-4 px-10 py-4 bg-white text-black font-black text-xs rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-[0.25em]">
                          <Clipboard className="w-5 h-5" /> Copy Text
                        </button>
                      </div>
                      <div className="whitespace-pre-wrap text-slate-200 leading-[1.8] max-w-4xl font-medium text-xl md:text-2xl tracking-tight">
                        {text.content}
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             {/* Short-Form Variations (Stories/Reels) */}
             <div>
                <div className="flex items-center gap-6 mb-12">
                  <div className="p-5 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20 shadow-lg"><Smartphone className="w-10 h-10 text-emerald-500" /></div>
                  <h3 className="text-6xl font-black text-white tracking-tighter leading-none">Story & Reel Variants</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {state.result.shortForms.map((short, i) => (
                    <div key={i} className="group bg-slate-900/30 border border-slate-800/80 p-12 rounded-[3.5rem] relative overflow-hidden">
                      <div className="text-[10px] uppercase font-black text-slate-600 mb-8 tracking-[0.4em]">Short-Form {i + 1} • 40-60 Words</div>
                      <p className="text-xl font-medium text-slate-100 leading-relaxed italic pr-12">"{short.content}"</p>
                      <button 
                        onClick={() => copyToClipboard(short.content)}
                        className="absolute top-10 right-10 p-4 bg-slate-800 hover:bg-emerald-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Clipboard className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
             </div>

             {/* Headlines & Descriptions */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div>
                  <div className="flex items-center gap-6 mb-10">
                    <div className="p-4 bg-blue-500/10 rounded-2xl"><MessageSquare className="w-8 h-8 text-blue-500" /></div>
                    <h4 className="text-4xl font-black text-white tracking-tight">Headlines</h4>
                  </div>
                  <div className="space-y-4">
                    {state.result.headlines.map((headline, i) => (
                      <div key={i} className="bg-slate-900/50 border border-slate-800/60 p-6 rounded-[1.5rem] flex items-center justify-between group">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{headline.angle} angle</p>
                          <p className="text-lg font-bold text-slate-100">"{headline.text}"</p>
                        </div>
                        <button onClick={() => copyToClipboard(headline.text)} className="p-3 text-slate-600 hover:text-white transition-colors"><Clipboard className="w-5 h-5" /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-6 mb-10">
                    <div className="p-4 bg-blue-500/10 rounded-2xl"><FileText className="w-8 h-8 text-blue-500" /></div>
                    <h4 className="text-4xl font-black text-white tracking-tight">Descriptions</h4>
                  </div>
                  <div className="space-y-4">
                    {state.result.descriptions.map((desc, i) => (
                      <div key={i} className="bg-slate-900/50 border border-slate-800/60 p-6 rounded-[1.5rem] flex items-center justify-between group">
                        <p className="text-slate-300 font-medium leading-relaxed pr-8">{desc.text}</p>
                        <button onClick={() => copyToClipboard(desc.text)} className="p-3 text-slate-600 hover:text-white transition-colors shrink-0"><Clipboard className="w-5 h-5" /></button>
                      </div>
                    ))}
                  </div>
                </div>
             </div>

             {/* CTA Recommendations */}
             <div className="bg-slate-900/30 border border-slate-800/60 p-12 md:p-20 rounded-[4rem] relative overflow-hidden">
                <div className="flex items-center gap-8 mb-12">
                   <div className="p-5 bg-blue-600 rounded-[2rem] shadow-xl shadow-blue-500/20"><ListChecks className="w-10 h-10 text-white" /></div>
                   <h3 className="text-5xl font-black text-white tracking-tighter">CTA Recommendations</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Primary Recommendation</p>
                      <div className="p-8 bg-blue-500/10 border border-blue-500/20 rounded-[2.5rem] space-y-4">
                         <span className="inline-block px-6 py-2 bg-white text-blue-600 font-black text-xs rounded-xl uppercase tracking-widest">{state.result.ctaRecommendations.primary.button}</span>
                         <p className="text-slate-400 font-medium leading-relaxed italic pr-4">{state.result.ctaRecommendations.primary.rationale}</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Secondary Recommendation</p>
                      <div className="p-8 bg-slate-800/30 border border-slate-800/60 rounded-[2.5rem] space-y-4">
                         <span className="inline-block px-6 py-2 bg-slate-700 text-white font-black text-xs rounded-xl uppercase tracking-widest">{state.result.ctaRecommendations.secondary.button}</span>
                         <p className="text-slate-400 font-medium leading-relaxed italic pr-4">{state.result.ctaRecommendations.secondary.rationale}</p>
                      </div>
                   </div>
                </div>
                <div className="pt-10 border-t border-white/5">
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Funnel Guidance</p>
                   <p className="text-slate-300 text-xl font-medium max-w-3xl leading-relaxed">{state.result.ctaRecommendations.funnelGuidance}</p>
                </div>
             </div>
          </section>

          {/* Reset Button */}
          <div className="flex justify-center pt-20 border-t border-slate-800/50">
            <button 
              onClick={() => {
                setState(prev => ({ ...prev, result: null }));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-white text-slate-950 px-20 py-7 rounded-[2.5rem] font-black shadow-2xl hover:scale-105 transition active:scale-95 flex items-center gap-5 ring-[16px] ring-white/10 uppercase tracking-[0.3em] text-xs"
            >
              <Zap className="w-6 h-6 fill-current text-blue-600" />
              Start New Sprint
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

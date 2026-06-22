import React, { useState, useEffect } from "react";
import { Sparkles, Shield, Palette, Save, Loader2, Sparkle } from "lucide-react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL || "";

const BrandHub = () => {
  const [brandName, setBrandName] = useState("");
  const [brandDesc, setBrandDesc] = useState("");
  const [tone, setTone] = useState("Professional");
  const [audience, setAudience] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#4f46e5");
  const [secondaryColor, setSecondaryColor] = useState("#6366f1");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { getToken } = useAuth();

  const tones = [
    "Professional",
    "Casual",
    "Bold & Edgy",
    "Witty & Humorous",
    "Empathetic & Warm",
    "Minimal & Elegant",
    "Informative & Direct"
  ];

  // Fetch existing brand profile on mount
  useEffect(() => {
    const fetchBrandProfile = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const { data } = await axios.get("/api/brand", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (data.success && data.profile) {
          const p = data.profile;
          setBrandName(p.brand_name || "");
          setBrandDesc(p.brand_description || "");
          setTone(p.tone_of_voice || "Professional");
          setAudience(p.target_audience || "");
          setPrimaryColor(p.primary_color || "#4f46e5");
          setSecondaryColor(p.secondary_color || "#6366f1");
        }
      } catch (error) {
        console.error("Error fetching brand profile:", error);
        toast.error("Failed to load brand profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchBrandProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!brandName.trim()) {
      return toast.error("Brand Name is required.");
    }

    setSaving(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/brand",
        {
          brand_name: brandName,
          brand_description: brandDesc,
          tone_of_voice: tone,
          target_audience: audience,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        toast.success("Brand Profile saved successfully!");
      } else {
        toast.error(data.error || "Failed to save Brand Profile.");
      }
    } catch (error) {
      console.error("Error saving brand profile:", error);
      toast.error("Error saving brand profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading your Brand Hub...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto flex flex-col justify-start p-6 text-slate-700 bg-gray-100 dark:bg-gray-900 scroll-hidden">
      {/* Page Header */}
      <div className="max-w-6xl mx-auto w-full mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-500" />
          Brand Hub Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs">
          Define your brand guidelines to automatically tailor and inject identity rules into all generations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl mx-auto pb-8">
        
        {/* Left Column: Form Settings */}
        <form 
          onSubmit={handleSave}
          className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-6 text-slate-700"
        >
          <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
            <Palette className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-800">Identity Guidelines</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Brand Name */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Brand Name</p>
              <input
                type="text"
                placeholder="e.g. Buddhimaan"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Tone of Voice */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Tone of Voice</p>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:border-blue-500 focus:outline-none transition-colors"
              >
                {tones.map((t, idx) => (
                  <option key={idx} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Color Palette */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Color Scheme</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
              {/* Primary Color */}
              <div className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 bg-gray-50">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded border-0 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500">Primary Color</span>
                  <span className="text-xs font-semibold font-mono uppercase text-gray-800">{primaryColor}</span>
                </div>
              </div>

              {/* Secondary Color */}
              <div className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 bg-gray-50">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-8 h-8 rounded border-0 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500">Secondary Color</span>
                  <span className="text-xs font-semibold font-mono uppercase text-gray-800">{secondaryColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Description */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Brand Description</p>
            <textarea
              rows="3"
              placeholder="What does your brand do? What makes it unique?"
              value={brandDesc}
              onChange={(e) => setBrandDesc(e.target.value)}
              className="w-full p-3 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:border-blue-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Target Audience */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Target Audience</p>
            <textarea
              rows="2"
              placeholder="e.g. Young professionals, tech enthusiasts, marketers..."
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full p-3 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:border-blue-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-450 text-white font-bold py-3 mt-2 text-sm rounded-lg cursor-pointer hover:opacity-95 transition disabled:opacity-50 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Identity...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Brand Identity</span>
              </>
            )}
          </button>
        </form>

        {/* Right Column: Brand Card Preview */}
        <div className="lg:col-span-1 flex flex-col gap-6 w-full">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow text-slate-100 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Sparkle className="w-4 h-4 text-yellow-400 animate-pulse" /> Identity Preview
            </h2>
            
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 flex flex-col gap-1">
                <span className="text-[9px] text-slate-500 uppercase font-semibold">Brand Name</span>
                <span className="text-sm font-bold text-blue-400">{brandName || "Not Configured"}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 flex flex-col gap-1">
                <span className="text-[9px] text-slate-500 uppercase font-semibold">Voice Tone</span>
                <span className="text-xs font-semibold text-slate-350">{tone}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 flex flex-col gap-1">
                <span className="text-[9px] text-slate-500 uppercase font-semibold">Color Palette</span>
                <div className="flex gap-2 items-center mt-1">
                  <div style={{ backgroundColor: primaryColor }} className="w-5 h-5 rounded-full border border-slate-800" />
                  <div style={{ backgroundColor: secondaryColor }} className="w-5 h-5 rounded-full border border-slate-800" />
                  <span className="text-[10px] text-slate-400 font-mono">{primaryColor} / {secondaryColor}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow text-slate-100">
            <h3 className="font-bold text-white mb-2 flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> How it works
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Once saved, Buddhimaan automatically feeds your brand guide, color hexes, and tone settings into the AI models.
              <br /><br />
              Generated articles and campaigns will use your voice tone, and generated websites will adapt to your primary and secondary color palette automatically.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BrandHub;

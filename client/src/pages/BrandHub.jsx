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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading your Brand Hub...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        
        {/* Left Column: Form Settings */}
        <form 
          onSubmit={handleSave}
          className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col gap-6"
        >
          <div className="flex items-center justify-between border-b pb-4 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Brand Hub</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Define your brand identity to personalize all AI models.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Brand Name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Brand Name</label>
              <input
                type="text"
                placeholder="e.g. Buddhimaan"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Tone of Voice */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tone of Voice</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {tones.map((t, idx) => (
                  <option key={idx} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Color Palette */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-600" /> Color Scheme
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Primary Color */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Primary Color</span>
                  <span className="text-sm font-semibold font-mono uppercase text-gray-800 dark:text-white">{primaryColor}</span>
                </div>
              </div>

              {/* Secondary Color */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Secondary Color</span>
                  <span className="text-sm font-semibold font-mono uppercase text-gray-800 dark:text-white">{secondaryColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Description */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Brand Description</label>
            <textarea
              rows="3"
              placeholder="What does your brand do? What makes it unique?"
              value={brandDesc}
              onChange={(e) => setBrandDesc(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Target Audience */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Target Audience</label>
            <textarea
              rows="2"
              placeholder="e.g. Young professionals aged 22-35, tech enthusiasts, marketers..."
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-2 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving Identity...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Brand Identity
              </>
            )}
          </button>
        </form>

        {/* Right Column: Brand Card Preview */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl shadow-xl text-white border border-gray-800">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Sparkle className="w-5 h-5 text-yellow-400" /> Identity Preview
            </h2>
            
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Brand Name</span>
                <span className="text-xl font-bold text-indigo-400">{brandName || "Not Configured"}</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Voice Tone</span>
                <span className="text-sm font-semibold">{tone}</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Color Preview</span>
                <div className="flex gap-2 items-center">
                  <div style={{ backgroundColor: primaryColor }} className="w-6 h-6 rounded-full border border-white/10" />
                  <div style={{ backgroundColor: secondaryColor }} className="w-6 h-6 rounded-full border border-white/10" />
                  <span className="text-xs text-gray-400 font-mono font-medium">{primaryColor} / {secondaryColor}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-900/20 p-6 rounded-3xl border border-indigo-500/20 text-gray-700 dark:text-gray-300">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> How it works
            </h3>
            <p className="text-sm leading-relaxed">
              Once saved, Buddhimaan automatically feeds your brand guide, color hexes, and tone settings into the AI models.
              <br /><br />
              Generated articles will use your voice tone, and generated websites will adapt to your primary and secondary color palette automatically.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BrandHub;

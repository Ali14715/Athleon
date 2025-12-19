import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@inertiajs/react";
import axios from "axios";

interface Banner {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  button_text: string | null;
  is_active: boolean;
  order: number;
}

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const CACHE_KEY = "banner-cache-v1";
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    // Try read cache first
    try {
      const cachedRaw = localStorage.getItem(CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as { data: Banner[]; ts: number };
        if (cached?.data && Array.isArray(cached.data) && Date.now() - cached.ts < CACHE_TTL_MS) {
          setBanners(cached.data);
          setLoading(false);
        }
      }
    } catch (e) {
      // ignore cache errors
    }

    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Auto slide every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  const fetchBanners = async () => {
    try {
      const response = await axios.get("/api/banners");
      // Handle new API format: { status_code, message, data }
      const bannersData = response.data?.data || response.data || [];
      const normalized = Array.isArray(bannersData) ? bannersData : [];
      setBanners(normalized);

      // Cache for a short period
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: normalized, ts: Date.now() }));
      } catch (e) {
        // ignore cache errors
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (loading) {
    return (
      <div className="relative w-full h-[300px] md:h-[400px] bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="relative w-full h-[300px] md:h-[400px] bg-gradient-to-br from-slate-900 via-emerald-900/10 to-slate-900 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-950 overflow-hidden">
        {/* Default Banner Content */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center text-white px-4 max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-2 md:mb-4">Welcome to ATHLEON</h1>
            <p className="text-sm md:text-lg lg:text-xl text-slate-300 mb-4 md:mb-8">Your Premium Sports Equipment Store</p>
            <Link href="/catalog">
              <button className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg font-bold text-sm md:text-lg hover:scale-105 transition-transform shadow-lg">
                Shop Now
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="relative w-full h-[300px] md:h-[400px] lg:h-[450px] group overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl">
        {/* Slides */}
        <div className="relative h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === currentIndex
                ? "opacity-100 scale-100"
                : "opacity-0 scale-105"
            }`}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="relative h-full flex items-center">
              <div className="container mx-auto px-4 md:px-6">
                <div className="max-w-xl md:max-w-2xl">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 md:mb-4 animate-fade-in-up leading-tight">
                    {banner.title}
                  </h1>
                  {banner.description && (
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-200 mb-4 md:mb-6 animate-fade-in-up animation-delay-200 line-clamp-2">
                      {banner.description}
                    </p>
                  )}
                  {banner.link_url && (
                    <Link href={banner.link_url}>
                      <button className="px-5 py-2.5 md:px-7 md:py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg font-bold text-sm md:text-base text-white hover:scale-105 transition-transform shadow-lg hover:shadow-emerald-500/50 animate-fade-in-up animation-delay-400">
                        {banner.button_text || "Shop Now"}
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all z-10"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all z-10"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all ${
                index === currentIndex
                  ? "w-8 md:w-10 h-2 md:h-2.5 bg-white"
                  : "w-2 md:w-2.5 h-2 md:h-2.5 bg-white/50 hover:bg-white/75"
              } rounded-full`}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

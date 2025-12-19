import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InfiniteCatalogGrid from "@/components/InfiniteCatalogGrid";
import SEOHead from "@/components/SEOHead";
import { Grid3x3, List, SlidersHorizontal, X, Search } from "lucide-react";
// Link import removed - unused

interface Kategori {
  id: number;
  nama: string;
  deskripsi: string;
  gambar?: string;
  created_at?: string;
  updated_at?: string;
  gambar_url?: string;
}

const Catalog = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Kategori[]>([]);

  const CATEGORY_CACHE_KEY = "categories-cache-v1";
  const CATEGORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    // Try cache first
    try {
      const cachedRaw = localStorage.getItem(CATEGORY_CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as { data: Kategori[]; ts: number };
        if (cached?.data && Array.isArray(cached.data) && Date.now() - cached.ts < CATEGORY_CACHE_TTL) {
          setCategories(cached.data);
        }
      }
    } catch (e) {
      // ignore cache errors
    }

    // Fetch categories from API
    fetch('/api/kategori')
      .then(res => res.json())
      .then(data => {
        if (data.status_code === 200 || data.success || Array.isArray(data)) {
          const categoriesData = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
          setCategories(categoriesData);
          try {
            localStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify({ data: categoriesData, ts: Date.now() }));
          } catch (e) {
            // ignore cache errors
          }
        }
      })
      .catch(err => console.error('Failed to fetch categories:', err));

    // Check URL params for category
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, []);

  const activeFiltersCount = 
    (selectedCategory !== "all" ? 1 : 0) + 
    (selectedGender !== "all" ? 1 : 0) + 
    (priceRange[0] !== 0 || priceRange[1] !== 1000000 ? 1 : 0) +
    (searchQuery !== "" ? 1 : 0);

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedGender("all");
    setPriceRange([0, 1000000]);
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEOHead
        title="Katalog Produk"
        description={`Jelajahi koleksi lengkap produk olahraga ${import.meta.env.VITE_APP_NAME || 'Athleon'}. Temukan sepatu futsal, jersey basket, raket padel, bola, dan perlengkapan olahraga berkualitas dengan harga terbaik. Filter berdasarkan kategori dan budget Anda.`}
        keywords="katalog olahraga, produk olahraga, sepatu futsal murah, jersey basket original, raket padel terbaik, bola basket, daftar harga olahraga"
      />
      <Navbar />
      
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-full mb-3 uppercase tracking-widest">Produk</div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">Katalog {import.meta.env.VITE_APP_NAME || 'Athleon'}</h1>
            <p className="mt-2 text-base text-gray-600 dark:text-gray-400">Cek koleksi lengkap gear olahraga untuk aktivitas harian kamu.</p>
          </div>
          
          {/* Filter Toggle & Controls Bar */}
          <div className="mb-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
            <div className="p-4 md:p-5">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari produk..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-200 dark:border-gray-600 rounded-lg font-medium transition-all"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filter
                    {activeFiltersCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-emerald-600 dark:bg-emerald-500 text-white text-xs font-bold rounded-full">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>

                  {activeFiltersCount > 0 && (
                    <button type="button" className="inline-flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg font-medium transition-all" onClick={resetFilters}>
                      <X className="h-4 w-4" />
                      Reset
                    </button>
                  )}
                </div>

                <div className="flex flex-1 items-center justify-end gap-3">
                  <select className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="newest">Terbaru</option>
                    <option value="price-low">Harga Rendah</option>
                    <option value="price-high">Harga Tinggi</option>
                    <option value="name-asc">Nama A-Z</option>
                    <option value="name-desc">Nama Z-A</option>
                  </select>

                  <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                    <button
                      type="button"
                      className={`px-3 py-2 transition-all ${
                        viewMode === "grid" 
                          ? "bg-emerald-600 dark:bg-emerald-500 text-white" 
                          : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-2 border-l border-gray-200 dark:border-gray-600 transition-all ${
                        viewMode === "list" 
                          ? "bg-emerald-600 dark:bg-emerald-500 text-white" 
                          : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Panel (Collapsible) */}
          {showFilters && (
            <div className="mb-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Kategori
                    </label>
                    <select className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg text-sm md:text-base font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                      <option value="all">Semua Kategori</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.nama}>{cat.nama}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Gender
                    </label>
                    <select className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg text-sm md:text-base font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)}>
                      <option value="all">Semua</option>
                      <option value="pria">Pria</option>
                      <option value="wanita">Wanita</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Harga: <span className="text-emerald-600 dark:text-emerald-400 font-bold">Rp {priceRange[0].toLocaleString()} - Rp {priceRange[1].toLocaleString()}</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1000000}
                      step={50000}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Display with Infinite Scroll */}
          <InfiniteCatalogGrid
            selectedCategory={selectedCategory}
            selectedGender={selectedGender}
            priceRange={priceRange}
            sortBy={sortBy}
            searchQuery={searchQuery}
            viewMode={viewMode}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Catalog;

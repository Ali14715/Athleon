import { Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import InfiniteProductGrid from "@/components/InfiniteProductGrid";
import SEOHead from "@/components/SEOHead";
import BannerCarousel from "@/components/BannerCarousel";
import { useState, useEffect } from "react";
import axios from "axios";

interface Kategori {
  id: number;
  nama: string;
  deskripsi?: string;
  gambar?: string;
}

interface ProductVariant {
  id: number;
  produk_id: number;
  nama_varian: string;
  nilai_varian: string;
  harga_tambahan: number;
  stok: number;
}

interface Product {
  id: number;
  nama: string;
  harga: number;
  gambar?: string;
  gambar_url?: string;
  kategori?: string | Kategori;
  varians?: ProductVariant[];
  average_rating?: number;
  rating_count?: number;
}

interface Category {
  id: number;
  nama: string;
  gambar?: string;
  deskripsi?: string;
}

const Index = () => {
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const CATEGORY_CACHE_KEY = "categories-cache-v1";
  const CATEGORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    fetchBestSellers();
    fetchCategories();
  }, []);

  const fetchBestSellers = async () => {
    try {
      const response = await axios.get("/api/produk");
      // Handle paginated response: response.data.data.data
      const productsData = response.data?.data?.data || response.data?.data || response.data || [];
      // Ambil 4 produk pertama sebagai best sellers
      setBestSellers(productsData.slice(0, 4));
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    // Try load from cache first
    try {
      const cachedRaw = localStorage.getItem(CATEGORY_CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as { data: Category[]; ts: number };
        if (cached?.data && Array.isArray(cached.data) && Date.now() - cached.ts < CATEGORY_CACHE_TTL) {
          setCategories(cached.data);
        }
      }
    } catch (e) {
      // ignore cache errors
    }

    try {
      const response = await axios.get("/api/kategori");
      const categoriesData = response.data?.data || response.data || [];
      const normalized = Array.isArray(categoriesData) ? categoriesData : [];
      setCategories(normalized);

      // Cache fresh data
      try {
        localStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify({ data: normalized, ts: Date.now() }));
      } catch (e) {
        // ignore cache errors
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <SEOHead
        title="Beranda"
        description={`${import.meta.env.VITE_APP_NAME || 'Athleon'} - Toko perlengkapan olahraga terlengkap dengan produk berkualitas. Belanja sepatu futsal, jersey basket, raket padel, dan peralatan olahraga lainnya dengan harga terbaik. Gratis ongkir dan garansi resmi.`}
        keywords="toko olahraga, athleon, sepatu futsal, jersey basket, raket padel, bola basket, perlengkapan olahraga, alat olahraga"
      />
      <Navbar />
      
      <main className="flex-1">
        {/* Banner Carousel */}
        <BannerCarousel />

        {/* Categories */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm font-semibold rounded-full mb-4">
                SHOP BY CATEGORY
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Find Your Perfect Gear
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Browse our collection of premium sports equipment
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/catalog?category=${encodeURIComponent(category.nama.toLowerCase())}`}
                  className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-700 shadow-sm hover:shadow-xl transition-all duration-500 ease-out transform hover:-translate-y-2"
                >
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={
                        category.gambar
                          ? (category.gambar.startsWith('http') || category.gambar.startsWith('/storage/') 
                              ? category.gambar 
                              : `/storage/${category.gambar}`)
                          : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23059669" width="400" height="400"/%3E%3Ctext x="200" y="200" text-anchor="middle" fill="%23FFFFFF" font-size="24" font-weight="bold"%3E' + encodeURIComponent(category.nama) + '%3C/text%3E%3C/svg%3E'
                      }
                      alt={category.nama}
                      className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23059669" width="400" height="400"/%3E%3Ctext x="200" y="200" text-anchor="middle" fill="%23FFFFFF" font-size="24" font-weight="bold"%3E' + encodeURIComponent(category.nama) + '%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    {/* Gradient overlay with smooth transition */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
                  </div>
                  <div className="absolute inset-0 flex items-end p-5">
                    <div className="transform transition-transform duration-500 group-hover:translate-y-0 translate-y-1">
                      <h3 className="text-white font-bold text-base md:text-lg mb-1 drop-shadow-lg">
                        {category.nama}
                      </h3>
                      {category.deskripsi && (
                        <p className="text-white/90 text-xs line-clamp-1 drop-shadow-md">{category.deskripsi}</p>
                      )}
                    </div>
                  </div>
                  {/* Hover ring effect */}
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-emerald-400 transition-all duration-500"></div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Best Sellers */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
              <div>
                <span className="inline-block px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm font-semibold rounded-full mb-3">
                  FEATURED PRODUCTS
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  Best Sellers
                </h2>
                <p className="text-gray-600 dark:text-gray-300">Our most popular items</p>
              </div>
              <Link href="/catalog">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                  View All Products →
                </Button>
              </Link>
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-300">Loading products...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {bestSellers.map((product) => (
                  <ProductCard 
                    key={product.id}
                    id={product.id}
                    name={product.nama}
                    price={product.harga}
                    image={product.gambar_url || product.gambar || 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop'}
                    category={typeof product.kategori === 'object' ? product.kategori?.nama : product.kategori || 'Kategori'}
                    hasVariants={product.varians && product.varians.length > 0}
                    rating={product.average_rating}
                    ratingCount={product.rating_count}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* More Products - Infinite Scroll Grid */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm font-semibold rounded-full mb-3">
                DISCOVER MORE
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                All Products
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Complete collection for all your sports needs. Scroll untuk melihat lebih banyak!
              </p>
            </div>
            
            <InfiniteProductGrid />
          </div>
        </section>


      </main>

      <Footer />
    </div>
  );
};

export default Index;

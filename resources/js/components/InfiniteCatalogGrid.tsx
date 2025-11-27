import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import ProductCard from "./ProductCard";
import { Loader2, Package } from "lucide-react";

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
  jenisKelamin?: string;
  varians?: ProductVariant[];
  average_rating?: number;
  rating_count?: number;
}

interface InfiniteCatalogGridProps {
  selectedCategory: string;
  selectedGender: string;
  priceRange: [number, number];
  sortBy: string;
  searchQuery: string;
  viewMode: "grid" | "list";
}

const InfiniteCatalogGrid = ({
  selectedCategory,
  selectedGender,
  priceRange,
  sortBy,
  searchQuery,
  viewMode
}: InfiniteCatalogGridProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  const getKategoriName = (kategori: string | Kategori | undefined): string => {
    if (!kategori) return '';
    return typeof kategori === 'string' ? kategori : kategori.nama;
  };

  const fetchProducts = useCallback(async (pageNum: number, isReset: boolean = false) => {
    // Only check loading state for non-reset calls (pagination)
    if (!isReset && loading) return;
    
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (selectedGender !== 'all') {
        params.append('gender', selectedGender);
      }
      if (priceRange[0] > 0) {
        params.append('min_price', priceRange[0].toString());
      }
      if (priceRange[1] < 1000000) {
        params.append('max_price', priceRange[1].toString());
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (sortBy) {
        params.append('sort', sortBy);
      }

      const response = await axios.get(`/api/produk?${params.toString()}`);
      const productsData = response.data?.data?.data || response.data?.data || response.data || [];
      
      if (productsData.length === 0) {
        setHasMore(false);
        if (isReset) {
          setProducts([]);
        }
      } else {
        setProducts(prev => {
          // For reset, always replace all products
          const newProducts = (pageNum === 1 || isReset) ? productsData : [...prev, ...productsData];
          return newProducts;
        });
        
        // Check if we got less than expected
        const perPage = response.data?.data?.per_page || 12;
        setHasMore(productsData.length >= perPage);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [selectedCategory, selectedGender, priceRange, sortBy, searchQuery]);

  // Reset on filter change
  useEffect(() => {
    // Reset states
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);
    
    // Fetch with isReset=true to bypass loading check
    fetchProducts(1, true);
  }, [selectedCategory, selectedGender, priceRange[0], priceRange[1], sortBy, searchQuery]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !initialLoading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, initialLoading]);

  // Fetch next page (for pagination only)
  useEffect(() => {
    if (page > 1 && !loading) {
      fetchProducts(page, false);
    }
  }, [page]);

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 dark:text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Memuat produk...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Package className="h-20 w-20 text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Tidak ada produk ditemukan
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Coba ubah filter atau kata kunci pencarian
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={viewMode === "grid" 
        ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6" 
        : "flex flex-col gap-4"
      }>
        {products.map((product: Product, index: number) => (
          <div 
            key={`${product.id}-${index}`}
            className="animate-fade-in"
            style={{ animationDelay: `${(index % 8) * 50}ms` }}
          >
            <ProductCard
              id={product.id}
              name={product.nama}
              price={product.harga}
              image={product.gambar_url || product.gambar || 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop'}
              category={getKategoriName(product.kategori)}
              hasVariants={product.varians && product.varians.length > 0}
              rating={product.average_rating}
              ratingCount={product.rating_count}
            />
          </div>
        ))}
      </div>
      
      {/* Intersection Observer Target */}
      <div ref={observerTarget} className="flex justify-center py-8">
        {loading && (
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Memuat lebih banyak produk...</p>
          </div>
        )}
        {!hasMore && products.length > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Menampilkan {products.length} produk
          </p>
        )}
      </div>
    </>
  );
};

export default InfiniteCatalogGrid;

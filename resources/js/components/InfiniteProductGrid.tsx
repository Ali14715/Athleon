import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import ProductCard from "./ProductCard";
import { Loader2 } from "lucide-react";

interface Kategori {
  id: number;
  nama: string;
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

interface InfiniteProductGridProps {
  initialLimit?: number;
}

const InfiniteProductGrid = ({ initialLimit: _initialLimit = 12 }: InfiniteProductGridProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchProducts = useCallback(async (pageNum: number) => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/produk?page=${pageNum}`);
      const productsData = response.data?.data?.data || response.data?.data || response.data || [];
      
      if (productsData.length === 0) {
        setHasMore(false);
      } else {
        setProducts(prev => pageNum === 1 ? productsData : [...prev, ...productsData]);
        
        // Check if we got less than expected, meaning no more pages
        const perPage = response.data?.data?.per_page || 12;
        if (productsData.length < perPage) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
      if (pageNum === 1) setInitialLoading(false);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    fetchProducts(1);
  }, []);

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

  useEffect(() => {
    if (page > 1) {
      fetchProducts(page);
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
      <div className="text-center py-12 text-gray-600 dark:text-gray-400">
        <p>Tidak ada produk tersedia saat ini.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <div 
            key={product.id}
            className="animate-fade-in"
            style={{ animationDelay: `${(index % 8) * 50}ms` }}
          >
            <ProductCard
              id={product.id}
              name={product.nama}
              price={product.harga}
              image={product.gambar_url || product.gambar || 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop'}
              category={typeof product.kategori === 'object' ? product.kategori?.nama : product.kategori || 'Kategori'}
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
          <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada produk lagi</p>
        )}
      </div>
    </>
  );
};

export default InfiniteProductGrid;

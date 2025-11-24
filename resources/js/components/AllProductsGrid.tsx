import { useState, useEffect } from "react";
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
}

const AllProductsGrid = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/produk");
      // Handle paginated response: response.data.data.data
      const productsData = response.data?.data?.data || response.data?.data || response.data || [];
      // Show more products, e.g., 8 or 12
      setProducts(productsData.slice(0, 12));
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
          />
        </div>
      ))}
    </div>
  );
};

export default AllProductsGrid;

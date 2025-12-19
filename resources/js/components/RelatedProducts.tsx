import { useState, useEffect } from "react";
import axios from "axios";
import ProductCard from "./ProductCard";
import { Loader2 } from "lucide-react";

interface Product {
  id: number;
  nama: string;
  harga: number;
  gambar?: string;
  gambar_url?: string;
  kategori: string | { nama: string };
  kategori_id?: number;
  idKategori?: number; // Database field name
}

interface RelatedProductsProps {
  categoryId: number;
  currentProductId: number;
}

const RelatedProducts = ({ categoryId, currentProductId }: RelatedProductsProps) => {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedProducts();
  }, [categoryId, currentProductId]);

  const fetchRelatedProducts = async () => {
    try {
      const response = await axios.get("/api/produk");
      // Handle paginated response: response.data.data.data or response.data.data or response.data
      let productsData = response.data?.data?.data || response.data?.data || response.data || [];
      
      // Ensure it's an array
      if (!Array.isArray(productsData)) {
        productsData = [];
      }
      
      // Filter products: same category but not current product
      const filtered = productsData
        .filter((p: Product) => {
          const produkKategoriId = p.idKategori ?? p.kategori_id;
          return produkKategoriId === categoryId && p.id !== currentProductId;
        })
        .slice(0, 4); // Show max 4 products
      
      setRelatedProducts(filtered);
    } catch (error) {
      console.error("Error fetching related products:", error);
      setRelatedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-500" />
      </div>
    );
  }

  if (relatedProducts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        <p>Tidak ada produk terkait tersedia saat ini.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {relatedProducts.map((product) => {
        const categoryName = typeof product.kategori === 'object' ? product.kategori.nama : product.kategori;
        const imageUrl = product.gambar_url || product.gambar || '/storage/placeholder.png';
        
        return (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.nama}
            price={product.harga}
            image={imageUrl}
            category={categoryName || 'Uncategorized'}
          />
        );
      })}
    </div>
  );
};

export default RelatedProducts;

import { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Clock, X } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Product {
  id: number;
  nama: string;
  harga: number;
  gambar?: string;
  kategori: string;
}

const SEARCH_HISTORY_KEY = "athleon_search_history";
const MAX_HISTORY_ITEMS = 10;

const SearchDialog = ({ open, onOpenChange }: SearchDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchProducts();
      loadSearchHistory();
    }
  }, [open]);

  const loadSearchHistory = () => {
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  };

  const saveToHistory = (query: string) => {
    if (!query || query.trim().length < 2) return;
    
    try {
      const trimmedQuery = query.trim();
      let history = [...searchHistory];
      
      // Remove if already exists
      history = history.filter(item => item !== trimmedQuery);
      
      // Add to beginning
      history.unshift(trimmedQuery);
      
      // Limit to MAX_HISTORY_ITEMS
      history = history.slice(0, MAX_HISTORY_ITEMS);
      
      setSearchHistory(history);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
      setSearchHistory([]);
      toast.success("Riwayat pencarian berhasil dihapus");
    } catch (error) {
      console.error("Error clearing search history:", error);
      toast.error("Gagal menghapus riwayat pencarian");
    }
  };

  const removeHistoryItem = (query: string) => {
    try {
      const history = searchHistory.filter(item => item !== query);
      setSearchHistory(history);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Error removing history item:", error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/produk");
      const productsData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setAllProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = searchQuery
    ? allProducts.filter(product =>
        product.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.kategori.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleProductClick = (_product: Product) => {
    saveToHistory(searchQuery);
    onOpenChange(false);
  };

  const handleHistoryClick = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Cari Produk</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari produk atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && searchQuery === "" && (
            <div className="space-y-4">
              {searchHistory.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Riwayat Pencarian
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearHistory}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Hapus Semua
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {searchHistory.map((query, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 hover:bg-muted rounded-lg transition-colors group"
                      >
                        <button
                          onClick={() => handleHistoryClick(query)}
                          className="flex-1 text-left flex items-center gap-2"
                        >
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <span>{query}</span>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeHistoryItem(query);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ketik untuk mencari produk</p>
                </div>
              )}
            </div>
          )}

          {!loading && searchQuery !== "" && filteredProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Tidak ada produk yang ditemukan</p>
            </div>
          )}

          {!loading && filteredProducts.length > 0 && (
            <div className="space-y-2 mt-4">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${encodeURIComponent(product.nama.toLowerCase().replace(/\s+/g, '-'))}/${btoa(String(product.id))}`}
                  onClick={() => handleProductClick(product)}
                  className="flex items-center gap-4 p-3 hover:bg-muted rounded-lg transition-colors"
                >
                  <img 
                    src={product.gambar && product.gambar !== 'placeholder.svg' ? (product.gambar.startsWith('http') ? product.gambar : `/storage/${product.gambar}`) : '/storage/placeholder.svg'}
                    onError={(e) => { e.currentTarget.src = '/storage/placeholder.svg'; }} 
                    alt={product.nama}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{product.nama}</p>
                    <p className="text-sm text-muted-foreground">{product.kategori}</p>
                  </div>
                  <p className="font-bold text-primary">
                    Rp {product.harga.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;

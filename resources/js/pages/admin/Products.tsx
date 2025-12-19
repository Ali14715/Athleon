import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Package,
  Star,
  X,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import api, { isSuccess, getErrorMessage } from "@/lib/api";

type GalleryItem =
  | { id: string; kind: "existing"; url: string }
  | { id: string; kind: "new"; file: File; preview: string };
interface Product {
  id: number;
  idKategori?: number;
  nama: string;
  harga: number;
  stok: number;
  kategori: string | { id: number; nama: string; deskripsi?: string };
  jenisKelamin: string;
  deskripsi: string;
  gambar?: string | null;
  galeri?: string[] | null;
  varian?: Array<{
    ukuran?: string;
    harga?: number;
    stok?: number;
  }>;
  varians?: Array<{
    id: number;
    produk_id: number;
    nama_varian: string;
    nilai_varian: string;
    harga_tambahan: number;
    stok: number;
  }>;
}

interface CategoryOption {
  id: number;
  nama: string;
}

interface PaginationState {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
}

interface VariantRow {
  id: string;
  size: string;
  price: string;
  stock: string;
}

const perPageDefault = 12;

const initialFormState = {
  nama: "",
  harga: "",
  stok: "",
  kategoriId: "",
  jenisKelamin: "",
  deskripsi: "",
  gambar: "",
};

const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID").format(Number.isFinite(value) ? value : 0);

const getGenderLabel = (code: string) => {
  const map: Record<string, string> = { L: "Pria", P: "Wanita", U: "Unisex" };
  return map[code] || code;
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    perPage: perPageDefault,
    currentPage: 1,
    lastPage: 1,
  });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [formData, setFormData] = useState({ ...initialFormState });

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/api/admin/kategori");
      const categoriesData = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];

      const mapped: CategoryOption[] = categoriesData.map((item: { id: number; nama: string }) => ({
        id: item.id,
        nama: item.nama,
      }));

      setCategories(mapped);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Gagal memuat kategori");
      setCategories([]);
    }
  }, []);

  const fetchProducts = useCallback(
    async (pageNumber: number, searchTerm: string) => {
      setLoading(true);
      try {
        const response = await api.get("/api/admin/produk", {
          params: {
            page: pageNumber,
            per_page: pagination.perPage,
            search: searchTerm || undefined,
          },
        });

        // Handle different response formats
        let productsData = [];
        let paginationData = null;

        if (isSuccess(response)) {
          // API returns { success: true, data: [...], pagination: {...} }
          productsData = response.data.data || [];
          paginationData = response.data.pagination || null;
        } else if (Array.isArray(response.data)) {
          // API returns array directly
          productsData = response.data;
        } else if (response.data.data) {
          // API returns { data: [...] }
          productsData = response.data.data;
          paginationData = response.data.pagination || null;
        }

        setProducts(productsData);

        if (paginationData) {
          setPagination({
            total: paginationData.total ?? productsData.length,
            perPage: paginationData.per_page ?? pagination.perPage,
            currentPage: paginationData.current_page ?? pageNumber,
            lastPage: paginationData.last_page ?? 1,
          });
        } else {
          const totalItems = productsData.length;
          const lastPage = Math.max(1, Math.ceil(totalItems / pagination.perPage));
          setPagination((prev) => ({
            ...prev,
            total: totalItems,
            currentPage: pageNumber,
            lastPage,
          }));
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Gagal memuat produk");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [pagination.perPage]
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts(page, search);
  }, [fetchProducts, page, search]);

  const resetGalleryState = () => {
    setGalleryItems([]);
    setDraggingId(null);
  };

  const resetFormState = () => {
    setFormData({ ...initialFormState });
    setImageFile(null);
    setImagePreview("");
    resetGalleryState();
    setVariants([]);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditMode(false);
      setSelectedProduct(null);
      resetFormState();
    }
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleResetSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const canPrev = pagination.currentPage > 1;
  const canNext = pagination.currentPage < pagination.lastPage;

  const openAddDialog = () => {
    setEditMode(false);
    setSelectedProduct(null);
    resetFormState();
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditMode(true);
    setSelectedProduct(product);
    setImageFile(null);

    const rawGallery = Array.isArray(product.galeri)
      ? product.galeri.filter(Boolean)
      : [];
    const coverImageRaw = product.gambar || rawGallery[0] || "";
    // Handle cover image path correctly
    const coverImage = coverImageRaw && !coverImageRaw.startsWith('http') && !coverImageRaw.startsWith('/storage/')
      ? `/storage/${coverImageRaw}`
      : coverImageRaw;
    const galleryWithoutCover = rawGallery.filter((item) => item !== product.gambar);

    setGalleryItems(
      galleryWithoutCover.map((url, index) => {
        // Handle path correctly: if it doesn't start with http or /storage/, prepend /storage/
        const fullUrl = url.startsWith('http') || url.startsWith('/storage/') 
          ? url 
          : `/storage/${url}`;
        
        return {
          id: generateId(`existing-${product.id}-${index}`),
          kind: "existing" as const,
          url: fullUrl,
        };
      })
    );
    setDraggingId(null);
    setImagePreview(coverImage);

    const kategoriId =
      product.idKategori ??
      (typeof product.kategori === "object" ? product.kategori.id : undefined);

    // Parse harga safely - handle null, undefined, string with separators, etc.
    const parsePrice = (value: any): string => {
      if (value == null) return "0";
      // If it's a string, remove any thousand separators (dots or commas for formatting)
      const cleaned = String(value).replace(/[.,]/g, (match, offset, str) => {
        // Keep the last dot/comma as decimal separator if there are digits after
        const remaining = str.slice(offset + 1);
        if (remaining.length <= 2 && /^\d+$/.test(remaining)) {
          return '.'; // It's a decimal separator
        }
        return ''; // It's a thousand separator, remove it
      });
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? "0" : Math.floor(parsed).toString();
    };

    const productHarga = parsePrice(product.harga);

    setFormData({
      nama: product.nama,
      harga: productHarga,
      stok: (product.stok ?? 0).toString(),
      kategoriId: kategoriId ? kategoriId.toString() : "",
      jenisKelamin: product.jenisKelamin || "",
      deskripsi: product.deskripsi,
      gambar: coverImage,
    });

    // Try to read from varians relation first (from database), fallback to varian JSON
    let variantRows: VariantRow[] = [];
    const baseHarga = parseFloat(productHarga) || 0;
    
    if (Array.isArray(product.varians) && product.varians.length > 0) {
      // Load from varians relation (ProdukVarian table)
      variantRows = product.varians.map((variant, index) => ({
        id: generateId(`variant-${product.id}-${index}`),
        size: variant.nilai_varian?.toString() ?? "",
        price: variant.harga_tambahan != null 
          ? (baseHarga + (parseFloat(String(variant.harga_tambahan)) || 0)).toString() 
          : productHarga,
        stock: variant.stok != null ? variant.stok.toString() : "",
      }));
    } else if (Array.isArray(product.varian)) {
      // Fallback to varian JSON field
      variantRows = product.varian.map((variant, index) => ({
        id: generateId(`variant-${product.id}-${index}`),
        size: variant.ukuran?.toString() ?? "",
        price: variant.harga != null ? parsePrice(variant.harga) : "",
        stock: variant.stok != null ? variant.stok.toString() : "",
      }));
    }
    
    setVariants(variantRows);
    setDialogOpen(true);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Format file harus JPG, PNG, atau WebP");
      return;
    }

    setImageFile(file);
    setFormData((prev) => ({ ...prev, gambar: "" }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryFilesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const accepted: File[] = [];

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} melebihi ukuran maksimal 5MB`);
        return;
      }

      if (!validTypes.includes(file.type)) {
        toast.error(`Format file ${file.name} tidak didukung`);
        return;
      }

      accepted.push(file);
    });

    if (accepted.length === 0) {
      event.target.value = "";
      return;
    }

    const previews = await Promise.all(
      accepted.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          })
      )
    );

    const newItems = accepted.map((file, index) => ({
      id: generateId("new"),
      kind: "new" as const,
      file,
      preview: previews[index],
    }));

    setGalleryItems((prev) => [...prev, ...newItems]);
    event.target.value = "";
  };

  const removeGalleryItem = (itemId: string) => {
    setGalleryItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const promoteGalleryItemAsCover = (itemId: string) => {
    setGalleryItems((prev) => {
      const index = prev.findIndex((item) => item.id === itemId);
      if (index === -1) {
        return prev;
      }

      const updated = [...prev];
      const selected = updated[index];
      
      // Set as cover without removing from gallery
      if (selected.kind === "existing") {
        setImageFile(null);
        setFormData((form) => ({ ...form, gambar: selected.url }));
        setImagePreview(selected.url);
      } else {
        setImageFile(selected.file);
        setFormData((form) => ({ ...form, gambar: "" }));
        setImagePreview(selected.preview);
      }
      
      // Move to first position in gallery
      updated.splice(index, 1);
      updated.unshift(selected);
      
      return updated;
    });
  };

  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      { id: generateId("variant"), size: "", price: "", stock: "" },
    ]);
  };

  const updateVariantRow = (id: string, field: "size" | "price" | "stock", value: string) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.id === id ? { ...variant, [field]: value } : variant
      )
    );
  };

  const removeVariantRow = (id: string) => {
    setVariants((prev) => prev.filter((variant) => variant.id !== id));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const idKategori = Number(formData.kategoriId);
      const selectedCategory = categories.find((category) => category.id === idKategori);

      if (!idKategori || !selectedCategory) {
        toast.error("Kategori tidak valid");
        setSubmitting(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("idKategori", idKategori.toString());
      formDataToSend.append("kategori", selectedCategory.nama);
      formDataToSend.append("nama", formData.nama);
      formDataToSend.append("harga", formData.harga || "0");
      formDataToSend.append("stok", formData.stok || "0");
      formDataToSend.append("jenisKelamin", formData.jenisKelamin);
      formDataToSend.append("deskripsi", formData.deskripsi);

      const filesToUpload: File[] = [];
      const pushFile = (file: File) => {
        const index = filesToUpload.length;
        filesToUpload.push(file);
        return index;
      };

      let coverFromGalleryId: string | null = null;
      let coverDescriptor: { type: "existing" | "url" | "file"; value: string | number } | null = null;

      if (imageFile) {
        coverDescriptor = { type: "file", value: pushFile(imageFile) };
      } else if (formData.gambar) {
        const descriptorType = formData.gambar.startsWith("http") ? "url" : "existing";
        coverDescriptor = { type: descriptorType, value: formData.gambar };
      } else if (galleryItems.length > 0) {
        const firstGalleryItem = galleryItems[0];
        coverFromGalleryId = firstGalleryItem.id;
        if (firstGalleryItem.kind === "existing") {
          coverDescriptor = { type: "existing", value: firstGalleryItem.url };
        } else {
          coverDescriptor = { type: "file", value: pushFile(firstGalleryItem.file) };
        }
      }

      if (!coverDescriptor) {
        toast.error("Tambahkan minimal satu gambar produk");
        setSubmitting(false);
        return;
      }

      const galleryOrder: Array<{ type: "existing" | "url" | "file"; value: string | number }> = [coverDescriptor];

      galleryItems.forEach((item) => {
        if (item.id === coverFromGalleryId) {
          return;
        }

        if (item.kind === "existing") {
          galleryOrder.push({ type: "existing", value: item.url });
        } else {
          const index = pushFile(item.file);
          galleryOrder.push({ type: "file", value: index });
        }
      });

      filesToUpload.forEach((file) => {
        formDataToSend.append("gallery_files[]", file);
      });

      if (galleryOrder.length > 0) {
        formDataToSend.append("gallery_order", JSON.stringify(galleryOrder));
      }

      const preparedVariants = variants
        .map((variant) => ({
          size: variant.size.trim(),
          price: variant.price.trim(),
          stock: variant.stock.trim(),
        }))
        .filter((variant) => variant.size !== "");

      if (preparedVariants.length > 0) {
        const variantPayload = preparedVariants.map((variant) => ({
          size: variant.size,
          price: Number(variant.price || 0),
          stock: Number(variant.stock || 0),
        }));

        formDataToSend.append("variants", JSON.stringify(variantPayload));
      }

      if (editMode && selectedProduct) {
        formDataToSend.append("_method", "PUT");
        await api.post(`/api/admin/produk/${selectedProduct.id}`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success("Produk berhasil diupdate");
      } else {
        await api.post("/api/admin/produk", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Produk berhasil ditambahkan");
      }

      handleDialogChange(false);
      // Force refresh products list
      setProducts([]);
      await fetchProducts(page, search);
    } catch (error: any) {
      console.error("Error submitting product:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      return;
    }

    try {
      await api.delete(`/api/admin/produk/${id}`);
      toast.success("Produk berhasil dihapus");

      const nextPage = products.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) {
        setPage(nextPage);
      }
      await fetchProducts(nextPage, search);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Gagal menghapus produk");
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Manajemen Produk">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manajemen Produk">
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Daftar Produk</h3>
            <p className="text-sm text-muted-foreground">
              Kelola stok, varian ukuran, dan galeri setiap produk.
            </p>
          </div>
          <Button
            onClick={openAddDialog}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
            size="lg"
          >
            <Plus className="h-4 w-4" />
            Tambah Produk
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Filter Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4"
            >
              <Input
                placeholder="Cari nama produk, kategori, atau gender"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="md:flex-1"
              />
              <div className="flex gap-2">
                <Button type="submit" className="shadow-sm hover:shadow-md">
                  Cari
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetSearch}
                  className="shadow-sm hover:shadow-md"
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            // Read variant count from varians relation first, fallback to varian JSON
            const variantCount = Array.isArray(product.varians) && product.varians.length > 0
              ? product.varians.length
              : Array.isArray(product.varian) 
              ? product.varian.length 
              : 0;
            const galleryCount = Array.isArray(product.galeri)
              ? product.galeri.length
              : product.gambar
              ? 1
              : 0;

            return (
              <Card
                key={product.id}
                className="border-border/60 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <CardContent className="space-y-3 p-4">
                  <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                    <img
                      src={
                        product.gambar && product.gambar !== 'placeholder.svg'
                          ? (product.gambar.startsWith('http') || product.gambar.startsWith('/storage/') ? product.gambar : `/storage/${product.gambar}`)
                          : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext x="200" y="200" text-anchor="middle" fill="%239ca3af" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E'
                      }
                      alt={product.nama}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext x="200" y="200" text-anchor="middle" fill="%239ca3af" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{product.nama}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {typeof product.kategori === "object" ? product.kategori.nama : product.kategori}
                      {product.jenisKelamin ? ` · ${getGenderLabel(product.jenisKelamin)}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {galleryCount} Foto
                      </Badge>
                      <Badge variant="outline" className="bg-muted/60">
                        {variantCount} Varian
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={
                          product.stok === 0 
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700 font-semibold"
                            : product.stok < 10 
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 font-semibold"
                            : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700"
                        }
                      >
                        {product.stok === 0 ? "⚠️ Stok Habis" : product.stok < 10 ? `⚡ Stok ${product.stok}` : `✓ Stok ${product.stok}`}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        Rp {formatCurrency(typeof product.harga === 'string' ? parseFloat(product.harga) : product.harga)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      onClick={() => openEditDialog(product)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {products.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-600 opacity-50" />
              <p className="text-gray-600 dark:text-gray-400">Belum ada produk</p>
            </CardContent>
          </Card>
        )}

        {products.length > 0 && (
          <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan halaman {pagination.currentPage} dari {pagination.lastPage} ({pagination.total} produk)
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => canPrev && setPage((prev) => Math.max(1, prev - 1))}
                disabled={!canPrev}
                className="shadow-sm hover:shadow-md"
              >
                Sebelumnya
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => canNext && setPage((prev) => Math.min(pagination.lastPage, prev + 1))}
                disabled={!canNext}
                className="shadow-sm hover:shadow-md"
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nama">Nama Produk</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(event) => setFormData({ ...formData, nama: event.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="harga">Harga Dasar</Label>
                  <Input
                    id="harga"
                    type="number"
                    min="0"
                    value={formData.harga}
                    onChange={(event) => setFormData({ ...formData, harga: event.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stok">Stok Total</Label>
                  <Input
                    id="stok"
                    type="number"
                    min="0"
                    value={formData.stok}
                    onChange={(event) => setFormData({ ...formData, stok: event.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="kategori">Kategori</Label>
                  <Select
                    value={formData.kategoriId}
                    onValueChange={(value) => setFormData({ ...formData, kategoriId: value })}
                    required
                    disabled={categories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          categories.length === 0
                            ? "Tambah kategori dulu"
                            : "Pilih kategori"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {categories.length === 0 ? (
                        <SelectItem value="" disabled>
                          Belum ada kategori
                        </SelectItem>
                      ) : (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.nama}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
                  <Select
                    value={formData.jenisKelamin}
                    onValueChange={(value) => setFormData({ ...formData, jenisKelamin: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="L">Pria</SelectItem>
                      <SelectItem value="P">Wanita</SelectItem>
                      <SelectItem value="U">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Textarea
                  id="deskripsi"
                  rows={4}
                  value={formData.deskripsi}
                  onChange={(event) => setFormData({ ...formData, deskripsi: event.target.value })}
                />
              </div>

              <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Varian Ukuran</h4>
                    <p className="text-xs text-muted-foreground">
                      Tambahkan harga dan stok berbeda untuk setiap ukuran. Harga dasar akan mengikuti varian termurah.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addVariantRow} className="shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Varian
                  </Button>
                </div>
                <div className="space-y-3">
                  {variants.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Belum ada varian. Tekan tombol "Varian" untuk mulai menambahkan.
                    </p>
                  )}
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="grid gap-2 rounded-md border bg-background p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
                    >
                      <div className="grid gap-1">
                        <Label className="text-xs text-muted-foreground">Ukuran</Label>
                        <Input
                          value={variant.size}
                          onChange={(event) => updateVariantRow(variant.id, "size", event.target.value)}
                          placeholder="Contoh: S, M, L"
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs text-muted-foreground">Harga</Label>
                        <Input
                          type="number"
                          min="0"
                          value={variant.price}
                          onChange={(event) => updateVariantRow(variant.id, "price", event.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs text-muted-foreground">Stok</Label>
                        <Input
                          type="number"
                          min="0"
                          value={variant.stock}
                          onChange={(event) => updateVariantRow(variant.id, "stock", event.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeVariantRow(variant.id)}
                        aria-label="Hapus varian"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold">Cover Produk</h4>
                    <p className="text-xs text-muted-foreground">
                      Cover akan tampil pertama pada halaman produk. Upload file baru untuk mengubah cover (opsional).
                    </p>
                  </div>
                  {editMode && imagePreview && !imageFile && (
                    <div className="text-sm text-muted-foreground p-2 bg-muted rounded border">
                      <span className="font-medium">Cover saat ini: </span>
                      <span>{formData.gambar?.split('/').pop() || 'cover.jpg'}</span>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  {imagePreview && (
                    <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-lg border">
                      <img 
                        src={imagePreview} 
                        alt="Preview cover" 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext x="200" y="200" text-anchor="middle" fill="%239ca3af" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold">Galeri Produk</h4>
                    <p className="text-xs text-muted-foreground">
                      Tambahkan gambar detail dan atur urutannya dengan drag & drop.
                    </p>
                  </div>
                  <Input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleGalleryFilesChange}
                    className="cursor-pointer"
                  />
                  {galleryItems.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {galleryItems.map((item) => {
                          const preview = item.kind === "existing" ? item.url : item.preview;
                          const isDragging = draggingId === item.id;

                          return (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={() => setDraggingId(item.id)}
                              onDragEnter={() => {
                                if (!draggingId || draggingId === item.id) {
                                  return;
                                }
                                setGalleryItems((prev) => {
                                  const updated = [...prev];
                                  const fromIndex = updated.findIndex((entry) => entry.id === draggingId);
                                  const toIndex = updated.findIndex((entry) => entry.id === item.id);
                                  if (fromIndex === -1 || toIndex === -1) {
                                    return prev;
                                  }
                                  const [moved] = updated.splice(fromIndex, 1);
                                  updated.splice(toIndex, 0, moved);
                                  return updated;
                                });
                              }}
                              onDragOver={(event) => event.preventDefault()}
                              onDragEnd={() => setDraggingId(null)}
                              className={`relative space-y-2 rounded-md border bg-background p-2 transition ${isDragging ? "opacity-50" : ""}`}
                            >
                              <div className="relative aspect-square overflow-hidden rounded-md">
                                <img 
                                  src={preview} 
                                  alt="Galeri" 
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext x="200" y="200" text-anchor="middle" fill="%239ca3af" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';
                                  }}
                                />
                                <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-background/80 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                                  <GripVertical className="h-3 w-3" /> Tarik
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  className="flex-1 justify-center gap-1 py-1"
                                  onClick={() => promoteGalleryItemAsCover(item.id)}
                                >
                                  <Star className="h-3 w-3" /> Cover
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="flex-1 justify-center gap-1 py-1 text-destructive hover:text-destructive"
                                  onClick={() => removeGalleryItem(item.id)}
                                >
                                  <Trash2 className="h-3 w-3" /> Hapus
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div
                        className="flex h-12 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (!draggingId) {
                            return;
                          }
                          setGalleryItems((prev) => {
                            const updated = [...prev];
                            const fromIndex = updated.findIndex((item) => item.id === draggingId);
                            if (fromIndex === -1 || fromIndex === updated.length - 1) {
                              return prev;
                            }
                            const [moved] = updated.splice(fromIndex, 1);
                            updated.push(moved);
                            return updated;
                          });
                          setDraggingId(null);
                        }}
                      >
                        Lepaskan di sini untuk memindahkan ke akhir
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Belum ada galeri tambahan.</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="shadow-sm hover:shadow-md">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminProducts;

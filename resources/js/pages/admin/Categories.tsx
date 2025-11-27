import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Edit, Trash2, ImageOff } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";

interface Category {
  id: number;
  nama: string;
  deskripsi?: string | null;
  gambar?: string | null;
  gambar_url?: string | null;
  produk_count?: number;
}

interface FormState {
  nama: string;
  deskripsi: string;
  gambarUrl: string;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(9);
  const [formData, setFormData] = useState<FormState>({
    nama: "",
    deskripsi: "",
    gambarUrl: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/admin/kategori");
      const payload = Array.isArray(response.data)
        ? response.data
        : response.data?.data ?? [];
      setCategories(payload);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
      toast.error("Gagal memuat kategori");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ nama: "", deskripsi: "", gambarUrl: "" });
    setImageFile(null);
    setImagePreview("");
    setSelectedCategory(null);
    setEditMode(false);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditMode(true);
    setSelectedCategory(category);
    setFormData({
      nama: category.nama,
      deskripsi: category.deskripsi ?? "",
      gambarUrl: category.gambar && category.gambar.startsWith("http")
        ? category.gambar
        : category.gambar_url ?? "",
    });
    setImagePreview(category.gambar_url ?? "");
    setImageFile(null);
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
    setFormData((prev) => ({ ...prev, gambarUrl: "" }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("nama", formData.nama);
      if (formData.deskripsi) {
        formDataToSend.append("deskripsi", formData.deskripsi);
      }

      if (imageFile) {
        formDataToSend.append("gambar", imageFile);
      } else if (formData.gambarUrl) {
        formDataToSend.append("gambar_url", formData.gambarUrl);
      }

      if (editMode && selectedCategory) {
        formDataToSend.append("_method", "PUT");
        await api.post(
          `/api/admin/kategori/${selectedCategory.id}`,
          formDataToSend,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        toast.success("Kategori berhasil diperbarui");
      } else {
        await api.post("/api/admin/kategori", formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Kategori berhasil ditambahkan");
      }

      setDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Hapus kategori ${category.nama}?`)) {
      return;
    }

    try {
      await api.delete(`/api/admin/kategori/${category.id}`);
      toast.success("Kategori berhasil dihapus");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Gagal menghapus kategori");
    }
  };

  return (
    <AdminLayout title="Manajemen Kategori">
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Kategori</h3>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Kategori
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.slice((page - 1) * perPage, page * perPage).map((category) => (
              <Card key={category.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                    {category.gambar_url ? (
                      <img
                        src={category.gambar_url}
                        alt={category.nama}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageOff className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{category.nama}</h4>
                    {category.deskripsi && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {category.deskripsi}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {category.produk_count ?? 0} produk
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openEditDialog(category)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(category)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="rounded-lg border border-dashed p-12 text-center text-gray-600 dark:text-gray-400">
              Belum ada kategori.
            </div>
          )}

          {categories.length > perPage && (
            <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Menampilkan {(page - 1) * perPage + 1} - {Math.min(page * perPage, categories.length)} dari {categories.length} kategori
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Sebelumnya
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(Math.ceil(categories.length / perPage), p + 1))}
                  disabled={page >= Math.ceil(categories.length / perPage)}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, nama: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Textarea
                id="deskripsi"
                rows={3}
                value={formData.deskripsi}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, deskripsi: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gambarFile">Upload Gambar</Label>
              <Input
                id="gambarFile"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
              />
              <p className="text-xs text-muted-foreground">
                Format: JPG, PNG, WebP. Maksimal 5MB.
              </p>
            </div>

            <div className="text-center text-xs text-muted-foreground">atau gunakan URL</div>

            <div className="space-y-2">
              <Label htmlFor="gambarUrl">URL Gambar</Label>
              <Input
                id="gambarUrl"
                type="url"
                value={formData.gambarUrl}
                onChange={(event) => {
                  setImageFile(null);
                  setImagePreview(event.target.value);
                  setFormData((prev) => ({ ...prev, gambarUrl: event.target.value }));
                }}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {imagePreview && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="aspect-video w-full overflow-hidden rounded-lg border">
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
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

export default AdminCategories;

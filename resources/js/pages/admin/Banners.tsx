import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";

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

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(6);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null as File | null,
    link_url: "",
    button_text: "",
    is_active: true,
    order: 0,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await api.get("/api/admin/banners");
      // Handle new API format: { status_code, message, data }
      const bannersData = response.data?.data || response.data || [];
      setBanners(Array.isArray(bannersData) ? bannersData : []);
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        description: banner.description || "",
        image: null,
        link_url: banner.link_url || "",
        button_text: banner.button_text || "",
        is_active: banner.is_active,
        order: banner.order,
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: "",
        description: "",
        image: null,
        link_url: "",
        button_text: "",
        is_active: true,
        order: banners.length,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = new FormData();
      
      data.append("title", formData.title);
      data.append("description", formData.description);
      if (formData.image) {
        data.append("image", formData.image);
      }
      data.append("link_url", formData.link_url);
      data.append("button_text", formData.button_text);
      data.append("is_active", formData.is_active ? "1" : "0");
      data.append("order", formData.order.toString());

      if (editingBanner) {
        data.append("_method", "PUT");
        await api.post(`/api/admin/banners/${editingBanner.id}`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Banner berhasil diupdate");
      } else {
        await api.post("/api/admin/banners", data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Banner berhasil ditambahkan");
      }

      setDialogOpen(false);
      fetchBanners();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus banner ini?")) return;

    try {
      await api.delete(`/api/admin/banners/${id}`);
      toast.success("Banner berhasil dihapus");
      fetchBanners();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Banner Management">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Banner Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Banner Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Kelola banner promo di halaman utama</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Banner
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {banners.slice((page - 1) * perPage, page * perPage).map((banner) => (
            <Card key={banner.id} className="overflow-hidden">
              <div className="relative h-48">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                {!banner.is_active && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-bold">INACTIVE</span>
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{banner.title}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {banner.description || "No description"}
                    </CardDescription>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Order: {banner.order}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {banner.link_url && (
                    <div className="text-muted-foreground truncate">
                      🔗 {banner.link_url}
                    </div>
                  )}
                  {banner.button_text && (
                    <div className="text-muted-foreground">
                      Button: "{banner.button_text}"
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Switch checked={banner.is_active} disabled />
                    <span className="text-xs">{banner.is_active ? "Active" : "Inactive"}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleOpenDialog(banner)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(banner.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {banners.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ImageIcon className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">Belum ada banner</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Banner Pertama
              </Button>
            </CardContent>
          </Card>
        )}

        {banners.length > perPage && (
          <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan {(page - 1) * perPage + 1} - {Math.min(page * perPage, banners.length)} dari {banners.length} banner
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
                onClick={() => setPage(p => Math.min(Math.ceil(banners.length / perPage), p + 1))}
                disabled={page >= Math.ceil(banners.length / perPage)}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Edit Banner" : "Tambah Banner"}</DialogTitle>
            <DialogDescription>
              {editingBanner
                ? "Update informasi banner yang ditampilkan di homepage"
                : "Buat banner baru yang akan ditampilkan di homepage"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Judul Banner *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Diskon Besar-besaran!"
              />
            </div>

            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Dapatkan diskon hingga 50% untuk semua produk pilihan"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="image">
                Gambar Banner {editingBanner ? "(Kosongkan jika tidak ingin mengganti)" : "*"}
              </Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.files?.[0] || null })
                }
                required={!editingBanner}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Rekomendasi: 1920x600px, maksimal 2MB
              </p>
              {editingBanner && (
                <div className="mt-2">
                  <img
                    src={editingBanner.image_url}
                    alt="Current"
                    className="h-32 rounded border"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="link_url">Link URL</Label>
              <Input
                id="link_url"
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="/catalog atau https://example.com"
              />
            </div>

            <div>
              <Label htmlFor="button_text">Teks Button</Label>
              <Input
                id="button_text"
                value={formData.button_text}
                onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                placeholder="Shop Now"
              />
            </div>

            <div>
              <Label htmlFor="order">Urutan</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                min={0}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Angka lebih kecil akan muncul lebih dulu
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Banner Aktif</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingBanner ? "Update" : "Tambah"} Banner
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

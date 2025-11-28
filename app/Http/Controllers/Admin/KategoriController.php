<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kategori;
use App\Models\Produk;
use App\Traits\CloudinaryUploadTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class KategoriController extends Controller
{
    use CloudinaryUploadTrait;

    public function index()
    {
        $kategori = Kategori::query()->withCount('produk')->latest()->get();

        return $this->successResponse($kategori, 'Daftar kategori berhasil diambil');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:100',
            'deskripsi' => 'nullable|string',
            'gambar' => 'nullable|file|image|mimes:jpg,jpeg,png,webp|max:5120',
            'gambar_url' => 'nullable|url',
        ]);

        $validated['gambar'] = $this->handleImageUpload($request);

        $kategori = Kategori::create($validated);

        return $this->createdResponse($kategori, 'Kategori berhasil ditambahkan');
    }

    public function update(Request $request, Kategori $kategori)
    {
        $validated = $request->validate([
            'nama' => 'sometimes|required|string|max:100',
            'deskripsi' => 'nullable|string',
            'gambar' => 'nullable|file|image|mimes:jpg,jpeg,png,webp|max:5120',
            'gambar_url' => 'nullable|url',
        ]);

        $newPath = $this->handleImageUpload($request, $kategori);
        if ($newPath !== null) {
            $validated['gambar'] = $newPath;
        }

        $originalName = $kategori->nama;
        $kategori->update($validated);

        if (array_key_exists('nama', $validated) && $validated['nama'] !== $originalName) {
            Produk::where('idKategori', $kategori->id)->update(['kategori' => $kategori->nama]);
        }

        return $this->successResponse($kategori->fresh(), 'Kategori berhasil diperbarui');
    }

    public function destroy(Kategori $kategori)
    {
        // Delete from Cloudinary if it's a Cloudinary URL
        if ($kategori->gambar) {
            $service = $this->getCloudinaryService();
            if ($service->isCloudinaryUrl($kategori->gambar)) {
                $this->deleteFromCloudinary($kategori->gambar);
            } elseif (!str_starts_with($kategori->gambar, 'http') && basename($kategori->gambar) !== 'placeholder.png') {
                // Delete from local storage (legacy)
                Storage::disk('public')->delete($kategori->gambar);
            }
        }

        $kategori->delete();

        return $this->successResponse(null, 'Kategori berhasil dihapus');
    }

    private function handleImageUpload(Request $request, ?Kategori $kategori = null): ?string
    {
        if ($request->hasFile('gambar')) {
            // Delete old image
            if ($kategori && $kategori->gambar) {
                $service = $this->getCloudinaryService();
                if ($service->isCloudinaryUrl($kategori->gambar)) {
                    $this->deleteFromCloudinary($kategori->gambar);
                } elseif (!str_starts_with($kategori->gambar, 'http') && basename($kategori->gambar) !== 'placeholder.png') {
                    Storage::disk('public')->delete($kategori->gambar);
                }
            }

            // Upload to Cloudinary
            $cloudinaryUrl = $this->uploadCategoryImage($request->file('gambar'));
            if ($cloudinaryUrl) {
                return $cloudinaryUrl;
            }

            // Fallback to local storage if Cloudinary fails
            $file = $request->file('gambar');
            $filename = time() . '_' . uniqid('', true) . '.' . $file->getClientOriginalExtension();
            return $file->storeAs('kategori', $filename, 'public');
        }

        if ($request->filled('gambar_url')) {
            // Delete old image
            if ($kategori && $kategori->gambar) {
                $service = $this->getCloudinaryService();
                if ($service->isCloudinaryUrl($kategori->gambar)) {
                    $this->deleteFromCloudinary($kategori->gambar);
                } elseif (!str_starts_with($kategori->gambar, 'http') && basename($kategori->gambar) !== 'placeholder.png') {
                    Storage::disk('public')->delete($kategori->gambar);
                }
            }

            return $request->input('gambar_url');
        }

        return $kategori?->gambar;
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Produk;
use App\Models\Kategori;
use App\Models\ProdukVarian;
use App\Traits\CloudinaryUploadTrait;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ProdukController extends Controller
{
    use CloudinaryUploadTrait;
    private function processVariants(Request $request): array
    {
        $raw = $request->input('variants');
        if (!$raw) {
            return [null, null, null];
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return [null, null, null];
        }

        $variants = collect($decoded)
            ->filter(function ($variant) {
                return isset($variant['size']) && $variant['size'] !== '' && isset($variant['price']);
            })
            ->map(function ($variant) {
                return [
                    'ukuran' => (string) ($variant['size'] ?? ''),
                    'harga' => isset($variant['price']) ? (float) $variant['price'] : 0,
                    'stok' => isset($variant['stock']) ? (int) $variant['stock'] : 0,
                ];
            })
            ->values();

        if ($variants->isEmpty()) {
            return [null, null, null];
        }

        $basePrice = $variants->min('harga');
        $totalStock = $variants->sum('stok');

        return [$variants->toArray(), $basePrice, $totalStock];
    }

    private function syncVariantsToDatabase(Produk $produk, ?array $variants): void
    {
        if ($variants === null || empty($variants)) {
            // Delete all variants if none provided
            $produk->varians()->delete();
            return;
        }

        // Delete existing variants
        $produk->varians()->delete();

        // Create new variants
        foreach ($variants as $variant) {
            ProdukVarian::create([
                'produk_id' => $produk->id,
                'nama_varian' => 'Ukuran',
                'nilai_varian' => $variant['ukuran'],
                'harga_tambahan' => $variant['harga'] - $produk->harga, // Store as price difference from base
                'stok' => $variant['stok'],
            ]);
        }
    }

    private function processSizeGuide(Request $request): ?array
    {
        $raw = $request->input('size_guide');
        if (!$raw) {
            return null;
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return null;
        }

        $guide = collect($decoded)
            ->filter(fn ($row) => isset($row['size']) && $row['size'] !== '')
            ->map(function ($row) {
                return [
                    'size' => (string) ($row['size'] ?? ''),
                    'chest' => $row['chest'] ?? null,
                    'length' => $row['length'] ?? null,
                    'shoulder' => $row['shoulder'] ?? null,
                ];
            })
            ->values();

        return $guide->isEmpty() ? null : $guide->toArray();
    }

    private function processGallery(Request $request, ?Produk $produk): array
    {
        $hasOrder = $request->filled('gallery_order');
        $hasFiles = $request->hasFile('gallery_files');
        $hasCoverFile = $request->hasFile('gambar');

        // If no changes to gallery at all, keep existing
        if ($produk && !$hasOrder && !$hasFiles && !$hasCoverFile) {
            $existing = $this->existingGalleryPaths($produk);
            $cover = $produk->gambar ?? ($existing[0] ?? null);
            $gallery = $produk->galeri ?? $existing;

            return [$cover, $gallery ?? [], false];
        }

        $existing = $produk ? $this->existingGalleryPaths($produk) : [];
        $finalGallery = [];
        $uploadedFiles = $request->file('gallery_files', []);

        $galleryOrder = $hasOrder ? json_decode($request->input('gallery_order', '[]'), true) : [];
        if (!is_array($galleryOrder)) {
            $galleryOrder = [];
        }

        if (!empty($galleryOrder)) {
            foreach ($galleryOrder as $item) {
                $type = $item['type'] ?? null;
                $value = $item['value'] ?? null;

                if (!$type) {
                    continue;
                }

                if ($type === 'existing') {
                    // Normalize path: remove /storage/ prefix if exists for comparison
                    $normalizedValue = $value;
                    if (str_starts_with($value, '/storage/')) {
                        $normalizedValue = substr($value, strlen('/storage/'));
                    }
                    
                    // Check if exists in normalized existing paths
                    $found = false;
                    foreach ($existing as $existingPath) {
                        $normalizedExisting = $existingPath;
                        if (str_starts_with($existingPath, '/storage/')) {
                            $normalizedExisting = substr($existingPath, strlen('/storage/'));
                        }
                        if ($normalizedValue === $normalizedExisting) {
                            $finalGallery[] = $existingPath;
                            $found = true;
                            break;
                        }
                    }
                } elseif ($type === 'url') {
                    if ($value && filter_var($value, FILTER_VALIDATE_URL)) {
                        $finalGallery[] = $value;
                    }
                } elseif ($type === 'file') {
                    if (is_numeric($value) && isset($uploadedFiles[$value])) {
                        $storedPath = $this->storeGalleryFile($uploadedFiles[$value]);
                        if ($storedPath) {
                            $finalGallery[] = $storedPath;
                        }
                    }
                }
            }
        } else {
            // Fallback: keep existing and add new uploads
            $finalGallery = $existing;
            foreach ($uploadedFiles as $file) {
                $storedPath = $this->storeGalleryFile($file);
                if ($storedPath) {
                    $finalGallery[] = $storedPath;
                }
            }
        }

        // Only cleanup files that are truly removed
        $this->cleanupRemovedGallery($existing, $finalGallery);

        // Handle cover image
        $cover = null;
        if ($hasCoverFile) {
            // Store the new cover file with proper permissions
            $coverFile = $request->file('gambar');
            $storedCover = $this->storeGalleryFile($coverFile);
            if ($storedCover) {
                $cover = $storedCover;
                // Add to gallery if not already there
                if (!in_array($storedCover, $finalGallery)) {
                    array_unshift($finalGallery, $storedCover);
                }
            }
        } else {
            // Use first item from finalGallery as cover (respects gallery_order from frontend)
            $cover = $finalGallery[0] ?? $produk?->gambar ?? null;
        }

        return [$cover, array_values($finalGallery), true];
    }

    private function existingGalleryPaths(Produk $produk): array
    {
        $gallery = $produk->galeri ?? [];
        
        // Handle if galeri is JSON string
        if (is_string($gallery)) {
            $gallery = json_decode($gallery, true) ?? [];
        }
        
        // Ensure it's an array
        if (!is_array($gallery)) {
            $gallery = [];
        }

        if (empty($gallery)) {
            return $produk->gambar ? [$produk->gambar] : [];
        }

        if ($produk->gambar && !in_array($produk->gambar, $gallery, true)) {
            array_unshift($gallery, $produk->gambar);
        }

        return array_values(array_unique($gallery));
    }

    private function storeGalleryFile(UploadedFile $file): ?string
    {
        // Try to upload to Cloudinary first
        $cloudinaryUrl = $this->uploadProductImage($file);
        if ($cloudinaryUrl) {
            return $cloudinaryUrl;
        }

        // Fallback to local storage if Cloudinary fails
        $filename = time() . '_' . uniqid('', true) . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('produk', $filename, 'public');

        // Set file permissions to be readable
        if ($path) {
            $fullPath = storage_path('app/public/' . $path);
            if (file_exists($fullPath)) {
                @chmod($fullPath, 0644);
            }
        }

        return $path ?: null;
    }

    private function cleanupRemovedGallery(array $existing, array $final): void
    {
        // Normalize paths for comparison
        $normalizedExisting = array_map(function($path) {
            return str_starts_with($path, '/storage/') ? substr($path, strlen('/storage/')) : $path;
        }, $existing);
        
        $normalizedFinal = array_map(function($path) {
            return str_starts_with($path, '/storage/') ? substr($path, strlen('/storage/')) : $path;
        }, $final);
        
        $toRemove = array_diff($normalizedExisting, $normalizedFinal);

        foreach ($toRemove as $path) {
            $this->deleteStoredImage($path);
        }
    }

    private function deleteStoredImage(?string $path): void
    {
        if (!$path) {
            return;
        }

        // Check if it's a Cloudinary URL
        $service = $this->getCloudinaryService();
        if ($service->isCloudinaryUrl($path)) {
            $this->deleteFromCloudinary($path);
            return;
        }
        
        // Handle local storage - both /storage/produk/file.jpg and produk/file.jpg formats
        $relative = $path;
        if (str_starts_with($path, '/storage/')) {
            $relative = substr($path, strlen('/storage/'));
        }
        
        // Don't delete placeholder.png
        if ($relative && basename($relative) !== 'placeholder.png' && Storage::disk('public')->exists($relative)) {
            Storage::disk('public')->delete($relative);
        }
    }

    /**
     * Tampilkan semua produk (dengan relasi kategori bila ada).
     * Gunakan pagination untuk optimasi performa.
     */
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 20); // Default 20 items per page
        $search = $request->get('search', '');
        
        $query = Produk::with(['kategori', 'varians'])->latest();
        
        // Add search if provided
        if ($search) {
            $query->where('nama', 'like', "%{$search}%")
                  ->orWhere('deskripsi', 'like', "%{$search}%");
        }
        
        // Paginate results
        $produk = $query->paginate($perPage);
        
        // Explicitly load varians for each product
        $data = $produk->items();
        foreach ($data as $item) {
            // Ensure varians relation is loaded and visible
            $item->load('varians');
        }

        return $this->paginatedResponse($produk, 'Daftar produk berhasil diambil');
    }

    /**
     * Tambah produk baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'idKategori'     => 'required|exists:kategori,id',
            'nama'           => 'required|string|max:100',
            'deskripsi'      => 'nullable|string',
            'jenisKelamin'   => 'nullable|in:L,P,U',
            'harga'          => 'nullable|numeric|min:0',
            'stok'           => 'nullable|integer|min:0',
            'ukuran'         => 'nullable|string|max:20',
            'gambar'         => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'gallery_order'  => 'nullable|string',
            'gallery_files.*'=> 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'variants'       => 'nullable|string',
            'size_guide'     => 'nullable|string',
        ]);

        if ($kategori = Kategori::find($validated['idKategori'])) {
            $validated['kategori'] = $kategori->nama;
        }

        [$variants, $basePrice, $totalStock] = $this->processVariants($request);
        if ($variants !== null) {
            $validated['varian'] = $variants;
            $validated['harga'] = $basePrice;
            $validated['stok'] = $totalStock;
        }

        $sizeGuide = $this->processSizeGuide($request);
        if ($sizeGuide !== null) {
            $validated['panduan_ukuran'] = $sizeGuide;
        }

        [$coverImage, $gallery, $changed] = $this->processGallery($request, null);
        if ($changed) {
            $validated['gambar'] = $coverImage;
            $validated['galeri'] = $gallery;
        }

        $produk = Produk::create($validated);
        
        // Sync variants to produk_varian table
        $this->syncVariantsToDatabase($produk, $variants);
        
        $produk->load(['kategori', 'varians']);

        return $this->createdResponse($produk, 'Produk berhasil ditambahkan');
    }



    /**
     * Update produk.
     */
    public function update(Request $request, $id)
    {
        $produk = Produk::with('kategori')->find($id);

        if (!$produk) {
            return $this->notFoundResponse('Produk tidak ditemukan');
        }

        // Validasi input dari form-data
        $validated = $request->validate([
            'idKategori'     => 'sometimes|exists:kategori,id',
            'nama'           => 'sometimes|string|max:100',
            'deskripsi'      => 'nullable|string',
            'jenisKelamin'   => 'nullable|in:L,P,U',
            'harga'          => 'nullable|numeric|min:0',
            'stok'           => 'nullable|integer|min:0',
            'ukuran'         => 'nullable|string|max:20',
            'gambar'         => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'gallery_order'  => 'nullable|string',
            'gallery_files.*'=> 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'variants'       => 'nullable|string',
            'size_guide'     => 'nullable|string',
        ]);

        if (array_key_exists('idKategori', $validated)) {
            if ($kategori = Kategori::find($validated['idKategori'])) {
                $validated['kategori'] = $kategori->nama;
            }
        }

        [$variants, $basePrice, $totalStock] = $this->processVariants($request);
        if ($variants !== null) {
            $validated['varian'] = $variants;
            $validated['harga'] = $basePrice;
            $validated['stok'] = $totalStock;
        }

        $sizeGuide = $this->processSizeGuide($request);
        if ($sizeGuide !== null) {
            $validated['panduan_ukuran'] = $sizeGuide;
        }

        [$coverImage, $gallery, $galleryChanged] = $this->processGallery($request, $produk);
        if ($galleryChanged) {
            if ($coverImage !== null) {
                $validated['gambar'] = $coverImage;
            }
            $validated['galeri'] = $gallery;
        }

        // Update semua field yang dikirim
        $produk->update($validated);
        
        // Sync variants to produk_varian table
        if (isset($variants)) {
            $this->syncVariantsToDatabase($produk, $variants);
        }
        
        $produk->load(['kategori', 'varians']);

        return $this->successResponse($produk, 'Produk berhasil diupdate');
    }
    


    /**
     * Hapus produk.
     */
    public function destroy($id)
    {
        $produk = Produk::find($id);

        if (!$produk) {
            return $this->notFoundResponse('Produk tidak ditemukan');
        }

        $this->deleteStoredImage($produk->gambar);

        $gallery = $produk->galeri ?? [];
        foreach ($gallery as $imagePath) {
            $this->deleteStoredImage($imagePath);
        }

        $produk->delete();

        return $this->successResponse(null, 'Produk berhasil dihapus');
    }

        /**
     * Tampilkan detail satu produk berdasarkan ID.
     */
    public function show($id)
    {
        $produk = Produk::with(['kategori', 'varians'])->find($id);

        if (!$produk) {
            return $this->notFoundResponse('Produk tidak ditemukan');
        }

        return $this->successResponse($produk);
    }
}

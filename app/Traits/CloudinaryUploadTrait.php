<?php

namespace App\Traits;

use App\Services\CloudinaryService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

trait CloudinaryUploadTrait
{
    /**
     * Get CloudinaryService instance
     */
    protected function getCloudinaryService(): CloudinaryService
    {
        return app(CloudinaryService::class);
    }

    /**
     * Upload gambar ke Cloudinary
     * 
     * @param UploadedFile $file
     * @param string $folder Folder tujuan di Cloudinary
     * @param array $options Opsi tambahan
     * @return string|null URL gambar yang diupload
     */
    protected function uploadToCloudinary(UploadedFile $file, string $folder = 'athleon', array $options = []): ?string
    {
        $service = $this->getCloudinaryService();
        $result = $service->upload($file, $folder, $options);
        
        return $result ? $result['url'] : null;
    }

    /**
     * Upload gambar produk ke Cloudinary
     * 
     * @param UploadedFile $file
     * @param int|null $productId
     * @return string|null
     */
    protected function uploadProductImage(UploadedFile $file, ?int $productId = null): ?string
    {
        $service = $this->getCloudinaryService();
        $result = $service->uploadProductImage($file, $productId);
        
        return $result ? $result['url'] : null;
    }

    /**
     * Upload gambar kategori ke Cloudinary
     * 
     * @param UploadedFile $file
     * @return string|null
     */
    protected function uploadCategoryImage(UploadedFile $file): ?string
    {
        $service = $this->getCloudinaryService();
        $result = $service->uploadCategoryImage($file);
        
        return $result ? $result['url'] : null;
    }

    /**
     * Upload gambar banner ke Cloudinary
     * 
     * @param UploadedFile $file
     * @return string|null
     */
    protected function uploadBannerImage(UploadedFile $file): ?string
    {
        $service = $this->getCloudinaryService();
        $result = $service->uploadBannerImage($file);
        
        return $result ? $result['url'] : null;
    }

    /**
     * Upload avatar user ke Cloudinary
     * 
     * @param UploadedFile $file
     * @param int $userId
     * @return string|null
     */
    protected function uploadUserAvatar(UploadedFile $file, int $userId): ?string
    {
        $service = $this->getCloudinaryService();
        $result = $service->uploadUserAvatar($file, $userId);
        
        return $result ? $result['url'] : null;
    }

    /**
     * Delete gambar dari Cloudinary berdasarkan URL
     * 
     * @param string $url
     * @return bool
     */
    protected function deleteFromCloudinary(string $url): bool
    {
        $service = $this->getCloudinaryService();
        
        // Skip if not a Cloudinary URL
        if (!$service->isCloudinaryUrl($url)) {
            return false;
        }

        $publicId = $service->extractPublicId($url);
        if (!$publicId) {
            return false;
        }

        return $service->delete($publicId);
    }

    /**
     * Delete gambar lama dan upload baru ke Cloudinary
     * 
     * @param UploadedFile $newFile
     * @param string|null $oldUrl
     * @param string $folder
     * @param array $options
     * @return string|null
     */
    protected function replaceCloudinaryImage(UploadedFile $newFile, ?string $oldUrl, string $folder = 'athleon', array $options = []): ?string
    {
        // Delete old image if exists and is Cloudinary URL
        if ($oldUrl) {
            $this->deleteFromCloudinary($oldUrl);
        }

        // Upload new image
        return $this->uploadToCloudinary($newFile, $folder, $options);
    }

    /**
     * Delete gambar lama dari storage lokal (untuk migrasi)
     * 
     * @param string $path Path relatif di storage
     * @return bool
     */
    protected function deleteOldLocalImage(string $path): bool
    {
        // Normalize path
        $path = ltrim($path, '/');
        
        // Remove 'storage/' prefix if exists
        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, 8);
        }

        if (Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->delete($path);
        }

        return false;
    }

    /**
     * Check if URL is local storage
     * 
     * @param string $url
     * @return bool
     */
    protected function isLocalStorageUrl(string $url): bool
    {
        return str_contains($url, '/storage/') || !str_starts_with($url, 'http');
    }
}

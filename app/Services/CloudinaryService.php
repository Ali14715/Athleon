<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Cloudinary\Transformation\Resize;
use Cloudinary\Transformation\Quality;
use Cloudinary\Transformation\Format;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    protected Cloudinary $cloudinary;

    public function __construct()
    {
        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => config('services.cloudinary.cloud_name'),
                'api_key' => config('services.cloudinary.api_key'),
                'api_secret' => config('services.cloudinary.api_secret'),
            ],
            'url' => [
                'secure' => true
            ]
        ]);
    }

    /**
     * Upload file ke Cloudinary
     *
     * @param UploadedFile|string $file File atau path file
     * @param string $folder Folder di Cloudinary
     * @param array $options Opsi tambahan
     * @return array|null
     */
    public function upload($file, string $folder = 'athleon', array $options = []): ?array
    {
        try {
            // Determine file path
            if ($file instanceof UploadedFile) {
                $filePath = $file->getRealPath();
            } else {
                $filePath = $file;
            }

            // Default options
            $defaultOptions = [
                'folder' => $folder,
                'resource_type' => 'auto',
                'transformation' => [
                    'quality' => 'auto',
                    'fetch_format' => 'auto',
                ],
            ];

            // Merge with custom options
            $uploadOptions = array_merge($defaultOptions, $options);

            // Upload
            $result = $this->cloudinary->uploadApi()->upload($filePath, $uploadOptions);

            return [
                'public_id' => $result['public_id'],
                'url' => $result['secure_url'],
                'format' => $result['format'],
                'width' => $result['width'] ?? null,
                'height' => $result['height'] ?? null,
                'bytes' => $result['bytes'],
            ];
        } catch (\Exception $e) {
            Log::error('Cloudinary upload error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Upload gambar produk
     *
     * @param UploadedFile $file
     * @param int|null $productId
     * @return array|null
     */
    public function uploadProductImage(UploadedFile $file, ?int $productId = null): ?array
    {
        $folder = 'athleon/products';
        if ($productId) {
            $folder .= '/' . $productId;
        }

        return $this->upload($file, $folder, [
            'transformation' => [
                ['width' => 800, 'height' => 800, 'crop' => 'limit'],
                ['quality' => 'auto:best'],
                ['fetch_format' => 'auto'],
            ],
        ]);
    }

    /**
     * Upload gambar kategori
     *
     * @param UploadedFile $file
     * @return array|null
     */
    public function uploadCategoryImage(UploadedFile $file): ?array
    {
        return $this->upload($file, 'athleon/categories', [
            'transformation' => [
                ['width' => 600, 'height' => 400, 'crop' => 'fill'],
                ['quality' => 'auto:good'],
                ['fetch_format' => 'auto'],
            ],
        ]);
    }

    /**
     * Upload gambar banner
     *
     * @param UploadedFile $file
     * @return array|null
     */
    public function uploadBannerImage(UploadedFile $file): ?array
    {
        return $this->upload($file, 'athleon/banners', [
            'transformation' => [
                ['width' => 1920, 'height' => 600, 'crop' => 'fill'],
                ['quality' => 'auto:best'],
                ['fetch_format' => 'auto'],
            ],
        ]);
    }

    /**
     * Upload gambar profil user
     *
     * @param UploadedFile $file
     * @param int $userId
     * @return array|null
     */
    public function uploadUserAvatar(UploadedFile $file, int $userId): ?array
    {
        return $this->upload($file, 'athleon/users/' . $userId, [
            'transformation' => [
                ['width' => 300, 'height' => 300, 'crop' => 'fill', 'gravity' => 'face'],
                ['quality' => 'auto:good'],
                ['fetch_format' => 'auto'],
            ],
        ]);
    }

    /**
     * Delete file dari Cloudinary
     *
     * @param string $publicId
     * @return bool
     */
    public function delete(string $publicId): bool
    {
        try {
            $result = $this->cloudinary->uploadApi()->destroy($publicId);
            return $result['result'] === 'ok';
        } catch (\Exception $e) {
            Log::error('Cloudinary delete error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete multiple files dari Cloudinary
     *
     * @param array $publicIds
     * @return bool
     */
    public function deleteMultiple(array $publicIds): bool
    {
        try {
            foreach ($publicIds as $publicId) {
                $this->delete($publicId);
            }
            return true;
        } catch (\Exception $e) {
            Log::error('Cloudinary delete multiple error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get optimized URL untuk gambar
     *
     * @param string $publicId
     * @param array $options
     * @return string
     */
    public function getUrl(string $publicId, array $options = []): string
    {
        $defaultOptions = [
            'secure' => true,
            'transformation' => [
                ['quality' => 'auto'],
                ['fetch_format' => 'auto'],
            ],
        ];

        $mergedOptions = array_merge($defaultOptions, $options);

        return $this->cloudinary->image($publicId)->toUrl($mergedOptions);
    }

    /**
     * Get thumbnail URL
     *
     * @param string $publicId
     * @param int $width
     * @param int $height
     * @return string
     */
    public function getThumbnailUrl(string $publicId, int $width = 150, int $height = 150): string
    {
        return $this->getUrl($publicId, [
            'transformation' => [
                ['width' => $width, 'height' => $height, 'crop' => 'fill'],
                ['quality' => 'auto:low'],
                ['fetch_format' => 'auto'],
            ],
        ]);
    }

    /**
     * Extract public_id from Cloudinary URL
     *
     * @param string $url
     * @return string|null
     */
    public function extractPublicId(string $url): ?string
    {
        // Pattern: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
        if (preg_match('/\/v\d+\/(.+)\.\w+$/', $url, $matches)) {
            return $matches[1];
        }
        
        // Alternative pattern without version
        if (preg_match('/\/upload\/(.+)\.\w+$/', $url, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Check if URL is a Cloudinary URL
     *
     * @param string $url
     * @return bool
     */
    public function isCloudinaryUrl(string $url): bool
    {
        return str_contains($url, 'cloudinary.com') || str_contains($url, 'res.cloudinary.com');
    }
}

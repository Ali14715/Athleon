<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class BannerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $banners = Banner::orderBy('order')->orderBy('created_at', 'desc')->get();
        return $this->successResponse($banners, 'Banners retrieved successfully');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'link_url' => 'nullable|url',
            'button_text' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'order' => 'integer',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse('Validasi gagal', $validator->errors());
        }

        $data = $request->only(['title', 'description', 'link_url', 'button_text', 'is_active', 'order']);

        if ($request->hasFile('image')) {
            // Store only the relative path (e.g., 'banners/file.jpg')
            $imagePath = $request->file('image')->store('banners', 'public');
            $data['image_url'] = $imagePath;
        }

        $banner = Banner::create($data);

        return $this->createdResponse($banner, 'Banner berhasil ditambahkan');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $banner = Banner::find($id);
        
        if (!$banner) {
            return $this->notFoundResponse('Banner tidak ditemukan');
        }
        
        return $this->successResponse($banner, 'Banner retrieved successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $banner = Banner::find($id);
        
        if (!$banner) {
            return $this->notFoundResponse('Banner tidak ditemukan');
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'link_url' => 'nullable|url',
            'button_text' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'order' => 'integer',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse('Validasi gagal', $validator->errors());
        }

        $data = $request->only(['title', 'description', 'link_url', 'button_text', 'is_active', 'order']);

        if ($request->hasFile('image')) {
            // Delete old image - get raw attribute to avoid accessor
            if ($banner->image_url) {
                $oldPath = $banner->getAttributes()['image_url'] ?? null;
                if ($oldPath && !str_starts_with($oldPath, 'http')) {
                    // Remove storage/ prefix if exists
                    if (str_starts_with($oldPath, 'storage/')) {
                        $oldPath = substr($oldPath, 8);
                    }
                    // Don't delete placeholder.png
                    if (basename($oldPath) !== 'placeholder.png') {
                        Storage::disk('public')->delete($oldPath);
                    }
                }
            }

            // Store only the relative path (e.g., 'banners/file.jpg')
            $imagePath = $request->file('image')->store('banners', 'public');
            $data['image_url'] = $imagePath;
        }

        $banner->update($data);

        return $this->successResponse($banner, 'Banner berhasil diupdate');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $banner = Banner::find($id);
        
        if (!$banner) {
            return $this->notFoundResponse('Banner tidak ditemukan');
        }

        // Delete image - get raw attribute to avoid accessor
        if ($banner->image_url) {
            $path = $banner->getAttributes()['image_url'] ?? null;
            if ($path && !str_starts_with($path, 'http')) {
                // Remove storage/ prefix if exists
                if (str_starts_with($path, 'storage/')) {
                    $path = substr($path, 8);
                }
                // Don't delete placeholder.png
                if (basename($path) !== 'placeholder.png') {
                    Storage::disk('public')->delete($path);
                }
            }
        }

        $banner->delete();

        return $this->successResponse(null, 'Banner berhasil dihapus');
    }
}

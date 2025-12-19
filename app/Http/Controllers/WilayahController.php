<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class WilayahController extends Controller
{
    private $baseUrl = 'https://wilayah.id/api';
    
    /**
     * Get all provinces
     */
    public function getProvinces()
    {
        try {
            // Cache for 7 days (provinces rarely change)
            $provinces = Cache::remember('wilayah_provinces', 60 * 24 * 7, function () {
                $response = Http::timeout(10)->get("{$this->baseUrl}/provinces.json");
                
                if ($response->successful()) {
                    return $response->json();
                }
                
                return ['data' => []];
            });
            
            return $this->successResponse($provinces, 'Provinces retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal mengambil data provinsi: ' . $e->getMessage());
        }
    }
    
    /**
     * Get cities/regencies by province code
     */
    public function getCities($provinceCode)
    {
        try {
            // Cache for 7 days
            $cities = Cache::remember("wilayah_cities_{$provinceCode}", 60 * 24 * 7, function () use ($provinceCode) {
                $response = Http::timeout(10)->get("{$this->baseUrl}/regencies/{$provinceCode}.json");
                
                if ($response->successful()) {
                    return $response->json();
                }
                
                return ['data' => []];
            });
            
            return $this->successResponse($cities, 'Cities retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal mengambil data kota/kabupaten: ' . $e->getMessage());
        }
    }
    
    /**
     * Get districts by city/regency code
     */
    public function getDistricts($cityCode)
    {
        try {
            // Cache for 7 days
            $districts = Cache::remember("wilayah_districts_{$cityCode}", 60 * 24 * 7, function () use ($cityCode) {
                $response = Http::timeout(10)->get("{$this->baseUrl}/districts/{$cityCode}.json");
                
                if ($response->successful()) {
                    return $response->json();
                }
                
                return ['data' => []];
            });
            
            return $this->successResponse($districts, 'Districts retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal mengambil data kecamatan: ' . $e->getMessage());
        }
    }
    
    /**
     * Get villages by district code
     */
    public function getVillages($districtCode)
    {
        try {
            // Cache for 7 days
            $villages = Cache::remember("wilayah_villages_{$districtCode}", 60 * 24 * 7, function () use ($districtCode) {
                $response = Http::timeout(10)->get("{$this->baseUrl}/villages/{$districtCode}.json");
                
                if ($response->successful()) {
                    return $response->json();
                }
                
                return ['data' => []];
            });
            
            return $this->successResponse($villages, 'Villages retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal mengambil data kelurahan/desa: ' . $e->getMessage());
        }
    }
}

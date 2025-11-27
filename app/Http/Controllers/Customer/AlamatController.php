<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\AlamatUser;
use App\Services\BiteshipService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class AlamatController extends Controller
{
    // Get all addresses for authenticated user
    public function index()
    {
        $alamat = AlamatUser::where('user_id', Auth::id())
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        // Auto-fix missing area_id for addresses that don't have it
        foreach ($alamat as $address) {
            if (empty($address->area_id)) {
                Log::info('Auto-fixing missing area_id for address', [
                    'address_id' => $address->id,
                    'kelurahan' => $address->kelurahan,
                    'kecamatan' => $address->kecamatan,
                    'kota' => $address->kota
                ]);
                
                $areaId = $this->getAreaIdFromBiteship(
                    $address->kelurahan ?? $address->kecamatan,
                    $address->kota,
                    $address->kecamatan
                );
                
                if ($areaId) {
                    $address->update(['area_id' => $areaId]);
                    $address->refresh();
                    Log::info('Successfully updated area_id', [
                        'address_id' => $address->id,
                        'area_id' => $areaId
                    ]);
                } else {
                    Log::warning('Failed to get area_id from Biteship', [
                        'address_id' => $address->id
                    ]);
                }
            }
        }

        // Refresh collection to get updated data
        $alamat = AlamatUser::where('user_id', Auth::id())
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->successResponse($alamat);
    }

    // Get single address
    public function show($id)
    {
        $alamat = AlamatUser::where('user_id', Auth::id())
            ->where('id', $id)
            ->first();

        if (!$alamat) {
            return $this->notFoundResponse('Alamat tidak ditemukan');
        }

        return $this->successResponse($alamat);
    }

    // Create new address
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'label' => 'required|string|max:255',
            'nama_penerima' => 'required|string|max:255',
            'telepon_penerima' => 'required|string|max:20',
            'alamat_lengkap' => 'required|string',
            'provinsi' => 'required|string|max:255',
            'kota' => 'required|string|max:255',
            'kecamatan' => 'required|string|max:255',
            'kelurahan' => 'nullable|string|max:255',
            'kode_pos' => 'nullable|string|max:10',
            'area_id' => 'nullable|string|max:100',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_default' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors(), 'Validasi gagal');
        }

        // Check if user has no default address - if so, make this the default
        $hasDefaultAddress = AlamatUser::where('user_id', Auth::id())
            ->where('is_default', true)
            ->exists();
        
        $isDefaultValue = $request->has('is_default') ? $request->is_default : false;
        
        // If this is the first address or explicitly set as default, make it default
        if (!$hasDefaultAddress || $isDefaultValue) {
            // Unset all other defaults
            AlamatUser::where('user_id', Auth::id())
                ->update(['is_default' => false]);
            $isDefaultValue = true;
        }

        // Get area_id from Biteship if not provided
        $areaId = $request->area_id;
        if (!$areaId) {
            Log::info('Fetching area_id from Biteship for new address', [
                'kelurahan' => $request->kelurahan,
                'kecamatan' => $request->kecamatan,
                'kota' => $request->kota
            ]);
            
            $areaId = $this->getAreaIdFromBiteship(
                $request->kelurahan ?? $request->kecamatan,
                $request->kota,
                $request->kecamatan
            );
            
            Log::info('Biteship area_id result for new address', ['area_id' => $areaId]);
        }

        $alamat = AlamatUser::create([
            'user_id' => Auth::id(),
            'label' => $request->label,
            'nama_penerima' => $request->nama_penerima,
            'telepon_penerima' => $request->telepon_penerima,
            'alamat_lengkap' => $request->alamat_lengkap,
            'provinsi' => $request->provinsi,
            'kota' => $request->kota,
            'kecamatan' => $request->kecamatan,
            'kelurahan' => $request->kelurahan,
            'kode_pos' => $request->kode_pos,
            'area_id' => $areaId,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'is_default' => $isDefaultValue,
        ]);

        return $this->createdResponse($alamat, 'Alamat berhasil ditambahkan');
    }

    // Update address
    public function update(Request $request, $id)
    {
        $alamat = AlamatUser::where('user_id', Auth::id())
            ->where('id', $id)
            ->first();

        if (!$alamat) {
            return $this->notFoundResponse('Alamat tidak ditemukan');
        }

        $validator = Validator::make($request->all(), [
            'label' => 'sometimes|string|max:255',
            'nama_penerima' => 'sometimes|string|max:255',
            'telepon_penerima' => 'sometimes|string|max:20',
            'alamat_lengkap' => 'sometimes|string',
            'provinsi' => 'sometimes|string|max:255',
            'kota' => 'sometimes|string|max:255',
            'kecamatan' => 'sometimes|string|max:255',
            'kelurahan' => 'nullable|string|max:255',
            'kode_pos' => 'nullable|string|max:10',
            'area_id' => 'nullable|string|max:100',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_default' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors(), 'Validasi gagal');
        }

        // If this is set as default, unset other defaults
        if ($request->has('is_default') && $request->is_default) {
            AlamatUser::where('user_id', Auth::id())
                ->where('id', '!=', $id)
                ->update(['is_default' => false]);
        }

        // Get area_id from Biteship if not provided in request
        $areaIdToSave = null;
        
        Log::info('=== START UPDATE ALAMAT ===', [
            'alamat_id' => $id,
            'request_has_area_id' => $request->has('area_id'),
            'request_area_id_value' => $request->area_id
        ]);
        
        if (!$request->has('area_id') || empty($request->area_id)) {
            $kelurahan = $request->kelurahan ?? $alamat->kelurahan;
            $kecamatan = $request->kecamatan ?? $alamat->kecamatan;
            $kota = $request->kota ?? $alamat->kota;
            
            Log::info('Attempting to fetch area_id from Biteship', [
                'kelurahan' => $kelurahan,
                'kecamatan' => $kecamatan,
                'kota' => $kota,
                'search_query' => $kelurahan ?? $kecamatan
            ]);
            
            // Try to get area_id from Biteship
            $areaIdToSave = $this->getAreaIdFromBiteship(
                $kelurahan ?? $kecamatan,
                $kota,
                $kecamatan
            );
            
            Log::info('Biteship fetch completed', [
                'area_id_result' => $areaIdToSave,
                'is_null' => is_null($areaIdToSave),
                'is_empty' => empty($areaIdToSave)
            ]);
        } else {
            Log::info('Using area_id from request', ['area_id' => $request->area_id]);
        }

        // Prepare data for update
        $updateData = $request->only([
            'label',
            'nama_penerima',
            'telepon_penerima',
            'alamat_lengkap',
            'provinsi',
            'kota',
            'kecamatan',
            'kelurahan',
            'kode_pos',
            'latitude',
            'longitude',
            'is_default'
        ]);

        // Add area_id to update data
        if ($areaIdToSave) {
            $updateData['area_id'] = $areaIdToSave;
            Log::info('Adding fetched area_id to updateData', ['area_id' => $areaIdToSave]);
        } elseif ($request->has('area_id')) {
            $updateData['area_id'] = $request->area_id;
            Log::info('Adding request area_id to updateData', ['area_id' => $request->area_id]);
        } else {
            Log::warning('No area_id to update - will remain null');
        }
        
        Log::info('Update data prepared', [
            'has_area_id' => isset($updateData['area_id']),
            'area_id_value' => $updateData['area_id'] ?? 'NOT SET',
            'all_keys' => array_keys($updateData)
        ]);

        $alamat->update($updateData);
        
        // Refresh model to get updated data
        $alamat->refresh();
        
        Log::info('=== END UPDATE ALAMAT ===', [
            'final_area_id' => $alamat->area_id,
            'was_updated' => $alamat->wasChanged('area_id')
        ]);

        return $this->successResponse($alamat, 'Alamat berhasil diperbarui');
    }

    // Delete address
    public function destroy($id)
    {
        $alamat = AlamatUser::where('user_id', Auth::id())
            ->where('id', $id)
            ->first();

        if (!$alamat) {
            return $this->notFoundResponse('Alamat tidak ditemukan');
        }

        $wasDefault = $alamat->is_default;
        $alamat->delete();

        // If deleted address was default, set another address as default
        if ($wasDefault) {
            $nextAddress = AlamatUser::where('user_id', Auth::id())
                ->orderBy('created_at', 'desc')
                ->first();
            
            if ($nextAddress) {
                $nextAddress->update(['is_default' => true]);
            }
        }

        return $this->successResponse(null, 'Alamat berhasil dihapus');
    }

    // Set address as default
    public function setDefault($id)
    {
        $alamat = AlamatUser::where('user_id', Auth::id())
            ->where('id', $id)
            ->first();

        if (!$alamat) {
            return $this->notFoundResponse('Alamat tidak ditemukan');
        }

        // Unset all defaults
        AlamatUser::where('user_id', Auth::id())
            ->update(['is_default' => false]);

        // Set this as default
        $alamat->update(['is_default' => true]);

        return $this->successResponse($alamat, 'Alamat default berhasil diubah');
    }

    /**
     * Get area_id from Biteship API based on location
     */
    private function getAreaIdFromBiteship(string $searchQuery, string $city, ?string $kecamatan = null): ?string
    {
        try {
            Log::info('getAreaIdFromBiteship called', [
                'searchQuery' => $searchQuery,
                'city' => $city,
                'kecamatan' => $kecamatan
            ]);
            
            $biteshipService = app(BiteshipService::class);
            
            // Normalize city name - remove "Kabupaten", "Kota", "Kota Administrasi" prefixes
            $normalizedCity = trim(preg_replace('/^(Kabupaten|Kota Administrasi|Kota)\s+/i', '', $city));
            
            // Try multiple search strategies with variations
            $searchPatterns = [];
            
            // If we have kecamatan, try it with kelurahan
            if ($kecamatan) {
                $searchPatterns[] = trim($searchQuery . ', ' . $kecamatan . ', ' . $normalizedCity);
                $searchPatterns[] = trim($kecamatan . ', ' . $normalizedCity);
                $searchPatterns[] = trim($kecamatan);
            }
            
            // Standard patterns
            $searchPatterns[] = trim($searchQuery . ', ' . $normalizedCity);
            $searchPatterns[] = trim($searchQuery . ', ' . $city);
            $searchPatterns[] = $normalizedCity;
            $searchPatterns[] = trim($city);
            $searchPatterns[] = trim($searchQuery);
            
            // Try with "Kota" prefix if not already there
            if (stripos($city, 'Kota') === false && stripos($city, 'Kabupaten') === false) {
                $searchPatterns[] = 'Kota ' . $normalizedCity;
            }
            
            // Remove null, empty, and duplicate patterns
            $searchPatterns = array_values(array_unique(array_filter($searchPatterns, function($p) {
                return !empty($p);
            })));
            
            foreach ($searchPatterns as $index => $pattern) {
                if (empty($pattern)) continue;
                
                Log::info("Biteship search attempt #" . ($index + 1), ['pattern' => $pattern]);
                
                $result = $biteshipService->searchArea($pattern);
                
                Log::info('Biteship searchArea result', [
                    'pattern' => $pattern,
                    'success' => $result['success'],
                    'data_count' => count($result['data'] ?? []),
                    'data' => $result['data'] ?? []
                ]);

                if ($result['success'] && !empty($result['data'])) {
                    // Get the first matching area
                    $firstArea = $result['data'][0] ?? null;
                    if ($firstArea && isset($firstArea['id'])) {
                        Log::info('Biteship area found - RETURNING ID', [
                            'pattern' => $pattern,
                            'attempt' => $index + 1,
                            'area_id' => $firstArea['id'],
                            'area_name' => $firstArea['name'] ?? 'N/A'
                        ]);
                        return $firstArea['id'];
                    }
                }
            }

            // Last attempt: Try common alternative names for the city
            $cityAlternatives = [
                'Serang' => ['Serang', 'Kota Serang', 'Kabupaten Serang'],
                'Jakarta Selatan' => ['Jakarta Selatan', 'Jaksel', 'South Jakarta'],
                'Tangerang' => ['Tangerang', 'Kota Tangerang', 'Kabupaten Tangerang'],
            ];
            
            foreach ($cityAlternatives as $key => $alternatives) {
                if (stripos($city, $key) !== false || stripos($normalizedCity, $key) !== false) {
                    Log::info('Trying city alternatives', ['alternatives' => $alternatives]);
                    
                    foreach ($alternatives as $altCity) {
                        $result = $biteshipService->searchArea($altCity);
                        if ($result['success'] && !empty($result['data'])) {
                            $firstArea = $result['data'][0] ?? null;
                            if ($firstArea && isset($firstArea['id'])) {
                                Log::info('Biteship area found via alternative name', [
                                    'original_city' => $city,
                                    'alternative_used' => $altCity,
                                    'area_id' => $firstArea['id'],
                                    'area_name' => $firstArea['name'] ?? 'N/A'
                                ]);
                                return $firstArea['id'];
                            }
                        }
                    }
                }
            }
            
            Log::warning('Biteship area not found after all attempts - RETURNING NULL', [
                'searchQuery' => $searchQuery,
                'city' => $city,
                'kecamatan' => $kecamatan,
                'normalizedCity' => $normalizedCity,
                'patterns_tried' => $searchPatterns
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Error getting area_id from Biteship', [
                'error' => $e->getMessage(),
                'query' => $searchQuery,
                'city' => $city,
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }
    
    /**
     * Force update area_id for an address (for testing/fixing)
     */
    public function forceUpdateAreaId($id)
    {
        $alamat = AlamatUser::where('user_id', Auth::id())
            ->where('id', $id)
            ->first();

        if (!$alamat) {
            return $this->notFoundResponse('Alamat tidak ditemukan');
        }

        Log::info('=== FORCE UPDATE AREA_ID ===', [
            'alamat_id' => $id,
            'kelurahan' => $alamat->kelurahan,
            'kecamatan' => $alamat->kecamatan,
            'kota' => $alamat->kota
        ]);

        $areaId = $this->getAreaIdFromBiteship(
            $alamat->kelurahan ?? $alamat->kecamatan,
            $alamat->kota,
            $alamat->kecamatan
        );

        if ($areaId) {
            $alamat->update(['area_id' => $areaId]);
            $alamat->refresh();
            
            return $this->successResponse($alamat, 'Area ID berhasil diperbarui');
        }

        return $this->badRequestResponse('Gagal mendapatkan area_id dari Biteship');
    }
}

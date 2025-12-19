<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TrackingController extends Controller
{
    /**
     * Track package using BinderByte API
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function track(Request $request)
    {
        $validated = $request->validate([
            'courier' => 'required|string',
            'awb' => 'required|string',
        ]);

        try {
            $apiKey = env('BINDERBYTE_API_KEY', 'abb4f494985e6e51911a891612fbc1785f72ef7d80298823a7616efe3556d654');
            
            $response = Http::get('https://api.binderbyte.com/v1/track', [
                'api_key' => $apiKey,
                'courier' => strtolower($validated['courier']),
                'awb' => $validated['awb'],
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                return $this->successResponse(
                    $data['data'] ?? $data,
                    $data['message'] ?? 'Successfully tracked package'
                );
            }

            return $this->serverErrorResponse('Failed to track package', $response->json());

        } catch (\Exception $e) {
            return $this->serverErrorResponse('Error tracking package: ' . $e->getMessage());
        }
    }

    /**
     * Get list of supported couriers
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function couriers()
    {
        $couriers = [
            ['code' => 'jne', 'name' => 'JNE'],
            ['code' => 'jnt', 'name' => 'J&T Express'],
            ['code' => 'sicepat', 'name' => 'SiCepat'],
            ['code' => 'tiki', 'name' => 'TIKI'],
            ['code' => 'pos', 'name' => 'POS Indonesia'],
            ['code' => 'anteraja', 'name' => 'AnterAja'],
            ['code' => 'ninja', 'name' => 'Ninja Xpress'],
            ['code' => 'lion', 'name' => 'Lion Parcel'],
            ['code' => 'pcp', 'name' => 'PCP Express'],
            ['code' => 'jet', 'name' => 'JET Express'],
            ['code' => 'dse', 'name' => 'DSE Express'],
            ['code' => 'first', 'name' => 'First Logistics'],
            ['code' => 'idexpress', 'name' => 'ID Express'],
            ['code' => 'spx', 'name' => 'Shopee Express'],
            ['code' => 'kgx', 'name' => 'KGXpress'],
            ['code' => 'sap', 'name' => 'SAP Express'],
            ['code' => 'wahana', 'name' => 'Wahana'],
            ['code' => 'rpx', 'name' => 'RPX'],
        ];

        return $this->successResponse($couriers, 'Couriers retrieved successfully');
    }
}

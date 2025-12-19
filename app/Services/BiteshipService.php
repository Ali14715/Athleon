<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\PendingRequest;

class BiteshipService
{
    protected array $config;

    public function __construct()
    {
        $this->config = config('services.biteship', []);
    }

    protected function client(): PendingRequest
    {
        $apiKey = Arr::get($this->config, 'api_key');

        if (empty($apiKey)) {
            throw new \RuntimeException('Biteship API key is not configured.');
        }

        $baseUrl = rtrim(Arr::get($this->config, 'base_url', 'https://api.biteship.com/v1'), '/');

        return Http::withOptions([
            'verify' => false, // Disable SSL verification for development
        ])->withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Accept' => 'application/json',
        ])->baseUrl($baseUrl);
    }

    /**
     * Request available shipping rates from Biteship.
     *
     * @param array $payload
     * @return array
     */
    public function calculateRates(array $payload): array
    {
        $requestBody = $this->buildRatesPayload($payload);
        
        // Log the final request body for debugging
        \Log::info('Biteship API Request Body:', $requestBody);

        $response = $this->client()->post('/rates/couriers', $requestBody);

        if (!$response->successful()) {
            \Log::error('Biteship API Error:', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            throw new \RuntimeException('Biteship rate request failed: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Track shipment status by waybill/courier.
     * Biteship API: GET /v1/trackings/{waybill_id}/couriers/{courier_code}
     */
    public function trackShipment(string $waybillId, string $courierCode): array
    {
        $response = $this->client()->get("/trackings/{$waybillId}/couriers/{$courierCode}");

        if (!$response->successful()) {
            \Log::error('Biteship tracking failed:', [
                'waybill_id' => $waybillId,
                'courier_code' => $courierCode,
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            throw new \RuntimeException('Biteship tracking request failed: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Normalize payload before sent to Biteship API.
     */
    protected function buildRatesPayload(array $payload): array
    {
        $defaultWeight = (int) Arr::get($this->config, 'default_weight', 1000);
        $length = (int) Arr::get($this->config, 'item_length', 20);
        $width = (int) Arr::get($this->config, 'item_width', 15);
        $height = (int) Arr::get($this->config, 'item_height', 10);
        $items = Arr::get($payload, 'items');

        if (empty($items)) {
            $items = [[
                'name' => 'ATHLEON Package',
                'description' => Arr::get($payload, 'description', 'Checkout items'),
                'value' => (int) Arr::get($payload, 'total_value', 0),
                'length' => $length,
                'width' => $width,
                'height' => $height,
                'weight' => max(1, (int) Arr::get($payload, 'total_weight', $defaultWeight)),
                'quantity' => max(1, (int) Arr::get($payload, 'quantity', 1)),
            ]];
        }

        // Build the request body according to Biteship API requirements
        $body = [
            'origin_area_id' => Arr::get($this->config, 'origin_area_id'),
            'destination_area_id' => Arr::get($payload, 'destination_area_id'),
            'couriers' => Arr::get($payload, 'couriers', Arr::get($this->config, 'couriers', 'jne,jnt,sicepat')),
            'items' => array_map(fn ($item) => $this->normalizeItem($item, $length, $width, $height, $defaultWeight), $items),
        ];

        // Add optional fields only if they exist
        if ($originPostalCode = Arr::get($this->config, 'origin_postal_code')) {
            $body['origin_postal_code'] = (int) $originPostalCode;
        }
        
        if ($destinationPostalCode = Arr::get($payload, 'destination_postal_code')) {
            $body['destination_postal_code'] = (int) $destinationPostalCode;
        }

        if ($originLatitude = Arr::get($payload, 'origin_latitude')) {
            $body['origin_latitude'] = (float) $originLatitude;
        }

        if ($originLongitude = Arr::get($payload, 'origin_longitude')) {
            $body['origin_longitude'] = (float) $originLongitude;
        }

        if ($destinationLatitude = Arr::get($payload, 'destination_latitude')) {
            $body['destination_latitude'] = (float) $destinationLatitude;
        }

        if ($destinationLongitude = Arr::get($payload, 'destination_longitude')) {
            $body['destination_longitude'] = (float) $destinationLongitude;
        }

        return $body;
    }

    protected function normalizeItem(array $item, int $length, int $width, int $height, int $defaultWeight): array
    {
        return [
            'name' => Arr::get($item, 'name', 'ATHLEON Item'),
            'description' => Arr::get($item, 'description', 'Merchandise'),
            'value' => (int) Arr::get($item, 'value', 0),
            'length' => (int) Arr::get($item, 'length', $length),
            'width' => (int) Arr::get($item, 'width', $width),
            'height' => (int) Arr::get($item, 'height', $height),
            'weight' => max(1, (int) Arr::get($item, 'weight', $defaultWeight)),
            'quantity' => max(1, (int) Arr::get($item, 'quantity', 1)),
        ];
    }

    /**
     * Search for area ID by location name
     *
     * @param string $query Search query (e.g., district or subdistrict name)
     * @return array
     */
    public function searchArea(string $query): array
    {
        try {
            $response = $this->client()->get('/maps/areas', [
                'countries' => 'ID',
                'input' => $query,
                'type' => 'single'
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'data' => $data['areas'] ?? []
                ];
            }

            \Log::error('Biteship Area Search Failed', [
                'status' => $response->status(),
                'response' => $response->body()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to search area',
                'data' => []
            ];
        } catch (\Exception $e) {
            \Log::error('Biteship Area Search Exception', [
                'message' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => []
            ];
        }
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Keranjang;
use App\Services\BiteshipService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ShippingController extends Controller
{
    protected BiteshipService $service;

    public function __construct(BiteshipService $service)
    {
        $this->service = $service;
    }

    public function calculateRates(Request $request): JsonResponse
    {
        $data = $request->validate([
            'destination_area_id' => 'nullable|string',
            'destination_postal_code' => 'nullable|string|required_without:destination_area_id',
            'destination_address' => 'required|string',
            'couriers' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.name' => 'required_with:items|string',
            'items.*.value' => 'nullable|numeric',
            'items.*.weight' => 'nullable|numeric|min:1',
            'items.*.length' => 'nullable|numeric|min:1',
            'items.*.width' => 'nullable|numeric|min:1',
            'items.*.height' => 'nullable|numeric|min:1',
            'items.*.quantity' => 'nullable|numeric|min:1',
        ]);

        $user = $request->user();
        $keranjang = Keranjang::where('user_id', $user->id)
            ->with('items.produk')
            ->first();

        if (!$keranjang || $keranjang->items->isEmpty()) {
            return $this->badRequestResponse('Keranjang kosong, tidak dapat menghitung ongkir.');
        }

        $summary = $this->composeCartSummary($keranjang);

        if (empty($data['items'])) {
            $data['items'] = [$summary['item_payload']];
        }

        $payload = array_merge($data, [
            'total_value' => $summary['total_value'],
            'total_weight' => $summary['total_weight'],
            'quantity' => $summary['quantity'],
        ]);

        try {
            $rates = $this->service->calculateRates($payload);

            return $this->successResponse($rates, 'Shipping rates retrieved successfully');
        } catch (\Throwable $th) {
            return $this->serverErrorResponse($th->getMessage());
        }
    }

    public function trackShipment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'waybill_id' => 'required|string',
            'courier_code' => 'required|string',
        ]);

        try {
            $tracking = $this->service->trackShipment($data['waybill_id'], $data['courier_code']);

            return $this->successResponse($tracking, 'Tracking data retrieved successfully');
        } catch (\Throwable $th) {
            return $this->serverErrorResponse($th->getMessage());
        }
    }

    protected function composeCartSummary(Keranjang $keranjang): array
    {
        $defaultWeight = (int) config('services.biteship.default_weight', 1000);
        $length = (int) config('services.biteship.item_length', 20);
        $width = (int) config('services.biteship.item_width', 15);
        $height = (int) config('services.biteship.item_height', 10);

        $totalValue = 0;
        $totalQuantity = 0;

        foreach ($keranjang->items as $item) {
            $totalQuantity += $item->jumlah;
            $totalValue += ($item->produk->harga ?? 0) * $item->jumlah;
        }

        $totalWeight = max(1, $totalQuantity) * $defaultWeight;

        return [
            'total_value' => $totalValue,
            'total_weight' => $totalWeight,
            'quantity' => max(1, $totalQuantity),
            'item_payload' => [
                'name' => 'ATHLEON Package',
                'description' => 'Checkout items',
                'value' => $totalValue,
                'length' => $length,
                'width' => $width,
                'height' => $height,
                'weight' => $totalWeight,
                'quantity' => 1,
            ],
        ];
    }
}

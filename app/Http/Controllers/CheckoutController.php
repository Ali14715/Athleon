<?php

namespace App\Http\Controllers;

use App\Models\Pesanan;
use App\Models\ItemPesanan;
use App\Models\Keranjang;
use App\Models\Pembayaran;
use App\Models\Notification;
use App\Services\BiteshipService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Midtrans\Config;
use Midtrans\Snap;

class CheckoutController extends Controller
{
    protected $biteshipService;

    public function __construct(BiteshipService $biteshipService)
    {
        $this->biteshipService = $biteshipService;
        
        // Configure Midtrans
        Config::$serverKey = config('services.midtrans.server_key');
        Config::$isProduction = config('services.midtrans.is_production', false);
        Config::$isSanitized = true;
        Config::$is3ds = true;
        
        // Disable SSL verification for development (Midtrans SDK)
        // WARNING: Only use this in development, never in production!
        Config::$curlOptions = [
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_SSL_VERIFYPEER => 0,
            CURLOPT_HTTPHEADER => [], // Must initialize to prevent undefined array key error
        ];
    }

    /**
     * Get shipping rates from Biteship
     */
    public function getShippingRates(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'destination_area_id' => 'required|string',
            'destination_postal_code' => 'nullable|string',
            'destination_latitude' => 'nullable|numeric',
            'destination_longitude' => 'nullable|numeric',
            'buy_now' => 'nullable|boolean',
            'produk_id' => 'required_if:buy_now,true|exists:produk,id',
            'jumlah' => 'required_if:buy_now,true|integer|min:1',
            'varian_ids' => 'nullable|array',
            'varian_ids.*' => 'exists:produk_varian,id',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse('Validasi gagal', $validator->errors());
        }

        try {
            $user = $request->user();
            $isBuyNow = $request->has('buy_now') && $request->buy_now;
            $items = [];
            $defaultWeight = (int) config('services.biteship.default_weight', 1000);

            if ($isBuyNow) {
                // Handle buy-now shipping calculation
                $produk = \App\Models\Produk::find($request->produk_id);
                if (!$produk) {
                    return $this->notFoundResponse('Produk tidak ditemukan');
                }

                $productPrice = $produk->harga ?? 0;
                
                // Add variant price if provided
                if ($request->has('varian_ids') && is_array($request->varian_ids)) {
                    $varians = \App\Models\ProdukVarian::whereIn('id', $request->varian_ids)->get();
                    foreach ($varians as $v) {
                        $productPrice += $v->harga_tambahan ?? 0;
                    }
                }

                $totalWeight = $request->jumlah * $defaultWeight;
                $totalValue = $productPrice * $request->jumlah;
            } else {
                // Get cart items
                $keranjang = Keranjang::where('user_id', $user->id)->with('items.produk')->first();

                if (!$keranjang || $keranjang->items->isEmpty()) {
                    return $this->badRequestResponse('Keranjang kosong');
                }

                // Calculate total weight and value
                $totalWeight = 0;
                $totalValue = 0;

                foreach ($keranjang->items as $item) {
                    $totalWeight += ($item->jumlah * $defaultWeight);
                    $totalValue += ($item->produk->harga ?? 0) * $item->jumlah;
                }
            }

            // Request shipping rates from Biteship
            $payload = [
                'destination_area_id' => $request->destination_area_id,
                'total_weight' => max(1, $totalWeight),
                'total_value' => $totalValue,
            ];

            // Add optional fields if provided
            if ($request->destination_postal_code) {
                $payload['destination_postal_code'] = $request->destination_postal_code;
            }
            if ($request->destination_latitude) {
                $payload['destination_latitude'] = $request->destination_latitude;
            }
            if ($request->destination_longitude) {
                $payload['destination_longitude'] = $request->destination_longitude;
            }

            // Log payload for debugging
            \Log::info('Biteship Payload:', $payload);

            $rates = $this->biteshipService->calculateRates($payload);

            return $this->successResponse($rates, 'Shipping rates retrieved successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal mendapatkan tarif pengiriman: ' . $e->getMessage());
        }
    }
    /**
     * Get checkout summary (cart items + total)
     */
    public function getSummary(Request $request)
    {
        try {
            $user = $request->user();
            
            // Check if this is a buy-now request
            $isBuyNow = $request->has('buy_now') && $request->buy_now;
            $items = [];
            
            if ($isBuyNow) {
                // Handle buy-now checkout
                $validator = Validator::make($request->all(), [
                    'produk_id' => 'required|exists:produk,id',
                    'jumlah' => 'required|integer|min:1',
                    'varian_ids' => 'nullable|array',
                    'varian_ids.*' => 'exists:produk_varian,id',
                ]);
                
                if ($validator->fails()) {
                    return $this->validationErrorResponse('Data tidak valid', $validator->errors());
                }
                
                $produk = \App\Models\Produk::find($request->produk_id);
                if (!$produk) {
                    return $this->notFoundResponse('Produk tidak ditemukan');
                }
                
                // Create a virtual item for buy-now
                $item = new \stdClass();
                $item->id = 0; // Virtual ID
                $item->produk_id = $produk->id;
                $item->jumlah = $request->jumlah;
                $item->produk = $produk;
                $item->varian = null;
                $item->varians = collect([]);
                
                // Load variants if provided
                if ($request->has('varian_ids') && is_array($request->varian_ids)) {
                    $item->varians = \App\Models\ProdukVarian::whereIn('id', $request->varian_ids)->get();
                }
                
                $items = collect([$item]);
            } else {
                // Get user's cart
                $keranjang = Keranjang::where('user_id', $user->id)->first();
                
                if (!$keranjang) {
                    return $this->badRequestResponse('Keranjang kosong');
                }
                
                // Get cart items with product details (don't eager load varians)
                $itemsQuery = $keranjang->items()->with(['produk', 'varian']);
                
                // Filter by selected item IDs if provided
                if ($request->has('item_ids') && is_array($request->item_ids) && !empty($request->item_ids)) {
                    \Log::info('Checkout getSummary filtering items:', ['item_ids' => $request->item_ids]);
                    $itemsQuery->whereIn('id', $request->item_ids);
                } else {
                    \Log::warning('Checkout getSummary no item_ids filter - will return ALL cart items');
                }
                
                $items = $itemsQuery->get();
                
                // Load varians manually for each item
                foreach ($items as $item) {
                    try {
                        $item->varians = $item->loadVariants();
                    } catch (\Exception $e) {
                        \Log::error('Error loading variants for item ' . $item->id, [
                            'error' => $e->getMessage(),
                            'varian_ids' => $item->varian_ids
                        ]);
                        $item->varians = collect([]);
                    }
                }
                \Log::info('Checkout getSummary items retrieved:', ['count' => $items->count(), 'item_ids' => $items->pluck('id')->toArray()]);
                
                if ($items->isEmpty()) {
                    return $this->badRequestResponse('Keranjang kosong');
                }
            }
            
            // Calculate totals
            $subtotal = 0;
            $itemsData = [];
            $totalQuantity = 0;
            $defaultWeight = (int) config('services.biteship.default_weight', 1000);
            $length = (int) config('services.biteship.item_length', 20);
            $width = (int) config('services.biteship.item_width', 15);
            $height = (int) config('services.biteship.item_height', 10);
            
            foreach ($items as $item) {
                $produk = $item->produk;
                $varian = $item->varian ?? null;
                $varians = $item->varians ?? collect([]);
                $productPrice = $produk->harga ?? 0;
                
                // Add variant price adjustment if exists
                if ($varians && is_object($varians) && $varians->count() > 0) {
                    // Multiple variants
                    foreach ($varians as $v) {
                        $productPrice += $v->harga_tambahan ?? 0;
                    }
                } elseif ($varian && isset($varian->harga_tambahan) && $varian->harga_tambahan) {
                    // Single variant (legacy)
                    $productPrice += $varian->harga_tambahan;
                }
                
                $itemTotal = $productPrice * $item->jumlah;
                $subtotal += $itemTotal;
                $totalQuantity += $item->jumlah;
                
                // Build variants data
                $variantsData = [];
                if ($varians && $varians->count() > 0) {
                    foreach ($varians as $v) {
                        $variantsData[] = [
                            'id' => $v->id,
                            'nama_varian' => $v->nama_varian,
                            'nilai_varian' => $v->nilai_varian,
                            'harga_tambahan' => $v->harga_tambahan,
                        ];
                    }
                }
                
                $itemsData[] = [
                    'id' => $item->id,
                    'produk_id' => $item->produk_id,
                    'nama' => optional($produk)->nama,
                    'harga' => $productPrice,
                    'jumlah' => $item->jumlah,
                    'subtotal' => $itemTotal,
                    'gambar' => optional($produk)->gambar,
                    'varian' => $varian ? [
                        'id' => $varian->id,
                        'nama_varian' => $varian->nama_varian,
                        'nilai_varian' => $varian->nilai_varian,
                        'harga_tambahan' => $varian->harga_tambahan,
                    ] : null,
                    'varians' => $variantsData,
                ];
            }
            
            $ongkir = 0;
            $total = $subtotal;
            $totalWeight = max(1, $totalQuantity) * $defaultWeight;
            $shippingMeta = [
                'couriers' => config('services.biteship.couriers', 'jne,jnt,sicepat'),
                'origin' => [
                    'area_id' => config('services.biteship.origin_area_id'),
                    'postal_code' => config('services.biteship.origin_postal_code'),
                    'address' => config('services.biteship.origin_address', 'Gudang Athleon'),
                ],
                'package' => [
                    'default_weight' => $defaultWeight,
                    'total_weight' => $totalWeight,
                    'dimensions' => compact('length', 'width', 'height'),
                ],
            ];
            
            return $this->successResponse([
                'items' => $itemsData,
                'subtotal' => $subtotal,
                'ongkir' => $ongkir,
                'total' => $total,
                'shipping' => $shippingMeta,
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'telepon' => $user->telepon ?? '',
                ]
            ], 'Checkout summary retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal mengambil data checkout: ' . $e->getMessage());
        }
    }
    
    /**
     * Process checkout and create order
     */
    public function process(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_penerima' => 'required|string|max:255',
            'nomor_telepon' => 'required|string|max:20',
            'alamat_pengiriman' => 'required|string',
            'metode_pembayaran' => 'required|in:transfer,cod,midtrans',
            'metode_pengiriman' => 'required|string',
            'shipping_cost' => 'nullable|numeric|min:0',
            'shipping_courier_code' => 'nullable|string|max:50',
            'shipping_courier_service' => 'nullable|string|max:100',
            'item_ids' => 'nullable|array',
            'item_ids.*' => 'integer',
            'buy_now' => 'nullable|boolean',
            'produk_id' => 'required_if:buy_now,true|exists:produk,id',
            'jumlah' => 'required_if:buy_now,true|integer|min:1',
            'varian_ids' => 'nullable|array',
            'varian_ids.*' => 'exists:produk_varian,id',
        ]);
        
        if ($validator->fails()) {
            return $this->validationErrorResponse('Validasi gagal', $validator->errors());
        }
        
        DB::beginTransaction();
        
        try {
            $user = $request->user();
            $isBuyNow = $request->has('buy_now') && $request->buy_now;
            $cartItems = collect([]);
            
            if ($isBuyNow) {
                // Handle buy-now checkout
                $produk = \App\Models\Produk::find($request->produk_id);
                if (!$produk) {
                    return $this->notFoundResponse('Produk tidak ditemukan');
                }
                
                // ===========================================
                // SECURITY VALIDATION: Cek status produk aktif
                // ===========================================
                if (isset($produk->is_active) && !$produk->is_active) {
                    return $this->badRequestResponse('Produk tidak tersedia untuk dibeli');
                }
                
                // ===========================================
                // SECURITY VALIDATION: Cek stok produk
                // ===========================================
                if ($produk->stok > 0 && $request->jumlah > $produk->stok) {
                    return $this->badRequestResponse('Stok produk tidak mencukupi. Stok tersedia: ' . $produk->stok);
                }
                
                // Create a virtual cart item for buy-now
                $item = new \stdClass();
                $item->produk_id = $produk->id;
                $item->jumlah = $request->jumlah;
                $item->produk = $produk;
                $item->varian = null;
                $item->varians = collect([]);
                
                // Load variants if provided
                if ($request->has('varian_ids') && is_array($request->varian_ids)) {
                    $varians = \App\Models\ProdukVarian::whereIn('id', $request->varian_ids)
                        ->where('produk_id', $produk->id) // SECURITY: Pastikan varian milik produk ini
                        ->get();
                    
                    // SECURITY VALIDATION: Cek semua varian ditemukan
                    if ($varians->count() !== count($request->varian_ids)) {
                        return $this->badRequestResponse('Satu atau lebih varian tidak valid untuk produk ini');
                    }
                    
                    // SECURITY VALIDATION: Cek stok varian
                    foreach ($varians as $v) {
                        if ($v->stok > 0 && $request->jumlah > $v->stok) {
                            return $this->badRequestResponse("Stok varian {$v->nilai_varian} tidak mencukupi. Stok tersedia: {$v->stok}");
                        }
                    }
                    
                    $item->varians = $varians;
                }
                
                $cartItems = collect([$item]);
            } else {
                // Get user's cart
                $keranjang = Keranjang::where('user_id', $user->id)->first();
                
                if (!$keranjang) {
                    return $this->badRequestResponse('Keranjang kosong');
                }
                
                // Get cart items with filtering (don't eager load varians)
                $itemsQuery = $keranjang->items()->with(['produk', 'varian']);
                
                // Filter by selected item IDs if provided
                if ($request->has('item_ids') && is_array($request->item_ids) && !empty($request->item_ids)) {
                    \Log::info('Checkout process filtering items:', ['item_ids' => $request->item_ids]);
                    $itemsQuery->whereIn('id', $request->item_ids);
                } else {
                    \Log::warning('Checkout process no item_ids filter - will process ALL cart items');
                }
                
                $cartItems = $itemsQuery->get();
                
                // Load varians manually for each item
                foreach ($cartItems as $item) {
                    try {
                        $item->varians = $item->loadVariants();
                    } catch (\Exception $e) {
                        \Log::error('Error loading variants for item ' . $item->id, [
                            'error' => $e->getMessage(),
                            'varian_ids' => $item->varian_ids
                        ]);
                        $item->varians = collect([]);
                    }
                }
                \Log::info('Checkout process items retrieved:', ['count' => $cartItems->count(), 'item_ids' => $cartItems->pluck('id')->toArray()]);
                
                if ($cartItems->isEmpty()) {
                    return $this->badRequestResponse('Tidak ada item yang dipilih');
                }
                
                // ===========================================
                // SECURITY VALIDATION: Validasi setiap item di cart
                // ===========================================
                foreach ($cartItems as $item) {
                    $produk = $item->produk;
                    
                    // Cek produk masih ada dan aktif
                    if (!$produk) {
                        return $this->badRequestResponse('Salah satu produk di keranjang tidak tersedia');
                    }
                    
                    if (isset($produk->is_active) && !$produk->is_active) {
                        return $this->badRequestResponse("Produk '{$produk->nama}' tidak tersedia untuk dibeli");
                    }
                    
                    // Re-fetch produk untuk mendapatkan harga terbaru dari database
                    $freshProduk = \App\Models\Produk::find($produk->id);
                    if (!$freshProduk) {
                        return $this->badRequestResponse("Produk '{$produk->nama}' tidak ditemukan");
                    }
                    
                    // Update dengan data fresh
                    $item->produk = $freshProduk;
                    
                    // Cek stok produk
                    if ($freshProduk->stok > 0 && $item->jumlah > $freshProduk->stok) {
                        return $this->badRequestResponse("Stok produk '{$freshProduk->nama}' tidak mencukupi. Stok tersedia: {$freshProduk->stok}");
                    }
                    
                    // Validasi stok varian
                    if (isset($item->varians) && is_object($item->varians) && $item->varians->count() > 0) {
                        foreach ($item->varians as $v) {
                            // Re-fetch varian untuk data terbaru
                            $freshVarian = \App\Models\ProdukVarian::find($v->id);
                            if (!$freshVarian) {
                                return $this->badRequestResponse("Varian produk tidak valid");
                            }
                            
                            if ($freshVarian->stok > 0 && $item->jumlah > $freshVarian->stok) {
                                return $this->badRequestResponse("Stok varian {$freshVarian->nilai_varian} untuk '{$freshProduk->nama}' tidak mencukupi. Stok tersedia: {$freshVarian->stok}");
                            }
                        }
                    }
                }
            }
            
            // ===========================================
            // Calculate totals - SELALU dari database, bukan dari request
            // ===========================================
            $subtotal = 0;
            $orderItems = [];
            
            foreach ($cartItems as $item) {
                // SECURITY: Ambil harga LANGSUNG dari database, bukan dari request/cache
                $freshProduk = \App\Models\Produk::find($item->produk_id);
                if (!$freshProduk) {
                    return $this->badRequestResponse('Produk tidak ditemukan');
                }
                
                $basePrice = $freshProduk->harga ?? 0;
                $unitPrice = $basePrice;
                
                // Add variant prices - DARI DATABASE
                if (isset($item->varians) && is_object($item->varians) && $item->varians->count() > 0) {
                    foreach ($item->varians as $v) {
                        // Re-fetch untuk harga terbaru
                        $freshVarian = \App\Models\ProdukVarian::find($v->id);
                        if ($freshVarian) {
                            $unitPrice += $freshVarian->harga_tambahan ?? 0;
                        }
                    }
                } elseif (isset($item->varian) && $item->varian && isset($item->varian->id)) {
                    $freshVarian = \App\Models\ProdukVarian::find($item->varian->id);
                    if ($freshVarian && $freshVarian->harga_tambahan) {
                        $unitPrice += $freshVarian->harga_tambahan;
                    }
                }
                
                $itemSubtotal = $unitPrice * $item->jumlah;
                $subtotal += $itemSubtotal;
                
                $orderItems[] = [
                    'id' => $item->produk_id,
                    'name' => $freshProduk->nama,
                    'price' => $unitPrice,
                    'quantity' => $item->jumlah,
                ];
                
                // Update item dengan fresh data untuk digunakan saat create order items
                $item->produk = $freshProduk;
            }

            // SECURITY: Validasi shipping cost tidak negatif dan tidak terlalu besar
            $shippingCost = (float) $request->input('shipping_cost', 0);
            if ($shippingCost < 0) {
                return $this->badRequestResponse('Biaya pengiriman tidak valid');
            }
            if ($shippingCost > 1000000) { // Max 1 juta untuk ongkir
                return $this->badRequestResponse('Biaya pengiriman melebihi batas maksimum');
            }
            
            $total = $subtotal + $shippingCost;
            
            // SECURITY: Validasi total harus positif
            if ($total <= 0) {
                return $this->badRequestResponse('Total pesanan tidak valid');
            }
            
            // Determine initial status based on payment method
            $initialStatus = 'Belum Dibayar';
            if ($request->metode_pembayaran === 'cod') {
                $initialStatus = 'Dikemas'; // COD langsung dikemas
            }
            
            // Create order
            $pesanan = Pesanan::create([
                'user_id' => $user->id,
                'tanggal_pesanan' => now(),
                'total_harga' => $total,
                'ongkir' => $shippingCost,
                'status' => $initialStatus,
                'alamat_pengiriman' => $request->alamat_pengiriman,
                'metode_pembayaran' => $request->metode_pembayaran,
                'metode_pengiriman' => $request->metode_pengiriman,
                'kurir_code' => $request->shipping_courier_code,
                'kurir_service' => $request->shipping_courier_service,
                'nama_penerima' => $request->nama_penerima,
                'nomor_telepon' => $request->nomor_telepon,
            ]);
            
            // Create order items - SELALU ambil harga dari database
            foreach ($cartItems as $item) {
                // SECURITY: Re-fetch untuk memastikan harga terbaru
                $freshProduk = \App\Models\Produk::find($item->produk_id);
                if (!$freshProduk) {
                    DB::rollBack();
                    return $this->badRequestResponse('Produk tidak ditemukan saat membuat pesanan');
                }
                
                $basePrice = $freshProduk->harga ?? 0;
                $unitPrice = $basePrice;
                $varianLabel = null;
                
                // Build variant label and calculate price - DARI DATABASE
                if (isset($item->varians) && is_object($item->varians) && $item->varians->count() > 0) {
                    $varianLabels = [];
                    foreach ($item->varians as $v) {
                        $freshVarian = \App\Models\ProdukVarian::find($v->id);
                        if ($freshVarian) {
                            $unitPrice += $freshVarian->harga_tambahan ?? 0;
                            $varianLabels[] = $freshVarian->nama_varian . ': ' . $freshVarian->nilai_varian;
                        }
                    }
                    $varianLabel = implode(', ', $varianLabels);
                } elseif (isset($item->varian) && $item->varian && isset($item->varian->id)) {
                    $freshVarian = \App\Models\ProdukVarian::find($item->varian->id);
                    if ($freshVarian) {
                        $unitPrice += $freshVarian->harga_tambahan ?? 0;
                        $varianLabel = $item->varian_label ?? ($freshVarian->nama_varian . ': ' . $freshVarian->nilai_varian);
                    }
                }
                
                ItemPesanan::create([
                    'pesanan_id' => $pesanan->id,
                    'produk_id' => $item->produk_id,
                    'varian_id' => isset($item->varian_id) ? $item->varian_id : null,
                    'varian_label' => $varianLabel ?? (isset($item->varian_label) ? $item->varian_label : null),
                    'harga_varian' => $unitPrice,
                    'jumlah' => $item->jumlah,
                    'harga_satuan' => $basePrice,
                    'subtotal' => $unitPrice * $item->jumlah,
                ]);
            }
            
            // Initialize payment response
            $paymentData = [
                'order_id' => $pesanan->id,
                'total' => $total,
                'subtotal' => $subtotal,
                'ongkir' => $shippingCost,
                'status' => $pesanan->status,
            ];
            
            // Handle Midtrans payment
            if ($request->metode_pembayaran === 'midtrans') {
                try {
                    $transactionDetails = [
                        'order_id' => 'ORDER-' . $pesanan->id . '-' . time(),
                        'gross_amount' => (int) $total,
                    ];

                    $itemDetails = [];
                    foreach ($orderItems as $item) {
                        $itemDetails[] = [
                            'id' => $item['id'],
                            'price' => (int) $item['price'],
                            'quantity' => $item['quantity'],
                            'name' => substr($item['name'], 0, 50),
                        ];
                    }

                    // Add shipping cost as item
                    if ($shippingCost > 0) {
                        $itemDetails[] = [
                            'id' => 'SHIPPING',
                            'price' => (int) $shippingCost,
                            'quantity' => 1,
                            'name' => 'Ongkos Kirim',
                        ];
                    }

                    $customerDetails = [
                        'first_name' => $request->nama_penerima,
                        'email' => $user->email,
                        'phone' => $request->nomor_telepon,
                        'shipping_address' => [
                            'address' => $request->alamat_pengiriman,
                            'first_name' => $request->nama_penerima,
                            'phone' => $request->nomor_telepon,
                        ],
                    ];

                    $params = [
                        'transaction_details' => $transactionDetails,
                        'item_details' => $itemDetails,
                        'customer_details' => $customerDetails,
                        'enabled_payments' => ['credit_card', 'bca_va', 'bni_va', 'bri_va', 'mandiri_va', 'permata_va', 'gopay', 'shopeepay', 'qris'],
                        'callbacks' => [
                            'finish' => url('/payment/callback'),
                        ]
                    ];

                    \Log::info('Midtrans Snap Request:', $params);

                    $snapToken = Snap::getSnapToken($params);
                    
                    \Log::info('Midtrans Snap Token Generated:', ['token' => $snapToken]);
                    
                    // Update payment record with snap token
                    Pembayaran::create([
                        'pesanan_id' => $pesanan->id,
                        'metode' => $request->metode_pembayaran,
                        'jumlah_bayar' => $total,
                        'status' => 'pending',
                        'tanggal_bayar' => null,
                        'snap_token' => $snapToken,
                        'transaction_id' => $transactionDetails['order_id'],
                    ]);

                    $paymentData['snap_token'] = $snapToken;
                    $paymentData['transaction_id'] = $transactionDetails['order_id'];
                    
                } catch (\Exception $e) {
                    DB::rollBack();
                    \Log::error('Midtrans Error:', [
                        'message' => $e->getMessage(),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    return $this->serverErrorResponse('Gagal membuat pembayaran Midtrans: ' . $e->getMessage());
                }
            } else {
                // Create payment record for non-Midtrans methods (COD, etc)
                $paymentStatus = $request->metode_pembayaran === 'cod' ? 'paid' : 'pending';
                $tanggalBayar = $request->metode_pembayaran === 'cod' ? now() : null;
                
                Pembayaran::create([
                    'pesanan_id' => $pesanan->id,
                    'metode' => $request->metode_pembayaran,
                    'jumlah_bayar' => $total,
                    'status' => $paymentStatus,
                    'tanggal_bayar' => $tanggalBayar,
                ]);
            }
            
            // Clear selected cart items after successful order (only for cart checkout, not buy-now)
            if (!$isBuyNow) {
                if ($request->has('item_ids') && is_array($request->item_ids) && count($request->item_ids) > 0) {
                    // Delete only selected items
                    $keranjang->items()->whereIn('id', $request->item_ids)->delete();
                } else {
                    // Delete all items if no selection
                    $keranjang->items()->delete();
                }
                
                // Recalculate cart total
                $remainingItems = $keranjang->items()->with(['produk', 'varian'])->get();
                $remainingTotal = $remainingItems->sum(function($item) {
                    $price = $item->produk->harga ?? 0;
                    
                    // Load varians manually
                    $varians = $item->loadVariants();
                    
                    if ($varians && $varians->count() > 0) {
                        foreach ($varians as $v) {
                            $price += $v->harga_tambahan ?? 0;
                        }
                    } elseif ($item->varian) {
                        $price += $item->varian->harga_tambahan ?? 0;
                    }
                    return $price * $item->jumlah;
                });
                
                $keranjang->update(['total_harga' => $remainingTotal]);
            }
            
            // Create notification for the user
            Notification::create([
                'user_id' => $user->id,
                'pesanan_id' => $pesanan->id,
                'title' => 'Pesanan Dibuat',
                'message' => 'Pesanan Anda telah berhasil dibuat. Silakan lakukan pembayaran untuk melanjutkan proses pengiriman.',
                'type' => 'order_created',
                'target_role' => 'customer',
                'sent_at' => now(),
            ]);
            
            DB::commit();
            
            return $this->createdResponse($paymentData, 'Pesanan berhasil dibuat');
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return $this->serverErrorResponse('Gagal membuat pesanan: ' . $e->getMessage());
        }
    }
    
    /**
     * Handle Midtrans payment finish redirect
     */
    public function paymentFinish(Request $request)
    {
        // User will be redirected here after payment
        // Redirect to orders page
        return redirect('/orders');
    }
    
    /**
     * Handle Midtrans notification webhook
     */
    public function paymentNotification(Request $request)
    {
        try {
            $serverKey = config('services.midtrans.server_key');
            $hashed = hash('sha512', $request->order_id . $request->status_code . $request->gross_amount . $serverKey);
            
            // Verify signature
            if ($hashed !== $request->signature_key) {
                return $this->forbiddenResponse('Invalid signature');
            }
            
            $transactionStatus = $request->transaction_status;
            $orderId = $request->order_id;
            $transactionId = $request->transaction_id;
            
            // Find payment by transaction_id
            $pembayaran = Pembayaran::where('transaction_id', $transactionId)->first();
            
            if (!$pembayaran) {
                return $this->notFoundResponse('Payment not found');
            }
            
            $pesanan = $pembayaran->pesanan;
            
            // Update payment and order status based on Midtrans response
            if ($transactionStatus === 'capture' || $transactionStatus === 'settlement') {
                $pembayaran->status = 'paid';
                $pembayaran->tanggal_bayar = now();
                $pembayaran->save();

                $pesanan->status = 'Dikemas';
                $pesanan->save();
            } elseif ($transactionStatus === 'pending') {
                $pembayaran->status = 'pending';
                $pembayaran->save();
            } elseif ($transactionStatus === 'deny' || $transactionStatus === 'cancel') {
                $pembayaran->status = 'failed';
                $pembayaran->save();

                $pesanan->status = 'Dibatalkan';
                $pesanan->save();
            } elseif ($transactionStatus === 'expire') {
                $pembayaran->status = 'expired';
                $pembayaran->save();

                $pesanan->status = 'Dibatalkan';
                $pesanan->save();
            }
            
            return $this->successResponse(null, 'Notification processed');
            
        } catch (\Exception $e) {
            \Log::error('Midtrans notification error: ' . $e->getMessage());
            return $this->serverErrorResponse('Error processing notification');
        }
    }
}

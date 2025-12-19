<?php

namespace App\Http\Controllers;

use App\Models\Banner;
use Illuminate\Http\Request;

class BannerController extends Controller
{
    public function index()
    {
        $banners = Banner::active()->get();
        return $this->successResponse($banners, 'Banner retrieved successfully');
    }
}

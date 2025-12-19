<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponseTrait
{
    /**
     * Success Response - 200 (OK)
     * Data berhasil diambil
     */
    protected function successResponse($data = null, string $message = 'Data retrieved successfully', int $statusCode = 200): JsonResponse
    {
        return response()->json([
            'status_code' => $statusCode,
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }

    /**
     * Created Response - 201
     * Data berhasil dibuat
     */
    protected function createdResponse($data = null, string $message = 'Resource created successfully'): JsonResponse
    {
        return response()->json([
            'status_code' => 201,
            'message' => $message,
            'data' => $data,
        ], 201);
    }

    /**
     * No Content Response - 204
     * Request valid tapi tidak ada data
     */
    protected function noContentResponse(string $message = 'No content'): JsonResponse
    {
        return response()->json([
            'status_code' => 204,
            'message' => $message,
            'data' => null,
        ], 200); // Note: 204 technically shouldn't have body, so we use 200 with null data
    }

    /**
     * Bad Request Response - 400
     * Request tidak sesuai aturan
     */
    protected function badRequestResponse(string $message = 'Bad request', $data = null): JsonResponse
    {
        return response()->json([
            'status_code' => 400,
            'message' => $message,
            'data' => $data,
        ], 400);
    }

    /**
     * Unauthorized Response - 401
     * Token salah atau belum login
     */
    protected function unauthorizedResponse(string $message = 'Unauthorized', $data = null): JsonResponse
    {
        return response()->json([
            'status_code' => 401,
            'message' => $message,
            'data' => $data,
        ], 401);
    }

    /**
     * Forbidden Response - 403
     * User tidak punya akses
     */
    protected function forbiddenResponse(string $message = 'Forbidden', $data = null): JsonResponse
    {
        return response()->json([
            'status_code' => 403,
            'message' => $message,
            'data' => $data,
        ], 403);
    }

    /**
     * Not Found Response - 404
     * Data tidak ditemukan
     */
    protected function notFoundResponse(string $message = 'Resource not found', $data = null): JsonResponse
    {
        return response()->json([
            'status_code' => 404,
            'message' => $message,
            'data' => $data,
        ], 404);
    }

    /**
     * Validation Error Response - 422
     * Validasi gagal
     */
    protected function validationErrorResponse($errors, string $message = 'Validation error'): JsonResponse
    {
        return response()->json([
            'status_code' => 422,
            'message' => $message,
            'data' => $errors,
        ], 422);
    }

    /**
     * Internal Server Error Response - 500
     * Kesalahan server
     */
    protected function serverErrorResponse(string $message = 'Internal server error', $data = null): JsonResponse
    {
        return response()->json([
            'status_code' => 500,
            'message' => $message,
            'data' => $data,
        ], 500);
    }

    /**
     * Service Unavailable Response - 503
     * Server sedang down / maintenance
     */
    protected function serviceUnavailableResponse(string $message = 'Service unavailable', $data = null): JsonResponse
    {
        return response()->json([
            'status_code' => 503,
            'message' => $message,
            'data' => $data,
        ], 503);
    }

    /**
     * Custom Response
     * Response dengan status code kustom
     */
    protected function customResponse(int $statusCode, string $message, $data = null): JsonResponse
    {
        return response()->json([
            'status_code' => $statusCode,
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }

    /**
     * Paginated Response
     * Response dengan data pagination
     */
    protected function paginatedResponse($paginator, string $message = 'Data retrieved successfully'): JsonResponse
    {
        return response()->json([
            'status_code' => 200,
            'message' => $message,
            'data' => $paginator->items(),
            'pagination' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ], 200);
    }
}

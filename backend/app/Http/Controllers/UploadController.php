<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|file|mimes:jpeg,png,jpg,webp,svg,gif|max:5120', // max 5MB
        ]);

        $file = $request->file('image');
        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = 'img_' . Str::random(16) . '_' . time() . '.' . $extension;

        $destinationPath = public_path('uploads');
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0755, true);
        }

        $file->move($destinationPath, $filename);

        $baseUrl = rtrim(config('app.url'), '/');
        if (str_contains($baseUrl, 'localhost') && $request->getSchemeAndHttpHost()) {
            $baseUrl = $request->getSchemeAndHttpHost();
        }
        $url = $baseUrl . '/uploads/' . $filename;

        return response()->json([
            'success' => true,
            'message' => 'Tải ảnh lên thành công.',
            'url' => $url,
            'path' => '/uploads/' . $filename
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Resources\CategoryResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Cache::remember('all_categories_list', 300, function () {
            return CategoryResource::collection(Category::all())->resolve();
        });

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách danh mục thành công.',
            'data' => $categories
        ]);
    }

    public function store(StoreCategoryRequest $request)
    {
        $category = Category::create($request->validated());
        Cache::forget('all_categories_list');

        return response()->json([
            'success' => true,
            'message' => 'Tạo danh mục thành công.',
            'data' => new CategoryResource($category)
        ], 201);
    }
}

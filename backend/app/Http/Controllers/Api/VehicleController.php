<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Vehicle;
use Illuminate\Support\Facades\Auth;

class VehicleController extends Controller
{
    // 1. GET: Fetch all vehicles for the logged-in user
    public function index()
    {
        // automatically gets ID from the logged-in user token
        return Vehicle::where('user_id', Auth::id())->get();
    }

    // 2. POST: Add a new vehicle
    public function store(Request $request)
    {
        $request->validate([
            'make' => 'required',
            'model' => 'required',
            'license_plate' => 'required|unique:vehicles',
            'year' => 'required|integer',
            'type' => 'required|in:car,moto,truck,bus',
        ]);

        $vehicle = Vehicle::create([
            'user_id' => Auth::id(), // Securely attach to current user
            'make' => $request->make,
            'model' => $request->model,
            'year' => $request->year,
            'license_plate' => $request->license_plate,
            'type' => $request->type,
        ]);

        return response()->json($vehicle, 201);
    }
}
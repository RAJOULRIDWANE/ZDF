<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ContactDetailsController;
use App\Http\Controllers\Api\ForgotPasswordController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\MechanicController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ReceptionistController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\InvoiceController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/contact', [ContactDetailsController::class, 'store']);
Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink']);
Route::post('/reset-password', [ForgotPasswordController::class, 'reset']);
Route::get('/services', [ServiceController::class, 'index']);

/*
|--------------------------------------------------------------------------
| Protected Routes (Requires Login)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // --- User & Auth ---
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/repairs/{id}/invoice', [InvoiceController::class, 'generate']); // Create Bill
    Route::post('/invoices/{id}/pay', [InvoiceController::class, 'pay']);       // Pay Bill


    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/staff', [AuthController::class, 'createStaff']);

    // --- General Data ---
    Route::get('/vehicles', [VehicleController::class, 'index']);
    Route::post('/vehicles', [VehicleController::class, 'store']);
    Route::get('/client/vehicles', [ClientController::class, 'index']);
    Route::post('/jobs/{id}/approve', [ClientController::class, 'approveJob']);
    Route::post('/jobs/{id}/negotiate', [ClientController::class, 'negotiateJob']);



    // --- MECHANIC ROUTES ---
    Route::prefix('mechanic')->group(function () {
        Route::get('/jobs', [MechanicController::class, 'getMyRepairs']);
        Route::get('/jobs/{id}', [MechanicController::class, 'show']);
        Route::patch('/jobs/{id}', [MechanicController::class, 'updateStatus']);
        
        // NEW: Submit Estimate
        Route::post('/jobs/{id}/estimate', [MechanicController::class, 'submitEstimate']);
        
        Route::post('/parts-request', [MechanicController::class, 'requestParts']);

        Route::get('/parts', [MechanicController::class, 'getParts']);
        Route::post('/jobs/{id}/parts', [MechanicController::class, 'addParts']);
        Route::post('/jobs/{id}/complete', [MechanicController::class, 'completeJob']);

    });

    // --- RECEPTIONIST ROUTES ---
    Route::prefix('receptionist')->group(function () {
        Route::get('/dashboard', [ReceptionistController::class, 'dashboard']);
        Route::get('/clients/search', [ReceptionistController::class, 'searchClients']);
        Route::get('/clients/{id}/vehicles', [ReceptionistController::class, 'getClientVehicles']);
        Route::get('/clients-summary', [ReceptionistController::class, 'getClientsWithRepairs']);
        Route::get('/client/{id}/repairs', [ReceptionistController::class, 'getClientRepairs']);
        Route::post('/jobs', [ReceptionistController::class, 'storeJob']);
        Route::delete('/jobs/{id}', [ReceptionistController::class, 'deleteJob']);
        Route::get('/repair/{id}', [ReceptionistController::class, 'show']);
        Route::put('/repairs/{id}/status', [ReceptionistController::class, 'updateStatus']);
        Route::get('/repairs/{id}/invoice', [ReceptionistController::class, 'invoice']);
        Route::post('/jobs/{id}/negotiate', [ReceptionistController::class, 'handleNegotiation']);
    });
    
    Route::middleware(['auth:sanctum', 'role:client'])->prefix('client')->group(function () {
    // This allows the client to see ONLY their own repairs
    Route::get('/repairs', function (Request $request) {
        $repairs = \App\Models\Repair::whereHas('vehicle', function($query) use ($request) {
            $query->where('client_id', $request->user()->id);
        })->with(['vehicle', 'services', 'parts'])->get();
        
        return \App\Http\Resources\RepairResource::collection($repairs);
    });
});
});
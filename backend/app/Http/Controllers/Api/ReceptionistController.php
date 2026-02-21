<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Repair;
use App\Models\Service;
use App\Http\Resources\RepairResource;

class ReceptionistController extends Controller
{
    public function dashboard()
    {
        $mechanics = User::whereIn('role', ['Mechanic', 'mechanic', 'MECHANIC'])
                        ->get(['id', 'name']);

        $repairs = Repair::with(['vehicle.client', 'mechanic', 'services']) 
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'user' => [
                'name' => Auth::user()->name,
                'role' => Auth::user()->role
            ], 
            'mechanics' => $mechanics,
            'repairs' => RepairResource::collection($repairs) 
        ]);
    }

    public function searchClients(Request $request)
    {
        $query = $request->input('query');
        if (!$query) return response()->json([]);

        $clients = User::whereIn('role', ['Client', 'client', 'CUSTOMER', 'customer'])
            ->where('name', 'LIKE', "%{$query}%")
            ->limit(10)
            ->get(['id', 'name']);

        return response()->json($clients);
    }

    public function getClientVehicles($clientId)
    {
        $vehicles = Vehicle::where('user_id', $clientId)->get();
        return response()->json($vehicles);
    }

    public function storeJob(Request $request)
    {
        // 1. Validate
        $validated = $request->validate([
            'vehicle_id'    => 'required',
            'mechanic_id'   => 'required',
            'service_ids'   => 'required|array', 
            'service_ids.*' => 'exists:services,id',
            'description'   => 'nullable', 
            'cost'          => 'required', 
            'date_end'      => 'required|date'
        ]);

        // Check if "General Diagnostic" is in the selected services
        $isDiagnostic = Service::whereIn('id', $validated['service_ids'])
            ->where(function($query) {
                $query->where('name', 'LIKE', '%General Diagnostic%')
                      ->orWhere('zone', 'diagnostic');
            })
            ->exists();

        // 2. Create Repair
        $repair = Repair::create([
            'vehicle_id'     => $validated['vehicle_id'],
            'mechanic_id'    => $validated['mechanic_id'],
            'description'    => $validated['description'] ?? 'Standard Service',
            'cost'           => $validated['cost'],
            'original_cost'  => $validated['cost'], // Save original cost
            'status'         => 'Pending',
            'is_diagnostic'  => $isDiagnostic, // Set diagnostic flag
            'date_entry'     => now(),
            'date_end'       => $validated['date_end'],
            // Invoice number is usually generated after job is done/approved, 
            // but if you generate it here, that's fine too.
            'invoice_number' => 'INV-' . strtoupper(uniqid()), 
        ]);
        
        // 3. Attach Services
        $repair->services()->attach($validated['service_ids']);

        // 4. Load Relationships
        $repair->load(['vehicle.client', 'mechanic', 'services']); 

        return response()->json([
            'message' => 'Created Successfully', 
            'repair'  => new RepairResource($repair) 
        ]);
    }

    

    public function updateStatus(Request $request, $id)
    {
        // UPDATED: Added new statuses to validation
        $request->validate([
            'status' => 'required|in:Pending,Diagnosing,Estimate Sent,Estimate Accepted,Negotiation Requested,In Progress,Completed,Canceled,Delivered,Waiting for Parts'
        ]);

        $repair = Repair::findOrFail($id);
        
        if ($request->status === 'Delivered' && $repair->status !== 'Completed') {
            return response()->json([
                'message' => 'Only completed repairs can be marked as delivered.'
            ], 422);
        }

        $repair->status = $request->status;
        $repair->save();

        return response()->json([
            'message' => 'Status Updated',
            'repair' => new RepairResource($repair)
        ]);
    }

    /**
     * NEW: Handle Negotiation & Generate Invoice
     */
    public function handleNegotiation(Request $request, $id)
    {
        $repair = Repair::findOrFail($id);

        $request->validate([
            'decision' => 'required|in:approve,reject' 
        ]);

        if ($repair->status !== 'Negotiation Requested') {
            return response()->json(['message' => 'No active negotiation for this job.'], 400);
        }

        if ($request->decision === 'approve') {
            // Apply 5% Discount
            $discount = $repair->original_cost * 0.05;
            $repair->cost = $repair->original_cost - $discount;
            $repair->discount_amount = $discount;
            $repair->negotiation_status = 'Approved';
            $message = "Discount approved! New price: " . $repair->cost;
        } else {
            // Reject: Revert to original price
            $repair->cost = $repair->original_cost;
            $repair->discount_amount = 0;
            $repair->negotiation_status = 'Rejected';
            $message = "Discount rejected. Price remains: " . $repair->cost;
        }

        // Finalize the Job
        $repair->status = 'In Progress'; // Work begins immediately after decision
        
        // Generate Invoice Number if not exists
        if (!$repair->invoice_number) {
            $repair->invoice_number = 'INV-' . strtoupper(uniqid()); 
        }
        
        $repair->save();

        return response()->json([
            'message' => $message,
            'repair' => new RepairResource($repair)
        ]);
    }

    public function deleteJob($id)
    {
         $repair = Repair::find($id);
         if($repair) {
             $repair->services()->detach(); 
             $repair->delete();
             return response()->json(['message' => 'Deleted']);
         }
         return response()->json(['message' => 'Not found'], 404);
    }

    public function getClientsWithRepairs()
    {
        $clients = User::whereHas('repairs')
            ->withCount('repairs')
            ->with(['vehicles'])
            ->get();

        return response()->json($clients);
    }

    public function getClientRepairs($clientId)
    {
        $client = User::findOrFail($clientId);

        $repairs = Repair::whereHas('vehicle', function($q) use ($clientId) {
                $q->where('user_id', $clientId);
            })
            ->with(['vehicle', 'mechanic', 'services']) 
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'client' => $client,
            'repairs' => RepairResource::collection($repairs)
        ]);
    }

    public function show($id)
    {
        $repair = Repair::with(['vehicle.client', 'mechanic', 'services'])->findOrFail($id);
        return new RepairResource($repair);
    }

    public function getInvoiceDetails($id)
    {
        $repair = Repair::with([
            'vehicle.client', 
            'mechanic', 
            'services', 
            'parts' 
        ])->findOrFail($id);

        return response()->json($repair);
    }

    public function invoice($id)
    {
        $repair = Repair::with([
            'vehicle.client', 
            'mechanic', 
            'services', 
            'parts' 
        ])->findOrFail($id);

        return new RepairResource($repair);
    }
}
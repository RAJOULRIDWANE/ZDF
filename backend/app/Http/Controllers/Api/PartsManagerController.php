<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Part;
use App\Models\PartRequest;
use Illuminate\Http\Request;

class PartsManagerController extends Controller
{
    /**
     * Dashboard: parts inventory + KPI counts
     */
    public function dashboard()
    {
        $parts   = Part::orderBy('name')->get();
        $pending = PartRequest::where('status', 'Pending')->count();
        $lowStock = $parts->where('stock_quantity', '<=', 30)->count();

        return response()->json([
            'parts'          => $parts,
            'pending_count'  => $pending,
            'low_stock_count'=> $lowStock,
            'total_parts'    => $parts->count(),
        ]);
    }

    /**
     * All part requests with details
     */
    public function requests()
    {
        $requests = PartRequest::with(['mechanic', 'part', 'repair.vehicle.client'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($requests);
    }

    /**
     * Approve a part request: attach part to repair, decrement stock
     */
    public function approve(Request $request, $id)
    {
        $partRequest = PartRequest::with(['repair', 'part'])->findOrFail($id);

        if ($partRequest->status !== 'Pending') {
            return response()->json(['message' => 'This request has already been processed.'], 400);
        }

        $part = $partRequest->part;

        if ($part->stock_quantity < $partRequest->quantity) {
            return response()->json([
                'message' => "Not enough stock. Available: {$part->stock_quantity}, Requested: {$partRequest->quantity}."
            ], 400);
        }

        // Attach part to repair
        $partRequest->repair->parts()->attach($part->id, [
            'quantity' => $partRequest->quantity,
            'price'    => $part->price,
        ]);

        // Decrement stock
        $part->decrement('stock_quantity', $partRequest->quantity);

        $partRequest->status = 'Approved';
        $partRequest->notes  = $request->input('notes');
        $partRequest->save();

        return response()->json([
            'message'      => 'Part request approved. Stock updated.',
            'part_request' => $partRequest,
        ]);
    }

    /**
     * Decline a part request
     */
    public function decline(Request $request, $id)
    {
        $request->validate(['notes' => 'nullable|string|max:500']);

        $partRequest = PartRequest::findOrFail($id);

        if ($partRequest->status !== 'Pending') {
            return response()->json(['message' => 'This request has already been processed.'], 400);
        }

        $partRequest->status = 'Declined';
        $partRequest->notes  = $request->input('notes');
        $partRequest->save();

        return response()->json([
            'message'      => 'Part request declined.',
            'part_request' => $partRequest,
        ]);
    }
}

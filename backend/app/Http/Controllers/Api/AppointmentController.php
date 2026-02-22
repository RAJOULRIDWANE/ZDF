<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    /**
     * Client creates an appointment request
     */
    public function store(Request $request)
    {
        $request->validate([
            'vehicle_id'     => 'nullable|exists:vehicles,id',
            'preferred_date' => 'required|date|after_or_equal:today',
            'description'    => 'nullable|string|max:500',
        ]);

        $appointment = Appointment::create([
            'user_id'        => $request->user()->id,
            'vehicle_id'     => $request->vehicle_id,
            'preferred_date' => $request->preferred_date,
            'description'    => $request->description,
            'status'         => 'Pending',
        ]);

        return response()->json([
            'message'     => 'Appointment request submitted successfully!',
            'appointment' => $appointment->load(['vehicle', 'client']),
        ], 201);
    }

    /**
     * Client views their own appointments
     */
    public function clientIndex(Request $request)
    {
        $appointments = Appointment::where('user_id', $request->user()->id)
            ->with(['vehicle', 'repair'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($appointments);
    }

    /**
     * Receptionist views all pending appointments
     */
    public function receptionistIndex()
    {
        $appointments = Appointment::with(['client', 'vehicle', 'repair'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($appointments);
    }

    /**
     * Receptionist approves an appointment
     */
    public function approve(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);

        $appointment->status              = 'Approved';
        $appointment->receptionist_notes  = $request->input('notes');
        $appointment->save();

        return response()->json([
            'message'     => 'Appointment approved.',
            'appointment' => $appointment,
        ]);
    }

    /**
     * Receptionist declines an appointment
     */
    public function decline(Request $request, $id)
    {
        $request->validate(['notes' => 'nullable|string|max:500']);

        $appointment = Appointment::findOrFail($id);

        $appointment->status             = 'Declined';
        $appointment->receptionist_notes = $request->input('notes');
        $appointment->save();

        return response()->json([
            'message'     => 'Appointment declined.',
            'appointment' => $appointment,
        ]);
    }
}

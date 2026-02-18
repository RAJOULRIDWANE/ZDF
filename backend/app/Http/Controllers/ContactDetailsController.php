<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ContactDetails;
use App\Mail\ContactMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class ContactDetailsController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'    => 'required|string|max:191',
            'email'   => 'required|email|max:191',
            'phone'   => 'required|string|max:20',
            'message' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'errors' => $validator->messages()
            ], 422);
        }

        $contact = ContactDetails::create([
            'name'    => $request->name,
            'email'   => $request->email,
            'phone'   => $request->phone,
            'message' => $request->message,
        ]);

        if ($contact) {
            // Send the email
            Mail::to('mecapro.info@gmail.com')->send(new ContactMail([
                'name'    => $request->name,
                'email'   => $request->email,
                'phone'   => $request->phone,
                'message' => $request->message,
            ]));

            return response()->json([
                'status'  => 200,
                'message' => 'Message Sent Successfully'
            ], 200);
        } else {
            return response()->json([
                'status'  => 500,
                'message' => 'Something went wrong'
            ], 500);
        }
    }
}
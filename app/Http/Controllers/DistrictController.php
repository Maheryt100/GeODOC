<?php

namespace App\Http\Controllers;

use App\Models\District;
use App\Models\UserDistrict;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DistrictController extends Controller
{
    //
    public function index(){
        return Inertia::render('circonscription/index',[
            'districts' => District::orderBy('id','asc')->get(),
        ]);
    }

    public function update(Request $request){

        $district = District::find($request->input('id'));

        $district->update($request->all());

        UserDistrict::create([
            'id_user' => Auth::user()->id,
            'id_district' => $district->id,
            'edilitaire' => $district->edilitaire,
            'agricole' => $district->agricole,
        ]);

        return redirect()->route('districts.terrain')->with('message','Modification avec succes');

    }
}

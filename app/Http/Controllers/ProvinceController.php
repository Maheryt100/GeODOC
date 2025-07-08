<?php

namespace App\Http\Controllers;

use App\Models\Province;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProvinceController extends Controller
{
    //

    public function loadProvince(){
        $provinces = Province::all();
        return Inertia::render('');
    }
}

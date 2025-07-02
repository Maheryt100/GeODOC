<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProvinceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $provinces = [
            ['id' => 1, 'nom_province' => 'Antananarivo'],
            ['id' => 2, 'nom_province' => 'Toamasina'],
            ['id' => 3, 'nom_province' => 'Mahajanga'],
            ['id' => 4, 'nom_province' => 'Fianarantsoa'],
            ['id' => 5, 'nom_province' => 'Antsiranana'],
            ['id' => 6, 'nom_province' => 'Toliara'],
        ];
        Db::table('provinces')->insert($provinces);
    }
}

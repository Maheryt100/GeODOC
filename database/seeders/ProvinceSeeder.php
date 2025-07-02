<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProvinceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $provinces = [
            ['id' => 1, 'nom' => 'Antananarivo'],
            ['id' => 2, 'nom' => 'Toamasina'],
            ['id' => 3, 'nom' => 'Mahajanga'],
            ['id' => 4, 'nom' => 'Fianarantsoa'],
            ['id' => 5, 'nom' => 'Antsiranana'],
            ['id' => 6, 'nom' => 'Toliara'],
        ];
        Db::table('province')->insert($provinces);
    }
}

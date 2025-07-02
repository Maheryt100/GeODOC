<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RegionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $regions = [
            ['id' => 1, 'nom_region' => 'Analamanga', 'id_region' => 1],
            ['id' => 2, 'nom_region' => 'Bongolava', 'id_region' => 1],
            ['id' => 3, 'nom_region' => 'Itasy', 'id_region' => 1],
            ['id' => 4, 'nom_region' => 'Vakinankaratra', 'id_region' => 1],
            ['id' => 5, 'nom_region' => 'Amoron’i Mania', 'id_region' => 4],
            ['id' => 6, 'nom_region' => 'Atsimo-Atsinana', 'id_region' => 4],
            ['id' => 7, 'nom_region' => 'Haute Matsiatra', 'id_region' => 4],
            ['id' => 8, 'nom_region' => 'Fitovinany', 'id_region' => 4],
            ['id' => 9, 'nom_region' => 'Vatovavy', 'id_region' => 4],
            ['id' => 10, 'nom_region' => 'Ihorombe', 'id_region' => 4],
            ['id' => 11, 'nom_region' => 'Alaotra Mangoro', 'id_region' => 2],
            ['id' => 12, 'nom_region' => 'Analanjirofo', 'id_region' => 2],
            ['id' => 13, 'nom_region' => 'Atsinanana', 'id_region' => 2],
            ['id' => 14, 'nom_region' => 'Betsiboka', 'id_region' => 3],
            ['id' => 15, 'nom_region' => 'Boeny', 'id_region' => 3],
            ['id' => 16, 'nom_region' => 'Melaky', 'id_region' => 3],
            ['id' => 17, 'nom_region' => 'Sofia', 'id_region' => 3],
            ['id' => 18, 'nom_region' => 'Androy', 'id_region' => 6],
            ['id' => 19, 'nom_region' => 'Anosy', 'id_region' => 6],
            ['id' => 20, 'nom_region' => 'Atsimo-Andrefana', 'id_region' => 6],
            ['id' => 21, 'nom_region' => 'Menabe', 'id_region' => 6],
            ['id' => 22, 'nom_region' => 'Diana', 'id_region' => 5],
            ['id' => 23, 'nom_region' => 'Sava', 'id_region' => 5],
        ];
        DB::table('regions')->insert($regions);
    }
}

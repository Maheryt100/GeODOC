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
            ['id' => 1, 'nom_region' => 'Analamanga', 'id_province' => 1],
            ['id' => 2, 'nom_region' => 'Bongolava', 'id_province' => 1],
            ['id' => 3, 'nom_region' => 'Itasy', 'id_province' => 1],
            ['id' => 4, 'nom_region' => 'Vakinankaratra', 'id_province' => 1],
            ['id' => 5, 'nom_region' => 'Amoron’i Mania', 'id_province' => 4],
            ['id' => 6, 'nom_region' => 'Atsimo-Atsinana', 'id_province' => 4],
            ['id' => 7, 'nom_region' => 'Haute Matsiatra', 'id_province' => 4],
            ['id' => 8, 'nom_region' => 'Fitovinany', 'id_province' => 4],
            ['id' => 9, 'nom_region' => 'Vatovavy', 'id_province' => 4],
            ['id' => 10, 'nom_region' => 'Ihorombe', 'id_province' => 4],
            ['id' => 11, 'nom_region' => 'Alaotra Mangoro', 'id_province' => 2],
            ['id' => 12, 'nom_region' => 'Analanjirofo', 'id_province' => 2],
            ['id' => 13, 'nom_region' => 'Atsinanana', 'id_province' => 2],
            ['id' => 14, 'nom_region' => 'Betsiboka', 'id_province' => 3],
            ['id' => 15, 'nom_region' => 'Boeny', 'id_province' => 3],
            ['id' => 16, 'nom_region' => 'Melaky', 'id_province' => 3],
            ['id' => 17, 'nom_region' => 'Sofia', 'id_province' => 3],
            ['id' => 18, 'nom_region' => 'Androy', 'id_province' => 6],
            ['id' => 19, 'nom_region' => 'Anosy', 'id_province' => 6],
            ['id' => 20, 'nom_region' => 'Atsimo-Andrefana', 'id_province' => 6],
            ['id' => 21, 'nom_region' => 'Menabe', 'id_province' => 6],
            ['id' => 22, 'nom_region' => 'Diana', 'id_province' => 5],
            ['id' => 23, 'nom_region' => 'Sava', 'id_province' => 5],
        ];
        DB::table('regions')->insert($regions);
    }
}

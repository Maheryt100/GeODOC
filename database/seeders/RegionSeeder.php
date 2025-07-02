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
            ['id' => 1, 'nom' => 'Analamanga', 'id_region' => 1],
            ['id' => 2, 'nom' => 'Bongolava', 'id_region' => 1],
            ['id' => 3, 'nom' => 'Itasy', 'id_region' => 1],
            ['id' => 4, 'nom' => 'Vakinankaratra', 'id_region' => 1],
            ['id' => 5, 'nom' => 'Amoron’i Mania', 'id_region' => 4],
            ['id' => 6, 'nom' => 'Atsimo-Atsinana', 'id_region' => 4],
            ['id' => 7, 'nom' => 'Haute Matsiatra', 'id_region' => 4],
            ['id' => 8, 'nom' => 'Fitovinany', 'id_region' => 4],
            ['id' => 9, 'nom' => 'Vatovavy', 'id_region' => 4],
            ['id' => 10, 'nom' => 'Ihorombe', 'id_region' => 4],
            ['id' => 11, 'nom' => 'Alaotra Mangoro', 'id_region' => 2],
            ['id' => 12, 'nom' => 'Analanjirofo', 'id_region' => 2],
            ['id' => 13, 'nom' => 'Atsinanana', 'id_region' => 2],
            ['id' => 14, 'nom' => 'Betsiboka', 'id_region' => 3],
            ['id' => 15, 'nom' => 'Boeny', 'id_region' => 3],
            ['id' => 16, 'nom' => 'Melaky', 'id_region' => 3],
            ['id' => 17, 'nom' => 'Sofia', 'id_region' => 3],
            ['id' => 18, 'nom' => 'Androy', 'id_region' => 6],
            ['id' => 19, 'nom' => 'Anosy', 'id_region' => 6],
            ['id' => 20, 'nom' => 'Atsimo-Andrefana', 'id_region' => 6],
            ['id' => 21, 'nom' => 'Menabe', 'id_region' => 6],
            ['id' => 22, 'nom' => 'Diana', 'id_region' => 5],
            ['id' => 23, 'nom' => 'Sava', 'id_region' => 5],
        ];
        DB::table('region')->insert($regions);
    }
}

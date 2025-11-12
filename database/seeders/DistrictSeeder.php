<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DistrictSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $districts = [
            // ANALAMANGA (id_region = 1)
            ['id' => 1, 'nom_district' => 'Ambohidratrimo', 'id_region' => 1, 'edilitaire' => 20, 'agricole' => 10, 'forestiere' => 10, 'touristique' => 10],
            ['id' => 2, 'nom_district' => 'Andramasina', 'id_region' => 1, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 3, 'nom_district' => 'Anjozorobe', 'id_region' => 1, 'edilitaire' => 20, 'agricole' => 10, 'forestiere' => 10, 'touristique' => 10],
            ['id' => 4, 'nom_district' => 'Ankazobe', 'id_region' => 1, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 5, 'nom_district' => 'Antananarivo Atsimondrano', 'id_region' => 1, 'edilitaire' => 20, 'agricole' => 10, 'forestiere' => 10, 'touristique' => 10],
            ['id' => 6, 'nom_district' => 'Antananarivo Avaradrano', 'id_region' => 1, 'edilitaire' => 20, 'agricole' => 10, 'forestiere' => 10, 'touristique' => 10],
            ['id' => 7, 'nom_district' => 'Antananarivo Renivohitra', 'id_region' => 1, 'edilitaire' => 1000, 'agricole' => 1000, 'forestiere' => 1000, 'touristique' => 1000],
            ['id' => 13, 'nom_district' => 'Manjakandriana', 'id_region' => 1, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            
            // BONGOLAVA (id_region = 2)
            ['id' => 14, 'nom_district' => 'Fenoarivobe', 'id_region' => 2, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 15, 'nom_district' => 'Tsiroanomandidy', 'id_region' => 2, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            
            // ITASY (id_region = 3)
            ['id' => 16, 'nom_district' => 'Arivonimamo', 'id_region' => 3, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 17, 'nom_district' => 'Miarinarivo', 'id_region' => 3, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 18, 'nom_district' => 'Soavinandriana', 'id_region' => 3, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            
            // VAKINANKARATRA (id_region = 4)
            ['id' => 19, 'nom_district' => 'Ambatolampy', 'id_region' => 4, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 20, 'nom_district' => 'Antanifotsy', 'id_region' => 4, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 21, 'nom_district' => 'Antsirabe I', 'id_region' => 4, 'edilitaire' => 50, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 22, 'nom_district' => 'Antsirabe II', 'id_region' => 4, 'edilitaire' => 50, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 23, 'nom_district' => 'Betafo', 'id_region' => 4, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 24, 'nom_district' => 'Faratsiho', 'id_region' => 4, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 25, 'nom_district' => 'Mandoto', 'id_region' => 4, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            
            // DIANA (id_region = 22)
            ['id' => 26, 'nom_district' => 'Ambanja', 'id_region' => 22, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 27, 'nom_district' => 'Ambilobe', 'id_region' => 22, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 28, 'nom_district' => 'Antsiranana I', 'id_region' => 22, 'edilitaire' => 50, 'agricole' => 50, 'forestiere' => 50, 'touristique' => 50],
            ['id' => 29, 'nom_district' => 'Antsiranana II', 'id_region' => 22, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 30, 'nom_district' => 'Nosy-BE', 'id_region' => 22, 'edilitaire' => 50, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 50],
            
            // SAVA (id_region = 23)
            ['id' => 31, 'nom_district' => 'Andapa', 'id_region' => 23, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 32, 'nom_district' => 'Antalaha', 'id_region' => 23, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 33, 'nom_district' => 'Sambava', 'id_region' => 23, 'edilitaire' => 50, 'agricole' => 50, 'forestiere' => 50, 'touristique' => 50],
            ['id' => 34, 'nom_district' => 'Vohemar', 'id_region' => 23, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            
            // AMORON'I MANIA (id_region = 5)
            ['id' => 35, 'nom_district' => 'Ambatofinandrahana', 'id_region' => 5, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 36, 'nom_district' => 'Ambositra', 'id_region' => 5, 'edilitaire' => 50, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 37, 'nom_district' => 'Fandriana', 'id_region' => 5, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 38, 'nom_district' => 'Manandriana', 'id_region' => 5, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            
            // ATSIMO-ATSINANANA (id_region = 6)
            ['id' => 39, 'nom_district' => 'Befotaka Atsimo', 'id_region' => 6, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 40, 'nom_district' => 'Farafangana', 'id_region' => 6, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 41, 'nom_district' => 'Midongy Sud', 'id_region' => 6, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 42, 'nom_district' => 'Vangaindrano', 'id_region' => 6, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 43, 'nom_district' => 'Vondrozo', 'id_region' => 6, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            
            // HAUTE MATSIATRA (id_region = 7)
            ['id' => 44, 'nom_district' => 'Ambalavao', 'id_region' => 7, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 45, 'nom_district' => 'Ambohimahasoa', 'id_region' => 7, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 46, 'nom_district' => 'Fianarantsoa', 'id_region' => 7, 'edilitaire' => 50, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 47, 'nom_district' => 'Isandra', 'id_region' => 7, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 48, 'nom_district' => 'Ikalamavony', 'id_region' => 7, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 49, 'nom_district' => 'Vohibato', 'id_region' => 7, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 50, 'nom_district' => 'Lalangina', 'id_region' => 7, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            
            // IHOROMBE (id_region = 10)
            ['id' => 51, 'nom_district' => 'Iakora', 'id_region' => 10, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 52, 'nom_district' => 'Ihosy', 'id_region' => 10, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 53, 'nom_district' => 'Ivohibe', 'id_region' => 10, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            
            // VATOVAVY (id_region = 9)
            ['id' => 54, 'nom_district' => 'Ifanadiana', 'id_region' => 9, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 57, 'nom_district' => 'Mananjary', 'id_region' => 9, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 58, 'nom_district' => 'Nosy Varika', 'id_region' => 9, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            
            // FITOVINANY (id_region = 8)
            ['id' => 55, 'nom_district' => 'Ikongo', 'id_region' => 8, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 56, 'nom_district' => 'Manakara', 'id_region' => 8, 'edilitaire' => 50, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 59, 'nom_district' => 'Vohipeno', 'id_region' => 8, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            
            // BETSIBOKA (id_region = 14)
            ['id' => 60, 'nom_district' => 'Kandreho', 'id_region' => 14, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 61, 'nom_district' => 'Maevatanana', 'id_region' => 14, 'edilitaire' => 20, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 62, 'nom_district' => 'Tsaratanana', 'id_region' => 14, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            
            // BOENY (id_region = 15)
            ['id' => 63, 'nom_district' => 'Ambato Boeni', 'id_region' => 15, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 64, 'nom_district' => 'Mahajanga I', 'id_region' => 15, 'edilitaire' => 50, 'agricole' => 50, 'forestiere' => 50, 'touristique' => 50],
            ['id' => 65, 'nom_district' => 'Mahajanga II', 'id_region' => 15, 'edilitaire' => 20, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 66, 'nom_district' => 'Marovoay', 'id_region' => 15, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 67, 'nom_district' => 'Mitsinjo', 'id_region' => 15, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 68, 'nom_district' => 'Soalala', 'id_region' => 15, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            
            // MELAKY (id_region = 16)
            ['id' => 69, 'nom_district' => 'Ambatomainty', 'id_region' => 16, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 70, 'nom_district' => 'Antsalova', 'id_region' => 16, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 71, 'nom_district' => 'Besalampy', 'id_region' => 16, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 72, 'nom_district' => 'Maintirano', 'id_region' => 16, 'edilitaire' => 5, 'agricole' => 2, 'forestiere' => 2, 'touristique' => 2],
            ['id' => 73, 'nom_district' => 'Morafenobe', 'id_region' => 16, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            
            // SOFIA (id_region = 17)
            ['id' => 74, 'nom_district' => 'Analalava', 'id_region' => 17, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 75, 'nom_district' => 'Antsohihy', 'id_region' => 17, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 76, 'nom_district' => 'Bealanana', 'id_region' => 17, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 77, 'nom_district' => 'Befandriana Nord', 'id_region' => 17, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 78, 'nom_district' => 'Mampikony', 'id_region' => 17, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 79, 'nom_district' => 'Mandritsara', 'id_region' => 17, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 80, 'nom_district' => 'Port-Berge', 'id_region' => 17, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            
            // ALAOTRA-MANGORO (id_region = 11)
            ['id' => 81, 'nom_district' => 'Ambatondrazaka', 'id_region' => 11, 'edilitaire' => 50, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 82, 'nom_district' => 'Amparafaravola', 'id_region' => 11, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 83, 'nom_district' => 'Andilamena', 'id_region' => 11, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 84, 'nom_district' => 'Anosibe An\'Ala', 'id_region' => 11, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 85, 'nom_district' => 'Moramanga', 'id_region' => 11, 'edilitaire' => 50, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            
            // ANALANJIROFO (id_region = 12)
            ['id' => 86, 'nom_district' => 'Fenerive Est', 'id_region' => 12, 'edilitaire' => 50, 'agricole' => 7, 'forestiere' => 7, 'touristique' => 7],
            ['id' => 87, 'nom_district' => 'Mananara-Nord', 'id_region' => 12, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 88, 'nom_district' => 'Maroantsetra', 'id_region' => 12, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 89, 'nom_district' => 'Sainte Marie', 'id_region' => 12, 'edilitaire' => 10, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 20],
            ['id' => 90, 'nom_district' => 'Soanierana Ivongo', 'id_region' => 12, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 91, 'nom_district' => 'Vavatenina', 'id_region' => 12, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            
            // ATSINANANA (id_region = 13)
            ['id' => 92, 'nom_district' => 'Antanambao Manampontsy', 'id_region' => 13, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 93, 'nom_district' => 'Brickaville', 'id_region' => 13, 'edilitaire' => 50, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 94, 'nom_district' => 'Mahanoro', 'id_region' => 13, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 95, 'nom_district' => 'Marolambo', 'id_region' => 13, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 96, 'nom_district' => 'Toamasina I', 'id_region' => 13, 'edilitaire' => 100, 'agricole' => 10, 'forestiere' => 10, 'touristique' => 10],
            ['id' => 97, 'nom_district' => 'Toamasina II', 'id_region' => 13, 'edilitaire' => 50, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 98, 'nom_district' => 'Vatomandry', 'id_region' => 13, 'edilitaire' => 50, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            
            // ANDROY (id_region = 18)
            ['id' => 99, 'nom_district' => 'Ambovombe Androy', 'id_region' => 18, 'edilitaire' => 5, 'agricole' => 2, 'forestiere' => 2, 'touristique' => 2],
            ['id' => 100, 'nom_district' => 'Bekily', 'id_region' => 18, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 101, 'nom_district' => 'Beloha Androy', 'id_region' => 18, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 102, 'nom_district' => 'Tsihombe', 'id_region' => 18, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            
            // ANOSY (id_region = 19)
            ['id' => 103, 'nom_district' => 'Amboasary Sud', 'id_region' => 19, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 104, 'nom_district' => 'Betroka', 'id_region' => 19, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 105, 'nom_district' => 'Taolanaro', 'id_region' => 19, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 10],
            
            // ATSIMO-ANDREFANA (id_region = 20)
            ['id' => 106, 'nom_district' => 'Ampanihy Ouest', 'id_region' => 20, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 107, 'nom_district' => 'Ankazoabo Sud', 'id_region' => 20, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 108, 'nom_district' => 'Benenitra', 'id_region' => 20, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 109, 'nom_district' => 'Beroroha', 'id_region' => 20, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 110, 'nom_district' => 'Betioky Sud', 'id_region' => 20, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 111, 'nom_district' => 'Morombe', 'id_region' => 20, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 112, 'nom_district' => 'Sakaraha', 'id_region' => 20, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 113, 'nom_district' => 'Toliara I', 'id_region' => 20, 'edilitaire' => 50, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 114, 'nom_district' => 'Toliara II', 'id_region' => 20, 'edilitaire' => 50, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            
            // MENABE (id_region = 21)
            ['id' => 115, 'nom_district' => 'Belo Sur Tsiribihina', 'id_region' => 21, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 116, 'nom_district' => 'Mahabo', 'id_region' => 21, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 117, 'nom_district' => 'Manja', 'id_region' => 21, 'edilitaire' => 5, 'agricole' => 3, 'forestiere' => 3, 'touristique' => 3],
            ['id' => 118, 'nom_district' => 'Miandrivazo', 'id_region' => 21, 'edilitaire' => 10, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5],
            ['id' => 119, 'nom_district' => 'Morondava', 'id_region' => 21, 'edilitaire' => 50, 'agricole' => 5, 'forestiere' => 5, 'touristique' => 5]
        ];
        
        DB::table('districts')->insert($districts);
    }
}
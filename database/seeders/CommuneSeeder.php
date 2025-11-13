<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class CommuneSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Charger le fichier JSON des communes par district
        $jsonPath = database_path('seeders/data/liste_commune_par_district.json');
        
        if (!File::exists($jsonPath)) {
            $this->command->error("❌ Erreur: Le fichier liste_commune_par_district.json est introuvable!");
            $this->command->warn("Placez-le dans: database/seeders/data/");
            return;
        }
        
        $jsonData = json_decode(File::get($jsonPath), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->command->error("❌ Erreur de parsing JSON: " . json_last_error_msg());
            return;
        }

        // Mapping des régions vers leurs IDs
        $regionMapping = [
            'ANALAMANGA' => 1, 'BONGOLAVA' => 2, 'ITASY' => 3, 'VAKINANKARATRA' => 4,
            'AMORON\'I MANIA' => 5, 'ATSIMO-ATSINANANA' => 6, 'HAUTE MATSIATRA' => 7,
            'FITOVINANY' => 8, 'VATOVAVY' => 9, 'IHOROMBE' => 10, 'ALAOTRA-MANGORO' => 11,
            'ANALANJIROFO' => 12, 'ATSINANANA' => 13, 'BETSIBOKA' => 14, 'BOENY' => 15,
            'MELAKY' => 16, 'SOFIA' => 17, 'ANDROY' => 18, 'ANOSY' => 19,
            'ATSIMO-ANDREFANA' => 20, 'MENABE' => 21, 'DIANA' => 22, 'SAVA' => 23,
        ];

        // Mapping complet des 119 districts vers leurs IDs
        $districtMapping = [
            // ====== ANALAMANGA (Région 1) ======
            'Ambohidratrimo' => 1,
            'Andramasina' => 2,
            'Anjozorobe' => 3,
            'Ankazobe' => 4,
            'Antananarivo Atsimondrano' => 5,
            'Antananarivo Avaradrano' => 6,
            // Les 6 arrondissements d'Antananarivo sont regroupés sous ID 7
            'Antananarivo Renivohitra' => 7,
            'Antananarivo-I' => 7,
            'Antananarivo-II' => 7,
            'Antananarivo-III' => 7,
            'Antananarivo-IV' => 7,
            'Antananarivo-V' => 7,
            'Antananarivo-VI' => 7,
            'Manjakandriana' => 13,
            
            // ====== BONGOLAVA (Région 2) ======
            'Fenoarivobe' => 14,
            'FENOARIVOBE' => 14,
            'Tsiroanomandidy' => 15,
            'TSIROANOMANDIDY' => 15,
            
            // ====== ITASY (Région 3) ======
            'Arivonimamo' => 16,
            'ARIVONIMAMO' => 16,
            'Miarinarivo' => 17,
            'MIARINARIVO' => 17,
            'Soavinandriana' => 18,
            'SOAVINANDRIANA' => 18,
            
            // ====== VAKINANKARATRA (Région 4) ======
            'Ambatolampy' => 19,
            'AMBATOLAMPY' => 19,
            'Antanifotsy' => 20,
            'ANTANIFOTSY' => 20,
            'Antsirabe I' => 21,
            'ANTSIRABE I' => 21,
            'Antsirabe II' => 22,
            'ANTSIRABE II' => 22,
            'Betafo' => 23,
            'BETAFO' => 23,
            'Faratsiho' => 24,
            'FARATSIHO' => 24,
            'Mandoto' => 25,
            'MANDOTO' => 25,
            
            // ====== DIANA (Région 22) ======
            'Ambanja' => 26,
            'AMBANJA' => 26,
            'Ambilobe' => 27,
            'AMBILOBE' => 27,
            'Antsiranana I' => 28,
            'ANTSIRANANA I' => 28,
            'Antsiranana II' => 29,
            'ANTSIRANANA II' => 29,
            'Nosy-BE' => 30,
            'NOSY-BE' => 30,
            
            // ====== SAVA (Région 23) ======
            'Andapa' => 31,
            'ANDAPA' => 31,
            'Antalaha' => 32,
            'ANTALAHA' => 32,
            'Sambava' => 33,
            'SAMBAVA' => 33,
            'Vohemar' => 34,
            'VOHEMAR' => 34,
            
            // ====== AMORON'I MANIA (Région 5) ======
            'Ambatofinandrahana' => 35,
            'AMBATOFINANDRAHANA' => 35,
            'Ambositra' => 36,
            'AMBOSITRA' => 36,
            'Fandriana' => 37,
            'FANDRIANA' => 37,
            'Manandriana' => 38,
            'MANANDRIANA' => 38,
            
            // ====== ATSIMO-ATSINANANA (Région 6) ======
            'Befotaka Atsimo' => 39,
            'BEFOTAKA ATSIMO' => 39,
            'Farafangana' => 40,
            'FARAFANGANA' => 40,
            'Midongy Sud' => 41,
            'MIDONGY SUD' => 41,
            'Vangaindrano' => 42,
            'VANGAINDRANO' => 42,
            'Vondrozo' => 43,
            'VONDROZO' => 43,
            
            // ====== HAUTE MATSIATRA (Région 7) ======
            'Ambalavao' => 44,
            'AMBALAVAO' => 44,
            'Ambohimahasoa' => 45,
            'AMBOHIMAHASOA' => 45,
            'Fianarantsoa' => 46,
            'FIANARANTSOA' => 46,
            'Isandra' => 47,
            'ISANDRA' => 47,
            'Ikalamavony' => 48,
            'IKALAMAVONY' => 48,
            'Vohibato' => 49,
            'VOHIBATO' => 49,
            'Lalangina' => 50,
            'LALANGINA' => 50,
            
            // ====== IHOROMBE (Région 10) ======
            'Iakora' => 51,
            'IAKORA' => 51,
            'Ihosy' => 52,
            'IHOSY' => 52,
            'Ivohibe' => 53,
            'IVOHIBE' => 53,
            
            // ====== VATOVAVY (Région 9) ======
            'Ifanadiana' => 54,
            'IFANADIANA' => 54,
            'Mananjary' => 57,
            'MANANJARY' => 57,
            'Nosy Varika' => 58,
            'NOSY VARIKA' => 58,
            
            // ====== FITOVINANY (Région 8) ======
            'Ikongo' => 55,
            'IKONGO' => 55,
            'Manakara' => 56,
            'MANAKARA' => 56,
            'Vohipeno' => 59,
            'VOHIPENO' => 59,
            
            // ====== BETSIBOKA (Région 14) ======
            'Kandreho' => 60,
            'KANDREHO' => 60,
            'Maevatanana' => 61,
            'MAEVATANANA' => 61,
            'Tsaratanana' => 62,
            'TSARATANANA' => 62,
            
            // ====== BOENY (Région 15) ======
            'Ambato Boeni' => 63,
            'AMBATO BOENI' => 63,
            'Mahajanga I' => 64,
            'MAHAJANGA I' => 64,
            'Mahajanga II' => 65,
            'MAHAJANGA II' => 65,
            'Marovoay' => 66,
            'MAROVOAY' => 66,
            'Mitsinjo' => 67,
            'MITSINJO' => 67,
            'Soalala' => 68,
            'SOALALA' => 68,
            
            // ====== MELAKY (Région 16) ======
            'Ambatomainty' => 69,
            'AMBATOMAINTY' => 69,
            'Antsalova' => 70,
            'ANTSALOVA' => 70,
            'Besalampy' => 71,
            'BESALAMPY' => 71,
            'Maintirano' => 72,
            'MAINTIRANO' => 72,
            'Morafenobe' => 73,
            'MORAFENOBE' => 73,
            
            // ====== SOFIA (Région 17) ======
            'Analalava' => 74,
            'ANALALAVA' => 74,
            'Antsohihy' => 75,
            'ANTSOHIHY' => 75,
            'Bealanana' => 76,
            'BEALANANA' => 76,
            'Befandriana Nord' => 77,
            'BEFANDRIANA NORD' => 77,
            'Mampikony' => 78,
            'MAMPIKONY' => 78,
            'Mandritsara' => 79,
            'MANDRITSARA' => 79,
            'Port-Berge' => 80,
            'PORT-BERGE' => 80,
            
            // ====== ALAOTRA-MANGORO (Région 11) ======
            'Ambatondrazaka' => 81,
            'AMBATONDRAZAKA' => 81,
            'Amparafaravola' => 82,
            'AMPARAFARAVOLA' => 82,
            'Andilamena' => 83,
            'ANDILAMENA' => 83,
            'Anosibe An\'Ala' => 84,
            'ANOSIBE AN\'ALA' => 84,
            'Anosibe An ALA' => 84,
            'ANOSIBE AN ALA' => 84,
            'Moramanga' => 85,
            'MORAMANGA' => 85,
            
            // ====== ANALANJIROFO (Région 12) ======
            'Fenerive Est' => 86,
            'FENERIVE EST' => 86,
            'Mananara-Nord' => 87,
            'MANANARA-NORD' => 87,
            'Maroantsetra' => 88,
            'MAROANTSETRA' => 88,
            'Sainte Marie' => 89,
            'SAINTE MARIE' => 89,
            'Soanierana Ivongo' => 90,
            'SOANIERANA IVONGO' => 90,
            'Vavatenina' => 91,
            'VAVATENINA' => 91,
            
            // ====== ATSINANANA (Région 13) ======
            'Antanambao Manampontsy' => 92,
            'ANTANAMBAO MANAMPONTSY' => 92,
            'Antanambao Manampo' => 92,
            'ANTANAMBAO MANAMPO' => 92,
            'Brickaville' => 93,
            'BRICKAVILLE' => 93,
            'Mahanoro' => 94,
            'MAHANORO' => 94,
            'Marolambo' => 95,
            'MAROLAMBO' => 95,
            'Toamasina I' => 96,
            'TOAMASINA I' => 96,
            'Toamasina II' => 97,
            'TOAMASINA II' => 97,
            'Vatomandry' => 98,
            'VATOMANDRY' => 98,
            
            // ====== ANDROY (Région 18) ======
            'Ambovombe Androy' => 99,
            'AMBOVOMBE ANDROY' => 99,
            'Bekily' => 100,
            'BEKILY' => 100,
            'Beloha Androy' => 101,
            'BELOHA ANDROY' => 101,
            'Tsihombe' => 102,
            'TSIHOMBE' => 102,
            
            // ====== ANOSY (Région 19) ======
            'Amboasary Sud' => 103,
            'AMBOASARY SUD' => 103,
            'Betroka' => 104,
            'BETROKA' => 104,
            'Taolanaro' => 105,
            'TAOLANARO' => 105,
            
            // ====== ATSIMO-ANDREFANA (Région 20) ======
            'Ampanihy Ouest' => 106,
            'AMPANIHY OUEST' => 106,
            'Ankazoabo Sud' => 107,
            'ANKAZOABO SUD' => 107,
            'Benenitra' => 108,
            'BENENITRA' => 108,
            'Beroroha' => 109,
            'BEROROHA' => 109,
            'Betioky Sud' => 110,
            'BETIOKY SUD' => 110,
            'Morombe' => 111,
            'MOROMBE' => 111,
            'Sakaraha' => 112,
            'SAKARAHA' => 112,
            'Toliary I' => 113,
            'TOLIARY I' => 113,
            'Toliara I' => 113,
            'TOLIARA I' => 113,
            'Toliary II' => 114,
            'TOLIARY II' => 114,
            'Toliara II' => 114,
            'TOLIARA II' => 114,
            
            // ====== MENABE (Région 21) ======
            'Belo Sur Tsiribihina' => 115,
            'BELO SUR TSIRIBIHINA' => 115,
            'Mahabo' => 116,
            'MAHABO' => 116,
            'Manja' => 117,
            'MANJA' => 117,
            'Miandrivazo' => 118,
            'MIANDRIVAZO' => 118,
            'Morondava' => 119,
            'MORONDAVA' => 119,
        ];

        $communes = [];
        $id = 1;
        $erreurs = [];
        $stats = [
            'total' => 0,
            'par_region' => [],
        ];

        // Parcourir les données JSON
        foreach ($jsonData as $regionName => $districts) {
            if ($regionName === 'Region') continue; // Skip la clé d'en-tête
            
            $idRegion = $regionMapping[$regionName] ?? null;
            if (!$idRegion) {
                $erreurs[] = "Région non trouvée: $regionName";
                continue;
            }

            $stats['par_region'][$regionName] = 0;

            foreach ($districts as $districtName => $communesList) {
                $idDistrict = $districtMapping[$districtName] ?? null;
                
                if (!$idDistrict) {
                    $erreurs[] = "District non trouvé: $districtName (Région: $regionName)";
                    continue;
                }

                foreach ($communesList as $communeName) {
                    $communes[] = [
                        'id' => $id++,
                        'nom_commune' => $communeName,
                        'id_district' => $idDistrict,
                        'id_region' => $idRegion,
                        'created_at' => now(),
                        'updated_at' => now()
                    ];
                    
                    $stats['par_region'][$regionName]++;
                    $stats['total']++;
                }
            }
        }

        // Afficher les avertissements
        if (!empty($erreurs)) {
            $this->command->warn("⚠️ Avertissements détectés:");
            foreach ($erreurs as $erreur) {
                $this->command->line("  • $erreur");
            }
            $this->command->newLine();
        }

        // Afficher les statistiques
        $this->command->info("📊 Statistiques des communes:");
        $this->command->table(
            ['Région', 'Nombre de communes'],
            collect($stats['par_region'])
                ->map(fn($count, $region) => [$region, $count])
                ->values()
                ->toArray()
        );
        
        $this->command->newLine();
        $this->command->info("📈 Total communes à insérer: " . $stats['total']);
        $this->command->newLine();

        // Insertion par batch pour de meilleures performances
        $bar = $this->command->getOutput()->createProgressBar(count($communes));
        $bar->setFormat('verbose');
        $bar->start();

        foreach (array_chunk($communes, 500) as $chunk) {
            DB::table('communes')->insert($chunk);
            $bar->advance(count($chunk));
        }

        $bar->finish();
        $this->command->newLine();
        $this->command->newLine();
        $this->command->info("✅ Insertion des communes terminée avec succès!");
        $this->command->info("   Total inséré: " . $stats['total'] . " communes");
    }
}
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
            echo "❌ Erreur: Le fichier liste_commune_par_district.json est introuvable!\n";
            echo "Placez-le dans: database/seeders/data/\n";
            return;
        }
        
        $jsonData = json_decode(File::get($jsonPath), true);

        // Mapping des régions vers leurs IDs
        $regionMapping = [
            'ANALAMANGA' => 1, 'BONGOLAVA' => 2, 'ITASY' => 3, 'VAKINANKARATRA' => 4,
            'AMORON\'I MANIA' => 5, 'ATSIMO-ATSINANANA' => 6, 'HAUTE MATSIATRA' => 7,
            'FITOVINANY' => 8, 'VATOVAVY' => 9, 'IHOROMBE' => 10, 'ALAOTRA-MANGORO' => 11,
            'ANALANJIROFO' => 12, 'ATSINANANA' => 13, 'BETSIBOKA' => 14, 'BOENY' => 15,
            'MELAKY' => 16, 'SOFIA' => 17, 'ANDROY' => 18, 'ANOSY' => 19,
            'ATSIMO-ANDREFANA' => 20, 'MENABE' => 21, 'DIANA' => 22, 'SAVA' => 23,
        ];

        // Mapping des districts vers leurs IDs (119 districts)
        $districtMapping = $this->getDistrictMapping();

        $communes = [];
        $id = 1;
        $erreurs = [];

        // Parcourir les données JSON
        foreach ($jsonData as $regionName => $districts) {
            if ($regionName === 'Region') continue; // Skip la clé d'en-tête
            
            $idRegion = $regionMapping[$regionName] ?? null;
            if (!$idRegion) {
                $erreurs[] = "Région non trouvée: $regionName";
                continue;
            }

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
                }
            }
        }

        if (!empty($erreurs)) {
            echo "⚠️ Avertissements:\n";
            foreach ($erreurs as $erreur) {
                echo "  - $erreur\n";
            }
        }

        echo "📊 Total communes à insérer: " . count($communes) . "\n";

        // Insertion par batch pour de meilleures performances
        $chunks = array_chunk($communes, 500);
        $progress = 0;
        
        foreach ($chunks as $chunk) {
            DB::table('communes')->insert($chunk);
            $progress += count($chunk);
            echo "✓ Insertion: $progress/" . count($communes) . " communes\n";
        }

        echo "✅ Insertion terminée!\n";
    }

    /**
     * Retourne le mapping complet des 119 districts
     */
    private function getDistrictMapping(): array
    {
        return [
            // ANALAMANGA (1-8)
            'Ambohidratrimo' => 1,
            'Andramasina' => 2,
            'Anjozorobe' => 3,
            'Ankazobe' => 4,
            'Antananarivo Atsimondrano' => 5,
            'Antananarivo Avaradrano' => 6,
            'Antananarivo-I' => 7,
            'Antananarivo-II' => 7,
            'Antananarivo-III' => 7,
            'Antananarivo-IV' => 7,
            'Antananarivo-V' => 7,
            'Antananarivo-VI' => 7,
            'Manjakandriana' => 13,
            
            // BONGOLAVA (14-15)
            'FENOARIVOBE' => 14,
            'TSIROANOMANDIDY' => 15,
            
            // ITASY (16-18)
            'ARIVONIMAMO' => 16,
            'MIARINARIVO' => 17,
            'SOAVINANDRIANA' => 18,
            
            // VAKINANKARATRA (19-25)
            'AMBATOLAMPY' => 19,
            'ANTANIFOTSY' => 20,
            'ANTSIRABE I' => 21,
            'ANTSIRABE II' => 22,
            'BETAFO' => 23,
            'FARATSIHO' => 24,
            'MANDOTO' => 25,
            
            // DIANA (26-30)
            'AMBANJA' => 26,
            'AMBILOBE' => 27,
            'ANTSIRANANA I' => 28,
            'ANTSIRANANA II' => 29,
            'NOSY-BE' => 30,
            
            // SAVA (31-34)
            'ANDAPA' => 31,
            'ANTALAHA' => 32,
            'SAMBAVA' => 33,
            'VOHEMAR' => 34,
            
            // AMORON'I MANIA (35-38)
            'AMBATOFINANDRAHANA' => 35,
            'AMBOSITRA' => 36,
            'FANDRIANA' => 37,
            'MANANDRIANA' => 38,
            
            // ATSIMO-ATSINANANA (39-43)
            'BEFOTAKA ATSIMO' => 39,
            'FARAFANGANA' => 40,
            'MIDONGY SUD' => 41,
            'VANGAINDRANO' => 42,
            'VONDROZO' => 43,
            
            // HAUTE MATSIATRA (44-50)
            'AMBALAVAO' => 44,
            'AMBOHIMAHASOA' => 45,
            'FIANARANTSOA' => 46,
            'ISANDRA' => 47,
            'IKALAMAVONY' => 48,
            'VOHIBATO' => 49,
            'LALANGINA' => 50,
            
            // IHOROMBE (51-53)
            'IAKORA' => 51,
            'IHOSY' => 52,
            'IVOHIBE' => 53,
            
            // VATOVAVY (54, 57-58)
            'IFANADIANA' => 54,
            'MANANJARY' => 57,
            'NOSY VARIKA' => 58,
            
            // FITOVINANY (55-56, 59)
            'IKONGO' => 55,
            'MANAKARA' => 56,
            'VOHIPENO' => 59,
            
            // BETSIBOKA (60-62)
            'KANDREHO' => 60,
            'MAEVATANANA' => 61,
            'TSARATANANA' => 62,
            
            // BOENY (63-68)
            'AMBATO BOENI' => 63,
            'MAHAJANGA I' => 64,
            'MAHAJANGA II' => 65,
            'MAROVOAY' => 66,
            'MITSINJO' => 67,
            'SOALALA' => 68,
            
            // MELAKY (69-73)
            'AMBATOMAINTY' => 69,
            'ANTSALOVA' => 70,
            'BESALAMPY' => 71,
            'MAINTIRANO' => 72,
            'MORAFENOBE' => 73,
            
            // SOFIA (74-80)
            'ANALALAVA' => 74,
            'ANTSOHIHY' => 75,
            'BEALANANA' => 76,
            'BEFANDRIANA NORD' => 77,
            'MAMPIKONY' => 78,
            'MANDRITSARA' => 79,
            'PORT-BERGE' => 80,
            
            // ALAOTRA-MANGORO (81-85)
            'AMBATONDRAZAKA' => 81,
            'AMPARAFARAVOLA' => 82,
            'ANDILAMENA' => 83,
            'ANOSIBE AN ALA' => 84,
            'MORAMANGA' => 85,
            
            // ANALANJIROFO (86-91)
            'FENERIVE EST' => 86,
            'MANANARA-NORD' => 87,
            'MAROANTSETRA' => 88,
            'SAINTE MARIE' => 89,
            'SOANIERANA IVONGO' => 90,
            'VAVATENINA' => 91,
            
            // ATSINANANA (92-98)
            'ANTANAMBAO MANAMPO' => 92,
            'BRICKAVILLE' => 93,
            'MAHANORO' => 94,
            'MAROLAMBO' => 95,
            'TOAMASINA I' => 96,
            'TOAMASINA II' => 97,
            'VATOMANDRY' => 98,
            
            // ANDROY (99-102)
            'AMBOVOMBE ANDROY' => 99,
            'BEKILY' => 100,
            'BELOHA ANDROY' => 101,
            'TSIHOMBE' => 102,
            
            // ANOSY (103-105)
            'AMBOASARY SUD' => 103,
            'BETROKA' => 104,
            'TAOLANARO' => 105,
            
            // ATSIMO-ANDREFANA (106-114)
            'AMPANIHY OUEST' => 106,
            'ANKAZOABO SUD' => 107,
            'BENENITRA' => 108,
            'BEROROHA' => 109,
            'BETIOKY SUD' => 110,
            'MOROMBE' => 111,
            'SAKARAHA' => 112,
            'TOLIARY I' => 113,
            'TOLIARY II' => 114,
            
            // MENABE (115-119)
            'BELO SUR TSIRIBIHINA' => 115,
            'MAHABO' => 116,
            'MANJA' => 117,
            'MIANDRIVAZO' => 118,
            'MORONDAVA' => 119,
        ];
    }
}
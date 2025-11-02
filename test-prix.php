<?php

// test-prix.php - À placer à la racine du projet

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== TEST STRUCTURE DISTRICTS ===\n\n";

// 1. Vérifier la structure de la table
$columns = DB::select("
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'districts'
");

echo "Colonnes de la table 'districts':\n";
foreach ($columns as $col) {
    echo "- {$col->column_name} ({$col->data_type})\n";
}

echo "\n=== DONNÉES DISTRICTS ===\n\n";

// 2. Récupérer tous les districts
$districts = DB::table('districts')->get();

foreach ($districts as $district) {
    echo "District: {$district->nom_district}\n";
    echo "  - Edilitaire: " . (property_exists($district, 'edilitaire') ? $district->edilitaire : 'COLONNE INEXISTANTE') . "\n";
    echo "  - Agricole: " . (property_exists($district, 'agricole') ? $district->agricole : 'COLONNE INEXISTANTE') . "\n";
    echo "  - Forestiere: " . (property_exists($district, 'forestiere') ? $district->forestiere : 'COLONNE INEXISTANTE') . "\n";
    echo "  - Touristique: " . (property_exists($district, 'touristique') ? $district->touristique : 'COLONNE INEXISTANTE') . "\n";
    echo "\n";
}

echo "=== TEST REQUÊTE PRIX ===\n\n";

// 3. Test d'une requête de prix (prenez un vrai ID de dossier)
$dossierId = 1; // CHANGEZ CETTE VALEUR

$result = DB::table('districts')
    ->join('dossiers', 'districts.id', '=', 'dossiers.id_district')
    ->select('districts.*', 'dossiers.nom_dossier')
    ->where('dossiers.id', $dossierId)
    ->first();

if ($result) {
    echo "Résultat pour dossier ID $dossierId:\n";
    echo "  - District: {$result->nom_district}\n";
    echo "  - Nom dossier: {$result->nom_dossier}\n";
    echo "  - Edilitaire: " . ($result->edilitaire ?? 'NULL') . "\n";
    echo "  - Agricole: " . ($result->agricole ?? 'NULL') . "\n";
    echo "  - Forestiere: " . ($result->forestiere ?? 'NULL') . "\n";
    echo "  - Touristique: " . ($result->touristique ?? 'NULL') . "\n";
} else {
    echo "ERREUR: Aucun résultat trouvé pour le dossier ID $dossierId\n";
}
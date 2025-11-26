<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\District;
use App\Models\Dossier;
use App\Models\Propriete;
use App\Models\Demander;

class DiagnosticPrixCommand extends Command
{
    protected $signature = 'prix:diagnostic {--dossier=}';
    protected $description = 'Diagnostique les problèmes de configuration des prix';

    public function handle()
    {
        $this->info('🔍 DIAGNOSTIC DES PRIX');
        $this->newLine();

        // 1. Vérifier les prix dans districts
        $this->checkPrixDistricts();

        // 2. Vérifier les dossiers sans prix
        $this->checkDossiersSansPrix();

        // 3. Vérifier les propriétés avec données manquantes
        $this->checkProprietesInvalides();

        // 4. Vérifier les demandes à 0
        $this->checkDemandesZero();

        // 5. Test calcul sur un échantillon
        if ($this->option('dossier')) {
            $this->testCalculSurDossier($this->option('dossier'));
        }

        $this->newLine();
        $this->info('✅ Diagnostic terminé');
    }

    private function checkPrixDistricts(): void
    {
        $this->info('1️⃣  VÉRIFICATION DES PRIX DANS LES DISTRICTS');
        
        $districts = DB::table('districts')
            ->select('id', 'nom_district', 'edilitaire', 'agricole', 'forestiere', 'touristique')
            ->get();

        $problemesDetectes = [];

        foreach ($districts as $district) {
            $prixNuls = [];
            
            if ($district->edilitaire == 0) $prixNuls[] = 'edilitaire';
            if ($district->agricole == 0) $prixNuls[] = 'agricole';
            if ($district->forestiere == 0) $prixNuls[] = 'forestiere';
            if ($district->touristique == 0) $prixNuls[] = 'touristique';

            if (!empty($prixNuls)) {
                $problemesDetectes[] = [
                    'district' => $district->nom_district,
                    'id' => $district->id,
                    'prix_manquants' => implode(', ', $prixNuls)
                ];
            }
        }

        if (empty($problemesDetectes)) {
            $this->info('   ✅ Tous les districts ont des prix configurés');
        } else {
            $this->warn('   ⚠️  ' . count($problemesDetectes) . ' district(s) avec des prix manquants:');
            $this->table(
                ['District', 'ID', 'Vocations sans prix'],
                collect($problemesDetectes)->map(fn($p) => [
                    $p['district'],
                    $p['id'],
                    $p['prix_manquants']
                ])->toArray()
            );
        }

        $this->newLine();
    }

    private function checkDossiersSansPrix(): void
    {
        $this->info('2️⃣  VÉRIFICATION DOSSIERS → DISTRICTS → PRIX');
        
        $dossiers = DB::table('dossiers')
            ->join('districts', 'dossiers.id_district', '=', 'districts.id')
            ->select(
                'dossiers.id as dossier_id',
                'dossiers.nom_dossier',
                'districts.nom_district',
                'districts.edilitaire',
                'districts.agricole',
                'districts.forestiere',
                'districts.touristique'
            )
            ->get();

        $problemes = $dossiers->filter(function($d) {
            return $d->edilitaire == 0 && $d->agricole == 0 && $d->forestiere == 0 && $d->touristique == 0;
        });

        if ($problemes->isEmpty()) {
            $this->info('   ✅ Tous les dossiers ont au moins un prix configuré');
        } else {
            $this->error('   ❌ ' . $problemes->count() . ' dossier(s) SANS AUCUN PRIX:');
            $this->table(
                ['Dossier ID', 'Nom dossier', 'District'],
                $problemes->map(fn($p) => [$p->dossier_id, $p->nom_dossier, $p->nom_district])->toArray()
            );
        }

        $this->newLine();
    }

    private function checkProprietesInvalides(): void
    {
        $this->info('3️⃣  VÉRIFICATION PROPRIÉTÉS AVEC DONNÉES MANQUANTES');
        
        $proprietes = Propriete::with('dossier')
            ->where(function($q) {
                $q->whereNull('vocation')
                  ->orWhereNull('contenance')
                  ->orWhere('contenance', '<=', 0);
            })
            ->get();

        if ($proprietes->isEmpty()) {
            $this->info('   ✅ Toutes les propriétés ont une vocation et contenance valides');
        } else {
            $this->warn('   ⚠️  ' . $proprietes->count() . ' propriété(s) avec données manquantes:');
            $this->table(
                ['ID', 'Lot', 'Dossier', 'Vocation', 'Contenance'],
                $proprietes->map(fn($p) => [
                    $p->id,
                    $p->lot,
                    $p->dossier->nom_dossier ?? 'N/A',
                    $p->vocation ?? '❌ NULL',
                    $p->contenance ?? '❌ NULL'
                ])->toArray()
            );
        }

        $this->newLine();
    }

    private function checkDemandesZero(): void
    {
        $this->info('4️⃣  DEMANDES AVEC PRIX À 0');
        
        $demandes = Demander::with(['propriete.dossier', 'demandeur'])
            ->where('total_prix', 0)
            ->get();

        if ($demandes->isEmpty()) {
            $this->info('   ✅ Aucune demande avec prix à 0');
        } else {
            $this->warn('   ⚠️  ' . $demandes->count() . ' demande(s) avec prix à 0');
            
            // Grouper par raison
            $raisons = [
                'prix_district_manquant' => 0,
                'vocation_manquante' => 0,
                'contenance_manquante' => 0,
                'autre' => 0
            ];

            foreach ($demandes as $demande) {
                $propriete = $demande->propriete;
                
                if (!$propriete) {
                    $raisons['autre']++;
                    continue;
                }

                if (!$propriete->vocation) {
                    $raisons['vocation_manquante']++;
                } elseif (!$propriete->contenance || $propriete->contenance <= 0) {
                    $raisons['contenance_manquante']++;
                } else {
                    // Vérifier le prix du district
                    $vocation = strtolower(str_replace('ière', 'iere', $propriete->vocation));
                    $prix = DB::table('districts')
                        ->join('dossiers', 'districts.id', '=', 'dossiers.id_district')
                        ->where('dossiers.id', $propriete->id_dossier)
                        ->value("districts.{$vocation}");
                    
                    if (!$prix || $prix == 0) {
                        $raisons['prix_district_manquant']++;
                    } else {
                        $raisons['autre']++;
                    }
                }
            }

            $this->table(
                ['Raison', 'Nombre'],
                [
                    ['Prix district non configuré', $raisons['prix_district_manquant']],
                    ['Vocation manquante', $raisons['vocation_manquante']],
                    ['Contenance manquante/invalide', $raisons['contenance_manquante']],
                    ['Autre', $raisons['autre']],
                ]
            );

            // Afficher un échantillon
            $this->newLine();
            $this->info('   📋 Échantillon (10 premières):');
            $this->table(
                ['ID', 'Lot', 'Dossier', 'Demandeur', 'Vocation', 'Contenance'],
                $demandes->take(10)->map(fn($d) => [
                    $d->id,
                    $d->propriete->lot ?? 'N/A',
                    $d->propriete->dossier->nom_dossier ?? 'N/A',
                    $d->demandeur->nom_demandeur ?? 'N/A',
                    $d->propriete->vocation ?? '❌',
                    $d->propriete->contenance ?? '❌'
                ])->toArray()
            );
        }

        $this->newLine();
    }

    private function testCalculSurDossier(int $dossierId): void
    {
        $this->info("5️⃣  TEST CALCUL SUR DOSSIER ID: {$dossierId}");
        
        $dossier = Dossier::with('district')->find($dossierId);
        
        if (!$dossier) {
            $this->error('   ❌ Dossier introuvable');
            return;
        }

        $this->info("   📁 Dossier: {$dossier->nom_dossier}");
        $this->info("   📍 District: {$dossier->district->nom_district}");
        $this->newLine();

        $this->info('   💰 Prix configurés:');
        $this->table(
            ['Vocation', 'Prix/m²'],
            [
                ['Edilitaire', number_format($dossier->district->edilitaire) . ' Ar'],
                ['Agricole', number_format($dossier->district->agricole) . ' Ar'],
                ['Forestière', number_format($dossier->district->forestiere) . ' Ar'],
                ['Touristique', number_format($dossier->district->touristique) . ' Ar'],
            ]
        );

        // Tester sur quelques propriétés
        $proprietes = Propriete::where('id_dossier', $dossierId)
            ->with('demanders')
            ->limit(5)
            ->get();

        if ($proprietes->isEmpty()) {
            $this->warn('   ⚠️  Aucune propriété dans ce dossier');
            return;
        }

        $this->newLine();
        $this->info('   🧪 Test calcul sur 5 propriétés:');
        
        foreach ($proprietes as $propriete) {
            try {
                $vocation = strtolower(str_replace('ière', 'iere', $propriete->vocation));
                $prixUnitaire = $dossier->district->{$vocation} ?? 0;
                $prixCalcule = $prixUnitaire * $propriete->contenance;

                $demandes = $propriete->demanders;
                $prixEnBase = $demandes->first()->total_prix ?? 0;

                $status = $prixCalcule == $prixEnBase ? '✅' : '❌';

                $this->line("   {$status} Lot {$propriete->lot}: {$prixUnitaire} × {$propriete->contenance} = " . number_format($prixCalcule) . " Ar (Base: " . number_format($prixEnBase) . " Ar)");

            } catch (\Exception $e) {
                $this->error("   ❌ Lot {$propriete->lot}: ERREUR - {$e->getMessage()}");
            }
        }
    }
}
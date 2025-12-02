<?php

namespace App\Http\Controllers\Dashboard\Services;

use App\Models\User;
use App\Models\Dossier;
use App\Models\Propriete;
use App\Models\Demandeur;
use App\Models\Demander;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class KpiService
{
    use Traits\QueryFilterTrait;

    /**
     * Récupérer tous les KPIs pour le dashboard
     */
    public function getAllKpis(): array
    {
        $completionDetails = $this->getTauxCompletion();

        return [
            'dossiers_ouverts' => $this->baseQuery()->whereNull('date_fermeture')->count(),
            'dossiers_fermes' => $this->baseQuery()->whereNotNull('date_fermeture')->count(),
            'proprietes_disponibles' => $this->getProprietesDisponibles(),
            'proprietes_acquises' => $this->getProprietesAcquises(),
            'completion' => $completionDetails,
            'demandeurs_actifs' => $this->getDemandeursActifs(),
            'demandeurs_details' => $this->getDemandeurDetails(),
            'revenus_potentiels' => $this->getRevenusPotentiels(),
            'nouveaux_dossiers' => $this->getNouveauxDossiersMois(),
            'dossiers_en_retard' => $this->getDossiersEnRetard(),
            'temps_moyen_traitement' => $this->getTempsMoyenTraitement(),
            'superficie_details' => $this->getSuperficieDetails(),
            'demandeurs_sans_propriete' => $this->getDemandeursSansPropriete(),
            'documents_generes_aujourdhui' => $this->getDocumentsGeneresAujourdhui(),
            'utilisateurs_actifs_24h' => $this->getUtilisateursActifs24h(),
            'taux_croissance' => $this->calculateGrowthRate(),
        ];
    }

    /**
     * ✅ CORRIGÉ : Calcul dynamique du taux de croissance
     */
    private function calculateGrowthRate(): float
    {
        $currentMonth = $this->baseQuery()
            ->whereBetween('date_ouverture', [now()->startOfMonth(), now()->endOfMonth()])
            ->count();
        
        $previousMonth = $this->baseQuery()
            ->whereBetween('date_ouverture', [
                now()->subMonth()->startOfMonth(), 
                now()->subMonth()->endOfMonth()
            ])
            ->count();
        
        if ($previousMonth == 0) return $currentMonth > 0 ? 100 : 0;
        
        return round((($currentMonth - $previousMonth) / $previousMonth) * 100, 1);
    }

    /**
     * ✅ CORRIGÉ : Propriétés avec au moins une demande active
     * Une propriété est "disponible" si elle a au moins une demande active
     */
    private function getProprietesDisponibles(): int
    {
        /** @var User $user */
        $user = Auth::user();
        
        return Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('demandes', fn($q) => $q->where('status', 'active'))
            ->count();
    }

    /**
     * ✅ CORRIGÉ : Propriétés dont TOUTES les demandes sont archivées
     * Une propriété est "acquise" si toutes ses demandes sont archivées
     */
    private function getProprietesAcquises(): int
    {
        /** @var User $user */
        $user = Auth::user();
        
        return Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('demandes', fn($q) => $q->where('status', 'archive'))
            ->whereDoesntHave('demandes', fn($q) => $q->where('status', 'active'))
            ->count();
    }

    /**
     * ✅ CORRIGÉ : Détails complets des demandeurs
     */
    private function getDemandeurDetails(): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $demandeursQuery = Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            });
        
        $total = (clone $demandeursQuery)->count();
        
        // Demandeurs avec au moins une demande active
        $actifs = Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('proprietes', function($q) {
                $q->whereHas('demandes', fn($q2) => $q2->where('status', 'active'));
            })
            ->count();
        
        // Demandeurs dont TOUTES les demandes sont archivées
        $acquis = Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('proprietes', function($q) {
                $q->whereHas('demandes', fn($q2) => $q2->where('status', 'archive'));
            })
            ->whereDoesntHave('proprietes', function($q) {
                $q->whereHas('demandes', fn($q2) => $q2->where('status', 'active'));
            })
            ->count();
        
        $sansPropriete = (clone $demandeursQuery)->doesntHave('proprietes')->count();
        
        // Répartition par genre
        $hommes = (clone $demandeursQuery)->where('sexe', 'Homme')->count();
        $femmes = (clone $demandeursQuery)->where('sexe', 'Femme')->count();
        
        // Hommes et femmes avec demandes actives
        $hommesActifs = Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->where('sexe', 'Homme')
            ->whereHas('proprietes', function($q) {
                $q->whereHas('demandes', fn($q2) => $q2->where('status', 'active'));
            })
            ->count();
        
        $femmesActifs = Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->where('sexe', 'Femme')
            ->whereHas('proprietes', function($q) {
                $q->whereHas('demandes', fn($q2) => $q2->where('status', 'active'));
            })
            ->count();
        
        return [
            'total' => $total,
            'actifs' => $actifs,
            'acquis' => $acquis,
            'sans_propriete' => $sansPropriete,
            'hommes' => $hommes,
            'femmes' => $femmes,
            'hommes_actifs' => $hommesActifs,
            'femmes_actifs' => $femmesActifs,
        ];
    }

    private function getDossiersEnRetard(): int
    {
        return $this->baseQuery()
            ->whereNull('date_fermeture')
            ->where('date_ouverture', '<', now()->subDays(90))
            ->count();
    }

    private function getTempsMoyenTraitement(): int
    {
        $dossiers = $this->baseQuery()
            ->whereNotNull('date_fermeture')
            ->select('date_ouverture', 'date_fermeture')
            ->get();
        
        if ($dossiers->isEmpty()) {
            return 0;
        }
        
        $totalDays = $dossiers->sum(function($dossier) {
            return Carbon::parse($dossier->date_ouverture)
                ->diffInDays(Carbon::parse($dossier->date_fermeture));
        });
        
        return (int) round($totalDays / $dossiers->count());
    }

    /**
     * ✅ CORRIGÉ : Superficie avec logique cohérente
     */
    private function getSuperficieDetails(): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $query = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            });
        
        $superficieTotale = (clone $query)->sum('contenance') ?? 0;
        
        // Superficie des propriétés acquises (toutes demandes archivées)
        $superficieAcquise = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('demandes', fn($q) => $q->where('status', 'archive'))
            ->whereDoesntHave('demandes', fn($q) => $q->where('status', 'active'))
            ->sum('contenance') ?? 0;
        
        // Superficie des propriétés disponibles (au moins une demande active)
        $superficieDisponible = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('demandes', fn($q) => $q->where('status', 'active'))
            ->sum('contenance') ?? 0;
        
        return [
            'totale' => $superficieTotale,
            'acquise' => $superficieAcquise,
            'disponible' => $superficieDisponible,
        ];
    }

    private function getDemandeursSansPropriete(): int
    {
        /** @var User $user */
        $user = Auth::user();
        
        return Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->doesntHave('proprietes')
            ->count();
    }

    private function getDocumentsGeneresAujourdhui(): int
    {
        /** @var User $user */
        $user = Auth::user();
        
        return ActivityLog::query()
            ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
            ->where('action', ActivityLog::ACTION_GENERATE)
            ->whereDate('created_at', today())
            ->count();
    }

    private function getUtilisateursActifs24h(): int
    {
        /** @var User $user */
        $user = Auth::user();
        
        return ActivityLog::query()
            ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
            ->where('created_at', '>=', now()->subDay())
            ->distinct('id_user')
            ->count('id_user');
    }

    private function getTauxCompletion(): array
    {
        /** @var User $user */
        $user = Auth::user();
        $query = $this->baseQuery();
        
        $totalDossiers = $query->count();
        
        $dossiersComplets = (clone $query)
            ->whereHas('demandeurs')
            ->whereHas('proprietes')
            ->count();
        
        $dossiersIncomplets = (clone $query)
            ->where(function($q) {
                $q->doesntHave('demandeurs')
                  ->orDoesntHave('proprietes');
            })
            ->count();
        
        $proprietesIncompletes = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->where(function($q) {
                $q->whereNull('lot')
                  ->orWhereNull('contenance')
                  ->orWhereNull('nature')
                  ->orWhereNull('vocation');
            })
            ->count();
        
        $demandeursIncomplets = Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->where(function($q) {
                $q->whereNull('nom_demandeur')
                  ->orWhereNull('date_naissance')
                  ->orWhereNull('cin')
                  ->orWhereNull('domiciliation');
            })
            ->count();
        
        $tauxCompletion = $totalDossiers > 0 
            ? round(($dossiersComplets / $totalDossiers) * 100, 1) 
            : 0;
        
        return [
            'taux' => $tauxCompletion,
            'dossiers_complets' => $dossiersComplets,
            'dossiers_incomplets' => $dossiersIncomplets,
            'total_dossiers' => $totalDossiers,
            'proprietes_incompletes' => $proprietesIncompletes,
            'demandeurs_incomplets' => $demandeursIncomplets,
        ];
    }

    /**
     * ✅ CORRIGÉ : Demandeurs avec au moins une demande active
     */
    private function getDemandeursActifs(): int
    {
        /** @var User $user */
        $user = Auth::user();
        
        return Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('proprietes', function($q) {
                $q->whereHas('demandes', fn($q2) => $q2->where('status', 'active'));
            })
            ->count();
    }

    /**
     * Revenus potentiels (seulement demandes actives)
     */
    private function getRevenusPotentiels(): int
    {
        /** @var User $user */
        $user = Auth::user();
        
        return Demander::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('propriete.dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->where('status', 'active')
            ->sum('total_prix') ?? 0;
    }

    private function getNouveauxDossiersMois(): int
    {
        return $this->baseQuery()
            ->whereBetween('date_ouverture', [now()->startOfMonth(), now()->endOfMonth()])
            ->count();
    }
}
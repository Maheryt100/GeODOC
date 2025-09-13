<?php

namespace App\Collection;

use App\Models\Dossier;
use Illuminate\Database\Eloquent\Collection;

class DossierCollection extends Collection
{
    public function totalDemandeurPropriete(int $limit = 6): static
    {
        if ($this->isEmpty()) {
            return $this;
        }

        $dossierIds = $this->pluck('id');

        $dossiersWithCounts = Dossier::withCount([
            'demandeurs as demandeurs' => function ($query) {
                $query->distinct();
            },
            'proprietes as proprietes'
        ])
            ->whereIn('id', $dossierIds)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->keyBy('id');

        return $this->map(function (Dossier $dossier) use ($dossiersWithCounts) {
            $dossierWithCount = $dossiersWithCounts->get($dossier->id);
            if ($dossierWithCount) {
                $dossier->demandeurs = $dossierWithCount->demandeurs ?? 0;
                $dossier->proprietes = $dossierWithCount->proprietes ?? 0;
            }
            return $dossier;
        });
    }


}

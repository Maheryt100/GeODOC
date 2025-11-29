<?php
namespace App\Events;

use App\Models\Demandeur;
use App\Models\Propriete;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AssociationDissociated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Demandeur $demandeur,
        public Propriete $propriete,
        public User $user,
        public ?string $reason = null
    ) {}
}
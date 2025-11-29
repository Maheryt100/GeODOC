<?php

namespace App\Events;

use App\Models\Demander;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AssociationCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Demander $demande,
        public User $user
    ) {}
}
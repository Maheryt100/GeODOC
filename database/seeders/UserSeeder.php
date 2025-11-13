<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\District;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Récupérer quelques districts pour les tests
        $districts = District::limit(3)->get();

        if ($districts->isEmpty()) {
            $this->command->warn('Aucun district trouvé. Créez d\'abord les districts.');
            return;
        }

        // 1. Créer un super admin
        $superAdmin = User::updateOrCreate(
            ['email' => 'admin@foncier.mg'],
            [
                'name' => 'Super Administrateur',
                'password' => Hash::make('password'),
                'role' => User::ROLE_SUPER_ADMIN,
                'id_district' => null,
                'status' => true,
            ]
        );
        $this->command->info("✓ Super Admin créé : admin@foncier.mg / password");

        // 2. Créer des admins district
        foreach ($districts->take(2) as $index => $district) {
            $adminDistrict = User::updateOrCreate(
                ['email' => "admin.{$district->nom_district}@foncier.mg"],
                [
                    'name' => "Admin {$district->nom_district}",
                    'password' => Hash::make('password'),
                    'role' => User::ROLE_ADMIN_DISTRICT,
                    'id_district' => $district->id,
                    'status' => true,
                ]
            );
            $this->command->info("✓ Admin District créé : admin.{$district->nom_district}@foncier.mg / password");
        }

        // 3. Créer des users district
        foreach ($districts as $district) {
            for ($i = 1; $i <= 2; $i++) {
                $userDistrict = User::updateOrCreate(
                    ['email' => "user{$i}.{$district->nom_district}@foncier.mg"],
                    [
                        'name' => "Utilisateur {$i} - {$district->nom_district}",
                        'password' => Hash::make('password'),
                        'role' => User::ROLE_USER_DISTRICT,
                        'id_district' => $district->id,
                        'status' => true,
                    ]
                );
                $this->command->info("✓ User District créé : user{$i}.{$district->nom_district}@foncier.mg / password");
            }
        }

        // 4. Créer un utilisateur désactivé pour tester
        User::updateOrCreate(
            ['email' => 'inactive@foncier.mg'],
            [
                'name' => 'Utilisateur Désactivé',
                'password' => Hash::make('password'),
                'role' => User::ROLE_USER_DISTRICT,
                'id_district' => $districts->first()->id,
                'status' => false,
            ]
        );
        $this->command->info("✓ Utilisateur désactivé créé : inactive@foncier.mg");

        $this->command->newLine();
        $this->command->info("Total utilisateurs créés : " . User::count());
        $this->command->info("Mot de passe par défaut : password");
    }
}

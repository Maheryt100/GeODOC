<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\UserPermission;

class UserPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Récupérer des utilisateurs de test
        $adminDistrict = User::where('role', User::ROLE_ADMIN_DISTRICT)->first();
        $userDistrict = User::where('role', User::ROLE_USER_DISTRICT)->first();

        if (!$adminDistrict || !$userDistrict) {
            $this->command->warn(' Exécutez d\'abord UserSeeder');
            return;
        }

        // Donner des permissions supplémentaires à l'admin district
        UserPermission::grant($adminDistrict->id, UserPermission::PERMISSION_VIEW_STATISTICS);
        UserPermission::grant($adminDistrict->id, UserPermission::PERMISSION_EXPORT_DATA);
        UserPermission::grant($adminDistrict->id, UserPermission::PERMISSION_MANAGE_PRICES);
        UserPermission::grant($adminDistrict->id, UserPermission::PERMISSION_ARCHIVE_DOCUMENTS);
        
        $this->command->info("✓ Permissions accordées à l'admin district");

        // Donner quelques permissions à un user district
        UserPermission::grant($userDistrict->id, UserPermission::PERMISSION_VIEW_STATISTICS);
        UserPermission::grant($userDistrict->id, UserPermission::PERMISSION_ARCHIVE_DOCUMENTS);
        
        $this->command->info("✓ Permissions accordées au user district");

        // Exemple de révocation
        UserPermission::revoke($userDistrict->id, UserPermission::PERMISSION_DELETE_DOCUMENTS);
        
        $this->command->info("✓ Permission révoquée");
        $this->command->newLine();
        $this->command->info(" Total permissions : " . UserPermission::count());
    }
}
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info(" Début du seeding...");
        $this->command->newLine();

        // Ordre d'exécution important !
        $this->call([
            // 1. D'abord les localisations
            ProvinceSeeder::class,
            RegionSeeder::class,
            DistrictSeeder::class,
            
            // 2. Ensuite les utilisateurs
            UserSeeder::class,
            UserPermissionSeeder::class,
            
            // 3. Puis les données métier
            // DossierSeeder::class,
            // etc.
        ]);

        $this->command->newLine();
        $this->command->info(" Seeding terminé avec succès !");
    }
}
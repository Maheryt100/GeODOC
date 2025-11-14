<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class VerifyDatabaseStructure extends Command
{
    protected $signature = 'db:verify-structure';
    protected $description = 'Vérifier que la structure de la base de données est correcte';

    public function handle(): int
    {
        $this->info('🔍 Vérification de la structure de la base de données...');
        $this->newLine();

        $errors = 0;
        $warnings = 0;

        // 1. Vérifier la table users
        $this->info('📋 Table: users');
        if (!Schema::hasTable('users')) {
            $this->error('  ✗ Table users n\'existe pas');
            return 1;
        }

        $usersColumns = [
            'id' => 'ID',
            'name' => 'Nom',
            'email' => 'Email',
            'password' => 'Mot de passe',
            'role' => 'Rôle',
            'id_district' => 'District (CRITIQUE)',
            'status' => 'Statut',
        ];

        foreach ($usersColumns as $column => $label) {
            if (Schema::hasColumn('users', $column)) {
                $this->line("  ✓ {$label}");
            } else {
                $this->error("  ✗ {$label} manquant");
                if ($column === 'id_district') {
                    $this->error('    → CRITIQUE: Le système de permissions ne fonctionnera pas!');
                }
                $errors++;
            }
        }

        // 2. Vérifier la table proprietes
        $this->newLine();
        $this->info('📋 Table: proprietes');
        
        if (Schema::hasColumn('proprietes', 'is_archived')) {
            $this->line('  ✓ is_archived');
        } else {
            $this->error('  ✗ is_archived manquant');
            $this->error('    → CRITIQUE: L\'archivage ne fonctionnera pas!');
            $errors++;
        }

        // 3. Vérifier user_access_logs
        $this->newLine();
        $this->info('📋 Table: user_access_logs');
        
        $logColumns = ['id_user', 'id_district', 'action', 'resource_type', 'resource_id'];
        foreach ($logColumns as $column) {
            if (Schema::hasColumn('user_access_logs', $column)) {
                $this->line("  ✓ {$column}");
            } else {
                $this->error("  ✗ {$column} manquant");
                $errors++;
            }
        }

        // 4. Vérifier user_permissions
        $this->newLine();
        $this->info('📋 Table: user_permissions');
        
        if (Schema::hasColumn('user_permissions', 'granted')) {
            $this->line('  ✓ granted');
        } else {
            $this->warn('  ⚠ granted manquant');
            $this->warn('    → Les permissions ne peuvent pas être révoquées');
            $warnings++;
        }

        // 5. Vérifier les index
        $this->newLine();
        $this->info('📋 Index de performance');
        
        try {
            $indexes = DB::select("
                SELECT tablename, indexname 
                FROM pg_indexes 
                WHERE schemaname = 'public'
                AND tablename IN ('users', 'dossiers', 'proprietes', 'demandeurs')
                ORDER BY tablename, indexname
            ");
            
            $indexCount = count($indexes);
            if ($indexCount > 10) {
                $this->line("  ✓ {$indexCount} index trouvés");
            } else {
                $this->warn("  ⚠ Seulement {$indexCount} index (recommandé: >10)");
                $warnings++;
            }
        } catch (\Exception $e) {
            $this->warn('  ⚠ Impossible de vérifier les index: ' . $e->getMessage());
        }

        // 6. Vérifier les contraintes UNIQUE
        $this->newLine();
        $this->info('📋 Contraintes UNIQUE');
        
        $uniqueConstraints = [
            'demander' => ['id_demandeur', 'id_propriete'],
            'contenir' => ['id_dossier', 'id_demandeur'],
            'user_permissions' => ['id_user', 'permission'],
        ];

        foreach ($uniqueConstraints as $table => $columns) {
            if (Schema::hasTable($table)) {
                // Note: La vérification des contraintes UNIQUE est complexe en PostgreSQL
                $this->line("  ℹ Table {$table} existe (vérification manuelle recommandée)");
            }
        }

        // 7. Vérifier les données essentielles
        $this->newLine();
        $this->info('📋 Données essentielles');
        
        try {
            $userCount = DB::table('users')->count();
            $superAdminCount = DB::table('users')->where('role', 'super_admin')->count();
            $districtCount = DB::table('districts')->count();

            if ($userCount > 0) {
                $this->line("  ✓ {$userCount} utilisateur(s)");
            } else {
                $this->warn('  ⚠ Aucun utilisateur');
                $warnings++;
            }

            if ($superAdminCount > 0) {
                $this->line("  ✓ {$superAdminCount} super admin(s)");
            } else {
                $this->error('  ✗ Aucun super admin');
                $this->error('    → Créez un super admin avec: php artisan db:seed --class=UserSeeder');
                $errors++;
            }

            if ($districtCount > 0) {
                $this->line("  ✓ {$districtCount} district(s)");
            } else {
                $this->warn('  ⚠ Aucun district');
                $this->warn('    → Importez les districts avec: php artisan db:seed --class=DistrictSeeder');
                $warnings++;
            }
        } catch (\Exception $e) {
            $this->error('  ✗ Erreur lors de la vérification des données: ' . $e->getMessage());
            $errors++;
        }

        // 8. Résumé
        $this->newLine();
        $this->info('============================================');
        $this->info('           RÉSUMÉ DE LA VÉRIFICATION');
        $this->info('============================================');
        
        if ($errors === 0 && $warnings === 0) {
            $this->info('✅ Tout est OK ! La structure est correcte.');
            return 0;
        }

        if ($errors > 0) {
            $this->error("❌ {$errors} erreur(s) critique(s) détectée(s)");
            $this->error('   → Exécutez les migrations corrigées');
        }

        if ($warnings > 0) {
            $this->warn("⚠️  {$warnings} avertissement(s)");
            $this->warn('   → Recommandé de corriger mais non bloquant');
        }

        $this->newLine();
        return $errors > 0 ? 1 : 0;
    }
}
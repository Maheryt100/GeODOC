<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Statistiques - {{ $dates['from']->format('d/m/Y') }} au {{ $dates['to']->format('d/m/Y') }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 11px;
            line-height: 1.6;
            color: #333;
        }
        
        .container {
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 15px;
        }
        
        .header h1 {
            font-size: 24px;
            color: #1e40af;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #6b7280;
            font-size: 12px;
        }
        
        .meta-info {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 25px;
        }
        
        .meta-info table {
            width: 100%;
        }
        
        .meta-info td {
            padding: 5px 0;
        }
        
        .meta-info strong {
            color: #1f2937;
            min-width: 150px;
            display: inline-block;
        }
        
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 16px;
            color: #1e40af;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .stats-grid {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }
        
        .stat-card {
            display: table-cell;
            width: 25%;
            padding: 15px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            vertical-align: top;
        }
        
        .stat-label {
            font-size: 10px;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
        }
        
        .stat-subtitle {
            font-size: 9px;
            color: #9ca3af;
            margin-top: 5px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        thead {
            background: #f3f4f6;
        }
        
        th {
            padding: 10px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #d1d5db;
        }
        
        td {
            padding: 8px 10px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        tbody tr:hover {
            background: #f9fafb;
        }
        
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 600;
        }
        
        .badge-success {
            background: #d1fae5;
            color: #065f46;
        }
        
        .badge-warning {
            background: #fef3c7;
            color: #92400e;
        }
        
        .badge-info {
            background: #dbeafe;
            color: #1e40af;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 9px;
        }
        
        .page-break {
            page-break-after: always;
        }
        
        .two-columns {
            display: table;
            width: 100%;
        }
        
        .column {
            display: table-cell;
            width: 48%;
            vertical-align: top;
            padding: 10px;
        }
        
        .highlight {
            background: #eff6ff;
            padding: 15px;
            border-left: 4px solid #2563eb;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- En-tête -->
        <div class="header">
            <h1>📊 Rapport Statistiques</h1>
            <p>Période : {{ $dates['from']->format('d/m/Y') }} au {{ $dates['to']->format('d/m/Y') }}</p>
        </div>

        <!-- Méta-informations -->
        <div class="meta-info">
            <table>
                <tr>
                    <td><strong>Généré par :</strong> {{ $user->name }}</td>
                    <td><strong>Date de génération :</strong> {{ $generated_at }}</td>
                </tr>
                <tr>
                    <td><strong>District :</strong> {{ $user->district->nom_district ?? 'Tous les districts' }}</td>
                    <td><strong>Période :</strong> {{ ucfirst($period) }}</td>
                </tr>
            </table>
        </div>

        <!-- Vue d'ensemble -->
        <div class="section">
            <h2 class="section-title">Vue d'ensemble</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Total Dossiers</div>
                    <div class="stat-value">{{ $overview['total_dossiers'] ?? 0 }}</div>
                    <div class="stat-subtitle">{{ $overview['dossiers_ouverts'] ?? 0 }} ouverts</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-label">Propriétés</div>
                    <div class="stat-value">{{ $proprietes['total'] ?? 0 }}</div>
                    <div class="stat-subtitle">{{ $proprietes['disponibles'] ?? 0 }} disponibles</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-label">Demandeurs</div>
                    <div class="stat-value">{{ $demandeurs['total'] ?? 0 }}</div>
                    <div class="stat-subtitle">{{ $demandeurs['avec_propriete'] ?? 0 }} actifs</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-label">Taux de complétion</div>
                    <div class="stat-value">{{ $overview['taux_completion'] ?? 0 }}%</div>
                    <div class="stat-subtitle">Dossiers complets</div>
                </div>
            </div>
        </div>

        <!-- Statistiques des dossiers -->
        <div class="section">
            <h2 class="section-title">Dossiers</h2>
            
            <table>
                <thead>
                    <tr>
                        <th>Indicateur</th>
                        <th>Valeur</th>
                        <th>Détails</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Total dossiers</td>
                        <td><strong>{{ $dossiers['total'] ?? 0 }}</strong></td>
                        <td>Période sélectionnée</td>
                    </tr>
                    <tr>
                        <td>Dossiers ouverts</td>
                        <td><strong>{{ $dossiers['ouverts'] ?? 0 }}</strong></td>
                        <td><span class="badge badge-success">Actifs</span></td>
                    </tr>
                    <tr>
                        <td>Dossiers fermés</td>
                        <td><strong>{{ $dossiers['fermes'] ?? 0 }}</strong></td>
                        <td><span class="badge badge-info">Terminés</span></td>
                    </tr>
                    <tr>
                        <td>Durée moyenne</td>
                        <td><strong>{{ round($dossiers['duree_moyenne'] ?? 0) }} jours</strong></td>
                        <td>Temps de traitement</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Page break -->
        <div class="page-break"></div>

        <!-- Démographie -->
        <div class="section">
            <h2 class="section-title">Démographie</h2>
            
            <div class="two-columns">
                <div class="column">
                    <h3 style="font-size: 14px; margin-bottom: 10px; color: #374151;">Par genre</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Genre</th>
                                <th>Total</th>
                                <th>Avec propriété</th>
                                <th>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>👨 Hommes</td>
                                <td>{{ $demographics['total_hommes'] ?? 0 }}</td>
                                <td>{{ $demographics['hommes_avec_propriete'] ?? 0 }}</td>
                                <td>{{ $demographics['pourcentage_hommes'] ?? 0 }}%</td>
                            </tr>
                            <tr>
                                <td>👩 Femmes</td>
                                <td>{{ $demographics['total_femmes'] ?? 0 }}</td>
                                <td>{{ $demographics['femmes_avec_propriete'] ?? 0 }}</td>
                                <td>{{ $demographics['pourcentage_femmes'] ?? 0 }}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="column">
                    <h3 style="font-size: 14px; margin-bottom: 10px; color: #374151;">Par âge</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Tranche d'âge</th>
                                <th>Nombre</th>
                            </tr>
                        </thead>
                        <tbody>
                            @if(isset($demographics['tranches_age']))
                                @foreach($demographics['tranches_age'] as $tranche => $count)
                                    <tr>
                                        <td>{{ $tranche }} ans</td>
                                        <td>{{ $count }}</td>
                                    </tr>
                                @endforeach
                            @endif
                        </tbody>
                    </table>
                    
                    <div class="highlight">
                        <strong>Âge moyen :</strong> {{ $demographics['age_moyen'] ?? 0 }} ans
                    </div>
                </div>
            </div>
        </div>

        <!-- Finances -->
        <div class="section">
            <h2 class="section-title">Finances</h2>
            
            <div class="highlight">
                <h3 style="font-size: 14px; margin-bottom: 10px;">Revenus potentiels totaux</h3>
                <div style="font-size: 24px; font-weight: bold; color: #2563eb;">
                    {{ number_format($financials['total_revenus_potentiels'] ?? 0, 0, ',', ' ') }} Ar
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Moyenne</div>
                    <div class="stat-value">{{ number_format($financials['revenu_moyen'] ?? 0, 0, ',', ' ') }}</div>
                    <div class="stat-subtitle">Ar par demande</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-label">Maximum</div>
                    <div class="stat-value">{{ number_format($financials['revenu_max'] ?? 0, 0, ',', ' ') }}</div>
                    <div class="stat-subtitle">Ar</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-label">Minimum</div>
                    <div class="stat-value">{{ number_format($financials['revenu_min'] ?? 0, 0, ',', ' ') }}</div>
                    <div class="stat-subtitle">Ar</div>
                </div>
            </div>
            
            @if(isset($financials['par_vocation']))
                <h3 style="font-size: 14px; margin: 20px 0 10px; color: #374151;">Répartition par vocation</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Vocation</th>
                            <th>Montant (Ar)</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($financials['par_vocation'] as $vocation => $montant)
                            <tr>
                                <td>{{ ucfirst($vocation) }}</td>
                                <td><strong>{{ number_format($montant, 0, ',', ' ') }}</strong></td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Document confidentiel • Généré automatiquement • Ne pas diffuser sans autorisation</p>
            <p>© {{ date('Y') }} - Système de gestion foncière</p>
        </div>
    </div>
</body>
</html>
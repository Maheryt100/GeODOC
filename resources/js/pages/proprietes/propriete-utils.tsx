// // resources/js/components/propriete/propriete-utils.tsx
// import { Badge } from '@/components/ui/badge';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// import { 
//     MapPin, 
//     FileText, 
//     Archive, 
//     AlertCircle, 
//     CheckCircle,
//     Info,
//     Home,
//     Trees,
//     Building,
//     Palmtree
// } from 'lucide-react';
// import type { Propriete, Nature, Vocation } from '@/types';

// /**
//  * Badge pour afficher le statut d'une propriété
//  */
// export const ProprieteStatusBadge = ({ propriete }: { propriete: Propriete }) => {
//     const isArchived = propriete.demandes && 
//         propriete.demandes.filter((d: any) => d.status === 'archive').length > 0 &&
//         propriete.demandes.filter((d: any) => d.status === 'active').length === 0;

//     if (isArchived) {
//         return (
//             <Badge variant="secondary" className="bg-amber-100 text-amber-800">
//                 <Archive className="h-3 w-3 mr-1" />
//                 Acquise
//             </Badge>
//         );
//     }

//     return (
//         <Badge variant="outline" className="bg-green-50 text-green-700">
//             <CheckCircle className="h-3 w-3 mr-1" />
//             Active
//         </Badge>
//     );
// };

// /**
//  * Badge pour le type d'opération
//  */
// export const TypeOperationBadge = ({ type }: { type: 'morcellement' | 'immatriculation' }) => {
//     if (type === 'morcellement') {
//         return (
//             <Badge className="bg-orange-500 hover:bg-orange-600">
//                 Morcellement
//             </Badge>
//         );
//     }

//     return (
//         <Badge className="bg-green-500 hover:bg-green-600">
//             Immatriculation
//         </Badge>
//     );
// };

// /**
//  * Badge pour la nature avec icône
//  */
// export const NatureBadge = ({ nature }: { nature: Nature }) => {
//     const config = {
//         'Urbaine': {
//             icon: Building,
//             className: 'bg-blue-50 text-blue-700 border-blue-200',
//             emoji: '🏙️'
//         },
//         'Suburbaine': {
//             icon: Home,
//             className: 'bg-purple-50 text-purple-700 border-purple-200',
//             emoji: '🏘️'
//         },
//         'Rurale': {
//             icon: Trees,
//             className: 'bg-green-50 text-green-700 border-green-200',
//             emoji: '🌾'
//         }
//     };

//     const settings = config[nature];
//     if (!settings) return null;

//     return (
//         <Badge variant="outline" className={settings.className}>
//             <span className="mr-1">{settings.emoji}</span>
//             {nature}
//         </Badge>
//     );
// };

// /**
//  * Badge pour la vocation avec icône
//  */
// export const VocationBadge = ({ vocation }: { vocation: Vocation }) => {
//     const config = {
//         'Edilitaire': {
//             className: 'bg-blue-50 text-blue-700 border-blue-200',
//             emoji: '🏗️'
//         },
//         'Agricole': {
//             className: 'bg-green-50 text-green-700 border-green-200',
//             emoji: '🌱'
//         },
//         'Forestière': {
//             className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
//             emoji: '🌲'
//         },
//         'Touristique': {
//             className: 'bg-cyan-50 text-cyan-700 border-cyan-200',
//             emoji: '🏖️'
//         }
//     };

//     const settings = config[vocation];
//     if (!settings) return null;

//     return (
//         <Badge variant="outline" className={settings.className}>
//             <span className="mr-1">{settings.emoji}</span>
//             {vocation}
//         </Badge>
//     );
// };

// /**
//  * Affichage du Dep/Vol avec tooltip
//  */
// export const DepVolDisplay = ({ depVol, numeroDepVol }: { depVol?: string; numeroDepVol?: string }) => {
//     if (!depVol) {
//         return <span className="text-muted-foreground text-sm">-</span>;
//     }

//     const depVolComplet = numeroDepVol ? `${depVol}:${numeroDepVol}` : depVol;

//     return (
//         <TooltipProvider>
//             <Tooltip>
//                 <TooltipTrigger asChild>
//                     <Badge variant="outline" className="font-mono bg-blue-50 cursor-help">
//                         {depVolComplet}
//                     </Badge>
//                 </TooltipTrigger>
//                 <TooltipContent>
//                     <div className="text-xs">
//                         <p className="font-semibold mb-1">Dépôt et Volume</p>
//                         <p>Dep: {depVol}</p>
//                         {numeroDepVol && <p>Num: {numeroDepVol}</p>}
//                     </div>
//                 </TooltipContent>
//             </Tooltip>
//         </TooltipProvider>
//     );
// };

// /**
//  * Affichage du titre avec TNº
//  */
// export const TitreDisplay = ({ titre }: { titre?: string }) => {
//     if (!titre) {
//         return <span className="text-muted-foreground text-sm">Non attribué</span>;
//     }

//     return (
//         <Badge variant="secondary" className="font-mono">
//             TNº {titre}
//         </Badge>
//     );
// };

// /**
//  * Affichage du lot
//  */
// export const LotDisplay = ({ lot }: { lot: string }) => {
//     return (
//         <Badge variant="outline" className="font-mono font-semibold">
//             {lot}
//         </Badge>
//     );
// };

// /**
//  * Indicateur de complétude de la propriété
//  */
// export const CompletudeIndicator = ({ propriete }: { propriete: Propriete }) => {
//     const fieldsToCheck = [
//         { name: 'titre', label: 'Titre' },
//         { name: 'contenance', label: 'Contenance' },
//         { name: 'proprietaire', label: 'Propriétaire' },
//         { name: 'nature', label: 'Nature' },
//         { name: 'vocation', label: 'Vocation' },
//         { name: 'situation', label: 'Situation' },
//     ];

//     const missingFields = fieldsToCheck.filter(field => !propriete[field.name as keyof Propriete]);
//     const completionRate = ((fieldsToCheck.length - missingFields.length) / fieldsToCheck.length) * 100;

//     if (completionRate === 100) {
//         return (
//             <Badge variant="outline" className="bg-green-50 text-green-700">
//                 <CheckCircle className="h-3 w-3 mr-1" />
//                 Complet
//             </Badge>
//         );
//     }

//     return (
//         <TooltipProvider>
//             <Tooltip>
//                 <TooltipTrigger asChild>
//                     <Badge variant="outline" className="bg-amber-50 text-amber-700 cursor-help">
//                         <AlertCircle className="h-3 w-3 mr-1" />
//                         {Math.round(completionRate)}% complété
//                     </Badge>
//                 </TooltipTrigger>
//                 <TooltipContent>
//                     <div className="text-xs">
//                         <p className="font-semibold mb-1">Champs manquants :</p>
//                         <ul className="list-disc pl-4">
//                             {missingFields.map(field => (
//                                 <li key={field.name}>{field.label}</li>
//                             ))}
//                         </ul>
//                     </div>
//                 </TooltipContent>
//             </Tooltip>
//         </TooltipProvider>
//     );
// };

// /**
//  * Card récapitulative de propriété
//  */
// export const ProprieteCard = ({ propriete, onClick }: { propriete: Propriete; onClick?: () => void }) => {
//     return (
//         <div 
//             className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
//             onClick={onClick}
//         >
//             <div className="flex items-start justify-between mb-3">
//                 <div>
//                     <LotDisplay lot={propriete.lot} />
//                     {propriete.titre && (
//                         <span className="ml-2">
//                             <TitreDisplay titre={propriete.titre} />
//                         </span>
//                     )}
//                 </div>
//                 <ProprieteStatusBadge propriete={propriete} />
//             </div>

//             <div className="space-y-2 text-sm">
//                 {propriete.proprietaire && (
//                     <div className="flex items-center gap-2">
//                         <MapPin className="h-4 w-4 text-muted-foreground" />
//                         <span className="truncate">{propriete.proprietaire}</span>
//                     </div>
//                 )}

//                 {propriete.dep_vol_complet && propriete.dep_vol_complet !== '-' && (
//                     <div className="flex items-center gap-2">
//                         <FileText className="h-4 w-4 text-muted-foreground" />
//                         <DepVolDisplay depVol={propriete.dep_vol} numeroDepVol={propriete.numero_dep_vol} />
//                     </div>
//                 )}

//                 <div className="flex items-center gap-2 flex-wrap">
//                     <TypeOperationBadge type={propriete.type_operation} />
//                     {propriete.nature && <NatureBadge nature={propriete.nature} />}
//                     {propriete.vocation && <VocationBadge vocation={propriete.vocation} />}
//                 </div>

//                 {propriete.contenance && (
//                     <div className="text-xs text-muted-foreground">
//                         Surface: <span className="font-semibold">{propriete.contenance.toLocaleString()} m²</span>
//                     </div>
//                 )}
//             </div>

//             <div className="mt-3 pt-3 border-t">
//                 <CompletudeIndicator propriete={propriete} />
//             </div>
//         </div>
//     );
// };

// /**
//  * Helper pour formater le prix
//  */
// export const formatPrix = (prix: number): string => {
//     return new Intl.NumberFormat('fr-FR', {
//         style: 'currency',
//         currency: 'MGA',
//         minimumFractionDigits: 0,
//         maximumFractionDigits: 0,
//     }).format(prix).replace('MGA', 'Ar');
// };

// /**
//  * Composant d'affichage du prix avec détails
//  */
// export const PrixDisplay = ({ 
//     prixUnitaire, 
//     contenance, 
//     prixTotal 
// }: { 
//     prixUnitaire: number; 
//     contenance: number; 
//     prixTotal: number;
// }) => {
//     return (
//         <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border">
//             <div className="grid grid-cols-3 gap-4 text-center">
//                 <div>
//                     <p className="text-xs text-muted-foreground mb-1">Prix unitaire</p>
//                     <p className="font-semibold text-sm">{formatPrix(prixUnitaire)}/m²</p>
//                 </div>
//                 <div>
//                     <p className="text-xs text-muted-foreground mb-1">Contenance</p>
//                     <p className="font-semibold text-sm">{contenance.toLocaleString()} m²</p>
//                 </div>
//                 <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-md text-white">
//                     <p className="text-xs opacity-90 mb-1 pt-1">Total</p>
//                     <p className="font-bold text-sm pb-1">{formatPrix(prixTotal)}</p>
//                 </div>
//             </div>
//         </div>
//     );
// };

// /**
//  * Liste des propriétés en grille
//  */
// export const ProprieteGrid = ({ 
//     proprietes, 
//     onProprieteClick 
// }: { 
//     proprietes: Propriete[]; 
//     onProprieteClick?: (propriete: Propriete) => void;
// }) => {
//     if (proprietes.length === 0) {
//         return (
//             <div className="text-center py-12 text-muted-foreground">
//                 <MapPin className="h-12 w-12 mx-auto mb-3 opacity-20" />
//                 <p>Aucune propriété trouvée</p>
//             </div>
//         );
//     }

//     return (
//         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//             {proprietes.map((propriete) => (
//                 <ProprieteCard
//                     key={propriete.id}
//                     propriete={propriete}
//                     onClick={() => onProprieteClick?.(propriete)}
//                 />
//             ))}
//         </div>
//     );
// };

// /**
//  * Filtre rapide pour les propriétés
//  */
// export const ProprieteQuickFilter = ({ 
//     onFilterChange 
// }: { 
//     onFilterChange: (filter: string) => void;
// }) => {
//     const filters = [
//         { value: 'all', label: 'Toutes', icon: FileText },
//         { value: 'active', label: 'Actives', icon: CheckCircle },
//         { value: 'archived', label: 'Acquises', icon: Archive },
//         { value: 'incomplete', label: 'Incomplètes', icon: AlertCircle },
//     ];

//     return (
//         <div className="flex gap-2 flex-wrap">
//             {filters.map((filter) => (
//                 <button
//                     key={filter.value}
//                     onClick={() => onFilterChange(filter.value)}
//                     className="flex items-center gap-2 px-3 py-1.5 rounded-md border hover:bg-muted transition-colors text-sm"
//                 >
//                     <filter.icon className="h-4 w-4" />
//                     {filter.label}
//                 </button>
//             ))}
//         </div>
//     );
// };

// /**
//  * Statistiques rapides des propriétés
//  */
// export const ProprieteStats = ({ proprietes }: { proprietes: Propriete[] }) => {
//     const stats = {
//         total: proprietes.length,
//         actives: proprietes.filter(p => {
//             const archived = p.demandes && 
//                 p.demandes.filter((d: any) => d.status === 'archive').length > 0 &&
//                 p.demandes.filter((d: any) => d.status === 'active').length === 0;
//             return !archived;
//         }).length,
//         acquises: proprietes.filter(p => {
//             const archived = p.demandes && 
//                 p.demandes.filter((d: any) => d.status === 'archive').length > 0 &&
//                 p.demandes.filter((d: any) => d.status === 'active').length === 0;
//             return archived;
//         }).length,
//         incompletes: proprietes.filter(p => p.is_incomplete).length,
//     };

//     return (
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
//                 <p className="text-sm text-blue-700 mb-1">Total</p>
//                 <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
//             </div>
//             <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
//                 <p className="text-sm text-green-700 mb-1">Actives</p>
//                 <p className="text-3xl font-bold text-green-900">{stats.actives}</p>
//             </div>
//             <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
//                 <p className="text-sm text-amber-700 mb-1">Acquises</p>
//                 <p className="text-3xl font-bold text-amber-900">{stats.acquises}</p>
//             </div>
//             <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
//                 <p className="text-sm text-orange-700 mb-1">Incomplètes</p>
//                 <p className="text-3xl font-bold text-orange-900">{stats.incompletes}</p>
//             </div>
//         </div>
//     );
// };
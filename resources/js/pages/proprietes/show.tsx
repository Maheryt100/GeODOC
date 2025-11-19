// // resources/js/pages/proprietes/show.tsx
// import AppLayout from '@/layouts/app-layout';
// import { Head, Link, router } from '@inertiajs/react';
// import { usePage } from '@inertiajs/react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Separator } from '@/components/ui/separator';
// import { ArrowLeft, Edit, FileText, MapPin, Calendar, Hash, Archive } from 'lucide-react';
// import type { BreadcrumbItem, Propriete } from '@/types';

// export default function Show() {
//     const { propriete } = usePage<{ propriete: Propriete }>().props;

//     const breadcrumbs: BreadcrumbItem[] = [
//         { title: 'Dossiers', href: route('dossiers') },
//         { title: propriete.dossier?.nom_dossier || 'Dossier', href: route('dossiers.show', propriete.id_dossier) },
//         { title: `Lot ${propriete.lot}`, href: '#' },
//     ];

//     const InfoRow = ({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) => (
//         <div className="flex items-start justify-between py-3 border-b last:border-0">
//             <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
//                 {Icon && <Icon className="h-4 w-4" />}
//                 {label}
//             </div>
//             <div className="text-sm font-semibold text-right max-w-[60%]">
//                 {value || <span className="text-muted-foreground">Non renseigné</span>}
//             </div>
//         </div>
//     );

//     const isArchived = propriete.demandes && 
//         propriete.demandes.filter((d: any) => d.status === 'archive').length > 0 &&
//         propriete.demandes.filter((d: any) => d.status === 'active').length === 0;

//     return (
//         <AppLayout breadcrumbs={breadcrumbs}>
//             <Head title={`Propriété - Lot ${propriete.lot}`} />

//             <div className="container mx-auto p-6 max-w-6xl">
//                 {/* Header */}
//                 <div className="mb-8">
//                     <div className="flex items-center justify-between">
//                         <div>
//                             <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//                                 Propriété - Lot {propriete.lot}
//                             </h1>
//                             <div className="flex items-center gap-3 mt-2">
//                                 {propriete.titre && (
//                                     <Badge variant="outline" className="font-mono">
//                                         TNº {propriete.titre}
//                                     </Badge>
//                                 )}
//                                 <Badge 
//                                     variant={propriete.type_operation === 'morcellement' ? 'default' : 'secondary'}
//                                     className={propriete.type_operation === 'morcellement' ? 'bg-orange-500' : 'bg-green-500'}
//                                 >
//                                     {propriete.type_operation === 'morcellement' ? 'Morcellement' : 'Immatriculation'}
//                                 </Badge>
//                                 {isArchived && (
//                                     <Badge variant="secondary" className="bg-amber-100 text-amber-800">
//                                         <Archive className="h-3 w-3 mr-1" />
//                                         Acquise
//                                     </Badge>
//                                 )}
//                             </div>
//                         </div>
//                         <div className="flex gap-2">
//                             {!isArchived && (
//                                 <Button asChild>
//                                     <Link href={route('proprietes.edit', propriete.id)}>
//                                         <Edit className="h-4 w-4 mr-2" />
//                                         Modifier
//                                     </Link>
//                                 </Button>
//                             )}
//                             <Button
//                                 variant="outline"
//                                 onClick={() => router.visit(route('dossiers.show', propriete.id_dossier))}
//                             >
//                                 <ArrowLeft className="h-4 w-4 mr-2" />
//                                 Retour
//                             </Button>
//                         </div>
//                     </div>
//                 </div>

//                 <div className="grid gap-6 md:grid-cols-2">
//                     {/* Identification */}
//                     <Card className="shadow-lg">
//                         <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
//                             <CardTitle className="flex items-center gap-2">
//                                 <Hash className="h-5 w-5" />
//                                 Identification
//                             </CardTitle>
//                             <CardDescription>Références de la propriété</CardDescription>
//                         </CardHeader>
//                         <CardContent className="pt-6">
//                             <div className="space-y-1">
//                                 <InfoRow label="Lot" value={propriete.lot} />
//                                 <InfoRow label="Titre" value={propriete.titre ? `TNº ${propriete.titre}` : null} />
//                                 <InfoRow 
//                                     label="Dep/Vol" 
//                                     value={propriete.dep_vol_complet && propriete.dep_vol_complet !== '-' ? (
//                                         <Badge variant="outline" className="font-mono bg-blue-50">
//                                             {propriete.dep_vol_complet}
//                                         </Badge>
//                                     ) : null}
//                                 />
//                                 <InfoRow label="Numéro FN" value={propriete.numero_FN} />
//                                 {propriete.type_operation === 'immatriculation' && (
//                                     <InfoRow label="Nº Requisition" value={propriete.numero_requisition} />
//                                 )}
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Classification */}
//                     <Card className="shadow-lg">
//                         <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
//                             <CardTitle className="flex items-center gap-2">
//                                 <MapPin className="h-5 w-5" />
//                                 Classification
//                             </CardTitle>
//                             <CardDescription>Nature et vocation du terrain</CardDescription>
//                         </CardHeader>
//                         <CardContent className="pt-6">
//                             <div className="space-y-1">
//                                 <InfoRow 
//                                     label="Nature" 
//                                     value={propriete.nature ? (
//                                         <Badge 
//                                             variant="outline"
//                                             className={
//                                                 propriete.nature === 'Urbaine' ? 'bg-blue-50' :
//                                                 propriete.nature === 'Suburbaine' ? 'bg-purple-50' :
//                                                 'bg-green-50'
//                                             }
//                                         >
//                                             {propriete.nature}
//                                         </Badge>
//                                     ) : null}
//                                 />
//                                 <InfoRow 
//                                     label="Vocation" 
//                                     value={propriete.vocation ? (
//                                         <Badge variant="outline" className="bg-blue-50">
//                                             {propriete.vocation}
//                                         </Badge>
//                                     ) : null}
//                                 />
//                                 <InfoRow 
//                                     label="Contenance" 
//                                     value={propriete.contenance ? (
//                                         <span className="font-mono">{propriete.contenance.toLocaleString()} m²</span>
//                                     ) : null}
//                                 />
//                                 <InfoRow label="Situation" value={propriete.situation} />
//                                 <InfoRow label="Charges" value={propriete.charge} />
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Propriétaire */}
//                     <Card className="shadow-lg">
//                         <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
//                             <CardTitle className="flex items-center gap-2">
//                                 <FileText className="h-5 w-5" />
//                                 Propriétaire
//                             </CardTitle>
//                             <CardDescription>Informations du propriétaire</CardDescription>
//                         </CardHeader>
//                         <CardContent className="pt-6">
//                             <div className="space-y-1">
//                                 <InfoRow label="Nom propriété / Propriétaire" value={propriete.proprietaire} />
//                                 {propriete.type_operation === 'morcellement' && (
//                                     <>
//                                         <Separator className="my-3" />
//                                         <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
//                                             Propriété Mère
//                                         </div>
//                                         <InfoRow label="Nom propriété mère" value={propriete.propriete_mere} />
//                                         <InfoRow label="Titre mère" value={propriete.titre_mere} />
//                                     </>
//                                 )}
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Dates et Documents */}
//                     <Card className="shadow-lg">
//                         <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
//                             <CardTitle className="flex items-center gap-2">
//                                 <Calendar className="h-5 w-5" />
//                                 Dates et Documents
//                             </CardTitle>
//                             <CardDescription>Informations temporelles</CardDescription>
//                         </CardHeader>
//                         <CardContent className="pt-6">
//                             <div className="space-y-1">
//                                 <InfoRow 
//                                     label="Date inscription" 
//                                     value={propriete.date_inscription ? 
//                                         new Date(propriete.date_inscription).toLocaleDateString('fr-FR') : null
//                                     }
//                                 />
//                                 <InfoRow 
//                                     label="Date requisition" 
//                                     value={propriete.date_requisition ? 
//                                         new Date(propriete.date_requisition).toLocaleDateString('fr-FR') : null
//                                     }
//                                 />
//                                 <Separator className="my-3" />
//                                 <InfoRow 
//                                     label="Créé le" 
//                                     value={propriete.created_at ? 
//                                         new Date(propriete.created_at).toLocaleDateString('fr-FR', {
//                                             year: 'numeric',
//                                             month: 'long',
//                                             day: 'numeric',
//                                             hour: '2-digit',
//                                             minute: '2-digit'
//                                         }) : null
//                                     }
//                                 />
//                                 <InfoRow 
//                                     label="Modifié le" 
//                                     value={propriete.updated_at ? 
//                                         new Date(propriete.updated_at).toLocaleDateString('fr-FR', {
//                                             year: 'numeric',
//                                             month: 'long',
//                                             day: 'numeric',
//                                             hour: '2-digit',
//                                             minute: '2-digit'
//                                         }) : null
//                                     }
//                                 />
//                             </div>
//                         </CardContent>
//                     </Card>
//                 </div>

//                 {/* Demandeurs associés */}
//                 {propriete.demandeurs && propriete.demandeurs.length > 0 && (
//                     <Card className="shadow-lg mt-6">
//                         <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
//                             <CardTitle>Demandeurs Associés</CardTitle>
//                             <CardDescription>
//                                 {propriete.demandeurs.length} demandeur(s) lié(s) à cette propriété
//                             </CardDescription>
//                         </CardHeader>
//                         <CardContent className="pt-6">
//                             <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
//                                 {propriete.demandeurs.map((demandeur: any) => (
//                                     <Card key={demandeur.id} className="border-2">
//                                         <CardContent className="pt-4">
//                                             <div className="flex items-start justify-between">
//                                                 <div>
//                                                     <p className="font-semibold">
//                                                         {demandeur.nom_demandeur} {demandeur.prenom_demandeur}
//                                                     </p>
//                                                     <p className="text-sm text-muted-foreground">
//                                                         CIN: {demandeur.cin}
//                                                     </p>
//                                                 </div>
//                                                 <Badge 
//                                                     variant={demandeur.pivot?.status === 'active' ? 'default' : 'secondary'}
//                                                     className={demandeur.pivot?.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}
//                                                 >
//                                                     {demandeur.pivot?.status === 'active' ? 'Actif' : 'Archivé'}
//                                                 </Badge>
//                                             </div>
//                                         </CardContent>
//                                     </Card>
//                                 ))}
//                             </div>
//                         </CardContent>
//                     </Card>
//                 )}

//                 {/* Prix et calculs */}
//                 {propriete.dossier?.district && propriete.contenance && propriete.vocation && (
//                     <Card className="shadow-lg mt-6">
//                         <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
//                             <CardTitle>Calcul du Prix</CardTitle>
//                             <CardDescription>
//                                 Basé sur la vocation et le district
//                             </CardDescription>
//                         </CardHeader>
//                         <CardContent className="pt-6">
//                             <div className="grid gap-4 md:grid-cols-3">
//                                 <div className="text-center p-4 bg-muted rounded-lg">
//                                     <p className="text-sm text-muted-foreground mb-1">Prix unitaire</p>
//                                     <p className="text-2xl font-bold">
//                                         {new Intl.NumberFormat('fr-FR').format(propriete.getPrixUnitaire?.() || 0)} Ar/m²
//                                     </p>
//                                 </div>
//                                 <div className="text-center p-4 bg-muted rounded-lg">
//                                     <p className="text-sm text-muted-foreground mb-1">Contenance</p>
//                                     <p className="text-2xl font-bold">
//                                         {new Intl.NumberFormat('fr-FR').format(propriete.contenance)} m²
//                                     </p>
//                                 </div>
//                                 <div className="text-center p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg">
//                                     <p className="text-sm opacity-90 mb-1">Prix total</p>
//                                     <p className="text-2xl font-bold">
//                                         {new Intl.NumberFormat('fr-FR').format(propriete.getPrixTotal?.() || 0)} Ar
//                                     </p>
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 )}
//             </div>
//         </AppLayout>
//     );
// }
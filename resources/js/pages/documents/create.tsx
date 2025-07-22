import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Eye } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

export default function Create({ proprietes, demandeurs }){
    // etat du combobox ouvert ou fermé
    const [proprieteOpen, setProprieteOpen] = useState(false);
    const [demandeurOpen, setDemandeurOpen] = useState(false);
    const [consortOpen, setConsortOpen] = useState(false);

    const [lot, setLot] = useState("");
    const [selectedProprieteId, setSelectedProprieteId] = useState("");
    const selectedPropriete = proprietes.find(p => p.id === selectedProprieteId);

    const [selectedDemandeurId, setSelectedDemandeurId] = useState(null);
    const [selectedDemandeur, setSelectedDemandeur] = useState(null);
    const [showCoDemandeur, setShowCoDemandeur] = useState(false);
    const [selectedCoDemandeurs, setSelectedCoDemandeurs] = useState([]);

    const handleValidate = (e: React.FormEvent) => {
        e.preventDefault();
        console.log(selectedProprieteId,selectedDemandeurId, selectedCoDemandeurs);

        if(selectedProprieteId === ''){
            toast.warning('Veuillez sélectionner une propriété!');
            return;
        }else if(selectedDemandeurId == null){
            toast.warning('Veuillez séléctionner un demandeur principale');
            return;
        }
        router.post('/documents/store',{
            propriete_id: selectedProprieteId,
            demandeur_id: selectedDemandeurId,
            consort: selectedCoDemandeurs.map(cd => cd.id),
        },{
            onError: (errors) =>{
                Object.values(errors).forEach((error) => {
                    toast.error(error);
                });
            }
        });
    }


    return(
         <AppLayout>
            <Head title={'Liaison Document'}/>
             <Toaster position={'top-right'}/>
             <form onSubmit={handleValidate}>
                <div className={'flex gap-4 m-5'}>
                    <div>
                        <Popover open={proprieteOpen} onOpenChange={setProprieteOpen}>
                            <PopoverTrigger asChild>
                                <Button variant={'outline'}
                                        role={'combobox'}
                                        aria-expanded={proprieteOpen}
                                >
                                    { lot || 'Lot de propriété'}
                                    <ChevronsUpDown/>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                                <Command>
                                    <CommandInput placeholder={'Rechercher un lot...'}/>
                                    <CommandList>
                                        <CommandEmpty>Aucun Lot de propriété ne correspond</CommandEmpty>
                                    </CommandList>
                                    <CommandGroup>
                                        {proprietes.map((propriete) =>(
                                            <CommandItem
                                                key={propriete.id}
                                                value={propriete.lot}
                                                onSelect={() =>{
                                                    setProprieteOpen(false);
                                                    setSelectedProprieteId(propriete.id)
                                                    setLot(propriete.lot)
                                                }}
                                            >
                                                Lot: {propriete.lot}, Titre: {propriete.titre}
                                                <Check className={cn(
                                                    "ml-auto",
                                                    lot === propriete.lot ? "opacity-100" : "opacity-0"
                                                )}/>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div>
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant={'outline'} className={'cursor-pointer hover:underline border-0 shadow-none'}>
                                    <Eye/>
                                    Visualiser
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle>Propriété</SheetTitle>
                                    <SheetDescription>
                                        Verifier les informations du propiété.
                                        Si l'information n'est pas correct ou vide, veuillez réctifier la propriété
                                    </SheetDescription>
                                </SheetHeader>
                                {selectedPropriete ? (
                                    <div className="mt-4 flex flex-col gap-3 rounded-md pl-10 h-full space-y-2">
                                        <div className={'w-3/4 flex items-center gap-2'}>
                                            <Label className={'min-w-[60px'}>Type: </Label>
                                            <Input value={selectedPropriete.type} className={"flex-1"} readOnly/>
                                        </div>
                                        <div className={'w-3/4 flex items-center gap-2'}>
                                            <Label className={'min-w-[60px'}>Lot: </Label>
                                            <Input value={selectedPropriete.lot} className={"flex-1"} readOnly/>
                                        </div>
                                        <div className={'w-3/4 flex items-center gap-2'}>
                                            <Label className={'min-w-[60px'}>Titre: </Label>
                                            <Input value={selectedPropriete.titre} className={"flex-1"} readOnly/>
                                        </div>
                                        <div className={'w-3/4 flex items-center gap-2'}>
                                            <Label className={'min-w-[60px'}>Propriété mère: </Label>
                                            <Input value={selectedPropriete.propriete_mere} className={"flex-1"} readOnly/>
                                        </div>
                                        <div className={'w-3/4 flex items-center gap-2'}>
                                            <Label className={'min-w-[60px'}>Commune: </Label>
                                            <Input value={selectedPropriete.commune} className={"flex-1"} readOnly/>
                                        </div>
                                        <div className={'w-3/4 flex items-center gap-2'}>
                                            <Label className={'min-w-[60px'}>Fokotany: </Label>
                                            <Input value={selectedPropriete.quartier} className={"flex-1"} readOnly/>
                                        </div>
                                        <div className={'w-3/4 flex items-center gap-2'}>
                                            <Label className={'min-w-[60px'}>Contenance: </Label>
                                            <Input value={selectedPropriete.contenance} className={"flex-1"} readOnly/>
                                        </div>
                                        <div className={'w-3/4 flex items-center gap-2'}>
                                            <Label className={'min-w-[60px'}>Nom propriété: </Label>
                                            <Input value={selectedPropriete.proprietaire} className={"flex-1"} readOnly/>
                                        </div>
                                        <div className={'w-3/4 items-center gap-2'}>
                                            <Label className={'min-w-[60px'}>Circonscription: </Label>
                                            <Input value={selectedPropriete.circonscription} className={"flex-1"} readOnly/>
                                        </div>
                                        <div className={'w-3/4 flex items-center gap-2'}>
                                            <Label className={'min-w-[60px'}>Charge: </Label>
                                            <Input value={selectedPropriete.charge} className={"flex-1"} readOnly/>
                                        </div>
                                        <div className={'w-3/4 flex items-center gap-2'}>
                                            <Label className={'min-w-[60px'}>situation: </Label>
                                            <Input value={selectedPropriete.situation} className={"flex-1"} readOnly/>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-4 text-muted-foreground">Aucune propriété sélectionnée.</p>
                                )}
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
                 <div className={'flex'}>
                     <div className={''}>
                         <div className={'flex flex-col gap-4 m-5 '}>
                             {/* Popover pour sélectionner le demandeur principal */}
                             <div className={'flex gap-6 justify-aroundmhbn jkmjh      '}>
                                 <div>
                                     <Popover open={demandeurOpen} onOpenChange={setDemandeurOpen}>
                                         <PopoverTrigger asChild>
                                             <Button variant={'outline'} role={'combobox'} aria-expanded={demandeurOpen}>
                                                 {selectedDemandeur ? `${selectedDemandeur.nom_demandeur} ${selectedDemandeur.prenom_demandeur}` : 'Sélectionner un demandeur'}
                                                 <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                             </Button>
                                         </PopoverTrigger>
                                         <PopoverContent>
                                             <Command>
                                                 <CommandInput placeholder="Rechercher un demandeur..." />
                                                 <CommandList>
                                                     <CommandEmpty>Aucun résultat</CommandEmpty>
                                                     <CommandGroup>
                                                         {demandeurs.map(d => (
                                                             <CommandItem
                                                                 key={d.id}
                                                                 onSelect={() => {
                                                                     setSelectedDemandeurId(d.id);
                                                                     setDemandeurOpen(false)
                                                                     setSelectedDemandeur(d);
                                                                     setSelectedCoDemandeurs([]);
                                                                 }}
                                                             >
                                                                 {d.nom_demandeur} {d.prenom_demandeur}
                                                                 <Check
                                                                     className={cn("ml-auto", selectedDemandeurId === d.id ? "opacity-100" : "opacity-0")}
                                                                 />
                                                             </CommandItem>
                                                         ))}
                                                     </CommandGroup>
                                                 </CommandList>
                                             </Command>
                                         </PopoverContent>
                                     </Popover>
                                 </div>
                                 <div>
                                     <Sheet>
                                         <SheetTrigger asChild>
                                             <Button variant={'outline'} className={'border-0 shadow-none hover:underline'}>
                                                 <Eye/>
                                                 Visualiser
                                             </Button>
                                         </SheetTrigger>
                                         <SheetContent>
                                             <SheetHeader>
                                                 <SheetTitle>Demandeur</SheetTitle>
                                                 <SheetDescription>
                                                     Verifier les informations du demandeur.
                                                     Si l'information n'est pas correct ou vide, veuillez réctifier la propriété
                                                 </SheetDescription>
                                             </SheetHeader>
                                             {selectedDemandeur ? (
                                                 <div className="mt-4 flex flex-col gap-3 rounded-md pl-10 h-full space-y-2">
                                                     <div className={'w-3/4 flex items-center gap-2'}>
                                                         <Label className={'min-w-[60px'}>Nom complet: </Label>
                                                         <Input value={selectedDemandeur.nom_demandeur} className={"flex-1"} readOnly/>
                                                     </div>
                                                     <div className={'w-3/4 flex items-center gap-2'}>
                                                         <Label className={'min-w-[60px'}>Prénom: </Label>
                                                         <Input value={selectedDemandeur.prenom_demandeur} className={"flex-1"} readOnly/>
                                                     </div>
                                                     <div className={'w-3/4 flex items-center gap-2'}>
                                                         <Label className={'min-w-[60px'}>Domiciliation: </Label>
                                                         <Input value={selectedDemandeur.domiciliation} className={"flex-1"} readOnly/>
                                                     </div>
                                                     <div className={'w-3/4 flex items-center gap-2'}>
                                                         <Label className={'min-w-[60px'}>Cin: </Label>
                                                         <Input value={selectedDemandeur.cin} className={"flex-1"} readOnly/>
                                                     </div>
                                                     <div className={'w-3/4 flex items-center gap-2'}>
                                                         <Label className={'min-w-[60px'}>Situation Familiale: </Label>
                                                         <Input value={selectedDemandeur.situation_familiale} className={"flex-1"} readOnly/>
                                                     </div>
                                                     <div className={'w-3/4 flex items-center gap-2'}>
                                                         <Label className={'min-w-[60px'}>sexe: </Label>
                                                         <Input value={selectedDemandeur.sexe} className={"flex-1"} readOnly/>
                                                     </div>
                                                     <div className={'w-3/4 flex items-center gap-2'}>
                                                         <Label className={'min-w-[60px'}>Occupation: </Label>
                                                         <Input value={selectedDemandeur.occupation} className={"flex-1"} readOnly/>
                                                     </div>
                                                     <div className={'w-3/4 items-center gap-2'}>
                                                         <Label className={'min-w-[60px'}>Regime Matrimonial: </Label>
                                                         <Input value={selectedDemandeur.regime_matrimoniale} className={"flex-1"} readOnly/>
                                                     </div>
                                                     <div className={' w-3/4 flex items-center gap-2'}>
                                                         <Label className={'min-w-[60px'}>Téléphone: </Label>
                                                         <Input value={selectedDemandeur.telephone || ''} className={"flex-1"} readOnly/>
                                                     </div>
                                                 </div>
                                             ) : (
                                                 <p className="mt-4 text-muted-foreground">Aucun Demandeur sélectionnée.</p>
                                             )}
                                         </SheetContent>
                                     </Sheet>
                                 </div>
                             </div>

                             <div className="flex items-center space-x-2">
                                 <Switch id="co-demandeur"
                                    onClick={() => setShowCoDemandeur(!showCoDemandeur)}
                                 />
                                 <Label htmlFor="co-demandeur">Consort?</Label>
                             </div>

                             {showCoDemandeur && (
                                 <Popover open={consortOpen} onOpenChange={setConsortOpen}>
                                     <PopoverTrigger asChild>
                                         <Button variant={'outline'} aria-expanded={consortOpen}>
                                             {selectedCoDemandeurs.length > 0
                                                 ? `${selectedCoDemandeurs.length} consort(s) sélectionné(s)`
                                                  : 'Sélectionner un/des Consort(s)'}
                                         </Button>
                                     </PopoverTrigger>
                                     <PopoverContent>
                                         <Command>
                                             <CommandInput placeholder="Rechercher..." />
                                             <CommandList>
                                                 <CommandEmpty>Aucun résultat</CommandEmpty>
                                                 <CommandGroup>
                                                     {demandeurs
                                                         .filter(d => d.id !== selectedDemandeurId)
                                                         .map(d => (
                                                             <CommandItem
                                                                 key={d.id}
                                                                 onSelect={() => {
                                                                     if (selectedCoDemandeurs.some(cd => cd.id === d.id)) {
                                                                         setSelectedCoDemandeurs(prev => prev.filter(cd => cd.id !== d.id));
                                                                     } else {
                                                                         setSelectedCoDemandeurs(prev => [...prev, d]);
                                                                     }
                                                                     setConsortOpen(false)
                                                                 }}
                                                             >
                                                                 {d.nom_demandeur} {d.prenom_demandeur}
                                                                 <Check
                                                                     className={cn("ml-auto", selectedCoDemandeurs.some(cd => cd.id === d.id) ? "opacity-100" : "opacity-0")}
                                                                 />
                                                             </CommandItem>
                                                         ))}
                                                 </CommandGroup>
                                             </CommandList>
                                         </Command>
                                     </PopoverContent>
                                 </Popover>
                             )}


                             {selectedCoDemandeurs.length > 0 && (
                                 <div className="mt-2 p-4 border rounded-md bg-gray-50">
                                     <h4 className="font-bold mb-2">Consort sélectionnés :</h4>
                                     <ul className="list-disc pl-6">
                                         {selectedCoDemandeurs.map(cd => (
                                             <li key={cd.id}>
                                                 {cd.nom_demandeur} {cd.prenom_demandeur}
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                             )}
                         </div>
                     </div>
                 </div>
                 <div>
                     <Button type={'submit'}>
                         Lier
                     </Button>
                 </div>
             </form>
         </AppLayout>
    );
}

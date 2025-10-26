<?php

namespace App\Http\Controllers;

use App\Models\Consort;
use App\Models\DemandeConsort;
use App\Models\Demander;
use App\Models\Demandeur;
use App\Models\District;
use App\Models\Dossier;
use App\Models\Propriete;
use App\Models\UserCSF;
use App\Models\UserDemande;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use NumberFormatter;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpWord\TemplateProcessor;
use function Termwind\render;

class DemandeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, $dossierId)
    {
        $dossier = Dossier::findOrFail($dossierId);

        $query = Demander::with(['demandeur', 'propriete'])
            ->where('status', 'active')
            ->whereHas('propriete', fn($q) => $q->where('id_dossier', $dossier->id));

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->whereHas('propriete', fn($sub) =>
                $sub->where('lot', 'ilike', "%{$search}%")
                    ->orWhere('titre', 'ilike', "%{$search}%")
                )
                    ->orWhereHas('demandeur', fn($sub) =>
                    $sub->where('nom_demandeur', 'ilike', "%{$search}%")
                        ->orWhere('prenom_demandeur', 'ilike', "%{$search}%")
                        ->orWhere('cin', 'like', "%{$search}%")
                    );
            });
        }

        $demandes = $query->paginate(20);

        return Inertia::render('documents/index', [
            'dossier' => $dossier,
            'documents' => $demandes,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create($id)
    {
        $dossier = Dossier::find($id);
        $demandeurs = $dossier->demandeurs->toArray();
        return Inertia::render('documents/create',[
            'proprietes' => Propriete::where('status',false)->where('id_dossier', $dossier->id)->get(),
            'demandeurs' => $demandeurs,
            'dossier' => $dossier,
        ]);
    }
    public function list($id)
    {
        $dossier = Dossier::find($id);
        $demandes = Demander::with(['demandeur', 'propriete'])
            ->whereHas('propriete', function ($q) use ($dossier) {
                $q->where('id_dossier', $dossier->id);
            })
            ->where('status', 'active')
            ->paginate(20);

        return Inertia::render('documents/index',[
            'dossier' => $dossier,
            'documents'=> $demandes,
        ]);
    }

    public function archive(Request $request)
    {
        $demande = Demander::find($request->id);

        $propriete = Propriete::find($demande->id_propriete);
        $propriete->status = false;
        $propriete->save();
        $demande->status = 'archive';
        $demande->save();

        return to_route('dossiers.list', $request->id_dossier)->with('message', 'Document archivé avec succès');
    }

    public function exportList($id)
    {
        $dossier = Dossier::find($id);
        $demandes = Demander::with(['demandeur', 'propriete'])
            ->whereHas('propriete', function ($q) use ($dossier) {
                $q->where('id_dossier', $dossier->id);
            })
            ->where('status', 'active')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $sheet->setCellValue('A1', 'Lot');
        $sheet->setCellValue('B1', 'Demandeur');
        $sheet->setCellValue('C1', 'lieu Dite');
        $sheet->setCellValue('D1', 'fokontany');
        $sheet->setCellValue('E1', 'Nom Propriete');
        $sheet->setCellValue('F1', 'Nature');
        $sheet->setCellValue('G1', 'Superficie');
        $sheet->setCellValue('H1', 'PT');

        $row = 2;
        foreach ($demandes as $demande) {
            $sheet->setCellValue("A{$row}", $demande->propriete->lot);
            $sheet->setCellValue("B{$row}", $demande->demandeur->nom_demandeur . " " . $demande->demandeur->prenom_demandeur);
            $sheet->setCellValue("C{$row}", $demande->propriete->situation);
            $sheet->setCellValue("D{$row}", $dossier->fokontany);
            $sheet->setCellValue("E{$row}", $demande->propriete->proprietaire);
            $sheet->setCellValue("F{$row}", $demande->propriete->nature);
            $sheet->setCellValue("G{$row}",$demande->propriete->contenance);
            $sheet->setCellValue("H{$row}",$demande->total_prix);
            $row++;
        }
        $writer = new Xlsx($spreadsheet);
        $fileName = 'listes.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $fileName);

    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //dd($request);

        //validation des données
        $validate = $request->validate([
            'id_dossier' => 'required|exists:dossiers,id',
            'propriete_id' => 'required|exists:proprietes,id',
            'demandeur_id' => 'required|exists:demandeurs,id',
            'consort' => 'array|nullable',
            'consort.*' => 'exists:demandeurs,id',
        ]);

        //requête pour la séléction du dossier
        $dossier = DB::table('dossiers')
            ->select('dossiers.*')
            ->where('id', $validate['id_dossier'])
            ->first();

        //requête pour la séléction du demandeur (principale)
        $demandeur = DB::table('demandeurs')
            ->select('demandeurs.*')
            ->where('id', $validate['demandeur_id'])
            ->first();

        //requête pour la séléction de la propriété
        $propriete = DB::table('proprietes')
            ->select('proprietes.*')
            ->where('id', $validate['propriete_id'])
            ->first();
        $nature = $propriete->nature;

        //requête pour la récuperation du prix par district
        $prixDistrict = DB::table("districts")
            ->join('dossiers', 'districts.id', '=', 'dossiers.id_district')
            ->select("districts.$nature")
            ->where('dossiers.id', $dossier->id)
            ->first();

        $prix = $prixDistrict->$nature;

        $superficie = $propriete->contenance;

        $prixTotal = $prix * $superficie;

        try {
            //insertion association entre demandeur <----> propriete
            $document = Demander::create([
                'id_demandeur' => $validate['demandeur_id'],
                'id_propriete' => $validate['propriete_id'],
                'total_prix' => $prixTotal,
                'id_user' => Auth::user()->getAuthIdentifier(),
                'status_consort' => $validate['consort'] != null ? true : false,
            ]);
            //set status propriete true (quelqu'un utilse ce terrain)
            $status_propriete = DB::update(
                'update proprietes set status = true where id = ?' ,[$validate['propriete_id']]
            );
            if ($validate['consort'] != null){
                //parcours le tableau et insert un consort à un demandeur principale et verifie si le consort existe déjà
                foreach ($validate['consort'] as $id_consort) {
                    //verifie si le consort existe déja
                    $consort = Consort::where('id_demandeur', $validate['demandeur_id'])
                        ->where('id_consort', $id_consort)
                        ->first();

                    if (!$consort) {
                        $consort = Consort::create([
                            'id_demandeur' => $validate['demandeur_id'],
                            'id_consort' => $id_consort,
                        ]);
                    }
                    //inserer dans la relation
                    DemandeConsort::create([
                        'id_consort' => $consort->id,
                        'id_demande' => $document->id,
                    ]);
                }
            }
            return to_route('dossiers.list', $dossier->id)->with('message', 'Demandeur et Propriété lié!');

        }catch (\Exception $exception){
            return back()->withErrors($exception->getMessage());
        }
    }
    public function download($id){
        //traduction des dates Français
        Carbon::setLocale('fr');
        $formatter = new NumberFormatter('fr', NumberFormatter::SPELLOUT);

        $demande = Demander::where('id', $id)->first();

        //requête pour la séléction du demandeur (principale)
        $demandeur = DB::table('demandeurs')
            ->select('demandeurs.*')
            ->where('id', $demande['id_demandeur'])
            ->first();

        //requête pour la séléction de la propriété
        $propriete = DB::table('proprietes')
            ->select('proprietes.*')
            ->where('id', $demande['id_propriete'])
            ->first();
        $proprietes = (array) $propriete;

        //requête pour la séléction du dossier
        $dossier = DB::table('dossiers')
            ->select('dossiers.*')
            ->where('id', $propriete->id_dossier)
            ->first();

        $nature = $propriete->nature;

        $type = $dossier->type;

        //requête pour la récuperation du prix par district
        $prixDistrict = DB::table("districts")
            ->join('dossiers', 'districts.id', '=', 'dossiers.id_district')
            ->select("districts.$nature")
            ->where('dossiers.id', $dossier->id)
            ->first();

        //requête pour la séléction du nom Province et du Region
        $place = DB::table('dossiers')
            ->join('districts', 'districts.id', '=', 'dossiers.id_district')
            ->join('regions', 'regions.id', '=', 'districts.id_region')
            ->join('provinces', 'provinces.id', '=', 'regions.id_province')
            ->where('dossiers.id', $dossier->id)
            ->select('provinces.nom_province', 'regions.nom_region', 'districts.nom_district')
            ->first();

        $prix = $prixDistrict->$nature;

        $prixLettre = Str::upper(ucfirst($formatter->format($prix)));

        $prixTotal = $demande->total_prix;

        $superficie = $propriete->contenance;


        //calcul et format du contenance en lettre et en Ha A Ca
        $hectares = intdiv($superficie, 10000);
        $reste = $superficie % 10000;
        $ares = intdiv($reste, 100);
        $centiares = $reste % 100;

        $parts = [];

        $contenanceFormat = '';
        $contenanceFormatLettre = '';

        if ($hectares > 0) {
            $contenanceFormat .= str_pad($hectares, 2, '0', STR_PAD_LEFT) . 'Ha ';
            $label = $hectares === 1 ? 'HECTARE' : 'HECTARES';
            $parts[] = strtoupper($formatter->format($hectares)) . " $label";
        }

        if ($ares > 0 || $hectares > 0) {
            $contenanceFormat .= str_pad($ares, 2, '0', STR_PAD_LEFT) . 'A ';
            $label = $ares === 1 ? 'ARE' : 'ARES';
            $parts[] = strtoupper($formatter->format($ares)) . " $label";
        }


        $label = $centiares === 1 ? 'CENTIARE' : 'CENTIARES';
        $parts[] = strtoupper($formatter->format($centiares)) . " $label";

        $contenanceFormat .= str_pad($centiares, 2, '0', STR_PAD_LEFT) . 'Ca';
        $contenanceFormatLettre = implode(' ', $parts);

        $totalLettre = Str::upper(ucfirst($formatter->format($prixTotal)));

        $firstLetterDistrict = strtolower(mb_substr($place->nom_district, 0, 1));
        $firstLetterCommune = strtolower(mb_substr($dossier->commune, 0, 1));

        /** !!!!  IMPORTANT !!!!
         *
         * séléction approfondie pour la séléction du fichier à générer
         *
         * */
        $user_demande = UserDemande::create([
            'id_user' => Auth::user()->getAuthIdentifier(),
            'id_demande' => $demande->id,
        ]);
        if ($demande['status_consort'] == false) {
            //condition si le type est morcellement.
            if ($type == 'morcellement') {
                $modele_odoc = new TemplateProcessor(storage_path('app/public/modele_odoc/sans_consort/morcellement.docx'));

            }elseif ($type == 'immatriculation') { //si le type est Immatriculation
                $modele_odoc = new TemplateProcessor(storage_path('app/public/modele_odoc/sans_consort/immatriculation.docx'));
            }

            //date en français
            $dateNaissance = Carbon::parse($demandeur->date_naissance)->translatedFormat('d F Y');
            $dateMariage = $demandeur->date_mariage ? Carbon::parse($demandeur->date_mariage)->translatedFormat('d F Y') : '';
            $dateDelivrance = Carbon::parse($demandeur->date_delivrance)->translatedFormat('d F Y');
            $dateDelivranceDuplicata = Carbon::parse($demandeur->date_delivrance_duplicata)->translatedFormat('d F Y');
            $dateDescenteDebut = Carbon::parse($dossier->date_descente_debut)->translatedFormat('d');
            $dateDescenteFin = Carbon::parse($dossier->date_descente_fin)->translatedFormat('d F Y');

            $dateRequisition = Carbon::parse($propriete->date_requisition)->translatedFormat('d F Y');
            $dateInscription = Carbon::parse($propriete->date_inscription)->translatedFormat('d F Y');

            $dateDescente = $dateDescenteDebut . ' au ' . $dateDescenteFin;

            $modele_odoc->setValues([
                'Titre_long' => $demandeur->titre_demandeur,
                'Nom' => $demandeur->nom_demandeur,
                'Prenom' => $demandeur->prenom_demandeur,
                'Occupation' => $demandeur->occupation,
                'Date_naissance' => $dateNaissance,
                'Lieu_naissance' => $demandeur->lieu_naissance,
                'Cin' => implode('.',str_split($demandeur->cin, 3)),
                'Date_delivrance' => $dateDelivrance,
                'Lieu_delivrance' => $demandeur->lieu_delivrance,
                'Domiciliation' => $demandeur->domiciliation,
                'Nationalite' => $demandeur->nationalite,
                'Date_mariage' => $demandeur->date_mariage ? 'le ' . $dateMariage : '',
                'Lieu_mariage' => $demandeur->lieu_mariage ? ' à ' . $demandeur->lieu_mariage . ", ": '',
                'Nom_mere' => $demandeur->nom_mere,
                'Nom_pere' => $demandeur->nom_pere ? $demandeur->nom_pere . ' et de ' : '',

                'ContenanceFormatLettre' => $contenanceFormatLettre,
                'ContenanceFormat' => $contenanceFormat,
                'Prix' => $prixLettre,
                'PrixTotal' => number_format($prixTotal, 0,',','.'),
                'TotalLettre' => $totalLettre,
                'PrixCarre' => number_format($prix, 0,',', '.'),
                'Situation' => $propriete->situation,
                'Fokotany' => $dossier->fokontany,
                'Commune' => $dossier->commune,
                'Tcommune' => $dossier->type_commune,
                'Propriete_mere' => Str::upper($propriete->propriete_mere),
                'Titre_mere' => $propriete->titre_mere,
                'Titre' => $propriete->titre,
                'DateDescente' => $dateDescente,
                'Requisition' => $dateRequisition,
                'Inscription' => $dateInscription,
                'Dep_vol' => $propriete->dep_vol,

                'Proprietaire' => Str::upper($propriete->proprietaire),
                'Province' => $place->nom_province,
                'Region' => $place->nom_region,
                'District' => $place->nom_district,
                'DISTRICT' => Str::upper($place->nom_district),
                'D_dis' => in_array($firstLetterDistrict, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'D' : 'DE',
                'd_dis' => in_array($firstLetterDistrict, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'd' : 'de',
                'd_com' => in_array($firstLetterCommune, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'd' : 'de',
            ]);

            if ($demandeur->sexe == 'Homme'){

                $modele_odoc->setValues([
                    'EnfantDe' => 'fils',
                    'Demandeur' => 'au demandeur',
                    'Marie_a' => $demandeur->marie_a ? 'marié à la dame ' . $demandeur->marie_a . ',' : null,
                ]);
            }elseif ($demandeur->sexe == 'Femme'){
                $modele_odoc->setValues([
                    'EnfantDe' => 'fille',
                    'Demandeur' => 'à la demanderesse',
                    'Marie_a' => $demandeur->marie_a ? 'mariée à monsieur ' . $demandeur->marie_a . ',' : null,
                ]);
            }

            $fileName = 'ACTE_DE_VENTE_' . $demandeur->nom_demandeur . '_' . $demandeur->prenom_demandeur . '_' .'.docx';

            $modele_odoc->saveAs(storage_path('app/public/modele_odoc/sans_consort/documents/' .$fileName));

            return response()->download(storage_path('app/public/modele_odoc/sans_consort/documents/' . $fileName));
        }else{

            //condition si le type est morcellement.
            if ($type == 'morcellement') {
                $modele_odoc = new TemplateProcessor(storage_path('app/public/modele_odoc/avec_consort/morcellement.docx'));
            }elseif ($type == 'immatriculation') { //si le type est Immatriculation
                $modele_odoc = new TemplateProcessor(storage_path('app/public/modele_odoc/avec_consort/immatriculation.docx'));
            }
            //séléction des consorts active
            $consorts = $demande->consorts()
                ->pluck('consorts.id_consort')
                ->toArray();

            array_unshift($consorts, $demande['id_demandeur']);

            $modele_odoc->cloneBlock('consort_block_1',count($consorts), true, true);

            $modele_odoc->cloneBlock('consort_block_2',count($consorts), true, true);

            foreach ($consorts as $key => $consort) {
                $n = $key + 1;
                $dmdr = DB::table('demandeurs')
                    ->select('demandeurs.*')
                    ->where('id', $consort)
                    ->first();

                $dateNaissance = Carbon::parse($dmdr->date_naissance)->translatedFormat('d F Y');
                $dateMariage = $dmdr->date_mariage ? Carbon::parse($dmdr->date_mariage)->translatedFormat('d F Y') : '';
                $dateDelivrance = Carbon::parse($dmdr->date_delivrance)->translatedFormat('d F Y');
                $dateDelivranceDuplicata = Carbon::parse($dmdr->date_delivrance_duplicata)->translatedFormat('d F Y');

                $dateDescenteDebut = Carbon::parse($dossier->date_descente_debut)->translatedFormat('d');
                $dateDescenteFin = Carbon::parse($dossier->date_descente_fin)->translatedFormat('d F Y');

                $dateDescente = $dateDescenteDebut . ' au ' . $dateDescenteFin;

                $dateRequisition = Carbon::parse($propriete->date_requisition)->translatedFormat('d F Y');
                $dateInscription = Carbon::parse($propriete->date_inscription)->translatedFormat('d F Y');

                $modele_odoc->setValues([
                    'Numero#' . $n => $n,
                    'Titre_long#' . $n=> $dmdr->titre_demandeur,
                    'Nom#' . $n => $dmdr->nom_demandeur,
                    'Prenom#' . $n => $dmdr->prenom_demandeur,
                    'Occupation#' . $n => $dmdr->occupation,
                    'Date_naissance#' . $n => $dateNaissance,
                    'Lieu_naissance#' . $n => $dmdr->lieu_naissance,
                    'Cin#' . $n => implode('.',str_split($dmdr->cin, 3)),
                    'Date_delivrance#' . $n => $dateDelivrance,
                    'Lieu_delivrance#' . $n => $dmdr->lieu_delivrance,
                    'Domiciliation#' . $n => $dmdr->domiciliation,
                    'Nationalite#' . $n => $dmdr->nationalite,
                    'Date_mariage#' . $n => $dmdr->date_mariage ? 'le ' . $dateMariage : '',
                    'Lieu_mariage#' . $n => $dmdr->lieu_mariage ? ' à ' . $dmdr->lieu_mariage . ", ": '',
                    'Nom_mere#' . $n => $dmdr->nom_mere,
                    'Nom_pere#' . $n => $dmdr->nom_pere ? $dmdr->nom_pere . ' et de ' : '',
                ]);
                if ($demandeur->sexe == 'Homme'){
                    $modele_odoc->setValues([
                        'EnfantDe#' . $n => 'fils',
                        'Demandeur#' . $n => 'au demandeur',
                        'Marie_a#' . $n => $demandeur->marie_a ? 'marié à la dame ' . $demandeur->marie_a . ',' : '',
                    ]);
                }elseif ($demandeur->sexe == 'Femme'){
                    $modele_odoc->setValues([
                        'EnfantDe#' . $n => 'fille',
                        'Demandeur#' . $n => 'à la demanderesse',
                        'Marie_a#' . $n => $demandeur->marie_a ? 'mariée à monsieur ' . $demandeur->marie_a . ',' : '',
                    ]);
                }
                if($n == 1){
                    $modele_odoc->setValues([
                        'ET#' .$n => 'ET - ',
                    ]);
                }else{
                    $modele_odoc->setValues([
                        'ET#' . $n => null,
                    ]);
                }
            }
            $modele_odoc->setValues([
                'ContenanceFormatLettre' => $contenanceFormatLettre,
                'ContenanceFormat' => $contenanceFormat,
                'Prix' => $prixLettre,
                'PrixTotal' => number_format($prixTotal, 0,',','.'),
                'TotalLettre' => $totalLettre,
                'PrixCarre' => number_format($prix, 0,',', '.'),
                'Situation' => $propriete->situation,
                'Fokotany' => $dossier->fokontany,
                'Tcommune' => $dossier->type_commune,
                'Commune' => $dossier->commune,
                'Propriete_mere' => Str::upper($propriete->propriete_mere),
                'Titre_mere' => $propriete->titre_mere,
                'Titre' => $propriete->titre,
                'Date_descente' => $dateDescente,
                'Requisition' => $dateRequisition,
                'Inscription' => $dateInscription,
                'Dep_vol' => $propriete->dep_vol,

                'Proprietaire' => Str::upper($propriete->proprietaire),
                'Province' => $place->nom_province,
                'Region' => $place->nom_region,
                'District' => $place->nom_district,
                'DISTRICT' => Str::upper($place->nom_district),
                'D_dis' => in_array($firstLetterDistrict, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'D' : 'DE',
                'd_dis' => in_array($firstLetterDistrict, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'd' : 'de',
                'd_com' => in_array($firstLetterCommune, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'd' : 'de',
            ]);

            $fileName = 'ACTE_DE_VENTE_' . $demandeur->nom_demandeur . '_consort_' . '.docx';

            $modele_odoc->saveAs(storage_path('app/public/modele_odoc/avec_consort/documents/' .$fileName));

            return response()->download(storage_path('app/public/modele_odoc/avec_consort/documents/' . $fileName));

        }
    }

    public function downloadCSF($id)
    {
        $demande = Demander::where('id', $id)->first();

        //requête pour la séléction du demandeur (principale)
        $demandeur = DB::table('demandeurs')
            ->select('demandeurs.*')
            ->where('id', $demande['id_demandeur'])
            ->first();

        //requête pour la séléction de la propriété
        $propriete = DB::table('proprietes')
            ->select('proprietes.*')
            ->where('id', $demande['id_propriete'])
            ->first();
        $proprietes = (array) $propriete;

        //requête pour la séléction du dossier
        $dossier = DB::table('dossiers')
            ->select('dossiers.*')
            ->where('id', $propriete->id_dossier)
            ->first();

        //requête pour la séléction du nom Province et du Region
        $place = DB::table('dossiers')
            ->join('districts', 'districts.id', '=', 'dossiers.id_district')
            ->join('regions', 'regions.id', '=', 'districts.id_region')
            ->join('provinces', 'provinces.id', '=', 'regions.id_province')
            ->where('dossiers.id', $dossier->id)
            ->select('provinces.nom_province', 'regions.nom_region', 'districts.nom_district')
            ->first();

        $firstLetterDistrict = strtolower(mb_substr($place->nom_district, 0, 1));

        $modele_csf = new TemplateProcessor(storage_path('app/public/modele_odoc/document_CSF/Certificat_situation_financiere.docx'));

        $modele_csf->setValues([
            'Titre_long' => $demandeur->titre_demandeur,
            'Nom' => $demandeur->nom_demandeur,
            'Prenom' => $demandeur->prenom_demandeur,

            'D_dis' => in_array($firstLetterDistrict, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'D' : 'DE',
            'Numero_FN' => $propriete->numero_FN,
            'DISTRICT' => Str::upper($place->nom_district),
            'Province' => $place->nom_province,
        ]);

        $fileName = 'CSF_' . $dossier->nom_dossier . '_TN' . $propriete->titre . '.docx';

        $modele_csf->saveAs(storage_path('app/public/modele_odoc/document_CSF/documents/' .$fileName));
        UserCSF::create([
            'id_user' => Auth::user()->getAuthIdentifier(),
            'id_demande' => $demande->id,
        ]);

        return response()->download(storage_path('app/public/modele_odoc/document_CSF/documents/' . $fileName));
    }

}

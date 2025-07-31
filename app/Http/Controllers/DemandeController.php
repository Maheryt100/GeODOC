<?php

namespace App\Http\Controllers;

use App\Models\Consort;
use App\Models\Demander;
use App\Models\Demandeur;
use App\Models\District;
use App\Models\Propriete;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use NumberFormatter;
use PhpOffice\PhpWord\TemplateProcessor;

class DemandeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
        return Inertia::render('documents/create',[
            'proprietes' => Propriete::all(),
            'demandeurs' => Demandeur::all(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //dd($request);

        //validation des données
        $validate = $request->validate([
            'propriete_id' => 'required|exists:proprietes,id',
            'demandeur_id' => 'required|exists:demandeurs,id',
            'consort' => 'array|nullable',
            'consort.*' => 'exists:demandeurs,id',
        ]);
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

        $type = $propriete->type;

        //requête pour la récuperation du prix par district
        $prixDistrict = DB::table("districts")
            ->join('proprietes', 'districts.id', '=', 'proprietes.id_district')
            ->select("districts.$nature")
            ->where('proprietes.id', $validate['propriete_id'])
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
                'status_consort' => $validate['consort'] != null ? true : false,
            ]);
            if ($validate['consort'] != null){
                //parcours le tableau et insert un consort à un demandeur principale et verifie si le consort existe déjà
                foreach ($validate['consort'] as $id_consort) {
                    $exists = Consort::where('id_demandeur', $validate['demandeur_id'])
                        ->where('id_consort', $id_consort)
                        ->exists();

                    if (!$exists) {
                        Consort::create([
                            'id_demandeur' => $validate['demandeur_id'],
                            'id_consort' => $id_consort,
                        ]);
                    }
                }
            }
            return Inertia::location(route('download.doc', $document->id));

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
        $nature = $propriete->nature;

        $type = $propriete->type;

        //requête pour la récuperation du prix par district
        $prixDistrict = DB::table("districts")
            ->join('proprietes', 'districts.id', '=', 'proprietes.id_district')
            ->select("districts.$nature")
            ->where('proprietes.id', $demande['id_propriete'])
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
        /** !!!!  IMPORTANT !!!!
         *
         * séléction approfondie pour la séléction du fichier à générer
         *
         * */

        if ($demande['status_consort'] == false) {
            //condition si le type est morcellement.
            if ($type == 'morcellement') {
                $modele_odoc = new TemplateProcessor(storage_path('app/public/modele_odoc/sans_consort/morcellement.docx'));

            }elseif ($type == 'immatriculation') { //si le type est Immatriculation
                $modele_odoc = new TemplateProcessor(storage_path('app/public/modele_odoc/sans_consort/immatriculation.docx'));
            }

            $dateNaissance = Carbon::parse($demandeur->date_naissance)->translatedFormat('d F Y');
            $dateMariage = $demandeur->date_mariage ? Carbon::parse($demandeur->date_mariage)->translatedFormat('d F Y') : '';
            $dateDelivrance = Carbon::parse($demandeur->date_delivrance)->translatedFormat('d F Y');
            $dateDelivranceDuplicata = Carbon::parse($demandeur->date_delivrance_duplicata)->translatedFormat('d F Y');

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
                'Fokotany' => $propriete->quartier,
                'Commune' => $propriete->commune,
                'Proprietaire' => Str::upper($propriete->proprietaire),
            ]);

            if ($demandeur->sexe == 'Homme'){
                $modele_odoc->setValues([
                    'EnfantDe' => 'fils',
                    'Demandeur' => 'demandeur',
                    'Marie_a' => $demandeur->marie_a ? 'marié à la dame ' . $demandeur->marie_a . ',' : '',
                ]);
            }elseif ($demandeur->sexe == 'Femme'){
                $modele_odoc->setValues([
                    'EnfantDe' => 'fille',
                    'Demandeur' => 'demanderesse',
                    'Marie_a' => $demandeur->marie_a ? 'mariée à monsieur ' . $demandeur->marie_a . ',' : '',
                ]);
            }

            $fileName = 'ACTE_DE_VENTE_' . $demandeur->nom_demandeur . '_' . $demandeur->prenom_demandeur . '_' .'.docx';

            $modele_odoc->saveAs(storage_path('app/public/modele_odoc/sans_consort/documents/' .$fileName));

            return response()->download(storage_path('app/public/modele_odoc/sans_consort/documents/' . $fileName));
        }else{

            //condition si le type est morcellement.
            if ($type == 'morcellement') {

            }elseif ($type == 'immatriculation') { //si le type est Immatriculation

            }
        }
        return response()->download();
    }

}

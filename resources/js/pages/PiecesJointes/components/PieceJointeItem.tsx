// components/PieceJointeItem.tsx
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Image, FileText, File, MoreVertical, Eye, Download, CheckCircle, Trash2 } from 'lucide-react';
import type { PieceJointe } from '@/pages/PiecesJointes/pieces-jointes';
import { CATEGORIES } from '@/pages/PiecesJointes/pieces-jointes';

interface PieceJointeItemProps {
    piece: PieceJointe;
    canVerify?: boolean;
    canDelete?: boolean;
    onPreview: (url: string) => void;
    onVerify: (id: number) => void;
    onDelete: (id: number) => void;
}

export default function PieceJointeItem({
    piece,
    canVerify = false,
    canDelete = true,
    onPreview,
    onVerify,
    onDelete
}: PieceJointeItemProps) {
    const getFileIcon = () => {
        if (piece.is_image) return <Image className="h-5 w-5 text-green-600 dark:text-green-400" />;
        if (piece.is_pdf) return <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />;
        return <File className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    };

    return (
        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition cursor-pointer group">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {getFileIcon()}
                <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{piece.nom_original}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span>{piece.taille_formatee}</span>
                        {piece.type_document && (
                            <Badge variant="outline" className="text-xs">
                                {piece.type_document}
                            </Badge>
                        )}
                        <Badge className={`text-xs ${CATEGORIES[piece.categorie]?.color || ''}`}>
                            {piece.categorie_label}
                        </Badge>
                        {piece.is_verified && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Vérifié
                            </Badge>
                        )}
                    </div>
                    {piece.description && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{piece.description}</p>
                    )}
                </div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {(piece.is_image || piece.is_pdf) && (
                        <DropdownMenuItem onClick={() => onPreview(piece.view_url)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualiser
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                        <a href={piece.url} download>
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger
                        </a>
                    </DropdownMenuItem>
                    {canVerify && !piece.is_verified && (
                        <DropdownMenuItem onClick={() => onVerify(piece.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Vérifier
                        </DropdownMenuItem>
                    )}
                    {canDelete && (
                        <DropdownMenuItem 
                            className="text-red-600 dark:text-red-400"
                            onClick={() => onDelete(piece.id)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
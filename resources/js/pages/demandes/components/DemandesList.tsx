// pages/demandes/components/DemandesList.tsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import DemandeCard from './DemandeCard';

interface DemandesListProps {
    documents: Array<{
        id: number;
        id_propriete: number;
        propriete: any;
        demandeurs: any[];
        total_prix: number;
        status: string;
        status_consort: boolean;
        nombre_demandeurs: number;
    }>;
    search: string;
    filterStatus: 'all' | 'active' | 'archive';
    onArchive: (doc: any) => void;
    onUnarchive: (doc: any) => void;
    onSelectDemande: (doc: any) => void;
}

export default function DemandesList({
    documents,
    search,
    filterStatus,
    onArchive,
    onUnarchive,
    onSelectDemande
}: DemandesListProps) {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const toggleExpand = (id: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    if (documents.length === 0) {
        return (
            <Card className="shadow-sm">
                <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground text-lg">
                        {search || filterStatus !== 'all' 
                            ? 'Aucune demande ne correspond aux filtres'
                            : 'Aucune demande enregistrée'
                        }
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {documents.map((doc) => (
                <DemandeCard
                    key={doc.id}
                    doc={doc}
                    isExpanded={expandedRows.has(doc.id)}
                    onToggleExpand={toggleExpand}
                    onArchive={onArchive}
                    onUnarchive={onUnarchive}
                    onSelectDemande={onSelectDemande}
                />
            ))}
        </div>
    );
}
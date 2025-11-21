// this is components/AttachmentsSection.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload } from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import FilesList from '@/components/FilesList';

interface AttachmentsSectionProps {
    attachableType: 'Dossier' | 'Demandeur' | 'Propriete';
    attachableId: number;
    title?: string;
    typeDocument?: string;
    canUpload?: boolean;
    canDelete?: boolean;
    canVerify?: boolean;
    initialCount?: number;
}

export default function AttachmentsSection({
    attachableType,
    attachableId,
    title = 'Pièces Jointes',
    typeDocument,
    canUpload = true,
    canDelete = false,
    canVerify = false,
    initialCount = 0
}: AttachmentsSectionProps) {
    const [filesCount, setFilesCount] = useState(initialCount);
    const [activeTab, setActiveTab] = useState<'list' | 'upload'>('list');

    const handleUploadComplete = () => {
        setFilesCount(prev => prev + 1);
        setActiveTab('list');
    };

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {title}
                        {filesCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {filesCount}
                            </Badge>
                        )}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'upload')}>
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="list" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Documents ({filesCount})
                        </TabsTrigger>
                        {canUpload && (
                            <TabsTrigger value="upload" className="flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                Ajouter
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="list" className="mt-0">
                        <FilesList
                            attachableType={attachableType}
                            attachableId={attachableId}
                            canDelete={canDelete}
                            canVerify={canVerify}
                        />
                    </TabsContent>

                    {canUpload && (
                        <TabsContent value="upload" className="mt-0">
                            <FileUploader
                                attachableType={attachableType}
                                attachableId={attachableId}
                                typeDocument={typeDocument}
                                onUploadComplete={handleUploadComplete}
                            />
                        </TabsContent>
                    )}
                </Tabs>
            </CardContent>
        </Card>
    );
}
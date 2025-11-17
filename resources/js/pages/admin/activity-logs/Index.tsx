import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Activity,
    Download,
    FileText,
    Filter,
    Search,
    X,
    Calendar,
    User
} from 'lucide-react';

interface ActivityLog {
    id: number;
    user: { id: number; name: string; email: string };
    district: { id: number; nom_district: string } | null;
    action: string;
    action_label: string;
    entity_type: string;
    entity_label: string;
    document_type: string | null;
    description: string;
    metadata: any;
    created_at: string;
    ip_address: string;
}

interface Stats {
    total_actions: number;
    total_documents: number;
    today_actions: number;
    week_actions: number;
    month_actions: number;
    by_action: Record<string, number>;
    by_entity: Record<string, number>;
}

interface Props {
    logs: {
        data: ActivityLog[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        user_id?: string;
        action?: string;
        document_type?: string;
        date_from?: string;
        date_to?: string;
        search?: string;
    };
    stats: Stats;
    users: Array<{ id: number; name: string; email: string }>;
    actions: Record<string, string>;
    documentTypes: Record<string, string>;
}

export default function Index({ logs, filters, stats, users, actions, documentTypes }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedUser, setSelectedUser] = useState(filters.user_id || 'all');
    const [selectedAction, setSelectedAction] = useState(filters.action || 'all');
    const [selectedDocType, setSelectedDocType] = useState(filters.document_type || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = () => {
        const params: Record<string, string> = {};
        
        if (search.trim()) params.search = search.trim();
        if (selectedUser && selectedUser !== 'all') params.user_id = selectedUser;
        if (selectedAction && selectedAction !== 'all') params.action = selectedAction;
        if (selectedDocType && selectedDocType !== 'all') params.document_type = selectedDocType;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        
        router.get('/admin/activity-logs', params, { 
            preserveState: true,
            preserveScroll: true 
        });
    };

    const clearFilters = () => {
        setSearch('');
        setSelectedUser('all');
        setSelectedAction('all');
        setSelectedDocType('all');
        setDateFrom('');
        setDateTo('');
        router.get('/admin/activity-logs');
    };

    const hasActiveFilters = search || 
        (selectedUser && selectedUser !== 'all') || 
        (selectedAction && selectedAction !== 'all') || 
        (selectedDocType && selectedDocType !== 'all') || 
        dateFrom || 
        dateTo;

    const getActionBadge = (action: string) => {
        const colors: Record<string, string> = {
            generate: 'bg-blue-500',
            download: 'bg-green-500',
            create: 'bg-purple-500',
            update: 'bg-yellow-500',
            delete: 'bg-red-500',
            login: 'bg-gray-500',
            logout: 'bg-gray-400',
            archive: 'bg-orange-500',
            unarchive: 'bg-indigo-500',
            export: 'bg-teal-500',
        };
        return (
            <Badge className={colors[action] || 'bg-gray-500'}>
                {actions[action] || action}
            </Badge>
        );
    };

    const formatMetadata = (metadata: any) => {
        if (!metadata) return 'N/A';
        
        const keys = ['lot', 'numero_recu', 'montant', 'demandeurs_count'];
        const parts = [];
        
        for (const key of keys) {
            if (metadata[key]) {
                parts.push(`${key}: ${metadata[key]}`);
            }
        }
        
        return parts.join(' | ') || 'N/A';
    };

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Logs d\'activité', href: '' },
            ]}
        >
            <Head title="Logs d'activité" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Logs d'Activité</h1>
                        <p className="text-muted-foreground mt-1">
                            Suivi complet des actions effectuées dans le système
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/activity-logs/document-stats">
                            <Button variant="outline">
                                <FileText className="mr-2 h-4 w-4" />
                                Stats Documents
                            </Button>
                        </Link>
                        <Button 
                            variant="outline"
                            onClick={() => router.get('/admin/activity-logs/export', filters)}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Exporter CSV
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_actions}</div>
                            <p className="text-xs text-muted-foreground">Actions totales</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
                            <Calendar className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.today_actions}</div>
                            <p className="text-xs text-muted-foreground">Actions du jour</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Cette semaine</CardTitle>
                            <Calendar className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.week_actions}</div>
                            <p className="text-xs text-muted-foreground">7 derniers jours</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
                            <Calendar className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.month_actions}</div>
                            <p className="text-xs text-muted-foreground">Mois en cours</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Documents</CardTitle>
                            <FileText className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_documents}</div>
                            <p className="text-xs text-muted-foreground">Documents générés/téléchargés</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtres */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtres
                        </CardTitle>
                        <CardDescription>
                            Filtrer les logs d'activité par différents critères
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {/* Recherche */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Recherche</label>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Rechercher..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                {/* Utilisateur */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Utilisateur</label>
                                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tous les utilisateurs" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tous les utilisateurs</SelectItem>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Action */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Action</label>
                                    <Select value={selectedAction} onValueChange={setSelectedAction}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Toutes les actions" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Toutes les actions</SelectItem>
                                            {Object.entries(actions).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Type de document */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Type de document</label>
                                    <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tous les types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tous les types</SelectItem>
                                            {Object.entries(documentTypes).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Date début */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Date début</label>
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>

                                {/* Date fin */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Date fin</label>
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Boutons */}
                            <div className="flex justify-end gap-2">
                                {hasActiveFilters && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={clearFilters}
                                        size="sm"
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Réinitialiser
                                    </Button>
                                )}
                                <Button onClick={handleFilter} size="sm">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filtrer
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table des logs */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Historique des activités ({logs.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b">
                                    <tr>
                                        <th className="text-left p-3 font-medium">Date/Heure</th>
                                        <th className="text-left p-3 font-medium">Utilisateur</th>
                                        <th className="text-left p-3 font-medium">Action</th>
                                        <th className="text-left p-3 font-medium">Description</th>
                                        <th className="text-left p-3 font-medium">District</th>
                                        <th className="text-left p-3 font-medium">Détails</th>
                                        <th className="text-left p-3 font-medium">IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-8">
                                                <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                                                <p className="text-muted-foreground">
                                                    Aucune activité trouvée
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.data.map((log) => (
                                            <tr key={log.id} className="border-b hover:bg-muted/50">
                                                <td className="p-3 text-xs">
                                                    {new Date(log.created_at).toLocaleString('fr-FR')}
                                                </td>
                                                <td className="p-3">
                                                    <Link 
                                                        href={`/admin/activity-logs/user/${log.user.id}`}
                                                        className="flex items-center gap-1.5 hover:underline"
                                                    >
                                                        <User className="h-3.5 w-3.5" />
                                                        <span className="font-medium">{log.user.name}</span>
                                                    </Link>
                                                </td>
                                                <td className="p-3">
                                                    {getActionBadge(log.action)}
                                                </td>
                                                <td className="p-3">
                                                    {log.description}
                                                </td>
                                                <td className="p-3 text-sm text-muted-foreground">
                                                    {log.district?.nom_district || 'N/A'}
                                                </td>
                                                <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">
                                                    {formatMetadata(log.metadata)}
                                                </td>
                                                <td className="p-3 text-xs text-muted-foreground">
                                                    {log.ip_address}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {logs.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Page {logs.current_page} sur {logs.last_page}
                                </p>
                                <div className="flex gap-2">
                                    {logs.current_page > 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.get(`/admin/activity-logs?page=${logs.current_page - 1}`, filters)}
                                        >
                                            Précédent
                                        </Button>
                                    )}
                                    {logs.current_page < logs.last_page && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.get(`/admin/activity-logs?page=${logs.current_page + 1}`, filters)}
                                        >
                                            Suivant
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppSidebarLayout>
    );
}
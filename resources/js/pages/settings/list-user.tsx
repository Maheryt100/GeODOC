import type { BreadcrumbItem, Paginated, User } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import AppLayout from '@/layouts/app-layout';
import React, { FormEventHandler } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem, PaginationLink, PaginationNext,
    PaginationPrevious
} from '@/components/ui/pagination';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { Check, Key, Trash } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Liste des Utilisateurs',
        href: '/settings/ListUser',
    },
];

type ResetPasswordForm = {
    email: string;
    password: string;
    password_confirmation: string;
};
export default function ListUser(){
    const { users } = usePage<{ users: Paginated<User>}>().props;
    const { data, setData, post, processing, errors, reset } = useForm<Required<ResetPasswordForm>>({
        email: '',
        password: '',
        password_confirmation: '',
    });
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.admin-store-admin'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('êtes-vous sure de vouloir ?')) {
            // Perform the delete action here, e.g., send a request to the server
            console.log(`User with ID ${id} deleted.`);
        }
    }
    function handleOpenDialog(email: string) {
        setData('email', email);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />
            <Toaster position={'top-right'}/>
            <SettingsLayout>
                <div className="space-y-12">
                    <HeadingSmall title="Liste des utilisateur" description="Changer le mot de passe ou supprimer un utilisateur" />
                    <Table>
                        <TableCaption>
                            <Pagination>
                                <PaginationContent>
                                    {users.links.map((link, index: number) => {
                                        const isPrevious = link.label.includes('Previous') || link.label.includes('&laquo;');
                                        const isNext = link.label.includes('Next') || link.label.includes('&raquo;');
                                        const isEllipsis = link.label === '...';

                                        if (isEllipsis) {
                                            return (
                                                <PaginationItem key={index}>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            );
                                        }

                                        if (!link.url) {
                                            return (
                                                <PaginationItem key={index}>
                                                        <span className="px-3 py-1 text-muted-foreground cursor-not-allowed">
                                                          {link.label.replace(/&laquo;|&raquo;/g, '')}
                                                        </span>
                                                </PaginationItem>
                                            );
                                        }

                                        if (isPrevious) {
                                            return (
                                                <PaginationItem key={index}>
                                                    <PaginationPrevious href={link.url} />
                                                </PaginationItem>
                                            );
                                        }

                                        if (isNext) {
                                            return (
                                                <PaginationItem key={index}>
                                                    <PaginationNext href={link.url} />
                                                </PaginationItem>
                                            );
                                        }

                                        return (
                                            <PaginationItem key={index}>
                                                <PaginationLink
                                                    href={link.url}
                                                    isActive={link.active}
                                                    dangerouslySetInnerHTML={{ __html: link.label ?? '' }}
                                                />
                                            </PaginationItem>
                                        );
                                    })}
                                </PaginationContent>
                            </Pagination>
                        </TableCaption>
                        <TableCaption>Liste des utilisateurs</TableCaption>
                        <TableHeader className={'w-[100px]'}>
                            <TableRow>
                                <TableHead className={'text-center'}>Nom</TableHead>
                                <TableHead className={'text-center'}>email</TableHead>
                                <TableHead className={'text-center'}>Rôle</TableHead>
                                <TableHead className={'text-center'}>status</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className={'text-center'}>{user.name}</TableCell>
                                    <TableCell className={'text-center'}>{user.email}</TableCell>
                                    <TableCell className={'text-center'}>{user.role == 'admin' ? 'Administrateur' : 'Utilisateur'}</TableCell>
                                    <TableCell className={'text-center'}>{user.status ? 'active' : 'désactivé'}</TableCell>
                                    {user.role == 'user' && (
                                        <TableCell className={'flex'}>
                                            <Dialog>
                                                <form onSubmit={submit}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="link" onClick={() => handleOpenDialog(user.email)}>
                                                            <Key/>
                                                            reset
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[425px]">
                                                        <DialogHeader>
                                                            <DialogTitle>changer de Mot de passe</DialogTitle>
                                                            <DialogDescription>
                                                                Cette action n'a pas de retour. Assurez-vous que l'utilisateur souhaite changer de mot de passe ou
                                                                que le mot de passe est oublié
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-4">
                                                            <div className="grid gap-3">
                                                                <Label htmlFor="name">email</Label>
                                                                <Input
                                                                    id="email"
                                                                    type="email"
                                                                    name="email"
                                                                    value={data.email}
                                                                    readOnly
                                                                    className="mt-1 block w-full"
                                                                    placeholder="email"

                                                                />
                                                            </div>
                                                            <div className="grid gap-3">
                                                                <Label htmlFor="password">Nouveau Mot de passe</Label>
                                                                <Input
                                                                    id="password"
                                                                    type="password"
                                                                    name="password"
                                                                    autoComplete="new-password"
                                                                    className="mt-1 block w-full"
                                                                    autoFocus
                                                                    value={data.password}
                                                                    placeholder="Password"
                                                                    onChange={(e) => setData('password', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="grid gap-3">
                                                                <Label htmlFor="password_confirmation">Confirmer leMot de passe</Label>
                                                                <Input
                                                                    id="password_confirmation"
                                                                    type="password"
                                                                    name="password_confirmation"
                                                                    autoComplete="new-password"
                                                                    value={data.password_confirmation}
                                                                    className="mt-1 block w-full"
                                                                    placeholder="Confirm password"
                                                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <DialogClose asChild>
                                                                <Button variant="outline">Cancel</Button>
                                                            </DialogClose>
                                                            <Button type="submit" onClick={submit}>Save changes</Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </form>
                                            </Dialog>
                                            { user.status == true && (
                                                <Button variant="link">
                                                    <Trash className="text-red-600"/>
                                                    Supprimer
                                                </Button>
                                            )}
                                            { user.status == false && (
                                                <Button variant="link">
                                                    <Check />
                                                    activer
                                                </Button>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </SettingsLayout>
        </AppLayout>
    )
}

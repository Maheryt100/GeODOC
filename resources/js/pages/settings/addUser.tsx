import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import React, { FormEventHandler, useEffect } from 'react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Manage Users',
        href: '/settings/manageUser',
    },
];

type RegisterForm = {
    name: string;
    email: string;
    role: string;
    password: string;
    password_confirmation: string;
};

export default function ManageUser() {
    const { flash } = usePage<SharedData>().props;

    const { data, setData, post, processing, errors, reset } = useForm<Required<RegisterForm>>({
        name: '',
        email: '',
        role: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(()=>{
        if (flash.message != null){
            toast.info(flash.message);
        }
    },[flash.message]);
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('users.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />
            <Toaster position={'top-right'}/>
            <SettingsLayout>
                <div className="space-y-8">
            <HeadingSmall title="Ajouter un utilisateur" description="Choisissez le rôle et completez les informations" />

                    <form className="flex flex-col gap-6" onSubmit={submit}>
                        <div className="grid gap-6">
                            <Label>Rôle</Label>
                            <div className="grid gap-2">
                                <Select onValueChange={(e) => setData('role', e)} required >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Rôle de l'utilisateur" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="user">User</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Nom</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    disabled={processing}
                                    placeholder="Full name"
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    disabled={processing}
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Mot de passe</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    disabled={processing}
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirmer le Mot de passe</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    disabled={processing}
                                    placeholder="Confirm password"
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <Button type="submit" className="mt-2 w-full" tabIndex={5} disabled={processing}>
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                Create account
                            </Button>
                        </div>
                    </form>
                </div>

            </SettingsLayout>
        </AppLayout>
    );
}

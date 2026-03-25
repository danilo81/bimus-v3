"use client";

import { useState } from 'react';
import { useAuth } from '../../../hooks/use-auth';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import Link from 'next/link';
import { UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { register as registerAction } from '../actions';
import { User } from '../../../lib/types';
import Image from 'next/image';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login: authLogin } = useAuth();
    const { toast } = useToast();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Validación básica de complejidad de contraseña en el cliente
        const hasLowercase = /[a-z]/.test(password);
        const hasUppercase = /[A-Z]/.test(password);
        const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

        if (!hasLowercase || !hasUppercase || !hasSpecialChar) {
            setIsLoading(false);
            toast({
                title: "Contraseña no válida",
                description: "La contraseña debe contener al menos una letra minúscula, una mayúscula y un carácter especial.",
                variant: "destructive",
            });
            return;
        }

        const result = await registerAction({ name, email, password });

        setIsLoading(false);

        if (result.success) {
            authLogin(result.user as User);
            toast({
                title: "¡Cuenta Creada!",
                description: "Bienvenido a Bimus.",
            });
        } else if ('error' in result) {
            toast({
                title: "Fallo en el registro",
                description: result.error,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-10rem)] px-4 py-12">
            <Card className="w-full max-w-md border-none shadow-none bg-transparent">
                <CardHeader className="space-y-4 text-center">
                    <div className="flex justify-center">
                        <div>
                            <Image src="/Grupo.svg" alt="Logo" width={100} height={100} />
                        </div>
                    </div>
                    <div className='flex flex-col items-center justify-center'>
                    <div className='flex flex-col items-center justify-center  bg-card w-fit'>
                        <CardTitle className="text-2xl font-headline font-bold bg-card w-fit">Crear una cuenta</CardTitle>
                        <CardDescription className="text-center bg-card w-fit">
                            Ingresa tus datos para empezar
                        </CardDescription>
                    </div>
                    </div>
                </CardHeader>
                <form onSubmit={handleRegister}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className='bg-card w-fit'>Nombre completo</Label>
                            <div className='bg-card'>
                                <Input
                                    id="name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isLoading}

                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email" className='bg-card w-fit'>Correo electrónico</Label>
                            <div className='bg-card'>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password" className='bg-card w-fit'>Contraseña</Label>
                            <div className="relative bg-card">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}

                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="w-full  h-px bg-linear-to-r from-transparent via-accent to-transparent"></div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 p-6">
                        <Button className="w-full bg-primary cursor-pointer" type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            Crear Cuenta
                        </Button>
                        <div className="text-center text-sm bg-card w-fit">
                            ¿Ya tienes una cuenta?{" "}
                            <Link href="/login" className="text-primary hover:underline underline-offset-4">
                                Inicia sesión
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

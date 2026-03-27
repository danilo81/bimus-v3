"use client";

import { useState } from 'react';
import { useAuth } from '../../../hooks/use-auth';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../../components/ui/card';
import Link from 'next/link';
import { LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { login as loginAction } from '@/actions';
import { User } from '../../../lib/types';
import Image from 'next/image';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login: authLogin } = useAuth();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await loginAction({ email, password });

        setIsLoading(false);

        if (result.success) {
            authLogin(result.user as User);
            toast({
                title: "¡Bienvenido de vuelta!",
                description: `Has iniciado sesión como ${result.user.role}`,
            });
        } else if ('error' in result) {
            toast({
                title: "Fallo en el inicio de sesión",
                description: result.error,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-10rem)] px-4 py-12">
            <Card className="w-full max-w-md border-none shadow-none sm:mx-auto bg-transparent">
                <CardHeader className="space-y-4 text-center">
                    <div className="flex justify-center">
                        <div>
                            <Image src="/Grupo.svg" alt="Logo" width={100} height={100} />
                        </div>
                    </div>
                    <div className='flex flex-col items-center justify-center'>
                        <div className='flex flex-col items-center justify-center  bg-card w-fit'>
                            <CardTitle className="text-2xl font-headline font-bold bg-card ">Iniciar Sesión</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2 ">
                            <Label htmlFor="email" className='bg-card h-5 w-fit'>Correo</Label>
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
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className='bg-card h-5 w-fit'>Contraseña</Label>
                                <Link href="/forgot-password" tabIndex={-1} className="text-xs text-primary hover:underline underline-offset-4 bg-card h-5 w-fit">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
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
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                            Iniciar Sesión
                        </Button>
                        <div className='bg-card w-full'>
                            <Button type='button' className="w-full bg-card border-accent cursor-pointer" variant="outline" disabled={isLoading}>Google</Button>
                        </div>
                        <div className="text-center text-sm bg-card h-5 w-fit">
                            ¿No tienes una cuenta?{" "}
                            <Link href="/register" className="text-primary hover:underline underline-offset-4">
                                Regístrate
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
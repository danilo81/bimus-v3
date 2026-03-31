"use client";

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import Image from 'next/image';
import Logo from '@/components/logo';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const { toast } = useToast();

    const handleResetRequest = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would trigger a Firebase Auth password reset email
        console.log('Password reset requested for:', email);
        toast({
            title: "Enlace de recuperación enviado",
            description: "Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.",
        });
    };

    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-10rem)] px-4 py-12">
            <Card className="w-full max-w-md border-none shadow-none bg-transparent">
                <CardHeader className="space-y-4 text-center">
                    <div className="flex justify-center">
                        <div>
                            <Logo size={150} className="grayscale" />
                        </div>
                    </div>
                    <div className='flex flex-col items-center justify-center'>
                        <div className='flex flex-col items-center justify-center  bg-card w-fit'>
                            <CardTitle className="text-2xl text-center font-headline font-bold bg-card">Recuperar Contraseña</CardTitle>
                            <CardDescription className="text-center bg-card w-fit">
                                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <form onSubmit={handleResetRequest}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2 ">
                            <Label htmlFor="email" className='bg-card h-5 w-fit'>Correo electrónico</Label>
                            <div className='bg-card'>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-card "
                                />
                            </div>
                        </div>
                        <div className="w-full  h-px bg-linear-to-r from-transparent via-accent to-transparent"></div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 p-6">
                        <Button className="w-full bg-primary cursor-pointer" type="submit">
                            <Mail className="mr-2 h-4 w-4" /> Enviar enlace de recuperación
                        </Button>
                        <div className="text-center text-sm bg-card w-fit">
                            ¿Recordaste tu contraseña?{" "}
                            <Link href="/login" className="text-primary hover:underline underline-offset-4">
                                Iniciar sesión
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

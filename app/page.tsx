"use client";

import { LogIn, Sun, Moon } from 'lucide-react';
import { Button } from '../components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import DotsOnDa from '@/components/ui/dotsdonda';

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className='relative'>
      <div className=" bg-background  w-screen h-screen relative overflow-hidden">
        <div className="h-full w-full relative">
          <DotsOnDa />
        </div>
        <div className=" flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] gap-10 p-6 animate-in fade-in duration-1000">

        </div>

        {/* Central Logo Section */}
        <div className=" absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-60 flex flex-col items-center gap-6">
          <div>
            <Image src="/Grupo.svg" alt="Logo" width={100} height={100} />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter font-headline text-prymary">
              Bim<span className="text-neutral-500">us</span>
            </h1>
            <p className="text-primary uppercase tracking-[0.4em] text-[12px] font-black bg">
              Arquitectura y construcción
            </p>
          </div>
          {/* <div className="w-full max-w-62.5 h-px bg-linear-to-r from-transparent via-white/10 to-transparent"></div> */}

          {/* Primary Action */}
          <div className="flex flex-col items-center gap-4 bg-sto">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-foreground hover:bg-foreground text-background hover:text-background px-12 h-14 font-black uppercase tracking-widest text-xs rounded-xL  hover:scale-105 active:scale-95 transition-all cursor-pointer">
                <LogIn className="mr-3 h-5 w-5 " /> Iniciar Sesión
              </Button>
            </Link>
            <Button
              name='theme-toggle'
              variant="ghost"
              size="icon"
              className="text-primary hover:text-primary h-9 w-9 rounded-xl hover:bg-secondary transition-all mt-4"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AiChatModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'ai', content: '¡Hola! Soy Bimus AI. ¿En qué te puedo ayudar con tus proyectos hoy?' }
    ]);

    const handleSend = () => {
        if (!input.trim()) return;

        const newMessages = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');

        // Aquí iría tu petición real a la API de IA. Simulamos una respuesta:
        setTimeout(() => {
            setMessages([...newMessages, { role: 'ai', content: 'Estoy procesando tu solicitud...' }]);
        }, 1000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary relative h-9 w-9 rounded-xl hover:bg-secondary transition-all cursor-pointer">
                    <Sparkles className="h-4.5 w-4.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] h-[80vh] flex flex-col p-0 bg-card border-accent gap-0 shadow-2xl rounded-2xl overflow-hidden">
                <DialogHeader className="p-4 border-b border-accent bg-secondary/30 flex flex-row items-center gap-3 space-y-0">
                    <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                        <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <DialogTitle className="text-xs font-black uppercase tracking-widest text-primary">Asistente IA</DialogTitle>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4 flex flex-col">
                        {messages.map((msg, i) => (
                            <div key={i} className={cn("flex gap-3 max-w-[85%]", msg.role === 'user' ? "self-end flex-row-reverse" : "self-start")}>
                                <div className={cn("h-8 w-8 shrink-0 rounded-lg flex items-center justify-center border", msg.role === 'user' ? "bg-primary text-background border-primary" : "bg-card text-primary border-accent")}>
                                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>
                                <div className={cn("p-3 text-xs font-bold leading-relaxed", msg.role === 'user' ? "bg-primary text-background rounded-2xl rounded-tr-sm" : "bg-secondary border border-accent text-foreground rounded-2xl rounded-tl-sm")}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-accent bg-card">
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Pregúntale a la IA..."
                            className="h-11 bg-secondary border-accent focus-visible:ring-primary text-xs font-bold"
                        />
                        <Button type="submit" size="icon" className="h-11 w-11 shrink-0 bg-primary text-background hover:bg-primary/80 cursor-pointer rounded-xl">
                            <Send className="h-4 w-4 ml-1" />
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
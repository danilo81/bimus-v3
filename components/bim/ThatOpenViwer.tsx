'use client';

import { useEffect, useRef, useState } from 'react';
import * as OBC from '@thatopen/components';

export function ThatOpenViewer() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;

        // 🚩 BANDERA CLAVE: Evita que promesas huérfanas crasheen el motor
        let isDisposed = false;

        // 1. Instanciar los componentes principales
        // NOTA: 'THREE.Clock' está deprecado en Three.js 0.183.2+.
        // Esta advertencia es interna de '@thatopen/components' (v3.3.3)
        // y no afecta la funcionalidad del visor.
        const components = new OBC.Components();

        // 2. Configurar el "Mundo"
        const worlds = components.get(OBC.Worlds);
        const world = worlds.create<
            OBC.SimpleScene,
            OBC.OrthoPerspectiveCamera,
            OBC.SimpleRenderer
        >();

        world.scene = new OBC.SimpleScene(components);
        world.renderer = new OBC.SimpleRenderer(components, container);
        world.camera = new OBC.OrthoPerspectiveCamera(components);

        components.init();

        world.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);

        const grids = components.get(OBC.Grids);
        grids.create(world);

        // 3. Configurar el Fragment Manager y el cargador de IFC
        const fragments = components.get(OBC.FragmentsManager);
        fragments.init("/fragments.worker.mjs"); // 🚩 IMPORTANTE: Sin esto, arroja "You need to initialize fragments first"

        const fragmentIfcLoader = components.get(OBC.IfcLoader);

        const loadIfcModel = async () => {
            setLoading(true);
            try {
                // 1. Configuramos el motor para que busque en http://localhost:3000/
                fragmentIfcLoader.settings.wasm = {
                    path: "/",
                    absolute: false // <-- IMPORTANTE: false para usar ruta relativa a tu dominio local
                };

                // 2. Forzamos la inicialización y verificamos si falla por los archivos WASM
                try {
                    await fragmentIfcLoader.setup();
                    console.log("✅ Motor WASM de web-ifc inicializado correctamente.");
                } catch (setupError) {
                    console.error("❌ FALLO FATAL DEL WASM: Next.js no encuentra web-ifc.wasm en la carpeta public/.", setupError);
                    throw new Error("El motor no pudo iniciar.");
                }

                if (isDisposed) return;

                // 3. Descargamos el modelo
                const file = await fetch('/modelo.ifc');
                if (!file.ok) throw new Error("Archivo /modelo.ifc no encontrado.");

                const data = await file.arrayBuffer();
                const buffer = new Uint8Array(data);

                if (isDisposed) return;

                // 4. Parsear y añadir a la escena
                console.log("⏳ Parseando geometrías del IFC...");
                const model = await fragmentIfcLoader.load(buffer, true, "modelo");

                if (isDisposed) return;

                world.scene.three.add(model as any);
                console.log("✅ Modelo cargado con éxito.");

            } catch (error) {
                if (!isDisposed) {
                    console.error("Detalle del error al cargar el IFC:", error);
                }
            } finally {
                if (!isDisposed) {
                    setLoading(false);
                }
            }
        };

        loadIfcModel();

        // 4. Limpieza de memoria (Cleanup)
        return () => {
            isDisposed = true; // Avisamos a las promesas que se detengan
            components.dispose(); // Destruimos el motor limpiamente
        };
    }, []);

    return (
        <div className="relative w-full h-full bg-[#050505]">
            <div ref={containerRef} className="absolute inset-0 outline-none" />

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#050505]/80 z-10 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                        <span className="text-white text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                            Procesando Archivo IFC...
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
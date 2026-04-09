import { IFCLoader } from 'web-ifc-three/IFCLoader';

export const ifcLoader = new IFCLoader();

if (typeof window !== 'undefined') {
    ifcLoader.ifcManager.setWasmPath('/');
    ifcLoader.ifcManager.useWebWorkers(true, '/wasm/IFCWorker.js');
}

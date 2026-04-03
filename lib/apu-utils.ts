/**
 * Utility for calculating Analysis of Unit Price (APU) metrics.
 * Centralizing this logic ensures consistency across Construction, Reports, and Dashboard views.
 */

export const calculateAPU = (supplies: any[], config: any) => {
    if (!config) {
        return { 
            totalUnit: 0, 
            matSub: 0, 
            labSub: 0, 
            cSociales: 0, 
            ivaMO: 0, 
            equSub: 0, 
            toolWear: 0, 
            directCost: 0, 
            adm: 0, 
            utility: 0, 
            it: 0 
        };
    }

    const matSub = supplies.filter((s: any) => {
        const typo = s.supply?.typology || s.typology;
        return typo === 'Material' || typo === 'Insumo';
    }).reduce((acc: number, s: any) => acc + (s.quantity * (s.supply?.price || s.price || 0)), 0);

    const labSub = supplies.filter((s: any) => {
        const typo = s.supply?.typology || s.typology;
        return typo === 'Mano de Obra' || typo === 'Honorario';
    }).reduce((acc: number, s: any) => acc + (s.quantity * (s.supply?.price || s.price || 0)), 0);

    const equSub = supplies.filter((s: any) => {
        const typo = s.supply?.typology || s.typology;
        return typo === 'Equipo' || typo === 'Herramienta';
    }).reduce((acc: number, s: any) => acc + (s.quantity * (s.supply?.price || s.price || 0)), 0);

    const cSociales = labSub * (Number(config.socialCharges || 0) / 100);
    const ivaMO = (labSub + cSociales) * (Number(config.iva || 0) / 100);
    const toolWear = labSub * (Number(config.toolWear || 0) / 100);

    const directCost = matSub + labSub + equSub;

    const adm = directCost * (Number(config.adminExpenses || 0) / 100);
    const utility = (directCost + adm) * (Number(config.utility || 0) / 100);
    const it = (directCost + adm + utility) * (Number(config.it || 0) / 100);

    const totalUnit = directCost + adm + utility + it;

    return {
        matSub, 
        labSub, 
        cSociales, 
        ivaMO, 
        equSub, 
        toolWear, 
        directCost, 
        adm, 
        utility, 
        it, 
        totalUnit
    };
};

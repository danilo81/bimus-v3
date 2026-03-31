import * as z from "zod";
/////////////////////////////// USUARIO /////////////////////////////////////////////////////////
export const LoginSchema = z.object({
    email: z.string().email({
        message: "Correo invalido",
    }),
    password: z.string().min(1, {
        message: "password es requerido",
    }),
    code: z.optional(z.string()),
});

export const RegistrarSchema = z.object({
    email: z.string().email({
        message: "Correo invalido",
    }),
    password: z.string().min(6, {
        message: "minimo 6 letras",
    }),
    name: z.string().min(6, {
        message: "nombre es requerido",
    }),
});

export const ResetearSchema = z.object({
    email: z.string().email({
        message: "Correo es requerido",
    }),
});

export const NuevoPasswordSchema = z.object({
    password: z.string().min(6, {
        message: "Minimo 6 caracteres!",
    }),
});
/////////////////////////////// PROYECTO /////////////////////////////////////////////////////////
export const NuevoProyectoSchema = z.object({
    nombre: z.string().max(350, {
        message: "Minimo 250 caracteres!",
    }),
    descripcion: z.string().max(350, {
        message: "Minimo 250 caracteres!",
    }),
    autor: z.string().max(350, {
        message: "Minimo 250 caracteres!",
    }),
    cliente: z.string().max(350, {
        message: "Minimo 250 caracteres!",
    }),
    ubicacion: z.string().max(350, {
        message: "Minimo 250 caracteres!",
    }),
});

/////////////////////////////// INSUMO /////////////////////////////////////////////////////////

export const NuevoInsumoSchema = z.object({
    tipologia: z.string(),
    descripcion: z.string().max(350, {
        message: "Maximo 250 caracteres!",
    }),
    precio: z.coerce
        .number()
        .min(0, { message: "solo numeros" })
        .transform((val) => val.toFixed(2)),
});

export const ActualizarInsumoSchema = z.object({
    id: z.number(),
    estado: z.enum(["ACTIVO", "INACTIVO"]),
    tipologia: z.string(),
    descripcion: z.string().max(350, {
        message: "Maximo 250 caracteres!",
    }),
    precio: z.coerce
        .number()
        .min(0, { message: "solo numeros" })
        .transform((val) => val.toFixed(2)),
    createdAt: z.string().date(),
    updatedAt: z.string().date(),
});
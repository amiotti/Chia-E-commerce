import { z } from "zod";

export const currencyCodeSchema = z.enum(["ARS"]);

export const nonEmptyTrimmedString = z
  .string()
  .trim()
  .min(1, "Campo requerido");

export const optionalStringArraySchema = z.array(nonEmptyTrimmedString).default([]);
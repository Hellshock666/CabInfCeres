/**
 * Modèle de domaine des demandes de rappel – partagé entre le formulaire public et l'espace infirmiers.
 * Volontairement minimal (RGPD / CNIL) : aucune donnée de santé, aucun champ texte libre.
 * Toute modification doit être répercutée dans firestore.rules et functions/src/index.ts.
 */

export const CALLBACK_COLLECTION = "callbackRequests";
export const RETENTION_DAYS = 14;

export const CARE_TYPES = [
  { value: "domicile", label: "Soins à domicile (Reims et environs)" },
  { value: "cabinet", label: "Soin au cabinet" },
  { value: "rappel", label: "Demande de rappel / Renseignement général" },
] as const;

export const TIME_SLOTS = [
  { value: "matin", label: "Matin" },
  { value: "apres-midi", label: "Après-midi" },
] as const;

export type CareType = (typeof CARE_TYPES)[number]["value"];
export type TimeSlot = (typeof TIME_SLOTS)[number]["value"];
export type RequestStatus = "pending" | "processed";

export interface CallbackRequestInput {
  fullName: string;
  phone: string;
  careType: CareType;
  timeSlot: TimeSlot;
}

export interface CallbackRequest extends CallbackRequestInput {
  id: string;
  status: RequestStatus;
  createdAt: Date | null;
  processedAt: Date | null;
}

export type FieldErrors = Partial<Record<keyof CallbackRequestInput, string>>;

export type ValidationResult =
  | { ok: true; data: CallbackRequestInput }
  | { ok: false; errors: FieldErrors };

const NAME_PATTERN = /^[\p{L}][\p{L}' .-]*[\p{L}.]$/u;

export function labelForCareType(value: string): string {
  return CARE_TYPES.find((c) => c.value === value)?.label ?? value;
}

export function labelForTimeSlot(value: string): string {
  return TIME_SLOTS.find((t) => t.value === value)?.label ?? value;
}

/** Normalise un numéro français vers le format national à 10 chiffres (ex. 0612345678). */
export function normalizeFrenchPhone(raw: string): string | null {
  const compact = raw.replace(/[\s.\-()]/g, "");
  const national = compact.replace(/^(?:\+33|0033)/, "0");
  return /^0[1-9]\d{8}$/.test(national) ? national : null;
}

/** Formate 0612345678 en « 06 12 34 56 78 ». */
export function formatFrenchPhone(national: string): string {
  return national.replace(/(\d{2})(?=\d)/g, "$1 ");
}

export function validateCallbackInput(raw: Record<string, unknown>): ValidationResult {
  const errors: FieldErrors = {};

  const fullName = String(raw.fullName ?? "").trim().replace(/\s+/g, " ");
  if (fullName.length < 2 || fullName.length > 80 || !NAME_PATTERN.test(fullName)) {
    errors.fullName = "Merci d'indiquer votre nom et prénom.";
  }

  const phone = normalizeFrenchPhone(String(raw.phone ?? ""));
  if (!phone) {
    errors.phone = "Merci d'indiquer un numéro de téléphone français valide.";
  }

  const careType = String(raw.careType ?? "");
  if (!CARE_TYPES.some((c) => c.value === careType)) {
    errors.careType = "Merci de choisir un type de prise en charge.";
  }

  const timeSlot = String(raw.timeSlot ?? "");
  if (!TIME_SLOTS.some((t) => t.value === timeSlot)) {
    errors.timeSlot = "Merci de choisir un créneau.";
  }

  if (Object.keys(errors).length > 0 || !phone) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      fullName,
      phone,
      careType: careType as CareType,
      timeSlot: timeSlot as TimeSlot,
    },
  };
}

/** Date de suppression automatique d'une demande. */
export function purgeDateFor(createdAt: Date): Date {
  return new Date(createdAt.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

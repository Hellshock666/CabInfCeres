"use client";

import { useRef, useState, type FormEvent } from "react";
import { site, telHref } from "@/config/site";
import {
  CARE_TYPES,
  TIME_SLOTS,
  validateCallbackInput,
  type FieldErrors,
} from "@/lib/callback-requests";
import { Icon } from "@/components/ui/Icon";

type Status = "idle" | "submitting" | "success" | "error";

/** Délai minimal (ms) entre l'affichage et l'envoi : filtre les robots les plus simples. */
const MIN_FILL_TIME_MS = 2500;

const inputBase =
  "block w-full rounded-xl border bg-white px-4 py-3 text-base text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none";

export function CallbackForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const mountedAt = useRef<number | null>(null);

  const markStarted = () => {
    mountedAt.current ??= Date.now();
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    // Pot de miel : champ invisible pour les humains, rempli par les robots.
    const isBot =
      Boolean(formData.get("website")) ||
      mountedAt.current === null ||
      Date.now() - mountedAt.current < MIN_FILL_TIME_MS;

    const result = validateCallbackInput(Object.fromEntries(formData));
    if (!result.ok) {
      setErrors(result.errors);
      const firstInvalid = Object.keys(result.errors)[0];
      form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setErrors({});
    setStatus("submitting");

    if (isBot) {
      // On simule un succès sans rien enregistrer.
      setStatus("success");
      return;
    }

    try {
      // Import dynamique : le SDK Firebase n'est chargé qu'au moment de l'envoi.
      const { submitCallbackRequest } = await import("@/lib/firebase/callback-requests");
      await submitCallbackRequest(result.data);
      form.reset();
      setStatus("success");
    } catch (error) {
      console.error("Échec de l'envoi de la demande de rappel", error);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Icon name="check" />
          </span>
          <p className="text-lg font-semibold">Demande bien reçue, merci !</p>
        </div>
        <p className="mt-3 text-sm">
          Un infirmier du cabinet vous rappellera sur le créneau indiqué. Pour une demande urgente, appelez-nous
          directement au{" "}
          <a href={telHref} className="font-semibold underline">
            {site.phone.display}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-medium text-emerald-800 underline"
        >
          Envoyer une autre demande
        </button>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      onFocus={markStarted}
      onPointerDown={markStarted}
      className="mt-6 space-y-5"
      aria-describedby={status === "error" ? "form-error" : undefined}
    >
      {/* Pot de miel anti-spam (masqué, ignoré par les lecteurs d'écran) */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Site web
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Field id="fullName" label="Nom et prénom" error={errors.fullName}>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          placeholder="Ex. Marie Dupont"
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
          className={`${inputBase} ${errors.fullName ? "border-red-400" : "border-slate-300"}`}
        />
      </Field>

      <Field id="phone" label="Numéro de téléphone" error={errors.phone}>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder="06 12 34 56 78"
          maxLength={20}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "phone-error" : undefined}
          className={`${inputBase} ${errors.phone ? "border-red-400" : "border-slate-300"}`}
        />
      </Field>

      <Field id="careType" label="Type de prise en charge" error={errors.careType}>
        <div className="relative">
          <select
            id="careType"
            name="careType"
            required
            defaultValue=""
            aria-invalid={Boolean(errors.careType)}
            aria-describedby={errors.careType ? "careType-error" : undefined}
            className={`${inputBase} appearance-none pr-10 ${errors.careType ? "border-red-400" : "border-slate-300"}`}
          >
            <option value="" disabled>
              Choisir…
            </option>
            {CARE_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-slate-500"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </Field>

      <fieldset aria-describedby={errors.timeSlot ? "timeSlot-error" : undefined}>
        <legend className="text-sm font-medium text-slate-800">Créneau souhaité pour le rappel</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-3">
          {TIME_SLOTS.map((slot) => (
            <label
              key={slot.value}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-700 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-800 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-300"
            >
              <input type="radio" name="timeSlot" value={slot.value} required className="sr-only" />
              {slot.label}
            </label>
          ))}
        </div>
        {errors.timeSlot ? (
          <p id="timeSlot-error" className="mt-1.5 text-sm text-red-600">
            {errors.timeSlot}
          </p>
        ) : null}
      </fieldset>

      {status === "error" ? (
        <p id="form-error" role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          L&apos;envoi n&apos;a pas abouti. Merci de réessayer ou de nous appeler au{" "}
          <a href={telHref} className="font-semibold underline">
            {site.phone.display}
          </a>
          .
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-brand-900/20 transition-colors hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70"
      >
        {submitting ? "Envoi en cours…" : "Être rappelé(e)"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

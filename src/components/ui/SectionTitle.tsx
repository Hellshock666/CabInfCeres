/** Titre de section du mockup : texte marine en gras + court filet souligné. */
export function SectionTitle({
  id,
  children,
  as: Tag = "h2",
  focusable = false,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  as?: "h2" | "h3";
  /** Permet de recevoir le focus programmatique (cible du défilement). */
  focusable?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <Tag
        id={id}
        tabIndex={focusable ? -1 : undefined}
        className="text-2xl font-bold tracking-tight text-brand-900 outline-none sm:text-[1.7rem]"
      >
        {children}
      </Tag>
      <span aria-hidden="true" className="mt-3 block h-0.5 w-12 rounded-full bg-brand-700" />
    </div>
  );
}

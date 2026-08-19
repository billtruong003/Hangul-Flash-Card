/**
 * Temporary. Each of the three new surfaces replaces this with its real
 * implementation; it exists so the navigation refactor can land and be reviewed
 * on its own, without also carrying three new features.
 */
export function PlaceholderSection({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-base font-bold sm:text-lg">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {description}
      </p>
    </section>
  );
}

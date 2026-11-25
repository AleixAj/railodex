// Placeholder while a page loads its data, so clicking the menu feels instant.
export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-5" aria-busy="true" aria-label="Cargando">
      <div className="h-10 w-64 rounded-lg bg-s2" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-ln bg-s1" />
        ))}
      </div>
      <div className="h-72 rounded-xl border border-ln bg-s1" />
    </div>
  );
}

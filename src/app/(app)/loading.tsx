// Placeholder while a page loads its data, so clicking the menu feels instant.
export default function Loading() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Cargando">
      <div className="shimmer h-10 w-64 rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="shimmer h-28 rounded-xl border border-ln" />
        ))}
      </div>
      <div className="shimmer h-72 rounded-xl border border-ln" />
    </div>
  );
}

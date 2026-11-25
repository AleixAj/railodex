/**
 * Draws a UIC wheel arrangement. Letters are driven axles (A=1, B=2...), digits are carrying
 * axles and ' marks a bogie. Co'Co' is two 3-axle powered bogies; 2'D1' is a 2-axle bogie,
 * 4 driven axles and 1 trailing axle.
 */
export function WheelDiagram({ uic }: { uic: string }) {
  const tokens = [...uic.replace(/\s*\+.*$/, "").matchAll(/(\d|[A-E])(o)?(')?/g)].map((m) => {
    const ch = m[1];
    const driven = /[A-E]/.test(ch);
    const count = driven ? ch.charCodeAt(0) - 64 : Number(ch);
    return { count, driven, bogie: Boolean(m[3]) };
  });
  if (tokens.length === 0) return null;

  const R = 7;
  const GAP = 18;
  const GROUP_GAP = 22;
  let x = 12;
  const circles: { cx: number; driven: boolean }[] = [];
  const bogies: { x1: number; x2: number }[] = [];
  for (const t of tokens) {
    const start = x;
    for (let k = 0; k < t.count; k++) {
      circles.push({ cx: x + R, driven: t.driven });
      x += GAP;
    }
    if (t.bogie && t.count > 0) bogies.push({ x1: start, x2: x - GAP + R * 2 });
    x += GROUP_GAP - GAP + 6;
  }
  const width = Math.max(x, 120);

  return (
    <svg viewBox={`0 0 ${width} 46`} className="h-12 w-full max-w-[320px]" role="img" aria-label={`Rodaje ${uic}`}>
      <rect x="4" y="2" width={width - 8} height="16" rx="3" fill="none" stroke="var(--ln2)" />
      {circles.map((c, i) => (
        <circle key={i} cx={c.cx} cy={28} r={R} fill={c.driven ? "var(--amb)" : "none"} stroke={c.driven ? "var(--amb)" : "var(--fg3)"} strokeWidth="1.5" />
      ))}
      {bogies.map((b, i) => (
        <line key={i} x1={b.x1} x2={b.x2} y1={40} y2={40} stroke="var(--fg3)" strokeWidth="2" />
      ))}
      <line x1="0" x2={width} y1="44" y2="44" stroke="var(--ln)" />
    </svg>
  );
}

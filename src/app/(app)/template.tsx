// Unlike a layout, a template mounts again on every navigation, so the page content
// gets its short entrance animation each time (see .page-shell in globals.css).
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-shell">{children}</div>;
}

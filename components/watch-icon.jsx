// Local SVGs keep the watch controls visible without an icon font or CDN.
export default function WatchIcon({ name, className = "" }) {
  const props = { className: `watch-icon ${className}`.trim(), viewBox: "0 0 24 24", width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, focusable: false };
  switch (name) {
    case "play": return <svg {...props}><path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none" /></svg>;
    case "server": return <svg {...props}><rect x="3" y="3.5" width="18" height="7" rx="2" /><rect x="3" y="13.5" width="18" height="7" rx="2" /><path d="M7 7h.01M7 17h.01M11 7h6M11 17h6" /></svg>;
    case "chevron": return <svg {...props}><path d="m7 10 5 5 5-5" /></svg>;
    case "previous": return <svg {...props}><path d="M5 5v14M19 6l-9 6 9 6V6Z" fill="currentColor" stroke="none" /><path d="M5 5v14" /></svg>;
    case "next": return <svg {...props}><path d="M19 5v14M5 6l9 6-9 6V6Z" fill="currentColor" stroke="none" /><path d="M19 5v14" /></svg>;
    case "episodes": return <svg {...props}><path d="M10 6h10M10 12h10M10 18h10" /><path d="m4 4 3 2-3 2V4Zm0 6 3 2-3 2v-4Zm0 6 3 2-3 2v-4Z" fill="currentColor" stroke="none" /></svg>;
    case "external": return <svg {...props}><path d="M13 5h6v6M19 5l-8 8" /><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;
    case "info": return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>;
    case "clock": return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "skip": return <svg {...props}><path d="m5 6 8 6-8 6V6Z" fill="currentColor" stroke="none" /><path d="M18 6v12" /></svg>;
    case "warning": return <svg {...props}><path d="M10.2 4.8 2.9 17.4a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.8 4.8a2 2 0 0 0-3.6 0ZM12 9v4M12 16h.01" /></svg>;
    case "reload": return <svg {...props}><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5 10a7.5 7.5 0 0 1 13-3l2 5M4 12l2 5a7.5 7.5 0 0 0 13-3" /></svg>;
    default: return null;
  }
}

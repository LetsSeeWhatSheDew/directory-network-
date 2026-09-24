// app/components/HazeBand.tsx — the designed band that stands in for photos.
// Morning haze by day (sky, low sun, river, drifting wisps); dusk with a
// moon, mist and a few fireflies at night. Pure CSS, no images, decorative.
// Styles live in globals.css (.pp-band*) so every page can use it.

export default function HazeBand({ height = 200, className = "" }: { height?: number; className?: string }) {
  return (
    <div className={`pp-band ${className}`} style={{ height }} aria-hidden="true">
      <div className="pp-band-day">
        <div className="hz-sky" />
        <div className="hz-sun" />
        <div className="hz-river" />
        <div className="hz-w hz-w1" />
        <div className="hz-w hz-w2" />
        <div className="hz-w hz-w3" />
      </div>
      <div className="pp-band-night">
        <div className="dk-sky" />
        <div className="dk-horizon" />
        <div className="dk-moon" />
        <div className="dk-ground" />
        <div className="dk-mist" />
        <span className="pp-ff f1" style={{ left: "14%", top: "70%" }} />
        <span className="pp-ff f2" style={{ left: "46%", top: "76%" }} />
        <span className="pp-ff f3" style={{ left: "78%", top: "64%" }} />
        <div className="dk-fade" />
      </div>
    </div>
  );
}

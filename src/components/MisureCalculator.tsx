/**
 * Wrapper React per il Calcolatore Misure Pietra Lavica.
 * App HTML+JS standalone servita da /public/tools/calcolatore-misure.html, incorporata via iframe.
 */
export function MisureCalculator() {
  return (
    <div className="w-full h-full min-h-[560px]">
      <iframe
        src="/tools/calcolatore-misure.html"
        title="Calcolatore Misure Pietra Lavica"
        className="w-full h-[78vh] min-h-[560px] rounded-md border border-border bg-background"
        sandbox="allow-scripts allow-downloads allow-same-origin allow-forms"
      />
    </div>
  )
}

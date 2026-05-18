/**
 * Wrapper React per lo strumento Calcolo Imballo Pietra Lavica.
 * Il calcolatore originale è un'app HTML+JS standalone (con xlsx.js + jspdf inline)
 * servita da /public/tools/imballi.html e incorporata via iframe sandbox.
 */
export function ImballoCalculator() {
  return (
    <div className="w-full h-full min-h-[560px]">
      <iframe
        src="/tools/imballi.html"
        title="Calcolo Imballo Pietra Lavica"
        className="w-full h-[78vh] min-h-[560px] rounded-md border border-border bg-background"
        sandbox="allow-scripts allow-downloads allow-same-origin allow-forms"
      />
    </div>
  )
}

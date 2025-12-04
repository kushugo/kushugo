import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hugo F - UX/UI Designer Paris | Portfolio & Projets",
  description: "Portfolio de Hugo F, UX/UI Designer à Paris. Découvrez mes projets en design d'interface, accessibilité RGAA et systèmes de design pour le secteur public et privé.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}


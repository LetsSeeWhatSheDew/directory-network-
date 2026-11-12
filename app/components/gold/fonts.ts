import { Fraunces } from "next/font/google";

// Gold Leaf display face: Fraunces with its "soft" and "wonky" axes turned
// up gives warm, slightly groovy, 70s-poster letterforms. It carries the
// headlines and the savings figure. Body text stays Instrument Sans.
export const fraunces = Fraunces({
  variable: "--font-gold-display",
  subsets: ["latin"],
  weight: "variable",
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

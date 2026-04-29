# PuffPrice Current State — Visual Snapshot
**PuffPrice Competitive Audit — Phase 4**
Audited: 2026-04-28 | Auditor: Claude (Sonnet 4.6)

This document captures PuffPrice's visual state *before* the visual upgrade. It's the baseline.

---

## 4.1 Desktop Audit

**URL audited:** https://www.puffprice.com/
**Viewport:** 1176x1035 (standard browser)

### Homepage Hero (Desktop)

**What appears above the fold:**

1. Logo: a square dark icon (~76x76px) with a stylized silhouette figure + dollar sign. No wordmark visible in nav — icon only.
2. 2. Hamburger menu (right side) — no expanded navigation visible in hero state
   3. 3. Green location banner: "Showing deals near Peoria" with "Not in Peoria? Change location" link
      4. 4. Category label: "SERVING CENTRAL ILLINOIS" in small-caps green tracking
         5. 5. Hero headline: **"Best Bud For Your Buck$"** — dark navy + green two-color treatment
            6. 6. Subhead: "Low Prices. High Times. / Live dispensary deals for Central Illinois."
               7. 7. Featured deal card: white card with left green accent border, showing "30% OFF" in large green Georgia serif, dispensary name, deal description, location + hours, green "GO HERE →" CTA button
                  8. 8. Freshness warning: amber badge — "⚠️ Last checked 21 days ago — may be outdated"
                    
                     9. **Screenshots:** ss_9625uobfd
                    
                     10. ### Visual System Analysis
                    
                     11. **Color System:**
                     12. - Background: `#F5F4F0` (warm off-white — good choice, close to Anthropic's linen)
                         - - Dark navy: `#0F1F3D` (primary text + dark CTAs)
                           - - Green: `#16A34A` (Tailwind green-600) — the brand accent
                             - - Body text: `#0F1F3D`
                               - - Muted gray text: `#6B7280` (Tailwind gray-500)
                                 - - Card background: `#FFFFFF`
                                   - - Warning amber: soft amber/cream tint
                                    
                                     - **Typography System:**
                                     - - **Hero headline + all headings:** Georgia, serif — at ~35px for h1, weight 700, letter-spacing -1.40px
                                       - - **Body/UI:** system-ui, sans-serif (no custom font loaded for UI elements)
                                         - - **CTA buttons:** system-ui, sans-serif, weight presumably 600
                                           - - The Georgia serif headline is a genuine differentiator in cannabis. No competitor uses a serif. The negative tracking (-1.40px) is appropriate and well-applied.
                                            
                                             - **What works:**
                                             - - Warm off-white background (`#F5F4F0`) is good. Better than pure white.
                                               - - Georgia serif headline is distinctive for the category
                                                 - - Two-color headline treatment (navy + green for "Your Buck$") is engaging
                                                   - - Deal card has clear information hierarchy: discount% (large) → dispensary name → deal description → CTA
                                                     - - Left green accent border on deal card is a good structural signal
                                                       - - "Serving Central Illinois" small-caps category label is editorial in feel
                                                        
                                                         - **What flags "unfinished":**
                                                         - 1. **The logo is the weakest element.** A dark square icon with a stylized silhouette that reads as either "a woman with an afro" or "a bust with dollar sign" — it's ambiguous and doesn't render well at the nav size. No wordmark means the brand name is invisible in the nav.
                                                           2. 2. **The freshness warning badge is prominent.** "⚠️ Last checked 21 days ago" is the most visible UI element after the deal information. This is trust-destroying. A 3-week-old deal appearing as "the best deal" with a warning label is the site's most urgent trust problem.
                                                              3. 3. **The "GO HERE →" CTA text reads as placeholder copy.** "Go here" is the weakest possible CTA label for a deal that should say "Claim deal" or "View at [Dispensary]"
                                                                 4. 4. **System-ui body font vs Georgia display font creates a split personality.** The headings feel editorial; the buttons and UI text feel like default browser output.
                                                                    5. 5. **No visible trust signals** beyond the deal information itself. No review counts, no user counts, no "verified by" indicators.
                                                                      
                                                                       6. ### Homepage Scroll (Desktop)
                                                                      
                                                                       7. **What appears below the fold:**
                                                                      
                                                                       8. 1. How-it-works section: "01 / We detect your location" in large green Georgia numbers, description in dark navy body text. Clean. Good use of the serif + color system.
                                                                          2. 2. "RECENTLY VISITED" section: horizontal scroll card row with dispensary name cards (white cards, rounded corners, dispensary name + city). Simple, functional, clean.
                                                                             3. 3. Deal search bar: "Deals near Peoria, IL" input with dark navy "Search" button
                                                                               
                                                                                4. **Screenshot:** ss_2548cz8o3
                                                                               
                                                                                5. The How-It-Works section (01/02/03) is surprisingly strong. The large green Georgia numeral + clean body copy is visually coherent and confident. This section looks the most intentional.
                                                                               
                                                                                6. ---
                                                                               
                                                                                7. ## 4.2 City Page: /city/peoria
                                                                               
                                                                                8. **URL:** https://www.puffprice.com/city/peoria
                                                                                9. **Screenshot:** ss_35365y9xq
                                                                               
                                                                                10. ### Visual Analysis
                                                                               
                                                                                11. The city page is cleaner and stronger than the homepage. Key elements:
                                                                               
                                                                                12. 1. Breadcrumb: "← All Central IL deals" (in nav-right position)
                                                                                    2. 2. Stats line: "3 active deals at 1 dispensary in Peoria, IL right now." — small, muted gray, effective trust signal
                                                                                       3. 3. Category label: "CENTRAL ILLINOIS · CITY PAGE" in small-caps green — editorial feel
                                                                                          4. 4. H1: **"Peoria dispensary deals today"** in Georgia serif, large (~32px), dark navy — strong
                                                                                             5. 5. Descriptive paragraph: "Peoria and its metro (East Peoria, Bartonville) host a handful of dispensaries serving Central Illinois. Drive times are short, so a 20%-off deal 10 minutes down I-74 is genuinely worth it." — this is the best copy on the site. Local, specific, useful.
                                                                                                6. 6. Section label: "ACTIVE DEALS · BEST SAVINGS FIRST" in small-caps gray
                                                                                                   7. 7. Deal cards: white cards with left green border accent, dispensary name (Georgia bold), deal description, green "Deal" label (right aligned)
                                                                                                     
                                                                                                      8. **Strongest element:** The city page descriptive paragraph. Genuinely editorial, genuinely useful.
                                                                                                      9. **Weakest element:** The deal cards don't show the discount percentage at this level — just the deal description. The most scannable element ("30% OFF") is missing.
                                                                                                     
                                                                                                      10. ---
                                                                                                     
                                                                                                      11. ## 4.3 Dispensary Page: /dispensary/ivy-hall-dispensary
                                                                                                     
                                                                                                      12. **URL:** https://www.puffprice.com/dispensary/ivy-hall-dispensary
                                                                                                      13. **Screenshots:** ss_1711996je
                                                                                                     
                                                                                                      14. ### Visual Analysis
                                                                                                     
                                                                                                      15. 1. Green top accent bar (3-4px thin green line at very top of page) — nice detail
                                                                                                          2. 2. Back nav: "← Peoria deals" (functional, clean)
                                                                                                             3. 3. Category label: "DISPENSARY" in small-caps green
                                                                                                                4. 4. H1: **"Ivy Hall Dispensary"** in Georgia serif, ~36px, dark navy
                                                                                                                   5. 5. Location: "Peoria, IL" in gray subtext
                                                                                                                      6. 6. Status badge: pink/rose pill with red dot — "Closed now" — clean, readable
                                                                                                                         7. 7. Info cards: two-column layout — left card (address + "Tap for directions") + right card (phone + "Tap to call") — white cards with rounded corners and subtle border
                                                                                                                            8. 8. Deal cards: white card with left green border, deal name (Georgia bold, ~18px), green discount % large (Georgia), deal description text, secondary CTA note
                                                                                                                              
                                                                                                                               9. **Strongest element:** The "Closed now" status badge with the animated red dot is excellent — immediately communicates operational status.
                                                                                                                               10. **Weakest element:** The info cards (address + phone) are very utilitarian — they look like default form elements rather than designed components.
                                                                                                                              
                                                                                                                               11. ---
                                                                                                                              
                                                                                                                               12. ## 4.4 Mobile Viewport
                                                                                                                              
                                                                                                                               13. **Viewport:** 390x844 (iPhone 14 equivalent)
                                                                                                                               14. **Screenshot:** ss_3718piju9
                                                                                                                              
                                                                                                                               15. ### Mobile Hero Analysis
                                                                                                                              
                                                                                                                               16. The mobile hero shows how the desktop layout translates:
                                                                                                                              
                                                                                                                               17. 1. Logo (icon) + hamburger — minimal nav, clean
                                                                                                                                   2. 2. Location banner: "📍 Showing deals near Peoria" then "Not in Peoria? Change location" wraps to 2 lines on mobile — slightly awkward
                                                                                                                                      3. 3. Category label: "SERVING CENTRAL ILLINOIS" wraps and left-aligns
                                                                                                                                         4. 4. H1: The Georgia headline scales down and breaks across 3 lines: "Best Bud / For Your / Buck$" — the "For Your Buck$" line break creates an awkward orphan. The font size at mobile is still appropriate but could benefit from tighter mobile breakpoint sizing.
                                                                                                                                            5. 5. Subhead: wraps naturally, readable
                                                                                                                                               6. 6. Featured deal card: shows well on mobile — the left green border, large "30%" numeral, dispensary info stack cleanly.
                                                                                                                                                 
                                                                                                                                                  7. **Mobile verdict:** The layout is responsive and functional. No major breakage. The deal card works well at mobile widths. The headline line breaks need attention.
                                                                                                                                                 
                                                                                                                                                  8. ---
                                                                                                                                                 
                                                                                                                                                  9. ## 4.5 Visual Register Assessment
                                                                                                                                                 
                                                                                                                                                  10. ### Where PuffPrice Sits
                                                                                                                                                 
                                                                                                                                                  11. On a spectrum from "amateur directory" (Cannasaver) to "leading consumer brand" (Dutchie/Resy), PuffPrice currently sits at approximately **55/100** — solidly in the "earnest indie product" zone.
                                                                                                                                                 
                                                                                                                                                  12. **Above the floor:** PuffPrice is clearly better than Cannasaver, Weedmaps' deal cards, and GasBuddy. The warm background, serif typography, and clean deal card architecture all signal intentionality.
                                                                                                                                                 
                                                                                                                                                  13. **Below the ceiling:** PuffPrice is clearly below Dutchie, Resy, iHeartJane, and any SaaS reference site. The gaps are: custom/display font (Georgia is good but available everywhere), the logo, the trust/freshness signals, the button/CTA copy, and the overall whitespace generosity.
                                                                                                                                                 
                                                                                                                                                  14. ### The One Change With Biggest Impact
                                                                                                                                                 
                                                                                                                                                  15. **Replace the logo with a wordmark.** "PuffPrice" in the same Georgia serif as the headlines, set properly (tighter tracking, maybe the green color treatment), would immediately legitimize the brand in the nav. The icon-only nav logo is the biggest signal of "unfinished" on the site. A wordmark costs zero developer time and transforms the first impression.
                                                                                                                                                 
                                                                                                                                                  16. ### Strongest Element
                                                                                                                                                  17. The deal card architecture: left green border + large discount % + dispensary name + description + CTA. Clean, scannable, clearly communicates value. This structure is better than Weedmaps' and on par with Leafly's.
                                                                                                                                                 
                                                                                                                                                  18. ### Weakest Element
                                                                                                                                                  19. The freshness warning badge ("⚠️ Last checked 21 days ago"). This is the most visible trust-destroying element on the site. A deal that was current 3 weeks ago presented as "the best deal right now" with a warning label is worse than showing no deal. The UI treatment needs to either fix the data freshness problem or deprioritize stale deals significantly.
                                                                                                                                                 
                                                                                                                                                  20. ---
                                                                                                                                                 
                                                                                                                                                  21. ## Screenshots Reference
                                                                                                                                                 
                                                                                                                                                  22. | Page | Screenshot ID | Viewport | Date |
                                                                                                                                                  23. |------|--------------|---------|------|
                                                                                                                                                  24. | Homepage hero | ss_9625uobfd | Desktop 1176px | 2026-04-28 |
                                                                                                                                                  25. | Homepage below fold | ss_2548cz8o3 | Desktop 1176px | 2026-04-28 |
                                                                                                                                                  26. | /city/peoria | ss_35365y9xq | Desktop 1176px | 2026-04-28 |
                                                                                                                                                  27. | /dispensary/ivy-hall-dispensary | ss_1711996je | Desktop 1176px | 2026-04-28 |
                                                                                                                                                  28. | Homepage mobile | ss_3718piju9 | Mobile 390px | 2026-04-28 |

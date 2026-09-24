# Breathe — final spec (Sep 23, 2026)

Source: Claude Design project "PuffPrice Breathe variations", file "PuffPrice Breathe final" (Matthew's picks: mark C, exhale line "Drop your shoulders. The comparing is done.").
Decisions log: project doc `claude/DECISIONS-2026-09-23-brand-and-design.md`.

## Tokens
Day (06:00–19:00): paper #f6f1e8 · paper-top #fbe9dc (page bg 180deg #fbe9dc 0% → #f6f1e8 30%) · surface #fffaf3 · ink #14231a · body #4f4a41 · muted #5f5a50 · border #ecdfd0 · border-2 #e3d6c7 · canopy #1f4d33 · peach #f3c3a0 · peach-dot #d4845a · sage #bcd0b3 · btn-primary #d6e4d0 / border #b9cdb2 · save pill #14231a on #fbf6ee.
Night (19:00–06:00): paper #0b1510 · surface #12211a · ink #f3f7f4 · text #eef3ee · body #b4c7ba · muted #9fb3a6 · border rgba(168,230,191,.12) · canopy (mint) #a8e6bf · firefly #eef3b0 · btn-primary rgba(168,230,191,.12) / border rgba(168,230,191,.35) / fg #d4f3df · save pill #0b1510 on #eef3b0.

## Type
Instrument Sans 400/500/600/700 (UI), Instrument Serif 400 + italic (headlines), IBM Plex Mono 400/500 (prices, counts).
Orb label 11px .26em caps · orb number Sans 700 96px, -.055em (night: firefly + text-shadow 0 0 28px rgba(238,243,176,.25)) · "off" Sans 600 24px · headline Serif 46px/1.02, em italic canopy · body 16/1.55 · card price Mono 30px -.04em · was Mono 14 muted strike · Save pill Sans 700 15px, 7px 12px, pill.
Buttons: primary 56px Sans 600 17px; secondary 50px 500 15px; "See all" 52px radius 16px.

## Mark C (the P with a breath dot)
Regular (viewBox 0 0 48 48): P path `M14 42 V8 H24 A10 10 0 0 1 24 28 H14`, stroke 5, round caps/joins, stroke #1f4d33 (night #a8e6bf). Dot circle (24,18) r4.6 #d4845a (night #eef3b0), halo radial gradient r8.2 (stops .6 / .28@.55 / 0) drawn under the stroke and again at .5 opacity on top.
Small (16/32/40px): path `M11 43 V5 H24 A13 13 0 0 1 24 31 H11`, stroke 5.5, dot r5.4, halo r7.6.
Header: regular mark cropped to viewBox "11 5 26 40", 18.5px tall, replaces the "P"; then "uffPrice" Sans 600 22px -.02em canopy.
App icon (primary, cream): radial-gradient(90% 90% at 30% 18%, #fffaf3, #f6ede1 60%, #efe3d4), 1px #e3d6c7, radius 22.5%, mark 2/3 of size. Secondary: green radial #2f6a47→#1a4029 with #f6f1e8 mark + #f3c3a0 dot; dark radial #173726→#0b1510 night colors.

## Orb + motion
8s breath (4s in / 4s out). Keyframes: breathe scale .86↔1.05; inhale .78→1.05 (load, 4s); exhale 1.05→.86 (4s cubic-bezier(.3,.6,.3,1)); ring draws in (stroke-dashoffset 805→0, r128 in 280 box) on load.
Day orb: peach blob 200px blur38 .75 + sage blob 200px blur40 .85 + core 268px radial #fffaf3→#fbf1e6 48%→rgba(226,236,218,.9) 74%→0. Night: one 340px glow rgba(72,150,104,.45)→rgba(40,94,64,.22) 45%→0 72%, plus fireflies.
Exhale (tap a deal): orb exhales, release ring scale 1→1.9 fade 4s, warm wash (peach .42 day / firefly .14 night) 0→1@30%→0 over 4s, card pulse box-shadow 0→30px, revealed lines slide up inside overflow:hidden (1.2s at .3s and .8s, cubic-bezier(.2,.7,.2,1)). Numbers never fade or scale.
Haze band (day) 230px: sky gradient #f6f1e8/#f8e5d5/#f5dbc8/#efe2d3/#e2e5d7/#f6f1e8, sun, river, three drifting wisps (16/20/24s). Night "dusk" band: sky #0b1510…, horizon glow, moon, ground, mist, fireflies.
Grain: SVG feTurbulence .85, 2 octaves, opacity .12 multiply (night .072 screen).
Reduce motion: all animation off.

## Copy
Orb: TODAY'S LONGEST EXHALE / {amount} off / {item} at {store}, {city}
Count: One of {N} deals found at {S} stores this morning.
Headline: Take a breath. *We found the deal.*
Body (day): **Best Bud For Your Buck$.** {S} Central Illinois stores, checked on their own sites every morning. You can close the other tabs.
Body (night): **Best Bud For Your Buck$.** Evening. Everything here was checked on the stores' own sites this morning, and none of it needs you to hurry.
Section: Lowest this morning (night: Lowest right now) · Tap one to see what you keep.
Revealed: You're saving {amount}. / Go on, let your shoulders drop.
Exhale screen: You're saving / {amount}. / Drop your shoulders. The comparing is done. / A long exhale tells your body it's safe. So does paying $25 for a $40 eighth. / The counter always has the final word.
Footer: Independent. Nobody pays us to rank. 21+.
Not used: founder line (removed by Matthew), "Make the out-breath longer than the in" (reads like inhaling instructions on a cannabis site).

## Build notes (what differs from the mock, on purpose)
- Real data only. Amounts come from the deal (`$X off` for dollar deals, `X% off` for percent deals). No "Sample price" labels because nothing is sample; price/was shown only when the deal has real prices.
- Content is never held back: the mock hides numbers for a 4s "Breathing in…" load. Live site shows the numbers immediately; the ring draw + inhale still play as motion.

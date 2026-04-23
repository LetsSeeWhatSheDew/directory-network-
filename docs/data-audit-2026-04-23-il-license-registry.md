# Illinois License Registry Audit — 2026-04-23

**Purpose:** compare `master_listings` against the authoritative IDFPR
Active Adult Use Dispensing Organization Licenses list. Identify new
dispensaries we're missing, listings we hold that the state no longer
recognizes, and any data mismatches between the two.

**This report is read-only.** A proposed migration accompanies this
document; Matthew reviews and applies. No DB writes happen during the
audit itself.

## Source

- **Authority:** Illinois Department of Financial and Professional Regulation (IDFPR), Division of Cannabis Regulation
- **Document:** Active Adult Use Dispensing Organization Licenses
- **URL:** https://idfpr.illinois.gov/content/dam/soi/en/web/idfpr/licenselookup/adultusedispensaries.pdf
- **PDF "Updated:" header:** January 9, 2026
- **Format:** text-extractable PDF (multi-column table)
- **Extraction:** `pdftotext -layout` → column slicing → credential-anchored record assembly

## Totals

| metric | count |
|---|---|
| State active adult-use licenses parsed | 269 |
| Matched to our DB | 45 |
| **IN_STATE_NOT_IN_DB** (new — propose ADD) | **224** |
| **IN_DB_NOT_IN_STATE** (orphaned — propose REVIEW) | **23** |
| **MISMATCH** (matched but fields differ — propose REVIEW) | **1** |

## IN_STATE_NOT_IN_DB — state-licensed, missing from DB

These dispensaries hold an active IL adult-use license but don't
appear in `master_listings`.

The rows are split into two tiers by parse quality. **Clean** rows
are included in the auto-generated migration. **Suspect** rows had
column-alignment quirks in the PDF and are reported here only —
Matthew should check them against the PDF directly before deciding
whether to add them.

- **Clean (auto-migrated):** 148
- **Suspect (manual review):** 76

### Clean — in the migration file

| proposed slug | dispensary name | city | address | zip | license |
|---|---|---|---|---|---|
| `earthmed-addison` | EarthMed | Addison | 852 S. Westgate St. | 60101 | 284.000030-AUDO |
| `village-dispensary-alton` | Village Dispensary Godfrey | Alton | 110 Homer M Adams Pkwy | 62002 | 284.000234-AUDO |
| `thrive-anna` | Thrive | Anna | 87 Richview Dr. | 62906 | 284.000045-AUDO |
| `true-essence-arlington-heights` | True Essence Arlington Heights | Arlington Heights | 792 E Rand Rd | 60004 | 284.000204-AUDO |
| `verilife-arlington-heights` | Verilife | Arlington Heights | 1816 S. Arlington Heights Rd. | 60005 | 284.000017-AUDO |
| `zenleaf-arlington-heights` | ZenLeaf | Arlington Heights | 1434 N Rand Rd | 60005 | 284.000136-AUDO |
| `aroma-hill-belvidere` | Aroma Hill Belvidere | Belvidere | 1874 Crystal Parkway | 61008 | 284.000165-AUDO |
| `bloc-dispensary-berwyn` | Bloc Dispensary Berwyn | Berwyn | 7122 Ogden Ave | 60402 | 284.000343-AUDO |
| `be-blue-island` | Be. Blue Island | Blue Island | 12720 South Western Avenue | 60406 | 284.000245-AUDO |
| `cookies-bolingbrook` | Cookies Bolingbrook | Bolingbrook | 190 S Weber Rd | 60490 | 284.000284-AUDO |
| `ivy-hall-bolingbrook` | Ivy Hall Bolingbrook | Bolingbrook | 361 S Bolingbrook Drive | 60440 | 284.000183-AUDO |
| `viola-chi-broadview` | Viola CHI | Broadview | 1516 Roosevelt Rd. | 60155 | 284.000207-AUDO |
| `sunnyside-buffalo-grove` | Sunnyside | Buffalo Grove | 830 Milwaukee Ave. | 60089 | 284.000009-AUDO |
| `starbuds-burbank` | Starbuds | Burbank | 7844 S Cicero Ave | 60459 | 284.000285-AUDO |
| `vertical-people-dispensary-cairo` | Vertical People Dispensary | Cairo | 300 Washington Ave | 62914 | 284.000355-AUDO |
| `rise-canton` | Rise | Canton | 3104 N. Main Street | 61520 | 284.000005-AUDO |
| `consume-carbondale` | Consume Carbondale | Carbondale | 201 E. Main Street | 62901 | 284.000058-AUDO |
| `key-cannabis-carbondale` | Key Cannabis Carbondale | Carbondale | 1010 E Main St | 62901 | 284.000215-AUDO |
| `the-carbondale-dispensary-carbondale` | The Carbondale Dispensary | Carbondale | 613 E Main St | 62901 | 284.000331-AUDO |
| `windy-city-cannabis-carpentersville` | Windy City Cannabis | Carpentersville | 125 S Western Ave | 60110 | 284.000111-AUDO |
| `vertical-dispensary-cary` | Vertical Dispensary | Cary | 20 Northwest Hwy | 60013 | 284.000300-AUDO |
| `sunnyside-champaign` | Sunnyside | Champaign | 1704 S Neil St. C | 61820 | 284.000006-AUDO |
| `rise-charleston` | Rise | Charleston | 909 Lincoln Ave. | 61920 | 284.000130-AUDO |
| `zen-leaf-charles` | Zen Leaf | Charles | 3691 E. Main St. St. | 60174 | 284.000139-AUDO |
| `ascend-chicago` | Ascend MOCA | Chicago | 216 W. Ohio St. | 60654 | 284.000077-AUDO |
| `bud-and-rita-s-chicago` | Bud and Rita's Chicago | Chicago | 3425 W Belmont Ave | 60618 | 284.000276-AUDO |
| `cannabist-chicago` | Cannabist Chicago | Chicago | 4758 N. Milwaukee Ave. | 60630 | 284.000024-AUDO |
| `consume-chicago` | Consume Chicago | Chicago | 6428 N Milwaukee Ave | 60631 | 284.000094-AUDO |
| `curaleaf-chicago` | Curaleaf | Chicago | 923 W Weed St | 60642 | 284.000089-AUDO |
| `dr-greenthumb-s-chicago` | Dr Greenthumb's Chicago | Chicago | 2200 N Ashland Ave | 60614 | 284.000186-AUDO |
| `green-rose-chicago` | Green Rose Chicago | Chicago | 612 N. Wells St. | 60654 | 284.000248-AUDO |
| `guaranteed-dispensary-chicago` | Guaranteed Dispensary | Chicago | 620 N Fairbanks Ct | 60611 | 284.000191-AUDO |
| `ivy-hall-chicago` | Ivy Hall Damen | Chicago | 1720 N Damen Ave | 60647 | 284.000232-AUDO |
| `ivy-hall-chicago` | Ivy Hall Logan Square | Chicago | 3115 W Armitage Ave | 60647 | 284.000184-AUDO |
| `maribis-chicago` | Maribis | Chicago | 4570 S. Archer Ave. | 60632 | 284.000014-AUDO |
| `market-96-chicago` | Market 96 S Wells Street | Chicago | 529 S Wells St Ste 100 | 60607 | 284.000237-AUDO |
| `midway-by-ascend-chicago` | Midway by Ascend | Chicago | 5648 S. Archer Ave. | 60638 | 284.000124-AUDO |
| `mission-chicago` | Mission | Chicago | 8554 S. Commercial Ave. | 60617 | 284.000341-AUDO |
| `nature-s-care-company-chicago` | Nature’s Care Company | Chicago | 810 W. Randolph St. | 60607 | 284.000064-AUDO |
| `nirvana-dispensary-chicago` | Nirvana Dispensary Chicago | Chicago | 2301 W Lawrence Ave | 60625 | 284.000252-AUDO |
| `prairie-cannabis-chicago` | Prairie Cannabis South Loop | Chicago | 622 W Roosevelt Rd | 60607 | 284.000293-AUDO |
| `rockford-dispensary33-chicago` | Rockford Dispensary33 | Chicago | 5001 N. Clark St. | 60640 | 284.000012-AUDO |
| `spark-d-dispensary-chicago` | Spark'd Dispensary South Loop | Chicago | 2114 S Wabash Ave | 60616 | 284.000192-AUDO |
| `sunnyside-chicago` | Sunnyside | Chicago | 436 N. Clark St. | 60654 | 284.000053-AUDO |
| `umi-chicago` | UMI Chicago | Chicago | 1113 2575 N Lincoln Ave | 60614 | 284.000155-AUDO |
| `verilife-chicago` | Verilife | Chicago | 60 W Superior St | 60654 | 284.000099-AUDO |
| `village-bucktown-chicago` | Village Bucktown | Chicago | 1850 W Webster Ave | 60614 | 284.000208-AUDO |
| `zenleaf-chicago` | ZenLeaf | Chicago | 7305 N Rogers Ave | 60626 | 284.000128-AUDO |
| `zenleaf-chicago` | ZenLeaf | Chicago | 222 S. Halsted St. | 60661 | 284.000134-AUDO |
| `ivy-hall-crystal-lake` | Ivy Hall CrystalLake | Crystal Lake | 501 Pingree Rd | 60014 | 284.000313-AUDO |
| `high-haven-dispensary-darien` | High Haven Dispensary | Darien | 8131 S. Cass Ave | 60561 | 284.000328-AUDO |
| `mystic-greenz-decatur` | Mystic Greenz Decatur | Decatur | 5045 Indus Drive | 62522 | 284.000312-AUDO |
| `curaleaf-deerfield` | Curaleaf | Deerfield | 677 Lake Cook Rd. | 60015 | 284.000121-AUDO |
| `excelleaf-dispensary-dekalb` | Excelleaf Dispensary | Dekalb | 305 E Locust St | 60115 | 284.000231-AUDO |
| `supergood-store-des-plaines` | Supergood Store | Des Plaines | 660 N Wolf Rd | 60016 | 284.000196-AUDO |
| `tree-haus-diamond` | Tree Haus Diamond | Diamond | 2910 E Division St | 60416 | 284.000161-AUDO |
| `bridge-city-collective-east-dubuque` | Bridge City Collective East Dubuque | East Dubuque | 122 Sinsinawa Ave | 61025 | 284.000307-AUDO |
| `cloud-9-east-peoria` | Cloud 9 East Peoria | East Peoria | 406 W Camp St | 61611 | 284.000303-AUDO |
| `ivy-hall-edwardsville` | Ivy Hall Edwardsville | Edwardsville | 6197 Old Alton Edwardsville Rd | 62025 | 284.000302-AUDO |
| `snap-canna-elk-grove-village` | Snap Canna Elk Grove Village | Elk Grove Village | 840 E. Higgins Road | 60007 | 284.000222-AUDO |
| `sunnyside-elmwood-park` | Sunnyside | Elmwood Park | 7955 W. Grand Ave. | 60707 | 284.000010-AUDO |
| `okay-cannabis-dispensary-evanston` | OKAY Cannabis Dispensary Evanston | Evanston | 100 Chicago Ave | 60202 | 284.000143-AUDO |
| `zenleaf-evanston` | ZenLeaf | Evanston | 1804 Maple Ave. | 60201 | 284.000131-AUDO |
| `ascend-fairview-heights` | Ascend | Fairview Heights | 114 Commerce Ln | 62208 | 284.000104-AUDO |
| `bloc-forest-park` | Bloc Forest Park | Forest Park | 7216 Circle Ave | 60130 | 284.000299-AUDO |
| `ita-s-forsyth` | ita's h | Forsyth | 1401 Hickory Point Dr | 62535 | 284.000218-AUDO |
| `the-dispensary-fulton` | The Dispensary | Fulton | 1801 16th Ave. | 61252 | 284.000098-AUDO |
| `verilife-galena` | Verilife | Galena | 115 Perry St. | 61036 | 284.000097-AUDO |
| `nature-s-treatment-galesburg` | Nature’s Treatment | Galesburg | 735 W Main St. | 61401 | 284.000054-AUDO |
| `glenwood-dispensary-glenwood` | Glenwood Dispensary | Glenwood | 18425 S Halsted St | 60425 | 284.000149-AUDO |
| `terrabis-grayville` | Terrabis Grayville | Grayville | 105 Koehler St | 62844 | 284.000227-AUDO |
| `thrive-harrisburg` | Thrive | Harrisburg | 105 Veterans Drive | 62946 | 284.000046-AUDO |
| `nuera-chicago-southland-harvey` | nuEra Chicago Southland | Harvey | 16950 Halsted St | 60426 | 284.000202-AUDO |
| `zen-leaf-highland-park` | Zen Leaf | Highland Park | 2030 Skokie Valley Rd. | 60035 | 284.000135-AUDO |
| `windy-city-cannabis-highwood` | Windy City Cannabis | Highwood | 260 Green Bay Rd. | 60040 | 284.000100-AUDO |
| `aroma-hill-hoffman-estates` | Aroma Hill | Hoffman Estates | 1237 North Barrington Road | 60169 | 284.000287-AUDO |
| `e-ary-hoffman-estates` | e ary | Hoffman Estates | 1795 N Barrington Road | 60194 | 284.000185-AUDO |
| `starbuds-hoffman-estates` | Starbuds Hoffman Estates | Hoffman Estates | 5 E Golf Rd | 60169 | 284.000271-AUDO |
| `ness-hometown` | ness n | Hometown | 4140 Southwest Hwy | 60456 | 284.000363-AUDO |
| `windy-city-cannabis-homewood` | Windy City Cannabis | Homewood | 1137 W. 175th St. | 60430 | 284.000084-AUDO |
| `emerald-island-lake` | Emerald Island Lake | Island Lake | 660 E State Rd | 60042 | 284.000256-AUDO |
| `kush21-jacksonville` | Kush21 Jacksonville | Jacksonville | 1112 Veterans Dr | 62650 | 284.000213-AUDO |
| `curaleaf-justice` | Curaleaf | Justice | 8340 S Roberts Rd | 60458 | 284.000088-AUDO |
| `aroma-hill-kankakee` | Aroma Hill Kankakee | Kankakee | 2255 E Court St | 60901 | 284.000219-AUDO |
| `rise-lake-in-the-hills` | Rise | Lake in the Hills | 270 N Randall Rd | 60156 | 284.000110-AUDO |
| `herb-social-lawrenceville` | Herb Social | Lawrenceville | 616 12th St | 62439 | 284.000172-AUDO |
| `mystic-greenz-lincoln` | Mystic Greenz Lincoln | Lincoln | 1120 Woodlawn Rd | 62656 | 284.000353-AUDO |
| `moline-green-rose-lincolnwood` | Moline Green Rose Lincolnwood | Lincolnwood | 4656 W Touhy Ave | 60712 | 284.000249-AUDO |
| `windy-city-cannabis-litchfield` | Windy City Cannabis | Litchfield | 719 W. Union Ave. | 62056 | 284.000109-AUDO |
| `the-happy-cannabis-company-loves-park` | The Happy Cannabis Company | Loves Park | 4120 N Bell School Rd | 61111 | 284.000102-AUDO |
| `dutchess-cannabis-lynwood` | Dutchess Cannabis Lynwood | Lynwood | 20513 Torrence Ave | 60411 | 284.000158-AUDO |
| `windy-city-cannabis-macomb` | Windy City Cannabis | Macomb | 518 W Jackson St | 61455 | 284.000112-AUDO |
| `prospect-consume-marion` | Prospect Consume Marion | Marion | 8195 Express Dr. | 62959 | 284.000023-AUDO |
| `bloc-dispensary-mattoon` | Bloc Dispensary Mattoon | Mattoon | 511 Lake Land Blvd | 61938 | 284.000306-AUDO |
| `earthmed-mchenry` | Earthmed McHenry | McHenry | 1711 N Richmond Rd | 60051 | 284.000144-AUDO |
| `curaleaf-melrose-park` | Curaleaf | Melrose Park | 1413 W North Ave | 60160 | 284.000091-AUDO |
| `thrive-metropolis` | Thrive | Metropolis | 1551 E. 5th St. | 62960 | 284.000122-AUDO |
| `tree-haus-morris` | Tree Haus Morris | Morris | 50 Gore Rd | 60450 | 284.000160-AUDO |
| `dutchess-cannabis-morton-grove` | Dutchess Cannabis Morton Grove | Morton Grove | 6761 Dempster St | 60053 | 284.000106-AUDO |
| `thrive-mount-vernon` | Thrive | Mount Vernon | 800 S 45th St | 62864 | 284.000066-AUDO |
| `revolution-dispensary-mt-prospect` | Revolution Dispensary Mt. | Mt. Prospect | 2015 E. Euclid Ave. | 60056 | 284.000022-AUDO |
| `sunnyside-naperville` | Sunnyside | Naperville | 2740 W 75th St | 60564 | 284.000080-AUDO |
| `bud-and-rita-s-niles` | Bud and Rita's Niles | Niles | 5960 W Touhy Ave | 60714 | 284.000280-AUDO |
| `rise-niles` | Rise | Niles | 9621 N. Milwaukee Ave. | 60714 | 284.000055-AUDO |
| `mission-norridge` | Mission Norridge | Norridge | 4113 N Harlem Ave | 60706 | 284.000147-AUDO |
| `verilife-north-aurora` | Verilife | North Aurora | 2080 W Orchard Rd | 60542 | 284.000016-AUDO |
| `dutchess-cannabis-n-riverside-north-riverside` | Dutchess Cannabis N. Riverside | North Riverside | 8380 W Cermak Rd | 60546 | 284.000334-AUDO |
| `curaleaf-northbrook` | Curaleaf | Northbrook | 755 Skokie Blvd | 60062 | 284.000090-AUDO |
| `curaleaf-northbrook` | Curaleaf | Northbrook | 755 Skokie Blvd | 60062 | 284.000120-AUDO |
| `ascend-cannabis-outlet-by-inlabs-northlake` | Ascend Cannabis Outlet by InLabs | Northlake | 39 W North Ave | 60164 | 284.000197-AUDO |
| `be-oak-forest` | Be. Oak Forest | Oak Forest | 5940 159th St | 60452 | 284.000246-AUDO |
| `dutchess-cannabis-oak-park` | Dutchess Cannabis Oak Park | Oak Park | 1132 Lake St. | 60301 | 284.000033-AUDO |
| `stash-orland-hills` | Stash Orland Hills | Orland Hills | 9545 167th Street | 60467 | 284.000281-AUDO |
| `market-96-oswego` | Market 96 Oswego | Oswego | 1144 Douglas Road | 60543 | 284.000238-AUDO |
| `verilife-ottawa` | Verilife | Ottawa | 4104 Columbus St. | 61350 | 284.000018-AUDO |
| `nirvana-dispensary-palatine` | Nirvana Dispensary Palatine | Palatine | 333 East Lake Cook Rd | 60074 | 284.000250-AUDO |
| `nuera-pekin` | NuEra | Pekin | 3249 Court St | 61554 | 284.000116-AUDO |
| `cookies-peoria-heights` | Cookies Peoria Heights | Peoria Heights | 1209 E War Memorial Dr | 61616 | 284.000319-AUDO |
| `aroma-hill-peoria` | Aroma Hill Peoria | Peoria | 1210 W Glen Ave | 61614 | 284.000265-AUDO |
| `snap-canna-pontiac` | Snap Canna Pontiac | Pontiac | 1910 W Reynolds St Unit A | 61764 | 284.000225-AUDO |
| `windy-city-cannabis-posen` | Windy City Cannabis | Posen | 2535 Veterans Dr | 60469 | 284.000086-AUDO |
| `galaxy-richton-park` | Galaxy Richton Park | Richton Park | 22214 Governors Hwy | 60471 | 284.000244-AUDO |
| `starbuds-riverside` | Starbuds Riverside | Riverside | 2704 S. Harlem Ave. | 60546 | 284.000268-AUDO |
| `the-happy-cannabis-company-rockford` | The Happy Cannabis Company | Rockford | 4777 Stenstrom Rd. | 61109 | 284.000011-AUDO |
| `nature-s-care-company-rolling-meadows` | Nature’s Care Company | Rolling Meadows | 975 Rohlwing Rd. | 60008 | 284.000050-AUDO |
| `verilife-romeoville` | Verilife | Romeoville | 412 N. Weber Rd | 60446 | 284.000019-AUDO |
| `mint-rook` | Mint Willowb llowbrook | rook | 900 75th St | 60527 | 284.000156-AUDO |
| `earthmed-rosemont` | EarthMed | Rosemont | 10441 E. Touhy Ave. | 60018 | 284.000082-AUDO |
| `verilife-rosemont` | Verilife | Rosemont | 60181 5540 Park Pl | 60018 | 284.000096-AUDO |
| `altius-round-lake-beach` | Altius | Round Lake Beach | 993 E Rollins Rd | 60073 | 284.000163-AUDO |
| `beyond-hello-sauget` | Beyond/Hello | Sauget | 2021 Goose Lake Road | 62206 | 284.000048-AUDO |
| `beyond-hello-sauget` | Beyond/Hello | Sauget | 1401 Mississippi Ave Ste 17 | 62201 | 284.000079-AUDO |
| `cloud-9-cannabis-schaumburg` | Cloud 9 Cannabis Schaumburg | Schaumburg | 1823 W Wise Rd | 60193 | 284.000356-AUDO |
| `curaleaf-skokie` | Curaleaf | Skokie | 10000 Skokie Blvd | 60077 | 284.000093-AUDO |
| `sunnyside-south-beloit` | Sunnyside | South Beloit | 7000 First Ranger Dr. | 61080 | 284.000059-AUDO |
| `share-springfield` | SHARE | Springfield | 3600 S. 06th St. | 62703 | 284.000346-AUDO |
| `hatch-stec-addison` | Hatch | SteC Addison | 1433 W Fullerton Ave. | 60101 | 284.000049-AUDO |
| `ivy-hall-streamwood` | Ivy Hall Streamwood | Streamwood | 630 S Sutton Rd | 60107 | 284.000141-AUDO |
| `starbuds-summit` | Starbuds Summitt | Summit | 5436 S Harlem Ave | 60501 | 284.000358-AUDO |
| `parkway-dispensary-tilton` | Parkway Dispensary | Tilton | 2 Donna Drive, Suite 1 | 61833 | 284.000173-AUDO |
| `cannabist-villa-park` | Cannabist Villa Park | Villa Park | 133 W. Roosevelt Rd. | 60181 | 284.000065-AUDO |
| `green-releaf-villa-park` | Green Releaf Villa Park | Villa Park | 305 W North Ave | 60181 | 284.000148-AUDO |
| `maribis-westchester` | Maribis | Westchester | 1137 S Mannheim Rd | 60154 | 284.000118-AUDO |
| `starbuds-westmont` | Starbuds WM | Westmont | 101 W Ogden Ave | 60559 | 284.000164-AUDO |
| `hatch-dispensary-wheeling` | Hatch Dispensary | Wheeling | 1500 E Lake Cook Rd | 60090 | 284.000105-AUDO |
| `okay-cannabis-wheeling` | OKAY Cannabis | Wheeling | 0909 781 N Milwaukee Ave | 60090 | 284.000142-AUDO |
| `terrabis-woodstock` | Terrabis Woodstock | Woodstock | 601 S Eastwood Dr | 60098 | 284.000315-AUDO |
| `curaleaf-worth` | Curaleaf | Worth | 11425 S Harlem Ave | 60482 | 284.000087-AUDO |

### Suspect — manual review needed (NOT in migration)

For each row below, the raw-parsed name / city / address are
shown alongside the flag(s) that tripped the quality check. Open
the PDF at the `license` number to verify the canonical values.

| license | raw name | raw city | raw address | zip | flag(s) |
|---|---|---|---|---|---|
| 284.000073-AUDO | `Dispensary33` | `—` | `1152 W. Randolph Chicago` | 60607 | city not parsed |
| 284.000076-AUDO | `Mission Ascend - MOCA` | `—` | `Calumet City` | 60409 | city not parsed; street address does not start with a number |
| 284.000092-AUDO | `Curaleaf` | `—` | `2400 W US Route 6 Morris` | 60450 | city not parsed |
| 284.000095-AUDO | `Consume Oakbrook Terrace` | `—` | `1S 130 Summit Ave. Oak Brook Terrace, Il. 0` |  | city not parsed |
| 284.000113-AUDO | `The Dispensary` | `—` | `TBD 1709 Il Route 35 N East Dubuque` | 61025 | city not parsed; street address does not start with a number |
| 284.000117-AUDO | `Curaleaf` | `—` | `11 E Ogden Ave Westmont, IL 6055 0` |  | city not parsed |
| 284.000119-AUDO | `Maribis` | `0 Springfield` | `3025 Lindbergh Blvd` | 62704 | city has unexpected characters |
| 284.000127-AUDO | `Ascend ZenLeaf` | `—` | `Chicago Ridge` | 60415 | city not parsed; street address does not start with a number |
| 284.000132-AUDO | `ZenLeaf` | `—` | `740 N. Rte. 59 Aurora` | 60504 | city not parsed |
| 284.000133-AUDO | `ZenLeaf` | `—` | `1301 S. Western Ave. Chicago, 60608 0` |  | city not parsed |
| 284.000140-AUDO | `Zen Leaf` | `—` | `0 Naperville` | 60563 | city not parsed |
| 284.000150-AUDO | `( 743 ay – Forest Forest Park (` | `Park` | `847) 2 Madison St.` | 60130 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed) |
| 284.000154-AUDO | `l - Fox` | `12 Fox Lake` | `1298 S US Highway` | 60020 | city has unexpected characters |
| 284.000159-AUDO | `3063 Body and Markha Mind (70` | `m` | `W 159th St` | 60428 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city has unexpected characters |
| 284.000166-AUDO | `1322 udhaven - South Be uth Beloit (7` | `loit` | `Gardner St` | 61080 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); street address does not start with a number |
| 284.000167-AUDO | `Revolution Dispensary - Maryville` | `—` | `Collinsville` | 62234 | city not parsed; street address does not start with a number |
| 284.000168-AUDO | `Chicago, ker Park (70 1914 W Cannabis Chicago, est Town (31 904 Edw n Temple Troy, I (61` | `—` | `—` | 60622 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city not parsed; street address not parsed |
| 284.000170-AUDO | `Stash Peru` | `Peru` | `(773)- 1320 38th Street` | 61354 | street address does not start with a number |
| 284.000171-AUDO | `Thrive Dispensary - Casey` | `—` | `912 N Route 49 Casey` | 62420 | city not parsed |
| 284.000175-AUDO | `Terrace – Moline` | `of the Cities Moline` | `(708)- 2727 Avenue` | 61265 | street address does not start with a number |
| 284.000176-AUDO | `Terrace Milan nabis - Milan (` | `—` | `800 Tech Dr` | 61264 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city not parsed |
| 284.000180-AUDO | `996 S vy Hall - Waukega ukegan (85` | `n` | `Waukegan Rd` | 60085 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city has unexpected characters; street address does not start with a number |
| 284.000181-AUDO | `1970 C vy Hall - Montgomer tgomery (85 1400 Dispensary Alton, (61 1212 N park’d –` | `y` | `aterpillar Dr` | 60538 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city has unexpected characters; street address does not start with a number |
| 284.000182-AUDO | `Ivy Hall - Glendale Heights` | `B, Glendale Heights` | `2130 Bloomingdale Rd, Unit` | 60139 | city has unexpected characters |
| 284.000187-AUDO | `Grasshopper Club` | `1st Fl Chicago` | `2551 N Milwaukee Ave` | 60647 | city has unexpected characters |
| 284.000188-AUDO | `Grasshopper Club - Roosevelt` | `1st Floor, Chicago` | `58 E. Roosevelt Road` | 60605 | city has unexpected characters |
| 284.000194-AUDO | `Spark'd Streamwood` | `Streamwood` | `(248)- 1594 Buttitta Drive` | 60107 | street address does not start with a number |
| 284.000198-AUDO | `Aces Dispensary - Plainfield` | `—` | `12627 S Route 59 Plainfield` | 60585 | city not parsed |
| 284.000200-AUDO | `Sway` | `Chicago` | `(845)- 3340 N Halsted St` | 60657 | street address does not start with a number |
| 284.000201-AUDO | `(6 818 W Lin a - Dekalb Dekalb, (7` | `—` | `18) coln Hwy Ste 7` | 60115 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city not parsed |
| 284.000205-AUDO | `13 ver Bluff Rosel annabis (84` | `le` | `50 Lake St` | 60172 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed) |
| 284.000211-AUDO | `NuEra - East Dubuque` | `20 W East Dubuque` | `20170 US Highway` | 61025 | city has unexpected characters |
| 284.000226-AUDO | `Blyss Dispensary` | `Mount Vernon` | `(312)- 610B S. 42nd Street` | 62864 | street address does not start with a number |
| 284.000229-AUDO | `Locke Dr B Dispensary (84` | `—` | `ourbonnais` | 60914 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city not parsed; street address does not start with a number |
| 284.000233-AUDO | `7620 N IL nd/Hello - Peo Peoria (3` | `Suite A ria` | `Rt 91` | 61615 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); street address does not start with a number |
| 284.000235-AUDO | `16200 Harl cend by Park, I ecoming (31` | `—` | `em Ave Tinley L 60477 2)` |  | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city not parsed; street address does not start with a number |
| 284.000251-AUDO | `6 Nirvana Lake Z spensary – ake Zurich` | `urich` | `76 S Rand Rd` | 60047 | dispensary name has unexpected characters |
| 284.000255-AUDO | `Nirvana Dispensary – Mt. Carmel` | `—` | `Mount Carmel` | 62863 | city not parsed; street address does not start with a number |
| 284.000258-AUDO | `Terrace - Alton` | `—` | `1400 E Broadway Alton` | 62002 | city not parsed |
| 284.000259-AUDO | `505 W Town 9 Cannabis Champai (21` | `gn` | `Center Blvd` | 61822 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); street address does not start with a number |
| 284.000263-AUDO | `Karma Club` | `—` | `1590 N. Clybourn Ave. Chicago, IL, 60642` |  | city not parsed |
| 284.000269-AUDO | `107 Town Parkway Lake sary - Fox Lake Fox Lak (` | `31 land Shopping Center e` | `e Centre Ln #` | 60020 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city has unexpected characters; street address does not start with a number |
| 284.000270-AUDO | `15 Goodies - Stream treamwood (` | `wood` | `94 Buttitta Dr` | 60107 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed) |
| 284.000272-AUDO | `Spark'd – Winthrop Harbor` | `Winthrop Harbor` | `(773)- 935 Sheridan Rd` | 60096 | street address does not start with a number |
| 284.000273-AUDO | `Spark’d – Richmond` | `—` | `(847)- 9705 Prairie Rdg Richmond` | 60071 | city not parsed; street address does not start with a number |
| 284.000275-AUDO | `9 s Dispensary Orland H rland Hills` | `ills` | `101 159th St` | 60487 | dispensary name has unexpected characters |
| 284.000277-AUDO | `41509 N Rita's - Wadswor adsworth (3` | `41 th` | `US Highway` | 60083 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city has unexpected characters; street address does not start with a number |
| 284.000278-AUDO | `BLOC 3545 Dispensary Chicago, Kedzie (7` | `—` | `N Kedzie Ave` | 60618 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city not parsed; street address does not start with a number |
| 284.000279-AUDO | `Namaste Cannabis & Wellness` | `Hodgkins` | `(847)- 6119 A East Avenue` | 60525 | street address does not start with a number |
| 284.000282-AUDO | `(4 2 NOBO Lakemo (3` | `—` | `64)- 7500 IL 120 or` | 60051 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city not parsed |
| 284.000286-AUDO | `1602 Terrabis Plainfiel (8` | `—` | `0 S Route 59 d` | 60586 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city not parsed |
| 284.000288-AUDO | `Greenlight3331 Belv Dispensary - Park City Park C` | `Suites B&C ity` | `idere Rd` | 60085 | city has unexpected characters; street address does not start with a number |
| 284.000290-AUDO | `133 Hi Five - Crestwoo Crestwood (` | `d` | `52 Cicero Ave` | 60418 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city has unexpected characters |
| 284.000292-AUDO | `Cloud 9 - Oswego` | `30 Oswego` | `2420 US Highway` | 60543 | city has unexpected characters |
| 284.000294-AUDO | `Consume Antioch` | `B, Antioch` | `453 Main St, Unit` | 60002 | city has unexpected characters |
| 284.000295-AUDO | `584 S nsume – Charl .Charles (63` | `es` | `Randall Rd St` | 60174 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); street address does not start with a number |
| 284.000296-AUDO | `5539 Mi ux Leaf Mattes spensary (70` | `on` | `ller Circle Dr` | 60443 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); street address does not start with a number |
| 284.000304-AUDO | `23 9 Cannabis Edwardsv (61` | `ille` | `41 Plum St` | 62025 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed) |
| 284.000305-AUDO | `30 gh Profile - Martin artinsville (` | `sville` | `01 N York St` | 62442 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed) |
| 284.000311-AUDO | `Green Releaf - Bourbonnais` | `—` | `1660 N State Route 50 Bourbonnais` | 60914 | city not parsed |
| 284.000314-AUDO | `gh Profile - Metropol Metropolis (` | `is` | `1801 E 5th St` | 62960 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed) |
| 284.000317-AUDO | `Socíale` | `Park Ridge` | `(773)- 1036 W Higgins Rd` | 60068 | dispensary name has unexpected characters; street address does not start with a number |
| 284.000320-AUDO | `Cookies - Pontoon Beach` | `—` | `5111 State Route 111 Pontoon Beach` | 62040 | city not parsed |
| 284.000324-AUDO | `161 W Dispensary Northfiel Northfield (8` | `d` | `aukegan Rd` | 60093 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city has unexpected characters; street address does not start with a number |
| 284.000329-AUDO | `15 C gh Haven – Elgin Elgin (` | `—` | `lock Tower Plz` | 60120 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city not parsed; street address does not start with a number |
| 284.000330-AUDO | `360 S Gr Greenz - Bellevill Belleville` | `e` | `een Mount Rd` | 62221 | dispensary name has unexpected characters; city has unexpected characters; street address does not start with a number |
| 284.000333-AUDO | `628 od Shine – Chica cago Heights (` | `go Heights` | `W Lincoln Hwy` | 60411 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); street address does not start with a number |
| 284.000338-AUDO | `Bloc Dispensary - Antioch` | `—` | `417 E Il Route 173 Unit 106 Antioch` | 60002 | city not parsed |
| 284.000340-AUDO | `2 Dispensary Metropoli Metropolis (6` | `s` | `125 E 5th St` | 62960 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city has unexpected characters |
| 284.000347-AUDO | `44 S Smokehouse Fox Fox Lak Lake (` | `12 e` | `US Highway` | 60020 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city has unexpected characters; street address does not start with a number |
| 284.000348-AUDO | `4660 een Rose - Harwo wood Heights (` | `od Heights` | `N Harlem Ave` | 60706 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); street address does not start with a number |
| 284.000349-AUDO | `9 N R sh & Ivy - Benton, Benton (6` | `—` | `end Lake Plz` | 62812 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city not parsed; street address does not start with a number |
| 284.000350-AUDO | `4S12 ie Cannabis Warrenv Naperville (3` | `—` | `0 N Route 59 ille` | 60563 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city not parsed |
| 284.000351-AUDO | `1679 bis - Dixon Dixon, (8` | `—` | `S Galena Ave` | 61021 | dispensary name has unexpected characters; dispensary name contains parentheses (likely phone bleed); city not parsed; street address does not start with a number |
| 284.000354-AUDO | `Mystic Greenz - Olive Branch` | `—` | `26650 IL State Route 3 Olive Branch` | 62969 | city not parsed |
| 284.000362-AUDO | `Bloom Wellness – Quincy 2` | `—` | `1837 Broadway St. Quincy, IL.62301 0` |  | city not parsed |

### Downstream: new cities surfaced

The dispensaries above include cities we don't yet have listings in.
After the migration is applied, the Google Places logo + GPS
backfill (`scripts/backfill-logos-from-google-places.ts`) should be
re-run with `--cities=` that includes these:

- 0 Springfield
- 12 Fox Lake
- 12 e
- 1st Fl Chicago
- 1st Floor, Chicago
- 20 W East Dubuque
- 30 Oswego
- 31 land Shopping Center e
- 41 th
- Addison
- Alton
- Anna
- Arlington Heights
- B, Antioch
- B, Glendale Heights
- Belvidere
- Berwyn
- Blue Island
- Bolingbrook
- Broadview
- Buffalo Grove
- Burbank
- Cairo
- Canton
- Carbondale
- Carpentersville
- Cary
- Charles
- Charleston
- Crystal Lake
- Darien
- Decatur
- Deerfield
- Dekalb
- Des Plaines
- Diamond
- East Dubuque
- Edwardsville
- Elk Grove Village
- Elmwood Park
- Evanston
- Fairview Heights
- Forest Park
- Forsyth
- Fulton
- Galena
- Glenwood
- Grayville
- Harrisburg
- Harvey
- Highland Park
- Highwood
- Hodgkins
- Hoffman Estates
- Hometown
- Homewood
- Island Lake
- Jacksonville
- Justice
- Kankakee
- Lake in the Hills
- Lawrenceville
- Lincoln
- Lincolnwood
- Litchfield
- Loves Park
- Lynwood
- Macomb
- Marion
- Mattoon
- McHenry
- Melrose Park
- Metropolis
- Morton Grove
- Mount Vernon
- Mt. Prospect
- Niles
- Norridge
- North Aurora
- North Riverside
- Northbrook
- Northlake
- Oak Forest
- Oak Park
- Orland Hills
- Oswego
- Ottawa
- Palatine
- Park
- Park Ridge
- Pekin
- Peoria Heights
- Peru
- Pontiac
- Posen
- Richton Park
- Riverside
- Rolling Meadows
- Romeoville
- Rosemont
- Round Lake Beach
- Sauget
- Skokie
- South Beloit
- SteC Addison
- Streamwood
- Suite A ria
- Suites B&C ity
- Summit
- Tilton
- Villa Park
- Westchester
- Wheeling
- Winthrop Harbor
- Woodstock
- Worth
- d
- e
- es
- gn
- go Heights
- ille
- ills
- is
- le
- loit
- m
- n
- od Heights
- of the Cities Moline
- on
- rook
- s
- sville
- urich
- wood
- y

Whether any of these cities should enter `CENTRAL_IL_CITIES` (the
homepage scope anchor) is a separate scope decision — not part of
this audit.

## IN_DB_NOT_IN_STATE — in our DB, no matching state license

These listings live in `master_listings` but we couldn't match them
to a record in the IDFPR active-license list. Causes to investigate
before taking action:

- Match logic missed it (different name variant, typo in address). Check manually.
- Dispensary is operating under a conditional (not-yet-active) license. Not in our scope until operational.
- Dispensary closed or surrendered its license. Candidate for `is_active=false`.
- Record is an aspirational seed (never opened). Candidate for deletion.

**Do not mass-deactivate.** Matthew decides per row.

| slug | name | city | address | is_active | license_number |
|---|---|---|---|---|---|
| `zen-leaf-aurora` | Zen Leaf Aurora | Aurora |  | true |  |
| `consume-cannabis-champaign` | Consume Cannabis | Champaign |  | true |  |
| `mood-shine-chicago-heights` | Mood Shine | Chicago Heights | 628 W Lincoln Hwy | true |  |
| `emerald-city-dispensary-chicago-il` | Emerald City Dispensary | Chicago | 1234 W Example Ave | true | IL-XXXX-1234 |
| `emerald-leaf-collective-chicago-il` | Emerald Leaf Collective | Chicago |  | true |  |
| `lakefront-cannabis-co-chicago-il` | Lakefront Cannabis Co. | Chicago |  | true |  |
| `hi5-dispensary-crestwood` | Hi5 Dispensary | Crestwood |  | true |  |
| `high-haven-elgin` | High Haven Elgin (The Record Store) | Elgin | 15 Clock Tower Plaza, Elgin, IL 60120 | true |  |
| `nature-treatment-galesburg` | Natures Treatment | Galesburg |  | true |  |
| `bisa-lina-joliet` | Bisa Lina | Joliet | 2121 W Jefferson St | true |  |
| `terrace-cannabis-moline` | Terrace Cannabis Moline | Moline | 2727 Avenue of the Cities, Moline, IL 61265 | true |  |
| `curaleaf-morris` | Curaleaf Morris | Morris | 2400 Hiawatha Pioneer Trail | true |  |
| `prairie-cannabis-naperville` | Prairie Cannabis | Naperville |  | true |  |
| `rise-dispensary-naperville` | Rise Dispensary Naperville | Naperville | 1700 Quincy Ave, Suite 103, Naperville, IL 60540 | true |  |
| `zen-leaf-naperville` | Zen Leaf Naperville | Naperville | 1516 N Naper Blvd, Naperville, IL 60563 | true |  |
| `beyond-hello-peoria` | Beyond Hello Peoria | Peoria | 7620 State Route 91 Ste A, Peoria, IL 61615 | true |  |
| `north-star-remedies-peoria-il` | North Star Remedies | Peoria |  | true |  |
| `bloom-wellness-quincy` | Bloom Wellness | Quincy |  | true |  |
| `bloom-wellness-quincy-west` | Bloom Wellness Quincy West | Quincy | 1837 Broadway St, Quincy, IL 62301 | true |  |
| `ascend-cannabis-downtown-springfield` | Ascend Cannabis Downtown Springfield | Springfield | 628 E Adams St, Springfield, IL 62701 | true |  |
| `ascend-cannabis-horizon-drive` | Ascend Cannabis Horizon Drive | Springfield | 3201 Horizon Dr, Springfield, IL 62703 | true |  |
| `ivy-hall-waukegan` | Ivy Hall Waukegan | Waukegan | 996 S Waukegan Rd, Waukegan, IL 60085 | true |  |
| `star-buds-westmont` | Star Buds Westmont | Westmont |  | true |  |

## MISMATCH — matched but name or address differs

Records where the fuzzy matcher linked a DB row to a state row, but
the name or address doesn't line up cleanly. Usually a data-freshness
issue (the state updated, we haven't) or a wrong-match false positive.

| slug | our name | state name | our address | state address | name ok | addr ok |
|---|---|---|---|---|---|---|
| `rise-effingham` | Rise Effingham | Rise | 1011 Ford Ave, Suite C, Effingham, IL 62401 | 1101 Ford Ave. Ste. C | ✓ | ✗ |

## Methodology

1. **Source acquisition.** Downloads the IDFPR combined PDF, extracts text with
   `pdftotext -layout` so column positions are preserved.
2. **Section scoping.** Only the "Active Adult Use Dispensing Organization
   Licenses" section is parsed — the Original Lottery / SECL conditional
   license lists (dispensaries that haven't opened yet) are intentionally
   skipped. Conditional licenses belong in our DB once they transition to
   operational status, not before.
3. **Record assembly.** Each record is anchored by its credential number
   (regex `\d{3}\.\d{6,7}-AUDO`). Lines within the nearest credential's
   gravity are joined and split by column boundary (holder / name / address /
   date / credential).
4. **Normalization.**
   - Names: lowercase, strip LLC/Inc/Dispensary/Cannabis/etc., collapse dashes, remove punctuation.
   - Addresses: lowercase, expand street abbreviations (Avenue→Ave, etc.), collapse whitespace.
   - License numbers: strip the period (`284.000319-AUDO` → `284000319-AUDO`) for comparison.
   - Cities: lowercase + trim.
5. **Matching (in priority order).**
   - Exact normalized license-number match.
   - Normalized name + city.
   - Normalized address + city.
   - Brand-first-token + city fuzzy fallback.

## What to do next

1. Review the IN_STATE_NOT_IN_DB list. For each row, confirm the state record
   is accurate (the state PDF has data-entry errors from time to time) and that
   the proposed slug matches our convention.
2. Apply `sql/migrations/2026-04-23-il-license-registry-sync.sql` via the
   Supabase SQL Editor or MCP.
3. Re-run the Google Places logo + GPS backfill with the new cities listed above.
4. Walk the IN_DB_NOT_IN_STATE list with Matthew to decide per row: deactivate,
   delete, or leave as-is with a research note.
5. For MISMATCH rows, investigate which version is canonical (usually the state).

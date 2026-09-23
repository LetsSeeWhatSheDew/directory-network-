// Verified ways-to-buy facts (9/23/26). Each row cites the store page it came from.
// Re-run: node scripts/seed-listing-features.mjs (needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY in env)
const SB=process.env.NEXT_PUBLIC_SUPABASE_URL,K=process.env.SUPABASE_SERVICE_KEY;
const H={apikey:K,Authorization:`Bearer ${K}`,"Content-Type":"application/json"};
const NE="https://nueracannabis.com/dispensaries/il/";
const R=(listing_slug,feature,status,evidence,source_url)=>({project_tag:"green",listing_slug,feature,status,evidence,source_url});
const rows=[
 R("nuera-east-peoria","medical","yes","Page title: “nuEra East Peoria Dispensary – Recreational & Medical Cannabis”",NE+"east-peoria/"),
 R("nuera-urbana","medical","yes","Page title: “nuEra Urbana Dispensary – Recreational & Medical Cannabis”",NE+"urbana/"),
 R("nuera-champaign","medical","yes","nuEra’s store menu lists “Champaign – Recreational · Medical”",NE+"champaign/"),
 R("nuera-pekin","medical","no","nuEra’s store menu lists Pekin as Recreational only",NE+"pekin/"),
 R("ivy-hall-dispensary","medical","yes","Page title: “Peoria Dispensary | Medical & Rec Cannabis | Ivy Hall”","https://ivyhalldispensary.com/locations/peoria/"),
 R("cookies-peoria-heights","medical","yes","Site banner: “MEDICAL LICENSE NOW LIVE! • 1% TAX WITH VALID MEDICAL CARD”","https://cookiespeoriaheights.com/"),
 R("cookies-bloomington","medical","yes","Site banner: “MEDICAL • NOW LIVE!”","http://cookiesbloomington.com/"),
 R("beyond-hello-normal","medical","yes","Store page links a Medical Menu and an Adult-Use Menu","https://beyond-hello.com/illinois-dispensaries/normal"),
 R("sunnyside-champaign","medical","yes","Page heading: “Champaign Recreational & Medical Marijuana Dispensary”","https://www.sunnyside.shop/menu/champaign-il/store/champaign-il"),
 R("ascend-cannabis-downtown-springfield","medical","yes","Store page: “We’re A Medical & Recreational Dispensary”","https://letsascend.com/locations/illinois/springfield-adams-street/"),
 R("nuera-east-peoria","curbside","yes","Store page: “Curbside Pickup”",NE+"east-peoria/"),
 R("nuera-urbana","curbside","yes","Store page: “Curbside pickup available at nuEra Urbana!”",NE+"urbana/"),
 R("cookies-bloomington","curbside","yes","Site banner: “PRE-PAID CURBSIDE PICK-UP • NOW AVAILABLE!”","http://cookiesbloomington.com/"),
 R("ascend-cannabis-downtown-springfield","curbside","yes","Store page: “Choose pickup or curbside”","https://letsascend.com/locations/illinois/springfield-adams-street/"),
 R("noxx-east-peoria","curbside","yes","Store site menu lists “Curbside Pickup”","https://noxx.com/location/noxx-peoria/"),
 ...["east-peoria","urbana","champaign","pekin"].map(c=>R(`nuera-${c}`,"order_ahead","yes","Store page: “Online ordering available”",NE+c+"/")),
 R("beyond-hello-bloomington","order_ahead","yes","Store page: “Online ordering and call ahead orders available”","https://beyond-hello.com/illinois-dispensaries/bloomington/"),
 R("beyond-hello-normal","order_ahead","yes","Store page: “Online ordering and call ahead orders available”","https://beyond-hello.com/illinois-dispensaries/normal"),
 R("beyond-hello-peoria","order_ahead","yes","Site: “Pre-order online for express in-store pickup at any of our Illinois locations”","https://beyond-hello.com/illinois-dispensaries/peoria"),
 R("share-springfield","order_ahead","yes","Site: “order online today”","http://everyoneshares.com/"),
 R("noxx-east-peoria","order_ahead","yes","Store site menu lists “Online Ordering” and “In-store Pickup”","https://noxx.com/location/noxx-peoria/"),
 R("the-dispensary-champaign","order_ahead","yes","Site: same-day online pre-ordering","https://www.thedispensaryfulton.com/"),
 R("maribis-springfield","order_ahead","yes","Site: “Save time & order ahead”","https://maribisllc.com/"),
 R("high-haven-normal","order_ahead","yes","Store page: “Order Online”","https://highhavencannabis.com/high-haven-normal-il-the-puff-palace/"),
 R("cookies-bloomington","order_ahead","yes","Site: “place your order online”","http://cookiesbloomington.com/"),
 R("ascend-cannabis-downtown-springfield","order_ahead","yes","Store page: “Skip the wait with pre-orders”","https://letsascend.com/locations/illinois/springfield-adams-street/"),
];
const r=await fetch(`${SB}/rest/v1/listing_features?on_conflict=project_tag,listing_slug,feature`,{method:"POST",headers:{...H,Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(rows)});
console.log("features",r.status,await r.text(),rows.length);
for(const [slug,w] of [["ascend-cannabis-downtown-springfield","https://letsascend.com/locations/illinois/springfield-adams-street/"],["ascend-cannabis-horizon-drive","https://letsascend.com/locations/illinois/springfield-horizon-drive/"]]){
 const x=await fetch(`${SB}/rest/v1/master_listings?slug=eq.${slug}&project_tag=eq.green`,{method:"PATCH",headers:H,body:JSON.stringify({website:w})});console.log(slug,x.status)}

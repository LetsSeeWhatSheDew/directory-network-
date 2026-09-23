const SB=process.env.NEXT_PUBLIC_SUPABASE_URL,K=process.env.SUPABASE_SERVICE_KEY;
const H={apikey:K,Authorization:`Bearer ${K}`,"Content-Type":"application/json"};
const C='("Peoria","East Peoria","Peoria Heights","Pekin","Bloomington","Normal","Champaign","Urbana","Springfield")';
const f=await (await fetch(`${SB}/rest/v1/listing_features?select=listing_slug,feature,status&project_tag=eq.green`,{headers:H})).json();
const oa=new Set(f.filter(x=>x.feature==="order_ahead"&&x.status==="yes").map(x=>x.listing_slug));
const dt=new Set(f.filter(x=>x.feature==="drive_thru"&&x.status==="yes").map(x=>x.listing_slug));
// Illinois delivery is illegal: nobody delivers. Clear unverified bulk defaults.
let r=await fetch(`${SB}/rest/v1/master_listings?project_tag=eq.green&state=eq.IL`,{method:"PATCH",headers:H,body:JSON.stringify({delivery:null})});console.log("delivery→null",r.status);
const L=await (await fetch(`${SB}/rest/v1/master_listings?select=slug&project_tag=eq.green&state=eq.IL&city=in.${encodeURIComponent(C)}`,{headers:H})).json();
for(const {slug} of L){await fetch(`${SB}/rest/v1/master_listings?slug=eq.${slug}&project_tag=eq.green`,{method:"PATCH",headers:H,body:JSON.stringify({online_ordering:oa.has(slug)?true:null,drive_thru:dt.has(slug)?true:null})})}
console.log("synced",L.length,"order-ahead",oa.size,"drive-thru",dt.size);

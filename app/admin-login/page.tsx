"use client";
import { Suspense } from "react";
import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [password, setPassword] = useState("");
  // Distinct error codes from /api/admin-auth so the user sees the real
  // reason — preview deploys without ADMIN_PASSWORD set were previously
  // showing "Incorrect password" which led to fruitless password retries.
  const [errorCode, setErrorCode] = useState<"" | "config_missing" | "bad_password">("");
  const [errorDetail, setErrorDetail] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/admin";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorCode("");
    setErrorDetail("");
    const res = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push(from);
      return;
    }
    let code: "config_missing" | "bad_password" = "bad_password";
    let detail = "";
    try {
      const body = await res.json();
      if (body?.error === "config_missing") code = "config_missing";
      if (typeof body?.message === "string") detail = body.message;
    } catch {}
    setErrorCode(code);
    setErrorDetail(detail);
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",background:"#f7f6f2",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif",padding:"24px"}}>
      <div style={{background:"#fff",borderRadius:"16px",border:"1px solid #e8e5de",padding:"40px",width:"100%",maxWidth:"380px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"28px"}}>
          <div style={{width:"10px",height:"10px",borderRadius:"50%",background:"#7DBA47"}}/>
          <span style={{fontSize:"1rem",fontWeight:700,color:"#1F3D2B",letterSpacing:"-.02em"}}>puff<span style={{color:"#7DBA47"}}>price</span></span>
        </div>
        <h1 style={{fontSize:"1.3rem",fontWeight:700,color:"#1F3D2B",marginBottom:"6px",letterSpacing:"-.02em"}}>Admin access</h1>
        <p style={{fontSize:".85rem",color:"#6b7280",marginBottom:"24px"}}>Enter your password to continue</p>
        <form onSubmit={handleSubmit}>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" autoFocus
            style={{width:"100%",padding:"10px 14px",border:errorCode?"1px solid #dc2626":"1px solid #e8e5de",borderRadius:"8px",fontSize:".95rem",outline:"none",marginBottom:"12px",boxSizing:"border-box",background:"#fff",color:"#1F3D2B"}}/>
          {errorCode === "bad_password" && (
            <p style={{fontSize:".8rem",color:"#dc2626",marginBottom:"12px"}}>Incorrect password. Try again.</p>
          )}
          {errorCode === "config_missing" && (
            <div style={{fontSize:".78rem",color:"#92400e",background:"#fef3c7",border:"1px solid #fcd34d",borderRadius:"8px",padding:"10px 12px",marginBottom:"12px",lineHeight:1.45}}>
              <strong style={{color:"#7c2d12"}}>Server not configured.</strong>
              <br />
              {errorDetail || "ADMIN_PASSWORD is missing for this deployment. Set it in the Vercel environment variables (Preview + Production) and redeploy."}
            </div>
          )}
          <button type="submit" disabled={loading||!password}
            style={{width:"100%",padding:"10px",background:loading||!password?"#9ca3af":"#1F3D2B",color:"#fff",border:"none",borderRadius:"8px",fontSize:".9rem",fontWeight:700,cursor:loading||!password?"not-allowed":"pointer"}}>
            {loading?"Signing in...":"Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",background:"#f7f6f2",display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{fontFamily:"system-ui",color:"#6b7280"}}>Loading...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}

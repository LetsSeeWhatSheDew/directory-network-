"use client";
import { Suspense } from "react";
import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/admin";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const res = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) { router.push(from); }
    else { setError(true); setLoading(false); }
  }

  return (
    <div style={{minHeight:"100vh",background:"#f7f6f2",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif",padding:"24px"}}>
      <div style={{background:"#fff",borderRadius:"16px",border:"1px solid #e8e5de",padding:"40px",width:"100%",maxWidth:"380px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"28px"}}>
          <div style={{width:"10px",height:"10px",borderRadius:"50%",background:"#16a34a"}}/>
          <span style={{fontSize:"1rem",fontWeight:700,color:"#0f1f3d",letterSpacing:"-.02em"}}>Directory<span style={{color:"#16a34a"}}>Network</span></span>
        </div>
        <h1 style={{fontSize:"1.3rem",fontWeight:700,color:"#0f1f3d",marginBottom:"6px",letterSpacing:"-.02em"}}>Admin access</h1>
        <p style={{fontSize:".85rem",color:"#6b7280",marginBottom:"24px"}}>Enter your password to continue</p>
        <form onSubmit={handleSubmit}>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" autoFocus
            style={{width:"100%",padding:"10px 14px",border:error?"1px solid #dc2626":"1px solid #e8e5de",borderRadius:"8px",fontSize:".95rem",outline:"none",marginBottom:"12px",boxSizing:"border-box",background:"#fff",color:"#0f1f3d"}}/>
          {error&&<p style={{fontSize:".8rem",color:"#dc2626",marginBottom:"12px"}}>Incorrect password. Try again.</p>}
          <button type="submit" disabled={loading||!password}
            style={{width:"100%",padding:"10px",background:loading||!password?"#9ca3af":"#0f1f3d",color:"#fff",border:"none",borderRadius:"8px",fontSize:".9rem",fontWeight:700,cursor:loading||!password?"not-allowed":"pointer"}}>
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

"use strict";(()=>{var e={};e.id=8194,e.ids=[8194],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},62847:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>x,patchFetch:()=>b,requestAsyncStorage:()=>g,routeModule:()=>h,serverHooks:()=>m,staticGenerationAsyncStorage:()=>y});var o={};r.r(o),r.d(o,{POST:()=>u,dynamic:()=>c});var i=r(49303),n=r(88716),a=r(60670),s=r(87070);async function l(e){let t=process.env.RESEND_API_KEY;if(!t)return console.log("[Email] RESEND_API_KEY not set, would send:",e.subject,"to",e.to),!0;try{return(await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${t}`,"Content-Type":"application/json"},body:JSON.stringify({from:e.from||"Propel <noreply@propelcoach.app>",to:[e.to],subject:e.subject,html:e.html})})).ok}catch(e){return console.error("[Email] Send failed:",e),!1}}function p(e,t=""){return`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Propel</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
${t?`<div style="display:none;max-height:0;overflow:hidden;">${t}</div>`:""}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px 40px;text-align:center;">
    <span style="color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">⚡ Propel</span>
  </td></tr>
  <tr><td style="padding:40px;">
    ${e}
  </td></tr>
  <tr><td style="background:#f4f4f5;padding:24px 40px;text-align:center;">
    <p style="margin:0;color:#9ca3af;font-size:12px;">\xa9 2026 Propel \xb7 <a href="#" style="color:#7c3aed;">Unsubscribe</a> \xb7 <a href="#" style="color:#7c3aed;">Privacy Policy</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`}async function d(e,t,r=0){return l({to:e,subject:`Your Propel trial: 7 days left ⏰`,html:p(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">One week in! 🏆</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">You're halfway through your free trial. ${r>0?`You have ${r} client${r>1?"s":""} already — great start!`:"Let's make the most of your remaining 7 days."}</p>
    <div style="background:#f0fdf4;border-radius:12px;padding:24px;margin:24px 0;border:1px solid #bbf7d0;">
      <h2 style="margin:0 0 8px;color:#16a34a;font-size:18px;">Your trial ends in 7 days</h2>
      <p style="margin:0;color:#374151;">Upgrade now to keep all your client data, programs, and check-in history. No interruption to your coaching.</p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL||"https://propelcoach.app"}/pricing" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">View Pricing Plans →</a>
  `,"7 days left in your trial — upgrade to keep everything")})}let c="force-dynamic",f={welcome:async function(e,t){let r=p(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">Welcome to Propel, ${t}! 🎉</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">You're 14 days away from transforming how you coach. Here's what to do first:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr><td style="padding:16px;background:#faf5ff;border-radius:8px;border-left:4px solid #7c3aed;margin-bottom:12px;">
        <strong style="color:#7c3aed;">Step 1:</strong> <span style="color:#374151;">Add your first client via the Clients tab</span>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">
      <tr><td style="padding:16px;background:#faf5ff;border-radius:8px;border-left:4px solid #7c3aed;">
        <strong style="color:#7c3aed;">Step 2:</strong> <span style="color:#374151;">Build a workout program and assign it</span>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">
      <tr><td style="padding:16px;background:#faf5ff;border-radius:8px;border-left:4px solid #7c3aed;">
        <strong style="color:#7c3aed;">Step 3:</strong> <span style="color:#374151;">Set macro targets for your client</span>
      </td></tr>
    </table>
    <a href="${process.env.NEXT_PUBLIC_APP_URL||"https://propelcoach.app"}/dashboard" style="display:inline-block;margin:24px 0 0;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Go to Dashboard →</a>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:14px;">Questions? Just reply to this email — we're here to help.</p>
  `,`Welcome to Propel, ${t}! Here's how to get started.`);return l({to:e,subject:`Welcome to Propel, ${t}! Here's your quick-start guide 🚀`,html:r})},day3:async function(e,t){let r=p(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">Day 3 Check-in 👋</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">Hey ${t}, you've had 3 days with Propel. Here's a tip to get more out of it:</p>
    <div style="background:#faf5ff;border-radius:12px;padding:24px;margin:24px 0;">
      <h2 style="margin:0 0 12px;color:#7c3aed;font-size:18px;">💡 Pro Tip: Use Check-in Templates</h2>
      <p style="margin:0;color:#374151;line-height:1.6;">Coaches who set up weekly check-in questions see 3x higher client engagement. Head to your dashboard and set up your first check-in template — it takes 2 minutes.</p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL||"https://propelcoach.app"}/dashboard/check-ins" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Set Up Check-ins →</a>
  `,"Day 3 tip: Check-in templates drive 3x engagement");return l({to:e,subject:`Quick tip for your coaching practice, ${t} 💡`,html:r})},day7:(e,t,r)=>d(e,t,r?.clientCount),trial_expiring_3day:async function(e,t){return l({to:e,subject:`⚠️ Your Propel trial expires in 3 days`,html:p(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">3 days left on your trial ⏳</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">Hey ${t}, your Propel trial expires in 3 days. Don't lose your data — upgrade now.</p>
    <div style="background:#fff7ed;border-radius:12px;padding:24px;margin:24px 0;border:1px solid #fed7aa;">
      <h2 style="margin:0 0 8px;color:#ea580c;font-size:18px;">⚠️ What happens when your trial ends</h2>
      <ul style="margin:8px 0 0;padding-left:20px;color:#374151;line-height:2;">
        <li>Your client profiles will be locked</li>
        <li>Check-in history will be archived</li>
        <li>Your programs will be saved but uneditable</li>
      </ul>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL||"https://propelcoach.app"}/pricing" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Upgrade Before It Expires →</a>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:14px;">Starter plan is just $29/mo. Cancel anytime.</p>
  `,"Trial expires in 3 days — upgrade to keep your data")})},trial_expiring_1day:async function(e,t){return l({to:e,subject:`🚨 Final notice: Your Propel trial ends tomorrow`,html:p(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">Last chance — trial ends tomorrow 🚨</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">Hey ${t}, this is your final reminder. Your trial ends tomorrow.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL||"https://propelcoach.app"}/pricing" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:8px;font-weight:700;font-size:18px;">Upgrade Now — Keep Everything →</a>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:14px;">Still unsure? Reply to this email and we'll help you pick the right plan.</p>
  `,"Trial ends tomorrow — upgrade now")})},trial_expired:async function(e,t){return l({to:e,subject:`Your Propel trial has ended — reactivate anytime`,html:p(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">Your trial has ended</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">Hey ${t}, your Propel trial has expired. Your data is safe — upgrade anytime to get back in.</p>
    <div style="background:#faf5ff;border-radius:12px;padding:24px;margin:24px 0;">
      <p style="margin:0;color:#374151;font-weight:600;">✅ All your client data is preserved</p>
      <p style="margin:8px 0 0;color:#374151;font-weight:600;">✅ Programs and check-ins are saved</p>
      <p style="margin:8px 0 0;color:#374151;font-weight:600;">✅ Upgrade and pick up right where you left off</p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL||"https://propelcoach.app"}/trial/expired" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Reactivate My Account →</a>
  `,"Your data is safe — reactivate anytime")})},payment_failed:async function(e,t){return l({to:e,subject:`⚠️ Payment failed for your Propel subscription`,html:p(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">Payment issue — action needed</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">Hey ${t}, we couldn't process your last payment. Please update your payment method to avoid service interruption.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL||"https://propelcoach.app"}/dashboard/payments" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Update Payment Method →</a>
  `,"Update your payment method")})},win_back:async function(e,t){let r=p(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">We miss you, ${t} 👋</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">It's been a while since you've used Propel. We've been busy adding new features:</p>
    <ul style="color:#374151;line-height:2;font-size:15px;">
      <li>📊 Body fat % tracking alongside weight</li>
      <li>🎥 Loom video check-in feedback</li>
      <li>📋 Printable PDF progress reports</li>
      <li>🏆 Client gamification and habit streaks</li>
    </ul>
    <a href="${process.env.NEXT_PUBLIC_APP_URL||"https://propelcoach.app"}/pricing" style="display:inline-block;margin-top:16px;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Come Back — First Month 20% Off →</a>
  `,"New features + 20% off to welcome you back");return l({to:e,subject:`We've added a lot since you left, ${t} 🚀`,html:r})}};async function u(e){try{let{type:t,email:r,name:o,extra:i}=await e.json(),n=f[t];if(!n)return s.NextResponse.json({error:"Unknown email type"},{status:400});let a=await n(r,o,i);return s.NextResponse.json({success:a})}catch(e){return s.NextResponse.json({error:e.message},{status:500})}}let h=new i.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/email/send/route",pathname:"/api/email/send",filename:"route",bundlePath:"app/api/email/send/route"},resolvedPagePath:"/Users/charlesbettiol/.openclaw/workspace/web/src/app/api/email/send/route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:g,staticGenerationAsyncStorage:y,serverHooks:m}=h,x="/api/email/send/route";function b(){return(0,a.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:y})}},79925:e=>{var t=Object.defineProperty,r=Object.getOwnPropertyDescriptor,o=Object.getOwnPropertyNames,i=Object.prototype.hasOwnProperty,n={};function a(e){var t;let r=["path"in e&&e.path&&`Path=${e.path}`,"expires"in e&&(e.expires||0===e.expires)&&`Expires=${("number"==typeof e.expires?new Date(e.expires):e.expires).toUTCString()}`,"maxAge"in e&&"number"==typeof e.maxAge&&`Max-Age=${e.maxAge}`,"domain"in e&&e.domain&&`Domain=${e.domain}`,"secure"in e&&e.secure&&"Secure","httpOnly"in e&&e.httpOnly&&"HttpOnly","sameSite"in e&&e.sameSite&&`SameSite=${e.sameSite}`,"partitioned"in e&&e.partitioned&&"Partitioned","priority"in e&&e.priority&&`Priority=${e.priority}`].filter(Boolean),o=`${e.name}=${encodeURIComponent(null!=(t=e.value)?t:"")}`;return 0===r.length?o:`${o}; ${r.join("; ")}`}function s(e){let t=new Map;for(let r of e.split(/; */)){if(!r)continue;let e=r.indexOf("=");if(-1===e){t.set(r,"true");continue}let[o,i]=[r.slice(0,e),r.slice(e+1)];try{t.set(o,decodeURIComponent(null!=i?i:"true"))}catch{}}return t}function l(e){var t,r;if(!e)return;let[[o,i],...n]=s(e),{domain:a,expires:l,httponly:c,maxage:f,path:u,samesite:h,secure:g,partitioned:y,priority:m}=Object.fromEntries(n.map(([e,t])=>[e.toLowerCase(),t]));return function(e){let t={};for(let r in e)e[r]&&(t[r]=e[r]);return t}({name:o,value:decodeURIComponent(i),domain:a,...l&&{expires:new Date(l)},...c&&{httpOnly:!0},..."string"==typeof f&&{maxAge:Number(f)},path:u,...h&&{sameSite:p.includes(t=(t=h).toLowerCase())?t:void 0},...g&&{secure:!0},...m&&{priority:d.includes(r=(r=m).toLowerCase())?r:void 0},...y&&{partitioned:!0}})}((e,r)=>{for(var o in r)t(e,o,{get:r[o],enumerable:!0})})(n,{RequestCookies:()=>c,ResponseCookies:()=>f,parseCookie:()=>s,parseSetCookie:()=>l,stringifyCookie:()=>a}),e.exports=((e,n,a,s)=>{if(n&&"object"==typeof n||"function"==typeof n)for(let a of o(n))i.call(e,a)||void 0===a||t(e,a,{get:()=>n[a],enumerable:!(s=r(n,a))||s.enumerable});return e})(t({},"__esModule",{value:!0}),n);var p=["strict","lax","none"],d=["low","medium","high"],c=class{constructor(e){this._parsed=new Map,this._headers=e;let t=e.get("cookie");if(t)for(let[e,r]of s(t))this._parsed.set(e,{name:e,value:r})}[Symbol.iterator](){return this._parsed[Symbol.iterator]()}get size(){return this._parsed.size}get(...e){let t="string"==typeof e[0]?e[0]:e[0].name;return this._parsed.get(t)}getAll(...e){var t;let r=Array.from(this._parsed);if(!e.length)return r.map(([e,t])=>t);let o="string"==typeof e[0]?e[0]:null==(t=e[0])?void 0:t.name;return r.filter(([e])=>e===o).map(([e,t])=>t)}has(e){return this._parsed.has(e)}set(...e){let[t,r]=1===e.length?[e[0].name,e[0].value]:e,o=this._parsed;return o.set(t,{name:t,value:r}),this._headers.set("cookie",Array.from(o).map(([e,t])=>a(t)).join("; ")),this}delete(e){let t=this._parsed,r=Array.isArray(e)?e.map(e=>t.delete(e)):t.delete(e);return this._headers.set("cookie",Array.from(t).map(([e,t])=>a(t)).join("; ")),r}clear(){return this.delete(Array.from(this._parsed.keys())),this}[Symbol.for("edge-runtime.inspect.custom")](){return`RequestCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`}toString(){return[...this._parsed.values()].map(e=>`${e.name}=${encodeURIComponent(e.value)}`).join("; ")}},f=class{constructor(e){var t,r,o;this._parsed=new Map,this._headers=e;let i=null!=(o=null!=(r=null==(t=e.getSetCookie)?void 0:t.call(e))?r:e.get("set-cookie"))?o:[];for(let e of Array.isArray(i)?i:function(e){if(!e)return[];var t,r,o,i,n,a=[],s=0;function l(){for(;s<e.length&&/\s/.test(e.charAt(s));)s+=1;return s<e.length}for(;s<e.length;){for(t=s,n=!1;l();)if(","===(r=e.charAt(s))){for(o=s,s+=1,l(),i=s;s<e.length&&"="!==(r=e.charAt(s))&&";"!==r&&","!==r;)s+=1;s<e.length&&"="===e.charAt(s)?(n=!0,s=i,a.push(e.substring(t,o)),t=s):s=o+1}else s+=1;(!n||s>=e.length)&&a.push(e.substring(t,e.length))}return a}(i)){let t=l(e);t&&this._parsed.set(t.name,t)}}get(...e){let t="string"==typeof e[0]?e[0]:e[0].name;return this._parsed.get(t)}getAll(...e){var t;let r=Array.from(this._parsed.values());if(!e.length)return r;let o="string"==typeof e[0]?e[0]:null==(t=e[0])?void 0:t.name;return r.filter(e=>e.name===o)}has(e){return this._parsed.has(e)}set(...e){let[t,r,o]=1===e.length?[e[0].name,e[0].value,e[0]]:e,i=this._parsed;return i.set(t,function(e={name:"",value:""}){return"number"==typeof e.expires&&(e.expires=new Date(e.expires)),e.maxAge&&(e.expires=new Date(Date.now()+1e3*e.maxAge)),(null===e.path||void 0===e.path)&&(e.path="/"),e}({name:t,value:r,...o})),function(e,t){for(let[,r]of(t.delete("set-cookie"),e)){let e=a(r);t.append("set-cookie",e)}}(i,this._headers),this}delete(...e){let[t,r,o]="string"==typeof e[0]?[e[0]]:[e[0].name,e[0].path,e[0].domain];return this.set({name:t,path:r,domain:o,value:"",expires:new Date(0)})}[Symbol.for("edge-runtime.inspect.custom")](){return`ResponseCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`}toString(){return[...this._parsed.values()].map(a).join("; ")}}},92044:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{RequestCookies:function(){return o.RequestCookies},ResponseCookies:function(){return o.ResponseCookies}});let o=r(79925)}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[8948,5972],()=>r(62847));module.exports=o})();
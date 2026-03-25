"use strict";(()=>{var e={};e.id=2757,e.ids=[2757],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},32081:e=>{e.exports=require("child_process")},6113:e=>{e.exports=require("crypto")},82361:e=>{e.exports=require("events")},13685:e=>{e.exports=require("http")},95687:e=>{e.exports=require("https")},4455:(e,t,o)=>{o.r(t),o.d(t,{originalPathname:()=>_,patchFetch:()=>P,requestAsyncStorage:()=>b,routeModule:()=>m,serverHooks:()=>k,staticGenerationAsyncStorage:()=>w});var r={};o.r(r),o.d(r,{POST:()=>x,dynamic:()=>c});var a=o(49303),i=o(88716),s=o(60670),n=o(87070),p=o(89777),l=o(37857),d=o(20471);let c="force-dynamic",u=new p.Z(process.env.STRIPE_SECRET_KEY||"sk_test_placeholder"),f=process.env.NEXT_PUBLIC_SUPABASE_URL||"https://placeholder.supabase.co",h=process.env.SUPABASE_SERVICE_ROLE_KEY||"placeholder",g=(0,l.eI)(f,h),y=process.env.STRIPE_WEBHOOK_SECRET||"placeholder";async function x(e){try{let o;let r=await e.text(),a=e.headers.get("stripe-signature");if(!a)return n.NextResponse.json({error:"Missing stripe-signature header"},{status:400});try{o=u.webhooks.constructEvent(r,a,y)}catch(e){return console.error("Webhook signature verification error:",e),n.NextResponse.json({error:"Invalid signature"},{status:400})}if("checkout.session.completed"===o.type){let e=o.data.object,t=e.metadata?.supabase_user_id,r=e.metadata?.plan;if(t&&e.customer){let{error:o}=await g.from("profiles").update({stripe_customer_id:e.customer,subscription_status:"trialing",plan:r||null}).eq("id",t);o&&console.error("Failed to update profile after checkout:",o)}}if("customer.subscription.updated"===o.type){var t;let e=o.data.object,r=e.customer,a={active:"active",past_due:"past_due",canceled:"canceled",trialing:"trialing",incomplete:"incomplete",incomplete_expired:"incomplete_expired",unpaid:"unpaid",paused:"paused"}[t=e.status]||t,{error:i}=await g.from("profiles").update({subscription_status:a}).eq("stripe_customer_id",r);i&&console.error("Failed to update subscription status:",i)}if("customer.subscription.deleted"===o.type){let e=o.data.object.customer,{error:t}=await g.from("profiles").update({subscription_status:"canceled"}).eq("stripe_customer_id",e);t&&console.error("Failed to update subscription status to canceled:",t)}if("invoice.payment_succeeded"===o.type){let e=o.data.object,t=e.customer,r=new Date(1e3*(e.paid_at||Math.floor(Date.now()/1e3))).toISOString(),{error:a}=await g.from("profiles").update({last_payment_date:r}).eq("stripe_customer_id",t);a&&console.error("Failed to update last payment date:",a)}if("invoice.payment_failed"===o.type){let e=o.data.object.customer,{error:t}=await g.from("profiles").update({subscription_status:"past_due"}).eq("stripe_customer_id",e);t&&console.error("Failed to update subscription status to past_due:",t);let{data:r}=await g.from("profiles").select("email, full_name").eq("stripe_customer_id",e).single();r?.email&&await (0,d.Ui)(r.email,r.full_name||"Coach")}return n.NextResponse.json({received:!0},{status:200})}catch(e){return console.error("Webhook processing error:",e),n.NextResponse.json({received:!0},{status:200})}}let m=new a.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/stripe/webhook/route",pathname:"/api/stripe/webhook",filename:"route",bundlePath:"app/api/stripe/webhook/route"},resolvedPagePath:"/Users/charlesbettiol/.openclaw/workspace/web/src/app/api/stripe/webhook/route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:b,staticGenerationAsyncStorage:w,serverHooks:k}=m,_="/api/stripe/webhook/route";function P(){return(0,s.patchFetch)({serverHooks:k,staticGenerationAsyncStorage:w})}},20471:(e,t,o)=>{async function r(e){let t=process.env.RESEND_API_KEY;if(!t)return console.log("[Email] RESEND_API_KEY not set, would send:",e.subject,"to",e.to),!0;try{return(await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${t}`,"Content-Type":"application/json"},body:JSON.stringify({from:e.from||"Propel <noreply@propelcoach.app>",to:[e.to],subject:e.subject,html:e.html})})).ok}catch(e){return console.error("[Email] Send failed:",e),!1}}function a(e,t=""){return`<!DOCTYPE html>
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
    <p style="margin:0;color:#9ca3af;font-size:12px;">\xa9 2026 Propel \xb7 <a href="mailto:hello@propelcoaches.com?subject=Unsubscribe" style="color:#7c3aed;">Unsubscribe</a> \xb7 <a href="https://propelcoaches.com/privacy-policy" style="color:#7c3aed;">Privacy Policy</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`}async function i(e,t){let o=a(`
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
  `,`Welcome to Propel, ${t}! Here's how to get started.`);return r({to:e,subject:`Welcome to Propel, ${t}! Here's your quick-start guide 🚀`,html:o})}async function s(e,t){let o=a(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">Day 3 Check-in 👋</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">Hey ${t}, you've had 3 days with Propel. Here's a tip to get more out of it:</p>
    <div style="background:#faf5ff;border-radius:12px;padding:24px;margin:24px 0;">
      <h2 style="margin:0 0 12px;color:#7c3aed;font-size:18px;">💡 Pro Tip: Use Check-in Templates</h2>
      <p style="margin:0;color:#374151;line-height:1.6;">Coaches who set up weekly check-in questions see 3x higher client engagement. Head to your dashboard and set up your first check-in template — it takes 2 minutes.</p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL||"https://propelcoach.app"}/dashboard/check-ins" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Set Up Check-ins →</a>
  `,"Day 3 tip: Check-in templates drive 3x engagement");return r({to:e,subject:`Quick tip for your coaching practice, ${t} 💡`,html:o})}async function n(e,t,o=0){return r({to:e,subject:`Your Propel trial: 7 days left ⏰`,html:a(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">One week in! 🏆</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">You're halfway through your free trial. ${o>0?`You have ${o} client${o>1?"s":""} already — great start!`:"Let's make the most of your remaining 7 days."}</p>
    <div style="background:#f0fdf4;border-radius:12px;padding:24px;margin:24px 0;border:1px solid #bbf7d0;">
      <h2 style="margin:0 0 8px;color:#16a34a;font-size:18px;">Your trial ends in 7 days</h2>
      <p style="margin:0;color:#374151;">Upgrade now to keep all your client data, programs, and check-in history. No interruption to your coaching.</p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL||"https://propelcoach.app"}/pricing" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">View Pricing Plans →</a>
  `,"7 days left in your trial — upgrade to keep everything")})}async function p(e,t){return r({to:e,subject:`⚠️ Your Propel trial expires in 3 days`,html:a(`
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
  `,"Trial expires in 3 days — upgrade to keep your data")})}async function l(e,t){return r({to:e,subject:`🚨 Final notice: Your Propel trial ends tomorrow`,html:a(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">Last chance — trial ends tomorrow 🚨</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">Hey ${t}, this is your final reminder. Your trial ends tomorrow.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL||"https://propelcoach.app"}/pricing" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:8px;font-weight:700;font-size:18px;">Upgrade Now — Keep Everything →</a>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:14px;">Still unsure? Reply to this email and we'll help you pick the right plan.</p>
  `,"Trial ends tomorrow — upgrade now")})}async function d(e,t){return r({to:e,subject:`Your Propel trial has ended — reactivate anytime`,html:a(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">Your trial has ended</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">Hey ${t}, your Propel trial has expired. Your data is safe — upgrade anytime to get back in.</p>
    <div style="background:#faf5ff;border-radius:12px;padding:24px;margin:24px 0;">
      <p style="margin:0;color:#374151;font-weight:600;">✅ All your client data is preserved</p>
      <p style="margin:8px 0 0;color:#374151;font-weight:600;">✅ Programs and check-ins are saved</p>
      <p style="margin:8px 0 0;color:#374151;font-weight:600;">✅ Upgrade and pick up right where you left off</p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL||"https://propelcoach.app"}/trial/expired" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Reactivate My Account →</a>
  `,"Your data is safe — reactivate anytime")})}async function c(e,t){return r({to:e,subject:`⚠️ Payment failed for your Propel subscription`,html:a(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">Payment issue — action needed</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">Hey ${t}, we couldn't process your last payment. Please update your payment method to avoid service interruption.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL||"https://propelcoach.app"}/dashboard/payments" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Update Payment Method →</a>
  `,"Update your payment method")})}async function u(e,t){let o=a(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">We miss you, ${t} 👋</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">It's been a while since you've used Propel. We've been busy adding new features:</p>
    <ul style="color:#374151;line-height:2;font-size:15px;">
      <li>📊 Body fat % tracking alongside weight</li>
      <li>🎥 Loom video check-in feedback</li>
      <li>📋 Printable PDF progress reports</li>
      <li>🏆 Client gamification and habit streaks</li>
    </ul>
    <a href="${process.env.NEXT_PUBLIC_APP_URL||"https://propelcoach.app"}/pricing" style="display:inline-block;margin-top:16px;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Come Back — First Month 20% Off →</a>
  `,"New features + 20% off to welcome you back");return r({to:e,subject:`We've added a lot since you left, ${t} 🚀`,html:o})}o.d(t,{MU:()=>u,Pi:()=>i,Ui:()=>c,ZT:()=>p,eq:()=>l,g0:()=>n,h7:()=>s,tl:()=>d})}};var t=require("../../../../webpack-runtime.js");t.C(e);var o=e=>t(t.s=e),r=t.X(0,[8948,3786,5972,9777],()=>o(4455));module.exports=r})();
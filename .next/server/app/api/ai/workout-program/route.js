"use strict";(()=>{var e={};e.id=8131,e.ids=[8131],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},77397:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>w,patchFetch:()=>y,requestAsyncStorage:()=>_,routeModule:()=>g,serverHooks:()=>f,staticGenerationAsyncStorage:()=>h});var s={};t.r(s),t.d(s,{POST:()=>m,dynamic:()=>l});var o=t(49303),a=t(88716),n=t(60670),i=t(87070),p=t(65655),u=t(21664);let l="force-dynamic",c=new u.ZP({apiKey:process.env.OPENAI_API_KEY||"sk-placeholder"}),d={push_pull_legs:{3:["Push","Pull","Legs"],4:["Push","Pull","Legs","Upper"],5:["Push","Pull","Legs","Push","Pull"],6:["Push","Pull","Legs","Push","Pull","Legs"]},upper_lower:{2:["Upper","Lower"],3:["Upper","Lower","Full Body"],4:["Upper","Lower","Upper","Lower"],5:["Upper","Lower","Upper","Lower","Upper"],6:["Upper","Lower","Upper","Lower","Upper","Lower"]},full_body:{2:["Full Body A","Full Body B"],3:["Full Body A","Full Body B","Full Body C"],4:["Full Body A","Full Body B","Full Body C","Full Body D"]},bro_split:{4:["Chest/Triceps","Back/Biceps","Shoulders/Abs","Legs"],5:["Chest","Back","Shoulders","Arms","Legs"],6:["Chest","Back","Shoulders","Arms","Quads/Calves","Hamstrings/Glutes"]}};async function m(e){try{let r=(0,p.e)(),{data:{user:t},error:s}=await r.auth.getUser();if(s||!t)return i.NextResponse.json({error:"Unauthorized"},{status:401});let{client_id:o,title:a,goal:n,experience_level:u,days_per_week:l,session_duration_minutes:m=60,equipment_available:g=[],injuries_limitations:_="",preferred_split:h="auto",notes:f,program_length_weeks:w=4}=await e.json();if(!o||!n||!l)return i.NextResponse.json({error:"Missing required fields"},{status:400});let y=function(e){let r="auto"!==e.preferred_split?`USE THIS SPLIT: ${e.preferred_split.replace(/_/g," ")} — ${d[e.preferred_split]?.[e.days_per_week]?.join(", ")||"assign appropriate focus per day"}`:`Choose the optimal training split for ${e.days_per_week} days/week given the goal.`;return`Design a complete ${e.program_length_weeks}-week training program (output week 1 as the template):

GOAL: ${e.goal.replace(/_/g," ")}
EXPERIENCE LEVEL: ${e.experience_level}
TRAINING DAYS PER WEEK: ${e.days_per_week}
SESSION DURATION: ~${e.session_duration_minutes} minutes
EQUIPMENT AVAILABLE: ${e.equipment_available.length>0?e.equipment_available.join(", "):"Full gym"}
${e.injuries_limitations?`INJURIES/LIMITATIONS: ${e.injuries_limitations}`:""}
${r}
${e.notes?`ADDITIONAL NOTES: ${e.notes}`:""}

PROGRAMMING GUIDELINES:
- ${"hypertrophy"===e.goal?"Focus on 8-15 rep range, moderate-heavy loads, sufficient volume (10-20 sets/muscle group/week)":""}
- ${"strength"===e.goal?"Focus on 3-6 rep range for compounds, include accessory work at higher reps":""}
- ${"fat_loss"===e.goal?"Include compound movements, circuits, and higher rep ranges. Minimize rest times.":""}
- ${"athletic_performance"===e.goal?"Include explosive movements, compound lifts, and sport-specific conditioning":""}
- ${"general_fitness"===e.goal?"Balance of compound movements, moderate volume, mix of rep ranges":""}
- Include progressive overload notes
- ${"beginner"===e.experience_level?"Stick to fundamental movement patterns, avoid complex lifts":""}
- ${"advanced"===e.experience_level?"Include advanced techniques like drop sets, supersets, rest-pause where appropriate":""}
- Mark warm-up sets explicitly
- Group supersets with matching superset_group letters (A, B, C...)

Return JSON with this EXACT structure:
{
  "program_description": "<2-3 sentence overview of the program>",
  "progression_notes": "<how to progress week over week>",
  "days": [
    {
      "day_number": 1,
      "name": "<e.g. Push Day>",
      "focus": "<primary muscle groups>",
      "estimated_duration_minutes": <number>,
      "notes": "<optional day-level coaching cues>",
      "exercises": [
        {
          "exercise_name": "<full exercise name>",
          "muscle_group": "<primary muscle group>",
          "sets": <number>,
          "reps": "<rep range as string, e.g. '8-12' or '5'>",
          "rpe": <number or null>,
          "rest_seconds": <number>,
          "tempo": "<tempo string or null>",
          "notes": "<form cues, progression notes>",
          "superset_group": "<letter or null>",
          "is_warmup": <boolean>
        }
      ]
    }
  ]
}

RULES:
- Day numbers go from 1 to ${e.days_per_week}
- Each day must have 6-10 exercises (including warm-up sets)
- First 1-2 exercises per day should be compound movements
- Include at least one warm-up set marked with is_warmup: true per major compound
- RPE should be a number 6-10 or null
- Rest seconds: 60-90 for isolation, 120-180 for compounds, 30-45 for circuits
- All values must match the JSON types specified above`}({goal:n,experience_level:u,days_per_week:l,session_duration_minutes:m,equipment_available:g,injuries_limitations:_,preferred_split:h,notes:f,program_length_weeks:w}),v=await c.chat.completions.create({model:"gpt-4o",messages:[{role:"system",content:"You are an expert strength & conditioning coach and exercise scientist. You design periodized, evidence-based training programs. Always return valid JSON matching the exact schema requested. Use proper exercise names, prescribe appropriate set/rep ranges for the goal, and include warm-up sets where appropriate."},{role:"user",content:y}],response_format:{type:"json_object"},temperature:.7,max_tokens:12e3}),x=JSON.parse(v.choices[0].message.content||"{}");if(!x.days||!Array.isArray(x.days))return i.NextResponse.json({error:"AI returned invalid format"},{status:500});let{data:k,error:A}=await r.from("workout_programs").insert({coach_id:t.id,client_id:o,title:a||`${n.replace("_"," ")} Program`,description:x.program_description||"",status:"draft",goal:n,experience_level:u,days_per_week:l,session_duration_minutes:m,equipment_available:g,injuries_limitations:_,preferred_split:h,program_length_weeks:w,ai_generated:!0,notes:f}).select().single();if(A)return console.error("Error creating program:",A),i.NextResponse.json({error:"Failed to save program"},{status:500});for(let e of x.days){let{data:t,error:s}=await r.from("workout_days").insert({program_id:k.id,day_number:e.day_number,name:e.name,focus:e.focus,notes:e.notes||"",estimated_duration_minutes:e.estimated_duration_minutes||m}).select().single();if(s){console.error("Error creating workout day:",s);continue}for(let s=0;s<e.exercises.length;s++){let o=e.exercises[s];await r.from("workout_exercises").insert({workout_day_id:t.id,sort_order:s,exercise_name:o.exercise_name,muscle_group:o.muscle_group,sets:o.sets,reps:o.reps,rpe:o.rpe||null,rest_seconds:o.rest_seconds,tempo:o.tempo||null,notes:o.notes||"",superset_group:o.superset_group||null,is_warmup:o.is_warmup||!1})}}let{data:P}=await r.from("workout_programs").select(`
        *,
        workout_days(*, workout_exercises(*))
      `).eq("id",k.id).single();return i.NextResponse.json({program:P})}catch(e){return console.error("Workout program generation error:",e),i.NextResponse.json({error:"Failed to generate program"},{status:500})}}let g=new o.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/ai/workout-program/route",pathname:"/api/ai/workout-program",filename:"route",bundlePath:"app/api/ai/workout-program/route"},resolvedPagePath:"/Users/charlesbettiol/.openclaw/workspace/web/src/app/api/ai/workout-program/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:_,staticGenerationAsyncStorage:h,serverHooks:f}=g,w="/api/ai/workout-program/route";function y(){return(0,n.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:h})}},38238:(e,r)=>{Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"ReflectAdapter",{enumerable:!0,get:function(){return t}});class t{static get(e,r,t){let s=Reflect.get(e,r,t);return"function"==typeof s?s.bind(e):s}static set(e,r,t,s){return Reflect.set(e,r,t,s)}static has(e,r){return Reflect.has(e,r)}static deleteProperty(e,r){return Reflect.deleteProperty(e,r)}}},65655:(e,r,t)=>{t.d(r,{e:()=>a});var s=t(67721),o=t(71615);function a(){let e=(0,o.cookies)();return(0,s.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>e.getAll(),setAll(r){try{r.forEach(({name:r,value:t,options:s})=>e.set(r,t,s))}catch{}}}})}}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[8948,3786,9702,5972,1664],()=>t(77397));module.exports=s})();
"use strict";(()=>{var e={};e.id=432,e.ids=[432],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},90777:(e,s,r)=>{r.r(s),r.d(s,{originalPathname:()=>g,patchFetch:()=>w,requestAsyncStorage:()=>d,routeModule:()=>c,serverHooks:()=>h,staticGenerationAsyncStorage:()=>_});var t={};r.r(t),r.d(t,{POST:()=>u,dynamic:()=>p});var n=r(49303),o=r(88716),a=r(60670),i=r(80213),l=r(87070);let p="force-dynamic";async function u(e){let{clientName:s,goal:r,experience:t,injuries:n,daysPerWeek:o,weeks:a,sessionLength:p,split:u,equipment:c,repRanges:d,trainingStyle:_,cardio:h,priorityExercises:g,avoidExercises:w,progressionModel:x,deload:y,includeTempo:b,includeRpe:f,additionalNotes:k}=await e.json();if(!process.env.ANTHROPIC_API_KEY)return await new Promise(e=>setTimeout(e,1800)),l.NextResponse.json({program:m(o,a,r)});let v=new i.ZP,P={full_gym:"Full commercial gym (barbells, cables, machines, dumbbells)",home_barbell:"Home gym with barbell and dumbbells",dumbbells_only:"Dumbbells only",bodyweight:"Bodyweight only (no equipment)"},$=`You are an elite strength and conditioning coach building a professional training program.

CLIENT PROFILE:
- Name: ${s}
- Experience: ${t}
- Injuries / Limitations: ${n||"None"}

PROGRAM SPECS:
- Goal: ${{hypertrophy:"Maximum muscle hypertrophy",strength:"Maximal strength (powerlifting-style)",fat_loss:"Fat loss while preserving muscle",athletic_performance:"Athletic performance and power",general_fitness:"General fitness and health",powerlifting:"Competitive powerlifting (Squat / Bench / Deadlift)"}[r]??r}
- Split: ${{full_body:"Full body (each session trains all muscle groups)",upper_lower:"Upper / Lower split",ppl:"Push / Pull / Legs",bro_split:"Body-part split",ai_decides:"Optimal split for the goal"}[u]??u}
- Duration: ${a} weeks, ${o} days/week
- Session length: ${p} min (${"45"===p?"4–5 exercises":"60"===p?"5–6 exercises":"75"===p?"6–7 exercises":"7–9 exercises"})
- Equipment: ${P[c]??c}
- Rep ranges: ${d}
- Training style: ${_}
- Cardio: ${h}
- Progression model: ${{linear:"Linear progression (add weight each session/week)",dup:"Daily undulating periodisation (DUP)",wave:"Wave loading across weeks",ai_decides:"Optimal periodisation for the goal"}[x]??x}
- Deload: ${{every_4:"Planned deload every 4th week (reduce volume 40–50%)",every_8:"Planned deload every 8th week",auto:"Auto-regulate — deload when performance drops",none:"No deload"}[y]??y}
- Include tempo: ${b?"Yes":"No"}
- Include RPE: ${f?"Yes":"No"}
- Must include: ${g||"none"}
- Avoid: ${w||"none"}
- Notes: ${k||"none"}

Return ONLY valid JSON in this exact format (no markdown):

{
  "name": "Program name",
  "description": "2–3 sentence professional description",
  "coaching_notes": "Bullet points separated by \\n",
  "progression_notes": "Specific week-by-week progression",
  "deload_notes": "Deload instructions or N/A",
  "goal": "${r}",
  "difficulty": "${t}",
  "days": [
    {
      "day_number": 1,
      "name": "Session name",
      "session_notes": "Focus for this session",
      "exercises": [
        {
          "name": "Exercise name",
          "muscle_group": "Primary muscle",
          "sets": 4,
          "reps_min": 8,
          "reps_max": 10,
          "rpe": ${f?7:"null"},
          "tempo": ${b?'"3010"':"null"},
          "rest_seconds": 120,
          "notes": "Coaching cue",
          "superset_with_next": false
        }
      ]
    }
  ]
}

Generate exactly ${o} day objects. Equipment: ${P[c]??c}. Avoid: ${w||"nothing"}.`;try{let e=await v.messages.create({model:"claude-sonnet-4-6",max_tokens:6e3,messages:[{role:"user",content:$}]}),s=("text"===e.content[0].type?e.content[0].text:"").match(/\{[\s\S]*\}/);if(!s)return l.NextResponse.json({program:m(o,a,r)});let t=JSON.parse(s[0]);return l.NextResponse.json({program:t})}catch{return l.NextResponse.json({program:m(o,a,r)})}}function m(e,s,r="hypertrophy"){let t="strength"===r||"powerlifting"===r,n=[{name:"Upper A — Strength Focus",session_notes:"Lead with heavy compounds. Control the eccentric on every rep.",exercises:[{name:"Barbell Bench Press",muscle_group:"Chest",sets:4,reps_min:t?3:8,reps_max:t?5:10,rest_seconds:t?180:120,notes:"Retract scapulae, drive through the bar"},{name:"Barbell Row",muscle_group:"Back",sets:4,reps_min:t?4:8,reps_max:t?6:10,rest_seconds:t?180:120,notes:"Pull elbows back, squeeze at the top"},{name:"Overhead Press",muscle_group:"Shoulders",sets:3,reps_min:8,reps_max:10,rest_seconds:90,notes:"Brace core, press in a slight arc"},{name:"Lat Pulldown",muscle_group:"Back",sets:3,reps_min:10,reps_max:12,rest_seconds:75,notes:"Initiate with elbows, think elbows to hips"},{name:"Tricep Pushdown",muscle_group:"Triceps",sets:3,reps_min:12,reps_max:15,rest_seconds:60,notes:"Lock upper arms, squeeze at lockout"}]},{name:"Lower A — Squat Focus",session_notes:"Squat depth and bracing are the priority today.",exercises:[{name:"Barbell Back Squat",muscle_group:"Legs",sets:4,reps_min:t?3:6,reps_max:t?5:8,rest_seconds:t?210:150,notes:"Full depth, knees tracking toes"},{name:"Romanian Deadlift",muscle_group:"Hamstrings",sets:3,reps_min:10,reps_max:12,rest_seconds:90,notes:"Hinge at hips, feel the hamstring stretch"},{name:"Leg Press",muscle_group:"Legs",sets:3,reps_min:12,reps_max:15,rest_seconds:90,notes:"Drive through heels, avoid knee cave"},{name:"Walking Lunges",muscle_group:"Legs",sets:3,reps_min:12,reps_max:14,rest_seconds:75,notes:"Keep torso upright, long strides"},{name:"Calf Raise",muscle_group:"Calves",sets:4,reps_min:15,reps_max:20,rest_seconds:60,notes:"Full range, pause at top"}]},{name:"Upper B — Volume Focus",session_notes:"Higher volume. Push quality reps even when fatigued.",exercises:[{name:"Incline Dumbbell Press",muscle_group:"Chest",sets:4,reps_min:10,reps_max:12,rest_seconds:90,notes:"Elbows at 45\xb0, controlled eccentric"},{name:"Pull Up",muscle_group:"Back",sets:4,reps_min:6,reps_max:10,rest_seconds:90,notes:"Full hang, chin over bar"},{name:"Dumbbell Lateral Raise",muscle_group:"Shoulders",sets:4,reps_min:15,reps_max:20,rest_seconds:60,notes:"Slight forward lean, lead with elbows"},{name:"Seated Cable Row",muscle_group:"Back",sets:3,reps_min:12,reps_max:14,rest_seconds:75,notes:"Squeeze shoulder blades at finish"},{name:"Barbell Curl",muscle_group:"Biceps",sets:3,reps_min:10,reps_max:14,rest_seconds:60,notes:"Control the negative, no swinging"}]},{name:"Lower B — Hip Hinge Focus",session_notes:"Deadlift is king today. Treat accessory work seriously.",exercises:[{name:"Deadlift",muscle_group:"Back",sets:4,reps_min:t?3:5,reps_max:t?5:6,rest_seconds:210,notes:"Bar over mid-foot, push the floor away"},{name:"Hip Thrust",muscle_group:"Glutes",sets:4,reps_min:10,reps_max:12,rest_seconds:90,notes:"Drive to full hip extension"},{name:"Bulgarian Split Squat",muscle_group:"Legs",sets:3,reps_min:10,reps_max:12,rest_seconds:90,notes:"Front foot placement is key"},{name:"Leg Curl",muscle_group:"Hamstrings",sets:3,reps_min:12,reps_max:15,rest_seconds:75,notes:"Full range, squeeze at the top"},{name:"Plank",muscle_group:"Core",sets:3,reps_min:30,reps_max:45,rest_seconds:60,notes:"Straight line head to heel"}]},{name:"Push — Chest, Shoulders & Triceps",session_notes:"Attack the shoulders after the heavy press.",exercises:[{name:"Barbell Bench Press",muscle_group:"Chest",sets:4,reps_min:8,reps_max:10,rest_seconds:120,notes:"Arch maintained, drive from chest"},{name:"Incline Dumbbell Press",muscle_group:"Chest",sets:3,reps_min:10,reps_max:12,rest_seconds:90,notes:"Upper chest focus"},{name:"Overhead Press",muscle_group:"Shoulders",sets:3,reps_min:8,reps_max:10,rest_seconds:90,notes:"Brace core throughout"},{name:"Lateral Raise",muscle_group:"Shoulders",sets:4,reps_min:15,reps_max:20,rest_seconds:60,notes:"Raise to shoulder height only"},{name:"Skull Crusher",muscle_group:"Triceps",sets:3,reps_min:10,reps_max:14,rest_seconds:60,notes:"Lower to forehead, press up and back"}]},{name:"Pull — Back & Biceps",session_notes:"Deadlift starts the session heavy.",exercises:[{name:"Deadlift",muscle_group:"Back",sets:3,reps_min:5,reps_max:6,rest_seconds:180,notes:"Lat engagement throughout"},{name:"Pull Up",muscle_group:"Back",sets:4,reps_min:6,reps_max:10,rest_seconds:90,notes:"Full hang, lead with elbows"},{name:"Barbell Row",muscle_group:"Back",sets:3,reps_min:8,reps_max:10,rest_seconds:90,notes:"Horizontal pull — elbow path matters"},{name:"Face Pull",muscle_group:"Rear Delts",sets:4,reps_min:15,reps_max:20,rest_seconds:60,notes:"External rotation emphasis"},{name:"Hammer Curl",muscle_group:"Biceps",sets:3,reps_min:12,reps_max:15,rest_seconds:60,notes:"Neutral grip, slow the descent"}]}],o=Array.from({length:Math.min(e,6)},(e,s)=>({day_number:s+1,name:n[s%n.length].name,session_notes:n[s%n.length].session_notes,exercises:n[s%n.length].exercises.map(e=>({...e,rpe:7,tempo:null,superset_with_next:!1}))}));return{name:`${s}-Week ${e}\xd7/Week ${"hypertrophy"===r?"Hypertrophy":"strength"===r?"Strength":"Fitness"} Program`,description:`A professionally designed ${s}-week program built around ${e} sessions per week. Progressive overload is baked in week-over-week to drive continuous adaptation.`,coaching_notes:"• Quality reps over ego weight — technique first\n• Log every session — data drives progress\n• Eat 1.6–2.2g protein per kg bodyweight\n• Sleep 7–9 hours — where adaptation happens\n• Tell your coach immediately if anything causes pain",progression_notes:`Add 2.5 kg to main compound lifts weekly. On isolation exercises, increase reps by 1 each session until hitting the top of the range, then add weight and reset. From week ${Math.ceil(s/2)}: shift to heavier loads.`,deload_notes:"Deload week: keep sets and reps the same but reduce load 40–50%. Focus on movement quality.",goal:r,difficulty:"intermediate",days:o}}let c=new n.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/ai/generate-workout/route",pathname:"/api/ai/generate-workout",filename:"route",bundlePath:"app/api/ai/generate-workout/route"},resolvedPagePath:"/Users/charlesbettiol/.openclaw/workspace/web/src/app/api/ai/generate-workout/route.ts",nextConfigOutput:"",userland:t}),{requestAsyncStorage:d,staticGenerationAsyncStorage:_,serverHooks:h}=c,g="/api/ai/generate-workout/route";function w(){return(0,a.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:_})}}};var s=require("../../../../webpack-runtime.js");s.C(e);var r=e=>s(s.s=e),t=s.X(0,[8948,5972,3105],()=>r(90777));module.exports=t})();
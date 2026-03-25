"use strict";(()=>{var e={};e.id=6386,e.ids=[6386],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63248:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>b,patchFetch:()=>E,requestAsyncStorage:()=>y,routeModule:()=>g,serverHooks:()=>h,staticGenerationAsyncStorage:()=>f});var r={};a.r(r),a.d(r,{POST:()=>_,dynamic:()=>p});var n=a(49303),s=a(88716),i=a(60670),o=a(87070),l=a(65655),c=a(21664);let p="force-dynamic",m=new c.ZP({apiKey:process.env.OPENAI_API_KEY||"sk-placeholder"}),u={3:["breakfast","lunch","dinner"],4:["breakfast","snack_1","lunch","dinner"],5:["breakfast","snack_1","lunch","snack_2","dinner"],6:["breakfast","snack_1","lunch","snack_2","dinner","snack_3"]},d=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];async function _(e){try{var t;let a=(0,l.e)(),{data:{user:r},error:n}=await a.auth.getUser();if(n||!r)return o.NextResponse.json({error:"Unauthorized"},{status:401});let{client_id:s,title:i,target_calories:c,target_protein_g:p,target_carbs_g:_,target_fat_g:g,dietary_preferences:y=[],allergies:f=[],cuisine_preferences:h=[],meals_per_day:b=4,notes:E}=await e.json();if(!s||!c||!p||!_||!g)return o.NextResponse.json({error:"Missing required fields"},{status:400});let A=u[b]||u[4],x=(t={target_calories:c,target_protein_g:p,target_carbs_g:_,target_fat_g:g,dietary_preferences:y,allergies:f,cuisine_preferences:h,meals_per_day:b,mealTypes:A,notes:E},`Generate a complete 7-day meal plan with the following requirements:

DAILY MACRO TARGETS:
- Calories: ${t.target_calories} kcal (\xb150 kcal tolerance per day)
- Protein: ${t.target_protein_g}g (\xb15g tolerance)
- Carbs: ${t.target_carbs_g}g (\xb110g tolerance)
- Fat: ${t.target_fat_g}g (\xb15g tolerance)

MEALS PER DAY: ${t.meals_per_day}
MEAL TYPES TO USE: ${t.mealTypes.join(", ")}

${t.dietary_preferences.length>0?`DIETARY PREFERENCES: ${t.dietary_preferences.join(", ")}`:""}
${t.allergies.length>0?`ALLERGIES/INTOLERANCES (MUST AVOID): ${t.allergies.join(", ")}`:""}
${t.cuisine_preferences.length>0?`CUISINE PREFERENCES: ${t.cuisine_preferences.join(", ")}`:""}
${t.notes?`ADDITIONAL NOTES: ${t.notes}`:""}

Return JSON with this EXACT structure:
{
  "days": [
    {
      "day_number": 1,
      "total_calories": <number>,
      "total_protein_g": <number>,
      "total_carbs_g": <number>,
      "total_fat_g": <number>,
      "meals": [
        {
          "meal_type": "<one of: ${t.mealTypes.join(", ")}>",
          "name": "<meal name>",
          "description": "<1-2 sentence description>",
          "prep_time_minutes": <number>,
          "cook_time_minutes": <number>,
          "servings": 1,
          "calories": <number>,
          "protein_g": <number>,
          "carbs_g": <number>,
          "fat_g": <number>,
          "fiber_g": <number>,
          "ingredients": [
            {"name": "<ingredient>", "amount": "<quantity>", "unit": "<unit>"}
          ],
          "instructions": ["<step 1>", "<step 2>"]
        }
      ]
    }
  ],
  "shopping_list": [
    {"category": "<Produce|Protein|Dairy|Grains|Pantry|Frozen|Other>", "name": "<item>", "amount": "<total for week>", "unit": "<unit>", "checked": false}
  ]
}

RULES:
- Each day must have exactly ${t.meals_per_day} meals
- Day numbers go from 1 (Monday) to 7 (Sunday)
- Vary meals across days — do not repeat the same meal more than twice in the week
- Shopping list should aggregate ingredients across all 7 days
- All macro values must be numbers (not strings)
- Include fiber for each meal
- Keep recipes practical — under 30 min prep for most meals
- Snacks should be quick and simple`),k=await m.chat.completions.create({model:"gpt-4o",messages:[{role:"system",content:`You are an expert sports nutritionist and meal planning AI. You create detailed, practical meal plans with accurate macro counts. Always return valid JSON matching the exact schema requested. Be creative with meals — avoid repeating the same meal across days. Use whole, minimally processed foods where possible.`},{role:"user",content:x}],response_format:{type:"json_object"},temperature:.8,max_tokens:16e3}),S=JSON.parse(k.choices[0].message.content||"{}");if(!S.days||!Array.isArray(S.days))return o.NextResponse.json({error:"AI returned invalid format"},{status:500});let{data:P,error:R}=await a.from("meal_plans").insert({coach_id:r.id,client_id:s,title:i||`${c}kcal Meal Plan`,status:"draft",target_calories:c,target_protein_g:p,target_carbs_g:_,target_fat_g:g,dietary_preferences:y,allergies:f,cuisine_preferences:h,meals_per_day:b,notes:E,ai_model:"gpt-4o"}).select().single();if(R)return console.error("Error creating meal plan:",R),o.NextResponse.json({error:"Failed to save meal plan"},{status:500});for(let e of S.days){let{data:t,error:r}=await a.from("meal_plan_days").insert({meal_plan_id:P.id,day_number:e.day_number,day_label:d[e.day_number-1],total_calories:e.total_calories,total_protein_g:e.total_protein_g,total_carbs_g:e.total_carbs_g,total_fat_g:e.total_fat_g}).select().single();if(r){console.error("Error creating meal plan day:",r);continue}for(let r=0;r<e.meals.length;r++){let n=e.meals[r];await a.from("meal_plan_meals").insert({meal_plan_day_id:t.id,meal_type:n.meal_type,sort_order:r,name:n.name,description:n.description,prep_time_minutes:n.prep_time_minutes,cook_time_minutes:n.cook_time_minutes,servings:n.servings||1,calories:n.calories,protein_g:n.protein_g,carbs_g:n.carbs_g,fat_g:n.fat_g,fiber_g:n.fiber_g,ingredients:n.ingredients,instructions:n.instructions})}}S.shopping_list&&await a.from("meal_plan_shopping_lists").insert({meal_plan_id:P.id,items:S.shopping_list});let{data:v}=await a.from("meal_plans").select(`
        *,
        meal_plan_days (
          *,
          meal_plan_meals (*)
        ),
        meal_plan_shopping_lists (*)
      `).eq("id",P.id).single();return o.NextResponse.json({meal_plan:v})}catch(e){return console.error("Meal plan generation error:",e),o.NextResponse.json({error:"Failed to generate meal plan"},{status:500})}}let g=new n.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/ai/meal-plan/route",pathname:"/api/ai/meal-plan",filename:"route",bundlePath:"app/api/ai/meal-plan/route"},resolvedPagePath:"/Users/charlesbettiol/.openclaw/workspace/web/src/app/api/ai/meal-plan/route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:y,staticGenerationAsyncStorage:f,serverHooks:h}=g,b="/api/ai/meal-plan/route";function E(){return(0,i.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:f})}},38238:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"ReflectAdapter",{enumerable:!0,get:function(){return a}});class a{static get(e,t,a){let r=Reflect.get(e,t,a);return"function"==typeof r?r.bind(e):r}static set(e,t,a,r){return Reflect.set(e,t,a,r)}static has(e,t){return Reflect.has(e,t)}static deleteProperty(e,t){return Reflect.deleteProperty(e,t)}}},65655:(e,t,a)=>{a.d(t,{e:()=>s});var r=a(67721),n=a(71615);function s(){let e=(0,n.cookies)();return(0,r.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>e.getAll(),setAll(t){try{t.forEach(({name:t,value:a,options:r})=>e.set(t,a,r))}catch{}}}})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[8948,3786,9702,5972,1664],()=>a(63248));module.exports=r})();
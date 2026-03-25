"use strict";(()=>{var e={};e.id=9199,e.ids=[9199],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},85510:(e,a,t)=>{t.r(a),t.d(a,{originalPathname:()=>g,patchFetch:()=>b,requestAsyncStorage:()=>p,routeModule:()=>d,serverHooks:()=>y,staticGenerationAsyncStorage:()=>f});var i={};t.r(i),t.d(i,{POST:()=>c,dynamic:()=>m});var n=t(49303),o=t(88716),r=t(60670),s=t(80213),l=t(87070);let m="force-dynamic";async function c(e){let{clientName:a,goal:t,age:i,sex:n,weightKg:o,heightCm:r,activityLevel:m,calories:c,protein:d,carbs:p,fats:f,planDays:y,mealsPerDay:g,dietType:b,restrictions:h,lovedFoods:k,dislikedFoods:v,supplements:_,cookingSkill:q,budget:w,cuisines:$,mealPrepStyle:S,additionalNotes:x}=await e.json();if(!process.env.ANTHROPIC_API_KEY)return await new Promise(e=>setTimeout(e,2200)),l.NextResponse.json({plan:u(y??7,g??4,c,d,p,f)});let P=new s.ZP,A={minimal:"Minimal prep — foods that take under 10 minutes, no cooking skills needed",simple:"Simple cooking — 10–30 minutes, basic kitchen skills",comfortable:"Comfortable — 30–60 minutes, comfortable in the kitchen",advanced:"Advanced — 60+ minutes, enjoys cooking and meal prep"},N=`You are an expert sports dietitian creating a professional, personalised nutrition plan.

CLIENT PROFILE:
- Name: ${a}
- Age: ${i||"Not provided"}, Sex: ${n||"Not provided"}
- Weight: ${o?`${o} kg`:"Not provided"}, Height: ${r?`${r} cm`:"Not provided"}
- Activity Level: ${{sedentary:"Sedentary (desk job, minimal exercise)",light:"Lightly active (1–3 days/week exercise)",moderate:"Moderately active (3–5 days/week)",active:"Very active (6–7 days/week hard exercise)",very_active:"Extremely active (twice daily or physical job)"}[m]??m}

NUTRITION TARGETS:
- Primary Goal: ${{muscle_gain:"Build muscle mass (caloric surplus)",fat_loss:"Lose body fat while preserving muscle (caloric deficit)",recomposition:"Body recomposition (build muscle, lose fat simultaneously)",performance:"Optimise athletic performance and recovery",health:"General health and longevity",maintenance:"Maintain current body composition"}[t]??t}
- Daily Calories: ${c} kcal
- Daily Protein: ${d}g
- Daily Carbohydrates: ${p}g
- Daily Fats: ${f}g
- Plan Duration: ${y} days
- Meals Per Day: ${g}

DIETARY PROFILE:
- Diet Type: ${{standard:"Standard balanced diet",high_protein:"High protein (30%+ of calories from protein)",low_carb:"Low carbohydrate (under 100g carbs/day)",ketogenic:"Ketogenic (under 50g carbs/day, high fat)",mediterranean:"Mediterranean diet (olive oil, fish, vegetables, legumes)",intermittent_fasting:"Intermittent fasting (16:8 or 18:6 eating window)",plant_based:"Plant-based (vegetarian, may include eggs/dairy)",vegan:"Fully vegan (no animal products)"}[b]??b}
- Restrictions / Allergies: ${h?.join(", ")||"None"}
- Foods They Love: ${k||"No preference stated"}
- Foods They Dislike or Must Avoid: ${v||"None stated"}
- Supplements to Integrate: ${_?.join(", ")||"None"}

LIFESTYLE:
- Cooking Skill: ${A[q]??q}
- Budget: ${"budget"===w?"Budget-friendly (minimise cost)":"moderate"===w?"Moderate budget":"No budget constraint"}
- Cuisine Preferences: ${$?.join(", ")||"No preference"}
- Meal Prep Style: ${"fresh_daily"===S?"Prefers to cook fresh each day":"meal_prep"===S?"Meal preps in bulk weekly":"Mix of fresh cooking and batch prep"}
- Additional Notes: ${x||"None"}

Create a ${y}-day meal plan with ${g} meals per day. Hit macro targets within \xb15% each day. Make it feel achievable for this client's cooking skill and lifestyle.

Return ONLY valid JSON — no markdown — in this exact format:

{
  "plan_name": "Descriptive plan name",
  "description": "2–3 sentence description of the plan approach and expected outcomes",
  "dietitian_notes": "Key bullet points of nutrition guidance, separated by \\n",
  "daily_calories": ${c},
  "daily_protein": ${d},
  "daily_carbs": ${p},
  "daily_fats": ${f},
  "days": [
    {
      "day_number": 1,
      "day_name": "Monday",
      "meals": [
        {
          "meal_name": "Breakfast",
          "time": "07:30",
          "meal_notes": "Preparation tips for this meal",
          "foods": [
            {
              "name": "Food item name",
              "quantity": 80,
              "unit": "g",
              "cal100": 389,
              "pro100": 17,
              "carb100": 66,
              "fat100": 7,
              "fibre100": 10,
              "sodium100": 6
            }
          ]
        }
      ]
    }
  ]
}

CRITICAL RULES:
1. cal100, pro100, carb100, fat100, fibre100, sodium100 are ALL per 100g or 100ml of the food — NOT for the given quantity
2. Round quantities to practical amounts (e.g. 80g oats, 200g chicken, 250ml milk — not 137g or 183ml)
3. Each day must hit exactly ${c}\xb150 kcal, ${d}\xb15g protein
4. Vary meals significantly across all ${y} days — no repeated breakfasts
5. Use realistic, commonly available ingredients
6. Respect ALL dietary restrictions strictly: ${h?.join(", ")||"none"}
7. Completely avoid: ${v||"nothing stated"}
8. Incorporate loved foods where appropriate: ${k||"none stated"}
9. Cooking complexity must match ${A[q]??q}
10. unit must be one of: "g", "ml", "piece", "tbsp", "tsp", "cup", "oz", "L", "kg"
11. Include ${g} meals per day — name them appropriately (e.g. Breakfast, Morning Snack, Lunch, Afternoon Snack, Dinner, Evening Snack)
12. If supplements are included, add them as food items (e.g. "Whey Protein" 30g in appropriate meals)`;try{let e=await P.messages.create({model:"claude-sonnet-4-6",max_tokens:1e4,messages:[{role:"user",content:N}]}),a=("text"===e.content[0].type?e.content[0].text:"").match(/\{[\s\S]*\}/);if(!a)return l.NextResponse.json({plan:u(y,g,c,d,p,f)});let t=JSON.parse(a[0]);return l.NextResponse.json({plan:t})}catch{return l.NextResponse.json({plan:u(y,g,c,d,p,f)})}}function u(e=7,a=4,t=2200,i=165,n=230,o=75){let r=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],s=[{meal_name:"Afternoon Snack",time:"15:30",meal_notes:"Grab and go — perfect pre-workout if training in the evening.",foods:[{name:"Cottage Cheese",quantity:200,unit:"g",cal100:98,pro100:11,carb100:3.4,fat100:4.3,fibre100:0,sodium100:364},{name:"Rice Cakes",quantity:30,unit:"g",cal100:387,pro100:8,carb100:82,fat100:3,fibre100:1,sodium100:25}]},{meal_name:"Morning Snack",time:"10:30",meal_notes:"Quick snack between breakfast and lunch.",foods:[{name:"Apple",quantity:150,unit:"g",cal100:52,pro100:.3,carb100:14,fat100:.2,fibre100:2.4,sodium100:1},{name:"Almonds",quantity:30,unit:"g",cal100:579,pro100:21,carb100:22,fat100:50,fibre100:12.5,sodium100:1}]}],l=[[{meal_name:"Breakfast",time:"07:30",meal_notes:"Cook oats with water, stir in protein powder off heat. Top with fruit.",foods:[{name:"Rolled Oats",quantity:80,unit:"g",cal100:389,pro100:17,carb100:66,fat100:7,fibre100:10.6,sodium100:6},{name:"Whey Protein",quantity:30,unit:"g",cal100:380,pro100:75,carb100:8,fat100:6,fibre100:1,sodium100:200},{name:"Blueberries",quantity:100,unit:"g",cal100:57,pro100:.7,carb100:14.5,fat100:.3,fibre100:2.4,sodium100:1},{name:"Almond Milk",quantity:250,unit:"ml",cal100:17,pro100:.6,carb100:.7,fat100:1.1,fibre100:.4,sodium100:65}]},{meal_name:"Breakfast",time:"07:00",meal_notes:"Scramble eggs with spinach. Toast in parallel.",foods:[{name:"Whole Eggs",quantity:3,unit:"piece",cal100:155,pro100:13,carb100:1.1,fat100:11,fibre100:0,sodium100:124},{name:"Egg Whites",quantity:100,unit:"g",cal100:52,pro100:11,carb100:.7,fat100:.2,fibre100:0,sodium100:166},{name:"Whole Grain Toast",quantity:60,unit:"g",cal100:247,pro100:9,carb100:47,fat100:3,fibre100:6,sodium100:380},{name:"Avocado",quantity:80,unit:"g",cal100:160,pro100:2,carb100:9,fat100:15,fibre100:6.7,sodium100:7}]},{meal_name:"Breakfast",time:"08:00",meal_notes:"Greek yoghurt bowl. Layer yoghurt, granola, and fruit. Add honey last.",foods:[{name:"Greek Yoghurt (0% fat)",quantity:250,unit:"g",cal100:59,pro100:10,carb100:3.6,fat100:.4,fibre100:0,sodium100:36},{name:"Granola",quantity:50,unit:"g",cal100:471,pro100:10,carb100:64,fat100:20,fibre100:5,sodium100:15},{name:"Banana",quantity:120,unit:"g",cal100:89,pro100:1.1,carb100:23,fat100:.3,fibre100:2.6,sodium100:1},{name:"Honey",quantity:15,unit:"g",cal100:304,pro100:.3,carb100:82,fat100:0,fibre100:.2,sodium100:4}]}],[{meal_name:"Lunch",time:"12:30",meal_notes:"Meal prep friendly — batch cook chicken and rice on Sunday.",foods:[{name:"Chicken Breast",quantity:200,unit:"g",cal100:165,pro100:31,carb100:0,fat100:3.6,fibre100:0,sodium100:74},{name:"White Rice (cooked)",quantity:200,unit:"g",cal100:130,pro100:2.7,carb100:28,fat100:.3,fibre100:.4,sodium100:1},{name:"Broccoli",quantity:150,unit:"g",cal100:34,pro100:2.8,carb100:7,fat100:.4,fibre100:2.6,sodium100:33},{name:"Olive Oil",quantity:10,unit:"ml",cal100:884,pro100:0,carb100:0,fat100:100,fibre100:0,sodium100:2}]},{meal_name:"Lunch",time:"12:00",meal_notes:"Build wrap and eat fresh. Great for on-the-go.",foods:[{name:"Turkey Breast (sliced)",quantity:150,unit:"g",cal100:135,pro100:29,carb100:0,fat100:1,fibre100:0,sodium100:70},{name:"Whole Wheat Wrap",quantity:65,unit:"g",cal100:292,pro100:9,carb100:54,fat100:5,fibre100:6,sodium100:495},{name:"Baby Spinach",quantity:50,unit:"g",cal100:23,pro100:2.9,carb100:3.6,fat100:.4,fibre100:2.2,sodium100:79},{name:"Hummus",quantity:40,unit:"g",cal100:177,pro100:8,carb100:14,fat100:10,fibre100:4,sodium100:379}]},{meal_name:"Lunch",time:"13:00",meal_notes:"Batch cook minced beef sauce and portion for the week.",foods:[{name:"Lean Beef Mince (90%)",quantity:180,unit:"g",cal100:215,pro100:26,carb100:0,fat100:12,fibre100:0,sodium100:79},{name:"Pasta (dry)",quantity:80,unit:"g",cal100:371,pro100:13,carb100:75,fat100:1.5,fibre100:2.7,sodium100:6},{name:"Tomato Pasta Sauce",quantity:100,unit:"g",cal100:35,pro100:1.5,carb100:7,fat100:.3,fibre100:1.5,sodium100:320}]}],[{meal_name:"Dinner",time:"18:30",meal_notes:"Bake salmon at 200\xb0C for 18 minutes. Steam sweet potato in microwave 8 mins.",foods:[{name:"Atlantic Salmon",quantity:200,unit:"g",cal100:208,pro100:20,carb100:0,fat100:13,fibre100:0,sodium100:59},{name:"Sweet Potato",quantity:250,unit:"g",cal100:86,pro100:1.6,carb100:20,fat100:.1,fibre100:3,sodium100:55},{name:"Asparagus",quantity:120,unit:"g",cal100:20,pro100:2.2,carb100:3.9,fat100:.1,fibre100:2.1,sodium100:2},{name:"Olive Oil",quantity:10,unit:"ml",cal100:884,pro100:0,carb100:0,fat100:100,fibre100:0,sodium100:2}]},{meal_name:"Dinner",time:"19:00",meal_notes:"Stir-fry on high heat for 6–8 minutes. Season with soy sauce and sesame oil.",foods:[{name:"Chicken Breast",quantity:200,unit:"g",cal100:165,pro100:31,carb100:0,fat100:3.6,fibre100:0,sodium100:74},{name:"Brown Rice (cooked)",quantity:180,unit:"g",cal100:123,pro100:2.7,carb100:26,fat100:1,fibre100:1.8,sodium100:4},{name:"Mixed Vegetables",quantity:200,unit:"g",cal100:42,pro100:2.4,carb100:8,fat100:.3,fibre100:2.5,sodium100:40},{name:"Olive Oil",quantity:8,unit:"ml",cal100:884,pro100:0,carb100:0,fat100:100,fibre100:0,sodium100:2}]},{meal_name:"Dinner",time:"18:00",meal_notes:"Sheet pan meal — all in the oven at 200\xb0C for 25 min.",foods:[{name:"Sirloin Steak",quantity:200,unit:"g",cal100:271,pro100:26,carb100:0,fat100:18,fibre100:0,sodium100:54},{name:"Baby Potatoes",quantity:200,unit:"g",cal100:77,pro100:2,carb100:17,fat100:.1,fibre100:1.8,sodium100:6},{name:"Green Beans",quantity:150,unit:"g",cal100:31,pro100:1.8,carb100:7,fat100:.2,fibre100:3.4,sodium100:6},{name:"Olive Oil",quantity:10,unit:"ml",cal100:884,pro100:0,carb100:0,fat100:100,fibre100:0,sodium100:2}]}]];return{plan_name:`${e}-Day Nutrition Plan`,description:`A ${e}-day balanced meal plan targeting ${t} kcal/day with high protein to support your goals. Meals are practical, tasty, and designed for consistency.`,dietitian_notes:"• Hit your protein target every day — it's non-negotiable for body composition\n• Drink 2.5–3.5L of water daily\n• Eat vegetables at every main meal\n• Time carbohydrates around training for best performance\n• Track for the first 2 weeks, then trust your instincts",daily_calories:t,daily_protein:i,daily_carbs:n,daily_fats:o,days:Array.from({length:Math.min(e,7)},(e,t)=>{let i=[];for(let e=0;e<Math.min(a,3);e++){let a=l[e];i.push(a[t%a.length])}return a>3&&i.splice(2,0,s[t%s.length]),a>4&&i.push({meal_name:"Evening Snack",time:"20:30",meal_notes:"Slow-digesting protein before bed supports overnight muscle repair.",foods:[{name:"Casein Protein",quantity:30,unit:"g",cal100:360,pro100:72,carb100:8,fat100:2,fibre100:1,sodium100:200},{name:"Skim Milk",quantity:200,unit:"ml",cal100:34,pro100:3.4,carb100:5,fat100:.1,fibre100:0,sodium100:44}]}),{day_number:t+1,day_name:r[t%7],meals:i}})}}let d=new n.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/ai/generate-meal-plan/route",pathname:"/api/ai/generate-meal-plan",filename:"route",bundlePath:"app/api/ai/generate-meal-plan/route"},resolvedPagePath:"/Users/charlesbettiol/.openclaw/workspace/web/src/app/api/ai/generate-meal-plan/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:p,staticGenerationAsyncStorage:f,serverHooks:y}=d,g="/api/ai/generate-meal-plan/route";function b(){return(0,r.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:f})}}};var a=require("../../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),i=a.X(0,[8948,5972,3105],()=>t(85510));module.exports=i})();
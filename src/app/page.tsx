import Link from 'next/link'

export const metadata = {
  title: 'Propel Coaches â The coaching platform that propels your practice',
  description: 'One platform for personal trainers, dietitians, and exercise physiologists. A powerful web dashboard, a coach app, and a beautiful client experience â plus an AI coach that works while you sleep.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* âââ Header âââ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-gray-900">
            <div className="w-8 h-8 rounded-lg bg-[#0F7B8C] flex items-center justify-center text-white text-sm font-bold">P</div>
            Propel
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#platform" className="hover:text-gray-900 transition-colors">Platform</a>
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[#0F7B8C] hover:text-[#0d6b7a] transition-colors">
              Log in
            </Link>
            <Link href="/register" className="bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      {/* âââ Hero âââ */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <p className="text-sm font-semibold text-[#0F7B8C] mb-4 tracking-wide uppercase">The all-in-one coaching platform</p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
                The platform that<br />
                <span className="text-[#0F7B8C]">propels your practice</span>
              </h1>
              <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-lg">
                A powerful coach dashboard, a beautiful client app, and an AI assistant that works while you sleep.
                Programs, nutrition, check-ins, messaging, and payments â all in one place.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-[#0F7B8C]/20">
                  Start free trial <span aria-hidden="true">â</span>
                </Link>
                <a href="#platform" className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-2xl text-base transition-colors hover:border-gray-300 hover:bg-gray-50">
                  See the platform
                </a>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-gray-400">
                <span>14-day free trial</span>
                <span>No credit card required</span>
                <span>Cancel anytime</span>
              </div>
            </div>

            {/* Right â Phone Mockups */}
            <div className="relative h-[580px] hidden md:block">
              {/* Left phone â Nutrition */}
              <div className="absolute left-4 top-12 w-[180px] z-10 transform -rotate-3">
                <div className="bg-gray-900 rounded-[28px] p-[5px] shadow-2xl">
                  <div className="rounded-[24px] overflow-hidden">
                    <img src="/screenshots/nutrition.png" alt="Nutrition tracking and meal plans" className="w-full h-auto block" />
                  </div>
                </div>
              </div>

              {/* Center phone â Home / Dashboard */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[210px] z-20">
                <div className="bg-gray-900 rounded-[30px] p-[5px] shadow-2xl shadow-black/30">
                  <div className="rounded-[26px] overflow-hidden">
                    <img src="/screenshots/home.png" alt="Athlete home dashboard" className="w-full h-auto block" />
                  </div>
                </div>
              </div>

              {/* Right phone â Workout */}
              <div className="absolute right-4 top-12 w-[180px] z-10 transform rotate-3">
                <div className="bg-gray-900 rounded-[28px] p-[5px] shadow-2xl">
                  <div className="rounded-[24px] overflow-hidden">
                    <img src="/screenshots/workout.png" alt="Workout logging with coach notes" className="w-full h-auto block" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* âââ Professions bar âââ */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">Built for every health &amp; fitness profession</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['ðï¸ Personal Trainers','ð¥ Nutritionists','ð Dietitians','ð Exercise Physiologists','ðª Strength Coaches','ð± Online Coaches','ð¦´ Physiotherapists'].map((p, i) => (
              <span key={i} className="px-4 py-2 bg-white rounded-full text-sm text-gray-600 border border-gray-100 shadow-sm">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* âââ Platform Overview â Three Views âââ */}
      <section id="platform" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-sm font-semibold text-[#0F7B8C] mb-3 tracking-wide uppercase">One platform, three experiences</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Everything your coaching business needs
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              A web dashboard where you run your business, a mobile app where you coach on the go, and a beautiful client experience that keeps athletes engaged.
            </p>
          </div>

          {/* View selector pills */}
          <div className="flex justify-center gap-3 mt-8 mb-16">
            <a href="#coach-web" className="px-5 py-2.5 bg-[#0F7B8C]/10 text-[#0F7B8C] font-semibold text-sm rounded-full border border-[#0F7B8C]/20 hover:bg-[#0F7B8C]/15 transition-colors">
              ð¥ï¸ Coach Dashboard
            </a>
            <a href="#coach-app" className="px-5 py-2.5 bg-gray-100 text-gray-600 font-semibold text-sm rounded-full border border-gray-200 hover:bg-gray-150 transition-colors">
              ð± Coach App
            </a>
            <a href="#client-app" className="px-5 py-2.5 bg-gray-100 text-gray-600 font-semibold text-sm rounded-full border border-gray-200 hover:bg-gray-150 transition-colors">
              ðª Client App
            </a>
          </div>
        </div>
      </section>

      {/* âââ View 1: Coach Web Dashboard âââ */}
      <section id="coach-web" className="pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 items-start">
            {/* Left text */}
            <div className="md:col-span-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0F7B8C]/10 rounded-full text-xs font-semibold text-[#0F7B8C] mb-4">
                ð¥ï¸ Coach Web Dashboard
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                Your coaching HQ, in the browser
              </h3>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Build programs, create AI-powered meal plans, review check-ins, message clients, and manage payments â all from one powerful dashboard.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Manage all your clients in one place',
                  'Build workout programs with sets, reps & tempo',
                  'Create meal plans with AI assistance',
                  'Review check-ins and track progress',
                  'Handle payments and subscriptions via Stripe',
                  'White-label with your own branding',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-[#0F7B8C] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right â Browser mockup */}
            <div className="md:col-span-3">
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-2xl shadow-gray-200/50">
                {/* Browser chrome */}
                <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="ml-4 flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200">
                    app.propelcoaches.com
                  </div>
                </div>
                {/* Dashboard UI */}
                <div className="bg-white flex">
                  {/* Sidebar */}
                  <div className="w-48 bg-gray-50 border-r border-gray-100 p-4 hidden sm:block">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-6 h-6 rounded bg-[#0F7B8C] flex items-center justify-center text-white text-[10px] font-bold">P</div>
                      <span className="text-xs font-bold text-gray-900">CB Coaching</span>
                    </div>
                    <nav className="space-y-0.5 text-[11px]">
                      {['Dashboard','Clients','Messages','Check-ins','Coaching','Programs','Nutrition','Habits','Payments'].map((item, i) => (
                        <div key={i} className={`px-3 py-1.5 rounded-md ${i === 1 ? 'bg-[#0F7B8C] text-white font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                          {item}
                        </div>
                      ))}
                    </nav>
                  </div>
                  {/* Main content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">Clients</h3>
                        <p className="text-xs text-gray-400">Manage your coaching clients</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-100 rounded-lg px-3 py-1.5 text-xs text-gray-400">Search clients...</div>
                        <div className="bg-[#0F7B8C] text-white text-xs font-semibold px-3 py-1.5 rounded-lg">Add Client</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[{label:'Total Clients',val:'24'},{label:'Active',val:'21'},{label:'Pending',val:'3'}].map((s,i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] text-gray-400">{s.label}</p>
                          <p className="text-lg font-bold text-gray-900">{s.val}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {[
                        {name:'Emma Wilson',goal:'Fat Loss',status:'Active',last:'3 days ago'},
                        {name:'James Khoury',goal:'Muscle Gain',status:'Active',last:'Today'},
                        {name:'Mia Torres',goal:'Performance',status:'Active',last:'Yesterday'},
                        {name:'Liam Chen',goal:'Recomp',status:'Pending',last:'Invite sent'},
                      ].map((c,i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0F7B8C]/10 flex items-center justify-center text-[10px] font-bold text-[#0F7B8C]">
                              {c.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900">{c.name}</p>
                              <p className="text-[10px] text-gray-400">{c.goal}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{c.status}</span>
                            <span className="text-[10px] text-gray-400">{c.last}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* âââ View 2: Coach Mobile App âââ */}
      <section id="coach-app" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 items-center">
            {/* Left â Phone mockup */}
            <div className="md:col-span-3 flex justify-center">
              <div className="relative">
                {/* Coach dashboard phone */}
                <div className="w-[220px] mx-auto">
                  <div className="bg-gray-900 rounded-[30px] p-[5px] shadow-2xl shadow-black/20">
                    <div className="rounded-[26px] overflow-hidden">
                      <img src="/screenshots/coach-dashboard.png" alt="Coach mobile dashboard" className="w-full h-auto block" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right text */}
            <div className="md:col-span-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0F7B8C]/10 rounded-full text-xs font-semibold text-[#0F7B8C] mb-4">
                ð± Coach Mobile App
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                Coach from anywhere
              </h3>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Review check-ins on the train, reply to clients between sessions, and keep an eye on your business â all from your phone.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Real-time messaging with clients',
                  'Review and respond to check-ins',
                  'View client progress and stats',
                  'Assign and adjust programs on the fly',
                  'Push notifications for new check-ins',
                  'Everything syncs with the web dashboard',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-[#0F7B8C] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* âââ View 3: Client App Experience âââ */}
      <section id="client-app" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0F7B8C]/10 rounded-full text-xs font-semibold text-[#0F7B8C] mb-4">
              ðª Client App
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Your clients will love using Propel
            </h3>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              A beautiful, intuitive mobile experience that keeps your athletes engaged, accountable, and progressing â from sign-up to first workout in 60 seconds.
            </p>
          </div>

          {/* Phone screenshots */}
          <div className="flex justify-center items-end gap-4 md:gap-8 overflow-hidden">
            {[
              { src: '/screenshots/nutrition.png', alt: 'Nutrition tracking', label: 'Nutrition & Macros' },
              { src: '/screenshots/home.png', alt: 'Athlete dashboard', label: 'Athlete Home' },
              { src: '/screenshots/progress.png', alt: 'Progress tracking', label: 'Progress Tracking' },
              { src: '/screenshots/workout.png', alt: 'Workout logging', label: 'Workout Logging' },
            ].map((screen, i) => (
              <div key={i} className={`flex-shrink-0 text-center ${i === 1 || i === 2 ? 'w-[160px] md:w-[200px]' : 'w-[120px] md:w-[160px] opacity-80 hidden sm:block'}`}>
                <div className="bg-gray-900 rounded-[20px] md:rounded-[24px] p-[3px] md:p-[4px] shadow-xl">
                  <div className="rounded-[17px] md:rounded-[20px] overflow-hidden">
                    <img src={screen.src} alt={screen.alt} className="w-full h-auto block" loading="lazy" />
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold text-gray-500">{screen.label}</p>
              </div>
            ))}
          </div>

          {/* Client feature highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            {[
              { icon: 'ðï¸', title: 'Guided Workouts', desc: 'Follow programs with sets, reps, RPE, and tempo guidance' },
              { icon: 'ð', title: 'Smart Nutrition', desc: 'Log meals by photo, barcode, or search â AI estimates macros' },
              { icon: 'ð', title: 'Progress Tracking', desc: 'Weight, measurements, photos, and personal bests over time' },
              { icon: 'ð¤', title: 'AI Coach Chat', desc: 'Get instant answers about your training, nutrition, and recovery' },
            ].map((f, i) => (
              <div key={i} className="text-center p-4">
                <span className="text-2xl mb-2 block">{f.icon}</span>
                <h4 className="text-sm font-bold text-gray-900 mb-1">{f.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* âââ Features Grid âââ */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Everything you need. Nothing you don&apos;t.
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              Choose which features your clients can access. A dietitian doesn&apos;t need workouts, and a PT might not need meal plans.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {title:'Training Programs',desc:'Build and assign workout programs with sets, reps, tempo, and coach notes. Clients log sessions live in the app.',icon:'ðï¸'},
              {title:'Nutrition & Meal Plans',desc:'Create AI-generated meal plans, set macro targets, and let clients log food with a barcode scanner or photo.',icon:'ð'},
              {title:'Client Messaging',desc:'Chat directly with clients in real time. Send voice notes, use canned templates, and let AI handle after-hours.',icon:'ð¬'},
              {title:'Check-ins & Forms',desc:'Weekly progress check-ins with custom questions. Stay on top of how every client is really doing.',icon:'ð'},
              {title:'Habit Tracking',desc:'Set daily habits and let clients track them in the app. Build consistency one day at a time.',icon:'â'},
              {title:'Progress & Metrics',desc:'Weight, measurements, progress photos, and personal bests â every metric in one place.',icon:'ð'},
              {title:'AI Coach Assistant',desc:'Your AI coach responds to clients 24/7 in your tone and style. It can also generate meal plans and workout programs.',icon:'ð¤'},
              {title:'White Label & Branding',desc:'Make Propel your own. Custom colours, logo, and branding so clients see your brand â not ours.',icon:'ð¨'},
              {title:'Video Exercise Library',desc:'Upload exercise demo videos and attach them to workouts. Clients see exactly how to perform each movement.',icon:'ð¬'},
              {title:'Group Chats',desc:'Create group coaching channels for challenges, accountability groups, or team communication.',icon:'ð¥'},
              {title:'Wearable Integration',desc:'Connect Apple Watch, Fitbit, and Garmin. Pull in steps, heart rate, sleep, and activity data automatically.',icon:'â'},
              {title:'AI Form Check',desc:'Clients upload exercise videos and get instant AI-powered form analysis with technique feedback.',icon:'ð¹'},
              {title:'Packages & Subscriptions',desc:'Create coaching packages with different tiers. Clients subscribe and get auto-billed through Stripe.',icon:'ð¦'},
              {title:'Marketplace',desc:'List your programs and templates on the Propel marketplace. Earn passive income from your expertise.',icon:'ð'},
              {title:'Payments & Invoicing',desc:'Send invoices, manage subscriptions, and track revenue â all powered by Stripe.',icon:'ð³'},
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#0F7B8C]/20 hover:bg-[#0F7B8C]/[0.02] transition-colors">
                <span className="text-2xl mb-3 block">{f.icon}</span>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* âââ AI Section âââ */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#0F7B8C] to-[#0a5a68] text-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-white/60 tracking-wide mb-3 uppercase">AI-powered coaching</p>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Your AI coach works while you sleep</h2>
              <p className="mt-4 text-white/70 leading-relaxed">
                Clients don&apos;t stop needing support at 5pm. Your AI coaching assistant responds to messages around the clock â in your tone, with your expertise.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Responds instantly to client questions and check-ins',
                  'Matches your communication style perfectly',
                  'Answers based on YOUR programs, logs, and client data',
                  'Hands off to you seamlessly when needed',
                  'Toggle on or off for any client at any time',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                    <svg className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/10">
                <p className="text-xs font-semibold text-white/40 mb-4">Example conversation</p>
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <div className="bg-white/20 rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
                      <p className="text-sm">Hey, I missed my session today. Feeling really guilty ð</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[80%]">
                      <p className="text-sm text-gray-700">Don&apos;t be too hard on yourself â one missed session doesn&apos;t undo your progress. How are you feeling? Want to make it up tomorrow?</p>
                      <p className="text-[10px] text-[#0F7B8C] font-semibold mt-1">AI Coach</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-white/20 rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
                      <p className="text-sm">Just been flat out at work. I&apos;ll make it up tomorrow</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[80%]">
                      <p className="text-sm text-gray-700">That&apos;s the spirit. Tomorrow is upper body â get a good sleep and stay hydrated tonight. You&apos;ve got this ðª</p>
                      <p className="text-[10px] text-[#0F7B8C] font-semibold mt-1">AI Coach</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* âââ How it works âââ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Up and running in minutes</h2>
            <p className="mt-4 text-gray-500">No setup call required. No lengthy onboarding. Three steps and you&apos;re coaching.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {step:'1',title:'Sign up in 60 seconds',desc:'Create your account, tell us your profession, and choose which features your clients can access.'},
              {step:'2',title:'Invite your clients',desc:'Send clients an invite link. They download the app, create a profile, and connect to you instantly.'},
              {step:'3',title:'Start coaching',desc:'Build programs, send check-ins, chat in real time, and let your AI assistant handle the in-between.'},
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#0F7B8C]/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-[#0F7B8C]">{s.step}</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* âââ Testimonials âââ */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight text-center mb-16">Coaches love Propel</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {quote:'Propel replaced three separate tools I was using. My clients love the app and I finally feel on top of everything.',name:'Sarah Mitchell',role:'Online PT, Sydney'},
              {quote:'As a dietitian I only needed the nutrition and check-in features â being able to turn everything else off keeps it clean.',name:'James Khoury',role:'Accredited Dietitian'},
              {quote:'The AI coach handles all the after-hours messages. I used to spend an hour every night replying â now I don\'t.',name:'Mia Torres',role:'Exercise Physiologist'},
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-sm">â</span>)}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* âââ Pricing âââ */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Simple, transparent pricing</h2>
            <p className="mt-4 text-gray-500">14-day free trial on all plans. No credit card required.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {name:'Starter',desc:'Perfect for coaches just getting started',price:'29',features:['Up to 10 clients','All core features','AI coach assistant','Stripe payments','Email support'],popular:false,cta:'Start free trial'},
              {name:'Pro',desc:'For established coaches scaling their business',price:'59',features:['Unlimited clients','All core features','AI coach assistant','Custom brand colours & logo','Priority support','Early access to new features'],popular:true,cta:'Start free trial'},
              {name:'Clinic',desc:'For multi-practitioner clinics and teams',price:'119',features:['Unlimited clients','Up to 5 practitioners','All Pro features','Team dashboard','Dedicated onboarding','Custom contract'],popular:false,cta:'Contact us'},
            ].map((plan, i) => (
              <div key={i} className={`rounded-2xl p-6 border ${plan.popular ? 'border-[#0F7B8C] bg-[#0F7B8C]/[0.02] ring-1 ring-[#0F7B8C]/20 relative' : 'border-gray-200'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0F7B8C] text-white text-[10px] font-bold px-3 py-1 rounded-full">Most popular</div>
                )}
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
                <Link href="/register" className={`block text-center font-bold py-3 px-6 rounded-xl text-sm transition-colors mb-6 ${plan.popular ? 'bg-[#0F7B8C] text-white hover:bg-[#0d6b7a]' : 'bg-[#0F7B8C] text-white hover:bg-[#0d6b7a]'}`}>
                  {plan.cta}
                </Link>
                <ul className="space-y-2.5">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-[#0F7B8C] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* âââ FAQ âââ */}
      <section id="faq" className="py-24 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight text-center mb-16">Frequently asked questions</h2>
          <div className="space-y-6">
            {[
              {q:'What is Propel?',a:'Propel is an all-in-one coaching platform. You get a web dashboard to manage your business, a mobile app for coaching on the go, and your clients get a beautiful app to follow programs, track nutrition, log workouts, and chat with you (or your AI coach).'},
              {q:'Who is Propel for?',a:'Personal trainers, nutritionists, dietitians, exercise physiologists, strength coaches, physiotherapists, and online fitness coaches. If you coach clients, Propel is built for you.'},
              {q:'How does the AI coach work?',a:'Your AI assistant learns your communication style and has access to each client\'s program, logs, and check-in data. It can answer questions, provide motivation, and adjust recommendations â 24/7. You can toggle it on or off per client and it hands off to you seamlessly when needed.'},
              {q:'Can I customise what my clients see?',a:'Yes. You choose which features are enabled for each client. A dietitian can turn off workouts. A PT can turn off meal plans. You can also white-label the experience with your own brand colours and logo.'},
              {q:'Is there a free trial?',a:'Yes â 14 days free on all plans, no credit card required. You can start coaching immediately.'},
              {q:'How do payments work?',a:'Propel integrates with Stripe. You can create coaching packages, set up recurring subscriptions, send invoices, and track revenue â all within the platform.'},
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="text-base font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* âââ Final CTA âââ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Ready to propel your practice?</h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            Join hundreds of health professionals who&apos;ve replaced their patchwork of tools with one platform that actually works.
          </p>
          <div className="mt-8">
            <Link href="/register" className="inline-flex items-center gap-2 bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white font-bold px-10 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-[#0F7B8C]/20">
              Start your free trial <span aria-hidden="true">â</span>
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">14-day free trial Â· No credit card required Â· Cancel anytime</p>
        </div>
      </section>

      {/* âââ Footer âââ */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#0F7B8C] flex items-center justify-center text-white text-[10px] font-bold">P</div>
            <span className="text-sm font-bold text-gray-900">Propel</span>
          </div>
          <p className="text-xs text-gray-400">Â© 2026 Propel. Built for coaches, by coaches.</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
            <Link href="/login" className="hover:text-gray-600 transition-colors text-[#0F7B8C]">Coach login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

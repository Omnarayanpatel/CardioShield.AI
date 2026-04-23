import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";

const contactCards = [
  {
    title: "Clinical Support",
    subtitle: "For doctors and screening teams",
    detail: "Ask about risk review workflow, dashboards, exports, and population-level monitoring.",
    tone: "from-cyan-500/30 via-sky-400/15 to-transparent",
    image: "/assets/Clinical%20Support.jfif",
    alt: "Clinical support illustration",
  },
  {
    title: "Patient Assistance",
    subtitle: "For users and caregivers",
    detail: "Reach out for account help, screening guidance, care-plan understanding, and report questions.",
    tone: "from-emerald-500/30 via-teal-400/15 to-transparent",
    image: "/assets/Patient%20Assistance.jfif",
    alt: "Patient assistance illustration",
  },
  {
    title: "Deployment & Demo",
    subtitle: "For institutions and judges",
    detail: "Discuss deployment setup, pilot use, architecture walkthroughs, and explainability outputs.",
    tone: "from-amber-500/30 via-orange-400/15 to-transparent",
    image: "/assets/deployment-demo.jfif",
    alt: "Deployment demo illustration",
  },
];

const quickChannels = [
  { label: "Email", value: "support@cardioshield.ai", hint: "Fastest for project queries" },
  { label: "Clinical Desk", value: "9171133918", hint: "Weekday review support" },
  { label: "Demo Requests", value: "demo@cardioshield.ai", hint: "Pitch, jury, and partner demos" },
];

function Contact() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#061423] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(16,185,129,0.14),transparent_24%),radial-gradient(circle_at_50%_70%,rgba(251,191,36,0.10),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[linear-gradient(180deg,rgba(2,6,23,0.25),transparent)]" />

      <header className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandMark className="shadow-cyan-500/10" sizeClass="h-11 w-11 sm:h-12 sm:w-12" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-300/80">CardioShield AI</p>
              <p className="text-sm text-slate-300">Contact & Collaboration</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold hover:border-cyan-300 hover:text-cyan-200">
              Back Home
            </Link>
            <Link to="/login" className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
              Open Platform
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-16">
        <section className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-cyan-200/30 bg-cyan-200/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
              Human support with medical context
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
                Reach the team
                <span className="block text-cyan-300">behind CardioShield AI.</span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                For clinical questions, demos, onboarding, or deployment support, use the channels below.
                We keep communication simple, quick, and privacy-aware.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {quickChannels.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                  <p className="mt-2 break-all text-sm font-semibold text-slate-100">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,0.24),transparent_55%)] blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur">
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/40">
                <img
                  src="/assets/heart_about.jfif"
                  alt="CardioShield clinical support visual"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-cyan-200/10 bg-slate-950/35 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Clinical support</p>
                  <p className="mt-2 text-sm text-slate-200">Workflow, dashboard, export, and risk review help.</p>
                </div>
                <div className="rounded-2xl border border-cyan-200/10 bg-slate-950/35 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Demo ready</p>
                  <p className="mt-2 text-sm text-slate-200">Pitch, pilot, and judge walkthroughs for the product.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {contactCards.map((card, index) => (
            <article
              key={card.title}
              className="contact-reveal rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              style={{ animationDelay: `${index * 140}ms` }}
            >
              <div className={`mb-5 overflow-hidden rounded-[1.4rem] border border-white/10 bg-gradient-to-br ${card.tone}`}>
                <div className="relative aspect-[4/3]">
                  <img src={card.image} alt={card.alt} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.12),rgba(2,6,23,0.55))]" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="rounded-[1.1rem] border border-white/15 bg-slate-950/35 p-3 backdrop-blur-sm">
                      <p className="text-sm leading-6 text-slate-100">{card.subtitle}</p>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{card.detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">What this page is for</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
              <p>Quick support for doctors, patients, and deployment teams.</p>
              <p>Clear contact routes instead of generic placeholder copy.</p>
              <p>Visual consistency with the rest of the app through the same card and glow language.</p>
              <p>If you want, we can later add a real form or team portraits here.</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950/70 to-cyan-950/40 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Contact Style</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Clean, calm, and easy to trust.</h3>
              </div>
              <Link to="/register" className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
                Start With This Style
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <InfoTile title="Portrait Cards" text="Use image blocks for trust and warmth, especially on contact and about pages." />
              <InfoTile title="Subtle Motion" text="Floating cards and soft glows are enough. No heavy animation needed." />
              <InfoTile title="Brand Balance" text="Health-tech should feel clear, premium, and calm rather than busy." />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function InfoTile({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}

export default Contact;

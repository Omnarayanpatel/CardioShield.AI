import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";

const contactCards = [
  {
    title: "Clinical Support",
    subtitle: "For doctors and screening teams",
    detail: "Ask about risk review workflow, dashboards, exports, and population-level monitoring.",
    tone: "from-cyan-500/30 via-sky-400/15 to-transparent",
  },
  {
    title: "Patient Assistance",
    subtitle: "For users and caregivers",
    detail: "Reach out for account help, screening guidance, care-plan understanding, and report questions.",
    tone: "from-emerald-500/30 via-teal-400/15 to-transparent",
  },
  {
    title: "Deployment & Demo",
    subtitle: "For institutions and hackathon judges",
    detail: "Discuss deployment setup, pilot use, architecture walkthroughs, and explainability outputs.",
    tone: "from-amber-500/30 via-orange-400/15 to-transparent",
  },
];

const quickChannels = [
  { label: "Email", value: "support@cardioshield.ai", hint: "Fastest for project queries" },
  { label: "Clinical Desk", value: "+91 98765 43210", hint: "Weekday review support" },
  { label: "Demo Requests", value: "demo@cardioshield.ai", hint: "Pitch, jury, and partner demos" },
];

function Contact() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#061423] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_50%_70%,rgba(251,191,36,0.12),transparent_26%)]" />

      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <div className="flex items-center gap-3">
              <BrandMark className="border-white/10 shadow-cyan-500/10" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">CardioShield AI</p>
                <p className="text-sm text-slate-300">Contact & Collaboration</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:border-cyan-300 hover:text-cyan-200">
              Back Home
            </Link>
            <Link to="/login" className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
              Open Platform
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-12 md:py-16">
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-cyan-200/30 bg-cyan-200/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
              Human support with medical context
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
                Add stronger visuals,
                <span className="block text-cyan-300">better motion, and real contact confidence.</span>
              </h1>
              <p className="max-w-2xl text-lg text-slate-300">
                This page shows exactly how photos, visual storytelling, and subtle animation can make the website feel more premium
                without becoming cluttered or slow.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {quickChannels.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-100">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[520px]">
            <div className="contact-float absolute left-4 top-8 h-52 w-44 rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-300/20 to-slate-950/40 p-4 backdrop-blur-md">
              <div className="contact-photo h-full rounded-[1.5rem] bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.9),rgba(125,211,252,0.2)_25%,rgba(6,24,35,0.15)_26%),linear-gradient(180deg,rgba(8,145,178,0.35),rgba(15,23,42,0.7))]" />
            </div>
            <div className="contact-float-delay absolute right-0 top-24 h-64 w-52 rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-300/20 to-slate-950/40 p-4 backdrop-blur-md">
              <div className="contact-photo h-full rounded-[1.5rem] bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.85),rgba(110,231,183,0.2)_24%,rgba(6,24,35,0.15)_25%),linear-gradient(180deg,rgba(5,150,105,0.35),rgba(15,23,42,0.72))]" />
            </div>
            <div className="contact-panel-glow absolute bottom-0 left-12 right-8 rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Why this works</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Visual anchors make the page feel alive.</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Instead of random stock photos, we can use intentional portrait-style cards, soft motion, and health-tech lighting so the
                brand feels clinical, modern, and memorable.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {contactCards.map((card, index) => (
            <article
              key={card.title}
              className={`contact-reveal rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm`}
              style={{ animationDelay: `${index * 140}ms` }}
            >
              <div className={`mb-5 h-40 rounded-[1.4rem] bg-gradient-to-br ${card.tone} border border-white/10 p-4`}>
                <div className="flex h-full items-end rounded-[1.1rem] border border-dashed border-white/15 bg-slate-950/35 p-4">
                  <p className="text-sm leading-6 text-slate-200">{card.subtitle}</p>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{card.detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">What we can add next</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
              <p>Doctor or patient testimonials with framed image cards.</p>
              <p>Animated statistic counters for prediction volume and screening reach.</p>
              <p>Hover-based story panels for explainability, fairness, and care-plan modules.</p>
              <p>Team section with branded portraits or illustrated avatars.</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950/70 to-cyan-950/40 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Design Direction</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Photos can help, if we use them with intent.</h3>
              </div>
              <Link to="/register" className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
                Start With This Style
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <InfoTile title="Portrait Cards" text="Use image blocks for trust and warmth, especially on contact, about, and landing pages." />
              <InfoTile title="Subtle Motion" text="Floating cards, stagger reveals, and ECG glow are enough. No heavy animation needed." />
              <InfoTile title="Brand Balance" text="Health-tech visual language should feel clear, premium, and calm rather than busy." />
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

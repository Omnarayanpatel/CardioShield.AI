function AdminCareProtocols() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Doctor Care Protocols</h2>
        <p className="mt-1 text-sm text-slate-500">Standard action guidance for Low, Moderate, and High risk patients.</p>
      </section>

      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">High Risk Protocol</p>
        <h3 className="mt-1 text-lg font-semibold text-rose-900">Urgent escalation pathway</h3>
        <ul className="mt-3 space-y-2 text-sm text-rose-900">
          <li>Immediate specialist referral recommended (24-72 hours).</li>
          <li>Mandatory BP/pulse tracking twice daily.</li>
          <li>Red-flag symptoms trigger emergency pathway.</li>
          <li>Follow-up adherence review every 3-7 days.</li>
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Moderate Risk Protocol</p>
          <h3 className="mt-1 text-lg font-semibold text-amber-900">Structured preventive care</h3>
          <ul className="mt-3 space-y-2 text-sm text-amber-900">
            <li>Primary physician review in 1-2 weeks.</li>
            <li>Lifestyle intervention with tracked compliance.</li>
            <li>Weekly BP/glucose progress checks.</li>
            <li>Escalate if symptoms worsen or probability rises.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Low Risk Protocol</p>
          <h3 className="mt-1 text-lg font-semibold text-emerald-900">Maintenance and prevention</h3>
          <ul className="mt-3 space-y-2 text-sm text-emerald-900">
            <li>Routine preventive counseling and annual screening.</li>
            <li>Encourage activity, diet, sleep consistency.</li>
            <li>Monitor for emerging risk factor progression.</li>
            <li>Re-stratify risk on next scheduled check.</li>
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Doctor Checklist Before Closing Case</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <ChecklistCard text="Risk category and probability reviewed." />
          <ChecklistCard text="Top drivers explained to patient in plain language." />
          <ChecklistCard text="Care plan shared as per risk level." />
          <ChecklistCard text="Follow-up date and escalation notes recorded." />
          <ChecklistCard text="Emergency warning signs explained clearly." />
          <ChecklistCard text="Patient adherence concerns documented." />
        </div>
      </section>
    </div>
  );
}

function ChecklistCard({ text }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{text}</div>;
}

export default AdminCareProtocols;

import { useEffect, useState } from "react";

import api, { downloadFromApi } from "../api";

function FairnessReport() {
  const [report, setReport] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState("json");

  useEffect(() => {
    api.get("/admin/fairness/report").then((res) => setReport(res.data));
  }, []);

  if (!report) {
    return <div className="rounded-2xl bg-white p-6 shadow">Loading fairness report...</div>;
  }

  const metrics = report.metrics || {};
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Fairness Report</h2>
          <p className="text-sm text-slate-500">Model version: {report.model_version}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input max-w-[120px]"
            value={downloadFormat}
            onChange={(event) => setDownloadFormat(event.target.value)}
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="txt">TXT</option>
          </select>
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            onClick={() =>
              downloadFromApi(`/admin/fairness/report/export?format=${downloadFormat}`, `fairness_report.${downloadFormat}`)
            }
          >
            Download
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(metrics)
          .filter(([key]) => key !== "note")
          .map(([key, value]) => (
            <div key={key} className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{key.replaceAll("_", " ")}</p>
              <p className="mt-2 text-sm text-slate-700">Before: {value.before}</p>
              <p className="text-sm text-slate-700">After: {value.after}</p>
            </div>
          ))}
      </div>
      {metrics.note ? <p className="mt-4 text-xs text-slate-500">{metrics.note}</p> : null}
    </div>
  );
}

export default FairnessReport;

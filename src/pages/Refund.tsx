export function Refund() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Refund Policy</h1>
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 prose prose-slate prose-sm max-w-none">
        <h2 className="text-lg font-semibold mt-0">Basic Principle</h2>
        <p>CareerLens is a result-based digital service. If the core service result is not properly delivered, a <strong>full automatic refund</strong> is the default policy.</p>

        <h2 className="text-lg font-semibold">Automatic Refund Conditions</h2>
        <p>The following situations trigger an automatic refund without requiring a user request:</p>
        <ol>
          <li><strong>API failure</strong>: Report generation is not possible due to API outage.</li>
          <li><strong>Output failure</strong>: Payment was completed but the report failed to render or save.</li>
          <li><strong>System error</strong>: The result is inaccessible due to a system error.</li>
        </ol>

        <h2 className="text-lg font-semibold">Refund Process</h2>
        <ul>
          <li>Refunds are processed automatically based on system status flags (<code>report_generated</code>).</li>
          <li>No separate refund request procedure is required from the user.</li>
          <li>Users are notified of the refund via email or on-screen notification.</li>
          <li>Refund decisions are made by system flags, not by AI or operator judgment.</li>
        </ul>

        <h2 className="text-lg font-semibold">Non-refundable Cases</h2>
        <p>If the user has successfully viewed the complete report, the service is considered delivered and is not eligible for a refund.</p>

        <h2 className="text-lg font-semibold">Our Commitment</h2>
        <p>We do not transfer responsibility for service failures to the user. Users should not need to prove problems or go through complex refund procedures. All cases identified as system failures are treated as "service failures" and handled accordingly.</p>

        <p className="text-slate-400 text-xs mt-8">Last updated: February 2026</p>
      </div>
    </div>
  );
}

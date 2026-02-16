export function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Terms of Service</h1>
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 prose prose-slate prose-sm max-w-none">
        <h2 className="text-lg font-semibold mt-0">1. Service Overview</h2>
        <p>CareerLens provides data-driven career analysis reports based on structured Decision Signals collected from free public APIs. The AI component explains and narrates the analysis but does not make decisions or predictions.</p>

        <h2 className="text-lg font-semibold">2. Service Description</h2>
        <p>Users submit career information (manually or via resume upload). The service collects quantitative data from public APIs (GitHub, StackExchange, Google Trends, NPM, PyPI, RSS feeds) and generates structured reports based on predefined threshold criteria.</p>

        <h2 className="text-lg font-semibold">3. Data Usage</h2>
        <p>All analysis is based on free public API data only. No paid APIs are used in the free preview stage. User-submitted information is used solely for generating the analysis report.</p>

        <h2 className="text-lg font-semibold">4. Limitations</h2>
        <ul>
          <li>Reports are based on publicly available data and predefined criteria, not AI judgment.</li>
          <li>Data availability depends on public API response at the time of collection.</li>
          <li>The service does not use probability or prediction expressions.</li>
          <li>Data limitations are transparently disclosed in each report.</li>
        </ul>

        <h2 className="text-lg font-semibold">5. Payment</h2>
        <p>Payment for full reports is processed through Polar. If the service fails to deliver the core result after payment, an automatic refund is processed.</p>

        <h2 className="text-lg font-semibold">6. Intellectual Property</h2>
        <p>The report structure, Decision Signal framework, and analysis methodology are proprietary to CareerLens. Users retain rights to their submitted data.</p>

        <p className="text-slate-400 text-xs mt-8">Last updated: February 2026</p>
      </div>
    </div>
  );
}

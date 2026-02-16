export function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 prose prose-slate prose-sm max-w-none">
        <h2 className="text-lg font-semibold mt-0">1. Information We Collect</h2>
        <ul>
          <li><strong>Career information</strong>: Job title, experience, skills, industry, and career goals submitted by the user.</li>
          <li><strong>Resume data</strong>: Content extracted from uploaded PDF/DOCX files for analysis purposes only.</li>
          <li><strong>Usage data</strong>: Analytics data collected via Google Analytics and Microsoft Clarity for service improvement.</li>
        </ul>

        <h2 className="text-lg font-semibold">2. How We Use Your Information</h2>
        <ul>
          <li>To generate career analysis reports based on structured Decision Signals.</li>
          <li>To improve service quality through anonymized usage analytics.</li>
          <li>To process payments and manage refunds.</li>
        </ul>

        <h2 className="text-lg font-semibold">3. Data Sources</h2>
        <p>We collect public data from: GitHub API, StackExchange API, Google Trends (cached), RSS Feeds, NPM API, and PyPI API. Only free, publicly available data is used.</p>

        <h2 className="text-lg font-semibold">4. Data Protection</h2>
        <ul>
          <li>API keys and sensitive configurations are stored server-side only.</li>
          <li>Resume files are processed and not permanently stored after analysis.</li>
          <li>We comply with GDPR, CCPA, and applicable data protection regulations.</li>
        </ul>

        <h2 className="text-lg font-semibold">5. Your Rights</h2>
        <p>You have the right to access, correct, delete, or export your personal data. Contact us to exercise these rights.</p>

        <h2 className="text-lg font-semibold">6. Cookies and Tracking</h2>
        <p>We use Google Analytics and Microsoft Clarity for usage analytics. These tools may use cookies to track user interactions for service improvement purposes.</p>

        <p className="text-slate-400 text-xs mt-8">Last updated: February 2026</p>
      </div>
    </div>
  );
}

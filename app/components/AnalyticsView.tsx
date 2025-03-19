import { BypassAnalytics } from "../../lib/analytics-cache";

interface AnalyticsViewProps {
  analytics: BypassAnalytics;
}

export default function AnalyticsView({ analytics }: AnalyticsViewProps) {
  const totalSuccesses = Object.values(analytics.serviceStats).reduce(
    (sum, stat) => sum + stat.successes,
    0
  );

  const overallSuccessRate =
    analytics.totalAttempts > 0
      ? Math.min(Math.round((totalSuccesses / analytics.totalAttempts) * 100), 100)
      : 0;

  const topDomains = Object.entries(analytics.domainStats)
    .sort((a, b) => b[1].attempts - a[1].attempts)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-lg font-normal text-gray-900 mb-4">
          Overall Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 p-4 text-center">
            <div className="text-2xl font-normal text-gray-900">
              {analytics.totalAttempts}
            </div>
            <div className="text-sm text-gray-500">Total Attempts</div>
          </div>
          <div className="border border-gray-200 p-4 text-center">
            <div className="text-2xl font-normal text-gray-900">
              {totalSuccesses}
            </div>
            <div className="text-sm text-gray-500">Successful Bypasses</div>
          </div>
          <div className="border border-gray-200 p-4 text-center">
            <div className="text-2xl font-normal text-gray-900">
              {overallSuccessRate}%
            </div>
            <div className="text-sm text-gray-500">Success Rate</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-lg font-normal text-gray-900 mb-4">
          Service Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wide"
                >
                  Service
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wide"
                >
                  Attempts
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wide"
                >
                  Successes
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wide"
                >
                  Success Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(analytics.serviceStats).map(
                ([service, stats]) => {
                  const successRate =
                    stats.attempts > 0
                      ? Math.min(Math.round((stats.successes / stats.attempts) * 100), 100)
                      : 0;

                  const serviceName =
                    service === "scribe"
                      ? "Scribe.rip"
                      : service === "12ft"
                      ? "12ft.io"
                      : service === "archive.is"
                      ? "Archive.is"
                      : service === "archive.ph"
                      ? "Archive.ph"
                      : service === "archivebuttons"
                      ? "Archive Buttons"
                      : service;

                  return (
                    <tr key={service}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-900">
                        {serviceName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stats.attempts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stats.successes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {successRate}%
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-lg font-normal text-gray-900 mb-4">
          Top Publications
        </h3>
        {topDomains.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wide"
                  >
                    Domain
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wide"
                  >
                    Attempts
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wide"
                  >
                    Best Service
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wide"
                  >
                    Success Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topDomains.map(([domain, stats]) => {
                  // Ensure success rate is capped at 100%
                  const cappedSuccessRate = Math.min(stats.successRate, 100);
                
                  const bestServiceName =
                    stats.bestService === "scribe"
                      ? "Scribe.rip"
                      : stats.bestService === "12ft"
                      ? "12ft.io"
                      : stats.bestService === "archive.is"
                      ? "Archive.is"
                      : stats.bestService === "archive.ph"
                      ? "Archive.ph"
                      : stats.bestService === "archivebuttons"
                      ? "Archive Buttons"
                      : stats.bestService;

                  return (
                    <tr key={domain}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-900">
                        {domain}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stats.attempts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bestServiceName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cappedSuccessRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            No publication data available yet
          </p>
        )}
      </div>
    </div>
  );
}
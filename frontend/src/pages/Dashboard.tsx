
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { Card, Badge } from "flowbite-react";
import { HiTicket, HiClock, HiCheckCircle } from "react-icons/hi";
import { useState, useEffect } from "react";
import axios from "axios";
import { useDrawer } from "../context/DrawerContext";


type DashboardSummary = {
  all: number;
  pending: number;
  resolved: number;
};

type GroupSummary = {
  group: string;
  all: number;
  pending: number;
  resolved: number;
};

function Dashboard() {
  

  const { isDrawerOpen } = useDrawer();

  const [summary, setSummary] = useState<DashboardSummary>({
    all: 0,
    pending: 0,
    resolved: 0,
  });

  const [groupData, setGroupData] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const mainMarginClass = isDrawerOpen ? "md:ml-64" : "md:ml-20";

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const summaryRes = await axios.get(
        "http://localhost:5000/api/dashboard/summary"
      );

      const groupRes = await axios.get(
        "http://localhost:5000/api/dashboard/group-summary"
      );

      setSummary(summaryRes.data);
      setGroupData(groupRes.data);
    } catch (error) {
      console.error("Dashboard API error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-12">
      {/* Top summary cards */}
      <main
        className={`p-4 ${mainMarginClass} h-auto pt-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 transition-all duration-300`}
      >
        {/* All Tickets */}
        <Card className="max-w-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center space-x-4">
            <HiTicket className="w-10 h-10 text-blue-500" />
            <div>
              <h5 className="text-3xl font-bold text-gray-900 dark:text-white">

                </h5>
                <p className="text-gray-600 dark:text-gray-400">All Tickets</p>
              </div>
            </div>
            <Badge color="info" className="mt-4">
              Updated just now
            </Badge>
          </Card>

          {/* Pending Tickets */}
          <Card className="max-w-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center space-x-4">
              <HiClock className="w-10 h-10 text-yellow-500" />
              <div>
                <h5 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {loading ? "..." : summary.pending}
                </h5>
                <p className="text-gray-600 dark:text-gray-400">
                  Pending Tickets
                </p>
              </div>
            </div>
            <Badge color="warning" className="mt-4">
              Needs attention
            </Badge>
          </Card>

          {/* Resolved Tickets */}
          <Card className="max-w-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center space-x-4">
              <HiCheckCircle className="w-10 h-10 text-green-500" />
              <div>
                <h5 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {loading ? "..." : summary.resolved}
                </h5>
                <p className="text-gray-600 dark:text-gray-400">
                  Resolved Tickets
                </p>
              </div>
            </div>
            <Badge color="success" className="mt-4">
              Great job!
            </Badge>
          </Card>
        </main>

        <main
          className={`bg-gray-50 dark:bg-gray-800 ${mainMarginClass} p-6 max-w-7xl mx-auto transition-all duration-300`}
        >
          {/* Filters */}
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Filter Controls */}
          </div>

          {/* Ticket summary table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 bg-white dark:bg-gray-900 shadow-sm">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
              <thead className="bg-[#eeeeee] dark:bg-gray-800 rounded-t-xl">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                    Group
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                    All Tickets
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                    Pending Tickets
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                    Resolved Tickets
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-6 text-center text-gray-500 dark:text-gray-400"
                    >
                      Loading data...
                    </td>
                  </tr>
                ) : groupData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-6 text-center text-gray-500 dark:text-gray-400"
                    >
                      No records found
                    </td>
                  </tr>
                ) : (
                  groupData.map(({ group, all, pending, resolved }, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900"
                    >
                      <td className="px-6 py-4 font-semibold">{group}</td>
                      <td className="px-6 py-4">{all}</td>
                      <td className="px-6 py-4 text-yellow-600 font-semibold">
                        {pending}
                      </td>
                      <td className="px-6 py-4 text-green-600 font-semibold">
                        {resolved}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
  );
}

export default Dashboard;

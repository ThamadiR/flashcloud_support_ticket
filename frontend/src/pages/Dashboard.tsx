
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { Card, Badge } from "flowbite-react";
import { HiTicket, HiClock, HiCheckCircle } from "react-icons/hi";
import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import axios from "axios";
import { useDrawer } from "../context/DrawerContext";
import { useTheme } from "../context/ThemeContext";


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
  const { isDark } = useTheme();

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

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const pagedGroupData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return groupData.slice(startIndex, startIndex + rowsPerPage);
  }, [groupData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(groupData.length / rowsPerPage);


  return (
    <div className="pb-12">
      {/* Top summary cards */}
      <main
        className={`p-4 ${mainMarginClass} h-auto pt-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 transition-all duration-300`}
      >
        {/* All Tickets */}
        <Card className="max-w-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center space-x-4">
            <HiTicket className="w-5 h-5 text-blue-500" />
            <div>
                <h5 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {loading ? "..." : summary.all}
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
              <HiClock className="w-5 h-5 text-yellow-500" />
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
              <HiCheckCircle className="w-5 h-5 text-green-500" />
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
          <div className="overflow-x-auto no-scrollbar rounded-xl border border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 bg-white dark:bg-gray-900 shadow-sm">

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
                  pagedGroupData.map(({ group, all, pending, resolved }, idx) => (
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

          <div className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-t ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-100 bg-gray-50/50'} rounded-2xl mt-4`}>
            <div className="flex items-center gap-3">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Show</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`bg-transparent text-xs font-bold border-none focus:ring-0 p-0 pr-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}
              >
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size} className={isDark ? 'bg-[#111827]' : 'bg-white'}>{size} per page</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 mr-4 px-3 py-1 rounded-full border ${isDark ? 'border-white/5 bg-white/5' : 'border-gray-200 bg-white'}`}>
                <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Page</span>
                <span className={`text-xs font-black ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{currentPage}</span>
                <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>of {totalPages || 1}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-xl transition-all ${currentPage === 1 ? 'opacity-20 cursor-not-allowed' : isDark ? 'hover:bg-white/10 text-slate-400 hover:text-cyan-400' : 'hover:bg-cyan-50 text-gray-400 hover:text-cyan-600'}`}
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pg = i + 1;
                    if (totalPages > 5 && pg !== 1 && pg !== totalPages && Math.abs(pg - currentPage) > 1) {
                      if (pg === 2 || pg === totalPages - 1) return <span key={pg} className="px-1 text-slate-500 text-[10px]">...</span>;
                      return null;
                    }
                    return (
                      <button
                        key={pg}
                        onClick={() => setCurrentPage(pg)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${currentPage === pg ? (isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30') : (isDark ? 'text-slate-500 hover:bg-white/5 hover:text-slate-300' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600')}`}
                      >
                        {pg}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`p-2 rounded-xl transition-all ${currentPage === totalPages || totalPages === 0 ? 'opacity-20 cursor-not-allowed' : isDark ? 'hover:bg-white/10 text-slate-400 hover:text-cyan-400' : 'hover:bg-cyan-50 text-gray-400 hover:text-cyan-600'}`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

        </main>
      </div>
  );
}

export default Dashboard;

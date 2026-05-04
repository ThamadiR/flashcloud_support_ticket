import React, { useEffect, useState } from "react";
import { Badge } from "flowbite-react";
import { User, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSearch } from "../../context/SearchContext";
import { useDrawer } from "../../context/DrawerContext";
import { useTheme } from "../../context/ThemeContext";

type Ticket = {
  id: number;
  subject: string;
  status: string;
  author: string;
  company: string;
  daysAgo: number;
  overdueBy: number;
  priority: string;
  group_type: string;
  state: string;
  initial: string;
};

type PaginatedTickets = {
  items: Ticket[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const API_BASE = "http://localhost:5000";

const avatarColors = [
  "#F59E0B", // amber
  "#3B82F6", // blue
  "#10B981", // green
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#14B8A6", // teal
  "#6366F1", // indigo
  "#84CC16", // lime
  "#F97316", // orange
];

function getColorForInitial(initial: string): string {
  if (!initial) return "#9CA3AF"; // default gray
  const charCode = initial.toUpperCase().charCodeAt(0);
  const index = charCode % avatarColors.length;
  return avatarColors[index];
}

const Tickets: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [items, setItems] = useState<Ticket[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { searchTerm } = useSearch();
  const { isDrawerOpen } = useDrawer();
  const { isDark } = useTheme();

  const fetchTickets = async (
    currentPage: number,
    searchTerm: string,
    cancelledRef: { cancelled: boolean }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const query = searchTerm
        ? `&search=${encodeURIComponent(searchTerm)}`
        : "";

      const res = await fetch(
        `${API_BASE}/api/tickets/ticket?page=${currentPage}&pageSize=${rowsPerPage}${query}`
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: PaginatedTickets = await res.json();

      if (!cancelledRef.cancelled) {
        const processed = (data.items || []).map((ticket) => {
          const initial =
            ticket.author && ticket.author.trim().length > 0
              ? ticket.author.trim().charAt(0).toUpperCase()
              : "?";

          const bgColor = getColorForInitial(initial);
          return { ...ticket, initial, bgColor };
        });

        setItems(processed);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e: any) {
      if (!cancelledRef.cancelled) {
        setError(e?.message ?? "Failed to load tickets");
      }
    } finally {
      if (!cancelledRef.cancelled) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const cancelledRef = { cancelled: false };
    fetchTickets(currentPage, searchTerm, cancelledRef);
    return () => {
      cancelledRef.cancelled = true;
    };
  }, [currentPage, searchTerm, rowsPerPage]);

  const mainMarginClass = isDrawerOpen ? "md:ml-64" : "md:ml-20";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main
        className={`p-4 ${mainMarginClass} h-auto pt-20 space-y-4 transition-all duration-300`}
      >
        {loading && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading…
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No tickets found.
          </div>
        )}
        {items.map((ticket) => (
          <div
            key={ticket.id}
            className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition hover:shadow-lg"
          >
            <div className="flex items-center space-x-4">
              {/* <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xl font-semibold text-white">
                <Avatar rounded placeholderInitials={ticket.initial} />
              </div> */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-semibold text-white shadow"
                style={{ backgroundColor: (ticket as any).bgColor }}
              >
                {ticket.initial}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge color="success">{ticket.status}</Badge>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {ticket.subject}{" "}
                    <span className="text-gray-500">#{ticket.id}</span>
                  </p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" /> {ticket.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" /> {ticket.company}
                  </span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Created: {ticket.daysAgo} days ago • Overdue by:{" "}
                  {ticket.overdueBy} days
                </p>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <Badge
                  color={
                    ticket.priority.toLowerCase() === "critical"
                      ? "pink"
                      : ticket.priority.toLowerCase() === "high"
                      ? "failure"
                      : ticket.priority.toLowerCase() === "medium"
                      ? "warning"
                      : "success"
                  }
                >
                  {ticket.priority}
                </Badge>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  👤 {ticket.group_type}
                </p>

                <Link to={`/ticket/${ticket.id}`}>
                  <Badge color="info" className="cursor-pointer">
                    {ticket.state}
                  </Badge>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </main>
      <div className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-t ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-100 bg-gray-50/50'} rounded-2xl mb-8 mx-4 shadow-xl`}>
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
    </div>
  );
};

export default Tickets;

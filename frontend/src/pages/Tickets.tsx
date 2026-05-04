import React, { useEffect, useState } from "react";
import { Badge, Pagination } from "flowbite-react";
import { User, Building2, Search, Clock, AlertCircle, ChevronRight, Ticket as TicketIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useSearch } from "../context/SearchContext";
import { useDrawer } from "../context/DrawerContext";
import { useTheme } from "../context/ThemeContext";

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

const ITEMS_PER_PAGE = 6;
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
  if (!initial) return "#9CA3AF";
  const charCode = initial.toUpperCase().charCodeAt(0);
  const index = charCode % avatarColors.length;
  return avatarColors[index];
}

const Tickets: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
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
      const query = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "";
      const res = await fetch(
        `${API_BASE}/api/tickets/ticket?page=${currentPage}&pageSize=${ITEMS_PER_PAGE}${query}`
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PaginatedTickets = await res.json();

      if (!cancelledRef.cancelled) {
        const processed = (data.items || []).map((ticket) => {
          const initial = ticket.author && ticket.author.trim().length > 0
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
    return () => { cancelledRef.cancelled = true; };
  }, [currentPage, searchTerm]);

  const mainMarginClass = isDrawerOpen ? "md:ml-64" : "md:ml-20";

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0B1120] text-slate-300' : 'bg-gray-50 text-gray-700'}`}>
      <main className={`p-4 ${mainMarginClass} h-auto pt-20 space-y-6 transition-all duration-300`}>
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Support Tickets
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Overview of all active and resolved support cases
            </p>
          </div>
          
          {loading && (
            <div className="flex items-center gap-2 text-xs font-medium animate-pulse text-cyan-400">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              Syncing tickets...
            </div>
          )}
        </div>

        {error && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className={`p-12 text-center rounded-2xl border border-dashed ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <TicketIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium opacity-50">No tickets found matching your criteria</p>
          </div>
        )}

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 gap-4">
          {items.map((ticket) => (
            <div
              key={ticket.id}
              className={`group relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${
                isDark 
                  ? 'bg-white/5 border-white/10 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10' 
                  : 'bg-white border-gray-200 hover:border-cyan-400 hover:shadow-xl'
              }`}
            >
              <div className="p-5 flex items-center gap-5">
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-inner shrink-0 relative overflow-hidden"
                  style={{ backgroundColor: (ticket as any).bgColor }}
                >
                  <div className="absolute inset-0 bg-black/10" />
                  <span className="relative z-10">{ticket.initial}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      ticket.status.toLowerCase() === 'open' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-white/10'
                    }`}>
                      {ticket.status}
                    </span>
                    <h3 className={`text-base font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {ticket.subject} <span className="opacity-30 font-normal ml-1">#{ticket.id}</span>
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-60">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {ticket.author}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {ticket.company}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {ticket.daysAgo} days ago
                    </div>
                  </div>
                </div>

                {/* Priority & State */}
                <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    ticket.priority.toLowerCase() === 'critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    ticket.priority.toLowerCase() === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                    ticket.priority.toLowerCase() === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}>
                    {ticket.priority}
                  </div>
                  <Link 
                    to={`/ticket/${ticket.id}`}
                    className={`flex items-center gap-1 text-[11px] font-bold py-1 px-2 rounded-lg transition-all ${
                      isDark ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {ticket.state}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className={`p-2 rounded-2xl border backdrop-blur-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                showIcons
                theme={{
                  pages: {
                    base: "xs:inline-flex items-center -space-x-px",
                    showIcon: "inline-flex",
                    previous: {
                      base: `ml-0 rounded-l-xl border border-white/10 px-3 py-2 leading-tight transition-all ${isDark ? 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-white' : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`,
                      icon: "h-5 w-5"
                    },
                    next: {
                      base: `rounded-r-xl border border-white/10 px-3 py-2 leading-tight transition-all ${isDark ? 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-white' : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`,
                      icon: "h-5 w-5"
                    },
                    selector: {
                      base: `w-10 border border-white/10 px-3 py-2 leading-tight transition-all ${isDark ? 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-white' : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`,
                      active: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/30",
                      disabled: "opacity-50 cursor-not-allowed"
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Tickets;

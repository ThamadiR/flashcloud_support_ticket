import React, { useEffect, useState } from "react";
import { API_BASE_URL as API_BASE } from "../config/api";
import { User, Building2, Clock, AlertCircle, ChevronRight, Ticket as TicketIcon, ChevronLeft, Search } from "lucide-react";

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
  assignee?: string;
  userId?: number | null;
  ticket_code?: string;
};

type PaginatedTickets = {
  items: Ticket[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};




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

function getPriorityColor(priority: string): string {
  const p = (priority || '').toLowerCase();
  switch (p) {
    case 'urgent':
    case 'critical': return "#EF4444"; // red
    case 'high': return "#F97316"; // orange
    case 'medium': return "#F59E0B"; // amber
    case 'low': return "#3B82F6"; // blue
    default: return "#9CA3AF"; // gray
  }
}

function getPriorityStyles(priority: string): string {
  const p = (priority || '').toLowerCase();
  switch (p) {
    case 'urgent':
    case 'critical':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.1)]';
    case 'high':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_12px_rgba(249,115,22,0.1)]';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_12px_rgba(234,179,8,0.1)]';
    case 'low':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
}

function getStatusStyles(status: string): string {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'open':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20';
    case 'in progress':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20';
    case 'resolved':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20';
    case 'closed':
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20';
  }
}

const Tickets: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [items, setItems] = useState<Ticket[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { searchTerm, setSearchTerm } = useSearch();
  const { isDrawerOpen } = useDrawer();
  const { isDark } = useTheme();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = storedUser?.id || storedUser?.userId || null;
  const [userRole, setUserRole] = useState(() => {
    const role = (storedUser?.role || "").toUpperCase().replace(/[-\s]+/g, '_');
    return role;
  });
  const isAgent = userRole === "TICKET_AGENT";
  const isSupervisorOrAdmin = ["ADMIN", "TICKET_SUPERVISOR"].includes(userRole);

  const [viewMyTickets, setViewMyTickets] = useState(isAgent);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    setStatusFilter(status);

    // Fetch latest user role to ensure correct access
    const fetchUserRole = async () => {
      try {
        if (!userId) return;
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const user = data.user || data;
          const role = (user.role || "").toUpperCase().replace(/[-\s]+/g, '_');
          setUserRole(role);
          if (role === "TICKET_AGENT") setViewMyTickets(true);
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    };
    fetchUserRole();
  }, [userId]);

  const fetchTickets = async (
    currentPage: number,
    searchTerm: string,
    statusFilter: string | null,
    currentUserId: number | null,
    cancelledRef: { cancelled: boolean }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const searchQuery = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "";
      const statusQuery = statusFilter ? `&status=${encodeURIComponent(statusFilter)}` : "";
      const userIdQuery = currentUserId ? `&userId=${currentUserId}` : "";

      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/api/tickets/ticket?page=${currentPage}&pageSize=${rowsPerPage}${searchQuery}${statusQuery}${userIdQuery}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );


      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PaginatedTickets = await res.json();

      if (!cancelledRef.cancelled) {
        const processed = (data.items || []).map((ticket) => {
          const initial = ticket.author && ticket.author.trim().length > 0
            ? ticket.author.trim().charAt(0).toUpperCase()
            : "?";
          return { ...ticket, initial };
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
    fetchTickets(currentPage, searchTerm, statusFilter, viewMyTickets ? userId : null, cancelledRef);
    return () => { cancelledRef.cancelled = true; };
  }, [currentPage, searchTerm, rowsPerPage, statusFilter, viewMyTickets, userId]);


  const mainMarginClass = isDrawerOpen ? "md:ml-64" : "md:ml-20";

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0B1120] text-slate-300' : 'bg-gray-50 text-gray-700'}`}>
      <main className={`p-4 ${mainMarginClass} h-auto pt-18 space-y-6 transition-all duration-300`}>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Support Tickets
            </h1>
            <p className={`text-sm opacity-60 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Overview of all active and resolved support cases
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search subject, author, company..."
                className={`w-64 md:w-80 rounded-2xl border transition-all outline-none py-2 pl-10 pr-4 text-sm ${isDark
                  ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-blue-500/40'
                  : 'border-gray-200 bg-white text-gray-900 placeholder:text-slate-400 focus:border-blue-400/40 shadow-sm'
                  }`}
              />
            </div>

            {/* View My Tickets Toggle */}
            <div className={`flex items-center gap-3 p-2 px-4 rounded-full border transition-all duration-300 group ${viewMyTickets ? 'bg-blue-500/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="viewMyTickets"
                  className="sr-only peer"
                  checked={viewMyTickets}
                  onChange={(e) => !isAgent && setViewMyTickets(e.target.checked)}
                  disabled={isAgent}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 transition-colors shadow-inner"></div>
              </label>
              <span className={`text-xs font-black uppercase tracking-widest select-none transition-colors ${viewMyTickets ? 'text-blue-400' : isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-600 group-hover:text-black'}`}>
                {isAgent ? 'My Tickets' : 'Assigned Tickets'}
              </span>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-xs font-medium animate-pulse text-cyan-400">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                Syncing tickets...
              </div>
            )}
          </div>
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
              className={`group relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300 ${isDark
                ? 'bg-white/5 border-white/10 hover:border-white/20'
                : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="p-5 flex items-center gap-5">
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-inner shrink-0 relative overflow-hidden transition-colors duration-500"
                  style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                >
                  <div className="absolute inset-0 bg-black/10" />
                  <span className="relative z-10">{ticket.initial}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>{ticket.ticket_code || `#${ticket.id}`}</span> {ticket.subject}
                  </h3>

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

                {/* Priority, State & Action Arrow */}
                <div className="hidden md:flex flex-row items-center gap-6 shrink-0">
                  <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${getPriorityStyles(ticket.priority)}`}>
                    {ticket.priority ?? '—'}
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border ${getStatusStyles(ticket.state || ticket.status)}`}
                  >
                    {ticket.state || ticket.status || 'open'}
                  </div>
                  <Link
                    to={`/ticket/${ticket.id}`}
                    className={`p-2 rounded-xl transition-all duration-300 ${isDark ? 'bg-white/5 text-slate-400 hover:bg-cyan-500/20 hover:text-cyan-400' : 'bg-gray-50 text-gray-400 hover:bg-cyan-50 hover:text-cyan-500'}`}
                  >
                    <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-t ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-100 bg-gray-50/50'} rounded-2xl mt-8 shadow-xl`}>
          <div className="flex items-center gap-3">
            <span className={`text-[0.75rem] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Show</span>
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

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(pg => Math.max(1, pg - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-xl transition-all ${currentPage === 1 ? 'opacity-20 cursor-not-allowed' : isDark ? 'hover:bg-white/10 text-slate-400 hover:text-cyan-400' : 'hover:bg-cyan-50 text-gray-400 hover:text-cyan-600'}`}
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1">
              <button
                disabled
                className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'}`}
              >
                {currentPage}
              </button>
            </div>

            <button
              onClick={() => setCurrentPage(pg => Math.min(totalPages, pg + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`p-2 rounded-xl transition-all ${currentPage === totalPages || totalPages === 0 ? 'opacity-20 cursor-not-allowed' : isDark ? 'hover:bg-white/10 text-slate-400 hover:text-cyan-400' : 'hover:bg-cyan-50 text-gray-400 hover:text-cyan-600'}`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Tickets;

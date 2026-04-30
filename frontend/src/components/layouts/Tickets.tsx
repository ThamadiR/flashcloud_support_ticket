import React, { useEffect, useState } from "react";
import { Badge, Pagination } from "flowbite-react";
import { User, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useSearch } from "../../context/SearchContext";
import { useDrawer } from "../../context/DrawerContext";

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
  if (!initial) return "#9CA3AF"; // default gray
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
        `${API_BASE}/api/tickets/ticket?page=${currentPage}&pageSize=${ITEMS_PER_PAGE}${query}`
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
  }, [currentPage, searchTerm]);

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
      <div
        className={`p-4 ${mainMarginClass} flex justify-end mb-6 transition-all duration-300`}
      >
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
};

export default Tickets;

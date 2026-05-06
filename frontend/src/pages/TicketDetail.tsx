import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from 'react-hot-toast';
import { useDrawer } from "../context/DrawerContext";

import {
  FaReply,
  FaShareSquare,
  FaTimes,
  FaTrash,
  FaArrowsAltH,
  FaChevronDown,
  FaPaperclip,
  FaFileAlt,
  FaSearch,
} from "react-icons/fa";



interface Attachment {
  filename: string;
  url: string;
  size?: number;
  path?: string;
  mimeType?: string;
  storedName?: string;
}

interface Email {
  from: string;
  to: string;
  cc: string;
  subject: string;
  date: string;
  body: string;
  status?: string;
  attachments?: Attachment[];
}

interface TicketData {
  id: string | undefined;
  subject: string;
  status: string;
  priority: string;
  group: string;
  assignee: string;
  reportedBy: string;
  reportedDate: string;
  resolutionDueDate: string;
  statusOptions: string[];
  priorityOptions: string[];
  groupOptions: string[];
  assigneeOptions: string[];
  emails: Email[];
}

const TicketDetail: React.FC = () => {
  const { isDrawerOpen } = useDrawer();
  const mainMarginClass = isDrawerOpen ? "md:ml-64" : "md:ml-20";
  const { id } = useParams<{ id: string }>();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  
  const [ccList, setCcList] = useState<string[]>([]);
  const [ccRecipients, setCcRecipients] = useState<{
    [email: string]: boolean;
  }>({});
  const [isForwarding, setIsForwarding] = useState(false);
  const [forwardContent, setForwardContent] = useState("");
  const [forwardRecipients, setForwardRecipients] = useState({
    to: "",
    cc: "",
  });
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Dummy data with proper typing
  const ticketData: TicketData = {
    id: id,
    //subject: "Re: Report in Accuracy in Iphonik system",
    //status: "Open",
    //priority: "Low",
    //group: "Tech Support",
    //assignee: "Charith Dilanka",
    //reportedBy: "IT Service Desk",
    //reportedDate: "10 days ago (Mon, 3 Jun 2024 at 11:50 AM)",
    subject: "",
    status: "",
    priority: "",
    group: "",
    assignee: "",
    reportedBy: "",
    reportedDate: "",
    resolutionDueDate: "Thu, Jun 12, 2025 03:55 PM",
    statusOptions: ["Open", "In Progress", "Resolved", "Closed"],
    priorityOptions: ["Low", "Medium", "High", "Urgent"],
    groupOptions: ["My Groups", "Development Support", "Engineering Support", "Unassigned"],
    assigneeOptions: [""],
    /*emails: [
      {
        from: "charanaranasinghe@sampath.lk",
        to: "support@iphonik.com",
        cc: "akila@iphonik.com, machiavarathnayake@sampath.lk, nuwanj@sampath.lk, rishui.hettiarachchi@dialog.lk",
        subject: "Report in Accuracy in Iphonik system",
        date: "Mon, 3 Jun 2024 at 11:50 AM",
        body: "<div><p>Dear Support Team,<br/>There seems to be an inaccuracy in the Iphonik system report. Please investigate.</p><p>Regards,<br/>Charana Ranasinghe</p></div>",
      },
    ],*/
    emails: [],
  };

  // State for dropdown values
  const [status, setStatus] = useState(ticketData.status);
  const [priority, setPriority] = useState(ticketData.priority);
  const [group, setGroup] = useState(ticketData.group);
  const [assignee, setAssignee] = useState(ticketData.assignee);
  const [author, setAuthor] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [assigneeOptions, setAssigneeOptions] = useState([]);

  useEffect(() => {
    const fetchUnreadEmails = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `http://localhost:5000/api/tickets/${id}/emails`
        );
        console.log(`Frontend: Fetch response for ticket ${id}/emails status:`, res.status);

        // Check if backend responded
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("Server responded with status:", res.status, errorData);
          setError(errorData.error || `Server Error (${res.status})`);
          setLoading(false);
          return;
        }

        const text = await res.text();

        // Try parsing safely
        let data;
        try {
          data = text ? JSON.parse(text) : null;
        } catch (parseErr) {
          console.error("Failed to parse JSON:", parseErr);
          setError("Invalid response format from server.");
          return;
        }

        // Handle no email case
        if (!data) {
          setEmails([]);
          return;
        }

        // Replace data mapping
        const formattedEmails: Email[] = Array.isArray(data)
          ? data.map((email: any) => ({
              from: email.sender || "Unknown",
              to: email.recipient || "",
              cc: email.cc || "",
              subject: email.subject || "(No Subject)",
              date: email.date_received
                ? new Date(email.date_received).toLocaleString()
                : new Date().toLocaleString(),
              body: email.body || "<p>(No message content)</p>",
              attachments: email.attachments
                ? (() => {
                    try {
                      return JSON.parse(email.attachments);
                    } catch (e) {
                      console.error("Attachment JSON parse error", e);
                      return [];
                    }
                  })()
                : [],
            }))
          : [];

        console.log(`Frontend: Fetched ${data?.length || 0} raw emails for ticket ${id}`, data);
        setEmails(formattedEmails);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching unread emails:", err);
        setError("Failed to load emails. Please check backend logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadEmails();
  }, [id]);

  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/tickets/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        // Update states
        setStatus(data.status || data.state || "");
        setPriority(data.priority || "");
        setGroup(data.group_type || "");
        setAssignee(data.assignee || "");
        setAuthor(data.author || "");
        setRequesterEmail(data.email || "");
        setSubject(data.subject || "");
        
        // We can also update ticketData ref if needed, but states are more important for UI
      } catch (err) {
        console.error("Error fetching ticket details:", err);
      }
    };
    if (id) fetchTicketDetails();
  }, [id]);


  useEffect(() => {
    if (emails.length > 0 && emails[0].cc) {
      const list = emails[0].cc
        .split(",")
        .map((cc: string) => cc.trim())
        .filter((cc: string) => cc.length > 0);

      setCcList(list);

      // Set default checked = true (you can change this)
      const defaultState: { [key: string]: boolean } = {};
      list.forEach((email) => (defaultState[email] = true));

      setCcRecipients(defaultState);
    }
  }, [emails]);

  useEffect(() => {
    const fetchAssignees = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/users/assignees`);
        const data = await res.json();
        setAssigneeOptions(data);
      } catch (err) {
        console.error("Failed to load assignees", err);
      }
    };

    fetchAssignees();
  }, []);

  // Toggle CC recipient selection
  /*const toggleCcRecipient = (name: keyof CcRecipients) => {
    setCcRecipients((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };*/

  //update ticket dropdowns backend
  const handleDropdownChange = async (field: string, value: string) => {
    switch (field) {
      case "status":
        setStatus(value);
        break;
      case "priority":
        setPriority(value);
        break;
      case "group":
        setGroup(value);
        break;
      case "assignee":
        setAssignee(value);
        break;
    }

    // Call backend API
    const mapFields: any = {
      status: "state",
      priority: "priority",
      group: "group_type",
      assignee: "assignee",
    };

    const backendField = mapFields[field];

    try {
      await fetch(`http://localhost:5000/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [backendField]: value }),
      });
    } catch (err) {
      console.error(`Failed to update ticket ${field}`, err);
    }
  };

  // Handle reply submission
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedCc = Object.keys(ccRecipients).filter(
      (email) => ccRecipients[email] === true
    );

    const latestEmail = emails[emails.length - 1];
    const originalEmail = emails[0];

    const quotedOriginal = `
      <br><br>
      On ${latestEmail?.date || "a previous date"}, ${
      latestEmail?.from || "someone"
    } wrote:
        <blockquote style="border-left:2px solid #ccc; margin:0; padding-left:10px;">
          ${latestEmail?.body || ""}
        </blockquote>
      `;

    const fullReply = `${replyContent}${quotedOriginal}`;

    const formData = new FormData();
    formData.append("to", latestEmail.from);
    formData.append("subject", latestEmail.subject);
    formData.append("replyMessage", fullReply);
    if (id) {
      formData.append("inReplyToId", id);
      formData.append("ticketId", id);
    }
    selectedCc.forEach((cc) => formData.append("cc", cc));
    attachments.forEach((file) => formData.append("attachments", file));

    try {
      const res = await fetch(
        "http://localhost:5000/api/tickets/emails/reply",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Reply failed:", res.statusText, errorData);
        toast.error(errorData.error || "Failed to send reply.");
        return;
      }

      const data = await res.json();
      console.log("Reply sent:", data);

      setReplyContent("");
      setAttachments([]);
      setIsReplying(false);
      toast.success("Reply sent successfully!");
    } catch (err) {
      console.error("Error sending reply:", err);
      toast.error("An error occurred while sending the reply.");
    }
  };

 // Handle forward submission
  const handleForwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emails || emails.length === 0) {
      toast.error("No email selected to forward.");
      return;
    }

    // Validate recipient
    if (!forwardRecipients.to.trim()) {
      toast.error("Please enter a recipient email address.");
      return;
    }

    const latestEmail = emails[emails.length - 1];

    const formData = new FormData();
    formData.append("to", forwardRecipients.to.trim());
    formData.append("cc", forwardRecipients.cc.trim());
    formData.append("subject", latestEmail.subject);
    formData.append("originalBody", latestEmail.body);
    formData.append("forwardMessage", forwardContent);
    formData.append("originalFrom", latestEmail.from);
    formData.append("originalDate", latestEmail.date);
    formData.append("originalTo", latestEmail.to);
    formData.append("ticketId", id || "");

    if (attachments && attachments.length > 0) {
      for (let i = 0; i < attachments.length; i++) {
        formData.append("attachments", attachments[i]);
      }
    }

    // Debug: log what we're sending
    console.log("Forward payload:", {
      to: forwardRecipients.to.trim(),
      subject: latestEmail.subject,
      ticketId: id,
    });

    try {
      const res = await fetch(
        "http://localhost:5000/api/tickets/emails/forward",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Forward failed:", res.status, errorData);
        toast.error(errorData.error || `Failed to forward email (${res.status}).`);
        return;
      }

      const data = await res.json();
      console.log("Email forwarded:", data);
      toast.success("Email forwarded successfully!");

      setForwardContent("");
      setAttachments([]);
      setIsForwarding(false);
      setForwardRecipients({ to: "", cc: "" });
    } catch (err) {
      console.error("Error forwarding email:", err);
      toast.error("An error occurred while forwarding the email.");
    }
  };

  // Toggle reply form and ensure forward form is closed
  const toggleReply = () => {
    setIsForwarding(false);
    setIsReplying(!isReplying);
  };

  // Toggle forward form and ensure reply form is closed
  const toggleForward = () => {
    setIsReplying(false);
    setIsForwarding(!isForwarding);
  };

  // Derived values — computed at render time, not stored as stale consts
  const latestEmail = emails.length > 0 ? emails[emails.length - 1] : null;
  const firstEmail = emails.length > 0 ? emails[0] : null;

  // Use subject from ticket details, fallback to first email's subject
  const displaySubject = subject || firstEmail?.subject || "Loading ticket...";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <main className={`flex-1 p-4 ${mainMarginClass} h-auto pt-20 flex flex-nowrap overflow-x-hidden`}>
        <div className="flex-1 flex flex-col space-y-4 pr-4">
          {/* Ticket Header */}
          <div className="mb-2 px-1">
            <h1 className="flex items-center gap-2 flex-wrap">
              <span className={`font-semibold tracking-wide ${isDark ? 'text-blue-200/90' : 'text-blue-700'}`} style={{ fontSize: '13px' }}>
                #{id}
              </span>
              <span className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`} style={{ fontSize: '13px', wordBreak: 'break-word', display: 'inline-block', maxWidth: '100%' }}>
                {displaySubject}
              </span>
            </h1>
          </div>

          {/* Search Filtration System */}
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700/50 flex items-center gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Search in conversation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
              />
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700/50" />
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
              <span className="text-blue-500">
                {emails.filter(e => 
                  e.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  e.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  e.from.toLowerCase().includes(searchTerm.toLowerCase())
                ).length}
              </span>
              <span>Matches</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex space-x-2 overflow-x-auto">
            <button
              type="button"
              onClick={toggleReply}
              className={`${
                isReplying ? "bg-blue-800" : "bg-blue-700"
              } text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800`}
            >
              <FaReply className="w-4 h-4 me-2" />
              Reply
            </button>
            <button
              type="button"
              onClick={toggleForward}
              className={`${
                isForwarding
                  ? "bg-gray-200 dark:bg-gray-700"
                  : "bg-white dark:bg-gray-800"
              } text-gray-900 border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 inline-flex items-center`}
            >
              <FaShareSquare className="w-4 h-4 me-2" />
              Forward
            </button>
            <button
              type="button"
              className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 inline-flex items-center"
            >
              <FaTimes className="w-4 h-4 me-2" />
              Close
            </button>
            <button
              type="button"
              className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 inline-flex items-center"
            >
              <FaArrowsAltH className="w-4 h-4 me-2" />
              Merge
            </button>
            <button
              type="button"
              className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 inline-flex items-center"
            >
              <FaTrash className="w-4 h-4 me-2" />
              Delete
            </button>
          </div>

          {/* Email Thread Area */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : emails.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">
                  No unread emails found.
                </p>
              </div>
            ) : (
              emails.filter((email) => {
                  const searchLower = searchTerm.toLowerCase();
                  return (
                    email.subject.toLowerCase().includes(searchLower) ||
                    email.body.toLowerCase().includes(searchLower) ||
                    email.from.toLowerCase().includes(searchLower) ||
                    email.to.toLowerCase().includes(searchLower)
                  );
                }).length === 0 && searchTerm !== "" ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">
                      No emails match your search "{searchTerm}".
                    </p>
                  </div>
                ) : (
                  emails
                    .filter((email) => {
                      const searchLower = searchTerm.toLowerCase();
                      return (
                        email.subject.toLowerCase().includes(searchLower) ||
                        email.body.toLowerCase().includes(searchLower) ||
                        email.from.toLowerCase().includes(searchLower) ||
                        email.to.toLowerCase().includes(searchLower)
                      );
                    })
                    .map((email, index) => (
                  <div
                    key={index}
                    className="mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden"
                  >
                    {/* Email Header Area */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/50">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest w-12">From</span>
                            <span className="text-[14px] font-bold text-blue-600 dark:text-blue-400">
                              {email.from}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest w-12">To</span>
                            <span className="text-[14px] font-medium text-slate-600 dark:text-slate-300">
                              {email.to}
                            </span>
                          </div>
                          {email.cc && (
                            <div className="flex items-center gap-2">
                              <span className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest w-12">Cc</span>
                              <span className="text-[14px] font-medium text-slate-500 dark:text-slate-400">
                                {email.cc}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {email.status && email.status !== 'received' && (
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                              email.status === 'sent' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50' : 
                              email.status === 'forwarded' ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/50' :
                              'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800/50'
                            }`}>
                              {email.status}
                            </span>
                          )}
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] bg-slate-100 dark:bg-slate-900/50 px-4 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 whitespace-nowrap">
                            {email.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest w-12">Subj</span>
                        <span className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                          {email.subject}
                        </span>
                      </div>
                    </div>

                    {/* Email Body Content */}
                    <div className="p-8">
                      <div
                        className="email-body text-[15px] text-slate-800 dark:text-slate-200 leading-relaxed max-w-none overflow-x-auto"
                        dangerouslySetInnerHTML={{
                          __html: email.body as string,
                        }}
                      />
                    </div>

                    {/* Attachments Section */}
                    {email.attachments && email.attachments.length > 0 && (
                      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                        <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                          <FaPaperclip className="mr-2" /> Attachments (
                          {email.attachments.length})
                        </h4>

                        <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {email.attachments.map((att, i) => {
                            const isImage = att.mimeType?.startsWith("image/");

                            return (
                              <li
                                key={i}
                                className="flex flex-col items-center justify-center p-2 bg-white dark:bg-gray-800 rounded shadow text-sm"
                              >
                                {isImage ? (
                                  <img
                                    src={`http://localhost:5000${att.path}`}
                                    alt={att.filename}
                                    className="w-24 h-24 object-cover rounded mb-2 border border-gray-300 dark:border-gray-600"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center mb-2">
                                    <FaFileAlt
                                      size={32}
                                      className="text-gray-500 dark:text-gray-300 mb-1"
                                    />
                                  </div>
                                )}

                                <p className="font-medium text-center break-all">
                                  {att.filename}
                                </p>
                                {att.size && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {(att.size / 1024).toFixed(1)} KB
                                  </p>
                                )}

                                <a
                                  href={`http://localhost:5000/api/emails/download/${att.storedName}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 text-blue-600 dark:text-blue-400 text-xs hover:underline"
                                >
                                  Download
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )
            )}
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <form onSubmit={handleReplySubmit}>
                {/* From & To */}
                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1">
                        From
                      </h4>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {emails[0]?.to?.split(",")[0]?.trim() ||
                          "iPhonik Support"}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1">
                        To
                      </h4>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {emails[0]?.from || requesterEmail || "No recipient"}
                      </p>
                    </div>
                  </div>

                  {/* Cc */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cc:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/*{ccOptions.map((recipient) => (
                        <label
                          key={recipient.key}
                          className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
                        >
                          <input
                            type="checkbox"
                            checked={ccRecipients[recipient.key]}
                            onChange={() => toggleCcRecipient(recipient.key)}
                            className="form-checkbox h-5 w-5 text-blue-600 dark:text-blue-400 rounded border-gray-300 dark:border-gray-600"
                          />
                          <span className="ml-3 text-sm text-gray-800 dark:text-gray-200">
                            {recipient.label}
                          </span>
                        </label>
                      ))}*/}
                      {ccList.map((email) => (
                        <label
                          key={email}
                          className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
                        >
                          <input
                            type="checkbox"
                            checked={ccRecipients[email] || false}
                            onChange={() =>
                              setCcRecipients((prev) => ({
                                ...prev,
                                [email]: !prev[email],
                              }))
                            }
                            className="form-checkbox h-5 w-5 text-blue-600 dark:text-blue-400 rounded border-gray-300 dark:border-gray-600"
                          />
                          <span className="ml-3 text-sm text-gray-800 dark:text-gray-200">
                            {email}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="mb-4">
                  <label
                    htmlFor="replyContent"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="replyContent"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={8}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="Type your reply here..."
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center">
                  {/*<button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    <FaPaperclip className="mr-2" />
                    Attach File
                  </button>*/}

                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
                      <FaPaperclip className="mr-2" />
                      Attach File
                      <input
                        type="file"
                        multiple
                        onChange={(e) =>
                          setAttachments(
                            e.currentTarget.files
                              ? Array.from(e.currentTarget.files)
                              : []
                          )
                        }
                        className="hidden"
                      />
                    </label>

                    {attachments.length > 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {attachments.length} file(s) selected
                      </p>
                    )}
                  </div>

                  {/* Show attached file names */}
                  {attachments.length > 0 && (
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      <p>Attached files:</p>
                      <ul className="list-disc pl-5">
                        {attachments.map((file, index) => (
                          <li key={index}>{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsReplying(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Forward Form */}
          {isForwarding && (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <form onSubmit={handleForwardSubmit}>
                {/* From */}
                <div className="mb-4">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 mb-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1">
                      From
                    </h4>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {emails[0]?.from || requesterEmail || "No recipient"}
                    </p>
                  </div>
                </div>

                {/* To */}
                <div className="mb-4">
                  <label
                    htmlFor="forwardTo"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    To
                  </label>
                  <input
                    type="email"
                    id="forwardTo"
                    value={forwardRecipients.to}
                    onChange={(e) =>
                      setForwardRecipients({
                        ...forwardRecipients,
                        to: e.target.value,
                      })
                    }
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="recipient@example.com"
                    required
                    multiple
                  />
                </div>

                {/* Cc */}
                <div className="mb-4">
                  <label
                    htmlFor="forwardCc"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Cc
                  </label>
                  <input
                    type="email"
                    id="forwardCc"
                    value={forwardRecipients.cc}
                    onChange={(e) =>
                      setForwardRecipients({
                        ...forwardRecipients,
                        cc: e.target.value,
                      })
                    }
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="cc@example.com"
                    multiple
                  />
                </div>

                {/* Original Message */}
                {/*<div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-2">
                    Original Message
                  </h4>
                  <div className="text-xs text-gray-700 dark:text-gray-300">
                    <p>
                      <strong>From:</strong> {emails[0]?.from}
                    </p>
                    <p>
                      <strong>Date:</strong> {emails[0]?.date}
                    </p>
                    <p>
                      <strong>Subject:</strong> {emails[0]?.subject}
                    </p>
                    <div className="mt-2 border-t border-gray-300 dark:border-gray-600 pt-2">
                      {emails[0]?.body}
                    </div>
                  </div>
                </div>*/}

                {/* Message */}
                <div className="mb-4">
                  <label
                    htmlFor="forwardContent"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="forwardContent"
                    value={forwardContent}
                    onChange={(e) => setForwardContent(e.target.value)}
                    rows={8}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="Add a message to accompany the forwarded email..."
                  />
                </div>

                {/* Attachments Preview */}
                {attachments.length > 0 && (
                  <div className="mb-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Attached Files:
                    </h4>
                    <ul className="list-disc list-inside text-sm text-gray-800 dark:text-gray-200">
                      {attachments.map((file, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between items-center"
                        >
                          <span>{file.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setAttachments(
                                attachments.filter((_, i) => i !== idx)
                              )
                            }
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center">
                  <input
                    type="file"
                    id="forwardAttachmentInput"
                    multiple
                    className="hidden"
                    onChange={(e) =>
                      setAttachments(Array.from(e.target.files || []))
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("forwardAttachmentInput")?.click()
                    }
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    <FaPaperclip className="mr-2" />
                    Attach File
                  </button>

                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsForwarding(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Forward
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Email Thread */}
          <div className="flex-1 bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700 overflow-y-auto">
            {loading ? (
              <p className="text-gray-500">Loading unread emails...</p>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : emails.length === 0 ? (
              <p className="text-gray-500">No unread emails found.</p>
            ) : (
              emails.map((email, index) => (
                <div
                  key={index}
                  className="mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden"
                >
                  {/* Email Header Area */}
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/50">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest w-12">From</span>
                          <span className="text-[14px] font-bold text-blue-600 dark:text-blue-400">
                            {email.from}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest w-12">To</span>
                          <span className="text-[14px] font-medium text-slate-600 dark:text-slate-300">
                            {email.to}
                          </span>
                        </div>
                        {email.cc && (
                          <div className="flex items-center gap-2">
                            <span className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest w-12">Cc</span>
                            <span className="text-[14px] font-medium text-slate-500 dark:text-slate-400">
                              {email.cc}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {email.status && email.status !== 'received' && (
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                            email.status === 'sent' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50' : 
                            email.status === 'forwarded' ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/50' :
                            'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800/50'
                          }`}>
                            {email.status}
                          </span>
                        )}
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] bg-slate-100 dark:bg-slate-900/50 px-4 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 whitespace-nowrap">
                          {email.date}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest w-12">Subj</span>
                      <span className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        {email.subject}
                      </span>
                    </div>
                  </div>

                  {/* Email Body Content */}
                  <div className="p-8">
                    <div
                      className="email-body text-[15px] text-slate-800 dark:text-slate-200 leading-relaxed max-w-none overflow-x-auto"
                      dangerouslySetInnerHTML={{
                        __html: email.body as string,
                      }}
                    />
                  </div>

                  {/*Attachments*/}
                  {/* {email.attachments && email.attachments.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                      <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        <FaPaperclip className="inline mr-2" />
                        Attachments ({email.attachments.length})
                      </h4>

                      <ul className="space-y-2">
                        {email.attachments.map((att, i) => (
                          <li
                            key={i}
                            className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded shadow text-sm"
                          >
                            <div>
                              <p className="font-medium">{att.filename}</p>
                              {att.size && (
                                <p className="text-xs text-gray-500">
                                  {(att.size / 1024).toFixed(1)} KB
                                </p>
                              )}
                            </div>

                            <a
                              href={`http://localhost:5000/api/emails/download/${att.filename}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {att.filename}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )} */}
                  {/* Attachments Section */}
                  {email.attachments && email.attachments.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                      <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                        <FaPaperclip className="mr-2" /> Attachments (
                        {email.attachments.length})
                      </h4>

                      <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {email.attachments.map((att, i) => {
                          const isImage = att.mimeType?.startsWith("image/");

                          return (
                            <li
                              key={i}
                              className="flex flex-col items-center justify-center p-2 bg-white dark:bg-gray-800 rounded shadow text-sm"
                            >
                              {isImage ? (
                                // Image preview
                                <img
                                  src={`http://localhost:5000${att.path}`}
                                  alt={att.filename}
                                  className="w-24 h-24 object-cover rounded mb-2 border border-gray-300 dark:border-gray-600"
                                />
                              ) : (
                                // File icon + name
                                <div className="flex flex-col items-center mb-2">
                                  <FaFileAlt
                                    size={32}
                                    className="text-gray-500 dark:text-gray-300 mb-1"
                                  />
                                </div>
                              )}

                              {/* File name + size */}
                              <p className="font-medium text-center break-all">
                                {att.filename}
                              </p>
                              {att.size && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {(att.size / 1024).toFixed(1)} KB
                                </p>
                              )}

                              {/* Download link */}
                              <a
                                href={`http://localhost:5000/api/emails/download/${att.storedName}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 text-blue-600 dark:text-blue-400 text-xs hover:underline"
                              >
                                Download
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar (Properties) */}
        <div className="w-80 bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700 flex-shrink-0 ml-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {status}
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            By {ticketData.resolutionDueDate}
          </p>
          
          {/* Requester Info */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-[0.75rem] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">
              Requester
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20 border border-white/10">
                {author ? author.trim().charAt(0).toUpperCase() : '?'}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-[17px] font-black text-gray-900 dark:text-white tracking-tight truncate leading-tight">
                  {author || 'Unknown'}
                </p>
                <p className="text-[13px] font-bold text-blue-500 dark:text-blue-400 truncate hover:text-blue-600 transition-colors cursor-pointer">
                  {requesterEmail || 'No email available'}
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            PROPERTIES
          </h3>

          <div className="mb-3">
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Status
            </label>
            <div className="relative mt-1">
              <select
                id="status"
                value={status}
                onChange={(e) => handleDropdownChange("status", e.target.value)}
                className="block w-full rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm p-2.5 pr-8 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
              >
                {ticketData.statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <FaChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="mb-3">
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Priority
            </label>
            <div className="relative mt-1">
              <select
                id="priority"
                value={priority}
                onChange={(e) =>
                  handleDropdownChange("priority", e.target.value)
                }
                className="block w-full rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm p-2.5 pr-8 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
              >
                {ticketData.priorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <FaChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="mb-3">
            <label
              htmlFor="group"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Group
            </label>
            <div className="relative mt-1">
              <select
                id="group"
                value={group}
                onChange={(e) => handleDropdownChange("group", e.target.value)}
                className="block w-full rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm p-2.5 pr-8 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
              >
                {ticketData.groupOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <FaChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="mb-3">
            <label
              htmlFor="assignee"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Assignee
            </label>
            <div className="relative mt-1">
              <select
                id="assignee"
                value={assignee}
                onChange={(e) =>
                  handleDropdownChange("assignee", e.target.value)
                }
                className="block w-full rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm p-2.5 pr-8 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
              >
                {assigneeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <FaChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TicketDetail;
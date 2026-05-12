import React, { useEffect, useState } from "react";
import { Spinner } from "flowbite-react";
import { API_BASE_URL } from "../config/api";
import { useParams, useNavigate } from "react-router-dom";
import { useDrawer } from "../context/DrawerContext";
import toast from "react-hot-toast";

import {
  FaReply,
  FaShareSquare,
  FaTimes,
  FaTrash,
  FaArrowsAltH,
  FaChevronDown,
  FaPaperclip,
  FaFileAlt,
  FaChevronLeft,
} from "react-icons/fa";

/*interface CcRecipients {
  akila: boolean;
  machiavarathnayake: boolean;
  nuwanj: boolean;
  rishui: boolean;
}*/

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
  sender?: string;
  to: string;
  cc: string;
  subject: string;
  date: string;
  date_received?: string;
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

/*const ccOptions: { key: keyof CcRecipients; label: string }[] = [
  { key: "akila", label: "akila@iphonik.com" },
  { key: "machiavarathnayake", label: "machiavarathnayake@sampath.lk" },
  { key: "nuwanj", label: "nuwanj@sampath.lk" },
  { key: "rishui", label: "rishui.hettiarachchi@dialog.lk" },
];*/

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
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'in progress':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'resolved':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'closed':
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    case 'replied':
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    case 'forwarded':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

const TicketDetail: React.FC = () => {
  const { isDrawerOpen } = useDrawer();
  const mainMarginClass = isDrawerOpen ? "md:ml-64" : "md:ml-20";
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [replyCc, setReplyCc] = useState("");
  /*const [ccRecipients, setCcRecipients] = useState<CcRecipients>({
    akila: false,
    machiavarathnayake: true,
    nuwanj: true,
    rishui: true,
  });*/
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
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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
    priorityOptions: ["Low", "Medium", "High", "Critical"],
    groupOptions: [],
    assigneeOptions: [],
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
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [group, setGroup] = useState("");
  const [assignee, setAssignee] = useState("");
  const [subject, setSubject] = useState("");

  // Pending state for dropdowns
  const [pendingStatus, setPendingStatus] = useState(status);
  const [pendingPriority, setPendingPriority] = useState(priority);
  const [pendingGroup, setPendingGroup] = useState(group);
  const [pendingAssignee, setPendingAssignee] = useState(assignee);
  const [pendingAssigneeId, setPendingAssigneeId] = useState<string | number>("");
  const [isModified, setIsModified] = useState(false);

  const [attachments, setAttachments] = useState<File[]>([]);
  const [groupOptions, setGroupOptions] = useState<any[]>([]);
  const [assigneeOptions, setAssigneeOptions] = useState<any[]>([]);

  // Single source of truth for fetching filtered assignees
  useEffect(() => {
    const fetchAssignees = async () => {
      // Use pendingGroup if modified, otherwise fallback to current group
      const activeGroup = pendingGroup || group;

      if (!activeGroup) {
        setAssigneeOptions([]);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const selectedGroup = groupOptions.find(g => g.name === activeGroup);

        // Use group name for the request as it's the more established pattern in the project
        const res = await fetch(`${API_BASE_URL}/api/groups/users?groupName=${encodeURIComponent(activeGroup)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch assignees for this group");

        const data = await res.json();
        setAssigneeOptions(data.users || data || []);
      } catch (err) {
        console.error("Error fetching filtered assignees:", err);
        setAssigneeOptions([]);
      }
    };

    fetchAssignees();
  }, [pendingGroup, group, groupOptions]);

  useEffect(() => {
    const fetchUnreadEmails = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_BASE_URL}/api/tickets/${id}/emails`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        // Check if backend responded
        if (!res.ok) {
          console.error("Server responded with status:", res.status);
          setError(`Server Error (${res.status})`);
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
            sender: email.sender || "Unknown",
            to: email.recipient || "",
            cc: email.cc || "",
            subject: email.subject || "(No Subject)",
            date: email.date_received
              ? new Date(email.date_received).toLocaleString()
              : new Date().toLocaleString(),
            date_received: email.date_received
              ? new Date(email.date_received).toLocaleString()
              : new Date().toLocaleString(),
            body: email.body || "<p></p>",
            status: email.status || "",
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

        setEmails(formattedEmails);
        if (formattedEmails.length > 0) {
          setReplyTo(formattedEmails[0].from || "");
        }
        setError(null);
      } catch (err: any) {
        console.error("Error fetching unread emails:", err);
        setError("Failed to load emails. Please check backend logs.");
        setEmails([]); // Fallback to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadEmails();
  }, [id]);

  useEffect(() => {
    if (emails.length > 0 && emails[0].cc) {
      const list = emails[0].cc
        .split(",")
        .map((cc: string) => cc.trim())
        .filter((cc: string) => cc.length > 0);

      setCcList(list);
      setReplyCc(list.join(", "));

      // Set default checked = true (you can change this)
      const defaultState: { [key: string]: boolean } = {};
      list.forEach((email) => (defaultState[email] = true));

      setCcRecipients(defaultState);
    }
  }, [emails]);

  // Fetch ticket details to populate sidebar dropdowns and subject
  useEffect(() => {
    if (!id) return;
    const fetchTicketDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/tickets/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Strictly prohibit Ticket Agents from viewing tickets not assigned to them
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const userRole = (storedUser?.role || "").toLowerCase();
        const currentUserId = storedUser?.id || storedUser?.userId;

        if (userRole === "ticket agent" && data.userId !== currentUserId) {
          toast.error("Access Denied: You are not authorized to view this ticket.");
          navigate("/tickets");
          return;
        }

        setStatus(data.status || data.state || "");
        setPriority(data.priority || "");
        setGroup(data.group_type || "");
        setAssignee(data.assignee || "");
        setSubject(data.subject || "");
        setPendingAssigneeId(data.userId || "");

        // Sync pending state
        setPendingStatus(data.status || data.state || "");
        setPendingPriority(data.priority || "");
        setPendingGroup(data.group_type || "");
        setPendingAssignee(data.assignee || "");
        setPendingPriority(data.priority || "");
        setPendingGroup(data.group_type || "");

        // If the ticket data includes an assignee ID, set it here
        setPendingAssigneeId(data.userId || data.assigneeId || "");
      } catch (err) {
        console.error("Error fetching ticket details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicketDetails();
  }, [id]);

  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/groups`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch groups");
        const data = await res.json();
        setGroupOptions(data.groups || []);
      } catch (err) {
        console.error("Failed to load groups", err);
      }
    };
    fetchGroups();
  }, []);

  // (Consolidated logic into the filter hook above)



  // Toggle CC recipient selection
  /*const toggleCcRecipient = (name: keyof CcRecipients) => {
    setCcRecipients((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };*/

  // Update pending values
  const handleDropdownChange = (field: string, value: string) => {
    setIsModified(true);
    switch (field) {
      case "status":
        setPendingStatus(value);
        break;
      case "priority":
        setPendingPriority(value);
        break;
      case "group":
        setPendingGroup(value);
        // Reset assignee when group changes
        setPendingAssigneeId("");
        break;
      case "assignee":
        setPendingAssigneeId(value); // value will be the userId from the select
        const selObj = assigneeOptions.find(a => String(a.id) === String(value));
        if (selObj) setPendingAssignee(selObj.username);
        break;
    }
  };

  const handleDiscard = () => {
    setPendingStatus(status);
    setPendingPriority(priority);
    setPendingGroup(group);
    setPendingAssignee(assignee);
    setIsModified(false);
    toast.success("Changes discarded");
  };

  const handleApply = async () => {
    // Save current pending values to main state
    setStatus(pendingStatus);
    setPriority(pendingPriority);
    setGroup(pendingGroup);
    setAssignee(pendingAssignee);
    setIsModified(false);

    try {
      const token = localStorage.getItem("token");

      console.log("Applying changes for Group:", pendingGroup, "and Assignee:", pendingAssignee);

      // Resolve IDs and names for the update
      const selectedGroupObj = groupOptions.find(g => String(g.name).trim() === String(pendingGroup).trim());
      const groupId = selectedGroupObj ? selectedGroupObj.id : null;

      // Ensure pendingAssigneeId is matched correctly against assigneeOptions
      const selectedAssigneeObj = assigneeOptions.find(a => String(a.id) === String(pendingAssigneeId));

      const userId = selectedAssigneeObj ? selectedAssigneeObj.id : null;
      const assigneeName = selectedAssigneeObj ? selectedAssigneeObj.username : "";

      console.log("Calculated IDs - GroupID:", groupId, "UserID:", userId, "Name:", assigneeName, "pendingAssigneeId:", pendingAssigneeId);

      // Update the Ticket (tbl_ticket_det logic)
      const res = await fetch(`${API_BASE_URL}/api/tickets/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          state: pendingStatus,
          priority: pendingPriority,
          group_type: pendingGroup,
          assignee: assigneeName,
          groupId: groupId,
          userId: userId
        }),
      });

      if (!res.ok) throw new Error(`Ticket update failed with status ${res.status}`);

      // Update local state so UI reflects changes immediately
      setStatus(pendingStatus);
      setPriority(pendingPriority);
      setGroup(pendingGroup);
      setAssignee(assigneeName);
      setIsModified(false);

      // SYNC MANAGEMENT TABLE
      if (userId && groupId) {
        console.log("Syncing Management Table for User:", userId, "to Group:", groupId);
        await fetch(`${API_BASE_URL}/api/users/${userId}/update-group`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ groupId: groupId }),
        });
      }

      toast.success("Applied successfully");
    } catch (err) {
      console.error("Failed to apply changes:", err);
      toast.error("Failed to apply changes");
    }
  };

  // Helper for email validation
  const isValidEmailList = (emailsStr: string): boolean => {
    if (!emailsStr || emailsStr.trim() === "") return true;
    const emailsArray = emailsStr.split(",").map((e) => e.trim()).filter((e) => e.length > 0);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailsArray.length > 0 && emailsArray.every((email) => emailRegex.test(email));
  };

  // Handle reply submission
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyTo.trim()) {
      toast.error("Please provide at least one 'To' email address.");
      return;
    }
    if (!isValidEmailList(replyTo)) {
      toast.error("One or more 'To' email addresses are invalid.");
      return;
    }
    if (replyCc.trim() && !isValidEmailList(replyCc)) {
      toast.error("One or more 'Cc' email addresses are invalid.");
      return;
    }

    const selectedCc = replyCc
      .split(",")
      .map((cc) => cc.trim())
      .filter((cc) => cc.length > 0);

    const originalEmail = emails[0];

    const quotedOriginal = `
      <br><br>
      On ${originalEmail?.date || "a previous date"}, ${originalEmail?.from || "someone"
      } wrote:
        <blockquote style="border-left:2px solid #ccc; margin:0; padding-left:10px;">
          ${originalEmail?.body || ""}
        </blockquote>
      `;

    const fullReply = `${replyContent}${quotedOriginal}`;

    const formData = new FormData();
    formData.append("to", replyTo);
    formData.append("subject", originalEmail.subject);
    formData.append("replyMessage", fullReply);
    if (ticketData.id) {
      formData.append("inReplyToId", ticketData.id);
    }
    if (selectedCc.length > 0) {
      formData.append("cc", selectedCc.join(", "));
    }
    attachments.forEach((file) => formData.append("attachments", file));

    setIsSendingEmail(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/tickets/emails/reply`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData,
        }
      );

      if (!res.ok) {
        console.error("Reply failed:", res.statusText);
        try {
          const errData = await res.json();
          toast.error(errData.error || "Failed to send reply.");
        } catch {
          toast.error("Failed to send reply.");
        }
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
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Handle forward submission
  const handleForwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forwardRecipients.to.trim()) {
      toast.error("Please provide at least one 'To' email address.");
      return;
    }
    if (!isValidEmailList(forwardRecipients.to)) {
      toast.error("One or more 'To' email addresses are invalid.");
      return;
    }
    if (forwardRecipients.cc.trim() && !isValidEmailList(forwardRecipients.cc)) {
      toast.error("One or more 'Cc' email addresses are invalid.");
      return;
    }

    if (!emails || emails.length === 0) {
      toast.error("No email selected to forward.");
      return;
    }

    const originalEmail = emails[0];

    // Build form data to include attachments
    const formData = new FormData();
    formData.append("to", forwardRecipients.to);
    formData.append("subject", originalEmail.subject || "");
    formData.append("originalBody", originalEmail.body || "");
    formData.append("forwardMessage", forwardContent);
    formData.append("originalFrom", originalEmail.from || "");
    formData.append("originalDate", originalEmail.date || "");
    formData.append("originalTo", originalEmail.to || "");
    if (forwardRecipients.cc) {
      formData.append("cc", forwardRecipients.cc);
    }
    if (ticketData.id) {
      formData.append("ticketId", ticketData.id.toString());
    }

    // Append attachments (if any selected)
    if (attachments && attachments.length > 0) {
      for (let i = 0; i < attachments.length; i++) {
        formData.append("attachments", attachments[i]);
      }
    }

    setIsSendingEmail(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/tickets/emails/forward`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData,
        }
      );

      if (!res.ok) {
        console.error("Forward failed:", res.statusText);
        try {
          const errData = await res.json();
          toast.error(errData.error || "Failed to forward email.");
        } catch {
          toast.error("Failed to forward email.");
        }
        return;
      }

      const data = await res.json();
      console.log("Email forwarded:", data);
      toast.success("Email forwarded successfully!");

      // Reset states
      setForwardContent("");
      setAttachments([]);
      setIsForwarding(false);
    } catch (err) {
      console.error("Error forwarding email:", err);
      toast.error("An error occurred while forwarding the email.");
    } finally {
      setIsSendingEmail(false);
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

  const handleDeleteTicket = async () => {
    if (!window.confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      return;
    }

    // try {
    //   const res = await fetch(`${API_BASE_URL}/api/tickets/${id}`, {
    //     method: "DELETE",
    //   });

    //   if (!res.ok) {
    //     throw new Error("Failed to delete ticket");
    //   }

    //   toast.success("Ticket deleted successfully!");
    //   navigate("/tickets");
    // } catch (err) {
    //   console.error("Error deleting ticket:", err);
    //   toast.error("An error occurred while deleting the ticket.");
    // }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <main className={`p-4 ${mainMarginClass} h-auto pt-16 transition-all duration-300`}>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
              <button
                onClick={() => navigate('/tickets')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all"
              >
                <FaChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Ticket #{id || '...'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getPriorityStyles(priority)}`}>
                      {priority || '...'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusStyles(status)}`}>
                      {status || '...'}
                    </span>
                    {group && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                        {group}
                      </span>
                    )}
                    {assignee && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-purple-500/10 text-purple-400 border-purple-500/20">
                        {assignee}
                      </span>
                    )}
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {subject || "Loading Ticket Details..."}
                </h1>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex space-x-2 overflow-x-auto">
              <button
                type="button"
                onClick={toggleReply}
                className={`${isReplying
                  ? "bg-gray-200 dark:bg-gray-700"
                  : "bg-white dark:bg-gray-800"
                  } text-gray-900 border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 inline-flex items-center`}
              >
                <FaReply className="w-4 h-4 me-2" />
                Reply
              </button>
              <button
                type="button"
                onClick={toggleForward}
                className={`${isForwarding
                  ? "bg-gray-200 dark:bg-gray-700"
                  : "bg-white dark:bg-gray-800"
                  } text-gray-900 border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 inline-flex items-center`}
              >
                <FaShareSquare className="w-4 h-4 me-2" />
                Forward
              </button>
              {/* <button
                type="button"
                className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 inline-flex items-center"
              >
                <FaTimes className="w-4 h-4 me-2" />
                Close
              </button> */}
              <button
                type="button"
                className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 inline-flex items-center"
              >
                <FaArrowsAltH className="w-4 h-4 me-2" />
                Merge
              </button>
              {/* <button
                type="button"
                onClick={handleDeleteTicket}
                className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 inline-flex items-center"
              >
                <FaTrash className="w-4 h-4 me-2" />
                Delete
              </button> */}
            </div>

            {/* Reply Form */}
            {isReplying && (
              <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <form onSubmit={handleReplySubmit}>
                  {/* From */}
                  <div className="mb-4">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 mb-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1">
                        From
                      </h4>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {emails[0]?.to?.split(",")[0]?.trim() || "iPhonik Support"}
                      </p>
                    </div>
                  </div>

                  {/* To */}
                  <div className="mb-4">
                    <label
                      htmlFor="replyToInput"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      To
                    </label>
                    <input
                      type="text"
                      id="replyToInput"
                      value={replyTo}
                      onChange={(e) => setReplyTo(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                      placeholder="recipient@example.com, another@example.com"
                    />
                  </div>

                  {/* Cc */}
                  <div className="mb-4">
                    <label
                      htmlFor="replyCcInput"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Cc
                    </label>
                    <input
                      type="text"
                      id="replyCcInput"
                      value={replyCc}
                      onChange={(e) => setReplyCc(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                      placeholder="cc@example.com, cc2@example.com"
                    />
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

                  {/* Attachments Preview */}
                  {attachments.length > 0 && (
                    <div className="mb-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Attached Files:
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
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
                              className="text-red-500 hover:text-red-700 transition"
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
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
                        <FaPaperclip className="mr-2" />
                        Attach File
                        <input
                          type="file"
                          multiple
                          onChange={(e) => {
                            const newFiles = e.currentTarget.files ? Array.from(e.currentTarget.files) : [];
                            setAttachments((prev) => [...prev, ...newFiles]);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

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
                        disabled={isSendingEmail}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingEmail ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Sending...
                          </>
                        ) : (
                          "Send"
                        )}
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
                        {emails[0]?.from || "No recipient"}
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
                      type="text"
                      id="forwardTo"
                      value={forwardRecipients.to}
                      onChange={(e) =>
                        setForwardRecipients({
                          ...forwardRecipients,
                          to: e.target.value,
                        })
                      }
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                      placeholder="recipient@example.com, another@example.com"
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
                      type="text"
                      id="forwardCc"
                      value={forwardRecipients.cc}
                      onChange={(e) =>
                        setForwardRecipients({
                          ...forwardRecipients,
                          cc: e.target.value,
                        })
                      }
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                      placeholder="cc@example.com, cc2@example.com"
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
                      onChange={(e) => {
                        const newFiles = e.target.files ? Array.from(e.target.files) : [];
                        setAttachments((prev) => [...prev, ...newFiles]);
                      }}
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
                        disabled={isSendingEmail}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingEmail ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Forwarding...
                          </>
                        ) : (
                          "Forward"
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Email Thread */}
            <div className="flex-1 glass-panel rounded-2xl p-8 border border-white/10 overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
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
                  // className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                          {email.sender?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {email.sender || 'Unknown Sender'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {email.date_received || email.date || 'No Date'}
                            {(email.status === 'replied' || email.status === 'forwarded') && email.to && (
                              <span className="ml-2 font-medium text-blue-500 dark:text-blue-400">
                                To: {email.to}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {email.status && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusStyles(email.status)}`}>
                          {email.status === 'replied' ? 'Re:' : email.status === 'forwarded' ? 'Fwd:' : email.status}
                        </span>
                      )}
                    </div>

                    <div
                      className="email-body bg-white dark:bg-slate-900/50 p-6 rounded-xl border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 leading-relaxed shadow-inner"
                      dangerouslySetInnerHTML={{
                        __html: (email.body || "") as string,
                      }}
                    />

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
          <div className="w-full lg:w-80 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 flex-shrink-0 shadow-sm">
            <div className="flex flex-col mb-6">
              <div className="flex justify-between items-center mb-2">
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Resolution Due: {ticketData.resolutionDueDate}
              </p>
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
                  value={pendingStatus}
                  onChange={(e) => handleDropdownChange("status", e.target.value)}
                  className="block w-full rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm p-2.5 pr-8 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
                >
                  {(ticketData?.statusOptions || []).map((option) => (
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
                  value={pendingPriority}
                  onChange={(e) =>
                    handleDropdownChange("priority", e.target.value)
                  }
                  className="block w-full rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm p-2.5 pr-8 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
                >
                  {(ticketData?.priorityOptions || []).map((option) => (
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
                  value={pendingGroup}
                  onChange={(e) => handleDropdownChange("group", e.target.value)}
                  className="block w-full rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm p-2.5 pr-8 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
                >
                  <option value="">Select Group</option>
                  {groupOptions.map((option) => (
                    <option key={option.id} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="assignee"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Assignee
              </label>
              <div className="relative mt-1">
                <select
                  id="assignee"
                  value={pendingAssigneeId}
                  onChange={(e) =>
                    handleDropdownChange("assignee", e.target.value)
                  }
                  className="block w-full rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm p-2.5 pr-8 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
                >
                  <option value="">Select Assignee</option>
                  {assigneeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.username}
                    </option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Apply / Discard Buttons */}
            <div className={`flex gap-2 transition-all duration-300 ${isModified ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <button
                onClick={handleDiscard}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 dark:focus:ring-gray-700 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TicketDetail;
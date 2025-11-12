import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import CalendarPanel from "@/components/CalendarPanel";
import StatisticsCards, { StatItem } from "@/components/StatisticsCards";
import SearchFilterPanel, { FilterState } from "@/components/SearchFilterPanel";
import ExportButton from "@/components/ExportButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Send, CheckCircle, Clock, XCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";

interface Request {
  id: string;
  subject: string;
  date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  studentName: string;
  sentTo: "hod" | "faculty";
  submittedAt: string;
  updatedAt?: string;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [sentTo, setSentTo] = useState<"hod" | "faculty">("hod");
  const [requests, setRequests] = useState<Request[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    subject: "all",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "student") {
      navigate("/login");
    }
    loadRequests();
  }, [navigate]);

  const loadRequests = () => {
    const saved = localStorage.getItem("studentRequests");
    if (saved) {
      const allRequests = JSON.parse(saved);
      // Sort by most recent first
      allRequests.sort((a: Request, b: Request) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      setRequests(allRequests);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject || !date || !reason) {
      toast.error("Please fill all fields");
      return;
    }

    const newRequest: Request = {
      id: Date.now().toString(),
      subject,
      date,
      reason,
      status: "pending",
      studentName: localStorage.getItem("username") || "student1",
      sentTo,
      submittedAt: new Date().toISOString(),
    };

    const updatedRequests = [newRequest, ...requests];
    setRequests(updatedRequests);
    localStorage.setItem("studentRequests", JSON.stringify(updatedRequests));
    
    if (sentTo === "hod") {
      const pending = JSON.parse(localStorage.getItem("pendingRequests") || "[]");
      pending.push(newRequest);
      localStorage.setItem("pendingRequests", JSON.stringify(pending));
    } else {
      const facultyPending = JSON.parse(localStorage.getItem("facultyPendingRequests") || "[]");
      facultyPending.push(newRequest);
      localStorage.setItem("facultyPendingRequests", JSON.stringify(facultyPending));
    }

    addNotification({
      message: `Attendance request for ${subject} on ${date} sent to ${sentTo.toUpperCase()}`,
      type: "success",
    });

    toast.success(`Request sent to ${sentTo.toUpperCase()} successfully!`);
    setSubject("");
    setDate("");
    setReason("");
    setSentTo("hod");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const stats: StatItem[] = useMemo(() => {
    const total = requests.length;
    const approved = requests.filter(r => r.status === "approved").length;
    const pending = requests.filter(r => r.status === "pending").length;
    const rejected = requests.filter(r => r.status === "rejected").length;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return [
      { title: "Total Requests", value: total, icon: <FileText className="h-5 w-5" />, trend: 5, description: "All time" },
      { title: "Approved", value: approved, icon: <CheckCircle className="h-5 w-5" />, description: `${approvalRate}% approval rate` },
      { title: "Pending", value: pending, icon: <Clock className="h-5 w-5" />, description: "Awaiting review" },
      { title: "Rejected", value: rejected, icon: <XCircle className="h-5 w-5" />, description: "Not approved" },
    ];
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = request.studentName.toLowerCase().includes(searchLower) || request.subject.toLowerCase().includes(searchLower) || request.reason.toLowerCase().includes(searchLower);
      const matchesStatus = filters.status === "all" || request.status === filters.status;
      const matchesSubject = filters.subject === "all" || request.subject === filters.subject;
      const matchesDateFrom = !filters.dateFrom || request.date >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || request.date <= filters.dateTo;
      return matchesSearch && matchesStatus && matchesSubject && matchesDateFrom && matchesDateTo;
    });
  }, [requests, filters]);

  const uniqueSubjects = useMemo(() => Array.from(new Set(requests.map(r => r.subject))), [requests]);

  return (
    <DashboardLayout title="Student Dashboard" icon={<GraduationCap className="h-8 w-8 text-foreground" />}>
      <StatisticsCards stats={stats} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Submit Attendance Request</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter subject name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain your reason for absence"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sentTo">Send request to</Label>
                  <Select value={sentTo} onValueChange={(value: "hod" | "faculty") => setSentTo(value)}>
                    <SelectTrigger id="sentTo" className="bg-card">
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent className="bg-card z-50">
                      <SelectItem value="hod">HOD</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full flex items-center justify-center gap-2">
                  <Send className="h-4 w-4" />
                  Submit Request
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">All Requests History</CardTitle>
              <ExportButton data={filteredRequests} filename="student_requests" />
            </CardHeader>
            <CardContent className="space-y-4">
              <SearchFilterPanel filters={filters} onFilterChange={setFilters} subjects={uniqueSubjects} />
              {filteredRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{requests.length === 0 ? "No requests submitted yet" : "No requests match your filters"}</p>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold">{request.subject}</p>
                          <p className="text-sm text-muted-foreground">Absence Date: {request.date}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Sent to: {request.sentTo?.toUpperCase() || "HOD"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Submitted: {new Date(request.submittedAt).toLocaleDateString()} at {new Date(request.submittedAt).toLocaleTimeString()}
                          </p>
                          {request.updatedAt && (
                            <p className="text-xs text-muted-foreground">
                              Updated: {new Date(request.updatedAt).toLocaleDateString()} at {new Date(request.updatedAt).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        <span className="font-medium text-foreground">Reason:</span> {request.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <CalendarPanel showQuickSubmit />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import CalendarPanel from "@/components/CalendarPanel";
import StatisticsCards, { StatItem } from "@/components/StatisticsCards";
import SearchFilterPanel, { FilterState } from "@/components/SearchFilterPanel";
import ExportButton from "@/components/ExportButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Check, X, CheckCircle, Clock, XCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";

interface Request {
  id: string;
  subject: string;
  date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  studentName: string;
  submittedAt: string;
  updatedAt?: string;
}

const HODDashboard = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [pendingRequests, setPendingRequests] = useState<Request[]>([]);
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    subject: "all",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "hod") {
      navigate("/login");
    }
    loadRequests();
  }, [navigate]);

  const loadRequests = () => {
    const all = JSON.parse(localStorage.getItem("pendingRequests") || "[]");
    all.sort((a: Request, b: Request) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    setAllRequests(all);
    setPendingRequests(all.filter((r: Request) => r.status === "pending"));
  };

  const handleApprove = (requestId: string) => {
    const request = allRequests.find(r => r.id === requestId);
    updateRequestStatus(requestId, "approved");
    
    if (request) {
      addNotification({
        message: `Approved ${request.studentName}'s request for ${request.subject}`,
        type: "success",
        relatedRequestId: requestId,
      });
    }
    
    toast.success("Request approved!");
  };

  const handleReject = (requestId: string) => {
    const request = allRequests.find(r => r.id === requestId);
    updateRequestStatus(requestId, "rejected");
    
    if (request) {
      addNotification({
        message: `Rejected ${request.studentName}'s request for ${request.subject}`,
        type: "warning",
        relatedRequestId: requestId,
      });
    }
    
    toast.success("Request rejected");
  };

  const updateRequestStatus = (requestId: string, status: "approved" | "rejected") => {
    const now = new Date().toISOString();
    
    const allPending = JSON.parse(localStorage.getItem("pendingRequests") || "[]");
    const updatedPending = allPending.map((r: Request) =>
      r.id === requestId ? { ...r, status, updatedAt: now } : r
    );
    localStorage.setItem("pendingRequests", JSON.stringify(updatedPending));

    const studentRequests = JSON.parse(localStorage.getItem("studentRequests") || "[]");
    const updatedStudent = studentRequests.map((r: Request) =>
      r.id === requestId ? { ...r, status, updatedAt: now } : r
    );
    localStorage.setItem("studentRequests", JSON.stringify(updatedStudent));

    if (status === "approved") {
      const approved = JSON.parse(localStorage.getItem("approvedRequests") || "[]");
      const request = allPending.find((r: Request) => r.id === requestId);
      if (request) {
        approved.push({ ...request, status: "approved", updatedAt: now });
        localStorage.setItem("approvedRequests", JSON.stringify(approved));
      }
    }

    loadRequests();
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

  // Statistics
  const stats: StatItem[] = useMemo(() => {
    const total = allRequests.length;
    const approved = allRequests.filter(r => r.status === "approved").length;
    const pending = allRequests.filter(r => r.status === "pending").length;
    const rejected = allRequests.filter(r => r.status === "rejected").length;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return [
      {
        title: "Total Requests",
        value: total,
        icon: <FileText className="h-5 w-5" />,
        trend: 12,
        description: "All time",
      },
      {
        title: "Approved",
        value: approved,
        icon: <CheckCircle className="h-5 w-5" />,
        description: `${approvalRate}% approval rate`,
      },
      {
        title: "Pending Review",
        value: pending,
        icon: <Clock className="h-5 w-5" />,
        description: "Needs action",
      },
      {
        title: "Rejected",
        value: rejected,
        icon: <XCircle className="h-5 w-5" />,
        description: "Not approved",
      },
    ];
  }, [allRequests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return allRequests.filter(request => {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        request.studentName.toLowerCase().includes(searchLower) ||
        request.subject.toLowerCase().includes(searchLower) ||
        request.reason.toLowerCase().includes(searchLower);
      
      const matchesStatus = filters.status === "all" || request.status === filters.status;
      const matchesSubject = filters.subject === "all" || request.subject === filters.subject;
      
      const matchesDateFrom = !filters.dateFrom || request.date >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || request.date <= filters.dateTo;

      return matchesSearch && matchesStatus && matchesSubject && matchesDateFrom && matchesDateTo;
    });
  }, [allRequests, filters]);

  // Unique subjects for filter
  const uniqueSubjects = useMemo(() => {
    return Array.from(new Set(allRequests.map(r => r.subject)));
  }, [allRequests]);

  return (
    <DashboardLayout 
      title="HOD Dashboard" 
      icon={<ClipboardList className="h-8 w-8 text-foreground" />}
    >
      <StatisticsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending requests</p>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg bg-yellow-50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{request.studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            Subject: {request.subject}
                          </p>
                          <p className="text-sm text-muted-foreground">Absence Date: {request.date}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted: {new Date(request.submittedAt).toLocaleDateString()} at {new Date(request.submittedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm mb-4 text-muted-foreground">
                        <span className="font-medium text-foreground">Reason:</span> {request.reason}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(request.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(request.id)}
                          variant="destructive"
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">All Requests History</CardTitle>
              <ExportButton data={filteredRequests} filename="hod_requests" />
            </CardHeader>
            <CardContent className="space-y-4">
              <SearchFilterPanel 
                filters={filters}
                onFilterChange={setFilters}
                subjects={uniqueSubjects}
              />

              {filteredRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {allRequests.length === 0 ? "No requests yet" : "No requests match your filters"}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{request.studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            Subject: {request.subject}
                          </p>
                          <p className="text-sm text-muted-foreground">Absence Date: {request.date}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted: {new Date(request.submittedAt).toLocaleDateString()} at {new Date(request.submittedAt).toLocaleTimeString()}
                          </p>
                          {request.updatedAt && (
                            <p className="text-xs text-muted-foreground">
                              Reviewed: {new Date(request.updatedAt).toLocaleDateString()} at {new Date(request.updatedAt).toLocaleTimeString()}
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
          <CalendarPanel />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HODDashboard;

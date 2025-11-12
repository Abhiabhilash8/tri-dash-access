import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import CalendarPanel from "@/components/CalendarPanel";
import StatisticsCards, { StatItem } from "@/components/StatisticsCards";
import SearchFilterPanel, { FilterState } from "@/components/SearchFilterPanel";
import ExportButton from "@/components/ExportButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Check, X, CheckCircle, Clock, XCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";

interface Request {
  id: string;
  subject: string;
  date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  studentName: string;
  sentTo?: "hod" | "faculty";
  submittedAt: string;
  updatedAt?: string;
}

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [pendingRequests, setPendingRequests] = useState<Request[]>([]);
  const [allDirectRequests, setAllDirectRequests] = useState<Request[]>([]);
  const [hodApprovedRequests, setHodApprovedRequests] = useState<Request[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    subject: "all",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "faculty") {
      navigate("/login");
    }
    loadRequests();
  }, [navigate]);

  const loadRequests = () => {
    const facultyAll = JSON.parse(localStorage.getItem("facultyPendingRequests") || "[]");
    facultyAll.sort((a: Request, b: Request) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    setAllDirectRequests(facultyAll);
    setPendingRequests(facultyAll.filter((r: Request) => r.status === "pending"));
    
    const approved = JSON.parse(localStorage.getItem("approvedRequests") || "[]");
    approved.sort((a: Request, b: Request) => 
      new Date(b.updatedAt || b.submittedAt).getTime() - new Date(a.updatedAt || a.submittedAt).getTime()
    );
    setHodApprovedRequests(approved);
  };

  const handleApprove = (requestId: string) => {
    const request = allDirectRequests.find(r => r.id === requestId);
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
    const request = allDirectRequests.find(r => r.id === requestId);
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
    
    const facultyPending = JSON.parse(localStorage.getItem("facultyPendingRequests") || "[]");
    const updatedPending = facultyPending.map((r: Request) =>
      r.id === requestId ? { ...r, status, updatedAt: now } : r
    );
    localStorage.setItem("facultyPendingRequests", JSON.stringify(updatedPending));

    const studentRequests = JSON.parse(localStorage.getItem("studentRequests") || "[]");
    const updatedStudent = studentRequests.map((r: Request) =>
      r.id === requestId ? { ...r, status, updatedAt: now } : r
    );
    localStorage.setItem("studentRequests", JSON.stringify(updatedStudent));

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
    const directTotal = allDirectRequests.length;
    const directApproved = allDirectRequests.filter(r => r.status === "approved").length;
    const directPending = allDirectRequests.filter(r => r.status === "pending").length;
    const hodApproved = hodApprovedRequests.length;

    return [
      {
        title: "Direct Requests",
        value: directTotal,
        icon: <FileText className="h-5 w-5" />,
        trend: 8,
        description: "Sent to faculty",
      },
      {
        title: "You Approved",
        value: directApproved,
        icon: <CheckCircle className="h-5 w-5" />,
        description: "Direct approvals",
      },
      {
        title: "Pending Review",
        value: directPending,
        icon: <Clock className="h-5 w-5" />,
        description: "Needs action",
      },
      {
        title: "HOD Approved",
        value: hodApproved,
        icon: <CheckCircle className="h-5 w-5" />,
        description: "From HOD",
      },
    ];
  }, [allDirectRequests, hodApprovedRequests]);

  // Filtered requests
  const filteredDirectRequests = useMemo(() => {
    return allDirectRequests.filter(request => {
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
  }, [allDirectRequests, filters]);

  // Unique subjects for filter
  const uniqueSubjects = useMemo(() => {
    return Array.from(new Set([...allDirectRequests.map(r => r.subject), ...hodApprovedRequests.map(r => r.subject)]));
  }, [allDirectRequests, hodApprovedRequests]);

  return (
    <DashboardLayout 
      title="Faculty Dashboard" 
      icon={<Users className="h-8 w-8 text-foreground" />}
    >
      <StatisticsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Direct Requests - Pending Review</CardTitle>
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
              <CardTitle className="text-lg">Direct Requests History</CardTitle>
              <ExportButton data={filteredDirectRequests} filename="faculty_direct_requests" />
            </CardHeader>
            <CardContent className="space-y-4">
              <SearchFilterPanel 
                filters={filters}
                onFilterChange={setFilters}
                subjects={uniqueSubjects}
              />

              {filteredDirectRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {allDirectRequests.length === 0 ? "No direct requests yet" : "No requests match your filters"}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredDirectRequests.map((request) => (
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

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">HOD Approved Requests</CardTitle>
              <ExportButton data={hodApprovedRequests} filename="hod_approved_requests" />
            </CardHeader>
            <CardContent>
              {hodApprovedRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No HOD approved requests yet</p>
              ) : (
                <div className="space-y-3">
                  {hodApprovedRequests.map((request) => (
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
                              Approved: {new Date(request.updatedAt).toLocaleDateString()} at {new Date(request.updatedAt).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Approved by HOD
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

export default FacultyDashboard;

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import CalendarPanel from "@/components/CalendarPanel";
import StatisticsCards, { StatItem } from "@/components/StatisticsCards";
import SearchFilterPanel, { FilterState } from "@/components/SearchFilterPanel";
import ExportButton from "@/components/ExportButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ClipboardList, Check, X, CheckCircle, Clock, XCircle, FileText, AlertTriangle, Timer } from "lucide-react";
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
  urgent?: boolean;
  rejectionReason?: string;
  sentTo?: "hod" | "faculty" | "both";
}

const HODDashboard = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [pendingRequests, setPendingRequests] = useState<Request[]>([]);
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<"approve" | "reject">("approve");
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
    // Sort by urgent first, then by submission time
    all.sort((a: Request, b: Request) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
    setAllRequests(all);
    const pending = all.filter((r: Request) => r.status === "pending");
    setPendingRequests(pending);
    setSelectedRequests(new Set());
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

  const handleReject = (requestId: string, reason?: string) => {
    const request = allRequests.find(r => r.id === requestId);
    updateRequestStatus(requestId, "rejected", reason);
    
    if (request) {
      addNotification({
        message: `Rejected ${request.studentName}'s request for ${request.subject}`,
        type: "warning",
        relatedRequestId: requestId,
      });
    }
    
    toast.success("Request rejected");
  };

  const handleBulkAction = () => {
    const action = bulkAction;
    const count = selectedRequests.size;
    
    selectedRequests.forEach(requestId => {
      if (action === "approve") {
        handleApprove(requestId);
      } else {
        handleReject(requestId, "Bulk rejection");
      }
    });

    toast.success(`${count} request${count > 1 ? 's' : ''} ${action === "approve" ? "approved" : "rejected"}`);
    setShowBulkDialog(false);
    setSelectedRequests(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedRequests.size === pendingRequests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(pendingRequests.map(r => r.id)));
    }
  };

  const toggleSelectRequest = (requestId: string) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
    } else {
      newSelected.add(requestId);
    }
    setSelectedRequests(newSelected);
  };

  const updateRequestStatus = (requestId: string, status: "approved" | "rejected", rejectionReason?: string) => {
    const now = new Date().toISOString();
    
    const allPending = JSON.parse(localStorage.getItem("pendingRequests") || "[]");
    const updatedPending = allPending.map((r: Request) =>
      r.id === requestId ? { ...r, status, updatedAt: now, rejectionReason } : r
    );
    localStorage.setItem("pendingRequests", JSON.stringify(updatedPending));

    const studentRequests = JSON.parse(localStorage.getItem("studentRequests") || "[]");
    const updatedStudent = studentRequests.map((r: Request) =>
      r.id === requestId ? { ...r, status, updatedAt: now, rejectionReason } : r
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

  const getPendingSince = (submittedAt: string): string => {
    const diffMs = Date.now() - new Date(submittedAt).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    return 'Just now';
  };

  const isOldRequest = (submittedAt: string): boolean => {
    const diffMs = Date.now() - new Date(submittedAt).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays >= 5;
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

    // Calculate average response time in hours
    const reviewedRequests = allRequests.filter(r => r.updatedAt);
    const avgResponseTime = reviewedRequests.length > 0
      ? Math.round(
          reviewedRequests.reduce((sum, r) => {
            const diff = new Date(r.updatedAt!).getTime() - new Date(r.submittedAt).getTime();
            return sum + diff / (1000 * 60 * 60);
          }, 0) / reviewedRequests.length
        )
      : 0;

    // Today's workload
    const today = new Date().toDateString();
    const todayCount = allRequests.filter(r => 
      new Date(r.submittedAt).toDateString() === today
    ).length;

    return [
      {
        title: "Total Requests",
        value: total,
        icon: <FileText className="h-5 w-5" />,
        trend: 12,
        description: "All time",
      },
      {
        title: "Avg Response Time",
        value: avgResponseTime > 0 ? `${avgResponseTime}h` : "-",
        icon: <Timer className="h-5 w-5" />,
        description: reviewedRequests.length > 0 ? `${reviewedRequests.length} reviewed` : "No data yet",
      },
      {
        title: "Pending Review",
        value: pending,
        icon: <Clock className="h-5 w-5" />,
        description: "Needs action",
      },
      {
        title: "Today's Workload",
        value: todayCount,
        icon: <AlertTriangle className="h-5 w-5" />,
        description: "Submitted today",
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Pending Requests</CardTitle>
              {selectedRequests.size > 0 && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setBulkAction("approve");
                      setShowBulkDialog(true);
                    }}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve Selected ({selectedRequests.size})
                  </Button>
                  <Button
                    onClick={() => {
                      setBulkAction("reject");
                      setShowBulkDialog(true);
                    }}
                    size="sm"
                    variant="destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject Selected ({selectedRequests.size})
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending requests</p>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.length > 0 && (
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Checkbox
                        checked={selectedRequests.size === pendingRequests.length}
                        onCheckedChange={toggleSelectAll}
                      />
                      <span className="text-sm font-medium">Select All</span>
                    </div>
                  )}
                  {pendingRequests.map((request) => {
                    const isOld = isOldRequest(request.submittedAt);
                    const pendingSince = getPendingSince(request.submittedAt);
                    
                    return (
                      <div 
                        key={request.id} 
                        className={`p-4 border rounded-lg ${
                          request.urgent 
                            ? 'bg-destructive/10 border-destructive' 
                            : isOld 
                            ? 'bg-yellow-50 border-yellow-300' 
                            : 'bg-yellow-50'
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <Checkbox
                            checked={selectedRequests.has(request.id)}
                            onCheckedChange={() => toggleSelectRequest(request.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {request.urgent && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-destructive text-destructive-foreground flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  URGENT
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Pending {pendingSince}
                              </span>
                            </div>
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
                        <p className="text-sm mb-4 text-muted-foreground ml-9">
                          <span className="font-medium text-foreground">Reason:</span> {request.reason}
                        </p>
                        <div className="flex gap-2 ml-9">
                          <Button
                            onClick={() => handleApprove(request.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="destructive" className="flex-1">
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-card">
                              <DropdownMenuItem onClick={() => handleReject(request.id, "Invalid date")}>
                                Invalid date
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReject(request.id, "Incomplete information")}>
                                Incomplete information
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReject(request.id, "Exceeds attendance limit")}>
                                Exceeds attendance limit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReject(request.id, "Duplicate request")}>
                                Duplicate request
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReject(request.id, "Custom reason")}>
                                Custom reason
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
            <AlertDialogContent className="bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {bulkAction === "approve" ? "Approve" : "Reject"} {selectedRequests.size} Request{selectedRequests.size > 1 ? "s" : ""}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to {bulkAction} {selectedRequests.size} selected request{selectedRequests.size > 1 ? "s" : ""}? 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkAction}>
                  Confirm {bulkAction === "approve" ? "Approval" : "Rejection"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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
                    <div key={request.id} className={`p-4 border rounded-lg ${request.urgent ? 'border-destructive bg-destructive/5' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {request.urgent && (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                            <p className="font-semibold text-lg">{request.studentName}</p>
                          </div>
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
                        <div className="flex flex-col items-end gap-2">
                          {request.urgent && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive text-destructive-foreground">
                              URGENT
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        <span className="font-medium text-foreground">Reason:</span> {request.reason}
                      </p>
                      {request.rejectionReason && request.status === "rejected" && (
                        <p className="text-sm text-destructive mt-2">
                          <span className="font-medium">Rejection Reason:</span> {request.rejectionReason}
                        </p>
                      )}
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

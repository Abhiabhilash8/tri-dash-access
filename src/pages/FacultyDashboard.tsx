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
import { Users, Check, X, CheckCircle, Clock, XCircle, FileText, AlertTriangle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";

interface Request {
  id: string;
  subject: string;
  date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  studentName: string;
  sentTo?: "hod" | "faculty" | "both";
  submittedAt: string;
  updatedAt?: string;
  urgent?: boolean;
  rejectionReason?: string;
}

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [pendingRequests, setPendingRequests] = useState<Request[]>([]);
  const [allDirectRequests, setAllDirectRequests] = useState<Request[]>([]);
  const [hodApprovedRequests, setHodApprovedRequests] = useState<Request[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<"approve" | "reject">("approve");
  const [keywordFilter, setKeywordFilter] = useState("");
  const [showKeywordDialog, setShowKeywordDialog] = useState(false);
  const [keywordAction, setKeywordAction] = useState<"approve" | "reject">("approve");
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
    // Sort by urgent first, then by submission time
    facultyAll.sort((a: Request, b: Request) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
    setAllDirectRequests(facultyAll);
    const pending = facultyAll.filter((r: Request) => r.status === "pending");
    setPendingRequests(pending);
    setSelectedRequests(new Set());
    
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

  const handleReject = (requestId: string, reason?: string) => {
    const request = allDirectRequests.find(r => r.id === requestId);
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

  const handleKeywordAction = () => {
    const matchingRequests = getKeywordMatchingRequests();
    const count = matchingRequests.length;
    
    matchingRequests.forEach(request => {
      if (keywordAction === "approve") {
        handleApprove(request.id);
      } else {
        handleReject(request.id, `Bulk rejection - keyword: "${keywordFilter}"`);
      }
    });

    toast.success(`${count} request${count > 1 ? 's' : ''} matching "${keywordFilter}" ${keywordAction === "approve" ? "approved" : "rejected"}`);
    setShowKeywordDialog(false);
    setKeywordFilter("");
  };

  const getKeywordMatchingRequests = () => {
    if (!keywordFilter.trim()) return [];
    
    const keyword = keywordFilter.toLowerCase();
    return pendingRequests.filter(request =>
      request.studentName.toLowerCase().includes(keyword) ||
      request.subject.toLowerCase().includes(keyword) ||
      request.reason.toLowerCase().includes(keyword)
    );
  };

  const updateRequestStatus = (requestId: string, status: "approved" | "rejected", rejectionReason?: string) => {
    const now = new Date().toISOString();
    
    const facultyPending = JSON.parse(localStorage.getItem("facultyPendingRequests") || "[]");
    const updatedPending = facultyPending.map((r: Request) =>
      r.id === requestId ? { ...r, status, updatedAt: now, rejectionReason } : r
    );
    localStorage.setItem("facultyPendingRequests", JSON.stringify(updatedPending));

    const studentRequests = JSON.parse(localStorage.getItem("studentRequests") || "[]");
    const updatedStudent = studentRequests.map((r: Request) =>
      r.id === requestId ? { ...r, status, updatedAt: now, rejectionReason } : r
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
    const directRejected = allDirectRequests.filter(r => r.status === "rejected").length;
    const approvalRate = directTotal > 0 ? Math.round((directApproved / directTotal) * 100) : 0;

    return [
      {
        title: "Direct Requests",
        value: directTotal,
        icon: <FileText className="h-5 w-5" />,
        trend: 8,
        description: "Sent to faculty",
      },
      {
        title: "Approved",
        value: directApproved,
        icon: <CheckCircle className="h-5 w-5" />,
        description: `${approvalRate}% approval rate`,
      },
      {
        title: "Pending Review",
        value: directPending,
        icon: <Clock className="h-5 w-5" />,
        description: "Needs action",
      },
      {
        title: "Rejected",
        value: directRejected,
        icon: <XCircle className="h-5 w-5" />,
        description: "Not approved",
      },
    ];
  }, [allDirectRequests]);

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
                  {/* Keyword Filter Section */}
                  <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                    <div className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Filter by keyword (student, subject, reason)..."
                        value={keywordFilter}
                        onChange={(e) => setKeywordFilter(e.target.value)}
                        className="flex-1"
                      />
                      {keywordFilter && (
                        <Badge variant="secondary">
                          {getKeywordMatchingRequests().length} matching
                        </Badge>
                      )}
                    </div>
                    {keywordFilter && getKeywordMatchingRequests().length > 0 && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setKeywordAction("approve");
                            setShowKeywordDialog(true);
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept All ({getKeywordMatchingRequests().length})
                        </Button>
                        <Button
                          onClick={() => {
                            setKeywordAction("reject");
                            setShowKeywordDialog(true);
                          }}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject All ({getKeywordMatchingRequests().length})
                        </Button>
                      </div>
                    )}
                    {keywordFilter && getKeywordMatchingRequests().length === 0 && (
                      <p className="text-sm text-muted-foreground">No matching requests</p>
                    )}
                  </div>

                  {/* Bulk Selection Section */}
                  {selectedRequests.size > 0 && (
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <span className="text-sm font-medium">{selectedRequests.size} request{selectedRequests.size > 1 ? 's' : ''} selected</span>
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
                          Approve Selected
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
                          Reject Selected
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Checkbox
                      checked={selectedRequests.size === pendingRequests.length}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm font-medium">Select All</span>
                  </div>

                  {pendingRequests.map((request) => {
                    const isMatching = keywordFilter && getKeywordMatchingRequests().some(r => r.id === request.id);
                    
                    return (
                      <div 
                        key={request.id} 
                        className={`p-4 border rounded-lg transition-all ${
                          isMatching
                            ? 'bg-blue-50 border-blue-300 shadow-md'
                            : request.urgent 
                            ? 'bg-destructive/10 border-destructive' 
                            : 'bg-card'
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

          <AlertDialog open={showKeywordDialog} onOpenChange={setShowKeywordDialog}>
            <AlertDialogContent className="bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  {keywordAction === "approve" ? "Accept" : "Reject"} All Matching "{keywordFilter}"?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="space-y-2">
                    <p>
                      You are about to {keywordAction} <span className="font-bold text-foreground">{getKeywordMatchingRequests().length} request{getKeywordMatchingRequests().length > 1 ? 's' : ''}</span> matching the keyword{' '}
                      <span className="font-bold text-primary">"{keywordFilter}"</span>.
                    </p>
                    <p className="text-sm">
                      This action cannot be undone. Non-matching requests will remain unaffected.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleKeywordAction}
                  className={keywordAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                >
                  Confirm {keywordAction === "approve" ? "Accept" : "Reject"} All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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

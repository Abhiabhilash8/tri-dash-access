import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import CalendarPanel from "@/components/CalendarPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Check, X } from "lucide-react";
import { toast } from "sonner";

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
  const [pendingRequests, setPendingRequests] = useState<Request[]>([]);
  const [allDirectRequests, setAllDirectRequests] = useState<Request[]>([]);
  const [hodApprovedRequests, setHodApprovedRequests] = useState<Request[]>([]);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "faculty") {
      navigate("/login");
    }
    loadRequests();
  }, [navigate]);

  const loadRequests = () => {
    // Load direct requests sent to faculty
    const facultyAll = JSON.parse(localStorage.getItem("facultyPendingRequests") || "[]");
    facultyAll.sort((a: Request, b: Request) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    setAllDirectRequests(facultyAll);
    setPendingRequests(facultyAll.filter((r: Request) => r.status === "pending"));
    
    // Load HOD approved requests
    const approved = JSON.parse(localStorage.getItem("approvedRequests") || "[]");
    approved.sort((a: Request, b: Request) => 
      new Date(b.updatedAt || b.submittedAt).getTime() - new Date(a.updatedAt || a.submittedAt).getTime()
    );
    setHodApprovedRequests(approved);
  };

  const handleApprove = (requestId: string) => {
    updateRequestStatus(requestId, "approved");
    toast.success("Request approved!");
  };

  const handleReject = (requestId: string) => {
    updateRequestStatus(requestId, "rejected");
    toast.success("Request rejected");
  };

  const updateRequestStatus = (requestId: string, status: "approved" | "rejected") => {
    const now = new Date().toISOString();
    
    // Update faculty pending requests
    const facultyPending = JSON.parse(localStorage.getItem("facultyPendingRequests") || "[]");
    const updatedPending = facultyPending.map((r: Request) =>
      r.id === requestId ? { ...r, status, updatedAt: now } : r
    );
    localStorage.setItem("facultyPendingRequests", JSON.stringify(updatedPending));

    // Update student requests
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

  return (
    <DashboardLayout 
      title="Faculty Dashboard" 
      icon={<Users className="h-8 w-8 text-foreground" />}
    >
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
            <CardHeader>
              <CardTitle className="text-lg">Direct Requests History</CardTitle>
            </CardHeader>
            <CardContent>
              {allDirectRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No direct requests yet</p>
              ) : (
                <div className="space-y-3">
                  {allDirectRequests.map((request) => (
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
            <CardHeader>
              <CardTitle className="text-lg">HOD Approved Requests</CardTitle>
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

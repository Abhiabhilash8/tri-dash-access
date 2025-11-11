import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import CalendarPanel from "@/components/CalendarPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Request {
  id: string;
  subject: string;
  date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  studentName: string;
}

const HODDashboard = () => {
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState<Request[]>([]);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "hod") {
      navigate("/login");
    }
    loadPendingRequests();
  }, [navigate]);

  const loadPendingRequests = () => {
    const pending = JSON.parse(localStorage.getItem("pendingRequests") || "[]");
    setPendingRequests(pending.filter((r: Request) => r.status === "pending"));
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
    // Update pending requests
    const allPending = JSON.parse(localStorage.getItem("pendingRequests") || "[]");
    const updatedPending = allPending.map((r: Request) =>
      r.id === requestId ? { ...r, status } : r
    );
    localStorage.setItem("pendingRequests", JSON.stringify(updatedPending));

    // Update student requests
    const studentRequests = JSON.parse(localStorage.getItem("studentRequests") || "[]");
    const updatedStudent = studentRequests.map((r: Request) =>
      r.id === requestId ? { ...r, status } : r
    );
    localStorage.setItem("studentRequests", JSON.stringify(updatedStudent));

    // If approved, add to faculty view
    if (status === "approved") {
      const approved = JSON.parse(localStorage.getItem("approvedRequests") || "[]");
      const request = allPending.find((r: Request) => r.id === requestId);
      if (request) {
        approved.push({ ...request, status: "approved" });
        localStorage.setItem("approvedRequests", JSON.stringify(approved));
      }
    }

    loadPendingRequests();
  };

  return (
    <DashboardLayout 
      title="HOD Dashboard" 
      icon={<ClipboardList className="h-8 w-8 text-foreground" />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
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
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{request.studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            Subject: {request.subject}
                          </p>
                          <p className="text-sm text-muted-foreground">Date: {request.date}</p>
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
        </div>

        <div className="lg:col-span-1">
          <CalendarPanel />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HODDashboard;

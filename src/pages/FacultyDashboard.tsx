import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import CalendarPanel from "@/components/CalendarPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface Request {
  id: string;
  subject: string;
  date: string;
  reason: string;
  status: "approved";
  studentName: string;
}

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [approvedRequests, setApprovedRequests] = useState<Request[]>([]);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "faculty") {
      navigate("/login");
    }
    loadApprovedRequests();
  }, [navigate]);

  const loadApprovedRequests = () => {
    const approved = JSON.parse(localStorage.getItem("approvedRequests") || "[]");
    setApprovedRequests(approved);
  };

  return (
    <DashboardLayout 
      title="Faculty Dashboard" 
      icon={<Users className="h-8 w-8 text-foreground" />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">HOD Approved Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {approvedRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No approved requests</p>
              ) : (
                <div className="space-y-4">
                  {approvedRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{request.studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            Subject: {request.subject}
                          </p>
                          <p className="text-sm text-muted-foreground">Date: {request.date}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Approved
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import CalendarPanel from "@/components/CalendarPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Send } from "lucide-react";
import { toast } from "sonner";

interface Request {
  id: string;
  subject: string;
  date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  studentName: string;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [requests, setRequests] = useState<Request[]>([]);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "student") {
      navigate("/login");
    }
    // Load requests from localStorage
    const saved = localStorage.getItem("studentRequests");
    if (saved) {
      setRequests(JSON.parse(saved));
    }
  }, [navigate]);

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
    };

    const updatedRequests = [...requests, newRequest];
    setRequests(updatedRequests);
    localStorage.setItem("studentRequests", JSON.stringify(updatedRequests));
    
    // Save to pending requests for HOD
    const pending = JSON.parse(localStorage.getItem("pendingRequests") || "[]");
    pending.push(newRequest);
    localStorage.setItem("pendingRequests", JSON.stringify(pending));

    toast.success("Request submitted successfully!");
    setSubject("");
    setDate("");
    setReason("");
  };

  return (
    <DashboardLayout 
      title="Student Dashboard" 
      icon={<GraduationCap className="h-8 w-8 text-foreground" />}
    >
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
                <Button type="submit" className="w-full flex items-center justify-center gap-2">
                  <Send className="h-4 w-4" />
                  Submit Request
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Your Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No requests submitted yet</p>
              ) : (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{request.subject}</p>
                          <p className="text-sm text-muted-foreground">{request.date}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            request.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : request.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.reason}</p>
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

export default StudentDashboard;

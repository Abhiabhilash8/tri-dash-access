import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CalendarPanelProps {
  onQuickSubmit?: (date: string, subject: string, reason: string) => void;
  showQuickSubmit?: boolean;
}

const CalendarPanel = ({ onQuickSubmit, showQuickSubmit = false }: CalendarPanelProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [requestDates, setRequestDates] = useState<{ [key: string]: string }>({});
  const [holidays, setHolidays] = useState<{ [key: string]: string }>({});
  const [quickSubject, setQuickSubject] = useState("");
  const [quickReason, setQuickReason] = useState("");

  useEffect(() => {
    loadRequestDates();
    loadHolidays();
  }, []);

  const loadRequestDates = () => {
    const requests = JSON.parse(localStorage.getItem("studentRequests") || "[]");
    const dateMap: { [key: string]: string } = {};
    requests.forEach((req: any) => {
      dateMap[req.date] = req.status;
    });
    setRequestDates(dateMap);
  };

  const loadHolidays = () => {
    const savedHolidays = localStorage.getItem("holidays");
    if (savedHolidays) {
      setHolidays(JSON.parse(savedHolidays));
    } else {
      // Default holidays for current year
      const year = new Date().getFullYear();
      const defaultHolidays: { [key: string]: string } = {
        [`${year}-01-01`]: "New Year",
        [`${year}-01-26`]: "Republic Day",
        [`${year}-08-15`]: "Independence Day",
        [`${year}-10-02`]: "Gandhi Jayanti",
        [`${year}-12-25`]: "Christmas",
      };
      setHolidays(defaultHolidays);
      localStorage.setItem("holidays", JSON.stringify(defaultHolidays));
    }
  };

  const month = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = 
    currentMonth.getMonth() === today.getMonth() && 
    currentMonth.getFullYear() === today.getFullYear();
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = [];
  
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getDayClass = (day: number | null) => {
    if (!day) return "";
    
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = isCurrentMonth && day === today.getDate();
    const isHoliday = holidays[dateStr];
    const requestStatus = requestDates[dateStr];

    let classes = "text-center py-2 rounded-lg text-sm relative cursor-pointer transition-all ";
    
    if (isToday) {
      classes += "bg-primary text-primary-foreground font-bold ring-2 ring-primary ring-offset-2 ";
    } else if (isHoliday) {
      classes += "bg-red-100 text-red-700 font-semibold ";
    } else if (requestStatus === "approved") {
      classes += "bg-green-100 text-green-700 font-medium ";
    } else if (requestStatus === "rejected") {
      classes += "bg-red-50 text-red-600 ";
    } else if (requestStatus === "pending") {
      classes += "bg-yellow-100 text-yellow-700 ";
    } else {
      classes += "hover:bg-muted ";
    }
    
    return classes;
  };

  const getDayBadge = (day: number | null) => {
    if (!day) return null;
    
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isHoliday = holidays[dateStr];
    const requestStatus = requestDates[dateStr];

    if (isHoliday) {
      return (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-[8px] text-red-600 font-bold">
          {isHoliday}
        </div>
      );
    }
    
    if (requestStatus) {
      return (
        <div className="absolute -top-1 -right-1">
          <div className={`h-2 w-2 rounded-full ${
            requestStatus === "approved" ? "bg-green-500" :
            requestStatus === "rejected" ? "bg-red-500" :
            "bg-yellow-500"
          }`} />
        </div>
      );
    }
    
    return null;
  };

  const handleDayClick = (day: number | null) => {
    if (!day) return;
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  const handleQuickSubmit = () => {
    if (selectedDate && quickSubject && quickReason && onQuickSubmit) {
      onQuickSubmit(selectedDate, quickSubject, quickReason);
      setSelectedDate(null);
      setQuickSubject("");
      setQuickReason("");
    }
  };

  // Calculate stats
  const totalRequests = Object.keys(requestDates).length;
  const approvedCount = Object.values(requestDates).filter(s => s === "approved").length;
  const pendingCount = Object.values(requestDates).filter(s => s === "pending").length;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {month}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={previousMonth} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-1">
              {day}
            </div>
          ))}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={getDayClass(day)}
              onClick={() => handleDayClick(day)}
            >
              {day}
              {getDayBadge(day)}
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-4 border-t">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Approved</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span>Rejected</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
            <div className="text-center">
              <div className="font-semibold text-lg">{totalRequests}</div>
              <div className="text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-green-600">{approvedCount}</div>
              <div className="text-muted-foreground">Approved</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-yellow-600">{pendingCount}</div>
              <div className="text-muted-foreground">Pending</div>
            </div>
          </div>
        </div>
      </CardContent>

      {showQuickSubmit && selectedDate && (
        <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quick Submit for {selectedDate}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={quickSubject}
                  onChange={(e) => setQuickSubject(e.target.value)}
                  placeholder="Enter subject"
                />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={quickReason}
                  onChange={(e) => setQuickReason(e.target.value)}
                  placeholder="Enter reason"
                  rows={3}
                />
              </div>
              <Button onClick={handleQuickSubmit} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Submit Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default CalendarPanel;

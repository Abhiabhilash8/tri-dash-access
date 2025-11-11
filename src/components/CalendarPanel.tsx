import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";

const CalendarPanel = () => {
  const currentDate = new Date();
  const month = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  // Get first day of month and number of days
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const today = currentDate.getDate();
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarIcon className="h-5 w-5 text-primary" />
          {month}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`text-center py-2 rounded-lg text-sm ${
                day === today
                  ? 'bg-primary text-primary-foreground font-bold'
                  : day
                  ? 'hover:bg-muted cursor-pointer'
                  : ''
              }`}
            >
              {day}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarPanel;

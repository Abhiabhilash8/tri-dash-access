import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Request {
  id: string;
  subject: string;
  date: string;
  reason: string;
  status: string;
  studentName: string;
  submittedAt: string;
  updatedAt?: string;
}

interface ExportButtonProps {
  data: Request[];
  filename: string;
}

const ExportButton = ({ data, filename }: ExportButtonProps) => {
  const exportToCSV = () => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Student Name", "Subject", "Absence Date", "Reason", "Status", "Submitted At", "Updated At"];
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        [
          `"${row.studentName}"`,
          `"${row.subject}"`,
          row.date,
          `"${row.reason}"`,
          row.status,
          new Date(row.submittedAt).toLocaleString(),
          row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "N/A",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("CSV exported successfully!");
  };

  const exportToPDF = () => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #8B5CF6; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #8B5CF6; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .status-pending { color: #ca8a04; }
          .status-approved { color: #16a34a; }
          .status-rejected { color: #dc2626; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>UniPortal Attendance Report</h1>
        <p><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Records:</strong> ${data.length}</p>
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Subject</th>
              <th>Absence Date</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (row) => `
              <tr>
                <td>${row.studentName}</td>
                <td>${row.subject}</td>
                <td>${row.date}</td>
                <td>${row.reason}</td>
                <td class="status-${row.status}">${row.status.toUpperCase()}</td>
                <td>${new Date(row.submittedAt).toLocaleString()}</td>
                <td>${row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "N/A"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <div class="footer">
          <p>UniPortal Dashboard - Attendance Management System</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
      toast.success("PDF export initiated!");
    } else {
      toast.error("Please allow popups to export PDF");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card">
        <DropdownMenuItem onClick={exportToCSV}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;

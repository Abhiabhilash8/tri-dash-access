import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export interface FilterState {
  search: string;
  status: string;
  subject: string;
  dateFrom: string;
  dateTo: string;
}

interface SearchFilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  subjects: string[];
}

const SearchFilterPanel = ({ filters, onFilterChange, subjects }: SearchFilterPanelProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleReset = () => {
    onFilterChange({
      search: "",
      status: "all",
      subject: "all",
      dateFrom: "",
      dateTo: "",
    });
  };

  const activeFilterCount = [
    filters.search,
    filters.status !== "all",
    filters.subject !== "all",
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  const quickFilters = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, subject, or reason..."
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="destructive"
              className="ml-2 h-5 w-5 flex items-center justify-center p-0"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" onClick={handleReset}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {quickFilters.map((filter) => (
          <Badge
            key={filter.value}
            variant={filters.status === filter.value ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onFilterChange({ ...filters, status: filter.value })}
          >
            {filter.label}
          </Badge>
        ))}
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Select
                  value={filters.subject}
                  onValueChange={(value) => onFilterChange({ ...filters, subject: value })}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    <SelectItem value="all">All subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date From</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date To</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchFilterPanel;

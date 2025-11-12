import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatItem {
  title: string;
  value: number | string;
  trend?: number;
  icon: React.ReactNode;
  description?: string;
}

interface StatisticsCardsProps {
  stats: StatItem[];
}

const StatisticsCards = ({ stats }: StatisticsCardsProps) => {
  const getTrendIcon = (trend?: number) => {
    if (!trend) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getTrendColor = (trend?: number) => {
    if (!trend) return "text-muted-foreground";
    if (trend > 0) return "text-green-600";
    return "text-red-600";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className="text-primary">{stat.icon}</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            )}
            {stat.trend !== undefined && (
              <div className={`flex items-center mt-2 text-xs ${getTrendColor(stat.trend)}`}>
                {getTrendIcon(stat.trend)}
                <span className="ml-1">
                  {stat.trend > 0 ? "+" : ""}{stat.trend}% from last month
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatisticsCards;

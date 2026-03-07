import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Link } from "react-router-dom"
import { useQuotes } from "@/hooks/useQuotes"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { LoadingSpinner } from "@/components/shared"
import { MonthlyChart } from "@/components/dashboard/MonthlyChart"
import { ThicknessCostChart } from "@/components/dashboard/ThicknessCostChart"
import { TopRankingCard } from "@/components/dashboard/TopRankingCard"
import { TagDistributionChart } from "@/components/dashboard/TagDistributionChart"
import { RecentQuotesList } from "@/components/dashboard/RecentQuotesList"

const Dashboard = () => {
  const { data: quotes = [], isLoading } = useQuotes()
  const { recentQuotes, monthlyData, thicknessCosts, topThicknessesAndWorks, tagStats } = useDashboardStats(quotes)

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-foreground">Dashboard</h1></div>
        <Link to="/new-quote">
          <Button size="lg" className="gap-2"><Plus className="h-4 w-4" />Nuovo Preventivo</Button>
        </Link>
      </div>

      <MonthlyChart data={monthlyData} />
      <ThicknessCostChart data={thicknessCosts} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TopRankingCard title="Top 5 Spessori" items={topThicknessesAndWorks.topThicknesses} barColorClass="bg-primary" />
        <TopRankingCard title="Top 5 Lavorazioni" items={topThicknessesAndWorks.topWorks} barColorClass="bg-secondary" />
      </div>

      <TagDistributionChart data={tagStats} />
      <RecentQuotesList quotes={recentQuotes} />
    </div>
  )
}

export default Dashboard

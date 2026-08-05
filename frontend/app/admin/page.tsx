"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Shield,
  Scale,
  Activity,
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts"

const monthlyData = [
  { month: "Jul", cases: 320, verified: 305, tampered: 2 },
  { month: "Aug", cases: 380, verified: 362, tampered: 3 },
  { month: "Sep", cases: 420, verified: 398, tampered: 1 },
  { month: "Oct", cases: 450, verified: 432, tampered: 4 },
  { month: "Nov", cases: 490, verified: 478, tampered: 2 },
  { month: "Dec", cases: 520, verified: 502, tampered: 3 },
  { month: "Jan", cases: 580, verified: 565, tampered: 5 },
]

const evidenceTypeData = [
  { name: "Documents", value: 45, color: "oklch(0.55 0.12 250)" },
  { name: "Images", value: 30, color: "oklch(0.75 0.15 85)" },
  { name: "Videos", value: 15, color: "oklch(0.6 0.15 170)" },
  { name: "Audio", value: 10, color: "oklch(0.65 0.18 140)" },
]

const stateWiseData = [
  { state: "Maharashtra", cases: 1250 },
  { state: "Delhi", cases: 980 },
  { state: "Karnataka", cases: 850 },
  { state: "Tamil Nadu", cases: 720 },
  { state: "Gujarat", cases: 650 },
  { state: "UP", cases: 580 },
]

const recentActivity = [
  { action: "FIR Filed", case: "FIR-2024-001256", user: "SI Vikram Sharma", time: "2 min ago", type: "new" },
  { action: "Evidence Verified", case: "FIR-2024-001254", user: "Hon. Justice Singh", time: "15 min ago", type: "verified" },
  { action: "Evidence Uploaded", case: "FIR-2024-001253", user: "Inspector Meera", time: "32 min ago", type: "upload" },
  { action: "Tamper Detected", case: "FIR-2024-001230", user: "System Alert", time: "1 hour ago", type: "alert" },
  { action: "Forensic Review", case: "FIR-2024-001248", user: "Dr. Anjali Mehta", time: "2 hours ago", type: "review" },
]

const topOfficers = [
  { name: "SI Vikram Sharma", cases: 156, verified: 152, station: "Noida Sector 20" },
  { name: "Inspector Meera Joshi", cases: 142, verified: 140, station: "Delhi South" },
  { name: "SI Rahul Gupta", cases: 128, verified: 125, station: "Gurgaon Central" },
  { name: "ASI Priya Verma", cases: 115, verified: 114, station: "Mumbai Andheri" },
]

export default function AdminAnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Analytics Dashboard</h1>
            <p className="text-muted-foreground">System-wide statistics and performance metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-success/10 text-success border-success/20 px-3 py-1">
              <Activity className="h-3 w-3 mr-1" />
              Live Data
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              Last updated: Just now
            </Badge>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              label: "Total Cases", 
              value: "52,847", 
              change: "+12.5%", 
              trend: "up",
              icon: FileText, 
              color: "text-primary" 
            },
            { 
              label: "Verified Evidence", 
              value: "51,234", 
              change: "+15.2%", 
              trend: "up",
              icon: CheckCircle2, 
              color: "text-success" 
            },
            { 
              label: "Pending Reviews", 
              value: "1,589", 
              change: "-8.3%", 
              trend: "down",
              icon: Clock, 
              color: "text-warning" 
            },
            { 
              label: "Suspicious Files", 
              value: "24", 
              change: "+2", 
              trend: "up",
              icon: AlertTriangle, 
              color: "text-destructive" 
            },
          ].map((stat) => (
            <Card key={stat.label} className="glass">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    <div className={`flex items-center gap-1 mt-2 text-sm ${
                      stat.trend === "up" && stat.label !== "Suspicious Files" ? "text-success" : 
                      stat.trend === "down" && stat.label === "Pending Reviews" ? "text-success" :
                      "text-destructive"
                    }`}>
                      {stat.trend === "up" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>{stat.change}</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center">
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cases Over Time */}
          <Card className="lg:col-span-2 glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                Cases & Verification Trends
              </CardTitle>
              <CardDescription>Monthly case filing and verification statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="casesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.55 0.12 250)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.55 0.12 250)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="verifiedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.6 0.2 145)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.6 0.2 145)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.04 250)" />
                    <XAxis dataKey="month" stroke="oklch(0.65 0.02 250)" fontSize={12} />
                    <YAxis stroke="oklch(0.65 0.02 250)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.18 0.03 250)",
                        border: "1px solid oklch(0.3 0.04 250)",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cases"
                      stroke="oklch(0.55 0.12 250)"
                      fill="url(#casesGradient)"
                      strokeWidth={2}
                      name="Total Cases"
                    />
                    <Area
                      type="monotone"
                      dataKey="verified"
                      stroke="oklch(0.6 0.2 145)"
                      fill="url(#verifiedGradient)"
                      strokeWidth={2}
                      name="Verified"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Evidence Types */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Evidence Distribution</CardTitle>
              <CardDescription>By file type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={evidenceTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {evidenceTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.18 0.03 250)",
                        border: "1px solid oklch(0.3 0.04 250)",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {evidenceTypeData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                    <span className="text-sm font-medium ml-auto">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* State-wise Distribution */}
          <Card className="lg:col-span-2 glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                State-wise Case Distribution
              </CardTitle>
              <CardDescription>Top performing states by case count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stateWiseData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.04 250)" />
                    <XAxis type="number" stroke="oklch(0.65 0.02 250)" fontSize={12} />
                    <YAxis dataKey="state" type="category" stroke="oklch(0.65 0.02 250)" fontSize={12} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.18 0.03 250)",
                        border: "1px solid oklch(0.3 0.04 250)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="cases" fill="oklch(0.75 0.15 85)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-accent" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`
                      h-8 w-8 rounded-full flex items-center justify-center shrink-0
                      ${activity.type === "new" ? "bg-primary/10" : 
                        activity.type === "verified" ? "bg-success/10" :
                        activity.type === "upload" ? "bg-accent/10" :
                        activity.type === "alert" ? "bg-destructive/10" :
                        "bg-muted"}
                    `}>
                      {activity.type === "new" && <FileText className="h-4 w-4 text-primary" />}
                      {activity.type === "verified" && <CheckCircle2 className="h-4 w-4 text-success" />}
                      {activity.type === "upload" && <Shield className="h-4 w-4 text-accent" />}
                      {activity.type === "alert" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      {activity.type === "review" && <Scale className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.case}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{activity.user}</span>
                        <span className="text-muted-foreground/50">•</span>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Officers */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Top Performing Officers
            </CardTitle>
            <CardDescription>Officers with highest case filing and verification rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rank</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Officer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Station</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cases Filed</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Verified</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topOfficers.map((officer, index) => (
                    <tr key={officer.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className={`
                          h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm
                          ${index === 0 ? "bg-accent text-accent-foreground" : 
                            index === 1 ? "bg-muted-foreground/20 text-foreground" :
                            index === 2 ? "bg-warning/20 text-warning" :
                            "bg-muted text-muted-foreground"}
                        `}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{officer.name}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{officer.station}</td>
                      <td className="py-3 px-4 text-sm">{officer.cases}</td>
                      <td className="py-3 px-4 text-sm text-success">{officer.verified}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          {((officer.verified / officer.cases) * 100).toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

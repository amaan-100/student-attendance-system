'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  UserCheck, 
  UserX,
  Clock,
  TrendingUp,
  AlertTriangle,
  Building2,
  BarChart3,
  Bell
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  LineChart,
  Line
} from 'recharts'
import { 
  getAdminStats, 
  getAttendanceTrend,
  type AdminStats 
} from '@/lib/api'
import { cn } from '@/lib/utils'

const COLORS = {
  present: 'oklch(0.55 0.18 150)',  // success green
  absent: 'oklch(0.55 0.22 25)',    // destructive red
  notMarked: 'oklch(0.65 0.02 250)', // muted gray
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [trend, setTrend] = useState<{ date: string; present: number; absent: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getAdminStats(),
      getAttendanceTrend(7)
    ])
      .then(([statsData, trendData]) => {
        setStats(statsData)
        setTrend(trendData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-6 lg:p-8 text-center text-muted-foreground">
        Failed to load dashboard data
      </div>
    )
  }

  const pieData = [
    { name: 'Present', value: stats.present_today, color: COLORS.present },
    { name: 'Absent', value: stats.absent_today, color: COLORS.absent },
    { name: 'Not Marked', value: stats.not_marked_today, color: COLORS.notMarked },
  ].filter(d => d.value > 0)

  const departmentData = stats.department_stats.map(d => ({
    name: d.code,
    students: d.student_count
  }))

  const yearData = stats.year_stats.map(y => ({
    name: y.year,
    students: y.count
  }))

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">Overview of attendance statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold text-foreground">{stats.total_students}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Present Today</p>
                <p className="text-3xl font-bold text-success">{stats.present_today}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Absent Today</p>
                <p className="text-3xl font-bold text-destructive">{stats.absent_today}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <UserX className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Attendance</p>
                <p className="text-3xl font-bold text-foreground">{stats.overall_attendance_percentage}%</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-chart-1/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-chart-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Today's Attendance Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {"Today's Attendance Distribution"}
            </CardTitle>
            <CardDescription>
              Breakdown of student attendance for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, 'Students']}
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                No attendance data for today
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Weekly Attendance Trend
            </CardTitle>
            <CardDescription>
              Present vs Absent over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long', 
                        day: 'numeric' 
                      })
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="present" 
                    stroke={COLORS.present} 
                    strokeWidth={2}
                    dot={{ fill: COLORS.present }}
                    name="Present"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="absent" 
                    stroke={COLORS.absent} 
                    strokeWidth={2}
                    dot={{ fill: COLORS.absent }}
                    name="Absent"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Department and Year Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Students by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={departmentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={50} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="students" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Students by Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={yearData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="students" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Low Attendance Students */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Low Attendance Students (Below 75%)
          </CardTitle>
          <CardDescription>
            Students who need attendance improvement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.low_attendance_students.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {stats.low_attendance_students.map((student) => (
                  <div 
                    key={student.id}
                    className="flex items-center justify-between p-4 bg-destructive/5 border border-destructive/20 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">{student.name}</span>
                        <Badge variant="outline">{student.roll_number}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {student.department} | {student.year}-{student.division}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Present: {student.present_days}/{student.total_days} days
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-2xl font-bold",
                        student.percentage < 50 ? "text-destructive" : "text-warning"
                      )}>
                        {student.percentage}%
                      </p>
                      <Progress 
                        value={student.percentage} 
                        className="h-2 w-24 mt-1 [&>div]:bg-destructive" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>All students have attendance above 75%</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Recent Notifications
          </CardTitle>
          <CardDescription>
            Latest notification alerts sent to parents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recent_notifications.length > 0 ? (
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {stats.recent_notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <Bell className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {notification.student_name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.sent_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant={notification.status === 'sent' ? 'default' : 'secondary'}
                      className={cn(
                        notification.status === 'sent' && 'bg-success text-success-foreground'
                      )}
                    >
                      {notification.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No notifications sent yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

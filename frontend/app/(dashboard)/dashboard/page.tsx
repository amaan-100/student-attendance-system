'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ClipboardCheck, 
  Users, 
  Calendar,
  ArrowRight,
  Building2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getDepartments, getStudents, type Department } from '@/lib/api'

export default function TeacherDashboard() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [studentCounts, setStudentCounts] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  useEffect(() => {
    async function loadData() {
      try {
        const depts = await getDepartments()
        setDepartments(depts)
        
        // Get student counts per department
        const counts: Record<number, number> = {}
        for (const dept of depts) {
          const students = await getStudents({ department_id: String(dept.id) })
          counts[dept.id] = students.length
        }
        setStudentCounts(counts)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
        <p className="text-sm text-muted-foreground truncate">{today}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href="/attendance">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Mark Attendance</h3>
                <p className="text-sm text-muted-foreground">Record attendance for today</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/students">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-chart-2/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-chart-2" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">View Students</h3>
                <p className="text-sm text-muted-foreground">Browse student records</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Departments Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Departments
          </CardTitle>
          <CardDescription>
            Select a department to mark attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {departments.map((dept) => (
              <Card key={dept.id} className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline">{dept.code}</Badge>
                    <span className="text-2xl font-bold text-foreground">
                      {studentCounts[dept.id] || 0}
                    </span>
                  </div>
                  <h4 className="font-medium text-foreground mb-1">{dept.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {studentCounts[dept.id] || 0} students enrolled
                  </p>
                  <Link href={`/attendance?department=${dept.id}`}>
                    <Button variant="secondary" size="sm" className="w-full mt-3">
                      Mark Attendance
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {"Today's Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Start marking attendance to see the summary here</p>
            <Link href="/attendance">
              <Button className="mt-4">
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Mark Attendance
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

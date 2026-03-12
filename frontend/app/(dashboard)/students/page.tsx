'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Search,
  Phone,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  getDepartments, 
  getStudents,
  getStudentAttendance,
  type Department, 
  type Student 
} from '@/lib/api'
import { cn } from '@/lib/utils'

const years = ['FY', 'SY', 'TY', 'BE']

export default function StudentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentAttendance, setStudentAttendance] = useState<{
    total_days: number
    present_days: number
    absent_days: number
    percentage: number
    records: { date: string; status: string }[]
  } | null>(null)
  const [loadingAttendance, setLoadingAttendance] = useState(false)

  useEffect(() => {
    getDepartments()
      .then(setDepartments)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedDepartment) {
      loadStudents()
    }
  }, [selectedDepartment, selectedYear])

  useEffect(() => {
    // Filter students based on search query
    const filtered = students.filter((student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredStudents(filtered)
  }, [students, searchQuery])

  async function loadStudents() {
    setLoadingStudents(true)
    try {
      const data = await getStudents({
        department_id: selectedDepartment,
        year: selectedYear || undefined,
      })
      setStudents(data)
      setFilteredStudents(data)
    } catch (error) {
      console.error('Failed to load students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  async function viewStudentAttendance(student: Student) {
    setSelectedStudent(student)
    setLoadingAttendance(true)
    try {
      const data = await getStudentAttendance(student.id)
      setStudentAttendance(data)
    } catch (error) {
      console.error('Failed to load student attendance:', error)
    } finally {
      setLoadingAttendance(false)
    }
  }

  function getAttendanceIcon(percentage: number) {
    if (percentage >= 75) return <TrendingUp className="w-4 h-4 text-success" />
    if (percentage >= 50) return <Minus className="w-4 h-4 text-warning" />
    return <TrendingDown className="w-4 h-4 text-destructive" />
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-6 h-6" />
          Students
        </h1>
        <p className="text-muted-foreground">View and manage student records</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Department
              </label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Year
              </label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      {selectedDepartment ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {departments.find((d) => String(d.id) === selectedDepartment)?.name} Students
            </CardTitle>
            <CardDescription>
              {filteredStudents.length} students found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Division</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.roll_number}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.year}</Badge>
                        </TableCell>
                        <TableCell>{student.division}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {student.parent_phone}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewStudentAttendance(student)}
                          >
                            <GraduationCap className="w-4 h-4 mr-1" />
                            View Attendance
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No students found</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Select a department to view students</p>
          </CardContent>
        </Card>
      )}

      {/* Student Attendance Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              {selectedStudent?.name} - Attendance Record
            </DialogTitle>
            <DialogDescription>
              Roll No: {selectedStudent?.roll_number} | {selectedStudent?.department_name} | {selectedStudent?.year}-{selectedStudent?.division}
            </DialogDescription>
          </DialogHeader>

          {loadingAttendance ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-48" />
            </div>
          ) : studentAttendance ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{studentAttendance.total_days}</p>
                  <p className="text-sm text-muted-foreground">Total Days</p>
                </div>
                <div className="text-center p-4 bg-success/10 rounded-lg">
                  <p className="text-2xl font-bold text-success">{studentAttendance.present_days}</p>
                  <p className="text-sm text-muted-foreground">Present</p>
                </div>
                <div className="text-center p-4 bg-destructive/10 rounded-lg">
                  <p className="text-2xl font-bold text-destructive">{studentAttendance.absent_days}</p>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </div>
                <div className={cn(
                  "text-center p-4 rounded-lg",
                  studentAttendance.percentage >= 75 ? "bg-success/10" : "bg-destructive/10"
                )}>
                  <p className={cn(
                    "text-2xl font-bold flex items-center justify-center gap-1",
                    studentAttendance.percentage >= 75 ? "text-success" : "text-destructive"
                  )}>
                    {getAttendanceIcon(studentAttendance.percentage)}
                    {studentAttendance.percentage}%
                  </p>
                  <p className="text-sm text-muted-foreground">Attendance</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Attendance Percentage</span>
                  <span className={cn(
                    "font-medium",
                    studentAttendance.percentage >= 75 ? "text-success" : "text-destructive"
                  )}>
                    {studentAttendance.percentage >= 75 ? 'Good Standing' : 'Below 75% - Action Required'}
                  </span>
                </div>
                <Progress 
                  value={studentAttendance.percentage} 
                  className={cn(
                    "h-3",
                    studentAttendance.percentage < 75 && "[&>div]:bg-destructive"
                  )}
                />
              </div>

              {/* Recent Records */}
              <div>
                <h4 className="font-medium mb-3">Recent Attendance Records</h4>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {studentAttendance.records.slice(0, 20).map((record, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-2 rounded bg-muted/30"
                      >
                        <span className="text-sm text-muted-foreground">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <Badge
                          variant={record.status === 'Present' ? 'default' : 'destructive'}
                          className={cn(
                            record.status === 'Present' && 'bg-success text-success-foreground'
                          )}
                        >
                          {record.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Parent Contact */}
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Parent Contact</p>
                  <p className="font-mono">{selectedStudent?.parent_phone}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No attendance records found
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

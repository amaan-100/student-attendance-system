'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  ClipboardCheck, 
  Calendar,
  Check,
  X,
  Save,
  AlertTriangle,
  Users
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { 
  getDepartments, 
  getAttendance, 
  submitAttendance,
  type Department, 
  type AttendanceRecord 
} from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const years = ['FY', 'SY', 'TY', 'BE']
const divisions = ['A', 'B', 'C']

function AttendanceContent() {
  const searchParams = useSearchParams()
  const initialDepartment = searchParams.get('department') || ''
  
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState(initialDepartment)
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedDivision, setSelectedDivision] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<AttendanceRecord[]>([])
  const [attendanceMap, setAttendanceMap] = useState<Record<number, 'Present' | 'Absent'>>({})
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lowAttendanceAlerts, setLowAttendanceAlerts] = useState<{ name: string; percentage: number }[]>([])

  useEffect(() => {
    getDepartments()
      .then(setDepartments)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedDepartment && selectedYear && selectedDivision) {
      loadStudents()
    } else {
      setStudents([])
      setAttendanceMap({})
    }
  }, [selectedDepartment, selectedYear, selectedDivision, selectedDate])

  async function loadStudents() {
    setLoadingStudents(true)
    try {
      const data = await getAttendance({
        date: selectedDate,
        department_id: selectedDepartment,
        year: selectedYear,
        division: selectedDivision,
      })
      setStudents(data)
      
      // Initialize attendance map with existing data
      const map: Record<number, 'Present' | 'Absent'> = {}
      data.forEach((student) => {
        if (student.status) {
          map[student.id] = student.status
        }
      })
      setAttendanceMap(map)
    } catch (error) {
      console.error('Failed to load students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoadingStudents(false)
    }
  }

  function toggleAttendance(studentId: number, status: 'Present' | 'Absent') {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }))
  }

  function markAllPresent() {
    const map: Record<number, 'Present' | 'Absent'> = {}
    students.forEach((student) => {
      map[student.id] = 'Present'
    })
    setAttendanceMap(map)
  }

  function markAllAbsent() {
    const map: Record<number, 'Present' | 'Absent'> = {}
    students.forEach((student) => {
      map[student.id] = 'Absent'
    })
    setAttendanceMap(map)
  }

  async function handleSubmit() {
    const records = Object.entries(attendanceMap).map(([id, status]) => ({
      student_id: Number(id),
      status,
    }))

    if (records.length === 0) {
      toast.error('Please mark attendance for at least one student')
      return
    }

    if (records.length < students.length) {
      toast.error('Please mark attendance for all students')
      return
    }

    setSubmitting(true)
    try {
      const result = await submitAttendance(selectedDate, records)
      toast.success(`Attendance submitted for ${result.count} students`)
      
      if (result.low_attendance_alerts.length > 0) {
        setLowAttendanceAlerts(result.low_attendance_alerts)
      }
    } catch (error) {
      console.error('Failed to submit attendance:', error)
      toast.error('Failed to submit attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'Present').length
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'Absent').length
  const unmarkedCount = students.length - presentCount - absentCount

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
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
          <ClipboardCheck className="w-6 h-6" />
          Mark Attendance
        </h1>
        <p className="text-muted-foreground">Select class and mark student attendance</p>
      </div>

      {/* Low Attendance Alerts */}
      {lowAttendanceAlerts.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Low Attendance Alert</AlertTitle>
          <AlertDescription>
            The following students have attendance below 75%:
            <ul className="mt-2 list-disc list-inside">
              {lowAttendanceAlerts.map((alert, idx) => (
                <li key={idx}>
                  {alert.name} - {alert.percentage}%
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Division
              </label>
              <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((div) => (
                    <SelectItem key={div} value={div}>
                      Division {div}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={loadStudents} 
                disabled={!selectedDepartment || !selectedYear || !selectedDivision}
                className="w-full"
              >
                Load Students
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      {students.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Students ({students.length})
              </CardTitle>
              <CardDescription>
                {departments.find((d) => String(d.id) === selectedDepartment)?.name} - {selectedYear} - Division {selectedDivision}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={markAllPresent}>
                <Check className="w-4 h-4 mr-1" />
                All Present
              </Button>
              <Button variant="outline" size="sm" onClick={markAllAbsent}>
                <X className="w-4 h-4 mr-1" />
                All Absent
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="w-8 h-8" />
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Roll No</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.roll_number}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell className="text-center">
                            {attendanceMap[student.id] ? (
                              <Badge
                                variant={attendanceMap[student.id] === 'Present' ? 'default' : 'destructive'}
                                className={cn(
                                  attendanceMap[student.id] === 'Present' && 'bg-success text-success-foreground'
                                )}
                              >
                                {attendanceMap[student.id]}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not Marked</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant={attendanceMap[student.id] === 'Present' ? 'default' : 'outline'}
                                className={cn(
                                  attendanceMap[student.id] === 'Present' && 'bg-success hover:bg-success/90 text-success-foreground'
                                )}
                                onClick={() => toggleAttendance(student.id, 'Present')}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={attendanceMap[student.id] === 'Absent' ? 'destructive' : 'outline'}
                                onClick={() => toggleAttendance(student.id, 'Absent')}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary and Submit */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-success" />
                      Present: {presentCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-destructive" />
                      Absent: {absentCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-muted-foreground" />
                      Unmarked: {unmarkedCount}
                    </span>
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting || unmarkedCount > 0}>
                    {submitting ? (
                      <>
                        <Spinner className="mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Submit Attendance
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : selectedDepartment && selectedYear && selectedDivision && !loadingStudents ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No students found for the selected class</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Select department, year, and division to load students</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function AttendancePage() {
  return (
    <Suspense fallback={
      <div className="p-6 lg:p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <Skeleton className="h-96" />
      </div>
    }>
      <AttendanceContent />
    </Suspense>
  )
}

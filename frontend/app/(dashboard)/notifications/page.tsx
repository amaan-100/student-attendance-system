'use client'

import { useState, useEffect } from 'react'
import { 
  Bell, 
  Send,
  MessageSquare,
  AlertTriangle,
  Phone,
  Users,
  CheckCircle,
  Info
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  getAdminStats,
  sendWhatsAppNotification,
  sendBulkNotifications,
  type AdminStats 
} from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function NotificationsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingBulk, setSendingBulk] = useState(false)
  const [sendingIndividual, setSendingIndividual] = useState<number | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [lastNotificationResult, setLastNotificationResult] = useState<{
    phone: string
    message: string
    studentName: string
  } | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const data = await getAdminStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendIndividual(studentId: number, studentName: string) {
    setSendingIndividual(studentId)
    try {
      const result = await sendWhatsAppNotification(studentId)
      setLastNotificationResult({
        phone: result.phone,
        message: result.notification_message,
        studentName
      })
      toast.success(`Notification sent for ${studentName}`)
      loadStats() // Refresh stats
    } catch (error) {
      console.error('Failed to send notification:', error)
      toast.error('Failed to send notification')
    } finally {
      setSendingIndividual(null)
    }
  }

  async function handleSendBulk() {
    setShowConfirmDialog(false)
    setSendingBulk(true)
    try {
      const result = await sendBulkNotifications()
      toast.success(result.message)
      loadStats() // Refresh stats
    } catch (error) {
      console.error('Failed to send bulk notifications:', error)
      toast.error('Failed to send bulk notifications')
    } finally {
      setSendingBulk(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <Skeleton className="h-32 mb-6" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  const lowAttendanceStudents = stats?.low_attendance_students || []

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="w-6 h-6" />
          WhatsApp Notifications
        </h1>
        <p className="text-muted-foreground">Send attendance alerts to parents via WhatsApp</p>
      </div>

      {/* Info Alert */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>About WhatsApp Notifications</AlertTitle>
        <AlertDescription>
          This system automatically identifies students with attendance below 75% and allows you to send 
          notification alerts to their parents. In a production environment, this would integrate with 
          PyWhatKit or WhatsApp Business API to send actual messages.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold text-foreground">{stats?.total_students || 0}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Attendance</p>
                <p className="text-3xl font-bold text-destructive">{lowAttendanceStudents.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Notifications Sent</p>
                <p className="text-3xl font-bold text-success">{stats?.recent_notifications?.length || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Send Action */}
      {lowAttendanceStudents.length > 0 && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Send className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Send Bulk Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Send alerts to all {lowAttendanceStudents.length} students with low attendance
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setShowConfirmDialog(true)}
                disabled={sendingBulk}
                className="bg-warning text-warning-foreground hover:bg-warning/90"
              >
                {sendingBulk ? (
                  <>
                    <Spinner className="mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send All Notifications
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students with Low Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Students Requiring Notification
          </CardTitle>
          <CardDescription>
            Students with attendance below 75% - click to send individual notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lowAttendanceStudents.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {lowAttendanceStudents.map((student) => (
                  <div 
                    key={student.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-card hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-foreground">{student.name}</span>
                        <Badge variant="outline">{student.roll_number}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-2">
                        <span>{student.department}</span>
                        <span>|</span>
                        <span>{student.year}-{student.division}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{student.parent_phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={cn(
                          "text-2xl font-bold",
                          student.percentage < 50 ? "text-destructive" : "text-warning"
                        )}>
                          {student.percentage}%
                        </p>
                        <Progress 
                          value={student.percentage} 
                          className={cn(
                            "h-2 w-24",
                            student.percentage < 50 ? "[&>div]:bg-destructive" : "[&>div]:bg-warning"
                          )}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {student.present_days}/{student.total_days} days
                        </p>
                      </div>

                      <Button
                        onClick={() => handleSendIndividual(student.id, student.name)}
                        disabled={sendingIndividual === student.id}
                        variant="outline"
                        size="sm"
                      >
                        {sendingIndividual === student.id ? (
                          <Spinner className="w-4 h-4" />
                        ) : (
                          <>
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Send Alert
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success opacity-50" />
              <p>All students have attendance above 75%</p>
              <p className="text-sm mt-1">No notifications needed at this time</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      {stats?.recent_notifications && stats.recent_notifications.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {stats.recent_notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <CheckCircle className="w-4 h-4 mt-0.5 text-success" />
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
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Notifications</DialogTitle>
            <DialogDescription>
              You are about to send WhatsApp notifications to the parents of {lowAttendanceStudents.length} students 
              with attendance below 75%. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">Students that will be notified:</p>
            <ScrollArea className="h-[150px] border rounded-md p-3">
              {lowAttendanceStudents.map((student) => (
                <div key={student.id} className="flex justify-between py-1 text-sm">
                  <span>{student.name}</span>
                  <span className="text-destructive">{student.percentage}%</span>
                </div>
              ))}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendBulk} className="bg-warning text-warning-foreground hover:bg-warning/90">
              <Send className="w-4 h-4 mr-2" />
              Send Notifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Result Dialog */}
      <Dialog open={!!lastNotificationResult} onOpenChange={() => setLastNotificationResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle className="w-5 h-5" />
              Notification Sent
            </DialogTitle>
            <DialogDescription>
              Alert sent for {lastNotificationResult?.studentName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Recipient Phone:</p>
              <p className="font-mono">{lastNotificationResult?.phone}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Message Content:</p>
              <div className="bg-muted/50 p-3 rounded-lg text-sm whitespace-pre-line">
                {lastNotificationResult?.message}
              </div>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                In production, this message would be sent via WhatsApp using PyWhatKit or WhatsApp Business API.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button onClick={() => setLastNotificationResult(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { 
  useListNotifications, 
  useRetryNotification,
  getListNotificationsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatRelative } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Inbox, CheckCircle2, AlertCircle, Clock, XCircle, RefreshCw, Mail } from "lucide-react";

export function Notifications() {
  const queryClient = useQueryClient();

  // Polling every 5 seconds
  const { data: notifications, isLoading } = useListNotifications({
    query: { refetchInterval: 5000, queryKey: getListNotificationsQueryKey() }
  });

  const retryNotification = useRetryNotification();

  function handleRetry(id: number) {
    retryNotification.mutate({ notificationId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        toast.success("Re-queued for delivery");
      },
      onError: (error) => toast.error(error.error || "Failed to retry")
    });
  }

  if (isLoading && !notifications) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading notifications...</div>;
  }

  const stats = notifications?.reduce((acc, n) => {
    acc.total++;
    if (n.status === 'sent') acc.sent++;
    if (n.status === 'pending' || n.status === 'sending') acc.pending++;
    if (n.status === 'failed') acc.failed++;
    if (n.status === 'dead_letter') acc.deadLetter++;
    return acc;
  }, { total: 0, sent: 0, pending: 0, failed: 0, deadLetter: 0 }) || { total: 0, sent: 0, pending: 0, failed: 0, deadLetter: 0 };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-transparent dark:bg-blue-900/50 dark:text-blue-300">Pending</Badge>;
      case 'sending': return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-transparent dark:bg-indigo-900/50 dark:text-indigo-300">Sending</Badge>;
      case 'sent': return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 border-transparent dark:bg-green-900/50 dark:text-green-300">Sent</Badge>;
      case 'failed': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-transparent dark:bg-amber-900/50 dark:text-amber-300">Failed</Badge>;
      case 'dead_letter': return <Badge variant="destructive">Dead Letter</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications Queue</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          Email outbox — every assignment and status change enqueues an email here. 
          The background worker delivers them with exponential-backoff retries.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.sent}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.pending}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.failed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Dead Letter</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{stats.deadLetter}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Log</CardTitle>
          <CardDescription>Real-time view of notification delivery attempts.</CardDescription>
        </CardHeader>
        <CardContent>
          {(!notifications || notifications.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <Mail className="w-12 h-12 mb-4 text-muted" />
              <h3 className="text-lg font-medium text-foreground">No notifications yet</h3>
              <p>Activity in projects will trigger email notifications.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Last Attempt</TableHead>
                    <TableHead>Error Log</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>{getStatusBadge(notification.status)}</TableCell>
                      <TableCell className="font-mono text-xs">{notification.kind}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{notification.recipientName || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{notification.recipientEmail}</div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={notification.subject}>
                        {notification.subject}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {notification.attempts} / {notification.maxAttempts}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {notification.status === 'sent' && notification.sentAt 
                          ? formatRelative(new Date(notification.sentAt), new Date())
                          : notification.updatedAt !== notification.createdAt 
                            ? formatRelative(new Date(notification.updatedAt), new Date())
                            : '-'}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {notification.lastError ? (
                          <div className="text-xs text-destructive truncate bg-destructive/10 px-2 py-1 rounded" title={notification.lastError}>
                            {notification.lastError}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {(notification.status === 'failed' || notification.status === 'dead_letter') && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleRetry(notification.id)}
                            disabled={retryNotification.isPending}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" /> Retry
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

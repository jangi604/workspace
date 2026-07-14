import { useState } from "react";
import { useNotifications, useSendNotification, useCustomers } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/utils";
import { Send, Bell, Users } from "lucide-react";

export default function Notifications() {
  const { data: notifications = [], isLoading: isLoadingNotes } = useNotifications();
  const { data: customers = [] } = useCustomers();
  const sendMutation = useSendNotification();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    
    sendMutation.mutate(
      { title, body, targetUserId },
      { 
        onSuccess: () => {
          setTitle("");
          setBody("");
          setTargetUserId(null);
        }
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Push Notifications</h2>
        <p className="text-muted-foreground mt-1 text-sm">Send alerts to customers' mobile apps.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Compose Message
            </CardTitle>
            <CardDescription>Send a notification to a specific user or broadcast to all.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label>Recipient</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={targetUserId || ""}
                  onChange={(e) => setTargetUserId(e.target.value || null)}
                >
                  <option value="">All Customers (Broadcast)</option>
                  {customers.map(c => (
                    <option key={c.uid} value={c.uid}>{c.fullName} ({c.phone})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                  required 
                  placeholder="e.g. Scheduled Maintenance" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Message Body</Label>
                <Textarea 
                  required 
                  placeholder="We will be performing maintenance on..."
                  className="min-h-[120px]"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={sendMutation.isPending}>
                <Bell className="h-4 w-4" />
                {sendMutation.isPending ? "Sending..." : "Send Notification"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              Recent History
            </CardTitle>
            <CardDescription>Previously sent notifications.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingNotes ? (
              <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">Loading history...</div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground border-t border-border">
                No notifications sent yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.slice(0, 10).map((note) => (
                  <div key={note.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-sm">{note.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.body}</p>
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground text-right">
                        {formatDateTime(note.createdAt)}
                        <div className="mt-1 flex items-center justify-end gap-1 font-medium text-foreground">
                          {note.targetUserId ? (
                            <span className="text-primary text-[10px] bg-primary/10 px-1.5 py-0.5 rounded">Direct Message</span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] bg-secondary px-1.5 py-0.5 rounded"><Users className="h-3 w-3" /> Broadcast</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

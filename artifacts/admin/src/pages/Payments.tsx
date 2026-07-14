import { useState } from "react";
import { usePaymentRequests, useDecidePaymentRequest } from "@/lib/api";
import { type PaymentRequest } from "@workspace/firebase-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Eye, Check, X, Clock, Download } from "lucide-react";

export default function Payments() {
  const { data: requests = [], isLoading } = usePaymentRequests();
  const decideMutation = useDecidePaymentRequest();
  
  const [selectedReq, setSelectedReq] = useState<PaymentRequest | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');
  const [previewReq, setPreviewReq] = useState<PaymentRequest | null>(null);

  const handleOpenDialog = (req: PaymentRequest, action: 'approved' | 'rejected') => {
    setSelectedReq(req);
    setDecision(action);
    setAdminNote("");
  };

  const handleDecide = () => {
    if (!selectedReq || !decision) return;
    decideMutation.mutate(
      { request: selectedReq, decision, adminNote },
      { onSuccess: () => {
        setSelectedReq(null);
        setDecision(null);
      }}
    );
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'pending') return req.status === 'pending';
    if (filter === 'resolved') return req.status !== 'pending';
    return true;
  });

  if (isLoading) return <div className="animate-pulse flex gap-4 flex-col"><div className="h-10 w-32 bg-muted rounded" /><div className="h-[400px] w-full bg-muted rounded" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Requests</h2>
          <p className="text-muted-foreground mt-1 text-sm">Review and approve customer transactions.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-md">
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-colors ${filter === 'pending' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-colors ${filter === 'resolved' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setFilter('resolved')}
          >
            Resolved
          </button>
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-colors ${filter === 'all' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Check className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p>No {filter === 'pending' ? 'pending' : ''} payment requests found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div className="font-medium">{req.customerName}</div>
                    <div className="text-xs text-muted-foreground">{req.customerEmail}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-foreground">{req.packageName}</div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-sm px-2 py-1 bg-secondary rounded-md text-secondary-foreground font-medium">
                      {req.method}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-primary">{formatCurrency(req.amount)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(req.createdAt)}
                  </TableCell>
                  <TableCell>
                    {req.status === 'pending' && <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>}
                    {req.status === 'approved' && <Badge variant="success" className="gap-1"><Check className="h-3 w-3" /> Approved</Badge>}
                    {req.status === 'rejected' && <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" /> Rejected</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => setPreviewReq(req)}>
                        <Eye className="h-4 w-4" /> Receipt
                      </Button>
                      {req.status === 'pending' && (
                        <>
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white border-transparent"
                            onClick={() => handleOpenDialog(req, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleOpenDialog(req, 'rejected')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decision === 'approved' ? 'Approve Payment' : 'Reject Payment'}</DialogTitle>
            <DialogDescription>
              {decision === 'approved' 
                ? "This will activate the package for the user immediately." 
                : "This will notify the user that their payment was invalid."}
            </DialogDescription>
          </DialogHeader>
          {selectedReq && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">{selectedReq.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">{formatCurrency(selectedReq.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Package:</span>
                  <span className="font-medium">{selectedReq.packageName}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Add a note (optional)</label>
                <Textarea 
                  placeholder={decision === 'rejected' ? "Reason for rejection..." : "Welcome note..."}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReq(null)}>Cancel</Button>
            <Button 
              variant={decision === 'approved' ? 'default' : 'destructive'} 
              onClick={handleDecide}
              disabled={decideMutation.isPending}
            >
              {decideMutation.isPending ? "Processing..." : `Confirm ${decision === 'approved' ? 'Approval' : 'Rejection'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewReq} onOpenChange={(open) => !open && setPreviewReq(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
            <DialogDescription>
              {previewReq && `${previewReq.customerName} · ${previewReq.packageName} · ${formatCurrency(previewReq.amount)}`}
            </DialogDescription>
          </DialogHeader>
          {previewReq && (
            <div className="space-y-3">
              <img
                src={previewReq.screenshotBase64}
                alt="Payment screenshot"
                className="w-full rounded-md border max-h-[70vh] object-contain bg-muted"
              />
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a href={previewReq.screenshotBase64} download={`payment-${previewReq.id}.jpg`}>
                  <Download className="h-4 w-4" /> Download
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

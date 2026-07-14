import { useState } from "react";
import { useCustomers, useUpdateCustomer, useDeleteCustomer } from "@/lib/api";
import { type UserProfile } from "@workspace/firebase-shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Search, MoreVertical, Trash2, UserX, UserCheck } from "lucide-react";

export default function Customers() {
  const { data: customers = [], isLoading } = useCustomers();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();
  
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const toggleStatus = (uid: string, currentStatus: string) => {
    updateMutation.mutate({ 
      uid, 
      data: { status: currentStatus === 'active' ? 'inactive' : 'active' } 
    });
  };

  const handleDelete = (uid: string) => {
    if (confirm("Are you sure you want to completely delete this customer account? This cannot be undone.")) {
      deleteMutation.mutate(uid);
    }
  };

  if (isLoading) return <div className="animate-pulse flex gap-4 flex-col"><div className="h-10 w-32 bg-muted rounded" /><div className="h-[400px] w-full bg-muted rounded" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground mt-1 text-sm">Manage registered users and their subscriptions.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, phone..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Active Package</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No customers match your search." : "No customers registered yet."}
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => {
                const isExpired = customer.packageExpiresAt && new Date(customer.packageExpiresAt) < new Date();
                
                return (
                  <TableRow key={customer.uid}>
                    <TableCell>
                      <div className="font-medium text-foreground">{customer.fullName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Joined {formatDate(customer.createdAt)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{customer.phone}</div>
                      <div className="text-xs text-muted-foreground">{customer.email}</div>
                    </TableCell>
                    <TableCell>
                      {customer.activePackageId ? (
                        <div>
                          <div className="text-sm font-medium">{customer.activePackageName}</div>
                          <div className={`text-xs mt-0.5 ${isExpired ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                            {isExpired ? 'Expired: ' : 'Expires: '}{formatDate(customer.packageExpiresAt!)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.status === 'active' ? 'success' : 'secondary'}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title={customer.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                          onClick={() => toggleStatus(customer.uid, customer.status)}
                        >
                          {customer.status === 'active' ? (
                            <UserX className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-primary" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Delete Account"
                          onClick={() => handleDelete(customer.uid)} 
                          className="hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

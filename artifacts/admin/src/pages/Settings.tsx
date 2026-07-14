import { useEffect, useState } from "react";
import { useAppSettings, useUpdateAppSettings } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Phone, Mail, CreditCard } from "lucide-react";
import { type AppSettings } from "@workspace/firebase-shared";

export default function Settings() {
  const { data: settings, isLoading } = useAppSettings();
  const updateMutation = useUpdateAppSettings();

  const [formData, setFormData] = useState<AppSettings | null>(null);

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      updateMutation.mutate(formData);
    }
  };

  const handleNestedChange = (provider: 'jazzcash' | 'easypaisa', field: 'accountTitle' | 'number', value: string) => {
    if (!formData) return;
    setFormData({
      ...formData,
      [provider]: {
        ...formData[provider],
        [field]: value
      }
    });
  };

  if (isLoading || !formData) return <div className="animate-pulse flex gap-4 flex-col"><div className="h-10 w-32 bg-muted rounded" /><div className="h-[400px] w-full bg-muted rounded" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">App Settings</h2>
        <p className="text-muted-foreground mt-1 text-sm">Configure payment details and contact info shown to customers.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* JazzCash Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-600 text-white flex items-center justify-center font-bold text-[10px]">JC</div>
                JazzCash Account
              </CardTitle>
              <CardDescription>Displayed when customers select JazzCash.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Account Title</Label>
                <Input 
                  required 
                  value={formData.jazzcash.accountTitle}
                  onChange={(e) => handleNestedChange('jazzcash', 'accountTitle', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input 
                  required 
                  value={formData.jazzcash.number}
                  onChange={(e) => handleNestedChange('jazzcash', 'number', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* EasyPaisa Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-green-500 text-white flex items-center justify-center font-bold text-[10px]">EP</div>
                EasyPaisa Account
              </CardTitle>
              <CardDescription>Displayed when customers select EasyPaisa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Account Title</Label>
                <Input 
                  required 
                  value={formData.easypaisa.accountTitle}
                  onChange={(e) => handleNestedChange('easypaisa', 'accountTitle', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input 
                  required 
                  value={formData.easypaisa.number}
                  onChange={(e) => handleNestedChange('easypaisa', 'number', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Support Info */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Support Contact Information
              </CardTitle>
              <CardDescription>How customers can reach out for help in the mobile app.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone Number</Label>
                <Input 
                  required 
                  value={formData.supportPhone}
                  onChange={(e) => setFormData({...formData, supportPhone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email Address</Label>
                <Input 
                  type="email"
                  required 
                  value={formData.supportEmail}
                  onChange={(e) => setFormData({...formData, supportEmail: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}

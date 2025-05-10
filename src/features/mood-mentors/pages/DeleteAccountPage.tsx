import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { DashboardLayout } from "../components/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Shield, Trash } from "lucide-react";
import { toast } from "sonner";

export default function DeleteAccountPage() {
  const navigate = useNavigate();
  const { user, signout } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (email !== user.email) {
      toast.error("Email address doesn't match your account");
      return;
    }
    
    if (!confirmationChecked) {
      toast.error("Please confirm that you understand this action is irreversible");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Delete the user account and all associated data
      const response = await api.delete("/api/account");
      
      if (!response.ok) {
        throw new Error("Failed to delete account");
      }
      
      // Log out the user
      await signout();
      
      // Redirect to home page
      window.location.href = "/";
      
      toast.success("Your account has been deleted successfully");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(error.message || "Failed to delete account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container max-w-3xl py-8">
        <h1 className="text-3xl font-bold text-red-600 mb-8">Delete Account</h1>
        
        <Card className="border-red-200 shadow-md">
          <CardHeader className="bg-red-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-red-700">Delete Your Ambassador Account</CardTitle>
                <CardDescription className="text-red-600/80">
                  This action is permanent and cannot be undone
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Shield className="h-6 w-6 text-amber-600 flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-medium text-amber-800">Important Information</h3>
                  <ul className="text-sm text-amber-700 space-y-2 list-disc pl-4">
                    <li>All of your personal information will be permanently deleted</li>
                    <li>All ambassador relationships with clients will be severed</li>
                    <li>Your appointment history will be removed from our system</li>
                    <li>You will immediately lose access to the Ambassador Dashboard</li>
                    <li>This action <strong>cannot</strong> be reversed</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-confirmation" className="text-red-700">
                  Enter your email address to confirm
                </Label>
                <Input
                  id="email-confirmation"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={user?.email || "your-email@example.com"}
                  required
                  className="border-red-200 focus-visible:ring-red-500"
                />
                <p className="text-xs text-slate-500">
                  Please enter your email address ({user?.email}) to confirm account deletion
                </p>
              </div>
              
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="confirmation-check"
                  checked={confirmationChecked}
                  onChange={(e) => setConfirmationChecked(e.target.checked)}
                  className="rounded border-red-300 text-red-600 mt-1"
                />
                <Label 
                  htmlFor="confirmation-check" 
                  className="font-medium text-red-700 cursor-pointer text-sm"
                >
                  I understand that this action is irreversible and all my data will be permanently deleted
                </Label>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between bg-slate-50 border-t">
            <Button 
              variant="outline" 
              onClick={() => navigate("/ambassador-dashboard/settings")}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isLoading || !email || !confirmationChecked || email !== user?.email}
              className="gap-2"
            >
              {isLoading ? 
                "Deleting Account..." : 
                <>
                  <Trash className="h-4 w-4" />
                  Delete My Account
                </>
              }
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
} 
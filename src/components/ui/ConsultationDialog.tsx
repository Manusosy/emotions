import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { UserCircle } from "lucide-react";
import { api } from "@/lib/api";

interface Ambassador {
  id: string;
  name: string;
  specialties: string[];
  profileImage?: string;
}

// Mock data to use as fallback when API calls fail
const mockAmbassadors: Ambassador[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    specialties: ["Depression", "Anxiety"],
    profileImage: "/default-avatar.png",
  },
  {
    id: "2",
    name: "Dr. Michael Chen",
    specialties: ["Trauma", "PTSD"],
    profileImage: "/default-avatar.png",
  },
  {
    id: "3",
    name: "Dr. Lisa Rodriguez",
    specialties: ["Family Therapy", "Relationships"],
    profileImage: "/default-avatar.png",
  }
];

interface ConsultationDialogProps {
  trigger: React.ReactNode;
}

const ConsultationDialog = ({ trigger }: ConsultationDialogProps) => {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAmbassadors = async () => {
      try {
        const response = await api.get("/api/ambassadors");
        if (!response.ok) {
          throw new Error("Failed to fetch ambassadors");
        }
        
        const data = await response.json();
        const mappedData = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          specialties: item.specialties || [],
          profileImage: item.profileImage,
        }));

        setAmbassadors(mappedData);
      } catch (error) {
        console.error("Error:", error);
        // Use mock data as fallback
        setAmbassadors(mockAmbassadors);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAmbassadors();
  }, []);

  const handleAmbassadorSelect = (ambassadorId: string) => {
    navigate(`/booking?ambassadorId=${ambassadorId}`);
  };

  const handleViewAll = () => {
    navigate("/ambassadors");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#001A41]">Start Your Consultation</DialogTitle>
          <DialogDescription>
            Choose a mental health ambassador to begin your journey to better emotional well-being
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007BFF]"></div>
            </div>
          ) : ambassadors.length > 0 ? (
            <div className="grid gap-4">
              {ambassadors.map((ambassador) => (
                <div
                  key={ambassador.id}
                  className="flex items-center p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => handleAmbassadorSelect(ambassador.id)}
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                    {ambassador.profileImage ? (
                      <img
                        src={ambassador.profileImage}
                        alt={ambassador.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserCircle className="h-6 w-6 text-[#007BFF]" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{ambassador.name}</p>
                    <p className="text-xs text-gray-500">
                      {ambassador.specialties.slice(0, 2).join(", ")}
                      {ambassador.specialties.length > 2 ? " & more" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No ambassadors found</p>
          )}
        </div>

        <div className="flex justify-between mt-2">
          <Button variant="outline" onClick={handleViewAll}>
            View All Ambassadors
          </Button>
          <Button 
            className="bg-[#007BFF] hover:bg-blue-600"
            onClick={() => navigate("/booking")}
          >
            Book Without Selection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConsultationDialog; 
import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Search,
  UserPlus,
  Users,
  Eye,
  MoreVertical,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format, differenceInHours } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";

interface PatientProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  country: string;
  city: string;
  state: string;
  avatar_url?: string;
  created_at: string;
}

interface SupportGroup {
  id: string;
  name: string;
  ambassador_id: string;
  description: string;
  created_at: string;
}

const PatientsPage = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [supportGroups, setSupportGroups] = useState<SupportGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  useEffect(() => {
    // Fetch patients first
    fetchPatients();
    
    // Then fetch support groups if user is authenticated
    if (user?.id) {
      fetchSupportGroups();
    }

    // Set up WebSocket connection for real-time updates
    const ws = new WebSocket(import.meta.env.VITE_WS_URL || "ws://localhost:3001");
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "PATIENT_UPDATE") {
        fetchPatients(); // Refresh the patients list
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [user?.id]);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      console.log('Starting patient fetch...');

      // Check network connectivity
      const isNetworkOnline = navigator.onLine;
      if (!isNetworkOnline) {
        console.error('Device is offline');
        toast.error("Network connection unavailable. Please check your internet connection.");
        setIsLoading(false);
        setPatients([]);
        return;
      }

      const response = await api.get("/api/patients");
      if (!response.ok) {
        throw new Error("Failed to fetch patients");
      }

      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error("Failed to fetch patients. Please try again later.");
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSupportGroups = async () => {
    try {
      const response = await api.get("/api/support-groups");
      if (!response.ok) {
        throw new Error("Failed to fetch support groups");
      }

      const data = await response.json();
      setSupportGroups(data);
    } catch (error) {
      console.error('Error fetching support groups:', error);
      toast.error("Failed to fetch support groups");
      setSupportGroups([]);
    }
  };

  const addToGroup = async (patientId: string, groupId: string) => {
    try {
      const response = await api.post(`/api/support-groups/${groupId}/members`, {
        patient_id: patientId
      });

      if (!response.ok) {
        throw new Error("Failed to add patient to group");
      }

      toast.success("Patient added to support group successfully");
      fetchSupportGroups(); // Refresh groups to show updated members
    } catch (error) {
      console.error('Error adding patient to group:', error);
      toast.error("Failed to add patient to group");
    }
  };

  const viewProfile = (patient: PatientProfile) => {
    setSelectedPatient(patient);
    setIsProfileOpen(true);
  };

  const getFullName = (patient: PatientProfile) => {
    return `${patient.first_name} ${patient.last_name}`;
  };

  const getInitials = (patient: PatientProfile) => {
    return `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase();
  };

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const isNewPatient = (createdAt: string) => {
    const hours = differenceInHours(new Date(), new Date(createdAt));
    return hours <= 24;
  };

  const filteredPatients = patients.filter(patient => {
    if (searchQuery === "") return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      getFullName(patient).toLowerCase().includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower) ||
      patient.country.toLowerCase().includes(searchLower) ||
      (patient.city && patient.city.toLowerCase().includes(searchLower))
    );
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
            <p className="text-gray-500">View and manage all patients in the platform</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1">
              <Users className="w-4 h-4 mr-2" />
              {patients.length} Patients
            </Badge>
          </div>
        </div>

        <Card>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading patients...
                      </TableCell>
                    </TableRow>
                  ) : filteredPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No patients found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={patient.avatar_url} alt={getFullName(patient)} />
                              <AvatarFallback>{getInitials(patient)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{getFullName(patient)}</span>
                                {isNewPatient(patient.created_at) && (
                                  <Badge className="bg-yellow-500 text-white">NEW</Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{patient.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                            <span>{patient.city ? `${patient.city}, ${patient.country}` : patient.country}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getAge(patient.date_of_birth)}</TableCell>
                        <TableCell>{format(new Date(patient.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewProfile(patient)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Profile
                            </Button>
                            {supportGroups.length > 0 && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {supportGroups.map((group) => (
                                    <DropdownMenuItem
                                      key={group.id}
                                      onClick={() => addToGroup(patient.id, group.id)}
                                    >
                                      <UserPlus className="w-4 h-4 mr-2" />
                                      Add to {group.name}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>

        {/* Patient Profile Dialog */}
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Patient Profile</DialogTitle>
              <DialogDescription>
                Detailed information about the patient
              </DialogDescription>
            </DialogHeader>
            {selectedPatient && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedPatient.avatar_url} alt={getFullName(selectedPatient)} />
                    <AvatarFallback>{getInitials(selectedPatient)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{getFullName(selectedPatient)}</h3>
                      {isNewPatient(selectedPatient.created_at) && (
                        <Badge className="bg-yellow-500 text-white">NEW</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{selectedPatient.email}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-sm">{selectedPatient.phone_number || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Age</label>
                  <p className="text-sm">{getAge(selectedPatient.date_of_birth)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-sm">
                    {selectedPatient.city && `${selectedPatient.city}, `}
                    {selectedPatient.state && `${selectedPatient.state}, `}
                    {selectedPatient.country}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Joined</label>
                  <p className="text-sm">{format(new Date(selectedPatient.created_at), 'MMMM d, yyyy')}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Add to Support Group</h4>
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {supportGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button
                    className="w-full mt-2"
                    disabled={!selectedGroup}
                    onClick={() => {
                      addToGroup(selectedPatient.id, selectedGroup);
                      setSelectedGroup("");
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add to Group
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PatientsPage; 
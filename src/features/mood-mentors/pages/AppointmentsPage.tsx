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
  Calendar,
  Clock,
  Video,
  MessageSquare,
  Check,
  X,
  Filter,
  Search,
  MoreVertical,
} from "lucide-react";
import { api } from "@/lib/api";
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
import { format } from "date-fns";

interface AppointmentDisplay {
  id: string;
  patient_id: string;
  date: string;
  time: string;
  type: string;
  status: string;
  patient: {
    name: string;
    avatar: string;
    email?: string;
    phone?: string;
  };
  notes?: string;
}

const AppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, [user, statusFilter, dateFilter]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append('status', statusFilter);
      }
      
      // Apply date filter
      const today = new Date();
      switch (dateFilter) {
        case "today":
          params.append('date', format(today, 'yyyy-MM-dd'));
          break;
        case "week":
          params.append('dateStart', format(today, 'yyyy-MM-dd'));
          params.append('dateEnd', format(new Date(today.setDate(today.getDate() + 7)), 'yyyy-MM-dd'));
          break;
        case "month":
          params.append('dateStart', format(today, 'yyyy-MM-01'));
          params.append('dateEnd', format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd'));
          break;
      }

      const response = await api.get(`/api/appointments?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error('Failed to fetch appointments');
      
      setAppointments(data || []);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      toast.error("Failed to fetch appointments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await api.patch(`/api/appointments/${appointmentId}`, {
        status: newStatus
      });

      if (!response.ok) throw new Error('Failed to update appointment status');

      toast.success(`Appointment ${newStatus} successfully`);
      fetchAppointments();
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      toast.error(error.message || "Failed to update appointment status");
    }
  };

  const handleJoinSession = (appointmentId: string) => {
    window.location.href = `/ambassador-dashboard/session/${appointmentId}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      upcoming: { color: "bg-blue-100 text-blue-800", label: "Upcoming" },
      completed: { color: "bg-green-100 text-green-800", label: "Completed" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
      "in-progress": { color: "bg-yellow-100 text-yellow-800", label: "In Progress" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.upcoming;
    return <Badge className={`${config.color}`}>{config.label}</Badge>;
  };

  const getAppointmentTypeBadge = (type: string) => {
    const typeConfig = {
      video: { icon: <Video className="w-3 h-3 mr-1" />, label: "Video" },
      "in-person": { icon: null, label: "In-Person" },
      chat: { icon: <MessageSquare className="w-3 h-3 mr-1" />, label: "Chat" },
    };

    const config = typeConfig[type as keyof typeof typeConfig];
    return (
      <Badge variant="outline" className="flex items-center">
        {config?.icon}
        {config?.label || type}
      </Badge>
    );
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (searchQuery === "") return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      appointment.patient.name.toLowerCase().includes(searchLower) ||
      appointment.patient.email?.toLowerCase().includes(searchLower) ||
      appointment.patient.phone?.toLowerCase().includes(searchLower) ||
      appointment.id.toLowerCase().includes(searchLower)
    );
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-500">Manage your appointments and sessions</p>
          </div>
        </div>

        <Card>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by patient name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  icon={<Search className="w-4 h-4 text-gray-500" />}
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading appointments...
                      </TableCell>
                    </TableRow>
                  ) : filteredAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No appointments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                              {appointment.patient.avatar ? (
                                <img
                                  src={appointment.patient.avatar}
                                  alt={appointment.patient.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-500 text-sm">
                                  {appointment.patient.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{appointment.patient.name}</div>
                              {appointment.patient.email && (
                                <div className="text-sm text-gray-500">{appointment.patient.email}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>{appointment.date}</span>
                            <Clock className="w-4 h-4 text-gray-500 ml-2" />
                            <span>{appointment.time}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getAppointmentTypeBadge(appointment.type)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(appointment.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {appointment.type === "video" && appointment.status === "upcoming" && (
                                <DropdownMenuItem onClick={() => handleJoinSession(appointment.id)}>
                                  <Video className="mr-2 h-4 w-4" />
                                  Join Session
                                </DropdownMenuItem>
                              )}
                              {appointment.status === "upcoming" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, "completed")}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Mark as Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, "cancelled")}>
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel Appointment
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AppointmentsPage;

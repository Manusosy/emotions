export interface Booking {
  id: string;
  userId: string;
  moodMentorId: string;
  sessionDate: string;
  sessionTime: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingData {
  userId: string;
  moodMentorId: string;
  date: string;
  time: string;
  notes?: string;
}

export interface UpdateBookingData {
  date?: string;
  time?: string;
  notes?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
}

export const bookingService = {
  async getBookings(userId: string): Promise<Booking[]> {
    const response = await fetch(`/api/bookings?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }
    return response.json();
  },

  async createBooking(data: CreateBookingData): Promise<Booking> {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create booking');
    }
    return response.json();
  },

  async updateBooking(id: string, data: UpdateBookingData): Promise<Booking> {
    const response = await fetch(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update booking');
    }
    return response.json();
  },

  async cancelBooking(id: string): Promise<void> {
    const response = await fetch(`/api/bookings/${id}/cancel`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to cancel booking');
    }
  },

  async getAvailableSlots(moodMentorId: string, date: string): Promise<string[]> {
    const response = await fetch(`/api/bookings/available-slots?moodMentorId=${moodMentorId}&date=${date}`);
    if (!response.ok) {
      throw new Error('Failed to fetch available slots');
    }
    return response.json();
  },
}; 
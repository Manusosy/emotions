# Mood Mentor Profile System Implementation

This document outlines the implementation plan for a seamless Mentor Profile system that allows mentors to create/edit their profiles and have them immediately appear on the public mentor listing page, enabling patients to view details and book appointments.

## System Overview

The Mentor Profile system consists of three main components:
1. **Profile Creation/Editing Interface** (for mentors)
2. **Public Listing Page** (for patients to browse mentors)
3. **Individual Mentor Profile View** (for patients to learn about a specific mentor)
4. **Booking System** (for patients to schedule appointments)

## Implementation Phases

### Phase 1: Profile Creation & Editing System

#### 1.1 Create Profile Page Component
- Create new route `/mood-mentor-dashboard/profile`
- Design a multi-section form with all required mentor fields
- Implement form validation for required fields
- Add progress tracking for profile completion

```jsx
// Example route definition in src/App.tsx
<Route path="/mood-mentor-dashboard/profile" element={<MentorProfilePage />} />
```

#### 1.2 Profile Form Functionality
- Implement save/edit toggle functionality
- Enable/disable save button based on required field completion
- Include form sections:
  - Personal Information
  - Professional Background
  - Specialties & Expertise
  - Education & Training
  - Experience
  - Availability & Fees
  - Profile Image & Gallery

#### 1.3 State Management
- Track form edit state (editing vs. read-only)
- Maintain original data separate from changes
- Implement auto-save for drafts

#### 1.4 API Integration
- Create endpoints for saving/retrieving profile data
- Implement proper validation on backend
- Ensure efficient updates that only change modified fields

```jsx
// Example profile service functions
const profileService = {
  getMentorProfile: async (userId) => {
    // API call to get profile data
  },
  
  updateMentorProfile: async (userId, profileData) => {
    // API call to update profile
    // On success, invalidate queries to refresh listings
    queryClient.invalidateQueries('mentorsList');
  }
};
```

### Phase 2: Public Mentor Listing Integration

#### 2.1 Mentor Card Component
- Design mentor card showing key information:
  - Profile photo
  - Name and specialties
  - Brief bio excerpt
  - Rating/reviews
  - Availability indicator
  - "View Profile" & "Book Now" buttons

#### 2.2 Listing Page
- Implement grid layout for mentor cards
- Add filtering and sorting options
- Include search functionality

#### 2.3 Real-time Updates Integration
- Use React Query for automatic data revalidation
- Configure stale times and refresh behavior
- Implement optimistic UI updates

```jsx
// Example for Mentors Listing Page
const MentorsListingPage = () => {
  const { data: mentors, isLoading } = useQuery(
    'mentorsList', 
    () => mentorService.getAllMentors(),
    {
      refetchOnWindowFocus: true,
      staleTime: 60000,
    }
  );
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mentors?.map(mentor => (
        <MentorCard 
          key={mentor.id}
          mentor={mentor}
          onViewProfile={() => navigate(`/mentors/${mentor.id}`)}
          onBookNow={() => navigate(`/book-appointment/${mentor.id}`)}
        />
      ))}
    </div>
  );
};
```

### Phase 3: Individual Mentor Profile View

#### 3.1 Profile Detail Page
- Create public-facing mentor profile page
- Design comprehensive layout showing all mentor information
- Add reviews/ratings section
- Include availability calendar

#### 3.2 Profile Data Loading
- Implement efficient data loading with skeleton screens
- Use React Query for data fetching with prefetching for better UX

```jsx
// Example Individual Mentor Profile Page
const MentorProfileDetailPage = () => {
  const { mentorId } = useParams();
  const { data: mentor, isLoading } = useQuery(
    ['mentor', mentorId],
    () => mentorService.getMentorById(mentorId)
  );
  
  if (isLoading) return <ProfileSkeleton />;
  
  return (
    <div>
      <ProfileHeader mentor={mentor} />
      <AboutSection bio={mentor.bio} />
      <SpecialtiesSection specialties={mentor.specialties} />
      <EducationSection education={mentor.education} />
      <ExperienceSection experience={mentor.experience} />
      <ReviewsSection reviews={mentor.reviews} />
      <BookingSection mentorId={mentor.id} />
    </div>
  );
};
```

### Phase 4: Booking System Integration

#### 4.1 Booking Form Component
- Create appointment booking form
- Implement date/time picker based on mentor availability
- Add session type selection
- Include notes/reason field

#### 4.2 Availability Management
- Fetch mentor's available time slots
- Prevent double-bookings
- Handle time zone differences

#### 4.3 Appointment Creation
- Save booking to database
- Send confirmations to both patient and mentor
- Update dashboards for both users

```jsx
// Example Booking Component
const BookingForm = ({ mentorId }) => {
  const { data: availableSlots } = useQuery(
    ['availableSlots', mentorId],
    () => bookingService.getAvailableSlots(mentorId)
  );
  
  const bookMutation = useMutation(
    (bookingData) => bookingService.createBooking(bookingData),
    {
      onSuccess: () => {
        // Show success message
        toast.success("Appointment booked successfully!");
        // Refresh relevant queries
        queryClient.invalidateQueries('upcomingAppointments');
        queryClient.invalidateQueries(['mentorAppointments', mentorId]);
      }
    }
  );
  
  const handleSubmit = (data) => {
    bookMutation.mutate({
      mentorId,
      patientId: currentUser.id,
      ...data
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Date picker, time slots, session type, etc. */}
    </form>
  );
};
```

### Phase 5: Dashboard Updates

#### 5.1 Mentor Dashboard
- Add new appointments to mentor's dashboard
- Display patient information
- Provide session management tools

#### 5.2 Patient Dashboard
- Show booked appointments in patient dashboard
- Include mentor information
- Add appointment management options

## Technical Requirements

### State Management
- Use React Query for server state
- Implement React Context or Redux for complex client state
- Set up optimistic updates for immediate feedback

### API Structure
- Create RESTful endpoints for all operations
- Implement proper validation and error handling
- Use efficient query patterns to minimize data transfer

### Database Schema

```
mood_mentor_profiles
├── id (PK)
├── user_id (FK)
├── full_name
├── email
├── phone_number
├── bio
├── specialty
├── specialties (array)
├── location
├── languages (array)
├── availability_status
├── avatar_url
├── education (JSON array)
├── experience (JSON array)
├── credentials
├── therapy_types (JSON array)
├── services (array)
├── consultation_fee
├── is_free (boolean)
├── gallery_images (array)
├── status (draft/published/hidden)
├── created_at
└── updated_at

appointments
├── id (PK)
├── mentor_id (FK)
├── patient_id (FK)
├── start_time
├── end_time
├── session_type
├── status (upcoming/completed/cancelled)
├── notes
├── created_at
└── updated_at
```

## Implementation Steps

1. **Profile Page Development** (3-4 days)
   - Create UI components
   - Implement form functionality
   - Add validation
   - Connect to API

2. **Listing Page Integration** (2-3 days)
   - Design mentor cards
   - Implement listing grid
   - Add sorting/filtering
   - Connect to API with React Query

3. **Detail Profile View** (2-3 days)
   - Design profile layout
   - Implement data loading
   - Add reviews section

4. **Booking System** (3-4 days)
   - Create booking form
   - Implement availability calendar
   - Add appointment creation flow
   - Set up notifications

5. **Dashboard Updates** (2-3 days)
   - Add appointments to dashboards
   - Implement management features
   - Connect all data flows

## Testing Plan

1. **Unit Tests**
   - Test form validation
   - Test state management
   - Test API integration

2. **Integration Tests**
   - Verify profile creation to listing flow
   - Test booking process end-to-end
   - Validate dashboard updates

3. **User Testing**
   - Have mentors create/edit profiles
   - Test patient booking flow
   - Verify notifications and updates

## Deployment Strategy

1. **Feature Flagging**
   - Implement feature flags for phased rollout
   - Enable gradual user adoption

2. **Monitoring**
   - Set up error tracking
   - Monitor API performance
   - Track user engagement metrics

3. **Rollback Plan**
   - Prepare database snapshots
   - Set up version control for quick rollbacks

## Next Steps

1. Begin with creating the profile page component and form
2. Implement the save/edit functionality
3. Connect to API endpoints
4. Test the full profile creation flow
5. Move to the public listing integration 
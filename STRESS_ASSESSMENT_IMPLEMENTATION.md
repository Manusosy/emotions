# Stress Assessment System Implementation Plan

This document outlines the implementation plan for improving the stress assessment system in the Emotions App.

## Overview

The current stress assessment system has several inconsistencies and issues that need to be addressed to ensure proper functionality, data consistency, and a better user experience.

## Implementation Checklist

### 1. Standardize Data Structure

- [x] Create consistent TypeScript interfaces for assessment data
- [x] Align field naming conventions across components and API (use camelCase for frontend)
- [x] Standardize API request/response formats

```typescript
// Example interfaces
interface StressAssessment {
  id: string;
  userId: string;
  score: number; // 0-10 scale
  symptoms: string[];
  triggers: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AssessmentResponse {
  id: number;
  questionId: number;
  questionType: string;
  score: number;
}

interface AssessmentMetrics {
  userId: string;
  stressLevel: number;
  lastAssessmentDate: string;
  streakCount: number;
  consistencyScore: number;
  trend: 'improving' | 'declining' | 'stable';
  firstCheckInDate: string;
}
```

### 2. Fix API Endpoint Integration

- [x] Update `/api/stress-assessments` endpoint to match interface expectations
- [x] Implement or update `/api/assessment-metrics` endpoint
- [x] Add proper validation for request data
- [x] Implement comprehensive error handling

```typescript
// Example API route implementation pattern
export async function POST(request: Request) {
  try {
    // Validate user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { userId, score, symptoms, triggers, notes } = body;
    
    if (!userId || typeof score !== 'number' || !Array.isArray(symptoms) || !Array.isArray(triggers)) {
      return new NextResponse('Invalid request data', { status: 400 });
    }

    // Create assessment in database
    const assessment = await prisma.stressAssessment.create({
      data: {
        userId,
        score,
        symptoms,
        triggers,
        notes: notes || "",
      },
    });

    // Update metrics
    await updateUserMetrics(userId, score);

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Error in POST /api/stress-assessments:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
```

### 3. Consistent Scale System

- [x] Standardize on 0-10 scale throughout the application
- [x] Update all components to use consistent scale
- [x] Add scale documentation in codebase

```typescript
/**
 * Converts a raw stress score to a health percentage.
 * @param stressScore - Stress score on a scale of 0-10 (higher = more stress)
 * @returns Health percentage on a scale of 0-100 (higher = better health)
 */
const calculateHealthPercentage = (stressScore: number): number => {
  // Convert stress score (0-10) to health percentage (0-100)
  return Math.max(0, Math.min(100, 100 - (stressScore * 10)));
};
```

### 4. Enhanced Error Handling

- [x] Add try/catch blocks to all API calls
- [x] Implement user-friendly error messages
- [x] Add loading states and fallback UI
- [x] Create recovery strategies for failed operations

```typescript
// Example error handling pattern
try {
  setIsLoading(true);
  const response = await api.post('/api/stress-assessments', assessmentData);
  
  if (!response.ok) {
    throw new Error('Failed to save assessment');
  }
  
  toast.success("Assessment completed successfully!");
  // Additional success handling
} catch (error) {
  console.error('Error saving assessment:', error);
  
  // Specific error handling based on error type
  if (error instanceof ApiError && error.status === 401) {
    toast.error("Your session has expired. Please log in again.");
    // Redirect to login
  } else {
    toast.error("Unable to save your assessment. Please try again later.");
    // Additional recovery options
  }
} finally {
  setIsLoading(false);
}
```

### 5. Database Schema Alignment

- [x] Update Prisma schema to match frontend expectations
- [x] Add proper indexes for performance
- [x] Ensure consistent field naming
- [x] Create migrations if needed

```prisma
model StressAssessment {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  userId    String
  score     Float    // Using Float for precise scores
  symptoms  String[]
  triggers  String[]
  notes     String?  @db.Text
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
}

model AssessmentMetrics {
  id                String   @id @default(cuid())
  userId            String   @unique
  stressLevel       Float
  lastAssessmentAt  DateTime
  streakCount       Int      @default(1)
  consistencyScore  Float    @default(0)
  trend             String   @default("stable")
  firstCheckInDate  DateTime
  updatedAt         DateTime @updatedAt
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

### 6. UX Improvements

- [x] Add more descriptive guidance text during assessment
- [x] Improve visual feedback for assessment progress
- [x] Enhance result visualization
- [x] Add helpful tooltips and context information

```tsx
// Example improved UI guidance
<DialogContent className="sm:max-w-md">
  <DialogHeader>
    <DialogTitle className="flex items-center justify-between">
      <span>Question {currentStep + 1}/{questions.length}</span>
      <span className="text-sm font-normal text-muted-foreground">
        Step {currentStep + 1} of {questions.length}
      </span>
    </DialogTitle>
    <DialogDescription>
      Answer honestly to get the most accurate results. Your responses are private and help us provide better support.
    </DialogDescription>
  </DialogHeader>
  
  {/* Question content */}
</DialogContent>
```

### 7. Integration Testing

- [ ] Create test plan for assessment flow
- [ ] Test data persistence and retrieval
- [ ] Verify error handling across components
- [ ] Test visualization components with various data scenarios

## Updated StressAssessmentModal Component

The updated StressAssessmentModal component will:

1. Use standardized data structures ✅
2. Implement proper error handling ✅
3. Provide clear user guidance ✅
4. Save data using the consistent API format ✅
5. Show appropriate loading and success states ✅

## Next Steps

After implementation, we should:

1. Monitor error rates to ensure the system is working correctly
2. Collect user feedback on the assessment experience
3. Consider adding more assessment questions or customization options
4. Explore data visualization improvements for the reports page

## Implementation Priority

1. Data structure standardization (highest priority) ✅
2. API endpoint fixes ✅
3. Error handling improvements ✅
4. UX enhancements ✅
5. Integration testing 
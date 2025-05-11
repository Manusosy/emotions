import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";

interface ProfileCompletionProps {
  profile: any;
}

export function ProfileCompletion({ profile }: ProfileCompletionProps) {
  const sections = [
    {
      name: "Basic Information",
      fields: ["full_name", "email", "phone_number", "location", "avatar_url"],
      completed: 0
    },
    {
      name: "Professional Information",
      fields: ["bio", "specialty", "specialties", "therapyTypes", "languages"],
      completed: 0
    },
    {
      name: "Education & Experience",
      fields: ["education", "experience", "awards"],
      completed: 0
    },
    {
      name: "Availability & Fees",
      fields: ["availability_status", "consultation_fee"],
      completed: 0
    }
  ];

  // Calculate completion for each section
  sections.forEach(section => {
    const completedFields = section.fields.filter(field => {
      const value = profile[field];
      return value && (
        (Array.isArray(value) && value.length > 0) ||
        (typeof value === "string" && value.trim() !== "") ||
        (typeof value === "number") ||
        (typeof value === "boolean")
      );
    });
    section.completed = (completedFields.length / section.fields.length) * 100;
  });

  // Calculate overall completion
  const totalFields = sections.reduce((acc, section) => acc + section.fields.length, 0);
  const totalCompleted = sections.reduce((acc, section) => {
    const completedInSection = Math.round((section.completed / 100) * section.fields.length);
    return acc + completedInSection;
  }, 0);
  const overallCompletion = Math.round((totalCompleted / totalFields) * 100);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          Profile Completion
          <span className="text-2xl font-bold text-blue-600">{overallCompletion}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={overallCompletion} className="h-2 mb-4" />
        
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {section.completed === 100 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
                <span className="text-sm font-medium">{section.name}</span>
              </div>
              <span className="text-sm text-gray-500">{Math.round(section.completed)}%</span>
            </div>
          ))}
        </div>

        {overallCompletion < 100 && (
          <p className="mt-4 text-sm text-amber-600">
            Complete your profile to appear in the ambassador listings
          </p>
        )}
      </CardContent>
    </Card>
  );
} 
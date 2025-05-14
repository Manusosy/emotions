import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileCompletionProps {
  profile: any;
  sectionValidity?: Record<string, boolean>;
}

export function ProfileCompletion({ profile, sectionValidity }: ProfileCompletionProps) {
  const sections = [
    {
      name: "Basic Information",
      key: "basic-info",
      fields: ["firstName", "lastName", "email", "phone_number", "location", "avatar_url", "gender"],
      completed: 0
    },
    {
      name: "Professional Information",
      key: "professional",
      fields: ["bio", "specialty", "specialties", "therapyTypes", "languages"],
      completed: 0
    },
    {
      name: "Education & Experience",
      key: "education",
      fields: ["education", "experience", "awards"],
      completed: 0
    },
    {
      name: "Availability & Fees",
      key: "services",
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
    <Card className="mb-6 border-blue-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          Profile Completion
          <span className="text-2xl font-bold text-blue-600">{overallCompletion}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={overallCompletion} className="h-3 mb-4" />
        
        {sectionValidity && overallCompletion < 100 && (
          <div className="space-y-2 mt-2">
            {sections.map((section) => (
              <div 
                key={section.key} 
                className={`flex items-center justify-between text-sm ${
                  sectionValidity[section.key] ? 'text-green-600' : 'text-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  {sectionValidity[section.key] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <span>{section.name}</span>
                </div>
                {!sectionValidity[section.key] && (
                  <Badge variant="outline" className="text-xs font-normal text-amber-600 border-amber-300 bg-amber-50">
                    Required
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
        
        {overallCompletion < 100 && (
          <p className="text-sm text-blue-600 font-medium mt-4">
            Complete your profile to appear in the mood mentor listings
          </p>
        )}
      </CardContent>
    </Card>
  );
} 
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ChevronLeft, Pencil, Trash, Flag, Tag } from 'lucide-react';
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
  tomorrows_intention?: string;
}

// Mock entry for demo purposes
const mockEntry: JournalEntry = {
  id: "entry-1",
  title: "Finally Making Progress",
  content: "<p>I'm starting to see improvements in my anxiety levels after consistent practice of mindfulness. Today was particularly good as I was able to use the breathing techniques during a stressful meeting.</p><p>I noticed that when I start feeling anxious, if I can catch it early enough, the 4-7-8 breathing method really helps calm me down before the anxiety escalates.</p><p>My mood mentor suggested I try to identify specific triggers, which has been helpful. Work presentations seem to be the biggest trigger right now, but I'm getting better at managing them.</p>",
  mood: 8,
  tags: ["progress", "mindfulness", "anxiety", "work"],
  created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  user_id: "user-1",
  tomorrows_intention: "I will practice mindfulness for 10 minutes in the morning before checking emails."
};

export default function JournalEntryPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // For demo purposes, use mock data
        // In a real app, fetch from API or database
        setTimeout(() => {
          setEntry(mockEntry);
          setIsLoading(false);
        }, 800);
      } catch (err: any) {
        console.error('Error fetching journal entry:', err);
        setError('Failed to load entry. Please try again.');
        setIsLoading(false);
      }
    };
    
    fetchEntry();
  }, [entryId]);
  
  const handleGoBack = () => {
    if (isAuthenticated) {
      navigate('/patient-dashboard/journal');
    } else {
      navigate('/journal');
    }
  };
  
  const handleEdit = () => {
    if (isAuthenticated) {
      navigate(`/patient-dashboard/journal/edit/${entryId}`);
    } else {
      navigate(`/journal/edit/${entryId}`);
    }
  };
  
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMMM d, yyyy - h:mm a');
    } catch (e) {
      return dateStr;
    }
  };
  
  // Function to get mood color based on value
  const getMoodColor = (mood: number) => {
    if (mood >= 8) return 'bg-green-500';
    if (mood >= 6) return 'bg-teal-500';
    if (mood >= 4) return 'bg-yellow-500';
    if (mood >= 2) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  // Function to get mood description
  const getMoodDescription = (mood: number) => {
    if (mood >= 8) return 'Great';
    if (mood >= 6) return 'Good';
    if (mood >= 4) return 'Okay';
    if (mood >= 2) return 'Low';
    return 'Very Low';
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size="lg" className="mb-4" />
        <p className="text-gray-500">Loading entry...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={handleGoBack} variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Journal
        </Button>
      </div>
    );
  }
  
  if (!entry) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Entry not found</p>
        <Button onClick={handleGoBack} variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Journal
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={handleGoBack}
          className="mb-4 pl-0 hover:bg-transparent"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Journal
        </Button>
        
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold text-gray-900">{entry.title}</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
        
        <div className="flex items-center mt-2 text-sm text-gray-500">
          <time dateTime={entry.created_at}>{formatDate(entry.created_at)}</time>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full ${getMoodColor(entry.mood)} flex items-center justify-center text-white font-medium mr-2`}>
                {entry.mood}
              </div>
              <span className="text-gray-700">Mood: {getMoodDescription(entry.mood)}</span>
            </div>
            
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {entry.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: entry.content }} />
          
          {entry.tomorrows_intention && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Tomorrow's Intention</h3>
              <p className="text-blue-700">{entry.tomorrows_intention}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
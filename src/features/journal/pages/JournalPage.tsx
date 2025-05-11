import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Edit, Plus, LayoutGrid, List, Filter } from 'lucide-react';
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

// Mock data for demo purposes
const mockEntries: JournalEntry[] = [
  {
    id: "entry-1",
    title: "Finally Making Progress",
    content: "<p>I'm starting to see improvements in my anxiety levels after consistent practice of mindfulness.</p>",
    mood: 8,
    tags: ["progress", "mindfulness", "anxiety"],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    user_id: "user-1"
  },
  {
    id: "entry-2",
    title: "Difficult Day at Work",
    content: "<p>Struggled with a panic attack during a meeting, but managed to use my breathing techniques.</p>",
    mood: 4,
    tags: ["work", "panic", "coping"],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    user_id: "user-1"
  },
  {
    id: "entry-3",
    title: "Weekend Self-Care",
    content: "<p>Spent the day focusing on self-care activities that help me manage stress.</p>",
    mood: 9,
    tags: ["self-care", "relaxation", "weekend"],
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    user_id: "user-1"
  }
];

export default function JournalPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setRecentEntries(mockEntries);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleCreateEntry = () => {
    if (isAuthenticated) {
      navigate('/patient-dashboard/journal/new');
    } else {
      navigate('/journal/new');
    }
  };
  
  const handleViewArchive = () => {
    if (isAuthenticated) {
      navigate('/patient-dashboard/journal/archive');
    } else {
      navigate('/journal/archive');
    }
  };
  
  const handleViewEntry = (entryId: string) => {
    if (isAuthenticated) {
      navigate(`/patient-dashboard/journal/${entryId}`);
    } else {
      navigate(`/journal/${entryId}`);
    }
  };
  
  const formatPreview = (content: string) => {
    // Remove HTML tags
    const textOnly = content.replace(/<[^>]*>/g, "");
    // Shorten to about 100 characters
    return textOnly.length > 100 ? textOnly.substring(0, 100) + "..." : textOnly;
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Journal</h1>
          <p className="text-gray-600 mt-1">Capture your thoughts, track your moods, and reflect on your journey</p>
        </div>
        <Button onClick={handleCreateEntry} className="flex items-center gap-2">
          <Plus size={16} />
          New Entry
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
            <CardDescription>Your latest journal entries</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : recentEntries.length > 0 ? (
              <div className="space-y-4">
                {recentEntries.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleViewEntry(entry.id)}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-gray-900">{entry.title}</h3>
                      <span className="text-sm text-gray-500">{formatDate(entry.created_at)}</span>
                    </div>
                    <p className="text-gray-600 mt-1">{formatPreview(entry.content)}</p>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {entry.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You haven't created any journal entries yet.</p>
                <Button onClick={handleCreateEntry} variant="outline">Create Your First Entry</Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-center">
            <Button onClick={handleViewArchive} variant="outline" className="w-full">
              View All Entries
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Journal Tools</CardTitle>
            <CardDescription>Helpful resources for journaling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start" onClick={handleCreateEntry}>
              <Edit className="mr-2 h-4 w-4" />
              New Entry
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleViewArchive}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              Browse Archive
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar View
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Filter className="mr-2 h-4 w-4" />
              Filter & Tags
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Journaling Streak</CardTitle>
          <CardDescription>
            Consistency builds mental well-being. Track your progress here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-2xl font-bold">7 Days</p>
            <p className="text-sm text-gray-500 mt-1">Current streak</p>
          </div>
          <div className="grid grid-cols-7 gap-1 mt-4">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="aspect-square rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-xs text-white font-medium">{7-i}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
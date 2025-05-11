import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { 
  Smile, 
  Frown, 
  Meh, 
  Clock, 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Calendar,
  HeartPulse,
  Activity,
  BarChart
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, differenceInDays } from "date-fns";
import { moodService, MoodSummary } from "@/services/moodService";
import { errorLog, devLog } from "@/utils/environment";
import { notificationService } from "@/lib/notificationService";
import { fetchWithErrorHandling } from "@/utils/error-handling";

// Function to interpret mood score
const getMoodDescription = (score: number): string => {
  if (score >= 8) return 'Very Happy';
  if (score >= 6) return 'Happy';
  if (score >= 5) return 'Neutral';
  if (score >= 3) return 'Sad';
  return 'Very Sad';
};

// Function to get color based on mood score
const getMoodColor = (score: number): string => {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-green-500';
  if (score >= 5) return 'text-yellow-500';
  if (score >= 3) return 'text-orange-500';
  return 'text-red-500';
};

export default function MoodSummaryCard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<MoodSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create a memoized function to fetch mood summary data
  const fetchMoodSummary = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      // Call the mood service directly
      const data = await moodService.getMoodSummary(user.id);
      if (data) {
        setSummary(data);
      }
    } catch (error) {
      errorLog('Error fetching mood summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Initial fetch on component mount and subscribe to mood updates
  useEffect(() => {
    if (!user?.id) return;
    
    // Initial fetch
    fetchMoodSummary();
    
    // Subscribe to mood entries updates using the notification service
    const subscriptionId = notificationService.subscribe('mood_entries', user.id, 30000);
    
    // Add a listener to update the summary when new mood entries are received
    notificationService.addListener('mood_entries', user.id, () => {
      devLog('Mood entries updated, refreshing summary');
      fetchMoodSummary();
    });
    
    return () => {
      // Clean up subscription and listener when component unmounts
      notificationService.unsubscribe(subscriptionId);
      notificationService.removeListener('mood_entries', user.id, fetchMoodSummary);
    };
  }, [user?.id, fetchMoodSummary]);

  const formatLastAssessment = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = parseISO(dateString);
    const today = new Date();
    const daysDiff = differenceInDays(today, date);
    
    if (daysDiff === 0) return 'Today';
    if (daysDiff === 1) return 'Yesterday';
    if (daysDiff < 7) return `${daysDiff} days ago`;
    
    return format(date, 'MMM dd, yyyy');
  };

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-medium">Your Mood Summary</CardTitle>
        <HeartPulse className="w-4 h-4 text-rose-500" />
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Emotion Status */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Current Mood</span>
                <span className={`text-base font-bold ${summary?.averageScore ? getMoodColor(summary.averageScore) : 'text-slate-500'}`}>
                  {summary?.averageScore ? getMoodDescription(summary.averageScore) : 'No data'}
                </span>
              </div>
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                {summary?.averageScore ? (
                  summary.averageScore >= 6 ? (
                    <Smile className="w-6 h-6 text-green-500" />
                  ) : summary.averageScore >= 4 ? (
                    <Meh className="w-6 h-6 text-yellow-500" />
                  ) : (
                    <Frown className="w-6 h-6 text-red-500" />
                  )
                ) : (
                  <Meh className="w-6 h-6 text-slate-300" />
                )}
              </div>
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Check-ins */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">Check-ins</span>
                </div>
                <div className="text-lg font-bold text-blue-900">{summary?.totalEntries || 0}</div>
              </div>
              
              {/* Streak */}
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-800">Streak</span>
                </div>
                <div className="text-lg font-bold text-green-900">{summary?.streakDays || 0} days</div>
              </div>
            </div>
            
            {/* More Details */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-600">Average Mood</span>
                <div className="flex items-center">
                  <span className={`text-sm font-semibold ${summary?.averageScore ? getMoodColor(summary.averageScore) : ''}`}>
                    {summary?.averageScore ? summary.averageScore.toFixed(1) : '0'}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">/10</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-sm text-slate-600">Last Check-in</span>
                </div>
                <span className="text-sm font-medium">{formatLastAssessment(summary?.lastAssessment || null)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Frequent Mood</span>
                <Badge variant="outline" className={`font-medium ${
                  summary?.mostFrequentMood?.toLowerCase().includes('happy') 
                    ? 'text-green-600 border-green-200 bg-green-50' 
                    : summary?.mostFrequentMood?.toLowerCase().includes('sad')
                    ? 'text-red-600 border-red-200 bg-red-50'
                    : 'text-yellow-600 border-yellow-200 bg-yellow-50'
                }`}>
                  {summary?.mostFrequentMood || 'No data'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
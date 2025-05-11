import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Save, SmilePlus } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { errorLog, devLog } from '@/utils/environment';

export default function NewJournalEntryPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tomorrowsIntention, setTomorrowsIntention] = useState('');
  
  const handleGoBack = () => {
    if (isAuthenticated) {
      navigate('/patient-dashboard/journal');
    } else {
      navigate('/journal');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a title for your journal entry');
      return;
    }
    
    if (!content.trim()) {
      toast.error('Please write something in your journal entry');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create journal entry object
      const entry = {
        title,
        content,
        mood,
        tags,
        tomorrows_intention: tomorrowsIntention,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // In a real app, save to database
      devLog('Saving journal entry:', entry);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Journal entry saved successfully');
      
      // Redirect to journal page
      if (isAuthenticated) {
        navigate('/patient-dashboard/journal');
      } else {
        navigate('/journal');
      }
    } catch (error) {
      errorLog('Error saving journal entry:', error);
      toast.error('Failed to save journal entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      
      // Check if tag already exists
      if (!tags.includes(tagInput.trim().toLowerCase())) {
        setTags([...tags, tagInput.trim().toLowerCase()]);
      }
      
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Function to get mood description
  const getMoodDescription = (moodValue: number) => {
    if (moodValue >= 8) return 'Great';
    if (moodValue >= 6) return 'Good';
    if (moodValue >= 4) return 'Okay';
    if (moodValue >= 2) return 'Low';
    return 'Very Low';
  };
  
  // Function to get mood color based on value
  const getMoodColor = (moodValue: number) => {
    if (moodValue >= 8) return 'bg-green-500';
    if (moodValue >= 6) return 'bg-teal-500';
    if (moodValue >= 4) return 'bg-yellow-500';
    if (moodValue >= 2) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
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
        
        <h1 className="text-3xl font-bold text-gray-900">New Journal Entry</h1>
        <p className="text-gray-500 mt-1">Express your thoughts and feelings</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                placeholder="Give your entry a title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Journal Entry</Label>
              <Textarea 
                id="content" 
                placeholder="Write about your day, thoughts, or feelings..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px]"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mood">
                How are you feeling today? <span className="text-gray-500 ml-2">{getMoodDescription(mood)} ({mood}/10)</span>
              </Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Slider 
                    id="mood" 
                    value={[mood]} 
                    min={1} 
                    max={10} 
                    step={1} 
                    onValueChange={(values) => setMood(values[0])} 
                  />
                </div>
                <div className={`w-10 h-10 rounded-full ${getMoodColor(mood)} flex items-center justify-center text-white font-medium`}>
                  {mood}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs flex items-center gap-1 pl-3">
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-gray-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input 
                id="tags" 
                placeholder="Add tags (press Enter after each tag)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="intention">Tomorrow's Intention (Optional)</Label>
              <Textarea 
                id="intention" 
                placeholder="What's one thing you intend to do tomorrow?"
                value={tomorrowsIntention}
                onChange={(e) => setTomorrowsIntention(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-4 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleGoBack}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? 'Saving...' : 'Save Entry'}
              <Save className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 
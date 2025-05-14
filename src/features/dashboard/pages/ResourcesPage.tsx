import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  BookOpen, 
  Video, 
  Headphones, 
  Users, 
  FileText, 
  Calendar, 
  ExternalLink,
  Bookmark,
  BookmarkPlus,
  Share2,
  Download,
  ChevronRight,
  Clock3
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { api } from "@/lib/api";

// Resource type definition
interface Resource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'podcast' | 'document' | 'group' | 'workshop';
  category: string;
  author: string;
  authorRole?: string;
  authorAvatar?: string;
  date: string;
  readTime?: string;
  duration?: string;
  description: string;
  imageUrl?: string;
  tags: string[];
  url: string;
  file_url?: string;
  featured?: boolean;
  savedByUser?: boolean;
  downloads?: number;
  shares?: number;
  mentor_id?: string;
}

export default function ResourcesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [savedResources, setSavedResources] = useState<string[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch resources from the API
  const fetchResources = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.id) return;
      
      const response = await api.get('/api/resources');
      const data = await response.json();
      
      setResources(data || []);
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    
    // Load saved resources from local storage
    const savedItems = localStorage.getItem('savedResources');
    if (savedItems) {
      setSavedResources(JSON.parse(savedItems));
    }
  }, [user]);

  // Filter resources based on search and active tab
  const filteredResources = resources.filter(resource => {
    // Check if search query matches
    const matchesSearch = searchQuery === "" || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Check if tab matches
    const matchesTab = activeTab === "all" || 
      (activeTab === "articles" && resource.type === "article") ||
      (activeTab === "videos" && resource.type === "video") ||
      (activeTab === "podcasts" && resource.type === "podcast") ||
      (activeTab === "groups" && resource.type === "group") ||
      (activeTab === "workshops" && resource.type === "workshop") ||
      (activeTab === "documents" && resource.type === "document") ||
      (activeTab === "saved" && savedResources.includes(resource.id));
    
    return matchesSearch && matchesTab;
  });

  // Get featured resources
  const featuredResources = resources.filter(resource => resource.featured);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already applied through the filter
  };

  const handleSaveResource = useCallback((resourceId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent triggering parent click events
    }
    
    if (savedResources.includes(resourceId)) {
      const newSavedResources = savedResources.filter(id => id !== resourceId);
      setSavedResources(newSavedResources);
      localStorage.setItem('savedResources', JSON.stringify(newSavedResources));
      toast("Resource removed from your saved items");
    } else {
      const newSavedResources = [...savedResources, resourceId];
      setSavedResources(newSavedResources);
      localStorage.setItem('savedResources', JSON.stringify(newSavedResources));
      toast("Resource saved to your collection");
    }
  }, [savedResources]);

  const handleShareResource = useCallback(async (resource: Resource, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent triggering parent click events
    }
    
    try {
      await navigator.clipboard.writeText(`Check out this resource: ${resource.title} - ${window.location.origin}${resource.url}`);
      
      // Increment share count via API
      await api.patch(`/api/resources/${resource.id}/share`);
      
      // Update local state
      setResources(prev => 
        prev.map(res => 
          res.id === resource.id 
            ? { ...res, shares: (res.shares || 0) + 1 } 
            : res
        )
      );
      
      toast("Resource link copied to clipboard");
    } catch (error) {
      console.error("Failed to share resource:", error);
      toast.error("Failed to copy link to clipboard");
    }
  }, []);

  const handleDownloadResource = useCallback(async (resource: Resource, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent triggering parent click events
    }
    
    try {
      // For file_url, use that for direct download
      const downloadUrl = resource.file_url || resource.url;
      
      // Increment download count via API
      await api.patch(`/api/resources/${resource.id}/download`);
      
      // Update local state
      setResources(prev => 
        prev.map(res => 
          res.id === resource.id 
            ? { ...res, downloads: (res.downloads || 0) + 1 } 
            : res
        )
      );

      // Open the download in a new window
      window.open(downloadUrl, "_blank");
      toast("Resource downloaded successfully");
    } catch (error) {
      console.error("Failed to download resource:", error);
      toast.error("Failed to download resource");
    }
  }, []);

  const handleResourceClick = useCallback((url: string) => {
    navigate(url);
  }, [navigate]);

  // Get the icon for the resource type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case "article":
        return <FileText className="h-5 w-5" />;
      case "document":
        return <FileText className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      case "podcast":
        return <Headphones className="h-5 w-5" />;
      case "group":
        return <Users className="h-5 w-5" />;
      case "workshop":
        return <Calendar className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  // Get the color for the resource category
  const getCategoryColor = (type: string) => {
    switch (type) {
      case "article":
        return "bg-blue-100 text-blue-800";
      case "video":
        return "bg-red-100 text-red-800";
      case "podcast":
        return "bg-purple-100 text-purple-800";
      case "document":
        return "bg-green-100 text-green-800";
      case "group":
        return "bg-yellow-100 text-yellow-800";
      case "workshop":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Resource List Component
  const ResourceList = () => {
    if (isLoading) {
      return (
        <div className="py-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading resources...</p>
        </div>
      );
    }
    
    if (filteredResources.length === 0) {
      return (
        <div className="py-12 text-center">
          <div className="rounded-full bg-gray-100 p-3 w-12 h-12 flex items-center justify-center mx-auto">
            <Search className="h-6 w-6 text-gray-500" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No resources found</h3>
          <p className="mt-1 text-gray-500">
            {searchQuery ? `No results for "${searchQuery}"` : 
             activeTab === "saved" ? "You haven't saved any resources yet" : 
             "No resources available for this category"}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((resource) => (
          <Card 
            key={resource.id} 
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleResourceClick(resource.url)}
          >
            {resource.imageUrl && (
              <div className="h-48 overflow-hidden">
                <img 
                  src={resource.imageUrl} 
                  alt={resource.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
            )}
            <CardHeader className={!resource.imageUrl ? "pt-6" : "pt-4"}>
              <div className="flex justify-between items-start">
                <Badge variant="outline" className={`${getCategoryColor(resource.type)} font-normal`}>
                  {getResourceIcon(resource.type)}
                  <span className="ml-1 capitalize">{resource.type}</span>
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 ${savedResources.includes(resource.id) ? 'text-primary' : 'text-gray-500'}`}
                  onClick={(e) => handleSaveResource(resource.id, e)}
                  title={savedResources.includes(resource.id) ? "Remove from saved" : "Save for later"}
                >
                  {savedResources.includes(resource.id) ? 
                    <Bookmark className="h-5 w-5" /> : 
                    <BookmarkPlus className="h-5 w-5" />
                  }
                </Button>
              </div>
              <CardTitle className="text-xl mt-2">{resource.title}</CardTitle>
              <CardDescription className="line-clamp-2 text-sm text-gray-600">
                {resource.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-3">
                {resource.authorAvatar ? (
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={resource.authorAvatar} alt={resource.author} />
                    <AvatarFallback>{resource.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback>{resource.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <p className="text-sm font-medium">{resource.author}</p>
                  <p className="text-xs text-gray-500">{resource.authorRole || "Mood Mentor"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {resource.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="font-normal text-xs">
                    {tag}
                  </Badge>
                ))}
                {resource.tags.length > 3 && (
                  <Badge variant="secondary" className="font-normal text-xs">
                    +{resource.tags.length - 3} more
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-0">
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{resource.date}</span>
                {(resource.readTime || resource.duration) && (
                  <>
                    <span className="mx-1">•</span>
                    <Clock3 className="h-3 w-3 mr-1" />
                    <span>{resource.readTime || resource.duration}</span>
                  </>
                )}
              </div>
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-gray-500"
                  onClick={(e) => handleShareResource(resource, e)}
                  title="Share resource"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                {(resource.file_url || resource.type === 'document') && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-gray-500"
                    onClick={(e) => handleDownloadResource(resource, e)}
                    title="Download resource"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  // Featured Resource Card Component
  const FeaturedResourceCard = ({ resource }: { resource: Resource }) => (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col md:flex-row"
      onClick={() => handleResourceClick(resource.url)}
    >
      {resource.imageUrl && (
        <div className="h-48 md:h-auto md:w-64 overflow-hidden">
          <img 
            src={resource.imageUrl} 
            alt={resource.title} 
            className="w-full h-full object-cover" 
          />
        </div>
      )}
      <div className="flex flex-col flex-1">
        <CardHeader>
          <div className="flex justify-between items-start">
            <Badge variant="outline" className={`${getCategoryColor(resource.type)} font-normal`}>
              {getResourceIcon(resource.type)}
              <span className="ml-1 capitalize">{resource.type}</span>
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-8 w-8 ${savedResources.includes(resource.id) ? 'text-primary' : 'text-gray-500'}`}
              onClick={(e) => handleSaveResource(resource.id, e)}
              title={savedResources.includes(resource.id) ? "Remove from saved" : "Save for later"}
            >
              {savedResources.includes(resource.id) ? 
                <Bookmark className="h-5 w-5" /> : 
                <BookmarkPlus className="h-5 w-5" />
              }
            </Button>
          </div>
          <CardTitle className="text-2xl mt-2">{resource.title}</CardTitle>
          <CardDescription className="line-clamp-3">{resource.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="flex items-center mb-3">
            {resource.authorAvatar ? (
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={resource.authorAvatar} alt={resource.author} />
                <AvatarFallback>{resource.author.charAt(0)}</AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback>{resource.author.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <p className="text-sm font-medium">{resource.author}</p>
              <p className="text-xs text-gray-500">{resource.authorRole || "Mood Mentor"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-3">
            {resource.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{resource.date}</span>
            {(resource.readTime || resource.duration) && (
              <>
                <span className="mx-1">•</span>
                <Clock3 className="h-4 w-4 mr-1" />
                <span>{resource.readTime || resource.duration}</span>
              </>
            )}
          </div>
          <Button variant="outline" className="space-x-2">
            <span>Learn More</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </div>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="container max-w-screen-xl py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Resources</h1>
            <p className="text-gray-600">Discover helpful materials recommended by our mood mentors</p>
          </div>
          <form onSubmit={handleSearch} className="mt-4 md:mt-0 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                type="search" 
                placeholder="Search resources..." 
                className="pl-10 w-full md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>

        {featuredResources.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Featured Resources</h2>
            <div className="space-y-4">
              {featuredResources.slice(0, 2).map(resource => (
                <FeaturedResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="workshops">Workshops</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-0">
            <ResourceList />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 
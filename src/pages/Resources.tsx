import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { 
  BookOpen, 
  Wrench, 
  Phone, 
  Video, 
  Users, 
  Smartphone,
  MessageSquare,
  Search,
  Download,
  Play,
  ExternalLink,
  Heart,
  ChevronRight,
  UserPlus,
  Clock,
  Mail,
  FileText,
  FileImage,
  Link as LinkIcon,
  Share2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

type Resource = {
  id: string;
  title: string;
  description: string;
  type: "video" | "article" | "audio" | "workbook" | "tool" | "document" | "image" | "link";
  category: string[];
  image: string;
  featured?: boolean;
  new?: boolean;
  popular?: boolean;
  author?: {
    name: string;
    role: string;
    avatar: string;
  };
  duration?: string;
  tags?: string[];
  downloadUrl?: string;
  externalUrl?: string;
  url?: string;
  file_url?: string;
  mentor_id?: string;
  shares?: number;
  downloads?: number;
  created_at?: string;
}

// Helper function to convert DB resources to our UI format
const convertDbResourceToUi = (dbResource: any): Resource => {
  console.log("Converting resource:", dbResource);

  // Default images based on resource type
  const typeImages: Record<string, string> = {
    document: "https://images.unsplash.com/photo-1551847677-dc82d764e1eb?q=80&w=500&auto=format&fit=crop",
    video: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=500&auto=format&fit=crop",
    image: "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=500&auto=format&fit=crop",
    link: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=500&auto=format&fit=crop",
    article: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=500&auto=format&fit=crop"
  };

  // Extract categories from the single category string
  // Convert it to array format for compatibility with our UI
  const categoryMapping: Record<string, string[]> = {
    anxiety: ["self-help", "educational"],
    depression: ["self-help", "educational"],
    stress: ["self-help"],
    mindfulness: ["self-help"],
    "self-care": ["self-help"],
    trauma: ["educational"],
    relationships: ["community", "educational"],
    grief: ["self-help", "community"]
  };

  // Format the resource type to match our UI types
  // Keep the original type if it's already one of our UI types
  let uiType: Resource["type"];
  switch (dbResource.type) {
    case "document":
      uiType = "document";
      break;
    case "video":
      uiType = "video";
      break;
    case "image":
      uiType = "image";
      break;
    case "link":
      uiType = "link";
      break;
    case "article":
      uiType = "article";
      break;
    case "audio":
      uiType = "audio";
      break;
    case "workbook":
      uiType = "workbook";
      break;
    case "tool":
      uiType = "tool";
      break;
    default:
      uiType = "document";
  }

  // Create a new Date object to calculate if resource is "new" (less than 7 days old)
  const isNew = dbResource.created_at ? 
    new Date(dbResource.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : 
    false;

  // Is popular if it has more than 50 downloads or shares
  const isPopular = (dbResource.downloads || 0) + (dbResource.shares || 0) > 50;

  // Get appropriate image based on resource type or use a default
  const resourceImage = dbResource.image_url || typeImages[uiType] || typeImages.document;

  // Format the author information
  const authorInfo = dbResource.author_name ? {
    name: dbResource.author_name || "Mood Mentor",
    role: dbResource.author_role || "Mental Health Professional",
    avatar: dbResource.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(dbResource.author_name)}&background=random`
  } : undefined;

  // Use the actual resource type for proper rendering
  return {
    id: dbResource.id,
    title: dbResource.title,
    description: dbResource.description || "No description provided",
    type: uiType,
    category: categoryMapping[dbResource.category] || ["educational"],
    image: resourceImage,
    featured: dbResource.featured || isPopular || false,
    new: isNew,
    popular: isPopular,
    author: authorInfo,
    downloadUrl: dbResource.file_url,
    externalUrl: dbResource.url,
    url: dbResource.url,
    file_url: dbResource.file_url,
    mentor_id: dbResource.mentor_id,
    shares: dbResource.shares || 0,
    downloads: dbResource.downloads || 0,
    created_at: dbResource.created_at,
    // For display purposes
    tags: [dbResource.category, uiType].filter(Boolean),
    duration: dbResource.duration || 
              (uiType === "document" ? "PDF Document" : 
              uiType === "video" ? "Video Resource" : 
              uiType === "image" ? "Image Resource" : 
              uiType === "audio" ? "Audio Resource" : "External Link")
  };
};

const Resources = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [hoveredResourceId, setHoveredResourceId] = useState<string | null>(null)
  const [dbResources, setDbResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Fetch mood mentor-uploaded resources from Supabase
  useEffect(() => {
    const fetchMoodMentorResources = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching mood mentor resources...");
        
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .eq('is_public', true) // Only fetch resources marked as public
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        console.log("Raw resources from database:", data);
        
        // Convert DB resources to our UI format
        const formattedResources = (data || []).map(convertDbResourceToUi);
        
        console.log("Formatted resources for UI:", formattedResources);
        
        setDbResources(formattedResources);
      } catch (error: any) {
        console.error('Error fetching resources:', error);
        toast.error('Failed to load some resources');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMoodMentorResources();
    
    // Set up real-time subscription for resources table
    const resourcesSubscription = supabase
      .channel('public:resources')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'resources',
        filter: 'is_public=eq.true' // Only listen for changes to public resources
      }, (payload) => {
        console.log('Real-time change received:', payload);
        
        // Handle different types of changes
        if (payload.eventType === 'INSERT') {
          // Add new resource
          const newResource = convertDbResourceToUi(payload.new);
          setDbResources(prev => [newResource, ...prev]);
          toast.success('New resource added');
        } 
        else if (payload.eventType === 'UPDATE') {
          // Update existing resource
          const updatedResource = convertDbResourceToUi(payload.new);
          setDbResources(prev => 
            prev.map(res => res.id === updatedResource.id ? updatedResource : res)
          );
          toast.info('Resource updated');
        } 
        else if (payload.eventType === 'DELETE') {
          // Remove deleted resource
          setDbResources(prev => 
            prev.filter(res => res.id !== payload.old.id)
          );
          toast.info('Resource removed');
        }
      })
      .subscribe();
    
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(resourcesSubscription);
    };
  }, []);
  
  // Handle resource downloads with tracking
  const handleResourceDownload = async (resource: Resource) => {
    try {
      // Only update counts for resources from the database
      if (resource.id && resource.mentor_id) {
        // Increment download count
        const { error } = await supabase
          .from('resources')
          .update({ 
            downloads: (resource.downloads || 0) + 1 
          })
          .eq('id', resource.id);
        
        if (error) throw error;
        
        // Update local state
        setDbResources(prev => 
          prev.map(res => 
            res.id === resource.id 
              ? { ...res, downloads: (res.downloads || 0) + 1 } 
              : res
          )
        );
      }
      
      // Open the download or external URL
      const downloadUrl = resource.downloadUrl || resource.file_url || resource.externalUrl || resource.url;
      if (downloadUrl) {
        window.open(downloadUrl, "_blank");
      }
    } catch (error: any) {
      console.error('Error handling resource download:', error);
      toast.error("Failed to download resource");
    }
  };
  
  // Handle resource sharing with tracking
  const handleResourceShare = async (resource: Resource) => {
    try {
      const shareUrl = resource.externalUrl || resource.url || resource.downloadUrl || resource.file_url;
      
      if (shareUrl) {
        // Try to use the native share API if available
        if (navigator.share) {
          await navigator.share({
            title: resource.title,
            text: resource.description,
            url: shareUrl
          });
        } else {
          // Fallback to copying to clipboard
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied to clipboard");
        }
        
        // Only update counts for resources from the database
        if (resource.id && resource.mentor_id) {
          // Increment share count
          const { error } = await supabase
            .from('resources')
            .update({ 
              shares: (resource.shares || 0) + 1 
            })
            .eq('id', resource.id);
          
          if (error) throw error;
          
          // Update local state
          setDbResources(prev => 
            prev.map(res => 
              res.id === resource.id 
                ? { ...res, shares: (res.shares || 0) + 1 } 
                : res
            )
          );
        }
      }
    } catch (error: any) {
      console.error('Error sharing resource:', error);
      toast.error("Failed to share resource");
    }
  };
  
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  }
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  
  const categories = [
    {
      id: "educational",
      icon: <BookOpen className="w-5 h-5" />,
      title: "Educational Materials",
      description: "Articles, guides, and research about mental health conditions and treatments.",
      action: "View Resources"
    },
    {
      id: "self-help",
      icon: <Wrench className="w-5 h-5" />,
      title: "Self-Help Tools",
      description: "Worksheets, exercises, and activities for personal mental health management.",
      action: "View Resources"
    },
    {
      id: "crisis",
      icon: <Phone className="w-5 h-5" />,
      title: "Crisis Support",
      description: "Hotlines, text services, and emergency resources for immediate support.",
      action: "View Resources"
    },
    {
      id: "video",
      icon: <Video className="w-5 h-5" />,
      title: "Video Resources",
      description: "Talks, guided exercises, and informational videos about mental health.",
      action: "View Resources"
    },
    {
      id: "community",
      icon: <Users className="w-5 h-5" />,
      title: "Community Support",
      description: "Forums, online communities, and support groups for connection and shared experiences.",
      action: "View Resources"
    },
    {
      id: "digital",
      icon: <Smartphone className="w-5 h-5" />,
      title: "Digital Tools",
      description: "Apps, websites, and digital resources for mental health support on the go.",
      action: "View Resources"
    }
  ]

  // Use only resources from the database
  const resources = [...dbResources];
  
  // Make sure at least one mood mentor resource is marked as featured if available
  if (dbResources.length > 0 && !dbResources.some(r => r.featured)) {
    // Mark the first mood mentor resource as featured
    dbResources[0].featured = true;
  }
  
  const filteredResources = resources.filter(resource => {
    if (activeCategory !== "all" && !resource.category.includes(activeCategory)) {
      return false;
    }
    if (searchQuery && !resource.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !resource.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });
  
  const featuredResources = resources.filter(r => r.featured);
  
  const getResourceTypeIcon = (type: string) => {
    switch(type) {
      case "video": return <Video className="w-4 h-4" />;
      case "article": return <BookOpen className="w-4 h-4" />;
      case "audio": return <Play className="w-4 h-4" />;
      case "workbook": return <Download className="w-4 h-4" />;
      case "tool": return <Wrench className="w-4 h-4" />;
      case "document": return <FileText className="w-4 h-4" />;
      case "image": return <FileImage className="w-4 h-4" />;
      case "link": return <LinkIcon className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };
  
  const getResourceTypeLabel = (type: string) => {
    switch(type) {
      case "video": return "Video";
      case "article": return "Article";
      case "audio": return "Audio";
      case "workbook": return "Workbook";
      case "tool": return "Interactive Tool";
      case "document": return "Document";
      case "image": return "Image";
      case "link": return "Link";
      default: return type;
    }
  };
  
  const getResourceActionButton = (resource: Resource) => {
    if (resource.downloadUrl || resource.file_url) {
      return (
        <Button 
          className="rounded-full bg-[#00D2FF] hover:bg-[#00bfe8] text-white" 
          onClick={() => handleResourceDownload(resource)}
        >
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
      );
    } else if (resource.type === "video") {
      return (
        <Button 
          className="rounded-full bg-[#0078FF] hover:bg-blue-600 text-white"
          onClick={() => handleResourceDownload(resource)}
        >
          <Play className="mr-2 h-4 w-4" /> Watch Now
        </Button>
      );
    } else if (resource.type === "audio") {
      return (
        <Button 
          className="rounded-full bg-[#0078FF] hover:bg-blue-600 text-white"
          onClick={() => handleResourceDownload(resource)}
        >
          <Play className="mr-2 h-4 w-4" /> Listen Now
        </Button>
      );
    } else {
      return (
        <Button 
          className="rounded-full bg-[#0078FF] hover:bg-blue-600 text-white"
          onClick={() => handleResourceDownload(resource)}
        >
          <ExternalLink className="mr-2 h-4 w-4" /> Access
        </Button>
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="mb-16">
        <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Mental Health Resources</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access a wide range of materials to support your mental wellbeing, from educational content to interactive tools.
        </p>
      </div>

        <div className="relative mx-auto max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search for resources..."
            className="pl-10 pr-4 py-3 rounded-full border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>
      
      {/* Categories */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
            <motion.div
              key={category.id}
              className="cursor-pointer"
              onClick={() => setActiveCategory(category.id)}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={`h-full transition-colors ${activeCategory === category.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'}`}>
                <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  {category.icon}
                </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{category.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                      <div className="flex items-center text-blue-600 font-medium text-sm">
                        <span>{category.action}</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                </div>
              </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* Featured Resources */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Resources</h2>
        
        {isLoading ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading featured resources...</p>
          </div>
        ) : featuredResources.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {featuredResources.map((resource) => (
              <motion.div
                key={resource.id}
                variants={fadeInUp}
                onMouseEnter={() => setHoveredResourceId(resource.id)}
                onMouseLeave={() => setHoveredResourceId(null)}
              >
                <Card className="overflow-hidden bg-white border-none shadow-md h-full">
                  <div className="relative aspect-[4/3] h-52">
                    <img 
                      src={resource.image} 
                      alt={resource.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://placehold.co/400x300?text=Resource+Image";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-5">
                      <div className="flex items-center mb-2">
                        <Badge className="bg-[#00D2FF] text-white border-0">
                          {getResourceTypeIcon(resource.type)}
                          <span className="ml-1">{getResourceTypeLabel(resource.type)}</span>
                        </Badge>
                        {resource.new && (
                          <Badge className="ml-2 bg-amber-500 text-white border-0">New</Badge>
                        )}
                        {resource.popular && (
                          <Badge className="ml-2 bg-pink-500 text-white border-0">Popular</Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white text-left">{resource.title}</h3>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <p className="text-gray-600 mb-4 line-clamp-2">{resource.description}</p>
                    {resource.author && (
                      <div className="flex items-center mb-4">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={resource.author.avatar} alt={resource.author.name} />
                          <AvatarFallback>{resource.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{resource.author.name}</p>
                          <p className="text-xs text-gray-500">{resource.author.role}</p>
                        </div>
                      </div>
                    )}
                    {resource.duration && (
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{resource.duration}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {resource.tags && resource.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-gray-100 text-gray-700">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="p-5 pt-0 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {getResourceActionButton(resource)}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-500 hover:text-blue-500"
                        onClick={() => handleResourceShare(resource)}
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-500">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No featured resources yet</h3>
            <p className="text-gray-600 mb-4">
              Our mood mentors are working on creating helpful resources. Check back soon!
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.href = "/sign-up"}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Sign up for access to more resources
            </Button>
          </div>
        )}
      </section>
      
      {/* All Resources */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            All Resources 
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({resources.length} available)
            </span>
          </h2>
          <div className="flex items-center">
            <Button variant="ghost" className="text-sm flex items-center" onClick={() => setActiveCategory("all")}>
              <span className={activeCategory === "all" ? "text-blue-600 font-medium" : ""}>All</span>
          </Button>
            {categories.map((cat) => (
              <Button 
                key={cat.id} 
                variant="ghost" 
                className="text-sm flex items-center"
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className={activeCategory === cat.id ? "text-blue-600 font-medium" : ""}>{cat.title}</span>
          </Button>
            ))}
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading resources...</p>
          </div>
        ) : filteredResources.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {filteredResources.map((resource) => (
              <motion.div
                key={resource.id}
                variants={fadeInUp}
                className="h-full"
              >
                <Card className="overflow-hidden border hover:shadow-lg transition-shadow h-full flex flex-col">
                  <div className="relative aspect-video">
                    <img 
                      src={resource.image} 
                      alt={resource.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://placehold.co/400x300?text=Resource+Image";
                      }}
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-gray-800/70 text-white hover:bg-gray-800">
                        {getResourceTypeIcon(resource.type)}
                        <span className="ml-1">{getResourceTypeLabel(resource.type)}</span>
                      </Badge>
                    </div>
                    {resource.new && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-amber-500 text-white">New</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 flex-grow">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{resource.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{resource.description}</p>
                    {resource.author && (
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <span className="font-medium">{resource.author.name}</span>
                        <span className="mx-1">•</span>
                        <span>{resource.author.role}</span>
                      </div>
                    )}
                    {resource.duration && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{resource.duration}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 pt-0 border-t">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {getResourceActionButton(resource)}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-gray-500 hover:text-blue-500"
                          onClick={() => handleResourceShare(resource)}
                        >
                          <Share2 className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      {/* Show download/share counts if they exist */}
                      {(resource.downloads || resource.shares) && (
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {resource.downloads && (
                            <div className="flex items-center">
                              <Download className="h-3 w-3 mr-1" />
                              <span>{resource.downloads}</span>
                            </div>
                          )}
                          {resource.shares && (
                            <div className="flex items-center">
                              <Share2 className="h-3 w-3 mr-1" />
                              <span>{resource.shares}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No resources found</h3>
            <p className="text-gray-500">
              {searchQuery ? 
                `No resources matching "${searchQuery}" in the selected category.` : 
                "No resources available in the selected category."}
            </p>
            {searchQuery && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </Button>
            )}
            <div className="mt-6">
              <p className="text-gray-600 mb-4">Looking for mental health resources?</p>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = "/sign-up"}>
                <UserPlus className="mr-2 h-4 w-4" />
                Sign up for personalized resources
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
} 

export default Resources
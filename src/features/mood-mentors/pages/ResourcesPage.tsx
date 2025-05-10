import React, { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Search,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Plus,
  BookOpen,
  Video,
  FileImage,
  Link as LinkIcon,
  Upload,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Resource } from "@/types/database.types";
import { api } from "@/lib/api";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const resourceCategories = [
  { value: "anxiety", label: "Anxiety" },
  { value: "depression", label: "Depression" },
  { value: "stress", label: "Stress Management" },
  { value: "mindfulness", label: "Mindfulness" },
  { value: "self-care", label: "Self-Care" },
  { value: "trauma", label: "Trauma" },
  { value: "relationships", label: "Relationships" },
  { value: "grief", label: "Grief & Loss" },
];

const resourceTypes = [
  { value: "document", label: "Document", icon: <FileText className="h-4 w-4" /> },
  { value: "video", label: "Video", icon: <Video className="h-4 w-4" /> },
  { value: "image", label: "Image", icon: <FileImage className="h-4 w-4" /> },
  { value: "link", label: "Link (Article/Website)", icon: <LinkIcon className="h-4 w-4" /> },
];

interface AddResourceFormData {
  title: string;
  description: string;
  type: string;
  category: string;
  url: string;
  file?: File | null;
}

const ResourcesPage = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<AddResourceFormData>({
    title: "",
    description: "",
    type: "document",
    category: "anxiety",
    url: "",
    file: null,
  });

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
  }, [user]);

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = async (resource: Resource) => {
    try {
      // For file_url, use that for direct download
      const downloadUrl = resource.file_url || resource.url;
      
      // Increment download count
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
      toast.success("Resource downloaded successfully");
    } catch (error: any) {
      console.error('Error downloading resource:', error);
      toast.error("Failed to download resource");
    }
  };

  const handleShare = async (resource: Resource) => {
    try {
      await navigator.clipboard.writeText(resource.url);
      
      // Increment share count
      await api.patch(`/api/resources/${resource.id}/share`);
      
      // Update local state
      setResources(prev => 
        prev.map(res => 
          res.id === resource.id 
            ? { ...res, shares: (res.shares || 0) + 1 } 
            : res
        )
      );
      
      toast.success("Resource link copied to clipboard");
    } catch (error: any) {
      console.error('Error sharing resource:', error);
      toast.error("Failed to share resource");
    }
  };

  const handleDelete = async (resourceId: string) => {
    try {
      await api.delete(`/api/resources/${resourceId}`);
      
      // Update local state
      setResources(resources.filter(r => r.id !== resourceId));
      toast.success("Resource deleted successfully");
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      toast.error("Failed to delete resource");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "document",
      category: "anxiety",
      url: "",
      file: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!user?.id) throw new Error("User not authenticated");
      
      if (!formData.title) throw new Error("Title is required");
      if (!formData.description) throw new Error("Description is required");
      
      let fileUrl = "";
      let resourceUrl = formData.url;
      
      // Handle file upload for document, video, or image types
      if (formData.file && ["document", "video", "image"].includes(formData.type)) {
        const file = formData.file;
        const formDataObj = new FormData();
        formDataObj.append('file', file);
        
        const uploadResponse = await api.post('/api/upload/resource', formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        });
        
        const uploadData = await uploadResponse.json();
        if (!uploadData.url) throw new Error("Failed to get file URL");
        
        fileUrl = uploadData.url;
        // If no direct URL was provided, use the file URL as the resource URL
        if (!resourceUrl) {
          resourceUrl = uploadData.url;
        }
      } else if (formData.type === "link") {
        // For link type, URL is required
        if (!resourceUrl) throw new Error("URL is required for link resources");
      }
      
      // Validate that we have a URL
      if (!resourceUrl) throw new Error("Either a file or URL must be provided");
      
      // Create the resource
      const resourceData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        url: resourceUrl,
        file_url: fileUrl || null,
        created_by: user.id
      };
      
      const response = await api.post('/api/resources', resourceData);
      const newResource = await response.json();
      
      // Update local state
      setResources(prev => [newResource, ...prev]);
      
      // Reset form and close dialog
      resetForm();
      setIsAddDialogOpen(false);
      toast.success("Resource added successfully");
    } catch (error: any) {
      console.error('Error adding resource:', error);
      toast.error(error.message || "Failed to add resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'video':
        return <Video className="h-6 w-6 text-purple-500" />;
      case 'image':
        return <FileImage className="h-6 w-6 text-green-500" />;
      case 'link':
        return <LinkIcon className="h-6 w-6 text-amber-500" />;
      default:
        return <BookOpen className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
            <p className="text-gray-500">Manage and share mental health resources</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0078FF] text-white hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[800px] w-[90vw] h-auto overflow-y-auto max-h-[90vh] p-6">
              <DialogHeader>
                <DialogTitle>Add New Resource</DialogTitle>
                <DialogDescription>
                  Add educational materials, tools, or external links for your patients.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="E.g. Understanding Anxiety Workbook"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Briefly describe what this resource is about..."
                    rows={3}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Resource Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => handleSelectChange("type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {resourceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center">
                              {type.icon}
                              <span className="ml-2">{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => handleSelectChange("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {resourceCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {formData.type === "link" && (
                  <div className="space-y-2">
                    <Label htmlFor="url">URL Link</Label>
                    <Input 
                      id="url" 
                      name="url" 
                      value={formData.url}
                      onChange={handleInputChange}
                      placeholder="https://example.com/resource"
                      required={formData.type === "link"}
                    />
                  </div>
                )}
                
                {["document", "video", "image"].includes(formData.type) && (
                  <div className="space-y-2">
                    <Label htmlFor="file">Upload File</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="file" 
                        name="file" 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="flex-1"
                        accept={
                          formData.type === "document" 
                            ? ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" 
                            : formData.type === "video"
                              ? ".mp4,.webm,.avi,.mov" 
                              : ".jpg,.jpeg,.png,.gif,.webp"
                        }
                        required={!formData.url}
                      />
                    </div>
                    
                    <div className="text-sm text-gray-500 mt-1">
                      {formData.type === "document" && "Accepted formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT"}
                      {formData.type === "video" && "Accepted formats: MP4, WEBM, AVI, MOV"}
                      {formData.type === "image" && "Accepted formats: JPG, PNG, GIF, WEBP"}
                    </div>
                    
                    {["document", "video"].includes(formData.type) && (
                      <div className="mt-2">
                        <Label htmlFor="url" className="text-sm">Or provide a URL (optional)</Label>
                        <Input 
                          id="url" 
                          name="url" 
                          value={formData.url}
                          onChange={handleInputChange}
                          placeholder={formData.type === "document" 
                            ? "https://example.com/document.pdf" 
                            : "https://example.com/video.mp4"
                          }
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.type === "document" 
                            ? "For documents hosted elsewhere (Google Drive, Dropbox, etc.)" 
                            : "For videos hosted elsewhere (YouTube, Vimeo, etc.)"
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                <DialogFooter className="mt-6 pt-4 border-t flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-[#0078FF] text-white hover:bg-blue-700"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Resource'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6">
          <div className="p-4 border-b">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 focus:border-[#20C0F3] focus:ring-[#20C0F3]"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {resourceCategories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading resources...
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No resources found
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResources.map((resource) => (
                  <Card key={resource.id} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getResourceIcon(resource.type)}
                          </div>
                          <div>
                            <h3 className="font-medium">{resource.title}</h3>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {resource.description}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownload(resource)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare(resource)}>
                              <Share2 className="mr-2 h-4 w-4" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(resource.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                          <Download className="h-4 w-4 mr-1" />
                          <span>{resource.downloads || 0} downloads</span>
                        </div>
                        <div className="flex items-center">
                          <Share2 className="h-4 w-4 mr-1" />
                          <span>{resource.shares || 0} shares</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ResourcesPage;

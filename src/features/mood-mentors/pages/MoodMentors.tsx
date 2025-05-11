import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, ThumbsUp, MessageSquare, DollarSign, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import BookingButton from "@/features/booking/components/BookingButton"
import { moodMentorService, MoodMentor } from "@/services/moodMentorService"

export default function MoodMentors() {
  const [mentors, setMentors] = useState<MoodMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    free: false,
    anxiety: false,
    depression: false,
    stress: false,
    relationships: false,
  });

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const data = await moodMentorService.getMoodMentors();
      setMentors(data);
    } catch (error) {
      console.error("Error fetching mood mentors:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMentors = mentors.filter(mentor => {
    // Apply search filter
    const matchesSearch = mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.specialty.toLowerCase().includes(searchQuery.toLowerCase());

    // Apply checkbox filters
    const matchesFree = !filters.free || mentor.isFree;
    const matchesAnxiety = !filters.anxiety || mentor.therapyTypes.includes('anxiety');
    const matchesDepression = !filters.depression || mentor.therapyTypes.includes('depression');
    const matchesStress = !filters.stress || mentor.therapyTypes.includes('stress');
    const matchesRelationships = !filters.relationships || mentor.therapyTypes.includes('relationships');

    return matchesSearch && matchesFree && matchesAnxiety && matchesDepression && 
           matchesStress && matchesRelationships;
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mood Mentors</h1>
          <p className="text-gray-600">Connect with experienced mental health professionals</p>
        </div>
        <div className="relative w-full md:w-[300px]">
          <Input
            type="search"
            placeholder="Search by name or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-4 h-fit lg:col-span-1">
          <h2 className="font-semibold mb-4">Filters</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="free"
                checked={filters.free}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, free: checked as boolean }))
                }
              />
              <label htmlFor="free" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Free Sessions Available
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anxiety"
                checked={filters.anxiety}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, anxiety: checked as boolean }))
                }
              />
              <label htmlFor="anxiety" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Anxiety
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="depression"
                checked={filters.depression}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, depression: checked as boolean }))
                }
              />
              <label htmlFor="depression" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Depression
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="stress"
                checked={filters.stress}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, stress: checked as boolean }))
                }
              />
              <label htmlFor="stress" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Stress Management
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="relationships"
                checked={filters.relationships}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, relationships: checked as boolean }))
                }
              />
              <label htmlFor="relationships" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Relationships
              </label>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredMentors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No mood mentors found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMentors.map((mentor) => (
                <Card key={mentor.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                        <img
                          src={mentor.image || "/placeholder-avatar.png"}
                          alt={mentor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">{mentor.name}</h3>
                        <p className="text-sm text-gray-500">{mentor.credentials}</p>
                      </div>
                    </div>
                    {mentor.isFree && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Free Sessions
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-2" />
                      {mentor.location}
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      {mentor.satisfaction}% Client Satisfaction
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {mentor.therapyTypes.map((type, index) => (
                        <Badge key={index} variant="outline">
                          {type}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <Link to={`/mood-mentors/${mentor.id}`}>
                        <Button variant="outline" className="mr-2">
                          <Info className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                      </Link>
                      <BookingButton mentorId={mentor.id} mentorName={mentor.name} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
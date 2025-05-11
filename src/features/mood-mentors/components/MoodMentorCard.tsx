import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Map, Calendar, Star, MessageCircle, Video } from "lucide-react";
import { Link } from "react-router-dom";

interface MoodMentorCardProps {
  id: string;
  name: string;
  image?: string;
  specialty: string;
  location: string;
  rating: number;
  reviews: number;
  availableToday?: boolean;
  href: string;
  isFree?: boolean;
}

const MoodMentorCard: React.FC<MoodMentorCardProps> = ({
  id,
  name,
  image,
  specialty,
  location,
  rating,
  reviews,
  availableToday = false,
  href,
  isFree = true,
}) => {
  // Create a random initial for the avatar fallback
  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  return (
    <Card className="h-full transition-all hover:shadow-md overflow-hidden">
      <CardContent className="p-3">
        <div className="flex flex-col h-full space-y-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
              <AvatarImage src={image} alt={name} />
              <AvatarFallback className="bg-blue-100 text-blue-800 font-medium">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-base">{name}</h3>
              <p className="text-blue-600 text-sm">{specialty}</p>
              <div className="flex items-center text-gray-600 text-xs mt-1 space-x-2">
                <Map className="h-3 w-3" />
                <span>{location}</span>
              </div>
              <div className="flex items-center mt-1 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-3 w-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
                <span className="text-xs text-gray-600">({reviews})</span>
              </div>
            </div>
            {availableToday && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 whitespace-nowrap text-xs">
                <Calendar className="h-3 w-3 mr-1" /> Available Today
              </Badge>
            )}
          </div>
          
          <div className="flex-1" />
          
          <div className="flex space-x-2 items-center">
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link to={`/mood-mentors/${id}`}>
                <MessageCircle className="h-4 w-4 mr-1" /> Profile
              </Link>
            </Button>
            <Button size="sm" asChild className="flex-1" disabled={!isFree}>
              <Link to={`/booking?moodMentorId=${id}`}>
                <Video className="h-4 w-4 mr-1" /> {isFree ? "Book" : "Unavailable"}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodMentorCard; 
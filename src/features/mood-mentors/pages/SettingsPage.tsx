import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { X, Check, AlertCircle } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  Image as ImageIcon, 
  Briefcase, 
  GraduationCap, 
  Clock, 
  Plus, 
  Brain,
  Users,
  MessageSquare,
  Activity,
  Star,
  Heart,
  Shield,
  Baby,
  ChevronRight,
  ChevronLeft,
  Building,
  Map,
  Languages,
  Award,
  DollarSign,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { moodMentorService } from "@/lib/moodMentorService";
import { profileService } from "@/lib/profileService";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface TherapyType {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SettingsFormData {
  full_name: string;
  email: string;
  phone_number: string;
  bio: string;
  specialties: string[];
  languages: string[];
  education: {
    university: string;
    degree: string;
    period: string;
  }[];
  experience: {
    company: string;
    position: string;
    period: string;
    duration: string;
  }[];
  credentials: string;
  specialty: string;
  location: string;
  gender: string;
  therapyTypes: TherapyType[];
  services: string[];
  awards: {
    title: string;
    year: string;
    description: string;
  }[];
  availability_status: string;
  consultation_fee: number;
  isFree: boolean;
  avatar_url: string;
  avatar: File | null;
  gallery_images: string[];
  formErrors: Record<string, string>;
  selectedPhoneCode: string;
}

const defaultEducation = {
  university: "",
  degree: "",
  period: ""
};

const defaultExperience = {
  company: "",
  position: "",
  period: "",
  duration: ""
};

const defaultAward = {
  title: "",
  year: "",
  description: ""
};

const therapyTypeOptions: TherapyType[] = [
  { name: "Cognitive Behavioral Therapy", icon: Brain },
  { name: "EMDR Therapy", icon: Activity },
  { name: "Mindfulness", icon: Heart },
  { name: "Group Therapy", icon: Users },
  { name: "Trauma-Focused CBT", icon: Shield },
  { name: "Family Counseling", icon: Users },
  { name: "Couples Therapy", icon: Heart },
  { name: "Child Psychology", icon: Baby }
];

interface CountryWithCode {
  name: string;
  code: string;
  phoneCode: string;
}

// Country options with phone codes
const countryOptions: CountryWithCode[] = [
  { name: "Afghanistan", code: "AF", phoneCode: "+93" },
  { name: "Albania", code: "AL", phoneCode: "+355" },
  { name: "Algeria", code: "DZ", phoneCode: "+213" },
  { name: "Angola", code: "AO", phoneCode: "+244" },
  { name: "Argentina", code: "AR", phoneCode: "+54" },
  { name: "Australia", code: "AU", phoneCode: "+61" },
  { name: "Austria", code: "AT", phoneCode: "+43" },
  { name: "Bangladesh", code: "BD", phoneCode: "+880" },
  { name: "Belgium", code: "BE", phoneCode: "+32" },
  { name: "Benin", code: "BJ", phoneCode: "+229" },
  { name: "Botswana", code: "BW", phoneCode: "+267" },
  { name: "Brazil", code: "BR", phoneCode: "+55" },
  { name: "Burkina Faso", code: "BF", phoneCode: "+226" },
  { name: "Burundi", code: "BI", phoneCode: "+257" },
  { name: "Cabo Verde", code: "CV", phoneCode: "+238" },
  { name: "Cameroon", code: "CM", phoneCode: "+237" },
  { name: "Canada", code: "CA", phoneCode: "+1" },
  { name: "Central African Republic", code: "CF", phoneCode: "+236" },
  { name: "Chad", code: "TD", phoneCode: "+235" },
  { name: "China", code: "CN", phoneCode: "+86" },
  { name: "Colombia", code: "CO", phoneCode: "+57" },
  { name: "Comoros", code: "KM", phoneCode: "+269" },
  { name: "Congo", code: "CG", phoneCode: "+242" },
  { name: "Djibouti", code: "DJ", phoneCode: "+253" },
  { name: "Egypt", code: "EG", phoneCode: "+20" },
  { name: "Equatorial Guinea", code: "GQ", phoneCode: "+240" },
  { name: "Eritrea", code: "ER", phoneCode: "+291" },
  { name: "Eswatini", code: "SZ", phoneCode: "+268" },
  { name: "Ethiopia", code: "ET", phoneCode: "+251" },
  { name: "France", code: "FR", phoneCode: "+33" },
  { name: "Gabon", code: "GA", phoneCode: "+241" },
  { name: "Gambia", code: "GM", phoneCode: "+220" },
  { name: "Germany", code: "DE", phoneCode: "+49" },
  { name: "Ghana", code: "GH", phoneCode: "+233" },
  { name: "Guinea", code: "GN", phoneCode: "+224" },
  { name: "Guinea-Bissau", code: "GW", phoneCode: "+245" },
  { name: "India", code: "IN", phoneCode: "+91" },
  { name: "Indonesia", code: "ID", phoneCode: "+62" },
  { name: "Italy", code: "IT", phoneCode: "+39" },
  { name: "Japan", code: "JP", phoneCode: "+81" },
  { name: "Kenya", code: "KE", phoneCode: "+254" },
  { name: "Lesotho", code: "LS", phoneCode: "+266" },
  { name: "Liberia", code: "LR", phoneCode: "+231" },
  { name: "Libya", code: "LY", phoneCode: "+218" },
  { name: "Madagascar", code: "MG", phoneCode: "+261" },
  { name: "Malawi", code: "MW", phoneCode: "+265" },
  { name: "Mali", code: "ML", phoneCode: "+223" },
  { name: "Mauritania", code: "MR", phoneCode: "+222" },
  { name: "Mauritius", code: "MU", phoneCode: "+230" },
  { name: "Mexico", code: "MX", phoneCode: "+52" },
  { name: "Micronesia", code: "FM", phoneCode: "+691" },
  { name: "Moldova", code: "MD", phoneCode: "+373" },
  { name: "Monaco", code: "MC", phoneCode: "+377" },
  { name: "Mongolia", code: "MN", phoneCode: "+976" },
  { name: "Montenegro", code: "ME", phoneCode: "+382" },
  { name: "Morocco", code: "MA", phoneCode: "+212" },
  { name: "Mozambique", code: "MZ", phoneCode: "+258" },
  { name: "Myanmar", code: "MM", phoneCode: "+95" },
  { name: "Namibia", code: "NA", phoneCode: "+264" },
  { name: "Nauru", code: "NR", phoneCode: "+674" },
  { name: "Nepal", code: "NP", phoneCode: "+977" },
  { name: "Netherlands", code: "NL", phoneCode: "+31" },
  { name: "New Zealand", code: "NZ", phoneCode: "+64" },
  { name: "Nicaragua", code: "NI", phoneCode: "+505" },
  { name: "Niger", code: "NE", phoneCode: "+227" },
  { name: "Nigeria", code: "NG", phoneCode: "+234" },
  { name: "North Macedonia", code: "MK", phoneCode: "+389" },
  { name: "Norway", code: "NO", phoneCode: "+47" },
  { name: "Oman", code: "OM", phoneCode: "+968" },
  { name: "Pakistan", code: "PK", phoneCode: "+92" },
  { name: "Palau", code: "PW", phoneCode: "+680" },
  { name: "Palestine", code: "PS", phoneCode: "+970" },
  { name: "Panama", code: "PA", phoneCode: "+507" },
  { name: "Papua New Guinea", code: "PG", phoneCode: "+675" },
  { name: "Paraguay", code: "PY", phoneCode: "+595" },
  { name: "Peru", code: "PE", phoneCode: "+51" },
  { name: "Philippines", code: "PH", phoneCode: "+63" },
  { name: "Poland", code: "PL", phoneCode: "+48" },
  { name: "Portugal", code: "PT", phoneCode: "+351" },
  { name: "Qatar", code: "QA", phoneCode: "+974" },
  { name: "Romania", code: "RO", phoneCode: "+40" },
  { name: "Russia", code: "RU", phoneCode: "+7" },
  { name: "Rwanda", code: "RW", phoneCode: "+250" },
  { name: "Saint Kitts and Nevis", code: "KN", phoneCode: "+1" },
  { name: "Saint Lucia", code: "LC", phoneCode: "+1" },
  { name: "Saint Vincent and the Grenadines", code: "VC", phoneCode: "+1" },
  { name: "Samoa", code: "WS", phoneCode: "+685" },
  { name: "San Marino", code: "SM", phoneCode: "+378" },
  { name: "Sao Tome and Principe", code: "ST", phoneCode: "+239" },
  { name: "Saudi Arabia", code: "SA", phoneCode: "+966" },
  { name: "Senegal", code: "SN", phoneCode: "+221" },
  { name: "Serbia", code: "RS", phoneCode: "+381" },
  { name: "Seychelles", code: "SC", phoneCode: "+248" },
  { name: "Sierra Leone", code: "SL", phoneCode: "+232" },
  { name: "Singapore", code: "SG", phoneCode: "+65" },
  { name: "Slovakia", code: "SK", phoneCode: "+421" },
  { name: "Slovenia", code: "SI", phoneCode: "+386" },
  { name: "Solomon Islands", code: "SB", phoneCode: "+677" },
  { name: "Somalia", code: "SO", phoneCode: "+252" },
  { name: "South Africa", code: "ZA", phoneCode: "+27" },
  { name: "South Sudan", code: "SS", phoneCode: "+211" },
  { name: "Spain", code: "ES", phoneCode: "+34" },
  { name: "Sri Lanka", code: "LK", phoneCode: "+94" },
  { name: "Sudan", code: "SD", phoneCode: "+249" },
  { name: "Suriname", code: "SR", phoneCode: "+597" },
  { name: "Sweden", code: "SE", phoneCode: "+46" },
  { name: "Switzerland", code: "CH", phoneCode: "+41" },
  { name: "Syria", code: "SY", phoneCode: "+963" },
  { name: "Taiwan", code: "TW", phoneCode: "+886" },
  { name: "Tajikistan", code: "TJ", phoneCode: "+992" },
  { name: "Tanzania", code: "TZ", phoneCode: "+255" },
  { name: "Thailand", code: "TH", phoneCode: "+66" },
  { name: "Timor-Leste", code: "TL", phoneCode: "+670" },
  { name: "Togo", code: "TG", phoneCode: "+228" },
  { name: "Tonga", code: "TO", phoneCode: "+676" },
  { name: "Trinidad and Tobago", code: "TT", phoneCode: "+1" },
  { name: "Tunisia", code: "TN", phoneCode: "+216" },
  { name: "Turkey", code: "TR", phoneCode: "+90" },
  { name: "Turkmenistan", code: "TM", phoneCode: "+993" },
  { name: "Tuvalu", code: "TV", phoneCode: "+688" },
  { name: "Uganda", code: "UG", phoneCode: "+256" },
  { name: "Ukraine", code: "UA", phoneCode: "+380" },
  { name: "United Arab Emirates", code: "AE", phoneCode: "+971" },
  { name: "United Kingdom", code: "GB", phoneCode: "+44" },
  { name: "United States", code: "US", phoneCode: "+1" },
  { name: "Uruguay", code: "UY", phoneCode: "+598" },
  { name: "Uzbekistan", code: "UZ", phoneCode: "+998" },
  { name: "Vanuatu", code: "VU", phoneCode: "+678" },
  { name: "Vatican City", code: "VA", phoneCode: "+39" },
  { name: "Venezuela", code: "VE", phoneCode: "+58" },
  { name: "Vietnam", code: "VN", phoneCode: "+84" },
  { name: "Yemen", code: "YE", phoneCode: "+967" },
  { name: "Zambia", code: "ZM", phoneCode: "+260" },
  { name: "Zimbabwe", code: "ZW", phoneCode: "+263" }
];

const availabilityOptions = [
  { value: "available", label: "Available" },
  { value: "unavailable", label: "Unavailable" },
  { value: "busy", label: "Busy" }
];

const specialtyOptions = [
  "Anxiety",
  "Depression",
  "Stress Management",
  "Trauma",
  "Relationships",
  "Self-Esteem",
  "Grief",
  "Career",
  "Life Transitions",
  "Identity",
  "LGBTQ+",
  "Cultural Issues"
];

// STEPS
const STEPS = {
  BASIC_INFO: 0,
  EDUCATION_EXPERIENCE: 1,
  THERAPY_SERVICES: 2,
  AVAILABILITY_PRICING: 3,
  MEDIA_UPLOAD: 4
};

// Step titles and descriptions
const stepInfo = [
  {
    title: "Basic Information",
    description: "Basic contact details to help clients reach you",
    icon: User
  },
  {
    title: "Education & Experience",
    description: "Share your qualifications and professional background",
    icon: GraduationCap
  },
  {
    title: "Therapy & Services",
    description: "The types of therapy and services you offer",
    icon: Heart
  },
  {
    title: "Availability & Pricing",
    description: "When you're available and your consultation fees",
    icon: Calendar
  },
  {
    title: "Profile Media",
    description: "Upload your profile picture and gallery images",
    icon: ImageIcon
  }
];

// Helper function to decode base64 if needed
function decodeBase64(str: string): string {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return str;
  }
}

// Add gender options
const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-Binary" },
  { value: "prefer-not-to-say", label: "Prefer Not to Say" }
];

// Add language options for African languages
const languageOptions = [
  "English",
  "French",
  "Swahili",
  "Kinyarwanda",
  "Luganda",
  "Twi",
  "Yoruba",
  "Igbo",
  "Hausa",
  "Zulu",
  "Shona",
  "Amharic",
  "Somali",
  "Wolof",
  "Ewe",
  "Akan",
  "Krio",
  "Lingala",
  "Fula",
  "Sesotho",
  "Chichewa",
  "Tswana",
  "Xhosa",
  "Afrikaans",
  "Berber",
  "Arabic",
  "Portuguese",
  "Ndebele",
  "Tigrinya",
  "Oromo",
  "Bemba",
  "Ga",
  "Susu",
  "Temne",
  "Bambara",
  "Kanuri",
  "Kikuyu",
  "Runyankole",
  "Kisii",
  "Luo",
  "Dagbani",
  "Edo",
  "Ibibio",
  "Fang",
  "Tsonga",
  "Venda",
  "Sango",
  "Kongo",
  "Chokwe",
  "Tshivenda",
  "Xitsonga"
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<SettingsFormData>({
    full_name: "",
    email: "",
    phone_number: "",
    bio: "",
    specialties: [],
    languages: [],
    education: [defaultEducation],
    experience: [defaultExperience],
    credentials: "",
    specialty: "",
    location: "",
    gender: "",
    therapyTypes: [],
    services: [],
    awards: [defaultAward],
    availability_status: "Available",
    consultation_fee: 0,
    isFree: true,
    avatar_url: "",
    avatar: null,
    gallery_images: [],
    formErrors: {},
    selectedPhoneCode: "+1"
  });
  
  const [isLoading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<any>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasFormChanges, setHasFormChanges] = useState(false);

  // Load saved form data from localStorage on mount
  useEffect(() => {
    const savedForm = localStorage.getItem('ambassador_form_data');
    if (savedForm) {
      try {
        const parsedForm = JSON.parse(savedForm);
        // Convert therapyTypes from stored format back to component format
        if (parsedForm.therapyTypes && Array.isArray(parsedForm.therapyTypes)) {
          parsedForm.therapyTypes = parsedForm.therapyTypes.map((type: any) => {
            const matchedType = therapyTypeOptions.find(option => 
              option.name === type.name || 
              (type.iconName && option.icon.name === type.iconName)
            );
            return matchedType || type;
          });
        }
        
        // Don't overwrite form data if we've already fetched from server
        if (!formSubmitted && hasFormChanges === false) {
          console.log("Loading saved form data from localStorage");
          setFormData(prevData => ({
            ...prevData,
            ...parsedForm,
            // These fields shouldn't be loaded from localStorage
            avatar: null, // Can't store File objects in localStorage
          }));
        }
      } catch (e) {
        console.error("Error parsing saved form data:", e);
      }
    }
    
    // Also load saved step
    const savedStep = localStorage.getItem('ambassador_form_step');
    if (savedStep) {
      const step = parseInt(savedStep, 10);
      if (!isNaN(step) && step >= 0 && step <= STEPS.MEDIA_UPLOAD) {
        console.log("Restoring saved step:", step);
        setCurrentStep(step);
      }
    }
  }, []);

  // Track form changes and save to localStorage
  useEffect(() => {
    // Skip the initial render
    if (formSubmitted) {
      setHasFormChanges(false);
      // Clear saved form data when successfully submitted
      localStorage.removeItem('ambassador_form_data');
    } else {
      // Save form data to localStorage (exclude File objects)
      try {
        const formDataForStorage = {
          ...formData,
          avatar: null, // Don't store File objects
          therapyTypes: formData.therapyTypes.map(type => ({
            name: type.name,
            iconName: type.icon.displayName || type.icon.name
          }))
        };
        localStorage.setItem('ambassador_form_data', JSON.stringify(formDataForStorage));
        setHasFormChanges(true);
      } catch (e) {
        console.error("Error saving form data to localStorage:", e);
      }
    }
  }, [formData, formSubmitted]);

  useEffect(() => {
    if (user) {
      // First initialize basic user data from auth metadata
      // This ensures fields are pre-filled even before database fetch completes
      initializeFormFromUserMetadata();
      
      // Then fetch complete profile from database
    fetchUserProfile();
    }
  }, [user]);

  // Recalculate completion percentage whenever form data changes
  useEffect(() => {
    const percentage = calculateProfileCompletion();
    setCompletionPercentage(percentage);
    
    // Update localStorage with latest completion percentage
    const savedForm = localStorage.getItem('ambassador_form_data');
    if (savedForm) {
      try {
        const parsedForm = JSON.parse(savedForm);
        parsedForm.completionPercentage = percentage;
        localStorage.setItem('ambassador_form_data', JSON.stringify(parsedForm));
      } catch (e) {
        console.error("Error updating completion percentage in localStorage:", e);
      }
    }
  }, [formData]);

  // Track form changes
  useEffect(() => {
    // Skip the initial render
    if (formSubmitted) {
      setHasFormChanges(false);
    } else {
      setHasFormChanges(true);
    }
  }, [formData, formSubmitted]);

  // Add window beforeunload event listener to warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasFormChanges) {
        // Standard way of showing a confirmation dialog before leaving the page
        const message = "You have unsaved changes. Are you sure you want to leave?";
        e.preventDefault();
        e.returnValue = message; // For older browsers
        return message; // For modern browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasFormChanges]);

  // New function to initialize form data from user metadata
  const initializeFormFromUserMetadata = () => {
    if (!user) return;

    // Extract metadata fields
    const metadata = user.user_metadata || {};
    const firstName = metadata.first_name || metadata.firstName || '';
    const lastName = metadata.last_name || metadata.lastName || '';
    
    // Create full name from parts if available
    const fullName = metadata.full_name || 
                    (firstName || lastName ? `${firstName} ${lastName}`.trim() : '');
    
    // Get country from metadata
    const country = metadata.country || '';
    
    // Find phone code for country if it exists
    let phoneCode = "+1"; // Default
    if (country) {
      const countryData = countryOptions.find(c => c.name === country);
      if (countryData) {
        phoneCode = countryData.phoneCode;
        setFormData(prev => ({ ...prev, selectedPhoneCode: phoneCode }));
      }
    }
    
    // Format phone number if needed
    let phoneNumber = metadata.phone_number || '';
    if (phoneNumber && !phoneNumber.startsWith('+')) {
      // If phone doesn't have international format, add the country code
      phoneNumber = `${phoneCode} ${phoneNumber.replace(/^\+?[0-9]+\s*/, '')}`;
    }
    
    // Set initial data from user metadata
    setFormData(prev => ({
      ...prev,
      full_name: fullName || prev.full_name || '',
      email: user.email || prev.email || '',
      location: country || prev.location || '',
      gender: metadata.gender || prev.gender || '',
      phone_number: phoneNumber || prev.phone_number || '',
    }));
    
    console.log("Initialized form with user metadata", metadata);
  };

  // Function to handle country change and update phone code
  const handleCountryChange = (countryName: string) => {
    // Find the country data
    const country = countryOptions.find(c => c.name === countryName);
    if (!country) return;
    
    // Update form location
    setFormData(prev => ({
      ...prev,
      location: countryName
    }));
    
    // Update selected phone code
    setFormData(prev => ({ ...prev, selectedPhoneCode: country.phoneCode }));
    
    // Update phone number to use new country code if it already has a value
    if (formData.phone_number) {
      // Extract the part after any existing country code
      const phoneWithoutCode = formData.phone_number.replace(/^\+[0-9]+\s*/, '');
      setFormData(prev => ({
        ...prev,
        phone_number: `${country.phoneCode} ${phoneWithoutCode}`
      }));
    }
  };

  // Format the phone number when user inputs it
  const handlePhoneNumberChange = (value: string) => {
    // Remove any existing codes and formatting
    let cleanedNumber = value.replace(/[^0-9]/g, '');
    
    // Format the number with the selected code
    let formattedNumber = cleanedNumber ? `${formData.selectedPhoneCode} ${cleanedNumber}` : '';
    
    setFormData(prev => ({
      ...prev,
      phone_number: formattedNumber
    }));
  };

  const calculateProfileCompletion = () => {
    let completedSections = 0;
    let totalSections = 5; // Updated total number of sections
    
    // Personal info section - check all fields separately for better accuracy
    let personalScore = 0;
    if (formData.full_name && formData.full_name.trim().length > 0) personalScore++;
    if (formData.email && formData.email.trim().length > 0) personalScore++;
    if (formData.phone_number && formData.phone_number.trim().length > 0) personalScore++;
    if (formData.location && formData.location.trim().length > 0) personalScore++;
    if (formData.gender && formData.gender.trim().length > 0) personalScore++;
    if (personalScore >= 4) completedSections++; // 4 out of 5 is enough
    
    // Bio & Specialties
    let bioScore = 0;
    if (formData.bio && formData.bio.length >= 50) bioScore++;
    if (formData.specialties && formData.specialties.length > 0) bioScore++;
    if (formData.languages && formData.languages.length > 0) bioScore++;
    if (bioScore >= 2) completedSections++; // 2 out of 3 is enough
    
    // Education
    const hasValidEducation = formData.education && formData.education.some(
      edu => edu.university && edu.university.trim().length > 0 && 
            edu.degree && edu.degree.trim().length > 0 && 
            edu.period && edu.period.trim().length > 0
    );
    if (hasValidEducation) completedSections++;
    
    // Experience
    const hasValidExperience = formData.experience && formData.experience.some(
      exp => exp.company && exp.position && exp.period
    );
    if (hasValidExperience) completedSections++;
    
    // Therapy Types
    if (formData.therapyTypes && formData.therapyTypes.length > 0) completedSections++;
    
    // Specialty
    if (formData.specialty && formData.specialty.trim().length > 0) completedSections++;
    
    // Availability & Pricing
    if (formData.availability_status && 
        (formData.isFree === true || (typeof formData.consultation_fee === 'number' && formData.consultation_fee > 0))) {
      completedSections++;
    }
    
    // Media (avatar is more important)
    if (formData.avatar_url && formData.avatar_url.trim().length > 0) completedSections++;
    
    // Calculate percentage and ensure it's stable
    const percentage = Math.round((completedSections / totalSections) * 100);
    
    // Only update profile complete status, but don't change the percentage erratically
    if (percentage >= 80) {
      setProfileComplete(true);
    } else {
      setProfileComplete(false);
    }
    
    // Return a stable value based on completed sections
    return Math.min(percentage, 100); // Cap at 100%
  };

  const fetchUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      console.log("Fetching user profile data...");
      
      // First try to get profiles with proper error handling
      let ambassadorProfile = null;
      let generalProfile = null;
      
      try {
        // Try to fetch ambassador profile with ALL fields
        const { data: ambData, error: ambError } = await moodMentorService.getMentorProfile(user.id);
      
        if (ambError) {
          console.warn("Could not fetch ambassador profile:", ambError);
          // Don't throw, just continue with null profile
        } else {
          ambassadorProfile = ambData;
          console.log("Successfully fetched ambassador profile");
          setProfileExists(true);
        }
      } catch (ambFetchError) {
        console.error("Exception fetching ambassador profile:", ambFetchError);
        // Continue with null profile
      }
      
      try {
        // Try to fetch general profile
        const generalProfileData = await profileService.getProfileByUserId(user.id, 'moodMentor');
        
        if (!generalProfileData) {
          console.warn("Could not fetch general profile");
          // Don't throw, just continue with null profile
        } else {
          generalProfile = generalProfileData;
          console.log("Successfully fetched general profile");
        }
      } catch (genFetchError) {
        console.error("Exception fetching general profile:", genFetchError);
        // Continue with null profile
      }
      
      // If both profiles are null, create basic profile from user metadata
      if (!ambassadorProfile && !generalProfile) {
        console.log("No profiles found, using user metadata only");
        setProfileExists(false);
        // Continue with just metadata
      }
      
      // Merge the profiles with ambassador profile taking precedence
      const mergedProfile = {
        ...(generalProfile || {}),
        ...(ambassadorProfile || {})
      };
      
      // Check if we have values in meta_data that should be used instead
      // This ensures we get data even if there were schema cache issues
      if (mergedProfile.meta_data) {
        // For each property in meta_data, use it if the direct column is empty
        Object.entries(mergedProfile.meta_data).forEach(([key, value]) => {
          if (mergedProfile[key] === undefined || mergedProfile[key] === null || mergedProfile[key] === '') {
            console.log(`Using ${key} from meta_data:`, value);
            mergedProfile[key] = value;
          }
        });
      }
      
      // Handle the isFree field with fallback to meta_data if needed
      let isFreeValue = true; // Default
      if (mergedProfile.isFree !== undefined && mergedProfile.isFree !== null) {
        // Direct column exists
        isFreeValue = mergedProfile.isFree;
      } else if (mergedProfile.meta_data && mergedProfile.meta_data.isFree !== undefined) {
        // Fallback to meta_data
        isFreeValue = mergedProfile.meta_data.isFree;
      }
      
      // Get metadata values for fallbacks
      const metadata = user.metadata || {};
      
      // Process arrays and objects properly
      let therapyTypes = [];
      if (mergedProfile.therapyTypes) {
        try {
          therapyTypes = mergedProfile.therapyTypes.map(type => {
            // Find the matching therapy type from our options
            const matchedType = therapyTypeOptions.find(option => 
              option.name === type.name || 
              (type.iconName && option.icon.name === type.iconName)
            );
            return matchedType || type;
          });
        } catch (typeError) {
          console.warn("Error processing therapy types:", typeError);
          // Continue with empty array
        }
      }
      
      // Safely parse arrays with fallbacks
      const safeParseArray = (data: any, defaultValue: any[]) => {
        if (!data) return defaultValue;
        if (Array.isArray(data)) return data;
        if (typeof data === 'string') {
          try {
            return data.split(',');
          } catch (e) {
            return defaultValue;
          }
        }
        return defaultValue;
      };
        
      // Ensure education is an array and has at least a default item
      const education = safeParseArray(mergedProfile.education, []);
      if (education.length === 0) {
        education.push(defaultEducation);
      }
        
      // Ensure experience is an array and has at least a default item
      const experience = safeParseArray(mergedProfile.experience, []);
      if (experience.length === 0) {
        experience.push(defaultExperience);
      }
        
      // Ensure awards is an array and has at least a default item
      const awards = safeParseArray(mergedProfile.awards, []);
      if (awards.length === 0) {
        awards.push(defaultAward);
      }
          
      // Ensure specialties is an array  
      const specialties = safeParseArray(mergedProfile.specialties, []);
          
      // Ensure languages is an array
      const languages = safeParseArray(mergedProfile.languages, []);
      
      // Create the form data with all the processed values and complete fallbacks
      const completeFormData = {
        full_name: mergedProfile.full_name || metadata.full_name || "",
        email: mergedProfile.email || user.email || "",
        phone_number: mergedProfile.phone_number || metadata.phone_number || "",
        bio: mergedProfile.bio || metadata.bio || "",
        specialties: specialties,
        languages: languages,
        education: education,
        experience: experience,
        credentials: mergedProfile.credentials || metadata.credentials || "",
        specialty: mergedProfile.specialty || mergedProfile.speciality || "",
        location: mergedProfile.location || metadata.country || "",
        gender: mergedProfile.gender || metadata.gender || "",
        therapyTypes: therapyTypes,
        services: mergedProfile.services || [],
        awards: awards,
        availability_status: mergedProfile.availability_status || "Available",
        consultation_fee: typeof mergedProfile.consultation_fee === 'number' ? 
                          mergedProfile.consultation_fee : 0,
        isFree: isFreeValue,
        avatar_url: mergedProfile.avatar_url || metadata.avatar_url || "",
        avatar: null,
        gallery_images: Array.isArray(mergedProfile.gallery_images) ? 
                        mergedProfile.gallery_images : []
      };
      
      // Log the complete form data for debugging
      console.log("Setting form data:", completeFormData);
      
      // Update form data with processed values
      setFormData(completeFormData);
        
      // Calculate profile completion after data is loaded - wait for form update
      setTimeout(() => {
        const newCompletionPercentage = calculateProfileCompletion();
        console.log("Calculated completion percentage:", newCompletionPercentage);
        setCompletionPercentage(newCompletionPercentage);
        setProfileComplete(newCompletionPercentage >= 80);
      }, 100);
      
      // Set welcome dialog for new users
      if (!mergedProfile.avatar_url && !formSubmitted) {
        setShowWelcomeDialog(true);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      // Don't show the error to the user, just log it and continue
      // The form will still be usable with local data
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      avatar: file
    }));
    
    // Preview the file
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({
        ...prev,
        avatar_url: event.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Check file sizes
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('One or more images are larger than 5MB');
      return;
    }
    
    // Preview and add images
    const newGalleryImages = [...formData.gallery_images];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newGalleryImages.push(event.target?.result as string);
        setFormData(prev => ({
          ...prev,
          gallery_images: newGalleryImages
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index)
    }));
  };

  const handleSpecialtyAdd = (value: string) => {
    if (!value || formData.specialties.includes(value)) return;
    
    setFormData(prev => ({
      ...prev,
      specialties: [...prev.specialties, value]
    }));
  };

  const handleRemoveSpecialty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index)
    }));
  };

  const handleTherapyTypeToggle = (type: TherapyType) => {
    const isSelected = formData.therapyTypes.some(t => t.name === type.name);
    
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        therapyTypes: prev.therapyTypes.filter(t => t.name !== type.name)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        therapyTypes: [...prev.therapyTypes, type]
      }));
    }
  };

  const handleLanguageAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    
    const input = e.currentTarget;
    const value = input.value.trim();
    
    if (!value || formData.languages.includes(value)) {
      input.value = '';
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      languages: [...prev.languages, value]
    }));
    
    input.value = '';
  };

  const handleRemoveLanguage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const handleEducationChange = (index: number, field: keyof typeof defaultEducation, value: string) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const handleAddEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { ...defaultEducation }]
    }));
  };

  const handleRemoveEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleExperienceChange = (index: number, field: keyof typeof defaultExperience, value: string) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const handleAddExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { ...defaultExperience }]
    }));
  };

  const handleRemoveExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const handleAwardChange = (index: number, field: keyof typeof defaultAward, value: string) => {
    setFormData(prev => ({
      ...prev,
      awards: prev.awards.map((award, i) =>
        i === index ? { ...award, [field]: value } : award
      )
    }));
  };

  const handleAddAward = () => {
    setFormData(prev => ({
      ...prev,
      awards: [...prev.awards, { ...defaultAward }]
    }));
  };

  const handleRemoveAward = (index: number) => {
    setFormData(prev => ({
      ...prev,
      awards: prev.awards.filter((_, i) => i !== index)
    }));
  };

  // Navigation functions for the wizard
  const nextStep = () => {
    if (validateCurrentStep()) {
      const nextStepValue = currentStep + 1 <= STEPS.MEDIA_UPLOAD ? currentStep + 1 : currentStep;
      setCurrentStep(nextStepValue);
      
      // Save current step to localStorage
      localStorage.setItem('ambassador_form_step', nextStepValue.toString());
      
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    const prevStepValue = currentStep - 1 >= 0 ? currentStep - 1 : currentStep;
    setCurrentStep(prevStepValue);
    
    // Save current step to localStorage
    localStorage.setItem('ambassador_form_step', prevStepValue.toString());
    
    window.scrollTo(0, 0);
  };

  // Form validation by step
  const validateCurrentStep = () => {
    const errors: Record<string, string> = {};
    
    switch (currentStep) {
      case STEPS.BASIC_INFO:
        if (!formData.full_name) errors.full_name = "Name is required";
        if (!formData.email) errors.email = "Email is required";
        if (!formData.phone_number) errors.phone_number = "Phone number is required";
        if (!formData.location) errors.location = "Location is required";
        if (!formData.gender) errors.gender = "Gender is required";
        break;
        
      case STEPS.EDUCATION_EXPERIENCE:
        const hasValidEducation = formData.education.some(
          edu => edu.university && edu.degree && edu.period
        );
        if (!hasValidEducation) errors.education = "Add at least one complete education entry";
        
        const hasValidExperience = formData.experience.some(
          exp => exp.company && exp.position && exp.period
        );
        if (!hasValidExperience) errors.experience = "Add at least one complete experience entry";
        break;
        
      case STEPS.THERAPY_SERVICES:
        if (formData.therapyTypes.length === 0) errors.therapyTypes = "Select at least one therapy type";
        if (!formData.specialty) errors.specialty = "Primary specialty is required";
        break;
        
      case STEPS.AVAILABILITY_PRICING:
        if (!formData.availability_status) errors.availability_status = "Availability status is required";
        if (!formData.isFree && (formData.consultation_fee <= 0 || isNaN(formData.consultation_fee))) {
          errors.consultation_fee = "Enter a valid consultation fee";
        }
        break;
        
      case STEPS.MEDIA_UPLOAD:
        if (!formData.avatar_url) errors.avatar_url = "Profile picture is required";
        break;
    }
    
    setFormData(prev => ({ ...prev, formErrors: errors }));
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setLoading(true);
    setSaveError(null);

    try {
      if (!user?.id) throw new Error("User not authenticated");

      console.log("Starting ambassador profile update for user:", user.id);

      // Prepare therapy types for storage (only store name and icon name)
      const therapyTypesForStorage = formData.therapyTypes.map(type => ({
        name: type.name,
        iconName: type.icon.displayName || type.icon.name
      }));

      // Upload avatar if changed
      let avatarUrl = formData.avatar_url;
      if (formData.avatar) {
        console.log("Uploading new avatar...");
        const avatarFile = formData.avatar;
        const formData = new FormData();
        formData.append('file', avatarFile);

        try {
          const response = await api.post('/api/upload/avatar', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            }
          });

          const data = await response.json();
          if (data.url) {
            avatarUrl = data.url;
            console.log("Avatar uploaded successfully:", avatarUrl);
          } else {
            console.warn("Got invalid response for avatar upload");
          }
        } catch (avatarError) {
          console.error("Complete avatar upload failure:", avatarError);
          // Continue with existing avatar URL if available
        }
      }

      // Upload new gallery images
      const galleryImages = await Promise.all(
        formData.gallery_images.map(async (image, index) => {
          if (image.startsWith('data:')) {
            // This is a new image that needs to be uploaded
            try {
              const base64Data = image.split(',')[1];
              const blob = new Blob([decodeBase64(base64Data)], { type: 'image/jpeg' });
              const imageFile = new File([blob], `gallery-${index}.jpg`, { type: 'image/jpeg' });
              const formData = new FormData();
              formData.append('file', imageFile);
              
              console.log(`Uploading gallery image ${index+1}/${formData.gallery_images.length}...`);
              
              try {
                const response = await api.post('/api/upload/gallery', formData, {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  }
                });

                const data = await response.json();
                if (data.url) {
                  return data.url;
                } else {
                  console.warn(`Got invalid response for gallery image ${index}`);
                  return image; // Keep the data URL as fallback
                }
              } catch (uploadException) {
                console.error(`Exception during gallery image ${index} upload:`, uploadException);
                return image; // Keep the data URL as fallback
              }
            } catch (imageProcessError) {
              console.error(`Error processing gallery image ${index}:`, imageProcessError);
              return image; // Keep the data URL as fallback
            }
          }
          return image; // Return unchanged if it's not a data URL
        })
      );

      // Prepare the profile data updates
      const baseUpdates = {
        id: user.id,
        full_name: formData.full_name,
        email: formData.email,
        phone_number: formData.phone_number,
        bio: formData.bio,
        specialty: formData.specialty,
        speciality: formData.specialty, // Handle both spellings for compatibility
        location: formData.location,
        gender: formData.gender,
        availability_status: formData.availability_status,
        consultation_fee: formData.consultation_fee,
        isFree: formData.isFree,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
        role: 'moodMentor',
        profile_completion: completionPercentage
      };
      
      // Add the array and JSON fields
      const complexUpdates = {
        specialties: formData.specialties,
        languages: formData.languages,
        education: formData.education,
        experience: formData.experience,
        credentials: formData.credentials,
        therapyTypes: therapyTypesForStorage,
        services: formData.services,
        awards: formData.awards,
        gallery_images: galleryImages,
      };
      
      // Combine all updates
      const updates = { ...baseUpdates, ...complexUpdates };
      
      // Update the profile using our service
      const { success, error } = await moodMentorService.updateMentorProfile(user.id, updates);
      
      if (success) {
        console.log("Profile updated successfully!");
        toast.success("Profile updated successfully!");
        setFormSubmitted(true);
        
        // Refresh the profile data
        await fetchUserProfile();
      } else {
        console.error("Error updating profile:", error);
        toast.error("Failed to update profile. Please try again.");
        setSaveError(error);
      }
    } catch (error) {
      console.error("Error during profile update:", error);
      toast.error("An error occurred while updating your profile");
      setSaveError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Dialog for New Ambassadors */}
        {showWelcomeDialog && !formSubmitted && (
          <Alert className="mb-8 bg-blue-50 border-blue-200">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            <AlertDescription className="text-blue-700">
              <h3 className="text-lg font-semibold mb-2">Welcome to Your Ambassador Dashboard!</h3>
              <p className="mb-2">Complete your profile to become visible to patients seeking mental health support.</p>
              <p>Use the step-by-step form below to build a comprehensive profile that will help connect you with those in need.</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Header with Progress */}
        <div className="flex flex-col mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-500 mt-1">
                {profileComplete 
                  ? "Your profile is complete and visible to patients" 
                  : "Complete your profile to be visible to patients"}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 md:w-32">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Profile Completion</span>
                  <span className="font-medium">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
              
              {currentStep === STEPS.MEDIA_UPLOAD ? (
                <Button 
                  onClick={handleSubmit} 
                  className="bg-[#20C0F3] hover:bg-[#20C0F3]/90 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Profile"}
                </Button>
              ) : (
                <Button 
                  onClick={nextStep} 
                  className="bg-[#20C0F3] hover:bg-[#20C0F3]/90 text-white"
                >
                  Next Step
                </Button>
              )}
            </div>
          </div>

          {/* Show save error if any */}
          {saveError && (
            <Alert className="mt-4 bg-red-50 border-red-200">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <AlertDescription className="text-red-700">
                <div className="flex flex-col">
                  <span className="font-medium">Your profile could not be saved</span>
                  <span className="text-sm mt-1">Error: {saveError}</span>
                  <span className="text-sm mt-2">
                    Try again or check the developer console for more details. Your changes have not been lost
                    and will remain until you refresh the page.
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Warning about unsaved changes if user has made changes */}
          {hasFormChanges && formSubmitted === false && (
            <Alert className="mt-4 bg-amber-50 border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <AlertDescription className="text-amber-700">
                You have unsaved changes. Be sure to click "Save Profile" when you're done to avoid losing your work.
              </AlertDescription>
            </Alert>
          )}

          {/* Step Progress Indicators */}
          <div className="hidden md:flex justify-between items-center w-full mt-4 mb-2">
            {stepInfo.map((step, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full 
                    ${index <= currentStep 
                      ? 'bg-[#20C0F3] text-white' 
                      : 'bg-gray-100 text-gray-400'}
                    ${index < currentStep ? 'ring-2 ring-[#20C0F3]/20' : ''}
                  `}
                  onClick={() => index < currentStep && setCurrentStep(index)}
                  style={{ cursor: index < currentStep ? 'pointer' : 'default' }}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                
                {index < stepInfo.length - 1 && (
                  <div 
                    className={`w-full h-1 mx-2 ${
                      index < currentStep ? 'bg-[#20C0F3]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Mobile Step Indicator */}
          <div className="md:hidden mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Step {currentStep + 1} of {stepInfo.length}</span>
              <span className="font-medium">{stepInfo[currentStep].title}</span>
            </div>
            <Progress value={(currentStep / (stepInfo.length - 1)) * 100} className="h-2" />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-md border-none overflow-hidden">
              <CardHeader className="border-b bg-gray-50/80">
                <div className="flex items-center gap-3">
                  <div className="bg-[#20C0F3]/10 p-2 rounded-full">
                    {React.createElement(stepInfo[currentStep].icon, { className: "h-5 w-5 text-[#20C0F3]" })}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{stepInfo[currentStep].title}</CardTitle>
                    <CardDescription>{stepInfo[currentStep].description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Step 1: Basic Information */}
                {currentStep === STEPS.BASIC_INFO && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-gray-700">Full Name</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          placeholder="Dr. John Doe"
                          className={`border-gray-200 focus-visible:ring-[#20C0F3] ${
                            formData.formErrors.full_name ? 'border-red-300' : ''
                          }`}
                        />
                        {formData.formErrors.full_name && (
                          <p className="text-sm text-red-500">{formData.formErrors.full_name}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="ambassador@example.com"
                          className={`border-gray-200 focus-visible:ring-[#20C0F3] ${
                            formData.formErrors.email ? 'border-red-300' : ''
                          }`}
                          disabled
                        />
                        {formData.formErrors.email && (
                          <p className="text-sm text-red-500">{formData.formErrors.email}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-gray-700">Country</Label>
                        <Select
                          value={formData.location}
                          onValueChange={handleCountryChange}
                        >
                          <SelectTrigger id="country" className={`border-gray-200 focus-visible:ring-[#20C0F3] ${
                            formData.formErrors.location ? 'border-red-300' : ''
                          }`}>
                            <SelectValue placeholder="Select your country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {countryOptions.map(country => (
                              <SelectItem key={country.code} value={country.name}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.formErrors.location && (
                          <p className="text-sm text-red-500">{formData.formErrors.location}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone_number" className="text-gray-700">Phone Number</Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                            {formData.selectedPhoneCode}
                          </div>
                        <Input
                          id="phone_number"
                            value={formData.phone_number.replace(/^\+[0-9]+\s*/, '')}
                            onChange={(e) => handlePhoneNumberChange(e.target.value)}
                            placeholder="Phone number"
                            className={`pl-16 border-gray-200 focus-visible:ring-[#20C0F3] ${
                            formData.formErrors.phone_number ? 'border-red-300' : ''
                          }`}
                        />
                        </div>
                        {formData.formErrors.phone_number && (
                          <p className="text-sm text-red-500">{formData.formErrors.phone_number}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-gray-700">Gender</Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(value) => setFormData({ ...formData, gender: value })}
                        >
                          <SelectTrigger id="gender" className={`border-gray-200 focus-visible:ring-[#20C0F3] ${
                            formData.formErrors.gender ? 'border-red-300' : ''
                          }`}>
                            <SelectValue placeholder="Select your gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {genderOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.formErrors.gender && (
                          <p className="text-sm text-red-500">{formData.formErrors.gender}</p>
                        )}
                      </div>
                    </div>
                    
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertCircle className="h-5 w-5 text-blue-500" />
                      <AlertDescription className="text-blue-700">
                        This information will be visible to patients looking for mental health ambassadors.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                
                {/* Step 2: Education & Experience */}
                {currentStep === STEPS.EDUCATION_EXPERIENCE && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-[#20C0F3]" />
                          <Label className="text-lg font-medium text-gray-700">Education</Label>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddEducation}
                          className="flex items-center text-blue-600 border-blue-200"
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Add Education
                        </Button>
                      </div>
                      
                      {formData.formErrors.education && (
                        <p className="text-sm text-red-500 mt-1">{formData.formErrors.education}</p>
                      )}
                      
                      <div className="space-y-4">
                        {formData.education.map((edu, index) => (
                          <div 
                            key={index} 
                            className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative"
                          >
                            <button
                              type="button"
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                              onClick={() => handleRemoveEducation(index)}
                            >
                              <X className="h-4 w-4" />
                            </button>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-gray-700">University/Institution</Label>
                                <Input
                                  value={edu.university}
                                  onChange={(e) => handleEducationChange(index, 'university', e.target.value)}
                                  placeholder="University of Nairobi"
                                  className="border-gray-200 focus-visible:ring-[#20C0F3]"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-gray-700">Degree/Certificate</Label>
                                <Input
                                  value={edu.degree}
                                  onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                                  placeholder="Bachelor of Psychology"
                                  className="border-gray-200 focus-visible:ring-[#20C0F3]"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-gray-700">Period</Label>
                                <Input
                                  value={edu.period}
                                  onChange={(e) => handleEducationChange(index, 'period', e.target.value)}
                                  placeholder="2015 - 2019"
                                  className="border-gray-200 focus-visible:ring-[#20C0F3]"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-[#20C0F3]" />
                          <Label className="text-lg font-medium text-gray-700">Experience</Label>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddExperience}
                          className="flex items-center text-blue-600 border-blue-200"
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Add Experience
                        </Button>
                      </div>
                      
                      {formData.formErrors.experience && (
                        <p className="text-sm text-red-500 mt-1">{formData.formErrors.experience}</p>
                      )}
                      
                      <div className="space-y-4">
                        {formData.experience.map((exp, index) => (
                          <div 
                            key={index} 
                            className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative"
                          >
                            <button
                              type="button"
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                              onClick={() => handleRemoveExperience(index)}
                            >
                              <X className="h-4 w-4" />
                            </button>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-gray-700">Company/Organization</Label>
                                <Input
                                  value={exp.company}
                                  onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                                  placeholder="Mental Health Clinic"
                                  className="border-gray-200 focus-visible:ring-[#20C0F3]"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-gray-700">Position</Label>
                                <Input
                                  value={exp.position}
                                  onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                                  placeholder="Mental Health Counselor"
                                  className="border-gray-200 focus-visible:ring-[#20C0F3]"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-gray-700">Period</Label>
                                <Input
                                  value={exp.period}
                                  onChange={(e) => handleExperienceChange(index, 'period', e.target.value)}
                                  placeholder="2019 - Present"
                                  className="border-gray-200 focus-visible:ring-[#20C0F3]"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-gray-700">Duration</Label>
                                <Input
                                  value={exp.duration}
                                  onChange={(e) => handleExperienceChange(index, 'duration', e.target.value)}
                                  placeholder="3 years"
                                  className="border-gray-200 focus-visible:ring-[#20C0F3]"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="credentials" className="text-gray-700">Professional Credentials</Label>
                      <Input
                        id="credentials"
                        value={formData.credentials}
                        onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                        placeholder="Licensed Clinical Psychologist, Certified Trauma Specialist, etc."
                        className="border-gray-200 focus-visible:ring-[#20C0F3]"
                      />
                      <p className="text-sm text-gray-500">
                        List any professional credentials or certifications you hold (optional)
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Step 3: Therapy & Services */}
                {currentStep === STEPS.THERAPY_SERVICES && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="specialty" className="text-gray-700">Primary Specialty</Label>
                      <Select
                        value={formData.specialty}
                        onValueChange={(value) => setFormData({ ...formData, specialty: value })}
                      >
                        <SelectTrigger id="specialty" className={`border-gray-200 focus-visible:ring-[#20C0F3] ${
                          formData.formErrors.specialty ? 'border-red-300' : ''
                        }`}>
                          <SelectValue placeholder="Select your primary specialty" />
                        </SelectTrigger>
                        <SelectContent>
                          {specialtyOptions.map(specialty => (
                            <SelectItem key={specialty} value={specialty}>
                              {specialty}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.formErrors.specialty && (
                        <p className="text-sm text-red-500">{formData.formErrors.specialty}</p>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <Label className="text-gray-700">Therapy Types</Label>
                      
                      {formData.formErrors.therapyTypes && (
                        <p className="text-sm text-red-500">{formData.formErrors.therapyTypes}</p>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {therapyTypeOptions.map((type) => {
                          const isSelected = formData.therapyTypes.some(t => t.name === type.name);
                          return (
                            <div
                              key={type.name}
                              className={`p-3 rounded-lg border cursor-pointer transition-all
                                ${isSelected
                                  ? 'border-[#20C0F3] bg-[#20C0F3]/5 shadow-sm'
                                  : 'border-gray-200 bg-white hover:border-[#20C0F3]/30 hover:bg-[#20C0F3]/5'
                                }
                              `}
                              onClick={() => handleTherapyTypeToggle(type)}
                            >
                              <div className="flex items-center">
                                <div 
                                  className={`w-8 h-8 mr-3 rounded-full flex items-center justify-center flex-shrink-0
                                    ${isSelected 
                                      ? 'bg-[#20C0F3]/20 text-[#20C0F3]' 
                                      : 'bg-gray-100 text-gray-500'
                                    }
                                  `}
                                >
                                  <type.icon className="h-4 w-4" />
                                </div>
                                <p className={`text-sm font-medium ${isSelected ? 'text-[#20C0F3]' : 'text-gray-700'}`}>
                                  {type.name}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-gray-700">Services Offered</Label>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {["Individual Counseling", "Group Therapy", "Crisis Intervention", "Mental Health Assessment", "Family Therapy", "Couples Counseling", "Grief Counseling", "Trauma Support", "Stress Management", "Addiction Recovery"].map((service) => {
                          const isSelected = formData.services.includes(service);
                          return (
                            <Badge 
                              key={service}
                              className={`px-3 py-1.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-[#20C0F3] text-white hover:bg-[#20C0F3]/90'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                              onClick={() => {
                                if (isSelected) {
                                  setFormData({
                                    ...formData,
                                    services: formData.services.filter(s => s !== service)
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    services: [...formData.services, service]
                                  });
                                }
                              }}
                            >
                              {service}
                            </Badge>
                          );
                        })}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Click to select the services you offer (optional)
                      </p>
                    </div>
                    
                    <div className="space-y-4 mt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-[#20C0F3]" />
                          <Label className="text-lg font-medium text-gray-700">Awards & Recognition</Label>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddAward}
                          className="flex items-center text-blue-600 border-blue-200"
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Add Award
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {formData.awards.map((award, index) => (
                          <div 
                            key={index} 
                            className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative"
                          >
                            <button
                              type="button"
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                              onClick={() => handleRemoveAward(index)}
                            >
                              <X className="h-4 w-4" />
                            </button>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-gray-700">Award Title</Label>
                                <Input
                                  value={award.title}
                                  onChange={(e) => handleAwardChange(index, 'title', e.target.value)}
                                  placeholder="Best Mental Health Practitioner Award"
                                  className="border-gray-200 focus-visible:ring-[#20C0F3]"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-gray-700">Year</Label>
                                <Input
                                  value={award.year}
                                  onChange={(e) => handleAwardChange(index, 'year', e.target.value)}
                                  placeholder="2022"
                                  className="border-gray-200 focus-visible:ring-[#20C0F3]"
                                />
                              </div>
                              
                              <div className="space-y-2 md:col-span-2">
                                <Label className="text-gray-700">Description</Label>
                                <Input
                                  value={award.description}
                                  onChange={(e) => handleAwardChange(index, 'description', e.target.value)}
                                  placeholder="Brief description of the award and its significance"
                                  className="border-gray-200 focus-visible:ring-[#20C0F3]"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 4: Availability & Pricing */}
                {currentStep === STEPS.AVAILABILITY_PRICING && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="availability_status" className="text-gray-700">Availability Status</Label>
                      <Select
                        value={formData.availability_status}
                        onValueChange={(value) => setFormData({ ...formData, availability_status: value })}
                      >
                        <SelectTrigger id="availability_status" className={`border-gray-200 focus-visible:ring-[#20C0F3] ${
                          formData.formErrors.availability_status ? 'border-red-300' : ''
                        }`}>
                          <SelectValue placeholder="Set your availability status" />
                        </SelectTrigger>
                        <SelectContent>
                          {availabilityOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.formErrors.availability_status && (
                        <p className="text-sm text-red-500">{formData.formErrors.availability_status}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        This will be shown to patients looking to book appointments with you
                      </p>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="isFree" className="text-gray-700 font-medium cursor-pointer">
                            Provide Free Consultations
                          </Label>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Recommended
                          </Badge>
                        </div>
                        <Switch
                          id="isFree"
                          checked={formData.isFree}
                          onCheckedChange={(checked) => setFormData({ ...formData, isFree: checked })}
                        />
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        As a mental health ambassador, we encourage providing free consultations to help those in need.
                      </p>
                      
                      {!formData.isFree && (
                        <div className="pt-4 space-y-2">
                          <Label htmlFor="consultation_fee" className="text-gray-700">
                            Consultation Fee (USD)
                          </Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              id="consultation_fee"
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.consultation_fee}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                consultation_fee: parseFloat(e.target.value) || 0 
                              })}
                              className={`pl-10 border-gray-200 focus-visible:ring-[#20C0F3] ${
                                formData.formErrors.consultation_fee ? 'border-red-300' : ''
                              }`}
                            />
                          </div>
                          {formData.formErrors.consultation_fee && (
                            <p className="text-sm text-red-500">{formData.formErrors.consultation_fee}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      <AlertDescription className="text-amber-700">
                        Your availability status affects when patients can book appointments with you. 
                        Keep this updated to ensure accurate booking availability.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                
                {/* Step 5: Profile Media */}
                {currentStep === STEPS.MEDIA_UPLOAD && (
                  <div className="space-y-8">
                    {/* Avatar Upload */}
                    <div className="space-y-4">
                      <Label className="text-gray-700 block">Profile Picture</Label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <Avatar className="h-32 w-32 rounded-full border-4 border-gray-100 shadow-sm">
                          <AvatarImage src={formData.avatar_url} />
                          <AvatarFallback className="bg-[#20C0F3] text-white text-xl">
                            {formData.full_name?.charAt(0) || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-4">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className={`border-gray-200 focus-visible:ring-[#20C0F3] ${
                              formData.formErrors.avatar_url ? 'border-red-300' : ''
                            }`}
                          />
                          {formData.formErrors.avatar_url ? (
                            <p className="text-sm text-red-500">{formData.formErrors.avatar_url}</p>
                          ) : (
                            <p className="text-sm text-gray-500">
                              Upload a professional profile picture. Recommended: Square image, at least 400x400px.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Gallery Images */}
                    <div className="space-y-4">
                      <Label className="text-gray-700 block">Gallery Images</Label>
                      <p className="text-sm text-gray-500">
                        Upload images that showcase your workspace, certifications, or professional atmosphere.
                      </p>
                      
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryImageUpload}
                        className="border-gray-200 focus-visible:ring-[#20C0F3]"
                      />
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                        {formData.gallery_images.map((image, index) => (
                          <div key={index} className="relative group aspect-square rounded-lg overflow-hidden shadow-sm">
                            <img
                              src={image}
                              alt={`Gallery ${index + 1}`}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveGalleryImage(index)}
                                className="bg-white/80 text-red-500 p-1.5 rounded-full"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between border-t p-6 bg-gray-50/50">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous Step
                </Button>
                
                <Button
                  onClick={currentStep === STEPS.MEDIA_UPLOAD ? handleSubmit : nextStep}
                  className="bg-[#20C0F3] hover:bg-[#20C0F3]/90 text-white flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Saving..."
                  ) : currentStep === STEPS.MEDIA_UPLOAD ? (
                    "Save Profile"
                  ) : (
                    <>
                      Next Step
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

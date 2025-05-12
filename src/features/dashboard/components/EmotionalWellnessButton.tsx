import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Heart } from 'lucide-react';

const EmotionalWellnessButton = () => {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate('/patient-dashboard/mood-tracker')}
      className="w-full h-[80px] rounded-xl bg-[#00c3ff] text-white flex items-center justify-between px-4 hover:opacity-95 transition-opacity"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#4361ee] rounded-full flex items-center justify-center drop-shadow-sm">
          <Heart className="h-6 w-6 text-white" fill="white" />
        </div>
        <div className="text-left">
          <div className="font-semibold text-[17px] leading-tight">Emotional</div>
          <div className="font-semibold text-[17px] leading-tight">Wellness</div>
          <div className="text-xs font-light leading-tight">Start Daily</div>
          <div className="text-xs font-light leading-tight">Check-in</div>
        </div>
      </div>
      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center drop-shadow-sm">
        <ChevronRight className="h-5 w-5 text-[#4361ee]" />
      </div>
    </button>
  );
};

export default EmotionalWellnessButton; 
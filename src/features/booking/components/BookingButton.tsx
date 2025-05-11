import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BookingModal } from '@/features/mood-mentors/components/BookingModal';

interface BookingButtonProps {
  mentorId: string;
  mentorName: string;
  buttonText?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export default function BookingButton({
  mentorId,
  mentorName,
  buttonText = 'Book Session',
  className,
  variant = 'default'
}: BookingButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className={className}
        variant={variant}
      >
        {buttonText}
      </Button>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ambassadorId={mentorId}
        ambassadorName={mentorName}
      />
    </>
  );
}

import React from 'react';
import { WifiOff, Wifi, AlertCircle } from 'lucide-react';
import { useConnection } from '@/contexts/ConnectionContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ConnectionStatusIndicatorProps {
  showTooltip?: boolean;
  size?: number;
  className?: string;
}

/**
 * A small icon indicator that shows the current connection status
 * Use this for navbar, status bars, etc.
 */
const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  showTooltip = true,
  size = 16,
  className = ''
}) => {
  const { isConnected, isChecking, isOffline, connectionStatus } = useConnection();

  // If everything is fine, we can show a less prominent indicator
  const getIcon = () => {
    if (isOffline) {
      return <WifiOff className={`text-yellow-500 ${className}`} size={size} />;
    }
    
    if (!isConnected) {
      return <AlertCircle className={`text-red-500 ${className}`} size={size} />;
    }
    
    return <Wifi className={`text-green-500 opacity-50 ${className}`} size={size} />;
  };
  
  const getMessage = () => {
    if (isOffline) {
      return "You are offline";
    }
    
    if (!isConnected) {
      return "Server connection unavailable";
    }
    
    return "Connected to server";
  };
  
  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex">
            {getIcon()}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getMessage()}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return getIcon();
};

export default ConnectionStatusIndicator; 
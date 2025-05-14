import React from 'react';
import { WifiOff, Wifi, AlertCircle, RefreshCcw } from 'lucide-react';
import { useConnection } from '@/contexts/ConnectionContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ConnectionStatusIndicatorProps {
  showTooltip?: boolean;
  size?: number;
  className?: string;
  showReconnect?: boolean;
}

/**
 * A small icon indicator that shows the current connection status
 * Use this for navbar, status bars, etc.
 */
const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  showTooltip = true,
  size = 16,
  className = '',
  showReconnect = true
}) => {
  const { isConnected, isChecking, isOffline, connectionStatus, reconnect, checkConnection } = useConnection();

  // If everything is fine, we can show a less prominent indicator
  const getIcon = () => {
    if (isChecking) {
      return <RefreshCcw className={`text-blue-500 animate-spin ${className}`} size={size} />;
    }
    
    if (isOffline) {
      return <WifiOff className={`text-yellow-500 ${className}`} size={size} />;
    }
    
    if (!isConnected) {
      return <AlertCircle className={`text-red-500 ${className}`} size={size} />;
    }
    
    return <Wifi className={`text-green-500 opacity-50 ${className}`} size={size} />;
  };
  
  const getMessage = () => {
    if (isChecking) {
      return "Checking connection...";
    }
    
    if (isOffline) {
      return "You are offline";
    }
    
    if (!isConnected) {
      return "Server connection unavailable";
    }
    
    return "Connected to server";
  };

  const handleIconClick = (e: React.MouseEvent) => {
    if (showReconnect && (!isConnected || isOffline)) {
      e.stopPropagation();
      e.preventDefault();
      reconnect();
    } else if (showReconnect) {
      e.stopPropagation();
      e.preventDefault();
      checkConnection();
    }
  };
  
  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`inline-flex ${(!isConnected || isOffline) && showReconnect ? 'cursor-pointer' : ''}`}
            onClick={handleIconClick}
          >
            {getIcon()}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getMessage()}</p>
          {(!isConnected || isOffline) && showReconnect && (
            <p className="text-xs text-blue-500 mt-1">Click to reconnect</p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return (
    <div 
      className={(!isConnected || isOffline) && showReconnect ? 'cursor-pointer' : ''}
      onClick={handleIconClick}
    >
      {getIcon()}
    </div>
  );
};

export default ConnectionStatusIndicator; 
import React from 'react';
import { useConnection } from '../context/ConnectionProvider';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  showDetails = false,
  className = ''
}) => {
  const { isConnected, isOffline, isChecking, lastChecked, checkConnection } = useConnection();

  const handleRefresh = () => {
    checkConnection();
  };

  // If everything is fine, don't show anything unless showDetails is true
  if (isConnected && !isOffline && !showDetails) {
    return null;
  }

  return (
    <div className={`p-3 rounded-lg ${className} ${isOffline ? 'bg-yellow-100' : !isConnected ? 'bg-red-100' : 'bg-green-100'}`}>
      <div className="flex items-center">
        {isOffline ? (
          <WifiOff className="h-5 w-5 text-yellow-600 mr-2" />
        ) : !isConnected ? (
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
        )}
        
        <div className="flex-1">
          {isOffline ? (
            <span className="text-sm font-medium text-yellow-800">
              You're offline. Some features may be unavailable.
            </span>
          ) : !isConnected ? (
            <span className="text-sm font-medium text-red-800">
              Connection to server lost. Using cached data.
            </span>
          ) : (
            <span className="text-sm font-medium text-green-800">
              Connected to server
            </span>
          )}
          
          {showDetails && lastChecked && (
            <div className="text-xs text-gray-500 mt-1">
              Last checked: {lastChecked.toLocaleTimeString()}
            </div>
          )}
        </div>
        
        <Button
          onClick={handleRefresh}
          disabled={isChecking}
          size="sm"
          variant={isConnected ? "outline" : "default"}
          className={`ml-2 ${isChecking ? 'opacity-50' : ''}`}
        >
          {isChecking ? 'Checking...' : 'Retry'}
        </Button>
      </div>
    </div>
  );
};

export default ConnectionStatus; 
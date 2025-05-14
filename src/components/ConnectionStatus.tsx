import React from 'react';
import { Button } from "@/components/ui/button";
import { WifiOff, AlertCircle, CheckCircle, RefreshCw, Loader2, ExternalLink } from 'lucide-react';
import { useConnection } from '@/contexts/ConnectionContext';
import { Badge } from "@/components/ui/badge";

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
  showAlways?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  showDetails = false,
  className = '',
  showAlways = false
}) => {
  const { 
    isConnected, 
    isOffline, 
    isChecking, 
    lastChecked, 
    checkConnection, 
    reconnect, 
    connectionStatus 
  } = useConnection();

  const handleCheck = () => {
    checkConnection();
  };
  
  const handleReconnect = () => {
    reconnect();
  };

  // If everything is fine, don't show anything unless showDetails or showAlways is true
  if (isConnected && !isOffline && !showDetails && !showAlways) {
    return null;
  }

  return (
    <div className={`p-3 rounded-lg ${className} ${
      isOffline 
        ? 'bg-yellow-100 border border-yellow-200' 
        : !isConnected 
          ? 'bg-red-100 border border-red-200' 
          : 'bg-green-100 border border-green-200'
    }`}>
      <div className="flex items-center">
        {isChecking ? (
          <Loader2 className="h-5 w-5 text-blue-600 mr-2 animate-spin" />
        ) : isOffline ? (
          <WifiOff className="h-5 w-5 text-yellow-600 mr-2" />
        ) : !isConnected ? (
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
        )}
        
        <div className="flex-1">
          {isChecking ? (
            <span className="text-sm font-medium text-blue-800">
              Checking connection...
            </span>
          ) : isOffline ? (
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
          
          {showDetails && (
            <div className="space-y-1 mt-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant={isOffline ? "outline" : "secondary"} className="text-xs">
                  Network: {isOffline ? "Offline" : "Online"}
                </Badge>
                
                <Badge variant={connectionStatus === 'connected' ? "success" : "destructive"} className="text-xs">
                  API: {connectionStatus === 'connected' ? "Online" : "Offline"}
                </Badge>
                
                <Badge variant={connectionStatus === 'connected' ? "success" : "destructive"} className="text-xs">
                  Database: {connectionStatus === 'connected' ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              
              {lastChecked && (
                <div className="text-xs text-gray-500">
                  Last checked: {lastChecked.toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-2">
          {!isChecking && (
            <Button
              onClick={handleCheck}
              size="sm"
              variant="outline"
              className="text-xs px-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Check
            </Button>
          )}
          
          {(!isConnected || isOffline) && !isChecking && (
            <Button
              onClick={handleReconnect}
              size="sm"
              variant="default"
              className="text-xs px-2"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
              Reconnect
            </Button>
          )}
        </div>
      </div>
      
      {!isConnected && showDetails && (
        <div className="mt-3 text-xs text-gray-600 border-t border-gray-200 pt-2">
          <div className="flex justify-between items-center">
            <span>Troubleshooting:</span>
            <a 
              href="https://supabase.com/status" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 flex items-center"
            >
              Check Status <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
          <ul className="list-disc list-inside mt-1">
            <li>Ensure your internet connection is working</li>
            <li>Try refreshing the page</li>
            <li>Clear browser cache and cookies</li>
            <li>Check if the database service is operational</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus; 
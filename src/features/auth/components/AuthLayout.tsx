import React from "react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export default function AuthLayout({ children, title, subtitle, icon }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50 p-4 pb-24">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 my-8">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex items-center space-x-2 mb-2">
            {icon && <div className="text-primary">{icon}</div>}
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          </div>
          
          {subtitle && (
            <p className="text-gray-600">{subtitle}</p>
          )}
        </div>
        
        {children}
      </div>
    </div>
  );
} 
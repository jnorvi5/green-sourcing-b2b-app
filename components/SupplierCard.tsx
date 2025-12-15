import React from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

interface SupplierCardProps {
  name: string;
  description: string;
  location: string;
  verified: boolean;
  productCount: number;
  className?: string;
  onViewProfile?: () => void;
}

export function SupplierCard({
  name,
  description,
  location,
  verified,
  productCount,
  className,
  onViewProfile,
}: SupplierCardProps) {
  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
             <CardTitle className="text-xl flex items-center gap-2">
               {name}
               {verified && <Badge variant="default" className="bg-primary/90 hover:bg-primary text-xs">Verified</Badge>}
             </CardTitle>
             <div className="flex items-center text-sm text-muted-foreground">
               <MapPin className="mr-1 h-3 w-3" />
               {location}
             </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>
        <div className="flex items-center gap-2 text-sm font-medium">
            <span className="bg-secondary px-2 py-1 rounded-md">{productCount} Products Listed</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={onViewProfile}>
          View Profile
        </Button>
      </CardFooter>
    </Card>
  );
}

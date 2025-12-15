import React from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ProductCardProps {
  image: string;
  name: string;
  supplier: string;
  description: string;
  certifications: string[];
  gwp?: number; // Global Warming Potential
  recycledContent?: number;
  className?: string;
  onQuoteRequest?: () => void;
}

export function ProductCard({
  image,
  name,
  supplier,
  description,
  certifications,
  gwp,
  recycledContent,
  className,
  onQuoteRequest,
}: ProductCardProps) {
  return (
    <Card className={cn("overflow-hidden flex flex-col h-full", className)}>
      <div className="relative h-48 w-full">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform hover:scale-105"
        />
      </div>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
             <CardTitle className="line-clamp-1 text-lg" title={name}>{name}</CardTitle>
             <CardDescription className="line-clamp-1">{supplier}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>

        <div className="flex flex-wrap gap-2">
          {certifications.map((cert) => (
            <Badge key={cert} variant="secondary" className="text-xs">
              {cert}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          {gwp !== undefined && (
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">GWP</span>
              <span className="font-medium">{gwp} kg CO₂e</span>
            </div>
          )}
          {recycledContent !== undefined && (
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Recycled Content</span>
              <span className="font-medium">{recycledContent}%</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onQuoteRequest}>
          Request Quote
        </Button>
      </CardFooter>
    </Card>
  );
}

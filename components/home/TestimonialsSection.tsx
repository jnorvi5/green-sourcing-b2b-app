'use client';

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FadeIn } from "@/components/ui/motion-wrapper";

const testimonials = [
  {
    name: "Alex Rivera",
    role: "BIM Manager, Studio A+D",
    content: "The GreenChainz plugin is a game-changer. I can audit an entire building's carbon footprint in minutes without leaving Revit. It's now a standard part of our workflow.",
    initials: "AR"
  },
  {
    name: "Jessica Wu",
    role: "Senior Architect, FutureBuild",
    content: "Having verified supplier data directly in the model means no more guessing. We can spec low-carbon materials with confidence and get budget pricing instantly.",
    initials: "JW"
  },
  {
    name: "David Thompson",
    role: "Sustainability Lead, GreenCore",
    content: "We used to spend weeks on LCA. With the GreenChainz plugin, we get actionable insights in real-time. It's exactly what the industry needed.",
    initials: "DT"
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Trusted by Beta Users
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Architects are already designing millions of sq. ft. with GreenChainz.
          </p>
        </div>

        {/* Logos Section */}
        <div className="flex flex-wrap justify-center items-center gap-12 mb-20 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="relative w-40 h-12">
              <Image src="/logos/logo-architects.svg" alt="Architects Inc" fill className="object-contain" />
            </div>
            <div className="relative w-40 h-12">
              <Image src="/logos/logo-builders.svg" alt="Global Builders" fill className="object-contain" />
            </div>
            <div className="relative w-40 h-12">
              <Image src="/logos/logo-materials.svg" alt="EcoMaterials" fill className="object-contain" />
            </div>
            <div className="relative w-40 h-12">
              <Image src="/logos/logo-design.svg" alt="Design Studio" fill className="object-contain" />
            </div>
            <div className="relative w-40 h-12">
              <Image src="/logos/logo-construct.svg" alt="Future Construct" fill className="object-contain" />
            </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <FadeIn key={index} delay={index * 0.1}>
              <Card className="h-full border-none shadow-lg bg-background">
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="flex-1">
                    <p className="text-lg text-muted-foreground italic mb-6">
                      &quot;{testimonial.content}&quot;
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-auto">
                    <Avatar className="h-12 w-12 border-2 border-primary/10">
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${testimonial.name}&background=random`} />
                      <AvatarFallback>{testimonial.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

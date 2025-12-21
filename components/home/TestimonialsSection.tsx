'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FadeIn } from "@/components/ui/motion-wrapper";

const testimonials = [
  {
    name: "Sarah Jenkins",
    role: "Lead Architect, EcoDesign Studio",
    content: "GreenChainz has completely transformed how we source materials. The ability to filter by GWP and get instant EPDs saves us hours on every project.",
    initials: "SJ"
  },
  {
    name: "Michael Chen",
    role: "Procurement Manager, BuildRight Construction",
    content: "Finally, a marketplace that speaks our language. The RFQ process is seamless, and knowing every supplier is verified gives us peace of mind.",
    initials: "MC"
  },
  {
    name: "Elena Rodriguez",
    role: "Sustainability Director, Urban Spaces",
    content: "The transparency GreenChainz provides is unmatched. We can easily track our embodied carbon targets and report back to stakeholders with confidence.",
    initials: "ER"
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Trusted by Industry Leaders
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See why architects, developers, and suppliers are switching to GreenChainz.
          </p>
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

'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Types and Schemas
const MaterialTypeEnum = z.enum([
  'insulation',
  'flooring',
  'cladding',
  'roofing',
  'structural',
  'glazing',
  'finishes',
  'hvac',
  'plumbing',
  'electrical',
  'other'
]);

const materialSchema = z.object({
  material_type: MaterialTypeEnum,
  quantity: z.number({ invalid_type_error: "Quantity must be a number" }).positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  budget_range: z.string().optional(),
  specs: z.string().optional(), // Additional notes per material
});

const rfqFormSchema = z.object({
  project_name: z.string().min(1, "Project name is required"),
  project_location: z.string().min(1, "Project location is required"),
  delivery_deadline: z.string().optional(),
  message: z.string().optional(), // General project message
  materials: z.array(materialSchema).min(1, "At least one material is required"),
});

type RFQFormValues = z.infer<typeof rfqFormSchema>;

export default function RFQForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RFQFormValues>({
    resolver: zodResolver(rfqFormSchema),
    defaultValues: {
      project_name: '',
      project_location: '',
      materials: [
        { material_type: 'insulation', quantity: 0, unit: 'sqft', specs: '' }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "materials"
  });

  const onSubmit = async (data: RFQFormValues) => {
    setIsSubmitting(true);
    setError(null);
    const createdIds: string[] = [];
    const errors: string[] = [];

    try {
      // Create an RFQ for each material in the list
      const promises = data.materials.map(async (material) => {
        const payload = {
          project_name: data.project_name,
          project_location: data.project_location,
          delivery_deadline: data.delivery_deadline ? new Date(data.delivery_deadline).toISOString() : null,
          message: data.message ? `${data.message}\n\nSpecs for ${material.material_type}: ${material.specs || 'N/A'}` : `Specs: ${material.specs || 'N/A'}`,
          budget_range: material.budget_range,
          material_specs: {
            material_type: material.material_type,
            quantity: material.quantity,
            unit: material.unit
          }
        };

        const response = await fetch('/api/rfqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `Failed to create RFQ for ${material.material_type}`);
        }

        return result.rfq_id;
      });

      const results = await Promise.allSettled(promises);

      results.forEach((res) => {
        if (res.status === 'fulfilled') {
          createdIds.push(res.value);
        } else {
          errors.push(res.reason.message);
        }
      });

      if (createdIds.length > 0) {
        setSubmittedIds(createdIds);
      }

      if (errors.length > 0) {
        setError(`Some RFQs failed: ${errors.join(', ')}`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedIds.length > 0 && !error) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-green-200 bg-green-50">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-800">RFQs Created Successfully!</h2>
          <p className="text-green-700">
            We have sent your requests to matching suppliers. You can track their status in your dashboard.
          </p>
          <div className="bg-white p-4 rounded-md border border-green-200 text-left">
            <p className="text-sm text-gray-500 mb-2">Reference IDs:</p>
            <ul className="list-disc list-inside font-mono text-sm">
              {submittedIds.map(id => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          </div>
          <div className="pt-4 flex justify-center gap-4">
            <Button asChild variant="outline" className="bg-white">
              <Link href="/architect/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/architect/rfq/create" onClick={() => window.location.reload()}>Create Another</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Create New RFQ</h1>
        <p className="text-gray-500">
          Request quotes for materials. We will match you with verified suppliers.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>Details about the construction project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_name">Project Name *</Label>
                <Input
                  id="project_name"
                  {...form.register('project_name')}
                  placeholder="e.g. Skyline Tower Renovation"
                />
                {form.formState.errors.project_name && (
                  <p className="text-sm text-red-500" role="alert">{form.formState.errors.project_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_location">Project Location *</Label>
                <Input
                  id="project_location"
                  {...form.register('project_location')}
                  placeholder="e.g. Seattle, WA"
                />
                {form.formState.errors.project_location && (
                  <p className="text-sm text-red-500" role="alert">{form.formState.errors.project_location.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delivery_deadline">Delivery Deadline</Label>
                <Input
                  id="delivery_deadline"
                  type="date"
                  {...form.register('delivery_deadline')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">General Message / Notes</Label>
              <textarea
                id="message"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Any specific requirements or instructions for suppliers..."
                {...form.register('message')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Materials List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Materials Required</h2>
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ material_type: 'insulation', quantity: 0, unit: 'sqft', specs: '' })}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Material
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">Material #{index + 1}</CardTitle>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      aria-label="Remove material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`materials-${index}-type`}>Type *</Label>
                    <select
                      id={`materials-${index}-type`}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...form.register(`materials.${index}.material_type`)}
                    >
                      <option value="insulation">Insulation</option>
                      <option value="flooring">Flooring</option>
                      <option value="cladding">Cladding</option>
                      <option value="roofing">Roofing</option>
                      <option value="structural">Structural</option>
                      <option value="glazing">Glazing</option>
                      <option value="finishes">Finishes</option>
                      <option value="hvac">HVAC</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="electrical">Electrical</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`materials-${index}-quantity`}>Quantity *</Label>
                    <Input
                      id={`materials-${index}-quantity`}
                      type="number"
                      {...form.register(`materials.${index}.quantity`, { valueAsNumber: true })}
                      placeholder="0"
                    />
                    {form.formState.errors.materials?.[index]?.quantity && (
                      <p className="text-sm text-red-500" role="alert">{form.formState.errors.materials[index]?.quantity?.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`materials-${index}-unit`}>Unit *</Label>
                    <Input
                      id={`materials-${index}-unit`}
                      {...form.register(`materials.${index}.unit`)}
                      placeholder="e.g. sqft, pcs"
                    />
                    {form.formState.errors.materials?.[index]?.unit && (
                      <p className="text-sm text-red-500" role="alert">{form.formState.errors.materials[index]?.unit?.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <Label htmlFor={`materials-${index}-budget`}>Budget Range</Label>
                    <select
                      id={`materials-${index}-budget`}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...form.register(`materials.${index}.budget_range`)}
                    >
                      <option value="">Select range...</option>
                      <option value="<$10k">&lt; $10k</option>
                      <option value="$10k-50k">$10k - $50k</option>
                      <option value="$50k-100k">$50k - $100k</option>
                      <option value="$100k+">$100k+</option>
                    </select>
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor={`materials-${index}-specs`}>Specs / Details</Label>
                    <Input
                      id={`materials-${index}-specs`}
                      {...form.register(`materials.${index}.specs`)}
                      placeholder="e.g. R-value > 30, Fire rating A"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full md:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending RFQs...
              </>
            ) : (
              <>
                Submit {fields.length} RFQ{fields.length !== 1 ? 's' : ''} <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

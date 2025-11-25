'use server';

import { z } from 'zod';
import { createClient } from '../utils/supabase/server';

const SubmitRFQSchema = z.object({
  productId: z.string().uuid(),
  supplierId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  message: z.string().min(10, "Please provide at least 10 characters describing your needs."),
  projectDetails: z.object({
    projectName: z.string().min(3),
    expectedTimeline: z.string().optional(),
    deliveryLocation: z.string().optional()
  })
});

export async function submitRFQ(formData: FormData) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: 'Authentication error: You must be logged in to submit an RFQ.'
    };
  }

  const rawFormData = {
    productId: formData.get('productId'),
    supplierId: formData.get('supplierId'),
    quantity: formData.get('quantity'),
    message: formData.get('message'),
    projectDetails: {
        projectName: formData.get('projectName'),
        expectedTimeline: formData.get('expectedTimeline'),
        deliveryLocation: formData.get('deliveryLocation'),
    }
  };

  const validationResult = SubmitRFQSchema.safeParse(rawFormData);

  if (!validationResult.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const { productId, supplierId, quantity, message, projectDetails } = validationResult.data;

  // Note: The code review suggested moving `quantity` to a top-level field.
  // However, the current `rfqs` table schema (`database-schemas/mvp_schema.sql`)
  // lacks a `quantity` column. The data is correctly persisted by nesting it
  // within the `project_details` JSONB column.
  const rfqData = {
    buyer_email: user.email!,
    product_id: productId,
    supplier_id: supplierId,
    message: message,
    project_details: {
      ...projectDetails,
      quantity: quantity,
    },
  };

  const { error } = await supabase.from('rfqs').insert([rfqData]);

  if (error) {
    console.error('Supabase insert error:', error);
    return {
      success: false,
      message: 'Database error: Could not submit RFQ.',
      error: error.message,
    };
  }

  return {
    success: true,
    message: 'RFQ submitted successfully!',
  };
}

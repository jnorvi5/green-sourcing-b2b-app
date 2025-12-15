import type { Meta, StoryObj } from "@storybook/react";
import { SupplierCard } from "../components/SupplierCard";

const meta: Meta<typeof SupplierCard> = {
  title: "Custom/SupplierCard",
  component: SupplierCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SupplierCard>;

export const Verified: Story = {
  args: {
    name: "GreenBuild Supplies",
    description: "Leading supplier of sustainable building materials for commercial and residential projects. We specialize in low-carbon concrete and recycled steel.",
    location: "Portland, OR",
    verified: true,
    productCount: 42,
  },
};

export const Unverified: Story = {
  args: {
    name: "New Age Materials",
    description: "Startup focused on hempcrete and bio-based insulation materials.",
    location: "Austin, TX",
    verified: false,
    productCount: 5,
  },
};

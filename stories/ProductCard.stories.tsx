import type { Meta, StoryObj } from "@storybook/react";
import { ProductCard } from "../components/ProductCard";

const meta: Meta<typeof ProductCard> = {
  title: "Custom/ProductCard",
  component: ProductCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ProductCard>;

export const Default: Story = {
  args: {
    image: "https://images.unsplash.com/photo-1620626012053-93f26f955ee0?auto=format&fit=crop&q=80&w=800",
    name: "EcoTouch Insulation",
    supplier: "Owens Corning",
    description: "High-performance insulation made with natural materials for better sustainability.",
    certifications: ["LEED", "FSC", "Greenguard"],
    gwp: 4.2,
    recycledContent: 75,
  },
};

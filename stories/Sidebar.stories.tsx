import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar } from "../components/ui/sidebar";
// Mock usePathname
const mockPathname = "/dashboard";

const meta: Meta<typeof Sidebar> = {
  title: "UI/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  parameters: {
     nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/dashboard',
      },
    },
  }
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  args: {
      className: "h-screen border",
  },
};

import { redirect } from "next/navigation";

export default function SuppliersPage() {
  // Temporary: redirect public /suppliers to the search page until a directory page is implemented
  redirect("/search");
}

import { redirect } from 'next/navigation';

// Old feeds route — redirect to the active my-feeds section.
export default function FeedsRedirect() {
  redirect('/cockpit/my-e-assets/my-feeds');
}

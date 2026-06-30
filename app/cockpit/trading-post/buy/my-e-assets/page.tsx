import { redirect } from 'next/navigation';

// This path was created accidentally. Redirect to the correct My E-Assets section.
export default function BuyMyEAssetsRedirect() {
  redirect('/cockpit/my-e-assets');
}

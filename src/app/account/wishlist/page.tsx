import { redirect } from 'next/navigation';

export default function AccountWishlistRedirect() {
  // Redirect /account/wishlist to /wishlist or /account?tab=wishlist
  redirect('/wishlist');
}

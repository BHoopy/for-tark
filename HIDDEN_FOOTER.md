# Hidden footer / donation banner

The following are currently hidden (they render nothing):

- `src/components/ui/footer.tsx` — "Play Champ (playchamp.app)" footer
- `src/components/ui/donation-banner.tsx` — "Support Play Champ — Show Love" banner

## How to restore

1. Open `src/components/ui/footer.tsx` and remove the line:
   ```
   return null; // <- remove this line to re-enable the footer
   ```
2. Open `src/components/ui/donation-banner.tsx` and remove the line:
   ```
   return null; // <- remove this line to re-enable the banner
   ```
3. If you also removed the `<DonationBanner />` / `<Footer />` usages from pages, re-add them where needed (search for `DonationBanner` / `Footer` in `src/app`).

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/svg+xml';

export default function Icon() {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#1a0d08"/><circle cx="8" cy="9" r="6" fill="#D4AF37" opacity="0.18"/><circle cx="8" cy="9" r="3.5" fill="#D4AF37"/><line x1="3" y1="25" x2="29" y2="25" stroke="#6b4423" stroke-width="1" opacity="0.9"/><rect x="14" y="6" width="2.5" height="19" rx="1.25" fill="#D4AF37"/><line x1="16.25" y1="25" x2="28" y2="25" stroke="#D4AF37" stroke-width="2.5" stroke-opacity="0.55" stroke-linecap="round"/></svg>`,
    {
      headers: {
        'content-type': contentType,
      },
    }
  );
}

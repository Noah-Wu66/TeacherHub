export const size = {
  width: 64,
  height: 64,
};

export const contentType = 'image/svg+xml';

export default function Icon() {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1d4ed8"/><stop offset="1" stop-color="#0891b2"/></linearGradient><linearGradient id="cubeTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8fafc"/><stop offset="1" stop-color="#cbd5e1"/></linearGradient><linearGradient id="cubeLeft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfdbfe"/><stop offset="1" stop-color="#93c5fd"/></linearGradient><linearGradient id="cubeRight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#3b82f6"/></linearGradient></defs><rect x="2" y="2" width="60" height="60" rx="14" fill="url(#bg)"/><g transform="translate(12 12)"><g transform="translate(0 10)"><polygon points="12,0 24,6 12,12 0,6" fill="url(#cubeTop)"/><polygon points="0,6 12,12 12,24 0,18" fill="url(#cubeLeft)"/><polygon points="24,6 12,12 12,24 24,18" fill="url(#cubeRight)"/></g><g transform="translate(16 2)"><polygon points="12,0 24,6 12,12 0,6" fill="url(#cubeTop)"/><polygon points="0,6 12,12 12,24 0,18" fill="url(#cubeLeft)"/><polygon points="24,6 12,12 12,24 24,18" fill="url(#cubeRight)"/></g></g></svg>`,
    {
      headers: {
        'content-type': contentType,
      },
    }
  );
}

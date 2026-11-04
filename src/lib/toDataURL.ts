
export function toDataURL(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Required for external images
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject("Canvas context not available");
      }
    };
    img.onerror = () => {
      // If there's an error, resolve with a fallback to prevent the entire process from failing.
      console.warn(`Failed to load and convert image to data URL: ${url}`);
      // Fallback to a transparent pixel to avoid breaking the canvas drawing
      resolve(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      );
    };
    // Removed cache-busting query parameter to allow browser caching
    img.src = url;
  });
}

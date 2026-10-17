"use client";
import Image from "next/image";
import { useState } from "react";
export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [selected, setSelected] = useState(images[0]);
  return (
    <div>
      <div className="detail-image">
        <Image
          width={1400}
          height={1540}
          sizes="(max-width: 700px) 90vw, 50vw"
          priority
          src={selected}
          alt={name}
        />
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbnails">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              aria-label={`View ${name}, image ${index + 1}`}
              aria-pressed={url === selected}
              onClick={() => setSelected(url)}
            >
              <Image
                width={150}
                height={170}
                sizes="75px"
                src={url}
                alt=""
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

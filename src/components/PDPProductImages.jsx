"use client";
import Image from "next/image";
import { useState } from "react";

const PDPProductImages = ({ mainImage, images }) => {
  const [selectedImage, setSelectedImage] = useState(mainImage);

  return (
    <div className="flex flex-col items-center">
      <Image
        src={
          selectedImage
            ? `/images/${selectedImage}`
            : "/images/product_placeholder.jpg"
        }
        width={500}
        height={500}
        alt="Product Image"
        className="w-full h-auto rounded-lg shadow-lg"
        loading="lazy"
      />
      {/* {images.length > 0 && (
        <div className="flex justify-start mt-5 gap-2 flex-wrap max-[500px]:justify-center">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`border rounded-lg p-1 cursor-pointer transition-transform transform hover:scale-110 ${
                selectedImage === img.image
                  ? "border-[var(--color-bg)]"
                  : "border-gray-200"
              }`}
              onClick={() => setSelectedImage(img.image)}
            >
              <Image
                src={`/images/${img.image}`}
                width={80}
                height={80}
                alt={`Thumbnail ${idx + 1}`}
                className="w-auto h-auto rounded-md"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )} */}
    </div>
  );
};

export default PDPProductImages;

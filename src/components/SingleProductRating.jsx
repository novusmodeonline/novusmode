import React from "react";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";

const SingleProductRating = ({ rating, reviews }) => {
  // Creating an array of 5 stars, each is either full or empty depending on the rating
  const ratingArray = Array.from({ length: 5 }, (_, index) =>
    index < Math.floor(rating) ? "full star" : "empty star"
  );

  // Handling fractional rating (like 4.5 stars)
  if (rating % 1 !== 0) {
    ratingArray[Math.floor(rating)] = "half star";
  }

  return (
    <div className="flex text-2xl items-center max-[500px]:justify-center">
      {ratingArray.map((singleRating, index) => {
        return (
          <div key={index}>
            {singleRating === "full star" ? (
              <AiFillStar className="text-custom-yellow" />
            ) : singleRating === "half star" ? (
              <AiFillStar
                className="text-custom-yellow"
                style={{ opacity: 0.5 }}
              />
            ) : (
              <AiOutlineStar className="text-custom-yellow" />
            )}
          </div>
        );
      })}
      <span className="text-xl ml-2">({reviews} reviews)</span>
    </div>
  );
};

export default SingleProductRating;

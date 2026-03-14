import React from "react";

const Heading = ({ title }) => {
  return (
    <h2 className="text-white text-7xl font-extrabold text-center mt-20 max-lg:text-5xl">
      {title}
    </h2>
  );
};

export default Heading;

import {
  Breadcrumb,
  Filters,
  Pagination,
  Products,
  SortBy,
} from "@/components";
import React from "react";

export const metadata = {
  title: "Shop",
};

// improve readabillity of category text, for example category text "smart-watches" will be "smart watches"
const improveCategoryText = (text) => {
  if (text.indexOf("-") !== -1) {
    let textArray = text.split("-");

    return textArray.join(" ");
  } else {
    return text;
  }
};

const ShopPage = async ({ params, searchParams }) => {
  params = await params;
  searchParams = await searchParams;
  const slug = {
    params,
    searchParams,
  };
  return (
    <div className="text-black bg-white mt-28">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-24">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Breadcrumb />
        </div>

        <div className="flex gap-10 max-md:flex-col min-h-screen">
          {/* Sidebar */}
          <aside className="w-[220px] shrink-0 max-md:w-full">
            <div className="sticky top-28">
              <Filters slug={slug} />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 w-full">
            {/* Title + Sort Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 items-center mb-6">
              <h2 className="text-3xl font-bold max-sm:text-2xl max-[400px]:text-lg uppercase">
                {slug?.params?.slug && slug?.params?.slug[0]?.length > 0
                  ? improveCategoryText(slug?.params?.slug[0])
                  : "All Products"}
              </h2>

              {/* <div className="lg:hidden justify-self-end">
                <SortBy />
              </div> */}
            </div>

            {/* Products */}
            <div className="mb-8">
              <Products slug={slug} />
            </div>

            {/* Pagination */}
            {/* <Pagination /> */}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;

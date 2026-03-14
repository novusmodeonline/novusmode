import { Breadcrumb, Filters, Products } from "@/components";
import React from "react";

export const metadata = {
  title: "Search | NovusMode",
};

// sending api request for search results for a given search text
const SearchPage = async ({ params, searchParams }) => {
  params = await params;
  searchParams = await searchParams;
  const slug = {
    params,
    searchParams,
  };
  const search = searchParams.search || "";

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
              <Filters slug={slug} search={search} />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 w-full">
            {/* Title + Sort Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 items-center mb-6">
              <div className="col-span-full">
                <h2 className="text-3xl font-bold max-sm:text-2xl text-center max-[400px]:text-lg uppercase">
                  Showing results for {search}
                </h2>
              </div>
            </div>

            {/* Products */}
            <div className="mb-8">
              <Products slug={slug} pageName={"search"} search={search} />
            </div>

            {/* Pagination */}
            {/* <Pagination /> */}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;

/*

*/

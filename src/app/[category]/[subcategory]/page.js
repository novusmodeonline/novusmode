import { ProductPage } from "@/components";

const subCategoriesPage = ({ params, searchParams }) => {
  return (
    <div>
      <ProductPage params={params} searchParams={searchParams} />
    </div>
  );
};

export default subCategoriesPage;

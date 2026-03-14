import { ProductPage } from "@/components";

const categoriesPage = ({ params, searchParams }) => {
  return (
    <div>
      <ProductPage params={params} searchParams={searchParams} />
    </div>
  );
};

export default categoriesPage;

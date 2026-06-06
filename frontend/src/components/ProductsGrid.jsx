import React from 'react';
import ProductCard from '../product/ProductCard';

const ProductsGrid = ({ products, loading, columns = { mobile: 2, tablet: 3, laptop: 4, desktop: 5 } }) => {
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-card border border-border/40 rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-8">
            <div className="bg-muted/10 rounded-2xl w-full md:w-[35%] h-64 md:h-full"></div>
            <div className="flex-1 space-y-4 py-4">
              <div className="h-4 bg-muted/10 rounded-lg w-1/4"></div>
              <div className="h-8 bg-muted/10 rounded-lg w-3/4"></div>
              <div className="h-4 bg-muted/10 rounded-lg w-full"></div>
              <div className="h-4 bg-muted/10 rounded-lg w-5/6"></div>
              <div className="pt-8 mt-auto border-t border-border/20 flex justify-between">
                 <div className="h-8 bg-muted/10 rounded-lg w-32"></div>
                 <div className="h-12 bg-muted/10 rounded-lg w-40"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};

export default ProductsGrid;

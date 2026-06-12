import React from 'react';
import ProductCard from '../product/ProductCard';

const ProductsGrid = ({ products, loading }) => {
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:gap-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-card border border-border/40 rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 min-w-0">
            <div className="bg-muted/10 rounded-2xl w-full md:w-[35%] aspect-square md:aspect-[4/3]"></div>
            <div className="flex-1 space-y-4 py-4">
              <div className="h-4 bg-muted/10 rounded-lg w-1/4"></div>
              <div className="h-8 bg-muted/10 rounded-lg w-3/4"></div>
              <div className="h-4 bg-muted/10 rounded-lg w-full"></div>
              <div className="h-4 bg-muted/10 rounded-lg w-5/6"></div>
              <div className="pt-8 mt-auto border-t border-border/20 flex flex-col sm:flex-row gap-4 sm:justify-between">
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
    <div className="product-grid-responsive">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};

export default ProductsGrid;

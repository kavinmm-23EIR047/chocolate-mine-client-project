// In your parent component
const [isDrawerOpen, setIsDrawerOpen] = useState(false);
const [filters, setFilters] = useState({});
const [searchTerm, setSearchTerm] = useState('');
const [filteredProducts, setFilteredProducts] = useState([]);

const handleApplyFilters = (newFilters) => {
  setFilters(newFilters);
  applyAllFilters(newFilters, searchTerm);
};

const handleSearch = (term) => {
  setSearchTerm(term);
  applyAllFilters(filters, term);
};

const handleResetFilters = () => {
  setFilters({});
  setSearchTerm('');
  applyAllFilters({}, '');
};

const applyAllFilters = (activeFilters, search) => {
  let results = [...products];
  
  // Apply search with relevance scoring
  if (search) {
    const searchLower = search.toLowerCase();
    results = results.filter(product => 
      product.name.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower)
    );
    
    // Sort by relevance: starts with > contains > ends with
    results.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      const aStartsWith = aName.startsWith(searchLower) ? 0 : 1;
      const bStartsWith = bName.startsWith(searchLower) ? 0 : 1;
      if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;
      
      const aContains = aName.includes(searchLower) ? 0 : 1;
      const bContains = bName.includes(searchLower) ? 0 : 1;
      return aContains - bContains;
    });
  }
  
  // Apply category filters
  if (activeFilters.categories?.length) {
    results = results.filter(p => activeFilters.categories.includes(p.category));
  }
  
  // Apply price range
  if (activeFilters.priceRange) {
    results = results.filter(p => 
      p.price >= activeFilters.priceRange.min && 
      p.price <= activeFilters.priceRange.max
    );
  }
  
  // Apply dietary filters
  if (activeFilters.dietary?.length) {
    results = results.filter(p => activeFilters.dietary.includes(p.dietary));
  }
  
  // Apply rating filters
  if (activeFilters.ratings?.length) {
    results = results.filter(p => 
      activeFilters.ratings.some(r => p.rating >= r)
    );
  }
  
  setFilteredProducts(results);
};

// In your JSX
<FilterDrawer
  isOpen={isDrawerOpen}
  onClose={() => setIsDrawerOpen(false)}
  filters={filters}
  onApply={handleApplyFilters}
  onReset={handleResetFilters}
  onSearch={handleSearch}
  searchTerm={searchTerm}
  products={products}
/>
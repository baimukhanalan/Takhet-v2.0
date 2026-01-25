
import React, { useState } from 'react';
import { ShoppingBag, Search, Plus, Filter, Trash2, ChevronRight, X } from 'lucide-react';

const CATEGORIES = ['All', 'Vitamins', 'Pain Relief', 'Cold & Flu', 'Personal Care'];

const PRODUCTS = [
  { id: 'p1', name: 'Multivitamin Complex', price: 4500, category: 'Vitamins', img: '💊' },
  { id: 'p2', name: 'Ibuprofen 400mg', price: 1200, category: 'Pain Relief', img: '🩹' },
  { id: 'p3', name: 'Vitamin D3 (2000 IU)', price: 3800, category: 'Vitamins', img: '☀️' },
  { id: 'p4', name: 'Paracetamol Tabs', price: 800, category: 'Pain Relief', img: '💊' },
  { id: 'p5', name: 'Cough Syrup (Night)', price: 2100, category: 'Cold & Flu', img: '🍯' },
  { id: 'p6', name: 'Omega-3 Fish Oil', price: 5500, category: 'Vitamins', img: '🐟' },
];

const Pharmacy: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const addToCart = (product: any) => {
    setCart(prev => [...prev, { ...product, cartId: Math.random() }]);
  };

  const removeFromCart = (cartId: number) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const filteredProducts = PRODUCTS.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Pharmacy & Delivery</h1>
          <p className="text-muted-foreground mt-2 text-lg">Order prescriptions and health products with 1-click delivery.</p>
        </div>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative px-6 py-4 bg-primary text-white rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-primary/20 hover:scale-105 transition-all"
        >
          <ShoppingBag className="w-5 h-5" /> Cart ({cart.length})
          {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-accent text-white w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px]">{cart.length}</span>}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicine or wellness products..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all
                ${activeCategory === cat ? 'bg-primary text-white shadow-lg' : 'bg-white text-muted-foreground hover:bg-slate-50'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl transition-all group flex flex-col">
            <div className="w-full aspect-square bg-slate-50 rounded-3xl mb-6 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
              {product.img}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{product.category}</p>
              <h3 className="font-bold text-lg mb-2">{product.name}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">Certified pharmaceutical product from Takhet+ partners.</p>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xl font-extrabold text-foreground">{product.price.toLocaleString()}₸</span>
              <button 
                onClick={() => addToCart(product)}
                className="p-3 bg-secondary text-primary rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-500">
            <div className="p-8 border-b border-border flex items-center justify-between bg-background">
              <h2 className="text-2xl font-extrabold flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-primary" /> Your Cart
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <ShoppingBag className="w-16 h-16 mb-4" />
                  <p className="font-bold text-lg">Your cart is empty</p>
                  <p className="text-sm mt-2">Add some products to see them here.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.cartId} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">{item.img}</div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{item.name}</p>
                      <p className="text-xs text-primary font-bold">{item.price.toLocaleString()}₸</p>
                    </div>
                    <button onClick={() => removeFromCart(item.cartId)} className="p-2 text-muted-foreground hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-border space-y-6">
              <div className="flex items-center justify-between text-lg">
                <span className="font-bold text-muted-foreground">Total</span>
                <span className="text-3xl font-extrabold text-foreground">{cartTotal.toLocaleString()}₸</span>
              </div>
              <button 
                disabled={cart.length === 0}
                className="w-full py-5 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-blue-800 shadow-xl shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                Checkout Now <ChevronRight className="w-6 h-6" />
              </button>
              <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest">Free delivery for orders over 15,000₸</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pharmacy;

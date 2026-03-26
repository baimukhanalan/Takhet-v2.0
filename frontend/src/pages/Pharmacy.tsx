import React, { useState } from 'react';
import { ShoppingBag, Search, Plus, Trash2, X, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../services/useLanguage';

const Pharmacy: React.FC = () => {
  const { t } = useLanguage();
  
  const CATEGORIES = [
    t.pharmacy.categories.all, 
    t.pharmacy.categories.vitamins, 
    t.pharmacy.categories.painRelief, 
    t.pharmacy.categories.coldFlu, 
    t.pharmacy.categories.personalCare
  ];
  
  const PRODUCTS = [
    { id: 'p1', name: 'Multivitamin Complex', price: 4500, category: t.pharmacy.categories.vitamins, img: '💊' },
    { id: 'p2', name: 'Ibuprofen 400mg', price: 1200, category: t.pharmacy.categories.painRelief, img: '🩹' },
    { id: 'p3', name: 'Vitamin D3 (2000 IU)', price: 3800, category: t.pharmacy.categories.vitamins, img: '☀️' },
  ];

  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderComplete, setOrderComplete] = useState(false);

  const addToCart = (product: any) => {
    setCart(prev => [...prev, { ...product, cartId: Math.random() }]);
  };

  const removeFromCart = (cartId: number) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const handleCheckout = () => {
    setOrderComplete(true);
    setCart([]);
    setTimeout(() => {
      setOrderComplete(false);
      setIsCartOpen(false);
    }, 3000);
  };

  const filteredProducts = PRODUCTS.filter(p => {
    const matchesCategory = activeCategory === CATEGORIES[0] || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{t.pharmacy.title}</h1>
          <p className="text-muted-foreground mt-2 text-lg">{t.pharmacy.subtitle}</p>
        </div>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative px-6 py-4 md:px-8 md:py-5 bg-primary text-white rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs flex items-center gap-3 shadow-xl"
        >
          <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" /> {t.pharmacy.cart} ({cart.length})
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.pharmacy.searchPlaceholder} 
            className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all
                ${activeCategory === cat ? 'bg-primary text-white shadow-lg' : 'bg-white text-muted-foreground hover:bg-slate-50'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white p-6 rounded-[2rem] md:rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl transition-all group flex flex-col">
            <div className="w-full aspect-square bg-slate-50 rounded-2xl md:rounded-3xl mb-6 flex items-center justify-center text-5xl md:text-6xl group-hover:scale-110 transition-transform">
              {product.img}
            </div>
            <div className="flex-1">
              <p className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest mb-1">{product.category}</p>
              <h3 className="font-bold text-base md:text-lg mb-2">{product.name}</h3>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-lg md:text-xl font-extrabold text-foreground">{product.price.toLocaleString()}₸</span>
              <button 
                onClick={() => addToCart(product)}
                className="p-3 md:p-4 bg-primary/5 text-primary rounded-xl md:rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm"
              >
                <Plus className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            {orderComplete ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center space-y-6">
                <CheckCircle2 className="w-16 h-16 md:w-24 md:h-24 text-success animate-bounce" />
                <h2 className="text-2xl md:text-3xl font-black uppercase">{t.pharmacy.orderComplete}</h2>
                <p className="text-muted-foreground font-medium text-sm md:text-base">Ваши медикаменты будут доставлены в течение 30 минут.</p>
              </div>
            ) : (
              <>
                <div className="p-6 md:p-8 border-b border-border flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter">{t.pharmacy.cart}</h2>
                  <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 md:w-4 md:h-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 no-scrollbar">
                  {cart.length === 0 ? (
                    <div className="text-center py-20 opacity-30 font-black uppercase tracking-widest text-sm">Пусто</div>
                  ) : (
                    cart.map(item => (
                      <div key={item.cartId} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                        <span className="text-2xl md:text-3xl">{item.img}</span>
                        <div className="flex-1">
                          <p className="font-bold text-xs md:text-sm">{item.name}</p>
                          <p className="text-[10px] md:text-xs text-primary font-black">{item.price}₸</p>
                        </div>
                        <button onClick={() => removeFromCart(item.cartId)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-6 md:p-8 bg-slate-50 border-t border-border space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-muted-foreground uppercase text-xs md:text-sm">{t.pharmacy.total}</span>
                    <span className="text-2xl md:text-3xl font-black text-foreground">{cartTotal.toLocaleString()}₸</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="w-full py-5 md:py-6 bg-primary text-white rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs shadow-xl disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {t.pharmacy.checkout}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Pharmacy;

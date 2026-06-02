import React, { useMemo, useState } from 'react';
import { AlertTriangle, Plus, Search, ShoppingBag, Trash2, X } from 'lucide-react';
import { useLanguage } from '../services/useLanguage';

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  img: string;
};

const Pharmacy: React.FC = () => {
  const { t } = useLanguage();

  const categories = [
    t.pharmacy.categories.all,
    t.pharmacy.categories.vitamins,
    t.pharmacy.categories.painRelief,
    t.pharmacy.categories.coldFlu,
    t.pharmacy.categories.personalCare
  ];

  const products: Product[] = [
    { id: 'p1', name: 'Мультивитаминный комплекс', price: 4500, category: t.pharmacy.categories.vitamins, img: 'V' },
    { id: 'p2', name: 'Ибупрофен 400 мг', price: 1200, category: t.pharmacy.categories.painRelief, img: 'I' },
    { id: 'p3', name: 'Витамин D3 (2000 IU)', price: 3800, category: t.pharmacy.categories.vitamins, img: 'D3' },
    { id: 'p4', name: 'Набор для горла', price: 2400, category: t.pharmacy.categories.coldFlu, img: 'TR' }
  ];

  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [cart, setCart] = useState<(Product & { cartId: number })[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesCategory = activeCategory === categories[0] || product.category === activeCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      }),
    [activeCategory, categories, products, searchQuery]
  );

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const addToCart = (product: Product) => {
    setCart((current) => [...current, { ...product, cartId: Date.now() + Math.random() }]);
  };

  const removeFromCart = (cartId: number) => {
    setCart((current) => current.filter((item) => item.cartId !== cartId));
  };

  const handleCheckout = () => {
    setError(t.pharmacy.pausedError);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{t.pharmacy.title}</h1>
          <p className="text-muted-foreground mt-2 text-lg">{t.pharmacy.subtitle}</p>
          <p className="text-sm font-bold text-amber-700 mt-2">{t.pharmacy.pausedLine}</p>
        </div>
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative px-6 py-4 md:px-8 md:py-5 bg-primary text-white rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs flex items-center gap-3 shadow-xl"
        >
          <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" /> {t.pharmacy.cart} ({cart.length})
        </button>
      </div>

      {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-red-700 font-bold">{error}</div>}

      <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-900 font-bold flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
        {t.pharmacy.pausedAlert}
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
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${
                activeCategory === category ? 'bg-primary text-white shadow-lg' : 'bg-white text-muted-foreground hover:bg-slate-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white p-6 rounded-[2rem] md:rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl transition-all group flex flex-col">
            <div className="w-full aspect-square bg-slate-50 rounded-2xl md:rounded-3xl mb-6 flex items-center justify-center text-5xl md:text-6xl group-hover:scale-110 transition-transform font-black text-primary">
              {product.img}
            </div>
            <div className="flex-1">
              <p className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest mb-1">{product.category}</p>
              <h3 className="font-bold text-base md:text-lg mb-2">{product.name}</h3>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-lg md:text-xl font-extrabold text-foreground">₸{product.price.toLocaleString('ru-RU')}</span>
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

      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-6 md:p-8 border-b border-border flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter">{t.pharmacy.cart}</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 md:w-4 md:h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 no-scrollbar">
              {cart.length === 0 ? (
                <div className="text-center py-20 opacity-30 font-black uppercase tracking-widest text-sm">{t.pharmacy.empty}</div>
              ) : (
                cart.map((item) => (
                  <div key={item.cartId} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                    <span className="text-2xl md:text-3xl font-black text-primary">{item.img}</span>
                    <div className="flex-1">
                      <p className="font-bold text-xs md:text-sm">{item.name}</p>
                      <p className="text-[10px] md:text-xs text-primary font-black">₸{item.price.toLocaleString('ru-RU')}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.cartId)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-6 md:p-8 bg-slate-50 border-t border-border space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-black text-muted-foreground uppercase text-xs md:text-sm">{t.pharmacy.total}</span>
                <span className="text-2xl md:text-3xl font-black text-foreground">₸{cartTotal.toLocaleString('ru-RU')}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full py-5 md:py-6 bg-primary text-white rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs shadow-xl disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {t.pharmacy.checkoutDisabled}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pharmacy;

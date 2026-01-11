
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  PlusCircle, 
  MinusCircle, 
  ShoppingCart,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Download,
  Users,
  User,
  Search,
  AlertTriangle,
  Tag,
  FileSpreadsheet,
  Boxes,
  Coins,
  LogOut,
  Mail,
  Lock,
  Phone,
  Globe,
  ArrowRight
} from 'lucide-react';
import { Product, Transaction, TransactionType, SaleType } from './types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Card = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
    {children}
  </div>
);

const COUNTRIES = [
  { name: "Angola", code: "+244" },
  { name: "Portugal", code: "+351" },
  { name: "Brasil", code: "+55" },
  { name: "Moçambique", code: "+258" },
  { name: "Cabo Verde", code: "+238" },
  { name: "Guiné-Bissau", code: "+245" },
  { name: "São Tomé e Príncipe", code: "+239" },
  { name: "Estados Unidos", code: "+1" },
  { name: "Reino Unido", code: "+44" },
  { name: "França", code: "+33" },
  { name: "Alemanha", code: "+49" },
  { name: "China", code: "+86" },
  { name: "Japão", code: "+81" }
].sort((a, b) => a.name.localeCompare(b.name));

const App: React.FC = () => {
  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [userEmail, setUserEmail] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);

  // App States (Scoped by userEmail)
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [initialInvestment, setInitialInvestment] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stock' | 'cashflow'>('dashboard');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterInventoryType, setFilterInventoryType] = useState<'all' | SaleType>('all');

  const [showProductModal, setShowProductModal] = useState(false);
  const [creationMode, setCreationMode] = useState<SaleType>('RETAIL');

  const [showTransactionModal, setShowTransactionModal] = useState<{
    show: boolean, 
    type: TransactionType, 
    preSelectedId?: string
  }>({
    show: false, 
    type: 'SALE'
  });

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }).replace('AOA', 'Kz');
  };

  // Carregar sessão e dados específicos do utilizador
  useEffect(() => {
    const activeEmail = localStorage.getItem('stokmaster_session_email');
    if (activeEmail) {
      setIsAuthenticated(true);
      setUserEmail(activeEmail);
      loadUserData(activeEmail);
    }
  }, []);

  const loadUserData = (email: string) => {
    const storageKey = `stokmaster_data_${email}`;
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setProducts(parsed.products || []);
      setTransactions(parsed.transactions || []);
      setInitialInvestment(parsed.initialInvestment || 0);
    } else {
      // Se for nova conta, garante que tudo está zerado
      setProducts([]);
      setTransactions([]);
      setInitialInvestment(0);
    }
  };

  // Guardar dados sempre que houver alteração (apenas se logado)
  useEffect(() => {
    if (isAuthenticated && userEmail) {
      const storageKey = `stokmaster_data_${userEmail}`;
      const dataToSave = {
        products,
        transactions,
        initialInvestment
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }
  }, [products, transactions, initialInvestment, isAuthenticated, userEmail]);

  const handleAuth = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string).toLowerCase();
    const password = formData.get('password') as string;

    const users = JSON.parse(localStorage.getItem('stokmaster_users') || '[]');

    if (authMode === 'register') {
      if (users.find((u: any) => u.email === email)) {
        alert("Este e-mail já está registado!");
        return;
      }
      users.push({ email, password });
      localStorage.setItem('stokmaster_users', JSON.stringify(users));
      
      setIsAuthenticated(true);
      setUserEmail(email);
      localStorage.setItem('stokmaster_session_email', email);
      loadUserData(email); // Inicia com tudo zerado
    } else {
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (user) {
        setIsAuthenticated(true);
        setUserEmail(email);
        localStorage.setItem('stokmaster_session_email', email);
        loadUserData(email); // Carrega os dados desta conta específica
      } else {
        alert("Credenciais incorretas ou conta não existe!");
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('stokmaster_session_email');
    setUserEmail('');
    setProducts([]);
    setTransactions([]);
    setInitialInvestment(0);
    setAuthMode('login');
  };

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['all', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
      const matchesType = filterInventoryType === 'all' || p.type === filterInventoryType;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [products, searchTerm, filterCategory, filterInventoryType]);

  const stats = useMemo(() => {
    const totalRevenue = transactions.filter(t => t.type === 'SALE').reduce((acc, t) => acc + t.value, 0);
    const totalExpenses = transactions.filter(t => t.type === 'ENTRY' || t.type === 'EXPENSE').reduce((acc, t) => acc + t.value, 0);
    return {
      totalRevenue,
      totalExpenses,
      netBalance: initialInvestment + totalRevenue - totalExpenses,
      lowStockItems: products.filter(p => p.stock <= 5).length
    };
  }, [transactions, products, initialInvestment]);

  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('product_name') as string;
    const category = formData.get('product_category') as string;
    const price = Number(formData.get('product_price'));
    const cost = Number(formData.get('product_cost'));
    const initialStock = Number(formData.get('product_stock'));

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name,
      price,
      stock: initialStock,
      category,
      type: creationMode
    };

    setProducts(prev => [...prev, newProduct]);
    
    if (cost > 0 && initialStock > 0) {
      setTransactions(prev => [{
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        productId: newProduct.id,
        productName: newProduct.name,
        type: 'ENTRY',
        saleType: creationMode,
        quantity: initialStock,
        value: cost * initialStock,
        description: `Carga de Stock (${creationMode === 'RETAIL' ? 'Retalho' : 'Grosso'}): ${name}`
      }, ...prev]);
    }
    setShowProductModal(false);
  };

  const handleProcessTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productId = formData.get('productId') as string;
    const quantity = Number(formData.get('quantity'));
    const product = products.find(p => p.id === productId);

    if (!product) return;

    if (showTransactionModal.type === 'SALE') {
      if (product.stock < quantity) {
        alert("Stock insuficiente!");
        return;
      }
      const totalValue = product.price * quantity;
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: p.stock - quantity } : p));
      setTransactions(prev => [{
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        productId,
        productName: product.name,
        type: 'SALE',
        saleType: product.type,
        quantity,
        value: totalValue,
        description: `Venda ${product.type === 'RETAIL' ? 'Retalho' : 'Grosso'}: ${product.name}`
      }, ...prev]);
    } else {
      const cost = Number(formData.get('unitCost'));
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: p.stock + quantity } : p));
      setTransactions(prev => [{
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        productId: product.id,
        productName: product.name,
        type: 'ENTRY',
        saleType: product.type,
        quantity,
        value: cost * quantity,
        description: `Reposição ${product.type === 'RETAIL' ? 'Retalho' : 'Grosso'}: ${product.name}`
      }, ...prev]);
    }
    setShowTransactionModal({ show: false, type: 'SALE' });
  };

  const handleExportStockCSV = () => {
    let csv = "Nome,Tipo,Categoria,Preco,Stock\n";
    filteredProducts.forEach(p => csv += `"${p.name}","${p.type}","${p.category}",${p.price},${p.stock}\n`);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'stock.csv'; a.click();
  };

  const handleExportTransactionsCSV = () => {
    let csv = "Data,Tipo,Descricao,Valor\n";
    transactions.forEach(t => csv += `"${t.date}","${t.type}","${t.description}",${t.value}\n`);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'caixa.csv'; a.click();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
        <div className="lg:w-1/2 p-12 flex flex-col justify-between bg-blue-600 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white p-3 rounded-2xl shadow-xl text-blue-600"><Boxes size={32} /></div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">StokMaster</h1>
            </div>
            <h2 className="text-5xl font-black text-white leading-none tracking-tighter mb-6 uppercase">
              Controle o seu negócio <br /> de forma <span className="text-blue-200">automática.</span>
            </h2>
            <p className="text-blue-100 font-medium max-w-md">Isolamento total de dados por utilizador. Sua empresa, suas regras.</p>
          </div>
          <div className="relative z-10 flex gap-4 text-white/50 text-[10px] font-bold uppercase tracking-widest">
            <span>© 2024 StokMaster</span>
            <span>•</span>
            <span>Segurança Total</span>
          </div>
        </div>

        <div className="lg:w-1/2 bg-slate-950 flex items-center justify-center p-8">
          <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="mb-10">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">{authMode === 'login' ? 'Entrar na Conta' : 'Novo Registo'}</h3>
              <p className="text-slate-400 text-sm mt-2">{authMode === 'login' ? 'Inicie sessão para aceder aos seus dados exclusivos.' : 'Preencha os campos abaixo para criar o seu espaço isolado.'}</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              {authMode === 'register' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">País</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <select required className="w-full pl-12 pr-4 py-4 bg-slate-900 border-2 border-slate-800 rounded-2xl text-white outline-none focus:border-blue-600 font-bold appearance-none" onChange={(e) => setSelectedCountry(COUNTRIES.find(c => c.name === e.target.value) || COUNTRIES[0])}>
                        {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Telefone</label>
                    <div className="flex gap-2">
                      <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-4 flex items-center text-slate-300 font-black">{selectedCountry.code}</div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input required type="tel" placeholder="Número" className="w-full pl-12 pr-4 py-4 bg-slate-900 border-2 border-slate-800 rounded-2xl text-white outline-none focus:border-blue-600 font-bold" />
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input required name="email" type="email" placeholder="email@exemplo.com" className="w-full pl-12 pr-4 py-4 bg-slate-900 border-2 border-slate-800 rounded-2xl text-white outline-none focus:border-blue-600 font-bold" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Palavra-passe</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input required name="password" type="password" placeholder="••••••••" className="w-full pl-12 pr-4 py-4 bg-slate-900 border-2 border-slate-800 rounded-2xl text-white outline-none focus:border-blue-600 font-bold" />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                {authMode === 'login' ? 'Aceder Agora' : 'Finalizar Registo'}
                <ArrowRight size={18} />
              </button>
            </form>
            <div className="mt-8 text-center">
              <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-blue-400 transition-colors">
                {authMode === 'login' ? 'Ainda não tem conta? Registe-se' : 'Já tem conta? Inicie sessão'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <aside className="w-full md:w-64 bg-slate-950 text-white p-6 flex flex-col sticky top-0 md:h-screen z-40 shadow-2xl">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/30"><Boxes size={24} /></div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">StokMaster</h1>
        </div>
        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold ${activeTab === 'dashboard' ? 'bg-blue-600 shadow-xl' : 'hover:bg-white/5 text-slate-400'}`}><LayoutDashboard size={20} /> Painel</button>
          <button onClick={() => setActiveTab('stock')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold ${activeTab === 'stock' ? 'bg-blue-600 shadow-xl' : 'hover:bg-white/5 text-slate-400'}`}><Package size={20} /> Inventário</button>
          <button onClick={() => setActiveTab('cashflow')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold ${activeTab === 'cashflow' ? 'bg-blue-600 shadow-xl' : 'hover:bg-white/5 text-slate-400'}`}><TrendingUp size={20} /> Caixa</button>
        </nav>
        <div className="mt-auto pt-6 border-t border-white/10 space-y-4">
          <div className="px-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Sessão Ativa</p>
            <p className="text-xs font-bold truncate text-blue-400">{userEmail}</p>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-rose-400 hover:bg-rose-500/10 group transition-all">
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" /> 
            Terminar Sessão
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">StokMaster</h2>
            <p className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mt-1">Dados Isolados: {userEmail}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setCreationMode('RETAIL'); setShowProductModal(true); }} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl hover:bg-blue-600 shadow-xl transition-all font-black uppercase text-xs tracking-widest"><PlusCircle size={18} /> Novo Produto</button>
            <button onClick={() => setShowTransactionModal({ show: true, type: 'SALE' })} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-2xl hover:bg-emerald-700 shadow-xl transition-all font-black uppercase text-xs tracking-widest"><ShoppingCart size={18} /> Registar Venda</button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white border-none shadow-emerald-100 shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[12px] font-black uppercase tracking-[0.15em] text-emerald-600">Entradas de Caixa</span>
                    <ArrowUpCircle size={28} className="text-emerald-500" />
                  </div>
                  <p className="text-5xl font-black tracking-tighter text-emerald-600 drop-shadow-sm">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-emerald-900 group-hover:scale-110 transition-transform"><ArrowUpCircle size={140} /></div>
              </Card>
              <Card className="bg-white border-none shadow-rose-100 shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[12px] font-black uppercase tracking-[0.15em] text-rose-600">Saídas de Caixa</span>
                    <ArrowDownCircle size={28} className="text-rose-500" />
                  </div>
                  <p className="text-5xl font-black tracking-tighter text-rose-600 drop-shadow-sm">{formatCurrency(stats.totalExpenses)}</p>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-rose-900 group-hover:scale-110 transition-transform"><ArrowDownCircle size={140} /></div>
              </Card>
              <Card className="bg-white border-none shadow-blue-100 shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[12px] font-black uppercase tracking-[0.15em] text-blue-600">Saldo Actual do Caixa</span>
                    <Wallet size={28} className="text-blue-500" />
                  </div>
                  <p className="text-5xl font-black tracking-tighter text-blue-600 drop-shadow-sm">{formatCurrency(stats.netBalance)}</p>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-blue-900 group-hover:scale-110 transition-transform"><Wallet size={140} /></div>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="min-h-[400px]">
                <h3 className="font-black text-slate-900 mb-8 uppercase tracking-widest text-xs">Análise de Fluxo</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[{ name: 'Entradas', valor: stats.totalRevenue }, { name: 'Saídas', valor: stats.totalExpenses }]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: '#f8fafc'}} formatter={(v: any) => formatCurrency(Number(v))} />
                    <Bar dataKey="valor" radius={[12, 12, 0, 0]} barSize={80}>
                      <Cell fill="#059669" />
                      <Cell fill="#e11d48" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <h3 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">Movimentos Recentes</h3>
                <div className="space-y-4">
                  {transactions.slice(0, 6).map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${t.type === 'SALE' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{t.type === 'SALE' ? <Tag size={18} /> : <MinusCircle size={18} />}</div>
                        <div>
                          <p className="font-black text-sm text-slate-900 uppercase tracking-tight">{t.description}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(t.date).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className={`font-black text-sm ${t.type === 'SALE' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'SALE' ? '+' : '-'} {formatCurrency(t.value)}</span>
                    </div>
                  ))}
                  {transactions.length === 0 && <div className="py-12 text-center text-slate-400 text-xs italic font-medium uppercase tracking-widest">Sem movimentos registrados...</div>}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
            <Card className="py-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                <div className="md:col-span-4 relative">
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Pesquisar</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Designação..." className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
                <div className="md:col-span-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Categoria</label>
                  <select className="w-full px-4 py-4 bg-slate-100 border-none rounded-2xl text-sm outline-none font-bold appearance-none uppercase" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    {categories.map(cat => (<option key={cat} value={cat}>{cat === 'all' ? 'Todas' : cat.toUpperCase()}</option>))}
                  </select>
                </div>
                <div className="md:col-span-2 md:col-start-11">
                  <button onClick={handleExportStockCSV} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl hover:bg-slate-950 transition-all font-black uppercase text-[10px] tracking-widest"><FileSpreadsheet size={16} /> Exportar</button>
                </div>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden shadow-2xl border-none rounded-3xl">
              <div className="bg-slate-950 px-8 py-5 flex items-center justify-between">
                <h4 className="text-white text-[10px] font-black uppercase tracking-widest">Inventário Central ({userEmail})</h4>
                <span className="bg-blue-600 text-[10px] text-white px-4 py-1.5 rounded-full font-black uppercase">{filteredProducts.length} Itens</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 font-black text-[10px] uppercase text-slate-400">
                    <tr><th className="py-6 px-8">Item</th><th className="py-6 px-4">Preço</th><th className="py-6 px-4 text-center">Stock</th><th className="py-6 px-8 text-center">Acção</th></tr>
                  </thead>
                  <tbody className="text-sm font-bold">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-6 px-8">
                          <span className="text-slate-900 block text-lg">{p.name}</span>
                          <span className="text-[9px] uppercase font-black text-slate-400">{p.category} • {p.type}</span>
                        </td>
                        <td className="py-6 px-4 text-slate-900 font-black">{formatCurrency(p.price)}</td>
                        <td className="py-6 px-4 text-center"><span className={`px-4 py-1.5 rounded-xl ${p.stock <= 5 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-800'}`}>{p.stock}</span></td>
                        <td className="py-6 px-8 text-center"><button onClick={() => setShowTransactionModal({ show: true, type: 'ENTRY', preSelectedId: p.id })} className="bg-blue-600 text-white text-[10px] font-black uppercase px-5 py-2.5 rounded-xl">Repor</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'cashflow' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
            <Card className="py-8 bg-blue-900 border-none shadow-blue-200 shadow-2xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-white/10 p-4 rounded-3xl text-blue-100"><Coins size={32} /></div>
                  <div>
                    <h4 className="text-white text-xs font-black uppercase tracking-widest">Investimento Inicial</h4>
                    <p className="text-[10px] text-blue-300 uppercase mt-1 italic font-bold">Controle o seu capital de entrada</p>
                  </div>
                </div>
                <div className="relative md:w-64">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400 font-black text-sm">Kz</span>
                  <input type="number" value={initialInvestment} onChange={(e) => setInitialInvestment(Number(e.target.value))} className="w-full pl-12 pr-5 py-4 bg-white/10 border-none rounded-2xl text-white text-lg font-black outline-none" />
                </div>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden rounded-3xl shadow-2xl border-none">
              <div className="bg-slate-950 p-8 flex items-center justify-between text-white">
                <h4 className="text-xs font-black uppercase tracking-widest">Relatório de Caixa</h4>
                <button onClick={handleExportTransactionsCSV} className="bg-white/10 p-3 rounded-2xl text-blue-400 transition-all"><Download size={22} /></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 font-black text-[10px] uppercase text-slate-400">
                    <tr><th className="py-6 px-8">Data</th><th className="py-6 px-4">Movimento</th><th className="py-6 px-8 text-right">Montante</th></tr>
                  </thead>
                  <tbody className="text-sm font-bold">
                    <tr className="border-b border-slate-100 bg-blue-50/30 italic">
                      <td className="py-6 px-8 text-slate-400">—</td>
                      <td className="py-6 px-4"><span className="text-[9px] px-2.5 py-1 rounded-md font-black uppercase bg-blue-100 text-blue-700">INVESTIMENTO</span></td>
                      <td className="py-6 px-8 text-right text-lg font-black text-blue-600">{formatCurrency(initialInvestment)}</td>
                    </tr>
                    {transactions.map(t => (
                      <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-6 px-8 text-slate-500">{new Date(t.date).toLocaleString()}</td>
                        <td className="py-6 px-4">
                          <span className={`text-[9px] px-2.5 py-1 rounded-md font-black uppercase ${t.type === 'SALE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{t.type === 'SALE' ? 'ENTRADA' : 'SAÍDA'}</span>
                          <span className="block text-[10px] text-slate-400 mt-1">{t.description}</span>
                        </td>
                        <td className={`py-6 px-8 text-right text-lg font-black ${t.type === 'SALE' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'SALE' ? '+' : '-'} {formatCurrency(t.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {showProductModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 overflow-y-auto">
            <Card className="w-full max-w-4xl p-0 overflow-hidden rounded-[2.5rem] my-8 border-none animate-in zoom-in-95 duration-300">
              <div className="bg-slate-900 p-10 flex justify-between items-start text-white">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">Novo Produto</h3>
                <button onClick={() => setShowProductModal(false)} className="bg-white/10 p-3 rounded-2xl text-slate-300 hover:bg-rose-600 font-bold">&times;</button>
              </div>
              <div className="p-10 bg-white space-y-8">
                <div className="flex gap-4">
                   <button type="button" onClick={() => setCreationMode('RETAIL')} className={`flex-1 p-6 rounded-3xl border-4 transition-all ${creationMode === 'RETAIL' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-100 text-slate-400'}`}>
                      <User size={24} className="mb-2" />
                      <p className="font-black uppercase text-sm">Retalho</p>
                   </button>
                   <button type="button" onClick={() => setCreationMode('WHOLESALE')} className={`flex-1 p-6 rounded-3xl border-4 transition-all ${creationMode === 'WHOLESALE' ? 'border-amber-600 bg-amber-50 text-amber-900' : 'border-slate-100 text-slate-400'}`}>
                      <Users size={24} className="mb-2" />
                      <p className="font-black uppercase text-sm">Grosso</p>
                   </button>
                </div>
                <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <input required name="product_name" placeholder="Designação" className="w-full p-5 border-4 border-slate-100 rounded-3xl text-lg font-black outline-none focus:border-blue-600" />
                    <input required name="product_category" placeholder="Categoria" className="w-full p-5 border-4 border-slate-100 rounded-3xl text-lg font-black outline-none focus:border-blue-600" />
                  </div>
                  <div className="space-y-4 bg-slate-50 p-6 rounded-3xl">
                    <input required name="product_price" type="number" step="0.01" placeholder="Preço de Venda" className="w-full p-5 border-4 border-white rounded-2xl text-xl font-black outline-none shadow-sm focus:border-blue-200" />
                    <div className="grid grid-cols-2 gap-4">
                      <input required name="product_cost" type="number" step="0.01" placeholder="Custo Compra" className="w-full p-4 border-4 border-white rounded-2xl font-black" />
                      <input required name="product_stock" type="number" placeholder="Qtd Inicial" className="w-full p-4 border-4 border-white rounded-2xl font-black" />
                    </div>
                  </div>
                  <button type="submit" className="md:col-span-2 py-6 rounded-3xl font-black uppercase text-white bg-blue-600 hover:bg-blue-700 tracking-widest">Registar Artigo</button>
                </form>
              </div>
            </Card>
          </div>
        )}

        {showTransactionModal.show && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg p-0 overflow-hidden rounded-[2.5rem] border-none animate-in slide-in-from-top-12">
              <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
                <h3 className="text-2xl font-black uppercase italic">{showTransactionModal.type === 'SALE' ? 'Registar Venda' : 'Repor Stock'}</h3>
                <button onClick={() => setShowTransactionModal({ ...showTransactionModal, show: false })} className="text-white text-2xl font-bold">&times;</button>
              </div>
              <form onSubmit={handleProcessTransaction} className="p-10 space-y-6 bg-white">
                <select required name="productId" defaultValue={showTransactionModal.preSelectedId} className="w-full p-5 border-4 border-slate-100 rounded-3xl text-lg font-black outline-none bg-slate-50">
                  <option value="">Escolha um item...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()} ({p.type})</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input required name="quantity" type="number" min="1" placeholder="Qtd" className="w-full p-5 border-4 border-slate-100 rounded-3xl font-black text-xl" />
                  {showTransactionModal.type === 'ENTRY' && <input required name="unitCost" type="number" step="0.01" placeholder="Custo" className="w-full p-5 border-4 border-slate-100 rounded-3xl font-black text-xl" />}
                </div>
                <button type="submit" className={`w-full py-6 rounded-3xl font-black uppercase text-white shadow-xl ${showTransactionModal.type === 'SALE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}>Confirmar Movimento</button>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

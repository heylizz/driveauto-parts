const DB_KEYS = {
  products: 'da_products',
  users: 'da_users',
  session: 'da_session',
  cart: 'da_cart',
  orders: 'da_orders'
};

const Store = {

  read(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  },
  write(key, value){ localStorage.setItem(key, JSON.stringify(value)); },

  seed(){
    if(!localStorage.getItem(DB_KEYS.products)){
      this.write(DB_KEYS.products, DEFAULT_PRODUCTS);
    }
    if(!localStorage.getItem(DB_KEYS.users)){
      this.write(DB_KEYS.users, [
        { id:'u-admin', name:'Admin Toko', email:'admin@gmail.com', phone:'081234567890', password:'admin123', role:'admin' },
        { id:'u-demo', name:'Nurkholis Anwari', email:'holis@gmail.com', phone:'081298765432', password:'holis123', role:'buyer' }
      ]);
    }
    if(!localStorage.getItem(DB_KEYS.orders)) this.write(DB_KEYS.orders, []);
    if(!localStorage.getItem(DB_KEYS.cart)) this.write(DB_KEYS.cart, []);
  },

  // ---------- products ----------
  getProducts(){ return this.read(DB_KEYS.products, []); },
  saveProducts(list){ this.write(DB_KEYS.products, list); },
  getProduct(id){ return this.getProducts().find(p => p.id === id); },
  upsertProduct(product){
    const list = this.getProducts();
    const i = list.findIndex(p => p.id === product.id);
    if(i > -1) list[i] = product; else list.unshift(product);
    this.saveProducts(list);
  },
  deleteProduct(id){
    this.saveProducts(this.getProducts().filter(p => p.id !== id));
  },

  // ---------- users / session ----------
  getUsers(){ return this.read(DB_KEYS.users, []); },
  saveUsers(list){ this.write(DB_KEYS.users, list); },
  findUserByEmail(email){
    return this.getUsers().find(u => u.email.toLowerCase() === String(email).toLowerCase());
  },
  registerUser({ name, email, phone, password }){
    if(this.findUserByEmail(email)) return { ok:false, message:'Email sudah terdaftar.' };
    const user = { id:'u-' + Date.now(), name, email, phone, password, role:'buyer' };
    const list = this.getUsers(); list.push(user); this.saveUsers(list);
    return { ok:true, user };
  },
  login(email, password){
    const user = this.findUserByEmail(email);
    if(!user || user.password !== password) return { ok:false, message:'Email atau kata sandi salah.' };
    this.write(DB_KEYS.session, { userId:user.id });
    return { ok:true, user };
  },
  logout(){ localStorage.removeItem(DB_KEYS.session); },
  getSessionUser(){
    const session = this.read(DB_KEYS.session, null);
    if(!session) return null;
    return this.getUsers().find(u => u.id === session.userId) || null;
  },

  // ---------- cart ----------
  getCart(){ return this.read(DB_KEYS.cart, []); },
  saveCart(cart){ this.write(DB_KEYS.cart, cart); },
  addToCart(productId, qty = 1){
    const cart = this.getCart();
    const line = cart.find(c => c.productId === productId);
    if(line) line.qty += qty; else cart.push({ productId, qty });
    this.saveCart(cart);
  },
  updateCartQty(productId, qty){
    let cart = this.getCart();
    if(qty <= 0){ cart = cart.filter(c => c.productId !== productId); }
    else{ const line = cart.find(c => c.productId === productId); if(line) line.qty = qty; }
    this.saveCart(cart);
  },
  removeFromCart(productId){
    this.saveCart(this.getCart().filter(c => c.productId !== productId));
  },
  clearCart(){ this.saveCart([]); },
  cartCount(){ return this.getCart().reduce((sum, c) => sum + c.qty, 0); },
  cartDetailed(){
    const products = this.getProducts();
    return this.getCart().map(c => {
      const p = products.find(p => p.id === c.productId);
      return p ? { ...c, product:p, subtotal:p.price * c.qty } : null;
    }).filter(Boolean);
  },

  // ---------- orders ----------
  getOrders(){ return this.read(DB_KEYS.orders, []); },
  getOrdersByUser(userId){ return this.getOrders().filter(o => o.userId === userId); },
  createOrder(order){
    const list = this.getOrders();
    list.unshift(order);
    this.write(DB_KEYS.orders, list);
  },
  updateOrderStatus(orderId, status){
    const list = this.getOrders();
    const order = list.find(o => o.id === orderId);
    if(order) order.status = status;
    this.write(DB_KEYS.orders, list);
  }
};

const DEFAULT_PRODUCTS = [
  { id:'p01', code:'OLI-MDT-40-1L', name:'Oli Mesin Meditran S SAE 40 1 Liter', category:'oli', compat:'Motor', price:75000, stock:24, img:'assets/img/olimeds.png' },
  { id:'p02', code:'OLI-DLB-5L', name:'Oli Mesin Deltalube 5 Liter', category:'oli', compat:'Mobil', price:145000, stock:15, img:'assets/img/olideltalube.png' },
  { id:'p03', code:'OLI-RRD-5L', name:'Oli Mesin Rored 5 Liter', category:'oli', compat:'Mobil', price:145000, stock:12, img:'assets/img/olirored.png' },
  { id:'p04', code:'OLI-MDX-1L', name:'Oli Mesin Meditran SX 1 Liter', category:'oli', compat:'Mobil', price:110000, stock:20, img:'assets/img/olimedsx.png' },
  { id:'p05', code:'OLI-PMX-5L', name:'Oli Mesin Prima XP 5 Liter', category:'oli', compat:'Mobil', price:120000, stock:18, img:'assets/img/oliprima.png' },
  { id:'p06', code:'CRN-MR-1000', name:'Minyak Rem Prestone 1000 ml', category:'oli', compat:'Mobil & Motor', price:90000, stock:16, img:'assets/img/minyakrem.jpg' },
  { id:'p07', code:'CRN-CLT-4L', name:'Coolant Radiator Master 4 Liter', category:'oli', compat:'Mobil', price:80000, stock:10, img:'assets/img/coolantmaster.jpg' },
  { id:'p08', code:'REM-KC-585622', name:'Kampas Rem Canter HDX', category:'rem', compat:'Mobil & Truk', price:215000, stock:9, img:'assets/img/kampascanter.png' },
  { id:'p09', code:'REM-HDX-01', name:'Kampas Rem HDX', category:'rem', compat:'Mobil', price:215000, stock:11, img:'assets/img/k.remhdx.jpeg' },
  { id:'p10', code:'REM-STD-01', name:'Kampas Rem Standar', category:'rem', compat:'Mobil', price:210000, stock:3, img:'assets/img/kampas.jpg' },
  { id:'p11', code:'LIS-BLM-24V', name:'Lampu Bohlam 24V', category:'listrik', compat:'Mobil', price:10000, stock:4, img:'assets/img/lampu24w.jpg' },
  { id:'p12', code:'LIS-RM-24V', name:'Lampu Rem 24V Stanlee', category:'listrik', compat:'Mobil', price:15000, stock:22, img:'assets/img/lampurem.jpg' },
  { id:'p13', code:'LIS-BLM-12V', name:'Lampu Bohlam 12V Philips', category:'listrik', compat:'Mobil', price:8000, stock:30, img:'assets/img/lampu12v.jpg' },
  { id:'p14', code:'MSN-BN-14', name:'Baut Nap 14', category:'mesin', compat:'Mobil', price:5000, stock:50, img:'assets/img/b.nap14.png' },
  { id:'p15', code:'MSN-BR-PSB', name:'Baut Roda PS Belakang', category:'mesin', compat:'Mobil', price:70000, stock:14, img:'assets/img/b.rdpsblkg.jpg' },
  { id:'p16', code:'MSN-FU-RHT', name:'Filter Udara Rino HT', category:'mesin', compat:'Mobil', price:95000, stock:13, img:'assets/img/filterudararinoht.jpg' },
  { id:'p17', code:'MSN-FO-PS125', name:'Filter Oli PS125', category:'mesin', compat:'Mobil', price:70000, stock:17, img:'assets/img/filterolips125.jpg' },
  { id:'p18', code:'MSN-FS-CTRPS', name:'Filter Solar Canter PS', category:'mesin', compat:'Mobil', price:85000, stock:8, img:'assets/img/filtersolarctrps.jpg' },
  { id:'p19', code:'MSN-BUSI-NGK', name:'Busi Motor NGK Iridium SparkFire', category:'mesin', compat:'Motor', price:15000, stock:40, img:'assets/img/busimotorngk.jpg' },


  { id:'p20', code:'REM-CP-ELF', name:'Kampas Rem Elf', category:'rem', compat:'Truk', price:180000, stock:6, img:'assets/img/cupremelf.png' },
  { id:'p21', code:'REM-CP-HT', name:'Kampas Rem HT', category:'rem', compat:'Truk', price:190000, stock:6, img:'assets/img/cupremht.png' },
  { id:'p22', code:'MSN-MUR-RD', name:'Mur Roda', category:'mesin', compat:'Mobil', price:8000, stock:40, img:'assets/img/b.rdnut.jpg' },
  { id:'p23', code:'MSN-BR-PSD', name:'Baut Roda PS Depan', category:'mesin', compat:'Mobil', price:70000, stock:10, img:'assets/img/b.rdps.jpg' },
  { id:'p24', code:'MSN-BR-CTRDK', name:'Baut Roda Canter Depan Kanan', category:'mesin', compat:'Truk', price:75000, stock:8, img:'assets/img/bautrodacanterdpnkanan.jpg' },
  { id:'p25', code:'MSN-LK-ELF', name:'Laker Roda Elf', category:'mesin', compat:'Truk', price:120000, stock:7, img:'assets/img/l.rdelf.png' },
  { id:'p26', code:'MSN-LK-PS', name:'Laker Roda PS', category:'mesin', compat:'Mobil', price:115000, stock:9, img:'assets/img/l.rdPS.png' },
  { id:'p27', code:'MSN-LK-CST', name:'Laker Roda Custom', category:'mesin', compat:'Universal', price:110000, stock:5, img:'assets/img/lakerrodacustom.jpg' },
  { id:'p28', code:'MSN-BN-16', name:'Baut Nap 16', category:'mesin', compat:'Mobil', price:6000, stock:45, img:'assets/img/nap16.jpg' },
  { id:'p29', code:'OLI-PRX-01', name:'Oli Persneling X', category:'oli', compat:'Mobil', price:95000, stock:12, img:'assets/img/olipersx.png' }
];

Store.seed();

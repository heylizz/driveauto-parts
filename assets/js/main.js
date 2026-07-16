
function formatRupiah(n){
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

const CATEGORY_LABELS = {
  oli: 'Oli & Cairan',
  rem: 'Rem & Suspensi',
  listrik: 'Kelistrikan',
  mesin: 'Mesin & Filter'
};

function showToast(message, icon = 'bi-check-circle'){
  let toast = document.querySelector('.toast');
  if(!toast){
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="bi ${icon}"></i><span></span>`;
  toast.querySelector('span').textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2400);
}

function refreshNavState(){
  const cartBadge = document.querySelector('[data-cart-count]');
  if(cartBadge){
    const count = Store.cartCount();
    cartBadge.textContent = count;
    cartBadge.style.display = count > 0 ? 'flex' : 'none';
  }

  const authSlot = document.querySelector('[data-auth-slot]');
  if(authSlot){
    const user = Store.getSessionUser();
    if(user){
      const target = user.role === 'admin' ? 'admin.html' : 'akun.html';
      authSlot.innerHTML = `
        <a href="${target}" class="user-chip">
          <i class="bi bi-person-fill"></i> ${user.name.split(' ')[0]}
        </a>`;
    }else{
      authSlot.innerHTML = `<a href="login.html" class="btn btn-outline btn-sm"><i class="bi bi-box-arrow-in-right"></i> Masuk</a>`;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // footer year
  document.querySelectorAll('#current-year').forEach(el => el.textContent = new Date().getFullYear());

  // mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if(navToggle && navLinks){
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  refreshNavState();

  // add-to-cart buttons (data-add-to-cart="productId")
  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      Store.addToCart(btn.getAttribute('data-add-to-cart'), 1);
      refreshNavState();
      showToast('Produk ditambahkan ke keranjang', 'bi-cart-check-fill');
    });
  });


  // product search + filter (produk.html)
  const searchInput = document.getElementById('product-search');
  const filterBar = document.querySelector('.filter-bar');
  if(searchInput || filterBar){
    const cards = document.querySelectorAll('[data-category]');
    const emptyState = document.getElementById('empty-state');
    let activeFilter = 'all';

    const applyFilters = () => {
      const q = (searchInput?.value || '').toLowerCase().trim();
      let visible = 0;
      cards.forEach(card => {
        const matchCat = activeFilter === 'all' || card.getAttribute('data-category') === activeFilter;
        const matchQuery = card.getAttribute('data-name').toLowerCase().includes(q);
        const show = matchCat && matchQuery;
        card.style.display = show ? '' : 'none';
        if(show) visible++;
      });
      if(emptyState) emptyState.style.display = visible === 0 ? 'block' : 'none';
    };

    searchInput?.addEventListener('input', applyFilters);
    filterBar?.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        filterBar.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-filter');
        applyFilters();
      });
    });
  }

  // contact form validation (kontak.html)
  const contactForm = document.getElementById('contact-form');
  if(contactForm){
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      const name = document.getElementById('f-name');
      const email = document.getElementById('f-email');
      const phone = document.getElementById('f-phone');
      const message = document.getElementById('f-message');

      const setErr = (input, errId, msg) => {
        document.getElementById(errId).textContent = msg;
        if(msg) valid = false;
      };

      setErr(name, 'err-name', name.value.trim() ? '' : 'Nama wajib diisi.');
      setErr(email, 'err-email', /^\S+@\S+\.\S+$/.test(email.value) ? '' : 'Email tidak valid.');
      setErr(phone, 'err-phone', phone.value.trim().length >= 9 ? '' : 'Nomor telepon tidak valid.');
      setErr(message, 'err-message', message.value.trim() ? '' : 'Pesan wajib diisi.');

      if(!valid) return;
      showToast('Pesan berhasil dikirim, kami akan segera merespons.', 'bi-send-check-fill');
      contactForm.reset();
    });
  }
});

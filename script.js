let selectedImageBase64 = "";
let cart = []; 
let currentDiscountPercent = 0; // تغییر ساختار کوپن به درصد پویا

const DEFAULT_PLACEHOLDER_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 100 100'><rect width='100%25' height='100%25' fill='%23eee'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='10' fill='%23aaa'>بدون تصویر</text></svg>";

// لیست تمام کدهای تخفیف بازارچه مای کاغذ
const COUPONS_MARKET = [
    { id: "PAP10", title: "کد تخفیف ۱۰٪ عمومی", cost: 1, percent: 10 },
    { id: "PAP20", title: "کد تخفیف ۲۰٪ برنزی", cost: 2, percent: 20 },
    { id: "PAP30", title: "کد تخفیف ۳۰٪ نقره‌ای", cost: 3, percent: 30 },
    { id: "PAP40", title: "کد تخفیف ۴۰٪ طلایی", cost: 4, percent: 40 },
    { id: "PAP50", title: "کد تخفیف ۵۰٪ سایبر", cost: 5, percent: 50 }
];

function initThemeOnLoad() {
    const savedTheme = localStorage.getItem('cyber_theme') || 'light';
    const selector = document.getElementById('themeSelector');
    if (selector) selector.value = savedTheme;
    applyThemeClass(savedTheme);
    updateCoinDisplay();
    renderCouponsMarket();
    renderOwnedCouponsList();
}

function changeCyberTheme() {
    const theme = document.getElementById('themeSelector').value;
    localStorage.setItem('cyber_theme', theme);
    applyThemeClass(theme);
}

function applyThemeClass(theme) {
    document.body.className = ""; 
    if (theme === 'dark') document.body.classList.add('dark-theme-simple');
    if (theme === 'matrix') document.body.classList.add('matrix-mode');
    if (theme === 'neon-pulse') document.body.classList.add('neon-pulse-mode');
}

function updateCoinDisplay() {
    let coins = parseInt(localStorage.getItem('cyber_user_coins')) || 0;
    const coinEl = document.getElementById('userCoins');
    if (coinEl) coinEl.textContent = coins.toLocaleString('fa-IR');
}

function playRetroSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        oscillator.connect(gainNode); gainNode.connect(audioCtx.destination);
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {}
}

function initMagnifier(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const img = container.querySelector('img');
    
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        img.style.transformOrigin = `${x}% ${y}%`;
        img.style.transform = "scale(1.8)";
    });
    
    container.addEventListener('mouseleave', () => {
        img.style.transform = "scale(1)";
        img.style.transformOrigin = "center center";
    });
}

function toggleAmazingOptions() {
    const isChecked = document.getElementById('isAmazing').checked;
    const optionsBox = document.getElementById('amazingOptions');
    if(optionsBox) optionsBox.style.display = isChecked ? 'block' : 'none';
}

function previewImage(event) {
    const input = event.target;
    const preview = document.getElementById('imgPreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result; 
            preview.style.display = 'block';
            selectedImageBase64 = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// ثبت کالای جدید در پنل مدیریت
const productForm = document.getElementById('productForm');
if (productForm) {
    productForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const title = document.getElementById('prodTitle').value.trim();
        const price = parseInt(document.getElementById('prodPrice').value);
        const stock = parseInt(document.getElementById('prodStock').value) || 0;
        const desc = document.getElementById('prodDesc').value.trim();
        const isAmazing = document.getElementById('isAmazing').checked;
        const image = selectedImageBase64 || DEFAULT_PLACEHOLDER_IMAGE;

        let discountPercent = 0;
        let endTime = null;

        if (isAmazing) {
            discountPercent = parseInt(document.getElementById('discountPercent').value) || 0;
            const durationMinutes = parseInt(document.getElementById('discountDuration').value) || 1;
            endTime = Date.now() + (durationMinutes * 60 * 1000);
        }

        const newProduct = { 
            id: Date.now(), title, price, stock, desc, isAmazing, discountPercent, endTime, image, comments: [], questions: [] 
        };
        
        let products = JSON.parse(localStorage.getItem('digi_cyber_products')) || [];
        products.push(newProduct);
        localStorage.setItem('digi_cyber_products', JSON.stringify(products));

        alert("🎉 کالا با موفقیت در ویترین منتشر شد!");
        productForm.reset();
        if(document.getElementById('amazingOptions')) document.getElementById('amazingOptions').style.display = 'none';
        document.getElementById('imgPreview').style.display = 'none';
        selectedImageBase64 = "";
    });
}

// رندر کارت‌های کالا در ویترین مغازه
function displayProducts(filteredList) {
    const container = document.getElementById('shopContainer');
    if (!container) return; 
    container.innerHTML = "";
    
    let products = filteredList || JSON.parse(localStorage.getItem('digi_cyber_products')) || [];

    if(products.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#999; grid-column:1/-1;">هیچ کالایی موجود نیست.</p>`;
        return;
    }

    products.forEach((prod) => {
        const card = document.createElement('div');
        card.className = 'product-card';

        let finalPrice = prod.price;
        if(prod.isAmazing && prod.endTime && Date.now() < prod.endTime) {
            finalPrice = prod.price * ((100 - prod.discountPercent) / 100);
        }

        let stockValue = prod.stock !== undefined ? prod.stock : 0;
        let tagsHTML = `<div class="auto-tags-container">`;
        if (stockValue === 0) tagsHTML += `<span class="tag-badge tag-out">🚫 ناموجود</span>`;
        else if (stockValue <= 2) tagsHTML += `<span class="tag-badge tag-limited">🔥 آخرین قطعات!</span>`;
        if (finalPrice >= 200000) tagsHTML += `<span class="tag-badge tag-luxury">💎 لاکچری</span>`;
        if (finalPrice <= 30000) tagsHTML += `<span class="tag-badge tag-cheap">🎈 اقتصادی</span>`;
        tagsHTML += `</div>`;

        let wishlist = JSON.parse(localStorage.getItem('cyber_wishlist')) || [];
        let isLiked = wishlist.includes(prod.id);

        // افزودن دکمه شارژ مجدد در صورت اتمام موجودی کالا
        let stockControlHTML = "";
        if(stockValue === 0) {
            stockControlHTML = `
                <div style="margin-top: 5px; display: flex; gap: 3px;">
                    <input type="number" id="restockInput_${prod.id}" min="1" placeholder="تعداد شارژ" style="padding:4px; font-size:11px; width:70px;">
                    <button onclick="event.stopPropagation(); restockProduct(${prod.id})" style="background:#2ecc71; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;">➕ شارژ</button>
                </div>
            `;
        }

        card.innerHTML = `
            <button class="delete-btn" onclick="event.stopPropagation(); deleteProduct(${prod.id})">❌</button>
            <div class="product-link-area" onclick="goToDetails(${prod.id})">
                <img src="${prod.image}">
                ${tagsHTML}
                <h3 style="margin:5px 0 0 0;">${prod.title}</h3>
                <div style="font-size:12px; color:#888; margin-top:2px;">موجودی: ${stockValue} عدد</div>
                <div class="price" style="margin-top:5px; color:#e61c4d; font-weight:bold;">${finalPrice.toLocaleString('fa-IR')} تومان</div>
            </div>
            
            ${stockControlHTML}

            <div class="action-row">
                <button class="action-btn" onclick="event.stopPropagation(); toggleWishlist(${prod.id})">${isLiked ? '❤️' : '🤍'} لایک</button>
                <button class="action-btn" onclick="event.stopPropagation(); shareProduct('${prod.title}', ${prod.id})">🔗 اشتراک</button>
            </div>
            <button class="buy-btn" onclick="event.stopPropagation(); addToCart(${prod.id})" ${stockValue === 0 ? 'disabled style="background:#ccc; border:none; color:#666;"' : ''}>
                ${stockValue === 0 ? '🚫 اتمام موجودی' : '🛒 خرید سریع'}
            </button>
        `;
        container.appendChild(card);
    });
}

// تابع افزایش دادن موجودی کالا در صورتی که ناموجود شده باشد
function restockProduct(prodId) {
    const inputEl = document.getElementById(`restockInput_${prodId}`);
    const amount = parseInt(inputEl.value) || 0;
    if(amount <= 0) { alert("تعداد معتبری برای شارژ وارد کنید!"); return; }

    let products = JSON.parse(localStorage.getItem('digi_cyber_products')) || [];
    const idx = products.findIndex(p => p.id === prodId);
    if(idx !== -1) {
        products[idx].stock = (products[idx].stock || 0) + amount;
        localStorage.setItem('digi_cyber_products', JSON.stringify(products));
        alert(`📦 کالا با موفقیت به تعداد ${amount} عدد شارژ شد.`);
        displayProducts();
    }
}

function goToDetails(prodId) {
    window.location.href = `product-details.html?id=${prodId}`;
}

// نمایش صفحه جزئیات کالا
function loadProductDetails() {
    const container = document.getElementById('detailsContainer');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const prodId = parseInt(urlParams.get('id'));

    let products = JSON.parse(localStorage.getItem('digi_cyber_products')) || [];
    const prod = products.find(p => p.id === prodId);

    if (!prod) { container.innerHTML = "<h2>❌ کالا یافت نشد!</h2>"; return; }

    let stockValue = prod.stock !== undefined ? prod.stock : 0;

    let notifyHTML = "";
    if (stockValue === 0) {
        notifyHTML = `
            <div class="shipping-progress-container" style="border: 1px dashed #ff9900; background:rgba(255,153,0,0.1); margin: 15px 0;">
                📢 <strong>این کالا ناموجود است!</strong> موجود شد باخبرت کنیم؟
                <div class="coupon-box" style="margin-top:5px;">
                    <input type="text" id="notifyName" placeholder="نام خود را بنویس">
                    <button onclick="registerNotification(${prod.id})" style="background:#ff9900; border-radius:8px; color:white; border:none; padding:5px 10px; cursor:pointer;">🔔 خبرم کن</button>
                </div>
                <div style="margin-top: 10px; border-top: 1px solid #ff9900; padding-top: 5px;">
                    <label style="font-size:11px;">🛠️ شارژ سریع انبار (مدیریتی):</label>
                    <div style="display:flex; gap:5px;">
                        <input type="number" id="detailRestockInput" placeholder="چند کالا موجود شد؟" style="padding:5px;">
                        <button onclick="restockFromDetails(${prod.id})" style="background:#2ecc71; border:none; color:white; padding:5px; border-radius:6px; cursor:pointer;">ثبت</button>
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="zoom-container" id="magnifierBox">
            <img src="${prod.image}">
        </div>
        <div class="big-product-title">${prod.title}</div>
        <p>وضعیت انبار: <strong>${stockValue === 0 ? 'اتمام موجودی' : stockValue + ' عدد موجود'}</strong></p>
        <div class="big-product-desc">${prod.desc}</div>
        
        ${notifyHTML}
        <button class="submit-btn" onclick="addToCart(${prod.id})" ${stockValue === 0 ? 'disabled' : ''}>🛒 افزودن به سبد خرید</button>
        
        <div class="comments-box">
            <div class="comment-title" style="font-size:16px;">💬 نظرات خریداران:</div>
            <div class="comments-list" id="commentsBoxContainer"></div>
            <div class="comment-input-group">
                <div class="comment-inputs-row">
                    <input type="text" id="cName" placeholder="نام شما" style="width:120px;">
                    <select id="cAvatar" style="width:120px; padding:5px;">
                        <option value="🤖">🤖 ربات هکر</option>
                        <option value="🐱">🐱 گربه نئونی</option>
                        <option value="🥷">🥷 نینجا وب</option>
                        <option value="👾">👾 موجود فضایی</option>
                    </select>
                </div>
                <input type="text" id="cText" placeholder="متن نظر شما...">
                <button onclick="addAdvancedComment(${prod.id})" style="background:#e61c4d; color:white; font-weight:bold; border-radius:8px; padding:8px; border:none; cursor:pointer; margin-top:5px;">ارسال نظر</button>
            </div>
        </div>
    `;

    initMagnifier('magnifierBox'); 
    renderCommentsAndQA(prod);
}

function restockFromDetails(prodId) {
    const val = parseInt(document.getElementById('detailRestockInput').value) || 0;
    if(val <= 0) return;
    let products = JSON.parse(localStorage.getItem('digi_cyber_products')) || [];
    const idx = products.findIndex(p => p.id === prodId);
    if(idx !== -1) {
        products[idx].stock = (products[idx].stock || 0) + val;
        localStorage.setItem('digi_cyber_products', JSON.stringify(products));
        loadProductDetails();
    }
}

function renderCommentsAndQA(prod) {
    const cContainer = document.getElementById('commentsBoxContainer');
    if (cContainer) {
        cContainer.innerHTML = (prod.comments && prod.comments.length > 0) ? prod.comments.map(c => `
            <div class="comment-item">
                <div class="avatar-box">${c.avatar || '🤖'}</div>
                <div><strong>${c.user}:</strong><br>${c.text}</div>
            </div>
        `).join('') : "<p style='color:#aaa;'>نظری نیست.</p>";
    }
}

function addAdvancedComment(prodId) {
    const name = document.getElementById('cName').value.trim();
    const text = document.getElementById('cText').value.trim();
    const avatar = document.getElementById('cAvatar').value;

    if(!name || !text) { alert("نام و متن نظر را وارد کنید!"); return; }

    let products = JSON.parse(localStorage.getItem('digi_cyber_products')) || [];
    const idx = products.findIndex(p => p.id === prodId);
    if(idx !== -1) {
        if(!products[idx].comments) products[idx].comments = [];
        products[idx].comments.push({ user: name, text: text, avatar: avatar });
        localStorage.setItem('digi_cyber_products', JSON.stringify(products));
        loadProductDetails();
    }
}

function shareProduct(title, id) {
    const link = `${window.location.origin}/product-details.html?id=${id}`;
    navigator.clipboard.writeText(link).then(() => {
        alert(`🔗 لینک مستقیم محصول "${title}" کپی شد!`);
    });
}

function toggleWishlist(prodId) {
    let wishlist = JSON.parse(localStorage.getItem('cyber_wishlist')) || [];
    if (wishlist.includes(prodId)) {
        wishlist = wishlist.filter(id => id !== prodId);
    } else {
        wishlist.push(prodId);
    }
    localStorage.setItem('cyber_wishlist', JSON.stringify(wishlist));
    displayProducts();
    renderWishlistContainer();
}

function toggleWishlistSection() {
    const sec = document.getElementById('wishlistSection');
    if(sec) sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
    renderWishlistContainer();
}

function renderWishlistContainer() {
    const container = document.getElementById('wishlistItemsContainer');
    if (!container) return; container.innerHTML = "";
    let wishlist = JSON.parse(localStorage.getItem('cyber_wishlist')) || [];
    let products = JSON.parse(localStorage.getItem('digi_cyber_products')) || [];
    let likedProds = products.filter(p => wishlist.includes(p.id));

    if(likedProds.length === 0) { container.innerHTML = "<p style='font-size:12px; color:#aaa; grid-column:1/-1;'>لیست خالی است.</p>"; return; }

    likedProds.forEach(prod => {
        const d = document.createElement('div');
        d.className = 'product-card'; d.style.padding = '10px';
        d.innerHTML = `
            <img src="${prod.image}" style="height:80px;">
            <h4 style="margin:5px 0;">${prod.title}</h4>
            <button class="buy-btn" style="font-size:10px; padding:4px;" onclick="goToDetails(${prod.id})">👁️ مشاهده</button>
        `;
        container.appendChild(d);
    });
}

// سیستم افزودن کالا به سبد خرید
function addToCart(prodId) {
    let products = JSON.parse(localStorage.getItem('digi_cyber_products')) || [];
    const prod = products.find(p => p.id === prodId);
    let stockValue = prod.stock !== undefined ? prod.stock : 0;

    if (stockValue <= 0) { alert("موجودی این کالا به اتمام رسیده!"); return; }

    playRetroSound();
    cart.push(prod);
    
    if(document.getElementById('cartCount')) document.getElementById('cartCount').textContent = cart.length;
    if(document.getElementById('cartSection')) document.getElementById('cartSection').style.display = 'block';
    
    updateCartUI();
}

function updateCartUI() {
    const listContainer = document.getElementById('cartItemsList');
    if (!listContainer) return; listContainer.innerHTML = "";
    let total = 0;

    cart.forEach((item) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${item.title}</span><strong>${item.price.toLocaleString('fa-IR')} تومان</strong>`;
        listContainer.appendChild(li);
        total += item.price;
    });

    // اعمال سیستم تخفیف درصدی داینامیک خریداری شده از بازارچه مای کاغذ
    if (currentDiscountPercent > 0) {
        total = total * ((100 - currentDiscountPercent) / 100);
    }

    if(document.getElementById('totalPrice')) document.getElementById('totalPrice').textContent = Math.round(total).toLocaleString('fa-IR');
}

// فرمول کاملاً دقیق محاسبه سیستم سکه دهی پلکانی بر اساس تعداد خرید کالا
function calculateEarnedCoins(itemCount) {
    if (itemCount === 1) return 1;
    if (itemCount === 2) return 2;
    if (itemCount === 3 || itemCount === 4) return 2;
    if (itemCount >= 5 && itemCount <= 6) return 3;
    if (itemCount >= 7 && itemCount <= 9) return 4;
    if (itemCount >= 10) return 5;
    return 0;
}

// ثبت فاکتور و پرداخت پاداش سکه‌ای پلکانی جدید
function checkoutAndEarnCoins() {
    if (cart.length === 0) return;

    let products = JSON.parse(localStorage.getItem('digi_cyber_products')) || [];
    
    cart.forEach(cartItem => {
        const prodIdx = products.findIndex(p => p.id === cartItem.id);
        if (prodIdx !== -1) {
            if(products[prodIdx].stock === undefined) products[prodIdx].stock = 0;
            if(products[prodIdx].stock > 0) products[prodIdx].stock -= 1; 
        }
    });
    
    localStorage.setItem('digi_cyber_products', JSON.stringify(products));

    // اعمال سیستم سکه‌ دهی فرمولی
    let currentCoins = parseInt(localStorage.getItem('cyber_user_coins')) || 0;
    let earned = calculateEarnedCoins(cart.length);
    localStorage.setItem('cyber_user_coins', currentCoins + earned);

    const slot = document.getElementById('deliveryTimeSlot').value;
    alert(`🎉 خرید شما با موفقیت ثبت شد!\n📦 تعداد کالاها: ${cart.length} عدد\n🪙 سکه پاداش دریافتی: ${earned} سکه سایبری!`);
    
    cart = [];
    clearCart();
    displayProducts(); 
    updateCoinDisplay();
}

// اعمال کدهای خریداری شده از مای کاغذ
function applyCoupon() {
    const inputCode = document.getElementById('couponInput').value.trim().toUpperCase();
    let ownedCoupons = JSON.parse(localStorage.getItem('my_owned_coupons')) || [];

    const found = ownedCoupons.find(c => c.id === inputCode);

    if (found) {
        currentDiscountPercent = found.percent;
        document.getElementById('couponMsg').style.color = "#2ecc71";
        document.getElementById('couponMsg').textContent = `✅ کد تخفیف ${found.percent}٪ با موفقیت روی فاکتور اعمال شد!`;
        updateCartUI();
    } else {
        document.getElementById('couponMsg').style.color = "#e61c4d";
        document.getElementById('couponMsg').textContent = "❌ کد تخفیف نامعتبر است یا در کیف پول مای کاغذ شما وجود ندارد.";
    }
}

// سیستم بازارچه و مدیریت مای کاغذ
function toggleMyPaperSection() {
    const sec = document.getElementById('myPaperSection');
    if(sec) sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
}

function renderCouponsMarket() {
    const container = document.getElementById('couponsMarketGrid');
    if(!container) return; container.innerHTML = "";

    COUPONS_MARKET.forEach(coupon => {
        const card = document.createElement('div');
        card.className = "coupon-market-card";
        card.innerHTML = `
            <h4>${coupon.title}</h4>
            <span>قیمت: ${coupon.cost} سکه</span>
            <button onclick="buyCouponFromMarket('${coupon.id}', ${coupon.cost}, ${coupon.percent})">🛒 خرید کد</button>
        `;
        container.appendChild(card);
    });
}

function buyCouponFromMarket(id, cost, percent) {
    let coins = parseInt(localStorage.getItem('cyber_user_coins')) || 0;
    if(coins < cost) { alert("❌ سکه کافی نداری! بیشتر خرید کن تا سکه بگیری."); return; }

    // کسر سکه
    localStorage.setItem('cyber_user_coins', coins - cost);
    
    // افزودن به لیست کدهای خریداری شده کاربر
    let owned = JSON.parse(localStorage.getItem('my_owned_coupons')) || [];
    owned.push({ id, percent, date: Date.now() });
    localStorage.setItem('my_owned_coupons', JSON.stringify(owned));

    alert(`🎫 کد تخفیف "${id}" با موفقیت خریداری شد! کپی کنید و در سبد خرید استفاده کنید.`);
    updateCoinDisplay();
    renderOwnedCouponsList();
}

function renderOwnedCouponsList() {
    const listContainer = document.getElementById('myOwnedCoupons');
    if(!listContainer) return; listContainer.innerHTML = "";

    let owned = JSON.parse(localStorage.getItem('my_owned_coupons')) || [];
    if(owned.length === 0) { listContainer.innerHTML = "<li>هنوز هیچ کدی خریداری نکرده‌اید.</li>"; return; }

    owned.forEach(c => {
        const li = document.createElement('li');
        li.innerHTML = `کد: <strong style='color:#ffcc00; font-family:monospace;'>${c.id}</strong> (تخفیف ${c.percent}٪)`;
        listContainer.appendChild(li);
    });
}

function clearCart() {
    cart = []; currentDiscountPercent = 0;
    if(document.getElementById('cartCount')) document.getElementById('cartCount').textContent = '0';
    if(document.getElementById('cartSection')) document.getElementById('cartSection').style.display = 'none';
}

function deleteProduct(prodId) {
    let products = JSON.parse(localStorage.getItem('digi_cyber_products')) || [];
    products = products.filter(p => p.id !== prodId);
    localStorage.setItem('digi_cyber_products', JSON.stringify(products));
    displayProducts();
}

function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    let products = JSON.parse(localStorage.getItem('digi_cyber_products')) || [];
    displayProducts(products.filter(prod => prod.title.toLowerCase().includes(query)));
}

window.onload = () => {
    displayProducts();
    initThemeOnLoad();
};
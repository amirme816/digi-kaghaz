// 🌐 اطلاعات اتصال اختصاصی و بدون فیلتر فروشگاه دیجی کاغذ به سوپابیس
const SUPABASE_URL = "https://djzsluagybvdklzekpin.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqenNsdWFneWJ2ZGtsemVrcGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjAyNDIsImV4cCI6MjA5NjkzNjI0Mn0.T9Y4QBREEOFEqlSFu9-6uxKNnHHTxtTQS0nG6dMKRsI";

// راه‌اندازی اولیه کلاینت سوپابیس
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let selectedImageBase64 = "";
let cart = []; 
let currentDiscountPercent = 0;
let globalProductsArray = [];

const DEFAULT_PLACEHOLDER_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 100 100'><rect width='100%25' height='100%25' fill='%23eee'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='10' fill='%23aaa'>بدون تصویر</text></svg>";

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
    fetchLiveProducts(); // خواندن محصولات از سرور
    listenToLiveChanges(); // فعال‌سازی سیستم گوش‌به‌زنگ آنی
}

// 📡 خواندن کالاها از دیتابیس ابری سوپابیس
async function fetchLiveProducts() {
    const { data, error } = await supabaseClient.from('products').select('*').order('id', { ascending: false });
    if (!error && data) {
        globalProductsArray = data;
        displayProducts(data);
        renderWishlist(); // همگام‌سازی لیست علاقه‌مندی‌ها در هر بارگذاری
    }
}

// ⚡ مانیتور کردن آنی دیتابیس بدون رفرش
function listenToLiveChanges() {
    supabaseClient
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
            fetchLiveProducts();
        })
        .subscribe();
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

function toggleAmazingOptions() {
    const isAmazing = document.getElementById('isAmazing').checked;
    const box = document.getElementById('amazingOptions');
    if(box) box.style.display = isAmazing ? 'block' : 'none';
}

// 🚀 آپلود مستقیم کالا روی سوپابیس بدون فیلترشکن
const productForm = document.getElementById('productForm');
if (productForm) {
    productForm.addEventListener('submit', async function(event) {
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
            title, price, stock, desc, isAmazing, discountPercent, endTime, image, comments: []
        };
        
        const { error } = await supabaseClient.from('products').insert([newProduct]);
        
        if(!error) {
            alert("🎉 محصول با موفقیت روی سرور ابری آپلود شد و در کل دنیا منتشر گردید!");
            productForm.reset();
            if(document.getElementById('amazingOptions')) document.getElementById('amazingOptions').style.display = 'none';
            document.getElementById('imgPreview').style.display = 'none';
            selectedImageBase64 = "";
        } else {
            alert("خطا در آپلود دیتابیس: " + error.message);
        }
    });
}

function displayProducts(productsList) {
    const container = document.getElementById('shopContainer');
    if (!container) return; 
    container.innerHTML = "";
    
    let products = productsList || globalProductsArray;

    if(products.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#999; grid-column:1/-1;">هیچ کالایی در دیتابیس ابری موجود نیست.</p>`;
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
        tagsHTML += `</div>`;

        let wishlist = JSON.parse(localStorage.getItem('cyber_wishlist')) || [];
        let isLiked = wishlist.includes(Number(prod.id));

        let stockControlHTML = "";
        if(stockValue === 0) {
            stockControlHTML = `
                <div style="margin-top: 5px; display: flex; gap: 3px;">
                    <input type="number" id="restockInput_${prod.id}" min="1" placeholder="تعداد" style="padding:4px; font-size:11px; width:60px;">
                    <button onclick="event.stopPropagation(); restockProduct('${prod.id}')" style="background:#2ecc71; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;">➕ شارژ</button>
                </div>
            `;
        }

        card.innerHTML = `
            <button class="delete-btn" onclick="event.stopPropagation(); deleteProduct('${prod.id}')">❌</button>
            <div class="product-link-area" onclick="goToDetails('${prod.id}')" style="cursor:pointer;">
                <img src="${prod.image}">
                ${tagsHTML}
                <h3 style="margin:5px 0 0 0;">${prod.title}</h3>
                <div style="font-size:12px; color:#888; margin-top:2px;">موجودی انبار: ${stockValue} عدد</div>
                <div class="price" style="margin-top:5px; color:#e61c4d; font-weight:bold;">${finalPrice.toLocaleString('fa-IR')} تومان</div>
            </div>
            ${stockControlHTML}
            <div class="action-row">
                <button class="action-btn" onclick="event.stopPropagation(); toggleWishlist('${prod.id}')">${isLiked ? '❤️ لایک شده' : '🤍 لایک'}</button>
            </div>
            <button class="buy-btn" onclick="event.stopPropagation(); addToCart('${prod.id}')" ${stockValue === 0 ? 'disabled style="background:#ccc; border:none; color:#666;"' : ''}>
                ${stockValue === 0 ? '🚫 ناموجود' : '🛒 خرید سریع'}
            </button>
        `;
        container.appendChild(card);
    });
}

async function restockProduct(prodId) {
    const inputEl = document.getElementById(`restockInput_${prodId}`);
    const amount = parseInt(inputEl.value) || 0;
    if(amount <= 0) return;

    const prod = globalProductsArray.find(p => p.id == prodId);
    if(prod) {
        const newStock = (prod.stock || 0) + amount;
        await supabaseClient.from('products').update({ stock: newStock }).eq('id', Number(prodId));
    }
}

function goToDetails(prodId) {
    window.location.href = `product-details.html?id=${prodId}`;
}

async function loadProductDetails() {
    const container = document.getElementById('detailsContainer');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const prodId = urlParams.get('id');

    const { data: prod } = await supabaseClient.from('products').select('*').eq('id', Number(prodId)).single();
    if (!prod) { container.innerHTML = "<h2>❌ کالا یافت نشد!</h2>"; return; }

    let stockValue = prod.stock !== undefined ? prod.stock : 0;
    let notifyHTML = "";
    if (stockValue === 0) {
        notifyHTML = `
            <div class="shipping-progress-container" style="border: 1px dashed #ff9900; padding:10px; background:rgba(255,153,0,0.05); margin: 15px 0;">
                📢 <strong>شارژ انبار آنلاین:</strong>
                <div style="display:flex; gap:5px; margin-top:5px;">
                    <input type="number" id="detailRestockInput" placeholder="تعداد شارژ" style="padding:5px;">
                    <button onclick="restockFromDetails('${prod.id}')" style="background:#2ecc71; border:none; color:white; padding:5px; border-radius:6px; cursor:pointer;">ثبت آنلاین</button>
                </div>
            </div>
        `;
    }

    let commentsHTML = "";
    if (prod.comments && prod.comments.length > 0) {
        commentsHTML = prod.comments.map(c => `
            <div class="comment-item">
                <div class="avatar-box">${c.avatar || '🤖'}</div>
                <div><strong>${c.user}:</strong><br>${c.text}</div>
            </div>
        `).join('');
    } else {
        commentsHTML = "<p style='color:#aaa;'>هنوز نظری ثبت نشده است.</p>";
    }

    container.innerHTML = `
        <div class="zoom-container"><img src="${prod.image}"></div>
        <div class="big-product-title">${prod.title}</div>
        <p>وضعیت انبار سراسری: <strong>${stockValue === 0 ? 'اتمام موجودی' : stockValue + ' عدد موجود'}</strong></p>
        <div class="big-product-desc">${prod.desc}</div>
        ${notifyHTML}
        <button class="submit-btn" onclick="addToCart('${prod.id}')" ${stockValue === 0 ? 'disabled' : ''}>🛒 افزودن به سبد خرید</button>
        <div class="comments-box">
            <div class="comment-title" style="font-size:16px;">💬 نظرات آنلاین خریداران:</div>
            <div class="comments-list">${commentsHTML}</div>
            <div class="comment-input-group">
                <input type="text" id="cName" placeholder="نام شما" style="width:100px; margin-bottom:5px;">
                <input type="text" id="cText" placeholder="متن نظر...">
                <button onclick="addAdvancedComment('${prod.id}')" style="background:#e61c4d; color:white; border-radius:8px; padding:8px; border:none; cursor:pointer; margin-top:5px;">ارسال نظر عمومی</button>
            </div>
        </div>
    `;
}

async function restockFromDetails(prodId) {
    const val = parseInt(document.getElementById('detailRestockInput').value) || 0;
    if(val <= 0) return;
    const { data: prod } = await supabaseClient.from('products').select('stock').eq('id', Number(prodId)).single();
    const currentStock = prod.stock || 0;
    await supabaseClient.from('products').update({ stock: currentStock + val }).eq('id', Number(prodId));
    loadProductDetails();
}

async function addAdvancedComment(prodId) {
    const name = document.getElementById('cName').value.trim();
    const text = document.getElementById('cText').value.trim();
    if(!name || !text) return;

    const { data: prod } = await supabaseClient.from('products').select('comments').eq('id', Number(prodId)).single();
    let currentComments = prod.comments || [];
    currentComments.push({ user: name, text: text, avatar: "🤖" });

    await supabaseClient.from('products').update({ comments: currentComments }).eq('id', Number(prodId));
    loadProductDetails();
}

function addToCart(prodId) {
    const prod = globalProductsArray.find(p => p.id == prodId);
    if (!prod || prod.stock <= 0) { alert("موجودی تمام شده!"); return; }

    cart.push(prod);
    if(document.getElementById('cartCount')) document.getElementById('cartCount').textContent = cart.length.toLocaleString('fa-IR');
    if(document.getElementById('cartSection')) document.getElementById('cartSection').style.display = 'block';
    updateCartUI();
}

function updateCartUI() {
    const listContainer = document.getElementById('cartItemsList');
    if (!listContainer) return; listContainer.innerHTML = "";
    let total = 0;

    cart.forEach((item) => {
        const li = document.createElement('li');
        li.style = "display:flex; justify-content:space-between; margin-bottom:5px; font-size:13px;";
        li.innerHTML = `<span>${item.title}</span><strong>${item.price.toLocaleString('fa-IR')} تومان</strong>`;
        listContainer.appendChild(li);
        total += item.price;
    });

    if (currentDiscountPercent > 0) {
        total = total * ((100 - currentDiscountPercent) / 100);
    }
    if(document.getElementById('totalPrice')) document.getElementById('totalPrice').textContent = Math.round(total).toLocaleString('fa-IR');
}

function calculateEarnedCoins(itemCount) {
    if (itemCount === 1) return 1;
    if (itemCount === 2 || itemCount === 3 || itemCount === 4) return 2;
    if (itemCount === 5 || itemCount === 6) return 3;
    if (itemCount >= 7 && itemCount <= 9) return 4;
    if (itemCount >= 10) return 5;
    return 0;
}

// 🔄 تغییر یافته: هدایت کاربر به صفحه جدید درگاه پرداخت به همراه اطلاعات فاکتور
function checkoutAndEarnCoins() {
    if (cart.length === 0) { alert("سبد خرید شما خالی است!"); return; }

    // دریافت مبلغ کل نهایی فاکتور از روی قالب سایت شما
    const totalPriceText = document.getElementById('totalPrice').textContent;
    
    // دریافت زمان ارسال چرخشی انتخاب شده توسط خریدار
    const deliverySlot = document.getElementById('deliveryTimeSlot').value;

    // استخراج اطلاعات کوتاه محصولات سبد خرید
    const orderItems = cart.map(item => ({ id: item.id, title: item.title, price: item.price }));

    // ذخیره فاکتور در حافظه محلی مرورگر جهت خواندن در صفحه درگاه پرداخت جدید
    localStorage.setItem('checkout_total_price', totalPriceText);
    localStorage.setItem('checkout_delivery_slot', deliverySlot);
    localStorage.setItem('checkout_cart_items', JSON.stringify(orderItems));

    // انتقال مستقیم کاربر به صفحه مجزای پرداخت کالا
    window.location.href = "checkout.html";
}

function applyCoupon() {
    const inputCode = document.getElementById('couponInput').value.trim().toUpperCase();
    let ownedCoupons = JSON.parse(localStorage.getItem('my_owned_coupons')) || [];
    const found = ownedCoupons.find(c => c.id === inputCode);

    if (found) {
        currentDiscountPercent = found.percent;
        document.getElementById('couponMsg').style.color = "#2ecc71";
        document.getElementById('couponMsg').textContent = `✅ کد تخفیف ${found.percent}٪ اعمال شد!`;
        updateCartUI();
    } else {
        document.getElementById('couponMsg').style.color = "#e61c4d";
        document.getElementById('couponMsg').textContent = "❌ کد نامعتبر است.";
    }
}

function toggleMyPaperSection() {
    const sec = document.getElementById('myPaperSection');
    if(sec) sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
}

function toggleWishlistSection() {
    const sec = document.getElementById('wishlistSection');
    if (sec) sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
}

function renderCouponsMarket() {
    const container = document.getElementById('couponsMarketGrid');
    if(!container) return; container.innerHTML = "";
    COUPONS_MARKET.forEach(coupon => {
        const card = document.createElement('div'); card.className = "coupon-market-card";
        card.innerHTML = `<h4>${coupon.title}</h4><span>قیمت: ${coupon.cost} سکه</span><button onclick="buyCouponFromMarket('${coupon.id}', ${coupon.cost}, ${coupon.percent})">🛒 خرید کد</button>`;
        container.appendChild(card);
    });
}

function buyCouponFromMarket(id, cost, percent) {
    let coins = parseInt(localStorage.getItem('cyber_user_coins')) || 0;
    if(coins < cost) { alert("❌ سکه کافی نداری!"); return; }
    localStorage.setItem('cyber_user_coins', coins - cost);
    let owned = JSON.parse(localStorage.getItem('my_owned_coupons')) || [];
    owned.push({ id, percent });
    localStorage.setItem('my_owned_coupons', JSON.stringify(owned));
    updateCoinDisplay(); renderOwnedCouponsList();
}

function renderOwnedCouponsList() {
    const listContainer = document.getElementById('myOwnedCoupons');
    if(!listContainer) return; listContainer.innerHTML = "";
    let owned = JSON.parse(localStorage.getItem('my_owned_coupons')) || [];
    if(owned.length === 0) { listContainer.innerHTML = "<li>کدی خریداری نشده است.</li>"; return; }
    owned.forEach(c => {
        const li = document.createElement('li');
        li.innerHTML = `کد: <strong style='color:#ffcc00;'>${c.id}</strong> (تخفیف ${c.percent}٪)`;
        listContainer.appendChild(li);
    });
}

function toggleWishlist(prodId) {
    let wishlist = JSON.parse(localStorage.getItem('cyber_wishlist')) || [];
    const idNum = Number(prodId);
    
    if (wishlist.includes(idNum)) {
        wishlist = wishlist.filter(id => id !== idNum);
    } else {
        wishlist.push(idNum);
    }
    
    localStorage.setItem('cyber_wishlist', JSON.stringify(wishlist));
    displayProducts(); // رندر دوباره کارت‌ها برای آپدیت قلب‌ها
    renderWishlist();  // رندر باکس پایینی
}

function renderWishlist() {
    const container = document.getElementById('wishlistItemsContainer');
    if (!container) return;
    container.innerHTML = "";
    
    let wishlist = JSON.parse(localStorage.getItem('cyber_wishlist')) || [];
    let favoriteProducts = globalProductsArray.filter(p => wishlist.includes(Number(p.id)));
    
    if (favoriteProducts.length === 0) {
        container.innerHTML = "<p style='color:#aaa; font-size:12px; padding: 10px;'>لیست علاقه‌مندی‌های شما خالی است.</p>";
        return;
    }
    
    favoriteProducts.forEach(prod => {
        const item = document.createElement('div');
        item.style = "display:flex; justify-content:space-between; align-items:center; background:rgba(255, 0, 127, 0.05); padding:8px; border-radius:8px; border:1px solid rgba(255, 0, 127, 0.2); font-size:12px; color:inherit;";
        item.innerHTML = `
            <span>❤️ ${prod.title}</span>
            <button onclick="toggleWishlist('${prod.id}')" style="background:none; border:none; color:#ff007f; cursor:pointer; font-weight:bold;">حذف 💔</button>
        `;
        container.appendChild(item);
    });
}

async function deleteProduct(prodId) {
    if(confirm("آیا مطمئن هستید که این کالا از دیتابیس ابری حذف شود؟")) {
        const { error } = await supabaseClient.from('products').delete().eq('id', Number(prodId));
        if (error) {
            alert("خطا در حذف: " + error.message);
        } else {
            alert("🗑️ کالا با موفقیت حذف شد.");
        }
    }
}

function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    displayProducts(globalProductsArray.filter(prod => prod.title.toLowerCase().includes(query)));
}

window.onload = () => { initThemeOnLoad(); };
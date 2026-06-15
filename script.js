// 🌐 اطلاعات اتصال اختصاصی و بدون فیلتر فروشگاه دیجی کاغذ به سوپابیس
const SUPABASE_URL = "https://djzsluagybvdklzekpin.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqenNsdWFneWJ2ZGtsemVrcGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjAyNDIsImV4cCI6MjA5NjkzNjI0Mn0.T9Y4QBREEOFEqlSFu9-6uxKNnHHTxtTQS0nG6dMKRsI";

// راه‌اندازی اولیه کلاینت سوپابیس
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// متغیرهای سراسری مدیریت حساب کاربر و فروشگاه
let currentUser = null;
let currentUserProfile = null;
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

async function initThemeOnLoad() {
    const savedTheme = localStorage.getItem('cyber_theme') || 'light';
    const selector = document.getElementById('themeSelector');
    if (selector) selector.value = savedTheme;
    applyThemeClass(savedTheme);
    
    // ۱. بررسی وضعیت ورود کاربر و لود پروفایل ابری
    await checkUserSession();
    
    renderCouponsMarket();
    fetchLiveProducts(); // خواندن محصولات از سرور
    listenToLiveChanges(); // فعال‌سازی سیستم گوش‌به‌زنگ آنی
}

// 🔐 بررسی وضعیت سشن کاربر و همگام‌سازی منو و پروفایل
async function checkUserSession() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const authSection = document.getElementById('userAuthSection');
    
    if (user) {
        currentUser = user;
        
        // دریافت اطلاعات پروفایل از جدول profiles
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
        if (!error && profile) {
            currentUserProfile = profile;
            updateCoinDisplay(profile.coins);
            renderOwnedCouponsList(profile.owned_coupons);
            
            // پر کردن خودکار فیلد موبایل در مودال پرداخت در صورت وجود
            const buyerPhoneInput = document.getElementById('buyerPhone');
            if (buyerPhoneInput && user.phone) {
                // تبدیل فرمت +98 به 0 برای راحتی خریدار
                buyerPhoneInput.value = user.phone.replace('+98', '0');
            }

            // تغییر منوی هدر به حالت خوش‌آمدگویی
            if (authSection) {
                authSection.innerHTML = `
                    <span style="color: #00a896; margin-left: 10px; font-weight: bold; font-size: 13px;">
                        👋 ${profile.first_name || 'کاربر'} ${profile.last_name || 'گرامی'} خوش آمدی!
                    </span>
                    <button onclick="handleLogOut()" class="nav-link" style="background: rgba(230,28,77,0.1); color: #e61c4d; border: 1px solid #e61c4d; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; font-family: inherit;">
                        🚶‍♂️ خروج
                    </button>
                `;
            }
        }
    } else {
        // کاربر لاگین نکرده است
        updateCoinDisplay(0);
        renderOwnedCouponsList([]);
        if (authSection) {
            authSection.innerHTML = `<a href="auth.html" class="nav-link" id="authBtn" style="text-decoration: none; background: rgba(0, 168, 150, 0.1); padding: 5px 12px; border-radius: 4px; border: 1px solid #00a896; font-size: 13px;">🔐 ورود / عضویت با موبایل</a>`;
        }
    }
}

// 🚶‍♂️ تابع خروج از حساب کاربری
async function handleLogOut() {
    if (confirm("آیا می‌خواهید از حساب کاربری خود خارج شوید؟")) {
        const { error } = await supabaseClient.auth.signOut();
        if (!error) {
            alert("🔒 با موفقیت از سیستم خارج شدید.");
            window.location.reload();
        }
    }
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

function updateCoinDisplay(coinsAmount) {
    let coins = coinsAmount !== undefined ? coinsAmount : (currentUserProfile ? currentUserProfile.coins : 0);
    const coinEl = document.getElementById('userCoins');
    if (coinEl) coinEl.textContent = coins.toLocaleString('fa-IR');
}

// 📸 پیش‌نمایش و فشرده‌سازی خودکار عکس کالا برای رفع خطای آپلود دیتابیس سوپابیس
function previewImage(event) {
    const input = event.target;
    const preview = document.getElementById('imgPreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                // فشرده‌سازی عکس روی Canvas تا ابعاد استاندارد ۳۰۰ پیکسل
                const compressedBase64 = compressImage(img, 300, 300);
                
                preview.src = compressedBase64; 
                preview.style.display = 'block';
                selectedImageBase64 = compressedBase64;
            };
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// ⚡ تابع کمکی فشرده‌ساز تصاویر برای کاهش حجم کدهای Base64
function compressImage(img, maxWidth, maxHeight) {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    if (width > height) {
        if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
        }
    } else {
        if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
        }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    // تبدیل به ساختار سبک jpeg با کیفیت پردازش ۷۰ درصد
    return canvas.toDataURL('image/jpeg', 0.7);
}

function toggleAmazingOptions() {
    const isAmazing = document.getElementById('isAmazing').checked;
    const box = document.getElementById('amazingOptions');
    if(box) box.style.display = isAmazing ? 'block' : 'none';
}

// 🚀 آپلود مستقیم کالا روی سوپابیس
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

    // گرفتن لیست لایک‌ها از سشن ابری کاربر
    let wishlist = (currentUserProfile && currentUserProfile.wishlist) ? currentUserProfile.wishlist : [];

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

        // بررسی اینکه آیا این آیدی کالا تو لایک‌های سرور کاربر هست یا نه
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

    // پر کردن نام خریدار لاگین کرده در فیلد کامنت‌ها به صورت خودکار
    if (currentUserProfile) {
        const cNameInput = document.getElementById('cName');
        if (cNameInput) cNameInput.value = `${currentUserProfile.first_name} ${currentUserProfile.last_name}`;
    }
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
    if (!prod || prod.stock <= 0) { alert("موجودی تمام شده
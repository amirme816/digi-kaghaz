let selectedImageBase64 = "";
let cart = []; 

// سیستم احراز هویت ادمین (امیرعباس و 1234)
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const userInput = document.getElementById('username').value;
        const passInput = document.getElementById('password').value;

        if (userInput === "امیرعباس" && passInput === "1234") {
            localStorage.setItem('isAdminLoggedIn', 'true');
            alert("🔓 ورود موفقیت‌آمیز بود! خوش آمدی امیرعباس عزیز.");
            window.location.href = "admin.html"; // انتقال به پنل مدیریت
        } else {
            alert("❌ نام کاربری یا رمز عبور اشتباه است!");
        }
    });
}

// چک کردن دسترسی غیرمجاز به صفحه admin.html
if (window.location.pathname.includes("admin.html")) {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (isLoggedIn !== 'true') {
        alert("🚨 شما اجازه ورود به این صفحه را ندارید! لطفا ابتدا وارد شوید.");
        window.location.href = "login.html";
    }
}

// تابع خروج ادمین
function logoutAdmin() {
    localStorage.removeItem('isAdminLoggedIn');
    alert("🚪 شما با موفقیت از پنل خارج شدید.");
    window.location.href = "index.html";
}

// باز و بسته کردن باکس گزینه‌های تخفیف به صورت پویا در صفحه ادمین
function toggleAmazingOptions() {
    const isChecked = document.getElementById('isAmazing').checked;
    const optionsBox = document.getElementById('amazingOptions');
    if(optionsBox) {
        optionsBox.style.display = isChecked ? 'block' : 'none';
        document.getElementById('discountPercent').required = isChecked;
        document.getElementById('discountDuration').required = isChecked;
    }
}

// مدیریت تم و حالت تاریک سایبرپانکی
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('themeToggle');
    if(btn) btn.textContent = document.body.classList.contains('dark-mode') ? "☀️ تم روشن" : "🌙 حالت تاریک";
}

// تبدیل و پیش‌نمایش تصویر آپلود شده
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

// سیستم ثبت کالا - مخصوص صفحه ادمین (admin.html)
const productForm = document.getElementById('productForm');
if (productForm) {
    productForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const title = document.getElementById('prodTitle').value;
        const price = parseInt(document.getElementById('prodPrice').value);
        const desc = document.getElementById('prodDesc').value;
        const isAmazing = document.getElementById('isAmazing').checked;
        const image = selectedImageBase64 || "https://via.placeholder.com/150";

        let discountPercent = 0;
        let endTime = null;

        if (isAmazing) {
            discountPercent = parseInt(document.getElementById('discountPercent').value) || 0;
            const durationMinutes = parseInt(document.getElementById('discountDuration').value) || 1;
            endTime = Date.now() + (durationMinutes * 60 * 1000);
        }

        const newProduct = { 
            id: Date.now(), title, price, desc, isAmazing, discountPercent, endTime, image, comments: [] 
        };
        
        let products = JSON.parse(localStorage.getItem('digi_cyber_products')) || [];
        products.push(newProduct);
        localStorage.setItem('digi_cyber_products', JSON.stringify(products));

        alert("🎉 کالا با موفقیت در ویترین منتشر شد!");
        productForm.reset();
        if(document.getElementById('amazingOptions')) {
            document.getElementById('amazingOptions').style.display = 'none';
        }
        document.getElementById('imgPreview').style.display = 'none';
        selectedImageBase64 = "";
    });
}

// نمایش کالاها در ویترین - مخصوص صفحه اصلی (index.html)
function displayProducts(filteredList) {
    const container = document.getElementById('shopContainer');
    if (!container) return; // اگر در صفحه ادمین یا لاگین بودیم ادامه نده
    
    container.innerHTML = "";
    let products = filteredList || JSON.parse(localStorage.getItem('digi_cyber_products')) || [];

    if (products.length === 0) {
        container.innerHTML = "<p style='color:#999; text-align:center; grid-column: 1/-1;'>کالایی در ویترین موجود نیست. از پنل ادمین کالا اضافه کنید!</p>";
        return;
    }

    products.forEach((prod) => {
        const card = document.createElement('div');
        card.className = 'product-card';

        let finalPrice = prod.price;
        let priceHTML = "";
        
        if(prod.isAmazing && prod.endTime && Date.now() < prod.endTime) {
            const discountFactor = (100 - prod.discountPercent) / 100;
            finalPrice = prod.price * discountFactor;
            priceHTML = `
                <span class="amazing-tag">تخفیف ${prod.discountPercent}٪</span>
                <span class="price" style="color:#e61c4d;">${finalPrice.toLocaleString('fa-IR')} <span class="old-price">${prod.price.toLocaleString('fa-IR')}</span> تومان</span>
            `;
        } else {
            priceHTML = `<span class="price">${prod.price.toLocaleString('fa-IR')} تومان</span>`;
        }

        let commentsHTML = "";
        if(prod.comments && prod.comments.length > 0) {
            prod.comments.forEach(c => {
                commentsHTML += `<p><strong>${c.user}:</strong> ${c.text}</p>`;
            });
        } else {
            commentsHTML = "<p style='color:#aaa; font-size:11px;'>هنوز نظری ثبت نشده...</p>";
        }

        card.innerHTML = `
            <button class="delete-btn" onclick="deleteProduct(${prod.id})">❌</button>
            <div>
                <img src="${prod.image}">
                <h3>${prod.title}</h3>
                <div class="price-container">${priceHTML}</div>
                ${prod.isAmazing && prod.endTime && Date.now() < prod.endTime ? `<div class="countdown-timer" id="timer-${prod.id}">بارگذاری زمان...</div>` : ''}
            </div>
            
            <div>
                <button class="buy-btn" onclick="addToCart('${prod.title}', ${finalPrice})">🛒 خرید سریع</button>
                
                <div class="comments-box">
                    <div class="comment-title">💬 نظرات خریداران:</div>
                    <div class="comments-list">${commentsHTML}</div>
                    <div class="comment-input-group">
                        <input type="text" id="name-${prod.id}" placeholder="نام" style="width:45px; padding:4px;">
                        <input type="text" id="text-${prod.id}" placeholder="متن نظر..." style="flex:1; padding:4px;">
                        <button onclick="addComment(${prod.id})">ارسال</button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// آپدیت ثانیه‌ای تایمرهای معکوس هوشمند محصولات
setInterval(function updateAllTimers() {
    let products = JSON.parse(localStorage.getItem('digi_cyber_products')) || [];
    products.forEach(prod => {
        if (prod.isAmazing && prod.endTime) {
            const timerElement = document.getElementById(`timer-${prod.id}`);
            if (timerElement) {
                const remainingTime = prod.endTime - Date.now();
                if (remainingTime > 0) {
                    const totalSeconds = Math.floor(remainingTime / 1000);
                    const minutes = Math.floor(totalSeconds / 60);
                    const seconds = totalSeconds % 60;
                    const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;
                    timerElement.textContent = `⏰ فرصت باقی‌مانده: ${formattedSeconds} : ${minutes}`;
                } else {
                    timerElement.textContent = "⌛ زمان تخفیف به پایان رسید!";
                    timerElement.style.color = "#aaa";
                    timerElement.style.borderColor = "#aaa";
                    timerElement.style.background = "none";
                }
            }
        }
    });
}, 1000);

// افزودن کامنت جدید برای هر محصول
function addComment(prodId) {
    const nameInput = document.getElementById(`name-${prodId}`);
    const textInput = document.getElementById(`text-${prodId}`);
    
    if(!nameInput.value || !textInput.value) {
        alert("لطفاً نام و متن نظر را وارد کنید.");
        return;
    }

    let products = JSON.parse(localStorage.getItem('digi_cyber_products')) || [];
    const prodIndex = products.findIndex(p => p.id === prodId);
    
    if(prodIndex !== -1) {
        if(!products[prodIndex].comments) products[prodIndex].comments = [];
        products[prodIndex].comments.push({ user: nameInput.value, text: textInput.value });
        localStorage.setItem('digi_cyber_products', JSON.stringify(products));
        
        nameInput.value = "";
        textInput.value = "";
        displayProducts();
    }
}

// مدیریت سبد خرید
function addToCart(title, price) {
    cart.push({ title, price });
    const cartCountEl = document.getElementById('cartCount');
    if(cartCountEl) cartCountEl.textContent = cart.length;
    
    const cartSecEl = document.getElementById('cartSection');
    if(cartSecEl) cartSecEl.style.display = 'block';
    updateCartUI();
}

定义 // آپدیت رابط کاربری سبد خرید
function updateCartUI() {
    const listContainer = document.getElementById('cartItemsList');
    if (!listContainer) return;
    listContainer.innerHTML = "";
    let total = 0;
    cart.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${item.title}</span><strong>${item.price.toLocaleString('fa-IR')} تومان</strong>`;
        listContainer.appendChild(li);
        total += item.price;
    });
    document.getElementById('totalPrice').textContent = total.toLocaleString('fa-IR');
}

function clearCart() {
    cart = [];
    document.getElementById('cartCount').textContent = '0';
    document.getElementById('cartSection').style.display = 'none';
}

// حذف محصول از ویترین
function deleteProduct(prodId) {
    let products = JSON.parse(localStorage.getItem('digi_cyber_products')) || [];
    products = products.filter(p => p.id !== prodId);
    localStorage.setItem('digi_cyber_products', JSON.stringify(products));
    displayProducts();
}

// سیستم جستجوی کالا
function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    let products = JSON.parse(localStorage.getItem('digi_cyber_products')) || [];
    let filtered = products.filter(prod => prod.title.toLowerCase().includes(query));
    displayProducts(filtered);
}

// لود اولیه صفحه ویترین
window.onload = () => {
    displayProducts();
};
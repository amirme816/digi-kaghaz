let selectedImageBase64 = "";
let cart = []; 

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
    if (!container) return; 
    
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

        card.innerHTML = `
            <button class="delete-btn" onclick="deleteProduct(${prod.id})">❌</button>
            <!-- کلیک روی عکس یا عنوان، خریدار را به صفحه جزئیات می‌برد -->
            <div class="product-link-area" onclick="goToDetails(${prod.id})">
                <img src="${prod.image}">
                <h3>${prod.title}</h3>
                <div class="price-container">${priceHTML}</div>
                ${prod.isAmazing && prod.endTime && Date.now() < prod.endTime ? `<div class="countdown-timer" id="timer-${prod.id}">بارگذاری زمان...</div>` : ''}
            </div>
            
            <div>
                <button class="buy-btn" onclick="addToCart('${prod.title}', ${finalPrice})">🛒 خرید سریع</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// انتقال به صفحه جزئیات کالا بر اساس آی‌دی اختصاصی محصول
function goToDetails(prodId) {
    window.location.href = `product-details.html?id=${prodId}`;
}

// سیستم لود کردن و رندر بزرگ محصول در صفحه product-details.html
function loadProductDetails() {
    const container = document.getElementById('detailsContainer');
    if (!container) return;

    // گرفتن آی‌دی کالا از آدرس بار مرورگر
    const urlParams = new URLSearchParams(window.location.search);
    const prodId = parseInt(urlParams.get('id'));

    let products = JSON.parse(localStorage.getItem('digi_cyber_products')) || [];
    const prod = products.find(p => p.id === prodId);

    if (!prod) {
        container.innerHTML = "<h2>❌ محصول مورد نظر یافت نشد!</h2><a href='index.html'>بازگشت به فروشگاه</a>";
        return;
    }

    let finalPrice = prod.price;
    let priceHTML = "";
    
    if(prod.isAmazing && prod.endTime && Date.now() < prod.endTime) {
        const discountFactor = (100 - prod.discountPercent) / 100;
        finalPrice = prod.price * discountFactor;
        priceHTML = `
            <span class="amazing-tag">تخفیف شگفت‌انگیز ${prod.discountPercent}٪</span>
            <div class="price" style="color:#e61c4d; font-size:20px; margin: 10px 0;">قیمت با تخفیف: ${finalPrice.toLocaleString('fa-IR')} تومان <span class="old-price" style="font-size:14px; text-decoration:line-through; color:#aaa; margin-right:10px;">${prod.price.toLocaleString('fa-IR')}</span></div>
            <div class="countdown-timer" id="timer-${prod.id}" style="max-width:300px; margin:10px 0;">بارگذاری زمان...</div>
        `;
    } else {
        priceHTML = `<div class="price" style="font-size:20px; margin: 10px 0;">قیمت کالا: ${prod.price.toLocaleString('fa-IR')} تومان</div>`;
    }

    // رندر نظرات زنده مخصوص این کالا
    let commentsHTML = "";
    if(prod.comments && prod.comments.length > 0) {
        prod.comments.forEach(c => {
            commentsHTML += `<p><strong>${c.user}:</strong> ${c.text}</p>`;
        });
    } else {
        commentsHTML = "<p style='color:#aaa;' id='noCommentMsg'>هنوز هیچ نظری برای این محصول ثبت نشده است. اولین نفر باشید!</p>";
    }

    container.innerHTML = `
        <img src="${prod.image}" class="big-product-img">
        <div class="big-product-title">${prod.title}</div>
        <div class="big-product-desc"><strong>📋 توضیحات محصول:</strong><br>${prod.desc}</div>
        
        ${priceHTML}

        <button class="submit-btn" onclick="addToCart('${prod.title}', ${finalPrice})" style="margin:20px 0;">🛒 افزودن به سبد خرید</button>
        
        <div class="comments-box" style="border-top: 2px solid #e61c4d; margin-top:30px;">
            <div class="comment-title" style="font-size:16px; margin: 15px 0;">💬 نظرات و دیدگاه‌های کاربران:</div>
            <div class="comments-list" id="detailCommentsList">${commentsHTML}</div>
            <div class="comment-input-group" style="margin-top:15px;">
                <input type="text" id="name-${prod.id}" placeholder="نام شما" style="width:100px;">
                <input type="text" id="text-${prod.id}" placeholder="متن نظر یا بررسی شما..." style="flex:1;">
                <button onclick="addComment(${prod.id})" style="background:#e61c4d; color:white; font-weight:bold; border-radius:8px;">ارسال نظر</button>
            </div>
        </div>
    `;
}

// آپدیت ثانیه‌ای تایمرهای معکوس هوشمند محصولات (سازگار با هر دو صفحه)
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

// افزودن کامنت جدید (مخصوص صفحه جزئیات کالا)
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
        
        const newComment = { user: nameInput.value, text: textInput.value };
        products[prodIndex].comments.push(newComment);
        localStorage.setItem('digi_cyber_products', JSON.stringify(products));
        
        // آپدیت آنی لیست کامنت‌ها در صفحه بدون رفرش کل صفحه
        const commentsListContainer = document.getElementById('detailCommentsList');
        const noCommentMsg = document.getElementById('noCommentMsg');
        if(noCommentMsg) noCommentMsg.remove();
        
        const p = document.createElement('p');
        p.innerHTML = `<strong>${newComment.user}:</strong> ${newComment.text}`;
        commentsListContainer.appendChild(p);

        nameInput.value = "";
        textInput.value = "";
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
    const totalEl = document.getElementById('totalPrice');
    if(totalEl) totalEl.textContent = total.toLocaleString('fa-IR');
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
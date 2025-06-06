document.addEventListener("DOMContentLoaded", function () {
  // DOM элементы
  const checkoutForm = document.querySelector("#wf-form-checkout-form");
  if (checkoutForm) {
    checkoutForm.setAttribute("data-wf-ignore", "");
    console.log("Атрибут data-wf-ignore добавлен к форме");
  } else {
    console.error("Форма #wf-form-checkout-form не найдена");
  }

  const deliverySelect = document.querySelector("#selecter");
  const cartValueElement = document.querySelector(".cart-sum-value");
  const deliveryValueElement = document.querySelector(".delivery-value");
  const totalToPayElement = document.querySelector(".to-pay-amount");
  const promoInput = document.querySelector("#promocode");
  const promoButton = document.querySelector(".button.w-button");
  const plusButtons = document.querySelectorAll(".plus-stick");
  const minusButtons = document.querySelectorAll(".mins-stick");
  const stickCounters = document.querySelectorAll(".qty-stick");
  const plusLessonButtons = document.querySelectorAll(".plus-lesson-stick");
  const minusLessonButtons = document.querySelectorAll(".minus-lesson-stick");
  const lessonStickCounters = document.querySelectorAll(".qty-lessons-stick");
  const deliveryButton = document.querySelector("#delivery-button");
  const pickupButton = document.querySelector("#pickup-button");
  const deliveryFields = document.querySelectorAll(".delivery-field");
  const resultBlock = document.querySelector(".promocode-result");
  const valuePromo = document.querySelector(".value-promo");
  const deletePromo = document.querySelector(".delete-promocode");
  const checkbox = document.querySelector("#checkbox-3");
  const promocodeBlock = document.querySelector(".div-block-12");
  const cartEmpty = document.querySelector(".cart-empty");
  const cartHeader = document.querySelector(".cart-header");
  const clearCartButton = document.querySelector(".clear-cart"); // Переименована переменная
  const addProducts = document.querySelector(".add-products");
  const listOffAddedProducts = document.querySelector(".list-off-added-products");
  const cartFooterWrapper = document.querySelector(".cart-footer-wrapper");

  // Проверка DOM-элементов
  console.log("DOM-элементы:", {
    cartEmpty: !!cartEmpty,
    cartHeader: !!cartHeader,
    clearCartButton: !!clearCartButton, // Обновлено имя
    addProducts: !!addProducts,
    listOffAddedProducts: !!listOffAddedProducts,
    cartFooterWrapper: !!cartFooterWrapper,
  });

  // Состояние
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem("cart") || "[]");
    console.log("Корзина загружена:", cart);
  } catch (error) {
    console.error("Ошибка загрузки корзины из localStorage:", error);
    cart = [];
  }

  let lessonSticks = JSON.parse(localStorage.getItem("lessonSticks") || JSON.stringify(Array.from(lessonStickCounters).map(() => 0)));
  let promoDiscount = 0;
  let appliedPromoCode = null; // Переменная для хранения применённого промокода
  let isDelivery = localStorage.getItem("isDelivery") === "true" || true;
  let originalTotal = parseFloat(totalToPayElement?.textContent || "0");

  const zonePrices = {
    Stauceni: 85,
    Vatra: 85,
    Bubuieci: 85,
    Trușeni: 95,
    Băcioi: 95,
    Cricova: 95,
    Ciorescu: 95,
  };

  // Утилитные функции
  const parsePrice = (value) => parseFloat(value.replace("L", "").trim());
  const formatPrice = (value) => `${Math.max(value, 0)} L`;

  const getCartTotal = () => cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const getDeliveryPrice = (cartTotal, location) => {
    console.log(`getDeliveryPrice: isDelivery=${isDelivery}, location=${location}, cartTotal=${cartTotal}`);
    if (!isDelivery) return 0;
    if (location && zonePrices[location]) {
      return zonePrices[location];
    }
    return cartTotal >= 550 ? 0 : 50;
  };

  const updateTotals = () => {
    const cartTotal = getCartTotal();
    const location = isDelivery && deliverySelect && deliverySelect.value ? deliverySelect.value : "";
    const delivery = getDeliveryPrice(cartTotal, location);
    const total = Math.max(cartTotal + delivery - promoDiscount, 0);

    console.log(`updateTotals: cartTotal=${cartTotal}, delivery=${delivery}, promoDiscount=${promoDiscount}, total=${total}`);

    if (cartValueElement) cartValueElement.textContent = formatPrice(cartTotal);
    if (deliveryValueElement) deliveryValueElement.textContent = formatPrice(delivery);
    if (totalToPayElement) totalToPayElement.textContent = formatPrice(total);
    originalTotal = total;
  };

  const toggleDeliveryFields = (show) => {
    deliveryFields.forEach((field) => {
      field.style.display = show ? "block" : "none";
    });
    if (document.querySelector(".delivery-info")) {
      document.querySelector(".delivery-info").style.display = show ? "block" : "none";
    }
    if (document.querySelector(".rest-adress")) {
      document.querySelector(".rest-adress").style.display = show ? "none" : "block";
    }
  };

  const saveLessonSticks = () => {
    try {
      localStorage.setItem("lessonSticks", JSON.stringify(lessonSticks));
      lessonStickCounters.forEach((counter, idx) => {
        counter.textContent = lessonSticks[idx];
      });
    } catch (error) {
      console.error("Ошибка сохранения lessonSticks:", error);
    }
  };

  const saveCart = () => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
      updateHeaderCart();
      updateTotals();
      renderCheckoutCart();
      updateProductCards(); // Обновляем карточки товаров
      toggleCartEmpty();
    } catch (error) {
      console.error("Ошибка сохранения корзины:", error);
    }
  };

  const addToCart = (product) => {
    console.log("Добавление товара в корзину:", product);
    if (!product.id || !product.name || isNaN(product.price)) {
      console.error("Некорректные данные товара:", product);
      return;
    }
    const index = cart.findIndex((p) => p.id === product.id);
    if (index !== -1) {
      cart[index].qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }
    saveCart();
  };

  const removeFromCart = (id) => {
    console.log(`Удаление товара с id=${id}`);
    cart = cart.filter((p) => p.id !== id);
    saveCart();
  };

  const changeQty = (id, delta) => {
    console.log(`Изменение количества: id=${id}, delta=${delta}`);
    const item = cart.find((p) => p.id === id);
    if (!item) {
      console.error(`Товар с id=${id} не найден`);
      return;
    }
    item.qty += delta;
    if (item.qty <= 0) {
      removeFromCart(id);
    } else {
      saveCart();
    }
  };

  const clearCart = () => {
    cart = [];
    lessonSticks = lessonSticks.map(() => 0);
    promoDiscount = 0;
    appliedPromoCode = null; // Сбрасываем промокод
    if (valuePromo) valuePromo.textContent = "0 L";
    if (resultBlock) resultBlock.style.display = "none";
    if (promoInput) {
      promoInput.value = "";
      promoInput.disabled = false;
    }
    if (promoButton) promoButton.disabled = false;
    saveCart();
    saveLessonSticks();
  };

  const toggleCartEmpty = () => {
    const isCartEmpty = cart.length === 0;
    console.log("toggleCartEmpty:", { isCartEmpty, cartLength: cart.length });
    if (cartEmpty) cartEmpty.style.display = isCartEmpty ? '' : 'none';
    if (addProducts) addProducts.style.display = isCartEmpty ? 'none' : '';
    if (listOffAddedProducts) listOffAddedProducts.style.display = isCartEmpty ? 'none' : '';
    if (cartFooterWrapper) cartFooterWrapper.style.display = isCartEmpty ? 'none' : '';
    if (clearCartButton) clearCartButton.style.display = isCartEmpty ? 'none' : ''; // Обновлено имя
    else console.error("clearCartButton не найден в DOM");
  };

  const showNotification = (message, isError = false) => {
    let notification = document.querySelector(".order-notification");
    if (!notification) {
      notification = document.createElement("div");
      notification.className = "order-notification";
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${isError ? "#ffe6e6" : "#e6ffe6"};
        color: ${isError ? "#cc0000" : "#006600"};
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 1000;
        transition: opacity 0.5s;
      `;
      document.body.appendChild(notification);
    }
    notification.textContent = message;
    notification.style.opacity = "1";

    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  };

  const renderCheckoutCart = () => {
    const checkoutList = document.querySelector(".list-products-checkout");
    if (!checkoutList) return;

    checkoutList.innerHTML = "";
    cart.forEach((item) => {
      const li = document.createElement("li");
      li.className = "added-product-checkout";
      li.innerHTML = `
        <div class="added-product-wrapper">
          <div class="added-image-wrapper">
            <img src="${item.image}" loading="lazy" width="100" class="product-image" alt="${item.name}">
          </div>
          <div class="div-block-5">
            <div>
              <div class="added-product-name">${item.name}</div>
              <div class="div-block-3">
                <div class="weight">${item.weight}</div>
                <div class="pcs">${item.pcs}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="div-block-6 center">
          <div class="qty-product-check">x${item.qty}</div>
          <div class="product-price">${item.price * item.qty}L</div>
        </div>
      `;
      checkoutList.appendChild(li);
    });
  };

  const renderCart = () => {
    const container = document.querySelector(".list-off-added-products");
    const headerTotal = document.querySelector(".cart-header-total");
    const footerTotal = document.querySelector(".cart-footer-total");
    if (!container) return;

    container.innerHTML = "";
    let totalSum = getCartTotal();

    cart.forEach((item) => {
      const li = document.createElement("li");
      li.className = "added-item";
      li.innerHTML = `
        <div class="div-block-7">
          <div class="added-image-wrapper"><img src="${item.image}" width="100" class="product-image"></div>
          <div class="div-block-5">
            <div>
              <div class="added-product-name">${item.name}</div>
              <div class="div-block-3">
                <div class="weight">${item.weight}</div>
                <div class="pcs">${item.pcs}</div>
              </div>
            </div>
            <div>
              <div class="qty-buttons-wrapper">
                <a href="#" class="minus w-inline-block" data-id="${item.id}">−</a>
                <div class="counter"><div class="qty">${item.qty}</div></div>
                <a href="#" class="plus w-inline-block" data-id="${item.id}">+</a>
              </div>
            </div>
          </div>
        </div>
        <div class="div-block-6">
          <a href="#" class="delete-product w-inline-block" data-id="${item.id}">
            <div class="w-embed">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path d="M7 21C6.45 21 5.979 20.804 5.588 20.413C5.197 20.022 5.001 19.551 5 19V6H4V4H9V3H15V4H20V6H19V19C19 19.55 18.804 20.021 18.413 20.413C18.022 20.805 17.551 21.001 17 21H7ZM9 17H11V8H9V17ZM13 17H15V8H13V17Z" fill="currentColor"></path>
              </svg>
            </div>
          </a>
          <div class="product-price">${item.price * item.qty} L</div>
        </div>
      `;
      container.appendChild(li);
    });

    if (headerTotal) headerTotal.textContent = formatPrice(totalSum);
    if (footerTotal) footerTotal.textContent = formatPrice(totalSum);
    if (cartValueElement) cartValueElement.textContent = formatPrice(totalSum);
    toggleCartEmpty();
  };

  const updateHeaderCart = () => {
    const totalAmountEl = document.querySelector(".total-amount");
    const badgeEl = document.querySelector(".badge");
    const totalSum = getCartTotal();
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

    if (totalAmountEl) totalAmountEl.textContent = formatPrice(totalSum);
    if (badgeEl) badgeEl.textContent = totalQty;
  };

  // Обновление карточек товаров
  const updateProductCards = () => {
    console.log("Обновление карточек товаров, текущая корзина:", cart);
    document.querySelectorAll('.add-to-cart').forEach((addButton) => {
      const productCard = addButton.closest('div'); // Ищем ближайший родительский div как карточку
      const productId = addButton.dataset.id;
      const qtyWrapper = productCard.querySelector('.qty-product-card-wrapper');
      const valueProduct = productCard.querySelector('.value-product');

      if (!productId || !qtyWrapper || !valueProduct) {
        console.error("Отсутствуют необходимые элементы или атрибуты в карточке товара:", productCard);
        return;
      }

      const cartItem = cart.find((item) => item.id === productId);
      if (cartItem) {
        addButton.style.display = 'none';
        qtyWrapper.style.display = 'flex';
        valueProduct.textContent = cartItem.qty;
      } else {
        addButton.style.display = 'flex';
        qtyWrapper.style.display = 'none';
      }
    });
  };

  // Функция для получения API-ключа с сервера
  const getApiKey = async () => {
    try {
      const response = await fetch('https://serveryum.vercel.app/api/get-api-key', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Не удалось получить API-ключ');
      }
      const result = await response.json();
      return result.apiKey;
    } catch (error) {
      console.error('Ошибка получения API-ключа:', error.message);
      throw error;
    }
  };

  // Функция для проверки промокода на сервере
  const checkPromo = async (code) => {
    console.log('Отправка промокода на сервер:', code);
    try {
      const response = await fetch('https://serveryum.vercel.app/api/check-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      console.log('Ответ сервера (статус):', response.status);
      if (!response.ok) {
        const errorText = await response.json();
        console.log('Ошибка сервера:', errorText);
        throw new Error(errorText.error || 'Ошибка проверки промокода');
      }
      const result = await response.json();
      console.log('Результат проверки промокода:', result);
      return result;
    } catch (error) {
      console.error('Ошибка проверки промокода:', error.message);
      throw error;
    }
  };

  // Делегирование событий для корзины и карточек товаров
  document.addEventListener("click", (e) => {
    const target = e.target.closest("a");
    if (!target) return;

    if (target.classList.contains("add-to-cart")) {
      e.preventDefault();
      const product = {
        id: target.dataset.id,
        name: target.dataset.name,
        price: parseInt(target.dataset.price),
        image: target.dataset.image,
        weight: target.dataset.weight,
        pcs: target.dataset.pcs,
      };
      console.log("Клик на .add-to-cart:", product);
      if (!product.id || !product.name || isNaN(product.price)) {
        console.error("Отсутствуют обязательные атрибуты data-* для товара:", target);
        return;
      }
      addToCart(product);
    }

    if (target.classList.contains("plus")) {
      e.preventDefault();
      const id = target.dataset.id;
      console.log("Клик на .plus, id=", id);
      if (!id) {
        console.error("Отсутствует data-id для кнопки .plus:", target);
        return;
      }
      changeQty(id, 1);
    }

    if (target.classList.contains("minus")) {
      e.preventDefault();
      const id = target.dataset.id;
      console.log("Клик на .minus, id=", id);
      if (!id) {
        console.error("Отсутствует data-id для кнопки .minus:", target);
        return;
      }
      changeQty(id, -1);
    }

    if (target.classList.contains("plus-product-qty")) {
      e.preventDefault();
      const productCard = target.closest('div'); // Ищем ближайший родительский div
      if (!productCard) {
        console.error("Родительский элемент не найден для кнопки .plus-product-qty:", target);
        return;
      }
      const productId = productCard.querySelector('.qty-product-card-wrapper')?.dataset.id || target.closest('.qty-product-card-wrapper')?.dataset.id;
      console.log("Клик на .plus-product-qty, productId=", productId);
      if (!productId) {
        console.error("Отсутствует data-id для карточки товара:", productCard);
        return;
      }
      changeQty(productId, 1);
    }

    if (target.classList.contains("minus-product-qty")) {
      e.preventDefault();
      const productCard = target.closest('div'); // Ищем ближайший родительский div
      if (!productCard) {
        console.error("Родительский элемент не найден для кнопки .minus-product-qty:", target);
        return;
      }
      const productId = productCard.querySelector('.qty-product-card-wrapper')?.dataset.id || target.closest('.qty-product-card-wrapper')?.dataset.id;
      console.log("Клик на .minus-product-qty, productId=", productId);
      if (!productId) {
        console.error("Отсутствует data-id для карточки товара:", productCard);
        return;
      }
      changeQty(productId, -1);
    }

    if (target.classList.contains("delete-product")) {
      e.preventDefault();
      const id = target.dataset.id;
      console.log("Клик на .delete-product, id=", id);
      if (!id) {
        console.error("Отсутствует data-id для кнопки .delete-product:", target);
        return;
      }
      removeFromCart(id);
    }

    if (target.classList.contains("submit")) {
      e.preventDefault();
      console.log("Клик по ссылке Сделать заказ");
      checkoutForm.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  });

  // Промокоды
  if (promoButton && promoInput && resultBlock && valuePromo && deletePromo) {
    promoButton.addEventListener("click", async (e) => {
      e.preventDefault();
      const enteredCode = promoInput.value.trim().toLowerCase();
      const cartTotal = getCartTotal();

      if (!enteredCode) {
        showNotification("Введите промокод", true);
        return;
      }

      try {
        const result = await checkPromo(enteredCode);
        const { discount, minAmount } = result;

        if (cartTotal < minAmount) {
          showNotification(`Минимальная сумма для промокода — ${minAmount} L`, true);
          return;
        }

        promoDiscount = Math.round((cartTotal * discount) / 100);
        appliedPromoCode = enteredCode; // Сохраняем применённый промокод
        valuePromo.textContent = `-${promoDiscount} L`;
        resultBlock.style.display = "flex";
        promoButton.disabled = true;
        promoInput.disabled = true;
        console.log(`Промокод применен: code=${enteredCode}, promoDiscount=${promoDiscount}`);
        updateTotals();
      } catch (error) {
        showNotification(error.message || "Неверный промокод", true);
      }
    });

    deletePromo.addEventListener("click", (e) => {
      e.preventDefault();
      promoDiscount = 0;
      appliedPromoCode = null; // Сбрасываем промокод
      valuePromo.textContent = "0 L";
      resultBlock.style.display = "none";
      promoInput.value = "";
      promoButton.disabled = false;
      promoInput.disabled = false;
      updateTotals();
    });
  }

  if (deliverySelect) {
    deliverySelect.addEventListener("change", () => {
      console.log(`deliverySelect changed: value=${deliverySelect.value}`);
      updateTotals();
    });
  }

  if (deliveryButton) {
    deliveryButton.addEventListener("click", (e) => {
      e.preventDefault();
      isDelivery = true;
      localStorage.setItem("isDelivery", "true");
      toggleDeliveryFields(true);
      deliveryButton.classList.add("active");
      pickupButton.classList.remove("active");
      console.log("Режим доставки активирован");
      updateTotals();
    });
  }

  if (pickupButton) {
    pickupButton.addEventListener("click", (e) => {
      e.preventDefault();
      isDelivery = false;
      localStorage.setItem("isDelivery", "false");
      toggleDeliveryFields(false);
      pickupButton.classList.add("active");
      deliveryButton.classList.remove("active");
      console.log("Режим самовывоза активирован");
      updateTotals();
    });
  }

  if (clearCartButton) { // Обновлено имя
    clearCartButton.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Клик по .clear-cart");
      clearCart();
    });
  }

  plusButtons.forEach((btn, idx) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const counter = stickCounters[idx];
      counter.textContent = parseInt(counter.textContent) + 1;
      updateTotals();
    });
  });

  minusButtons.forEach((btn, idx) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const counter = stickCounters[idx];
      const value = parseInt(counter.textContent);
      if (value > 0) counter.textContent = value - 1;
      updateTotals();
    });
  });

  plusLessonButtons.forEach((btn, idx) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      lessonSticks[idx] = (lessonSticks[idx] || 0) + 1;
      saveLessonSticks();
      console.log(`Учебные палочки: idx=${idx}, value=${lessonSticks[idx]}`);
    });
  });

  minusLessonButtons.forEach((btn, idx) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      lessonSticks[idx] = Math.max((lessonSticks[idx] || 0) - 1, 0);
      saveLessonSticks();
      console.log(`Учебные палочки: idx=${idx}, value=${lessonSticks[idx]}`);
    });
  });

  // Обработка отправки формы
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Событие submit сработало!");
      const formData = new FormData(checkoutForm);
      const cartTotal = getCartTotal();
      const location = isDelivery && deliverySelect ? deliverySelect.value : "";
      const delivery = getDeliveryPrice(cartTotal, location);
      const qtySticks = Array.from(stickCounters).map(counter => parseInt(counter.textContent) || 0);
      const qtyLessonsSticks = lessonSticks;

      if (!formData.get("Name") || !formData.get("Phone")) {
        showNotification("Пожалуйста, заполните имя и телефон.", true);
        return;
      }
      if (cart.length === 0) {
        showNotification("Корзина пуста. Добавьте товары перед оформлением заказа.", true);
        return;
      }

      const deliveryType = isDelivery ? "Доставка" : "Самовывоз";

      const orderData = {
        name: formData.get("Name"),
        phone: formData.get("Phone"),
        city: isDelivery ? formData.get("selecter") || null : null,
        street: isDelivery ? formData.get("street") || null : null,
        house: isDelivery ? formData.get("house") || null : null,
        podiezd: isDelivery ? formData.get("podiezd") || null : null,
        etaj: isDelivery ? formData.get("etaj") || null : null,
        app: isDelivery ? formData.get("app") || null : null,
        domofon: isDelivery ? formData.get("domofon") || null : null,
        comment: isDelivery ? formData.get("comment") || null : null,
        comment_order: formData.get("comment-order") || null,
        cart: cart,
        qty_sticks: qtySticks,
        qty_lessons_sticks: qtyLessonsSticks,
        promo_code: appliedPromoCode, // Используем сохранённый промокод
        promo_discount: promoDiscount,
        cart_total: cartTotal,
        delivery_cost: delivery,
        total: Math.max(cartTotal + delivery - promoDiscount, 0),
        delivery_type: deliveryType,
      };

      console.log("Отправка заказа на сервер:", JSON.stringify(orderData, null, 2));

      try {
        const apiKey = await getApiKey();
        const response = await fetch('https://serveryum.vercel.app/api/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify(orderData),
        });
        console.log("Ответ сервера (статус):", response.status);
        const result = await response.json();
        console.log("Ответ сервера (тело):", result);
        if (!response.ok) {
          throw new Error(result.error || 'Ошибка отправки заказа');
        }
        console.log("Заказ успешно отправлен:", result);
        showNotification("Заказ успешно оформлен!");
        clearCart();
        checkoutForm.reset();
        toggleDeliveryFields(isDelivery);
      } catch (error) {
        console.error("Ошибка при отправке заказа:", error.message);
        showNotification(`Ошибка при оформлении заказа: ${error.message}. Попробуйте снова или свяжитесь с поддержкой.`, true);
      }
    });
  }

  // Промокод чекбокс
  if (checkbox && promocodeBlock) {
    promocodeBlock.style.display = "none";
    checkbox.addEventListener("change", () => {
      promocodeBlock.style.display = checkbox.checked ? "flex" : "none";
    });
  }

  // Инициализация
  if (resultBlock) resultBlock.style.display = "none";
  renderCart();
  updateHeaderCart();
  updateTotals();
  renderCheckoutCart();
  toggleDeliveryFields(isDelivery);
  saveLessonSticks();
  updateProductCards(); // Инициализируем карточки товаров
  toggleCartEmpty();
});
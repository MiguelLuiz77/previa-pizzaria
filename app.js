(() => {
  "use strict";

  const body = document.body;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const heroVideo = document.querySelector("[data-hero-video]");
  const loadingScreen = document.querySelector("[data-loading-screen]");
  const siteHeader = document.querySelector("[data-site-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const siteNav = document.querySelector("[data-site-nav]");
  const cartDialog = document.querySelector("[data-cart-dialog]");
  const cartBackdrop = document.querySelector("[data-cart-backdrop]");
  const cartOpenButton = document.querySelector("[data-cart-open]");
  const cartCloseButton = document.querySelector("[data-cart-close]");
  const cartLines = document.querySelector("[data-cart-lines]");
  const cartEmpty = document.querySelector("[data-cart-empty]");
  const cartTotal = document.querySelector("[data-cart-total]");
  const cartWhatsapp = document.querySelector("[data-cart-whatsapp]");
  const toast = document.querySelector("[data-toast]");

  const products = {
    calabresa: { name: "Pizza de Calabresa", price: 5490 },
    frango: { name: "Pizza de Frango com Catupiry", price: 5990 },
    costela: { name: "Pizza de Costela com Barbecue", price: 6490 },
    mussarela: { name: "Pizza de Mussarela", price: 4990 },
    "esfiha-carne": { name: "Esfiha de Carne", price: 990 },
    "esfiha-frango": { name: "Esfiha de Frango com Catupiry", price: 1090 },
    "esfiha-queijo": { name: "Esfiha de Queijo", price: 990 }
  };
  const cart = new Map();
  let lastFocusedElement = null;
  let toastTimer = 0;

  const formatPrice = (value) => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value / 100);

  function itemCount() {
    let count = 0;
    cart.forEach((quantity) => { count += quantity; });
    return count;
  }

  function createCartLine(id, quantity) {
    const product = products[id];
    const line = document.createElement("div");
    line.className = "cart-line";

    const description = document.createElement("div");
    const name = document.createElement("strong");
    name.className = "cart-line-name";
    name.textContent = product.name;
    const price = document.createElement("span");
    price.className = "cart-line-price";
    price.textContent = formatPrice(product.price) + " cada";
    description.append(name, price);

    const controls = document.createElement("div");
    controls.className = "cart-line-controls";

    const decrement = document.createElement("button");
    decrement.type = "button";
    decrement.dataset.cartChange = id;
    decrement.dataset.cartDelta = "-1";
    decrement.setAttribute("aria-label", "Remover uma " + product.name);
    decrement.textContent = "−";

    const count = document.createElement("span");
    count.textContent = String(quantity);
    count.setAttribute("aria-label", quantity + (quantity === 1 ? " unidade" : " unidades"));

    const increment = document.createElement("button");
    increment.type = "button";
    increment.dataset.cartChange = id;
    increment.dataset.cartDelta = "1";
    increment.setAttribute("aria-label", "Adicionar mais uma " + product.name);
    increment.textContent = "+";

    controls.append(decrement, count, increment);
    line.append(description, controls);
    return line;
  }

  function updateCart() {
    const count = itemCount();
    document.querySelectorAll("[data-cart-count]").forEach((counter) => {
      counter.textContent = String(count);
      counter.setAttribute("aria-label", count + (count === 1 ? " item no pedido" : " itens no pedido"));
    });

    cartLines.replaceChildren();
    let total = 0;
    cart.forEach((quantity, id) => {
      cartLines.append(createCartLine(id, quantity));
      total += products[id].price * quantity;
    });

    const hasItems = count > 0;
    cartEmpty.hidden = hasItems;
    cartTotal.textContent = formatPrice(total);
    cartWhatsapp.setAttribute("aria-disabled", String(!hasItems));
    cartWhatsapp.tabIndex = hasItems ? 0 : -1;

    if (hasItems) {
      const orderLines = Array.from(cart, ([id, quantity]) => {
        return quantity + "x " + products[id].name + " — " + formatPrice(products[id].price * quantity);
      });
      const message = "Olá! Gostaria de pedir da CHURRASCOW:\n" + orderLines.join("\n") + "\nTotal demonstrativo: " + formatPrice(total);
      cartWhatsapp.href = "https://wa.me/5512996816467?text=" + encodeURIComponent(message);
    } else {
      cartWhatsapp.href = "https://wa.me/5512996816467";
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }

  function openCart() {
    lastFocusedElement = document.activeElement;
    cartDialog.hidden = false;
    cartBackdrop.hidden = false;
    body.classList.add("cart-open");
    cartCloseButton.focus();
  }

  function closeCart() {
    if (cartDialog.hidden) return;
    cartDialog.hidden = true;
    cartBackdrop.hidden = true;
    body.classList.remove("cart-open");
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") lastFocusedElement.focus();
  }

  document.querySelectorAll("[data-add-product]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.addProduct;
      if (!products[id]) return;
      cart.set(id, (cart.get(id) || 0) + 1);
      updateCart();
      showToast(products[id].name + " adicionada. " + itemCount() + (itemCount() === 1 ? " item no pedido." : " itens no pedido."));
    });
  });

  cartOpenButton.addEventListener("click", openCart);
  cartCloseButton.addEventListener("click", closeCart);
  cartBackdrop.addEventListener("click", closeCart);

  cartLines.addEventListener("click", (event) => {
    const control = event.target.closest("[data-cart-change]");
    if (!control) return;
    const id = control.dataset.cartChange;
    const next = (cart.get(id) || 0) + Number(control.dataset.cartDelta);
    if (next <= 0) cart.delete(id);
    else cart.set(id, next);
    updateCart();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCart();
      setMenuOpen(false);
    }
    if (!cartDialog.hidden && event.key === "Tab") {
      const focusable = Array.from(cartDialog.querySelectorAll("button:not([disabled]), a[href]:not([aria-disabled='true'])"));
      if (!focusable.length) {
        event.preventDefault();
        cartDialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  function setMenuOpen(open) {
    if (!menuToggle || !siteNav) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Fechar navegação" : "Abrir navegação");
    siteNav.classList.toggle("is-open", open);
    updateNavInert();
  }

  function updateNavInert() {
    if (!siteNav || !menuToggle) return;
    const mobile = window.matchMedia("(max-width: 680px)").matches;
    siteNav.inert = mobile && menuToggle.getAttribute("aria-expanded") !== "true";
  }

  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", () => {
      setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
    });
    siteNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenuOpen(false)));
    document.addEventListener("click", (event) => {
      if (menuToggle.getAttribute("aria-expanded") === "true" && !event.target.closest(".header-inner")) setMenuOpen(false);
    });
    updateNavInert();
    window.addEventListener("resize", updateNavInert, { passive: true });
  }

  function markReady() {
    if (body.classList.contains("is-ready")) return;
    window.clearTimeout(loaderTimeout);
    body.classList.remove("is-loading");
    body.classList.add("is-ready");
    if (loadingScreen) loadingScreen.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
      if (loadingScreen) loadingScreen.remove();
    }, prefersReducedMotion.matches ? 0 : 520);
  }

  const loaderTimeout = window.setTimeout(markReady, 2200);
  function syncHeroPlayback() {
    if (!heroVideo) return;
    if (prefersReducedMotion.matches) heroVideo.pause();
    else heroVideo.play().catch(() => {});
  }

  if (heroVideo) {
    heroVideo.addEventListener("canplay", syncHeroPlayback);
    prefersReducedMotion.addEventListener("change", syncHeroPlayback);
    syncHeroPlayback();
  }

  if (!heroVideo || heroVideo.readyState >= 1) markReady();
  else {
    heroVideo.addEventListener("loadedmetadata", markReady, { once: true });
    heroVideo.addEventListener("error", markReady, { once: true });
  }

  let headerFrame = 0;
  function updateHeader() {
    headerFrame = 0;
    if (siteHeader) siteHeader.classList.toggle("is-scrolled", window.scrollY > 28);
  }
  window.addEventListener("scroll", () => {
    if (!headerFrame) headerFrame = window.requestAnimationFrame(updateHeader);
  }, { passive: true });
  updateHeader();

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.13, rootMargin: "0px 0px -24px 0px" });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const impactVideo = document.querySelector("[data-impact-video]");
  if (impactVideo && "IntersectionObserver" in window && !prefersReducedMotion.matches) {
    const impactObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) impactVideo.play().catch(() => {});
        else impactVideo.pause();
      });
    }, { threshold: 0.2 });
    impactObserver.observe(impactVideo);
  }

  const reviewCards = Array.from(document.querySelectorAll("[data-review-card]"));
  const reviewStage = document.querySelector("[data-review-stage]");
  const reviewControls = document.querySelector("[data-review-controls]");
  const reviewCount = document.querySelector("[data-review-count]");
  const reviewLive = document.querySelector("[data-review-live]");
  const reviewPauseButton = document.querySelector("[data-review-pause]");
  const reviewPrevButton = document.querySelector("[data-review-prev]");
  const reviewNextButton = document.querySelector("[data-review-next]");
  let activeReview = 0;
  let reviewTimer = 0;
  let userPausedReviews = prefersReducedMotion.matches;
  let interactionPausedReviews = false;

  function updateReview(index, announce) {
    if (!reviewCards.length) return;
    activeReview = (index + reviewCards.length) % reviewCards.length;
    reviewCards.forEach((card, cardIndex) => {
      const active = cardIndex === activeReview;
      card.classList.toggle("is-active", active);
      card.setAttribute("aria-hidden", String(!active));
    });
    if (reviewCount) reviewCount.textContent = String(activeReview + 1).padStart(2, "0") + " / " + String(reviewCards.length).padStart(2, "0");
    if (announce && reviewLive) {
      const author = reviewCards[activeReview].querySelector(".review-author").textContent;
      reviewLive.textContent = "Avaliação " + (activeReview + 1) + " de " + reviewCards.length + ", de " + author;
    }
  }

  function scheduleReviews() {
    window.clearInterval(reviewTimer);
    if (userPausedReviews || interactionPausedReviews || document.hidden || prefersReducedMotion.matches) return;
    reviewTimer = window.setInterval(() => updateReview(activeReview + 1, false), 8000);
  }

  function updatePauseButton() {
    if (!reviewPauseButton) return;
    reviewPauseButton.textContent = userPausedReviews ? "Retomar" : "Pausar";
    reviewPauseButton.setAttribute("aria-pressed", String(userPausedReviews));
  }

  if (reviewCards.length) {
    updatePauseButton();
    updateReview(0, false);
    reviewPrevButton.addEventListener("click", () => {
      updateReview(activeReview - 1, true);
      scheduleReviews();
    });
    reviewNextButton.addEventListener("click", () => {
      updateReview(activeReview + 1, true);
      scheduleReviews();
    });
    reviewPauseButton.addEventListener("click", () => {
      userPausedReviews = !userPausedReviews;
      updatePauseButton();
      scheduleReviews();
    });
    const reviewArea = document.querySelector(".reviews-layout");
    reviewStage.addEventListener("mouseenter", () => { interactionPausedReviews = true; scheduleReviews(); });
    reviewStage.addEventListener("mouseleave", () => { interactionPausedReviews = false; scheduleReviews(); });
    reviewArea.addEventListener("focusin", () => { interactionPausedReviews = true; scheduleReviews(); });
    reviewArea.addEventListener("focusout", (event) => {
      if (!reviewArea.contains(event.relatedTarget)) {
        interactionPausedReviews = false;
        scheduleReviews();
      }
    });
    document.addEventListener("visibilitychange", scheduleReviews);
    prefersReducedMotion.addEventListener("change", () => {
      if (prefersReducedMotion.matches) userPausedReviews = true;
      updatePauseButton();
      scheduleReviews();
    });
    scheduleReviews();
  }

  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  updateCart();
})();

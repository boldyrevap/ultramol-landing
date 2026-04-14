      // Privacy modal — open/close + focus trap + ARIA
      const privacyModal = document.getElementById("privacy-modal");
      if (privacyModal) {
        let lastFocus = null;
        const focusableSelector =
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

        const openPrivacy = (e) => {
          if (e) e.preventDefault();
          lastFocus = document.activeElement;
          privacyModal.classList.add("active");
          const first = privacyModal.querySelector(focusableSelector);
          if (first) first.focus();
        };
        const closePrivacy = () => {
          privacyModal.classList.remove("active");
          if (lastFocus && typeof lastFocus.focus === "function") {
            lastFocus.focus();
          }
        };

        document.querySelectorAll("[data-open-privacy]").forEach((el) => {
          el.addEventListener("click", openPrivacy);
        });

        privacyModal
          .querySelector(".modal-close")
          .addEventListener("click", closePrivacy);
        privacyModal.addEventListener("click", (e) => {
          if (e.target === privacyModal) closePrivacy();
        });

        // Focus trap + Escape
        privacyModal.addEventListener("keydown", (e) => {
          if (e.key === "Escape") {
            closePrivacy();
            return;
          }
          if (e.key !== "Tab") return;
          const focusable = privacyModal.querySelectorAll(focusableSelector);
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        });
      }

      // Trust grid — static, no JS needed

      // Phone field — keep "+7 " prefix
      const phoneInput = document.getElementById('phone');
      if (phoneInput) {
        const ensurePrefix = () => {
          if (!phoneInput.value.startsWith('+7')) {
            phoneInput.value = '+7 ' + phoneInput.value.replace(/^\+?7?\s*/, '');
          }
        };
        phoneInput.addEventListener('focus', () => {
          if (!phoneInput.value) phoneInput.value = '+7 ';
        });
        phoneInput.addEventListener('input', ensurePrefix);
        phoneInput.addEventListener('keydown', (e) => {
          // Prevent deleting the "+7 " prefix
          if ((e.key === 'Backspace' || e.key === 'Delete') &&
              phoneInput.selectionStart <= 3 && phoneInput.selectionEnd <= 3) {
            e.preventDefault();
          }
        });
      }

      // Feature accordion
      document.querySelectorAll(".feature-item").forEach((item) => {
        item.addEventListener("click", () => {
          const wasOpen = item.classList.contains("open");
          document
            .querySelectorAll(".feature-item.open")
            .forEach((el) => el.classList.remove("open"));
          if (!wasOpen) item.classList.add("open");
        });
      });

      // Navigation scroll + progress bar + sticky CTA
      const nav = document.getElementById("nav");
      const scrollProgress = document.getElementById("scroll-progress");
      const navCta = document.getElementById("nav-cta");
      const hero = document.getElementById("hero");
      // Cache layout-dependent values to avoid forced reflow on every scroll
      let docHeight = 0;
      let viewHeight = 0;
      let heroHeight = 0;
      let scrollTicking = false;

      const measureLayout = () => {
        docHeight = document.documentElement.scrollHeight;
        viewHeight = window.innerHeight;
        heroHeight = hero ? hero.offsetHeight : 0;
      };
      measureLayout();
      window.addEventListener("resize", measureLayout, { passive: true });
      window.addEventListener("load", measureLayout);

      window.addEventListener(
        "scroll",
        () => {
          if (scrollTicking) return;
          scrollTicking = true;
          requestAnimationFrame(() => {
            const y = window.scrollY;
            nav.classList.toggle("scrolled", y > 60);
            const max = docHeight - viewHeight;
            scrollProgress.style.width = max > 0 ? (y / max) * 100 + "%" : "0%";
            if (heroHeight && navCta) {
              navCta.classList.toggle("nav-cta-prominent", y > heroHeight);
            }
            scrollTicking = false;
          });
        },
        { passive: true },
      );

      // Burger menu
      const burger = document.querySelector(".burger");
      const navLinks = document.getElementById("nav-links");

      burger.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("open");
        burger.classList.toggle("active", isOpen);
        burger.setAttribute("aria-expanded", isOpen);
        document.body.classList.toggle("body-menu-open", isOpen);
      });

      navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          navLinks.classList.remove("open");
          burger.classList.remove("active");
          burger.setAttribute("aria-expanded", "false");
          document.body.classList.remove("body-menu-open");
        });
      });

      // Scroll reveal — robust version
      (function () {
        const els = document.querySelectorAll(".reveal");
        if (!("IntersectionObserver" in window)) {
          els.forEach((el) => el.classList.add("visible"));
          return;
        }

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.08, rootMargin: "0px 0px -20px 0px" },
        );

        els.forEach((el) => observer.observe(el));

        // Fallback: mark anything in viewport after 1.5s
        setTimeout(() => {
          els.forEach((el) => {
            if (!el.classList.contains("visible")) {
              const r = el.getBoundingClientRect();
              if (r.top < window.innerHeight + 100) {
                el.classList.add("visible");
              }
            }
          });
        }, 1500);
      })();

      // Form handler — DOM API (CSP-safe) + phone validation
      const contactForm = document.getElementById("contact-form");
      if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const phone = contactForm.querySelector("#phone");
          // Require at least 11 digits for a Russian number (+7 + 10 digits)
          if (phone) {
            const digits = phone.value.replace(/\D/g, "");
            if (digits.length < 11) {
              phone.setCustomValidity("Введите полный номер телефона");
              phone.reportValidity();
              return;
            }
            phone.setCustomValidity("");
          }

          const card = contactForm.closest(".form-card");
          contactForm.style.display = "none";

          const success = document.createElement("div");
          success.className = "form-success";

          const icon = document.createElement("div");
          icon.className = "form-success-icon";
          icon.textContent = "✓";

          const heading = document.createElement("h3");
          heading.textContent = "Заявка отправлена";

          const body = document.createElement("p");
          body.textContent = "Мы свяжемся с вами в течение рабочего дня.";

          const resetBtn = document.createElement("button");
          resetBtn.type = "button";
          resetBtn.className = "form-reset-btn";
          resetBtn.textContent = "Отправить ещё одну";
          resetBtn.addEventListener("click", () => {
            success.remove();
            contactForm.style.display = "block";
            contactForm.reset();
            const ph = contactForm.querySelector("#phone");
            if (ph) ph.value = "+7 ";
          });

          success.append(icon, heading, body, resetBtn);
          card.appendChild(success);
        });
      }

      // Smooth scroll
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener("click", (e) => {
          const href = a.getAttribute("href");
          if (href === "#" || href.length < 2) return;
          e.preventDefault();
          const t = document.querySelector(href);
          if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });

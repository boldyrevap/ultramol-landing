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

      // Захват UTM и yclid/gclid при первом заходе, хранение в sessionStorage.
      // Источник правды: первый переход с метками. Повторные заходы без меток
      // не перетирают зафиксированный источник.
      const UTM_STORAGE_KEY = "ultramol_attribution";
      const UTM_FIELDS = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "yclid",
        "gclid",
      ];

      function captureAttribution() {
        const params = new URLSearchParams(location.search);
        const fromUrl = {};
        let hasAny = false;
        UTM_FIELDS.forEach((k) => {
          const v = params.get(k);
          if (v) {
            fromUrl[k] = v;
            hasAny = true;
          }
        });

        let stored = null;
        try {
          stored = JSON.parse(sessionStorage.getItem(UTM_STORAGE_KEY) || "null");
        } catch (_) {}

        if (hasAny && !stored) {
          fromUrl.first_referrer = document.referrer || "";
          fromUrl.first_landing = location.href;
          fromUrl.first_visit_at = new Date().toISOString();
          try {
            sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl));
          } catch (_) {}
          return fromUrl;
        }
        return stored || fromUrl;
      }

      const attribution = captureAttribution();

      // Form handler — приём заявок на российском сервере (152-ФЗ, локализация ПД).
      // Эндпоинт lead.php размещён на ultramol.ru (РФ-хостинг). Данные больше НЕ уходят в Google.
      const FORM_ENDPOINT = "https://api.ultramol.ru/lead.php";

      const contactForm = document.getElementById("contact-form");
      if (contactForm) {
        const submitBtn = contactForm.querySelector(".form-submit");
        const originalBtnText = submitBtn ? submitBtn.textContent : "";

        const setError = (msg) => {
          let err = contactForm.querySelector(".form-error");
          if (!err) {
            err = document.createElement("div");
            err.className = "form-error";
            err.setAttribute("role", "alert");
            contactForm.insertBefore(err, submitBtn);
          }
          err.textContent = msg;
        };

        const clearError = () => {
          const err = contactForm.querySelector(".form-error");
          if (err) err.remove();
        };

        const resetSubmitBtn = () => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
          }
        };

        const showSuccess = () => {
          resetSubmitBtn();
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
            resetSubmitBtn();
          });

          success.append(icon, heading, body, resetBtn);
          card.appendChild(success);
        };

        contactForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          clearError();

          const phone = contactForm.querySelector("#phone");
          if (phone) {
            const digits = phone.value.replace(/\D/g, "");
            if (digits.length < 11) {
              phone.setCustomValidity("Введите полный номер телефона");
              phone.reportValidity();
              return;
            }
            phone.setCustomValidity("");
          }

          const payload = {
            name: contactForm.name.value.trim(),
            company: contactForm.company.value.trim(),
            phone: contactForm.phone.value.trim(),
            email: contactForm.email.value.trim(),
            material: contactForm.material.value.trim(),
            page: location.href,
            referrer: document.referrer || "",
            userAgent: navigator.userAgent,
            utm_source: attribution.utm_source || "",
            utm_medium: attribution.utm_medium || "",
            utm_campaign: attribution.utm_campaign || "",
            utm_term: attribution.utm_term || "",
            utm_content: attribution.utm_content || "",
            yclid: attribution.yclid || "",
            gclid: attribution.gclid || "",
            first_referrer: attribution.first_referrer || "",
            first_landing: attribution.first_landing || "",
            first_visit_at: attribution.first_visit_at || "",
          };

          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Отправка…";
          }

          try {
            // Приём на РФ-сервере (api.ultramol.ru/lead.php): заявка пишется
            // в CSV на российском сервере + письмо. sendBeacon — устойчивый
            // путь без preflight/CORS-конфликтов; fallback — fetch no-cors.
            const bodyStr = JSON.stringify(payload);
            let sent = false;
            if (typeof navigator.sendBeacon === "function") {
              const blob = new Blob([bodyStr], {
                type: "text/plain;charset=utf-8",
              });
              sent = navigator.sendBeacon(FORM_ENDPOINT, blob);
            }
            if (!sent) {
              await fetch(FORM_ENDPOINT, {
                method: "POST",
                mode: "no-cors",
                redirect: "follow",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: bodyStr,
                keepalive: true,
              });
            }
            // Чекбокс согласия обязательный — если форма валидна, он
            // отмечен. Повышаем это до согласия на аналитику, чтобы Метрика
            // зафиксировала лида (иначе ym не загружен — цель теряется).
            const consent = contactForm.querySelector("#consent");
            if (consent && consent.checked &&
                typeof window.__umGrantConsentFromForm === "function") {
              window.__umGrantConsentFromForm();
            }
            if (typeof window.__umTrackGoal === "function") {
              window.__umTrackGoal("form_submit");
            }
            showSuccess();
          } catch (err) {
            setError(
              "Не удалось отправить. Проверьте соединение или позвоните нам — контакты в шапке."
            );
            resetSubmitBtn();
          }
        });
      }

      // Phone & email click tracking (Метрика цели)
      document.addEventListener("click", (e) => {
        const a = e.target.closest && e.target.closest("a[href]");
        if (!a) return;
        const href = a.getAttribute("href") || "";
        if (typeof window.__umTrackGoal !== "function") return;
        if (href.startsWith("tel:")) {
          window.__umTrackGoal("phone_click");
        } else if (href.startsWith("mailto:")) {
          window.__umTrackGoal("email_click");
        }
      });

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

      // ═══════════════════════════════════════
      // COOKIE NOTICE (152-ФЗ информирование, Яндекс.Метрика)
      // ═══════════════════════════════════════
      // Вариант 1 (пассивное информирование): счётчик грузится сразу для всех
      // посетителей — иначе недосчитываем клики и цели с платной рекламы.
      // Баннер — уведомление, показывается один раз до нажатия «Понятно».
      // Соответствует практике 152-ФЗ (информирование + политика), без
      // GDPR-style жёсткого opt-in.
      (function () {
        const STORAGE_KEY = "ultramol_cookie_notice";
        const banner = document.getElementById("cookie-banner");
        const YM_COUNTER_ID = 108687631;

        if (!YM_COUNTER_ID) {
          if (banner) banner.remove();
          return;
        }

        function initMetrica() {
          if (window.ym) return;
          (function (m, e, t, r, i, k, a) {
            m[i] =
              m[i] ||
              function () {
                (m[i].a = m[i].a || []).push(arguments);
              };
            m[i].l = 1 * new Date();
            for (var j = 0; j < document.scripts.length; j++) {
              if (document.scripts[j].src === r) return;
            }
            (k = e.createElement(t)),
              (a = e.getElementsByTagName(t)[0]),
              (k.async = 1),
              (k.src = r),
              a.parentNode.insertBefore(k, a);
          })(
            window,
            document,
            "script",
            "https://mc.yandex.ru/metrika/tag.js",
            "ym",
          );
          window.ym(YM_COUNTER_ID, "init", {
            clickmap: true,
            trackLinks: true,
            accurateTrackBounce: true,
            webvisor: true,
            ecommerce: "dataLayer",
          });
        }

        function trackGoal(name, params) {
          if (window.ym) window.ym(YM_COUNTER_ID, "reachGoal", name, params);
        }
        window.__umTrackGoal = trackGoal;
        // Метрика теперь грузится всегда, поэтому явный «грант» из формы —
        // no-op (оставлен для совместимости с обработчиком формы).
        window.__umGrantConsentFromForm = function () {};

        // Счётчик — сразу, независимо от баннера.
        initMetrica();

        if (!banner) return;

        const seen = (function () {
          try {
            return localStorage.getItem(STORAGE_KEY) === "seen";
          } catch (_) {
            return false;
          }
        })();

        if (!seen) banner.hidden = false;

        const dismiss = document.getElementById("cookie-accept");
        if (dismiss) {
          dismiss.addEventListener("click", () => {
            try {
              localStorage.setItem(STORAGE_KEY, "seen");
            } catch (_) {}
            banner.hidden = true;
          });
        }
      })();

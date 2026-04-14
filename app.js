      // Privacy modal
      const privacyModal = document.getElementById("privacy-modal");
      if (privacyModal) {
        privacyModal
          .querySelector(".modal-close")
          .addEventListener("click", () => {
            privacyModal.classList.remove("active");
          });
        privacyModal.addEventListener("click", (e) => {
          if (e.target === privacyModal)
            privacyModal.classList.remove("active");
        });
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape") privacyModal.classList.remove("active");
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
      window.addEventListener(
        "scroll",
        () => {
          nav.classList.toggle("scrolled", window.scrollY > 60);
          // Scroll progress
          const pct =
            (window.scrollY /
              (document.documentElement.scrollHeight - window.innerHeight)) *
            100;
          scrollProgress.style.width = pct + "%";
          // Sticky CTA — fill orange after hero
          if (hero && navCta) {
            navCta.classList.toggle(
              "nav-cta-prominent",
              window.scrollY > hero.offsetHeight,
            );
          }
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

      // Form handler
      function handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const card = form.closest(".form-card");
        form.style.display = "none";
        const success = document.createElement("div");
        success.className = "form-success";
        success.innerHTML =
          "<div class=\"form-success-icon\">✓</div><h3>Заявка отправлена</h3><p>Мы свяжемся с вами в течение рабочего дня.</p><button class=\"form-reset-btn\" onclick=\"this.parentElement.remove();document.getElementById('contact-form').style.display='block';document.getElementById('contact-form').reset();\">Отправить ещё одну</button>";
        card.appendChild(success);
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

// Loads the page shell and each homepage section from its own file.
const sectionFiles = [
  "hero",
  "services",
  "engineering",
  "projects",
  "about",
  "contact",
];

async function loadHtml(target, path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Could not load ${path}: ${response.status}`);
  }
  target.insertAdjacentHTML("beforeend", await response.text());
}

async function loadPage() {
  const headerTarget = document.querySelector("#site-header");
  const sectionsTarget = document.querySelector("#page-sections");
  const footerTarget = document.querySelector("#site-footer");

  await loadHtml(headerTarget, "./components/header.html");
  
  initializeMobileMenu();

  for (const section of sectionFiles) {
    await loadHtml(sectionsTarget, `./sections/${section}.html`);
  }

  await loadHtml(footerTarget, "./components/footer.html");
  initializeInquiryForm();

  // The shader script is isolated from the page markup.
  await import("./shader.js");
}

function initializeInquiryForm() {
  const form = document.querySelector("#inquiryForm");
  const successMessage = document.querySelector("#formSuccess");

  if (!form || !successMessage) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    successMessage.classList.remove("hidden");
    form.reset();
  });
}

loadPage().catch((error) => {
  console.error("Website initialization failed:", error);
});


//This is for the menu btn

function initializeMobileMenu() {
    const menu = document.querySelector("#mobileMenu");
    const overlay = document.querySelector("#menuOverlay");
    const openButton = document.querySelector("#menuOpen");
    const closeButton = document.querySelector("#menuClose");
    const navLinks = document.querySelectorAll(".mobile-nav-link");

    if (!menu || !overlay || !openButton || !closeButton) return;

    function openMenu() {
        menu.classList.remove("translate-x-full");
        overlay.classList.remove("opacity-0", "invisible");

        menu.setAttribute("aria-hidden", "false");
        openButton.setAttribute("aria-expanded", "true");

        document.body.classList.add("overflow-hidden");
    }

    function closeMenu() {
        menu.classList.add("translate-x-full");
        overlay.classList.add("opacity-0", "invisible");

        menu.setAttribute("aria-hidden", "true");
        openButton.setAttribute("aria-expanded", "false");

        document.body.classList.remove("overflow-hidden");
    }

    openButton.addEventListener("click", openMenu);
    closeButton.addEventListener("click", closeMenu);
    overlay.addEventListener("click", closeMenu);

    navLinks.forEach(link => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });
}


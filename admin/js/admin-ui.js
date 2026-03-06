export function showSection(sectionName) {
  document.querySelectorAll(".admin-section").forEach(section => {
    section.classList.add("hidden");
  });

  const target = document.getElementById(`${sectionName}Section`);
  if (target) target.classList.remove("hidden");
}

export function bindSidebarNavigation() {
  document.querySelectorAll("[data-section]").forEach(button => {
    button.addEventListener("click", () => {
      showSection(button.dataset.section);
    });
  });
}
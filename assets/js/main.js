const menuToggle = document.querySelector('.menu-toggle');
  const navList = document.querySelector('nav ul');
  menuToggle.addEventListener('click', () => {
    navList.classList.toggle('show');
  });
  // Optional: Hide menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuToggle.contains(e.target) && !navList.contains(e.target)) {
      navList.classList.remove('show');
    }
  });
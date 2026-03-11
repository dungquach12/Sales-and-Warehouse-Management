const rightMenu = document.getElementById('right-menu');
const rightMenuToggle = document.getElementById('right-menu-toggle');

rightMenuToggle.addEventListener('click', function () {
  rightMenu.classList.toggle('expanded');

  // reset all collapse menus to closed
  document.querySelectorAll('#right-menu .collapse').forEach(el => {
    const bsCollapse = bootstrap.Collapse.getInstance(el);
    if (bsCollapse) bsCollapse.hide();
  });
});

// expand sidebar when submenu clicked while collapsed
document.querySelectorAll('.submenu-trigger').forEach(el => {
  el.addEventListener('click', function () {
    if (!rightMenu.classList.contains('expanded')) {
      rightMenu.classList.add('expanded');
    }
  });
});
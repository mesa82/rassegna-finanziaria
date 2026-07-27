
const toggle = document.querySelector('.mobile-toggle');
const sidebar = document.querySelector('.sidebar');
if(toggle && sidebar){
  toggle.addEventListener('click',()=>sidebar.classList.toggle('open'));
  sidebar.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>sidebar.classList.remove('open')));
}
document.querySelectorAll('[data-print]').forEach(btn=>btn.addEventListener('click',()=>window.print()));
document.querySelectorAll('[data-refresh]').forEach(btn=>btn.addEventListener('click',()=>{
  btn.textContent='Dati aggiornati';
  setTimeout(()=>btn.textContent='↻ Aggiorna dati',1600);
}));

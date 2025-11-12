const membros = document.querySelectorAll('.membro');

membros.forEach(membro => {
  membro.addEventListener('click', () => {
    membro.classList.toggle('flipped');
  });
});

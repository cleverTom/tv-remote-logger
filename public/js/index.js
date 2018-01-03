const btn = document.querySelector('#btn');
const input = document.querySelector('#page');
input.focus();

btn.addEventListener('click', function () {
    const page = input.value;
    window.location.href = '/console/' + page;
});

new Clipboard(document.getElementById('cp1'));
new Clipboard(document.getElementById('cp2'));
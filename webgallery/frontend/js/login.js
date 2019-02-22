/* jshint esversion: 6 */

(function(){
  "use strict"

  window.addEventListener('load', () => {
    api.onErrorUpdate(err => {
      console.error(err);
    });

    api.onErrorUpdate(err => {
      const err_box = document.querySelector('#error_box');
      err_box.innerHTML = err;
      err_box.style.visibility = 'visible';
    });

    api.onUserUpdate(username => {
      if (username) window.location.href = '/';
    });

    const submit = () => {
      if (document.querySelector("form").checkValidity()){
        var username = document.querySelector("form [name=username]").value;
        var password = document.querySelector("form [name=password]").value;
        var action = document.querySelector("form [name=action]").value;
        api[action](username, password, err => {
            if (err) document.querySelector('.error_box').innerHTML = err;
        });
      }
    }

    document.querySelector('#signin').addEventListener('click', () => {
      document.querySelector("form [name=action]").value = 'signin';
      submit();
    });

    document.querySelector('#signup').addEventListener('click', () => {
      document.querySelector("form [name=action]").value = 'signup';
      submit();
    });

    document.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
    });

  });
}())

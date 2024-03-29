/* jshint esversion: 6 */

(function() {
  "use strict";

  // scroll button components
  // images
  const imageScrollButtons = (imageId) => {
    const image_buttons = document.createElement('div');
    image_buttons.className = 'scroll_images scroll_buttons';
    image_buttons.innerHTML = `
    <button class="btn light_brown_btn prev_image">Previous Image</button>
    <button class="btn light_brown_btn next_image">Next Image</button>
    <hr />
    `;

    image_buttons.getElementsByClassName('next_image')[0].addEventListener('click', (e) => {
      e.preventDefault();
      api.setPage(0);
      api.changeImage(true, imageId);
    });

    image_buttons.getElementsByClassName('prev_image')[0].addEventListener('click', (e) => {
      e.preventDefault();
      api.setPage(0);
      api.changeImage(false, imageId);
    });

    return image_buttons;
  };

  // comments
  const commentScrollButtons = (imageId, page) => {
    const comment_buttons = document.createElement('div');
    comment_buttons.className = 'scroll_comments scroll_buttons';
    comment_buttons.innerHTML = `
    <hr />
    <button class="btn light_brown_btn prev_comment">Previous Page</button>
    <button class="btn light_brown_btn next_comment">Next Page</button>
    `;

    comment_buttons.getElementsByClassName('next_comment')[0].addEventListener('click', (e) => {
      e.preventDefault();
      api.setPage(page + 1);
      api.changeComment(true, imageId, page + 1);
    });

    comment_buttons.getElementsByClassName('prev_comment')[0].addEventListener('click', (e) => {
      e.preventDefault();
      if (page !== 0) {
        api.setPage(page - 1);
        api.changeComment(false, imageId, page - 1);
      }
    });

    return comment_buttons;
  };

  // form for commenting on the current image
  const commentForm = (imageId) => {
    let elmt = document.createElement('form');
    elmt.id = 'add_comment_form';
    elmt.className = 'shadow add_form';
    elmt.innerHTML = `
      <div class="comment_form_title heading">Add Comment</div>
      <textarea type="text" id="comment_text" class="comment_form_element form_box" placeholder="Enter your comment" name="comment_text" required></textarea>
      <button type="submit" class="btn light_brown_btn" value="submit_comment">Submit Comment</button>
    `;

    elmt.append(commentScrollButtons(imageId, parseInt(window.location.search.split('page=')[1])));

    elmt.addEventListener('submit', (e) => {
      e.preventDefault();

      const content = elmt.querySelector('textarea').value;

      if (e.target.id === 'add_comment_form') api.addComment(imageId, content);
    });

    return elmt;
  };

  // image viewer panel
  const createImageElement = (imageId, author, title, date) => {
    let elmt = document.createElement('div');
    elmt.className = 'image shadow';
    elmt.innerHTML = `
      <div class="current_image_title heading">${title}</div>
      <img src="/api/images/${imageId}/image" />
      <div class="current_image_info">
        <p class="current_image_author">by ${author}</p>
        <p class="current_image_date">uploaded: ${new Date(date).toString()}</p>
      </div>
      <button class="delete-image-btn btn light_brown_btn">Delete Image</button>
    `;

    const img = elmt.querySelector('img');
    
    // if user uploads an invalid image, use a default one
    img.addEventListener('error', () => {
      img.src = '../media/error-image.png';
    });

    elmt.prepend(imageScrollButtons(imageId));

    elmt.querySelector('.delete-image-btn')
      .addEventListener('click', () => {
        api.deleteImage(imageId);
      });

    return elmt;
  };

  // generic comment component
  const createCommentElement = (commentId, author, content, date) => {
    let elmt = document.createElement('div');
    elmt.className = 'comment shadow';
    elmt.innerHTML = `
      <div class="comment_info">
        <div class="comment_author">by ${author}</div>
        <div class="comment_text">${content}</div>
        <div class="comment_date">posted on: ${new Date(date).toString()}</div>
      </div>
      <div class="delete-comment-icon icon">X</div>
    `;

    elmt.querySelector('.delete-comment-icon')
      .addEventListener('click', () => {
        api.deleteComment(commentId);
      });
    
    return elmt;
  };

  // gets all the info from the publisher and updates the components
  const rerenderItems = (image, comments) => {
    const image_content = document.getElementById('image_content');
    image_content.innerHTML = '';

    if (image) {
      image_content.append(createImageElement(image._id, image.author, image.title, image.createdAt));
      image_content.append(commentForm(image._id));

      comments.forEach(comment => {
        image_content.append(createCommentElement(comment._id, comment.author, comment.content, comment.createdAt));
      });
    }
  };

  window.addEventListener('load', () => {

    // setting default page parameter for comments
    if (!window.location.search.includes('page')) window.history.replaceState({}, '', document.location.href + '?page=0');

    // add error listeners
    api.onErrorUpdate(err => {
      console.error(err);
    });

    api.onErrorUpdate(err => {
      const err_box = document.querySelector('#error_box');
      err_box.innerHTML = err;
      err_box.style.visibility = 'visible';
    });

    // kick user out if they're not logged in
    api.onSessionUpdate(username => {
      if (!username) window.location.href = '/login.html';
    });

    // figure out the list of users we can look at
    api.onUserUpdate(users => {
      const gallery_username = document.querySelector('#gallery_username');
      gallery_username.innerHTML = '';
      const elmt = document.createElement('option');
      elmt.value = 'Select a gallery';
      elmt.innerHTML = 'Select a gallery';
      gallery_username.append(elmt);
      if (users.length === 0) document.querySelector('#welcome_message').classList.remove('hidden');
      else {
        users.forEach(username => {
          const elmt = document.createElement('option');
          elmt.value = username._id;
          elmt.innerHTML= username._id;
          if (api.getGallery() === username._id) elmt.selected = 'selected';
          gallery_username.append(elmt);
        });
      };
    });

    // add image/comment listener
    api.onImageUpdate((imageMetadata, comments) => { rerenderItems(imageMetadata, comments); });
    api.onCommentUpdate((imageMetadata, comments) => { rerenderItems(imageMetadata, comments); });

    // form toggler
    const toggle = document.getElementById('toggle');

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      let img_form = document.getElementById('add_image_form');

      if (img_form.style.display === 'none') {
        toggle.innerHTML = '[-]';
        img_form.style.display = 'flex';
      } else {
        toggle.innerHTML = '[+]';
        img_form.style.display = 'none';
      }
    });

    // logout button (for now)
    const logoutbutton = document.getElementById('logout');
    logoutbutton.addEventListener('click', () => {
      api.signout();
    });

    // changes the current gallery
    const select_gallery = document.getElementById('gallery_username');
    select_gallery.addEventListener('change', () => {
      const new_gallery = select_gallery.options[select_gallery.selectedIndex].value;
      api.setGallery(new_gallery);
    })

    document.getElementById('add_image_form').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('post_title').value;
      const image = document.getElementById('post_image').files[0];

      document.getElementById('add_image_form').reset();

      if (e.target.id === 'add_image_form') {
        api.addImage(title, image);
      }
    });
  });
}());

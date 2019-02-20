/* jshint esversion: 6 */

const api = (function(){
  "use strict";

  let module = {};
  const listeners = [];
  const errorListeners = [];
  
  /*  ******* Data types *******
      image objects must have at least the following attributes:
          - (String) imageId 
          - (String) title
          - (String) author
          - (String) url
          - (Date) date
  
      comment objects must have the following attributes
          - (String) commentId
          - (String) imageId
          - (String) author
          - (String) content
          - (Date) date
   
  ****************************** */

  // makes an asynchronous ajax request
  const send = (method, url, data, content_type, callback) => {
    const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        if (![200, 201].includes(xhr.status)) callback(`[${xhr.status}]: ${xhr.responseText}`, null);
        else callback(null, JSON.parse(xhr.responseText));
    };
    xhr.open(method, url, true);
    if (!data) xhr.send();
    else {
      if (content_type === 'multipart/form-data') {
        let form = new FormData();
        for (const key in data) { form.append(key, data[key]); }

        // not setting the content type for multipart so browser can auto-detect and set Boundary header
        xhr.send(form);
      } else {
        xhr.setRequestHeader('content-type', content_type);
        xhr.send(JSON.stringify(data));
      }
    }
  };

  // gets the image metadata and the comments
  const getImageMetadataAndComments = (imageId, page) => {
    api.getImage(imageId, (err, imageMetadata) => {
      if (err) notifyErrorListeners(err);
      api.getComments(imageId, page, (err, comments) => {
        if (err) notifyErrorListeners(err);
        listeners.forEach(listener => {
          listener(imageMetadata, comments);
        });
      });
    });
  };

  const notifyListeners = (img=null, page=0) => {
    // default to latest image if no img is given
    if (!img) {
      api.getImages((err, imgs) => {
        if (err) notifyErrorListeners(err);
        else if (imgs.length === 0) {
          listeners.forEach(listener => {
            listener(null, []);
          });
        } else {
          getImageMetadataAndComments(imgs[0]._id, page);
        }
      });
    } else { getImageMetadataAndComments(img, page); }
  };

  const notifyErrorListeners = (err) => {
    errorListeners.forEach(listener => { listener(err); });
  };

  // changes the image page
  module.changeImage = (forward, imageId) => {
    api.getImages((err, imgs) => {
      if (err) notifyErrorListeners(err);

      const imgIndex = imgs.findIndex(img => img._id === imageId);
      if (imgIndex > -1) {
        const newIndex = forward ? (imgIndex + 1) % imgs.length : (imgIndex - 1) % imgs.length;

        // js bug doesn't mod negative #'s properly so adding length back into index
        notifyListeners(imgs[newIndex < 0 ? newIndex + imgs.length : newIndex]._id);
      }
    });
  };

  // changes the comment page for the current image
  module.changeComment = (forward, imageId, page) => {
    api.getComments(imageId, page, (err, cmts) => {
      if (err) notifyErrorListeners(err);

      if (cmts.length !== 0)
        notifyListeners(imageId, page);
      else {
        // if no items available go back to the previous page
        if (forward) api.setPage(page - 1);
        else api.setPage(page + 1);
      }
    });
  };
 
  // add an image to the gallery
  module.addImage = function(title, author, image){
    const new_image = {
      title,
      author,
      image
    };

    send('POST', `/api/images/`, new_image, 'multipart/form-data', (err, img) => {
      if (err) return notifyErrorListeners(err);
      notifyListeners(img._id);
    });
  };

  // delete an image from the gallery given its imageId
  module.deleteImage = function(imageId){
    send('DELETE', `/api/images/${imageId}/`, null, null, (err) => {
      if (err) return notifyErrorListeners(err);
      api.setPage(0);
      notifyListeners();
    });
  };
  
  // get an image from the gallery given its imageId
  module.getImage = function(imageId, callback) {
    send('GET', `/api/images/${imageId}/`, null, null, callback);
  };

  // get all images
  module.getImages = function(callback) {
    send('GET', `/api/images/`, null, null, callback);
  };

  // set the current image in memory
  module.setPage = (page) => {
    const new_page = 'page=';
    window.history.replaceState({}, '', document.location.href.replace(/page=.*/, new_page + page));
  };
  
  // add a comment to an image
  module.addComment = function(imageId, author, content){
    const data = {
      image_id: imageId,
      author,
      content
    };

    send('POST', `/api/images/${imageId}/comments/`, data, 'application/json', (err) => {
      if (err) return notifyErrorListeners(err);
      notifyListeners(imageId);
    });
  };
  
  // delete a comment to an image
  module.deleteComment = function(commentId) {
    send('DELETE', `/api/comments/${commentId}/`, null, null, (err, oldCmt) => {
      if (err) return notifyErrorListeners(err);
      api.setPage(0);
      notifyListeners(oldCmt.image_id);
    });
  };
  
  // return a set of 10 comments using pagination
  // page=0 returns the 10 latest messages
  // page=1 the 10 following ones and so on
  module.getComments = function(imageId, page, callback){
    send('GET', `/api/images/${imageId}/comments/?page=${page}`, null, null, callback);
  };
  
  // register an image listener
  // to be notified when an image is added or deleted from the gallery
  module.onImageUpdate = function(listener){
    listeners.push(listener);
    notifyListeners();
  };
  
  // register an comment listener
  // to be notified when a comment is added or deleted to an image
  module.onCommentUpdate = function(listener){
    listeners.push(listener);
    notifyListeners();
  };

  // register an error listener to be notified when an error propagates
  module.onErrorUpdate = (listener) => {
    errorListeners.push(listener);
  };

  const refresh = (imageId) => {
    setTimeout(function(e){
        notifyListeners(imageId);
        refresh();
    }, 2000);
  };
  
  return module;
})();

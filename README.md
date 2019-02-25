# Pik Stok API Docs

## Introduction
Welcome to the Pik Stok API docs! Here you will find instructions on how to use the API and the types of behaviour you can expect.

## Authentication

### Signin

- Description: signin to the application
- Request: `POST /api/signin/`
  - content-type: `application/json`
  - body: object
    - username: (string) user's username
    - password: (string) user's password
- Response: 200
  - content-type: `application/json`
  - body: string
    - User with username signed in
- Response: 401
  - content-type: `application/json`
  - body: string
    - If credentials were incorrect, access denied

```bash
$ curl --request POST \
    --url http://localhost:3000/api/signin/ \
    --header 'content-type: application/json' \
    --data '{
    "username": "kevin",
    "password": "iscool"
  }'
```

### Signout

- Description: signout of the application
- Request: `GET /api/signout/`
- Response: 200
  - content-type: `application/json`
  - body: string
    - User with username signed out
- Response: 401
  - body: string
    - Access denied

```bash
$ curl --request GET \
    --url http://localhost:3000/api/signout/
```

### Signup

- Description: signup for the application
- Request: `POST /api/signup/`
  - content-type: `application/json`
  - body: object
    - username: (string) user's username
    - password: (string) user's password
- Response: 200
  - content-type: `application/json`
  - body: string
    - User with username created
- Response: 409
  - content-type: `application/json`
  - body: string
    - User with username already exists
- Response: 500
  - content-type: `application/json`
  - body: string
    - Internal server error

```bash
$ curl --request POST \
    --url http://localhost:3000/api/signup/ \
    --header 'content-type: application/json' \
    --data '{
    "username": "kevin",
    "password": "iscool"
  }'
```

## Create

### Images

- Description: create a new image
- Request: `POST /api/images/`
    - content-type: `multipart/form-data`
    - form-data: list of key/value pairs
      - title: (string) the title of the image
      - image: (string) the absolute path to a file
- Response: 201
    - content-type: `application/json`
    - body: object
      - _id: (string) the image id
      - title: (string) the title of the image
      - author: (string) the author's username
      - imageData: (object) metadata of the uploaded image
        - fieldname: (string) image field name
        - originalname: (string) name of the file (image)
        - encoding: (string) file encoding
        - mimetype: (string) mimetype of the file
        - destination: (string) relative path of the image's upload destination
        - filename: (string) hashed version of the originalname
        - path: (string) relative path of the file in destination
        - size: (int) size of the file
      - createdAt: (Date) the upload date of the image
      - updatedAt: (Date) the date this image was last updated
- Response: 400
  - body: string
    - Missing required parameters: [title, author, image]
- Response: 401
  - body: string
    - Access denied
- Response: 500
  - body: string
    - Error message returned by the server from the operation

```bash
$ curl --request POST \
    --url http://localhost:3000/api/images \
    --form 'title=Great Image' \
    --form 'author=rakin' \
    --form 'image=@/home/users/rakin/cat.jpeg'
```
> Note: The `@` symbol is necessary in the value of the `image` key when using curl.

### Comments

- Description: create a new comment
- Request: `POST /api/images/:image_id/comments/`
    - content-type: `application/json`
    - body: object
      - content: (string) the comment the author wants to make
- Response: 201
    - content-type: `application/json`
    - body: object
      - _id: (string) the comment id
      - image_id: (string) the image id specified in the URL parameter
      - content: (string) the comment the author wanted to make
      - author: (string) the author's username
      - createdAt: (Date) the create date of the comment
      - updatedAt: (Date) the date this comment was last updated
- Response: 401
  - body: string
    - Access denied
- Response: 500
  - body: string
    - Error message returned by the server from the operation

```bash
$ curl --request POST \
    --url http://localhost:3000/api/images/tIdLeOaSLieftvdu/comments \
    --header 'content-type: application/json' \
    --data '{
    "author": "kevin",
    "content": "this is great"
  }'
```

## Read

### Images

- Description: retrieve a list of image metadata
- Request: `GET /api/images/`
- Response: 200
  - content-type: `application/json`
  - body: [object] (list of objects)
    - _id: (string) the image id
    - title: (string) the title of the image
    - author: (string) the author's username
    - imageData: (object) metadata of the uploaded image
      - fieldname: (string) image field name
      - originalname: (string) name of the file (image)
      - encoding: (string) file encoding
      - mimetype: (string) mimetype of the file
      - destination: (string) relative path of the image's upload destination
      - filename: (string) hashed version of the originalname
      - path: (string) relative path of the file in destination
      - size: (int) size of the file
    - createdAt: (Date) the upload date of the image
    - updatedAt: (Date) the date this image was last updated
- Response: 401
  - body: string
    - Access denied
- Response: 500
  - body: string
    - Error message returned by the server from the operation

```bash
$ curl --request GET \
  --url http://localhost:3000/api/images/
```

- Description: retrieve a list of image metadata filtered by username
- Request: `GET /api/images/`
- Response: 200
  - content-type: `application/json`
  - body: [object] (list of objects)
    - _id: (string) the image id
    - title: (string) the title of the image
    - author: (string) the author's username
    - imageData: (object) metadata of the uploaded image
      - fieldname: (string) image field name
      - originalname: (string) name of the file (image)
      - encoding: (string) file encoding
      - mimetype: (string) mimetype of the file
      - destination: (string) relative path of the image's upload destination
      - filename: (string) hashed version of the originalname
      - path: (string) relative path of the file in destination
      - size: (int) size of the file
    - createdAt: (Date) the upload date of the image
    - updatedAt: (Date) the date this image was last updated
- Response: 401
  - body: string
    - Access denied
- Response: 500
  - body: string
    - Error message returned by the server from the operation

```bash
$ curl --request GET \
  --url http://localhost:3000/api/images/user/kevin/
```

- Description: retrieve a specific image's metadata
- Request: `GET /api/images/:image_id`
- Response: 200
  - content-type: `application/json`
  - body: object
    - _id: (string) the image id
    - title: (string) the title of the image
    - author: (string) the author's username
    - imageData: (object) metadata of the uploaded image
      - fieldname: (string) image field name
      - originalname: (string) name of the file (image)
      - encoding: (string) file encoding
      - mimetype: (string) mimetype of the file
      - destination: (string) relative path of the image's upload destination
      - filename: (string) hashed version of the originalname
      - path: (string) relative path of the file in destination
      - size: (int) size of the file
    - createdAt: (Date) the upload date of the image
    - updatedAt: (Date) the date this image was last updated
- Response: 401
  - body: string
    - Access denied
- Response: 404
  - body: string
    - `image_id` does not exist
- Response: 500
  - body: string
    - Error message returned by the server from the operation

```bash
$ curl --request GET \
  --url http://localhost:3000/api/images/tIdLeOaSLieftvdu
```

- Description: retrieve the raw image data
- Request: `GET /api/images/:image_id/image/`
- Response: 200
  - content-type: `image/*`
  - body: string
    - raw image content
- Response: 401
  - body: string
    - Access denied
- Response: 404
  - body: string
    - `image_id` does not exist
- Response: 500
  - body: string
    - Error message returned by the server from the operation

```bash
$ curl --request GET \
  --url http://localhost:3000/api/images/tIdLeOaSLieftvdu/image/
```

### Comments

- Description: retrieve the 10 latest comments for an image at page X. If page not given, defaults to `0`
- Request: `GET /api/images/:image_id/comments/[?page=X]`
- Response: 200
  - content-type: `application/json`
  - body: [object] (list of objects)
    - _id: (string) unique id of the comment
    - image_id: (string) id of the image this comment is attached to
    - author: (string) author's username
    - content: (string) comment body
    - createdAt: (Date) date this object was created at
    - updatedAt: (Date) date this object was last updated
- Response: 401
  - body: string
    - Access denied
- Response: 500
  - body: string
    - Error message returned by the server from the operation

```bash
$ curl --request GET \
  --url http://localhost:3000/api/images/tIdLeOaSLieftvdu/comments
```

## Delete

### Images

- Description: deletes a specific image having id `image_id` and its related comments
- Request: `DELETE /api/images/:image_id/`
- Response: 200
  - content-type: `application/json`
  - body: object
    - _id: (string) the image id
    - title: (string) the title of the image
    - author: (string) the author's username
    - imageData: (object) metadata of the uploaded image
      - fieldname: (string) image field name
      - originalname: (string) name of the file (image)
      - encoding: (string) file encoding
      - mimetype: (string) mimetype of the file
      - destination: (string) relative path of the image's upload destination
      - filename: (string) hashed version of the originalname
      - path: (string) relative path of the file in destination
      - size: (int) size of the file
    - createdAt: (Date) the upload date of the image
    - updatedAt: (Date) the date this image was last updated
- Response: 401
  - body: string
    - Access denied
- Response: 404
  - body: string
    - `image_id` does not exist
- Response: 500
  - body: string
    - Error message returned by the server from the operation

```bash
$ curl --request DELETE \
  --url http://localhost:3000/api/images/tIdLeOaSLieftvdu/
```

### Comments

- Description: deletes a specific comment having id `comment_id`
- Request: `DELETE /api/comments/:comment_id/`
- Response: 200
  - body: object
    - _id: (string) unique id of the comment
    - image_id: (string) id of the image this comment is attached to
    - author: (string) author's username
    - content: (string) comment body
    - createdAt: (Date) date this object was created at
    - updatedAt: (Date) date this object was last updated
- Response: 401
  - body: string
    - Access denied
- Response: 404
  - body: string
    - `comment_id` does not exist
- Response: 500
  - body: string
    - Error message returned by the server from the operation

```bash
$ curl --request DELETE \
  --url http://localhost:3000/api/comments/L3n4AMuy1eo9qCEy/
```

## Other Routes
- Description: requesting any other route
- Response: 404
  - body: string
    - Requested URL cannot be found

```bash
$ curl --request GET \
  --url http://localhost:3000/api/weqoejwi/
```

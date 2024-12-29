<div align="center">
   <img src="logo.png"/>
</div>

# Smiler

### [Demo](https://smiler.darkzarich.com/posts/all) | [Swagger documentation](https://smiler-api.darkzarich.com/api-docs/)

Welcome! :smile:

This is my pet project build on the MEVN stack (MongoDB, Express, Vue.js, Node.js). It’s a Single Page Application (SPA) inspired by platforms like Reddit and 9gag, packed with exciting features and innovative technical solutions listed below. Most components are covered with end-to-end (e2e) tests to ensure reliability.

The primary motivation behind this project is to have fun while learning new technologies and implementing creative solutions.

I hope you find it as enjoyable as I do!

Feel free to explore the code, report issues, or contribute!

### Requirements:

- Node.js (>=20.16.0)
- [pnpm](https://pnpm.io/) (>=8.6.0)
- Docker and Docker Compose (optionally)

### How to run it:

1. Get your remote MongoDB ready. Do one of the options:

   - Get a remote mongo db instance, for example [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). Take connection link and put it into `.env` file
   - Run a local MongoDB instance with Docker
     ```bash
     docker run -d -v /usr/src/smiler/db:/data/db -p 27017:27017 mongo:5.0.10
     ```

2. `pnpm install`
3. Inside the root folder rename `.env.example` to `.env`
4. Fill in your `.env` file following the comments inside the file
5. Run `pnpm dev`

Alternatively, you can run everything with Docker Compose using just a single command:

```bash
# optionally add --build to build images instead of getting it from docker hub
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
```

### Building images

This is not necessary if you use docker-compose, but if you want to build images manually you can do it with these commands run from the root folder:

```bash
docker build --target frontend -t darkzarich/smiler-frontend:latest .
docker build --target backend -t darkzarich/smiler-backend:latest .
```

### Common Features

- It's containerized and docker-compose setup is very flexible! And it also can work without Docker

### Backend Key Features:

- General:
  - **Clustering**. If something goes wrong on the server side and something throws an exception the app won't stop working, instead another instance will be run.
  - **CORS Protection**. The API has set allowed domains through env variables.
  - **Logging**. Every single request is logged with [Winston](https://github.com/winstonjs/winston) and [morgan](https://github.com/expressjs/morgan). Also logs are saved to the file as well.
- Posts:
  - **Creating posts**. Users can create posts and it will get a slug based on its title. The content of the post is formed with `sections`. Sections can be one of following types: text , picture, picture from link or link to video. Sent sections will save their order in the Database. Users are able to add up to 8 sections
  - **Uploading pictures**. Through post sections. Images are getting resized and optimized. There are two
    general ways of uploading a picture: direct link to some other site with this picture or uploading from user's computer.
  - Being able to **update posts within certain time**. Users can update their posts but it's only available within _10_ min.
  - Being able to **delete posts within certain time**. Users can delete their posts but it's only available within _10_ min.
  - **Feed**. The latest posts of users or\and tags which user has followed.
  - **Tags**. A post can have up to 8 tags and all posts can be filtered by a tag. Also a user is able to **follow\unfollow tags**.
  - **Getting all posts**, pagination included, filter by _author_, _date_, _rating_, _regexp title_. Shows if user already rated a post
  - **Getting a post by its slug**. Instead of `id` I use `slug` for GETting a single post.
  - **Post rating**. Posts have their rating which forms user rating along with Comments rating
- Users:
  - **Profile pic**. It's possible for a user to set profile pic with link to the picture
  - **Following users**. User are able to follow\unfollow authors they are interested in.
  - **Bio**. Users are able to add small description about themselves
  - **Registration**. Does what it says
  - **Sessions**. Instead of JWT, I decided to stick with my nice old friend - sessions, also they are more safe than JWT
  - **Auth**. Does what it says
  - **Saving draft**. Users are able to save sections, title and body of the post without posting it, also it was a necessary step to solve file upload dilemma
  - **Individual rating**. Users have their individual rating which is sum of ratings for each post and
    each comment they have ever posted
- Comments:
  - **Hierarchical comment tree to each post**. Nowadays almost any site does this. Also shows if user rated a
    comment already, **checks recursively**.
  - **Creating comments**
  - **Updating comments**. Users are able to **update comments** within certain time after posting it but only if no one answered on it yet
  - **Deleting comments**. Users are able to **delete comments** within certain time after posting it but only if no one answered on it yet
  - **Comment rating**. Comments have their rating which forms user rating along with Posts rating
- Full Swagger documentation to existing end-points (available with path `/api-docs/`)

### Frontend Key Features

(might be missing out a lot, it's hard to describe all those...)

- General:
  - **Auth guards**. For routes when this is necessary they won't be available if the user is not logged in.
  - **Allowed routes guard**. If this route does not exist router will move the user to 404 page.
  - **Expired actions guard**. For example, when a user wants to edit a post the user can't edit anymore
    the user won't be able to access edit page.
  - **Global request error notifications**. If any request results in a error there is a nice animated red
    notification telling what is wrong and it disappears after few sec (notifications stacks if there is more than one)
  - **Adaptive design**
  - **Dynamic document title**
- Posts:
  - **Few pages for post containers**. There are generally **6 pages** for this: _Today_ page will show posts posted today sorted by rating (server time), _All_ shows all posts posted ever, _Blowing_ shows posts with
    50+ rating posted recently (so to say, hot posts), _Top this week_ page speaks for itself, _New_ shows posts posted up to 2 hours ago sorted by date
  - **Post editor**. Serves for creating and editing posts. Main its features: Creating and deleting post sections, **rich text editor** (I made this one entirely myself so it probably is pretty buggy but it's working in general) for text section, adding tags, dynamic check if the picture by link is available.
    Also sections are totally supporting Drag and Drop.
  - **Preloader**.
  - **Loading more posts on scroll**. When the bottom is reached
  - **Search post with filters**
  - **Following tags**. When a tag is clicked the context menu appears and user can either search by tag or follow\unfollow a tag.
- Users:
  - **Auth state**. Hiding what is not available due to not being logged in, taking session data, handling auth state checks when it's needed. Any error with status 401 will destroy auth state.
  - **User page**. User's posts, user's rating, amount of followers, bio, avatar, etc..
  - **Follow\unfollow users**
  - **Settings**. Lets unfollow users and tags seeing the whole image, change bio, change avatar
  - **Registration**
  - **Login form**
- Comments:
  - **Tree comments**.
  - **Creating comments**. With rich text editor
  - **Deleting comments**
  - **Updating comments**

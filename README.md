<div align="center">
   <img src="https://i.imgur.com/D3AjmGt.png"/>
</div>

# Smiler

### [Demo](https://dz-express-blog.herokuapp.com) | [Swagger documentation](https://dz-express-blog-api.herokuapp.com/api-docs/)

Hello! :smile: 

This is my own pet MEVN (MongoDB, Express, Vue.js, Node.js) site-project similar to reddit.com, 9gag, etc with many different and awesome features, open Swagger API documentation (as the result of using Design First approach). Main reason of making this site is fun and learning new things while making it.

Here is [my public Trello board](https://trello.com/b/a9VbK9M3/smiler) so you will know anything about what I'm working on right now related to this repository
and also any my future ideas and fixes I'm plannig to release one day :sunglasses:

### Requirements:
- Node.js
- Docker and Docker Compose (optionally)

### How to run it:

0. Get your remote MongoDB ready. Do one of the options:
	- Get a remote mongo db instance, for example [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). Take connection link and put it into `.env` file
	- Run a local MongoDB instance with Docker
		```bash
		docker run -d -v /usr/src/smiler/db:/data/db -p 27017:27017 mongo:5.0.10
		```

1. `npm install`
2. Inside root folder rename `.env.example` to `.env`
3. Fill in your `.env` file following the comments inside the file
4. `npm run run:dev` or `npm run run:production`

Alternatively you can run it with Docker Compose:
```bash
docker compose up -d # optionally add --build to build images instead of getting it from docker hub
```

### Backend Features:
- General:
	- **Clustering**. If something goes wrong on the server side and something throws an exception the app won't
	die
	- **CORS Protection**. The API has set allowed domains through env variables.
	- **Logging**. Every single request is logged with [Winston](https://github.com/winstonjs/winston) and [morgan](https://github.com/expressjs/morgan). Also logs are saved to the file as well.
- Posts:
	- **Creating posts**. Users can create posts and it will get a slug based on its title. The content of the post is formed with `sections`. Sections can be one of following types: text , picture, picture from link or link to video. Sent sections will save their order in the Database. Users are able to add up to 8 sections
	- **Uploading pictures**. Through post sections. Images are getting resized and optimized. There are two
	general ways of uploading a picture: direct link to some other site with this picture or uploading from user's computer.
	- Being able to **update posts within certain time**. Users can update their posts but it's only available within *10* min.
	- Being able to **delete posts within certain time**. Users can delete their posts but it's only available within *10* min.
	- **Feed**. The latest posts of users or\and tags which user has followed.
	- **Tags**. A post can have up to 8 tags and all posts can be filtered by a tag. Also a user is able to **follow\unfollow tags**.
	- **Getting all posts**, pagination included, filter by *author*, *date*, *rating*, *regexp title*. Shows if user already rated a post
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

### Frontend Features
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
	- **Few pages for post containers**. There are generally **6 pages** for this: *Today* page will show posts posted today sorted by rating (server time), *All* shows all posts posted ever, *Blowing* shows posts with 
	50+ rating posted recently (so to say, hot posts), *Top this week* page speaks for itself, *New* shows posts posted up to 2 hours ago sorted by date
	- **Post editor**. Serves for creating and editing posts. Main its features: Creating and deleting post sections, **rich text editor** (I made this one entirely myself so it probably is pretty buggy but it's working in general) for text section, adding tags, dynamic check if the picture by link is available.
	Also sections are totally supporting Drag and Drop.
	- **Preloader**.
	- **Loading more posts on scroll**. When the bottom is reached
	- **Search post with filters**
	- **Following tags**. When a tag is clicked the context menu appears and user can either search by tag or follow\unfollow a tag.
- Users:
	- **Auth state**. Hiding what is not availabe due to not being logged in, taking session data, handling auth state checks when it's needed. Any error with status 401 will destroy auth state.
	- **User page**. User's posts, user's rating, amount of followers, bio, avatar, etc..
	- **Follow\unfollow users**
	- **Settings**. Lets unfollow users and tags seeing the whole image, change bio, change avatar
	- **Registration**
	- **Login form**
- Comments:
	- **Tree comments**.
	- **Creating comments**. With rich editor
	- **Deleting comments**
	- **Updating comments**
	- **Loading new comments**. Small flying button which allows to request comments again but all new comments
	will be highlighted, also there is a counter which says how many comments were added.

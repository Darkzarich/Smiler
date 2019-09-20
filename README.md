## Express-blog

Hello! :smile: 

This is my own MEVN (MongoDB, Express, Vue.js, Node.js) site similar to reddit.com or pikabu.ru (mostly copies many pikabu features) with many different and awesome features, open Swagger API documentation (as the result of using Design First approach). Main reason of making this site is fun and learning new things while making it.

### How to run it:

0. Get your MongoDB ready. Create user with admin rights
1. `npm install`
2. Take `.env.example` file and rename it to `.env`
3. Fill your `.env` file following the comments
4. `npm start`

**tip**: For MongoDB you could use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

### Backend Features:
- General:
	- **Clustering**. If something goes wrong on the server side and something throws an exception the app won't
	die
- Posts:
	- **Creating posts**. Users can create posts and it will get a slug based on its title
	- **Uploading pictures**. All posts can have attachments, isn't that nice!
	- Being able to **update posts within certain time**. Users can update their posts but it's only available within *10* min.
	- Being able to **delete posts within certain time**. Users can delete their posts but it's only available within *10* min.
	- **Getting all posts**, pagination included, filter by **author**, shows if user already rated a post
	- **Getting a post by its slug**. Instead of `id` I use `slug` for getting a single post.
	- **Post rating**. Posts have their rating which forms user rating along with Comments rating
- Users: 
	- **Registration**. Does what it says
	- **Sessions**. As I didn't work with JWT much yet I decided to stick with my nice old friend - sessions, also they are kinda more safe than JWT
	- **Auth**. Does what it says
	- **Saving draft**. Users are able to save attachments, title and body of the post without posting it, also it was a necessary step to solve file upload dilemma
	- **Individual rating**. Users have their individual rating which is sum of ratings for each post and 
	each comment they have ever posted
- Comments:
	- **Hierarchical comment tree to each post**. Nowadays almost any site does this. Also shows if user rated a
	comment already, **checks recursively**
	- **Creating comments**
	- **Updating comments**. Users are able to **update comments** within certain time after posting it but only if no one answered on it yet
	- **Deleting comments**. Users are able to **delete comments** within certain time after posting it but only if no one answered on it yet
	- **Comment rating**. Comments have their rating which forms user rating along with Posts rating
- Full Swagger documentation to existing end-points (available with path `/api-docs/`)

### Backend Plans:

- Posts:
	- **Tags**
	- **Sockets**
- Users:
	- **Profile pic**
	- **Adding posts to the list favorite**
	- **Settings (?)**
	- **Bio**. Users should be able to add small description about themselves 
	- **Changing password**
	- **Password recovery**
	- **Mail (?)**. Mail box, working with emails
	- **Mentions**. Usual @ mentions
	- **Roles**(regular, moderator, admin)
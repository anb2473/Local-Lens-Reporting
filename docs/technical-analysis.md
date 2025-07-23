# Technical Analysis

## Global Router Service (GRS)

The GRS was built on the Node.JS environment, using express to host the service, and Docker to ensure portability on all devices and data integrity.

### Node.JS / Express Architecture

Node.JS and Express were chosen to handle running the server. The alternative to Express would have been FastAPI (which was used for the AI service), however Express was chosen due to the maturity of the JS fullstack ecosystem, and reliability. The servers architecture itself is divided into three main components. The auth routes, user routes, static routes, and public routes. All routes sanitize string content for security.

#### Auth Routes

The auth routes are API only routes. These routes handle signing up new users and logging in returning users:

* The login route checks if a user with the provided credentials exists, the password hash's are equivilent, and then returns a JWT token in the cookies.
* The sign up route checks if the region the user entered already exists, creates a new one if it does not, and then creates a new user, and returns a JWT token in the cookies.

#### User Routes

The user routes are all the frontend and API only routes for the user view. These are all protected via the auth middleware:

* All requests to the user endpoints are routed through the auth middleware, which ensures the request contains a valid JWT cookie. (provided in auth routes)
* The user frontend routes are all rendered via EJS using data provided from the SQL database.
* Backend routes handle altering data from the SQL database.

#### Static Routes

The static routes are served by the main server, and are frontend only:

* The main server directly handles static routes. This allowes the user to enter the URL `http://domain/`, and automatically get routed to the static frontend.
* The static routes include the auth frontend.

#### Public Routes

All files in the `public` directory are accessible directly to the client. This allows the HTML frontend to load static resources such as the CSS properties and images, and the favicon.

### SQL Database

The SQL database uses the Prisma ORM alongside PostgreSQL:

* The Prisma ORM allows for rapid prototyping of the database structure. Prisma also includes many builtin features such as SQL injection prevention. Prisma also allows for increased readability and easier integration with Node.JS.
* PostgreSQL was the clear choice for the relational database. PostgreSQL has advanced security, such as authentication systems and data encryption. Also, PostgreSQL supports advanced opperations and JSON out of the box.

### Containerization

Containerization was a clear choice for the system. Containerizing the system limits the extent of a potential attack to the container, and acts as a barrier for each component preventing the service from being compromized. The containerization strategy for the service was:

* The PostgreSQL database was dockerized in a seperate container on the Postgres image.
* The main server was dockerized on the Node.JS image using the `package.json` to load dependencies. The `.dockerignore` was set up to ignore the `node_modules` to prevent conflicts.
* Docker compose was used to easily handle setting up the PostgreSQL database and server. This prevents the server from running before the database has been fully loaded. It also allows for easily linking all the proper environment variables without exposing them in the build process. Compose also allows for easy configuration of the watch mechanism, allowing for rapid developement.

## AI Service (AS)

The AS was built on the FastAPI environment, and was designed to transport the data from the PyTorch models to the Node.JS server.

### PyTorch

PyTorch was chosen to handle the AI integrations as it has a wider ecosystem, and would allow for faster developement. PyTorch and Python have widespread community support. This means that instead of being forced to prototype a full AI model, there are already existing models for each task which can easily be plugged in to the system. The choice of PyTorch did come with two notable downsides:

* PyTorch, built on python, increased latency. In production a requets can take up to a full second, which compounds with hundreds of requests. This increase suceptibility to a DDOS attack.
* PyTorch also did not integrate well with the existing GRS infrastructure. As PyTorch is built on python, a full new server service needed to be created in order to host it. This further increases latency.

### FastAPI

FastAPI was chosen to handle linking the GRS with the AS. FastAPI specifically was chosen as it provided the least latency, and would be the fastest to integrate. FastAPI was also written consistently with Express, increasing readability.

### Auth Routes

To prevent an attacker from making false requests to the AI service from within the private network, the AS includes authentication protection. The AS only has a login mechanism, which checks the password hashes and returns a JWT cookie. The hash itself is predefined in the environment variables. For any changes to the password, use the `pass_gen.py` file to quickly generate a new hash.

### TEA and TA

The AS has two api routes. Both of these routes are guarded via JWT cookie checks handled by the middleware.

* The `/ta` route, or text analyzer route, analyzes text for reliability.
* The `/tea` route, or text equivilence analyzer route, analyzes two seperate claims to determine whether they have the same meaning. This route is not used in production, however can be used in the future to make the AS more accurate.

### Containerization

The AS is containerized via Docker to ensure an attack on the service is isolated. Containerizing the AS also has masks the environment variables, adding further protection from an attacker. The containerization stratagy for the AS was relatively simple:

* The AS has no corresponding database, so there is only one container.
* The AS is built on the Python image, and loads all dependencies directly from the `requirements.txt` file. All `__pycache__` directories are ignore in the `.dockerignore` to prevent conflicts. 
* Docker compose is used to automate masking the environment variables and allow for easier integration with the GRS.
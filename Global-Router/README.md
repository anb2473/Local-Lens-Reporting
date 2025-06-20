# Global Router

**NOTE:** Before executing the system, first execute the command `cd path/to/Global-Router/local`, and then run the command `npm install` to update all packages

## Docker Compose (Recommended)

In order to setup and execute the server via Docker with Docker compose:

1. **Open the Server Directory:** execute the command `cd path/to/server`
2. **Build the Docker Images:** execute the command `docker compose build`
3. **Run the Dockerized System via Compose:** execute the command `docker compose up`

## Docker Manual

### Setup and Run via Docker

To set up and run the Global Router using Docker:

1. **Open the Router Directory:**  
   Execute the command `cd path/to/Global-Router/local`
2. **Build the Docker Image:**  
   Execute the command `docker build -t global-router .`  
   (**NOTE:** You can change the name of the Docker image, but you must use the same name in the run command.)
3. **Run the Docker Image:**  
   Execute the command `docker run -p 3000:3000 global-router`  
   (**NOTE:** Adjust the port if your app uses a different one.)

The `-p` flag enables port forwarding (in this case, port 3000 on your machine is mapped to port 3000 in the Docker container).

## Manual

**NOTE:** To run the router manually, ensure you have Node.js installed on your system.

### Dependencies

The Global Router requires the following dependencies:

* node
* express
* dotenv (if using environment variables)
* (any other dependencies your project uses)

You can install all dependencies with:

1. **Open the Router Directory:**  
   `cd path/to/Global-Router`
2. **Install Required Libraries:**  
   `npm install`

### Execution Instructions

To run the router manually:

1. **Open the Router Directory:**  
   `cd path/to/Global-Router`
2. **Run the Router:**  
   `node index.js`  
   (or `npm start` if you have a start script defined)

## Testing

To test the router:

* Use tools like [Postman](https://www.postman.com/) or the VS Code REST Client to send requests to your endpoints.
* Ensure your regional AI servers are running and accessible for full integration testing.

---

For more details on configuration or contributing, see the project documentation or contact the maintainer.

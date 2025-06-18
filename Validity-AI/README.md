# AI Server

## Docker (Recommended)

### Setup and Run via Docker

In order to setup and execute the server via Docker:

1. **Open the Server Directory:** execute the command `cd path/to/server`
2. **Build the Docker Image:** execute the command `docker build -t validity-ai-server .` (**NOTE:** You can change the name of the Docker image, however that will also require you to change the name in the run command)
3. **Run the Docker Image:** execute the command `docker run --env-file .env -p 8000:8000 validity-ai-server` (**NOTE:** If you changed the name, make sure to write the correct docker image name)

You need the -p flag to enable port forwarding (In this case 8000 on the machine is mapped to 8000 on the docker image)

## Manual

**NOTE:** In order to manually run the server, you will first need to add `PORT=8000` to the `.env` file, and you will also need to open the `server.py` file, and change the IP address from `0.0.0.0` to `127.0.0.1`.

### Dependencies

The server requires the pre isntallation of:

* python
* fastapi
* pyjwt
* uvicorn
* torch
* transformers
* pillow
* dotenv

These prerequisits can be installed as follows:

1. **Install Python:** execute the command `python` in your terminal, which should take you directly to a python installation page if python is not found on the system. You can also go directly to the installation page at <https://www.python.org/downloads/>
2. **Open the Server Directory:** execute the command `cd path/to/server`
2. **Install Required Libraries:** execute the command `pip install -r requirements.txt`. If any installations fail ensure you are connected to the internet before retrying

### Execution Instructions

In order to execute the server:

1. **Open the Server Directory:** execute the command `cd path/to/server`
2. **Run the Server:** in your terminal execute the command `python server.py` (with the previous path)

### Testing

In order to test the server:

* in the `testing` directory open the `test.rest` file
* the `test.rest` file has been pre configured with all necessary testing endpoints (**NOTE:** You will first need to send a request to the login endpoint, and replace the auth cookies in all the other requests with the cookie from the login request)

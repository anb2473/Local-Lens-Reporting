# Running the System

## Docker Compose (Recommended)

In order to run the system via Docker compose:

1. **Open the Directory:**
    Execute the command `cd path/to/Local-Lens-Reporting`
2. **Build Docker Images:**
    Execute the command `docker compose build`
3. **Build the Prisma Database:**
    Execute the command `docker compose run global-router-server-service npx prisma migrate dev --name init`
4. **Run the Dockerized System:**
    Execute the command `docker compose up`

**NOTE:** It will take a couple minutes for docker to build the system, and after running you may need to wait a couple minutes for the AI service to load. (These delays will only happen the first time you run the service)

**ALSO:** You may encounter an error message saying that an error has occurec on the log in or sign up pages. This is normal, and is just the IP limiting to protect against a DOS or DDOS attack.

**LASTLY:** When you post it may take a couple seconds before redirecting back to the search page. (Same for when editing a post) Unfortunately, due to the computational intensity of the AI models we are using to calculate the plausibility of the post, unless you have an incredibly powerful PC there will be a delay.

If you encounter any errors, please refer to the possible errors section.

## Possible Errors

1. Port is already allocated. If you encounter this error, you have serveral possible solutions:
    a. If you are running a seperate app which runs on that specific port, close the other app and retry.
    b. You can manually close the specific port, this is different for seperate opperating systems:
        windows. (powershell) ```powershell
            $pid = Get-NetTCPConnection -LocalPort <port_number> | Select-Object -ExpandProperty OwningProcess
            Stop-Process -Id $pid -Force
            ```
        linux. (bash) ```bash
            sudo kill $(sudo lsof -t -i:<port_number>)
            ```
        mac. (zsh) ```zsh
            sudo kill $(sudo lsof -t -i:<port_number>)
            ```
    c. You can also simply go into the `docker-compose.yaml` file, and edit the ports used for each service.
2. Container name is already in use. You can simply run the command `docker rm -f <container_name>` (`container_name` will be written in the error)
3. Failed to fetch content from AI service. The AI service will take a minute or two to load the AI models, especially if you are in an area with slow internet. Simply wait until a large block of text appears in the console from the `validity-ai-server` service, which indicates the loading process has completed.

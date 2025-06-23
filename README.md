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

## Possible Errors

1. Port is already allocated
2. Container name is already in use
3. AI takes a long time to boot

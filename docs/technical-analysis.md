# Technical Analysis of the Local Lens Reporting (LLR) Project

## Global Router Service (GRS)

### Major Choices

#### Regionalized GRS

The original plan for the GRS was a containerized, regionalized server system. This would mean a main dockerized server, which acts as a reverse proxy routing requests to the users region, and would handle the /auth routes, the static presentation tier, and the auth middleware protecting the user protected endpoints. These regions would individually act as seperate servers, each handling the user protected endpoints for the specific region. All of these dockerized servers would be simultaneously handled via Kubernetes, allowing for easy scalability, and clean structuring.

##### Benifits

A regionalized GRS system would introduce serveral key benifits. Kubernets can handle auto healing, allowing for the service to continue running under an attack without harming users. Furthermore, all data is decentralized. This would make it far harder for an attacker to access data for all the users. And a single central router system would allow for easy integration with IP blocking systems and auto sanitization protocols, reducing risk of mismanaged endpoint security.

##### Issues

There were serveral major issues with the regionalized GRS. Kubernetes would add unecessary complexity to the project, introducing yaml files that would require manual maintanance and countless developer hours. The complexity Kubernetes introduces would decrease productivity, removing any potential benifits. Furthermore, such a system would dramatically increase latency. In a traditional server structure the client is directly communicating with the server, however, in this proposed structure the request has to pass through the router to the regional server, and vice versa. Furthermore, with a single reverse proxy, that proxy acts as a single point of failure. This means that regardless of any auto healing provided by Kubernetes, or any masking protecting the regional servers, if the main server fails the entire structure collapses. As such, the idea was scrapped as it would leave the project in too much technical debt.

#### Custom IP Middleware

The system originally had a custom `ipMiddleware.js` file, which was designed to handle blocking frequent IP's. There was also a corresponding data collumn in the `schema.prisma` file, which would be used to track visits from different IP's. This idea was scrapped in favor of more reliable external API's.

#### EJS Rendering

All user routes required customizing the user experience based on data from the SQL database. Server side rendering was the most logical choice as it allowed for increased security, shielding data from the client. However, this still left a broad range of notable approaches:

* PhP could be a viable solution. However, PhP has become outdated for modern security applications, and would require a full migration from Node.JS to fully realize the potential gains.
* EJS provided the most optimal solution. EJS allowed for rendering without migrating from Node.JS, and beyond that EJS would easily integrate with the surrounding static page infrastructure.

As such, an EJS rendering system was implemented. This did not come without several issues post integration. EJS increased load on the server, decreasing resistance to a DDOS attack, and increasing energy costs. However, on a enterprise server this extra load would be negligible.

# Developement Standards

## Principles of Orginization

1. Avoid comments. If your code is too complex to be easily readable, change it. For example, `const passwCorrect = await checkPassw(passw, user.passw);` reads close enough to an english sentance that comments are redundant. However, `const correct = await bcrypt.compare(passw, user.passw)` is far less readable.
    * Assume the next person to read the code knows how to program. Dont write comments to explain the syntax of the code, or redundant comments.
    * Use function alias's to reduce clutter. `checkPassw` directly conveys the intent of the function. `bcrypt.compare` is less readable.
    * Use meaningful names. for example, `valid` does not convey any information. `passwCorrect` is more concise.
2. Maximize simplicity. Ten lines is better than a hundred.
    * Break down long functions into reusable parts, which will increase readability and reduce complexity.
    * Store as few attributes as possible in a prisma model.
3. Avoid seperating functions for endpoints. Seperating endpoints removes the structure of the file and makes efficient refractoring more difficult.
4. Maximize security to a reasonable degree.
    * Use secure practices whenever possible such as sanitizing potentially dangerous content.
    * Avoid storing high risk data directly in the database.
    * Add guard clauses whenever possible to protect agains missuse.
    * Use secure images in all Docker containers.
    * Do not report internal errors to the client, or any information beyond the strict minimum.
    * Do not send high risk data in unsafe locations such as the request query.
    * Do not directly store any `.env` variables in the Docker container at build, pass them in at runtime.
    * Do not use EJS outside the user routes. EJS increases load on the server allowing for a potential DDOS attack, which is far harder if the rendering is protected in the user routes.
    * Do not focus on security outside the scope of the project. Unnecisary security measures distracts from the content of the project.
5. Don't follow 'clean code' principles. The only principles that matter are security, clarity, simplicity, and whether it works.

## Testing

1. Test via REST.  Account for invalid JWT tokens, no cookies, incomplete inputs, incorrectly formatted inputs, and different datatypes.
2. Test via Locust. Target high latency endpoints for DDOS protection.
3. Log all errors and info with a full JSON logger. For the AI service this is less mandatory as that would simply overengineer the problem. However, the main service should use a custom logger and record all logs. In production all actions should also be logged, not simply errors.

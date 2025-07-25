# Developement Standards

## Principles of Orginization

1. Avoid comments. If your code is too complex to be easily readable, change it. For example, `const passwCorrect = await checkPassw(passw, user.passw);` reads close enough to an english sentance that comments are redundant. However, `const correct = await bcrypt.compare(passw, user.passw)` is far less readable.
    * Assume the next person to read the code knows how to program. Dont write comments to explain the syntax of the code, or redundant comments.
    * Use function alias's to reduce clutter. `checkPassw` directly conveys the intent of the function. `bcrypt.compare` is less readable.
    * Use meaningful names. for example, `valid` does not convey any information. `passwCorrect` is more concise.
2. Maximize simplicity. Ten lines is better than a hundred.
    * Break down long functions into reusable parts, which will increase readability and reduce complexity.
    * Store as few attributes as possible in a prisma model.
3. Maximize security to a reasonable degree.
    * Use secure practices whenever possible such as sanitizing potentially dangerous content.
    * Avoid storing high risk data directly in the database.
    * Add guard clauses whenever possible to protect agains missuse.
    * Do not focus on security outside the scope of the project. Unnecisary security measures distracts from the content of the project.
4. Don't follow 'clean code' principles. The only principles that matter are security, clarity, simplicity, and whether it works.

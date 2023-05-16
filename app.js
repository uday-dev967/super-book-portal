const express = require("express")
const path = require("path")
const {open} = require("sqlite")
const sqlite3 = require("sqlite3")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const cors = require("cors")
const app = express();
app.use(express.json())
app.use(cors())
let db = null





const dbpath = path.join(__dirname,"bookPortal.db")

const intializeDbAndServer = async() => {
    try {
        db = await open({
            filename : dbpath,
            driver : sqlite3.Database
        });
        app.listen(3001, () => {
            console.log("The sever is running at http://localhost:3001/")
        });
    }catch (e) {    
        console.log(e.message)
        process.exit(1);
    }
}

intializeDbAndServer()



// POST ### API FOR NEW USER REGISTRATION
app.post("/users", async(request,response) => {
    const {email, name, password} = request.body
    console.log(request.body)
    const hashedPassword = await bcrypt.hash(password,10);
    console.log("hai")
    const selectQuery = `SELECT * FROM users WHERE email = "${email}";`;
    const dbUser = await db.get(selectQuery);
    if (dbUser === undefined) {
        const createNewUserQuery = `INSERT INTO users(email,name,password)
                                    VALUES
                                    (
                                        '${email}',
                                        '${name}',
                                        '${hashedPassword}'
                                    );`;
        const dbResponse = await db.run(createNewUserQuery);
        const id = dbResponse.lastID;
        response.status(200)
        response.send({ Id: id, result:"user Registeration successfull" });
    }
    else {
        response.status(400);
        response.send({result :"User already exists"});
      }
});

// ### MIDDLEWEAR FOR AUTHENTICATION
const authenticateToken = async (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if (authHeader !== undefined) {
      jwtToken = authHeader.split(" ")[1];
    } else {
      response.status(401);
      response.send({result : "Invalid JWT Token"});
    }
    if (jwtToken !== undefined) {
      jwt.verify(jwtToken, "udaynikhwify", async (error, payload) => {
        if (error) {
          response.status(401);
          response.send({resutl: "Invalid JWT Token"});
        } else {
          request.email = payload.email;
          next();
        }
      });
    }
  };

// POST ### API FOR LOGIN
app.post("/login", async(request, response) => {
    const {email, password} = request.body
    const findUserQuery = `SELECT * FROM users WHERE email='${email}';`;
    const dbUser = await db.get(findUserQuery);
    console.log(email)
    if (dbUser === undefined) {
        response.status(400)
        response.send({error_msg : "Invalid User"})
    }else {
        const isCorrectPassword = await bcrypt.compare(password, dbUser.password)
        if (isCorrectPassword) {
            const payload = {email : email};
            const jwtToken = jwt.sign(payload, "udaynikhwify")
            response.send({jwtToken})
        }else {
            response.status(400)
            response.send({error_msg : "User & password didn't match"})
        }
    }
})

// POST ### API FOR ADDING NEW BOOK
app.post("/add-book", async(request, response) => {
    console.log(request.body)
    const {author,imageLink="https://pngimg.com/d/book_PNG2111.png",year=0,bookTitle,pages,country,language} = request.body;
    const postRequestQuery = `insert into book(author,imageLink,year,title,pages,country,language) values ("${author}","${imageLink}", ${year}, "${bookTitle}", ${pages},"${country}","${language}");`;
    const responseResult = await db.run(postRequestQuery);
    const id = responseResult.lastID;
    response.send({result: "New Book added"}); 
})

// GET ### API FOR GETTING ALL BOOKS
app.get("/books", async(request, response) => {
  console.log("/books called")
  try {
  const getRequestQuery = `SELECT * FROM book;`;
  const responseResult = await db.all(getRequestQuery);
  response.status(200)
  response.send(responseResult);
  }
  catch {
    response.status(400)
    const responseResult = "Internal server error Failed to add book"
    response.send({responseResult})
  }
})


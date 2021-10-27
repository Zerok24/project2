const express = require('express');
var mysql = require('mysql');

const app = express();


app.use(express.json());
app.use(express.urlencoded({extended:false}));

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Eltunas123!",
    database: "blog"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});


const getID = function(table,column){
    return new Promise((res,rej) => {

        const query = `SELECT MAX(${column}) AS COUNT FROM ${table}`;

        con.query(query, (err,result) =>{
            res(result);
        });

    });
}

const getPost = function(id){
    return new Promise(function(resolve,reject){
        con.query(`SELECT * FROM post WHERE POST_ID = ${id}`, (err,results,fields)=>{

            resolve(results);
        });
    })
};

const getAll = function(){
    return new Promise((resolve,reject) => {
        const que = `SELECT blog.author.AU_FNAME, blog.author.AU_LNAME, blog.post.CONTENT, blog.post.LIKES
                     FROM blog.post
                     INNER JOIN blog.author ON blog.post.AU_ID = blog.author.AU_ID;`;
        con.query(que, (error,respon,fiel) =>{
            
            const finalResult = [];
            for(let i = 0; i < respon.length; i++){
                finalResult.push(
                {
                    author: respon[i].AU_FNAME + " " + respon[i].AU_LNAME,
                    content: respon[i].CONTENT,
                    likes: respon[i].LIKES
                });

            }

            resolve(finalResult);
        });

    });
}

const getAuthor = function(id){
    return new Promise((resolve,reject) => {
        const que = `SELECT AU_FNAME, AU_LNAME 
                     FROM blog.author 
                     WHERE AU_ID = ${id}`;
                     
        con.query(que, (error,respon,fiel) =>{

            if(error){
                console.log("here");
            }
            
            resolve(respon);
                    
        });
    });
}

app.get("/posts", async (req,res)=>{

    const posts = await(getAll());
    res.send(posts);
    
});

app.get("/:post_id", async (req,res)=>{

    const id = req.params.post_id;
    const post = await getPost(id);
    const author = await getAuthor(post[0].AU_ID);
    const result = [];

    result.push({
        author:  author[0].AU_FNAME + " " +author[0].AU_LNAME,
        content: post[0].CONTENT,
        like: post[0].LIKES
    });
    res.send(result);

});

app.patch("/:post_id/like", async (req,res)=>{
    const id = Number(req.params.post_id);

    con.query(`UPDATE post SET LIKES = LIKES + 1 WHERE POST_ID = ${id}`);

    const post = await getPost(id);
    const author = await getAuthor(post[0].AU_ID);
    const result = [];

    result.push({
        author:  author[0].AU_FNAME + " " +author[0].AU_LNAME,
        content: post[0].CONTENT,
        like: post[0].LIKES
    });
    res.send(result);

});

app.post("/post", async (req,res)=>{

    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const content = req.body.content;
    
    const newPostId = await getID("post","POST_ID");
    const newAuthorId = await getID("author","AU_ID");

    const authorQuery = `INSERT INTO author(AU_ID,AU_FNAME,AU_LNAME)
                         VALUES(${Number(newAuthorId[0].COUNT)+1}, "${firstName}", "${lastName}")`;

    const postQuery = `INSERT INTO post(POST_ID,AU_ID,CONTENT,LIKES)
                       VALUES(${Number(newPostId[0].COUNT) + 1}, ${Number(newAuthorId[0].COUNT)+1}, "${content}", 0)`;
    
    
    con.query(authorQuery);
    con.query(postQuery);

    const result = await getAll();
    res.send(result);

});

app.delete("/:post_id", async (req,res) => {

    const id = req.params.post_id;

    con.query(`DELETE FROM blog.post WHERE POST_ID = ${id}`);

    const result = await getAll();
    res.send(result);

});

app.listen(8443, ()=>{

    console.log("Live at port 8443");

});
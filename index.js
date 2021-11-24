'use strict';
const express = require('express');
const mysql = require('mysql');
const fs = require('fs');

const app = express();

const json = fs.readFileSync('credentials.json', 'utf8');
const credentials = JSON.parse(json);

app.use(express.json());
app.use(express.urlencoded({extended:false}));

// service.use((request, response, next) => {
//     response.set('Access-Control-Allow-Origin', '*');
//     next();
// });

app.options('*', (request, response) => {
    response.set('Access-Control-Allow-Headers', 'Content-Type');
    response.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE');
    response.sendStatus(200);
});

const con = mysql.createConnection(credentials);

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
            if(err){
                reject();
            }else if(results.length === 0){

                reject("No post with that id");
            }
                resolve(results);
        });
    })
};

const getAll = function(){
    return new Promise((resolve,reject) => {
        const que = `SELECT blog.post.POST_ID, blog.author.AU_FNAME, blog.author.AU_LNAME, blog.post.TITLE , blog.post.CONTENT, blog.post.LIKES
                     FROM blog.post
                     INNER JOIN blog.author ON blog.post.AU_ID = blog.author.AU_ID;`;
        con.query(que, (error,respon,fiel) =>{
            
            const finalResult = [];
            for(let i = 0; i < respon.length; i++){
                finalResult.push(
                {
                    id:respon[i].POST_ID,
                    author: respon[i].AU_FNAME + " " + respon[i].AU_LNAME,
                    title: respon[i].TITLE ,
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

    const posts = await getAll().catch(err => res.json({ok:false, message: "error getting posts"}));
    res.send(posts);
    
});
app.get("/report.html", (req,res)=>{
    res.sendFile(__dirname+"/report.html");
});

app.get("/posts/:post_id", async (req,res)=>{

    try {
        const id = req.params.post_id;
        const post = await getPost(id);
        const author = await getAuthor(post[0].AU_ID)
        
        const result = [];
        result.push({
            id:post[0].POST_ID,
            author:  author[0].AU_FNAME + " " +author[0].AU_LNAME,
            title: post[0].TITLE,
            content: post[0].CONTENT,
            likes: post[0].LIKES 
        });
        res.send(result);

    } catch (error) {
        res.send({ok:false,message:error});
        return;
    }


});

app.patch("/:post_id/like", async (req,res)=>{
    const id = Number(req.params.post_id);

    con.query(`UPDATE post SET LIKES = LIKES + 1 WHERE POST_ID = ${id}`);

    try {
        const post = await getPost(id);
        const author = await getAuthor(post[0].AU_ID);
        const result = [];

        result.push({
            id: post[0].POST_ID ,
            author:  author[0].AU_FNAME + " " +author[0].AU_LNAME,
            title: post[0].TITLE,
            content: post[0].CONTENT,
            likes: post[0].LIKES
        });
        res.send(result);
    } catch (error) {
        res.send({ok:false,message:error});
    }


});

app.post("/post", async (req,res)=>{

    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const content = req.body.content;
    const title = req.body.title;
    
    const newPostId = await getID("post","POST_ID");
    const newAuthorId = await getID("author","AU_ID");

    const authorQuery = `INSERT INTO author(AU_ID,AU_FNAME,AU_LNAME)
                         VALUES(${Number(newAuthorId[0].COUNT)+1}, "${firstName}", "${lastName}")`;

    const postQuery = `INSERT INTO post(POST_ID,AU_ID,CONTENT,LIKES,TITLE)
                       VALUES(${Number(newPostId[0].COUNT) + 1}, ${Number(newAuthorId[0].COUNT)+1}, "${content}", 0,"${title}")`;
    
    
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

app.listen(5001, ()=>{

    console.log("Live at port 5001");

});
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

app.patch("/:post_id/like", (req,res)=>{
    const id = req.params.post_id;
    let result = [];

    con.query(`UPDATE post SET LIKES = LIKES + 1 WHERE POST_ID = ${id}`);

    con.query("SELECT * FROM post", (err,results,fields)=>{
        con.query(`SELECT AU_FNAME, AU_LNAME FROM blog.author WHERE AU_ID = ${results[0].AU_ID}`,
        (error,respon,fiel) =>{
            
            result.push(
                {
                    author: respon[0].AU_FNAME + " " +respon[0].AU_LNAME,
                    content: results[0].CONTENT,
                    likes: results[0].LIKES
                });

            res.send(result);

        });
    })

});



app.post("/", (req,res)=>{

     const user = req.body.user;
    res.json({
        us: `${user}` 
    });
});


app.get("/posts", (req,res)=>{

    let result = [];

    con.query("SELECT * FROM post", (err,results,fields)=>{
        
        con.query(`SELECT AU_FNAME, AU_LNAME FROM blog.author WHERE AU_ID = ${results[0].AU_ID}`,
        (error,respon,fiel) =>{
            
            result.push(
                {
                    author: respon[0].AU_FNAME + " " +respon[0].AU_LNAME,
                    content: results[0].CONTENT,
                    likes: results[0].LIKES
                });

            res.send(result);

        });

    }); 
    
});


app.listen(8443, ()=>{

    console.log("Live at port 8443");

});
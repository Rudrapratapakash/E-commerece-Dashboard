const express = require ("express");
require("./Db/config");
const User = require("./Db/user");
const Product = require("./Db/product");
const cors = require("cors");
const app = express();
const Jwt = require("jsonwebtoken");
const jwtKey= 'e-comm';
app.use(express.json());
app.use(cors());
app.post("/register",async (req,resp)=>{
    let user =new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password;
    Jwt.sign({result},jwtKey,{expiresIn:"2h"},(err,token)=>{
        if(err){
            resp.send({result:"There is something error, please try after sometimes"});
            
        }resp.send({result,auth:token});
    })
})

app.post("/login",async (req,resp)=>{
    console.log(req.body);
    if(req.body.password && req.body.email){
        let user =await User.findOne(req.body).select("-password");
    if(user){
        Jwt.sign({user},jwtKey,{expiresIn:"2h"},(err,token)=>{
            if(err){
                resp.send({result:"There is something error, please try after sometimes"});
                
            }resp.send({user,auth:token});
        })
        
    }else{
        resp.send({result:"User not found !!"})
    }
    }else{
        resp.send({result:"Error"});
    }
    
})

app.post('/new-product',verifyToken,async(req,res)=>{
    let product = new Product(req.body);
    let result = await product.save();
    res.send(result);
})

app.get('/products',verifyToken,async(req,res)=>{
    let products = await Product.find();
    if(products.length>0){
        res.send(products);
    }else{
        res.send({result:"No Data Found"}); 
    }
}) 

app.delete('/product/:id',verifyToken,async(req,res)=>{
    const result = await Product.deleteOne({_id:req.params.id});
    res.send(result);
}) 

app.get('/product/:id',verifyToken,async(req,res)=>{
    let result = await Product.findOne({_id:req.params.id});
    if(result){
        res.send(result);
    }else{
        res.send({result:"No Data Found"});
    }
})

app.put("/product/:id",verifyToken,async (req,res)=>{
    let result = await Product.updateOne(
        {_id:req.params.id},
    {$set:req.body});
    res.send(result);
})

app.get('/search/:key',verifyToken,async(req,res)=>{
    let result = await Product.find({
        "$or":[
            {name:{$regex:req.params.key}},
            {category:{$regex:req.params.key}},
            {company:{$regex:req.params.key}}
        ]
    }) 
    res.send(result);
})

function verifyToken(req,resp,next){
    let token = req.headers['authorization'];
    if(token){
        token = token.split(' ')[1];
        Jwt.verify(token,jwtKey,(err,valid)=>{
            if(err){
                resp.status(401).send({result:"Please Provide Valid Token"});
            }else{
                next();
            }
        })
    }else{
        resp.status(403).send({result:"Please add token with header."})
    }
}

app.listen(5000);  

 
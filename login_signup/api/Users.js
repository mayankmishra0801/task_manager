const express = require('express');
const router = express.Router();
const User = require('../models/Users');

// model for verification model
const UserVerification = require('../models/UserVerification')


// model for user verification model


const UserVerification = require("./../models/password")


// email handler
const nodemailer = require("nodemailer");


// unique string
const {v4: uuidv4} = require("uuid");

require("dotenv").config();


// password handler
const bcrypt = require('bcrypt')


// path for static verified page
const path  = require("path")


// nodemailer stuff
let transporter = nodemailer.createTransport({
  service:"gmail",
  auth:{
    user:process.env.AUTH_EMAIL,
    pass:process.env.AUTH_PASS,
    
  }
})

transporter.verify((error,success)=>{
  if(error){
     console.log(error)
  }else{
    console.log("Ready for messages");
    console.log(success)
  }
})

// testing success




router.post('/signup',(req,res)=>{
  let {name,email,password,dateOfBirth} = req.body;
  
  name = name.trim();
  email = email.trim();
  password = password.trim();
  dateOfBirth = dateOfBirth.trim();

  if(name == "" || email == "" || password == "" || dateOfBirth == ""){


    res.json({
        status:"FAILED",
        message:"Empty input fields!"

    });
  }else if(!/^[a-zA-Z ]*$/.test(name)){
    res.json({
        status:"Failed",
        message:"Invalid name entered"
    })
  }else if(!/^[w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)){

    res.json({
        status:"Failed",
        message:"Invalid name entered"
    })
  }else if(!new Date(dateOfBirth).getTime()){
    res.json({
        status:"Failed",
        message:"Invalid date of birth entered"
    })}
    else if(password.length<8){
      res.json({
        status:"Failed",
        message:"Password is too sort!"
      })
    }else{
      User.find({email}).then(result =>{
         if(result.length){
            res.json({
                status:"Failed",
                message:"User with the provided email already exist"
            })
         } else{
         const saltRounds = 10;
         bcrypt.hash(password,saltRounds).then(hashedPassword=>{
             const newUser =  new User({
                name,
                email,
                password:hashedPassword,
                dateOfBirth,
                Verified:false,
             });

             newUser.save().then(result =>{
                // res.json({
                //     status:"Success",
                //     message:"Signup successful",
                //     data:result,
                // })
              // handle account verification
              
              sendVerificationEmail(result,res);




             } ).catch(err=>{
                res.json({
                    status:"Failed",
                    message:"An error occurred while saving password"
                })
             })
         })
         }  
      }).catch(err =>{
        console.log(err);
        res.json({
            status:"Failed",
            message:"An error occurred"
        })
      })
    }

  }


);

// send verification email
const sendVerificationEmail = ({_id,email},res) =>{

  // url to be used in the email
  const currentUrl = "http://localhost:3008/";

  const uniqueString = uuidv4() + _id;


  // mailOptions

  const mailOptions = {
    from:process.env.AUTH_EMAIL,
    to:email,
    subject:"Verify Your Email",
    html:`<P>Verify your email address to complete signup and login into your account</P><p>This link<b>Expires in 6 hr</b></p><p>Press in 6 hours<a href=${currentUrl + "user/verify/" + _id + "/" +uniqueString}>here</a>to proceed</p>`
  };
  // hash the unique string
 const saltRounds = 10;
 bcrypt.hash(uniqueString,saltRounds)
 .then((hashedUniqueString)=>{
// set value in userverification collection
    
  const newVerification = new UserVerification({
    userId:_id,
    uniqueString:hashedUniqueString,
    createdAt:Date.now(),
    expiresAt:Date.now() + 21600000


  })

  newVerification.save().then(()=>{
    transporter.sendMail(mailOptions)
    .then(()=>{
       res.json({
        status:"Pending",
        message:"Verification email sent "
       })
    })
    .catch((error)=>{
      res.json({
        status:"Failed",
        message:"Verification email failed"
      })
    })
  }).catch((error)=>{
    console.log(error);
    res.json({
      status:"Failed",
      message:"couldn't save verification email data!"
    })
  })
    


 }).catch(()=>{
  res.json({
    status:"FAILED",
    message:"An error occured while hashing email detail!"
  })
 })



}

// verify email
router.get("/verify/:userId/:uniqueString",(req,res) =>{
let {userId,uniqueString} = req.params;

  UserVerification.find({userId}).then((result)=>{
     if(result.length > 0){
      //  user verification record exists so we proceed
    
      
      const {expiresAt} = result[0];
      const hashedUniqueString = result[0].uniqueString;

      // checking for expired unique string
      if(expiresAt <Date.now()){
        //  record has expired so we delete it

        UserVerification.deleteOne({userId})
        .then(result =>{
          User.deleteOne({_id,userId}).then(result =>{
            User.deleteOne({userId})
            .then(result=>{
              User.deleteOne({_id:userId}).then(()=>{
                let message = "Link has expired please signup again."
                res.redirect(`/user/verified/error=true&messages=${message}`);

              })
            
            })else{

            
              // valid record exist so we validate user string
              // first compare the hashed unique string
              
              bcrypt.compare(uniqueString,hashedUniqueString).then(result=>{
                if(result){
// string match
  user.updateOne({_id:userId},{Verified:true})
  .then(() =>{
    UserVerification.deleteOne({userId})
    .then(()=>{
      res.sendFile(path.join(__dirname,"./../views/verified.html"));

    })
    .catch(error=>{
      console.log(error);
      let message = "An error occurred while finalizing successful verification.";
      res.redirect('/user/verified/error=true&message=${message}');

    })
  })
  .catch(error=>{
      console.log(error);
      let message = "An error occurred while updating user record to show verified.";
      res.redirect('/user/verified/error=true&message=${message}');
  })

                }else{
               let message = "Invalid verification details passed.check your inbox. "
                res.redirect('/user/verified/error=true&message=${message}');

                }
              }).catch(error=>{
                  let message = "An error occurred while comparing unique strings.";
                  res.redirect(`/user/verified/error=true&message=${message}`);

              }).catch(error=>{
                let message= "An error occurred while comparing unique strings.";
                res.redirect('/user/verified/error=true&message=${message}')
              })
            }else{
            // user verification record doesn't exist
            let message = "Account record doesn't exist or has been verified already. Please signup or login";
            res.redirect(`/user/verified/error=true&messages=${message}`);
      
          }
        
          
          ).catch(error=>{
            let message = "An error occurred while clearing expired user verification record";
            res.redirect(`/user/verified/error=true&messages=${message}`);
          })
        })
      }
        // .catch((error)=>{

        //   console.log(error);
        //   let message = "An error occurred while clearing expired user verification record";
        //   res.redirect(`/user/verified/error=true&messages=${message}`);
        // })

      }
  }
  
  ).catch((error)=>{
      console.log(error);
      let message = "An error occurred while checking for existing user verification record";
      res.redirect(`/user/verified/error=true&messages=${message}`);

  })

// verified page route
router.get("/verified",(req,res)=>{
  // res.sendFile(path.join(__dirname,"./../views/verified.html"));
})


router.post('/signin',(req,res)=>{
  let {email,password} = req.body;
  email = email.trim();
  password = password.trim();

  if(email == "" || password == ""){
    res.json({
      status:"FAILED",
      message:"Empty crede"
    })
  }else {
    User.find({email})
    .then((data)=>{
      if(data.length){
// user exists
// check if user is verified

if(!data[0].Verified){
  res.json({
    status:"Failed",
    message:"Email has not been verified yet. Check your  inbox."
  });
}else{

  const hashedPassword = data[0].password;
  bcrypt.compare(password,hashedPassword).then(result=>{
    if(result){
      res.json({
        status:"success",
        message:"Signin successfully",
        data:data
        
      })
    }else{
      res.json({
        status:"Failed",
        message:"Invalid password entered"
      })
    }
  }).catch(err=>{
    res.json({status:"Failed",
  message:"An error occured while comparing password"})
  })

}


      


      }else{
        res.json({status:"Failed",
        message:"Invalid credentials entered"

      })
      }
    })
    .catch(err=>{
      res.json({
        status:"Failed",
        message:"An error occurred while checking for existing user"
      })
    })
  }
})


// password reset stuff


router.post("/requestPasswordReset",(req,res)=>{
     

  const {email,redirectUrl} = req.body;

  User.find({email})
.then((data)=>{
   if(data.length){
    // user exists


    // check if user is verified 
    if(!data[0].Verified){
      res.json({
        status:"Failed",
        message:"Email has not been verified yet. Check your inbox",
  
      }) 
    }else{
      // proceed with email to reset password
    sendResetEmail((data[0],redirectUrl,res))

    }

   }else{
    res.json({
      status:"Failed",
      message:"No account with the supplied email exists!",

    })
    

   }
})
  .catch(error=>{
    console.log(error);
    res.json({
      status:"Failed",
      message:"An error occurred while checking for existing user"
    })
  })

})


// send password reset email

const sendResetEmail = ({_id,email},redirectUrl,res)=>{
 const resetString  = uuidv4 + _id;
   
  //  first we clear all existing reset request

 password.deleteMany({userId:_id})
  .then(result=>{
  //  reset record deleted successfully
  // Now we send the email

  const mailOptions = {
    from:process.env.AUTH_EMAIL,
    to:email,
    subject:"Verify Your Email",
    html:`<P>We heard that you lost the password </P><p>Don't worry, we use the link below to reset it</p><p>This link<b>Expires in 60 minute</b></p><p>Press in 6 hours<a href=${currentUrl + "user/verify/" + _id + "/" +uniqueString}>here</a>to proceed</p>`
  };


  })
  .catch(error=>{
    // error while clearing existing record
    console.log(error);
    res.json({
      status:"Failed",
      message:"Clearing existing password reset records failed";

    })

   

  })


}



















module.exports = router;





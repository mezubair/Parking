const mongoose = require('mongoose');
const db='mongodb+srv://mesamparker1998:root@cluster0.kxw5t04.mongodb.net/?retryWrites=true&w=majority'
mongoose.connect(db).then(() =>{
console.log("connection sucessfull");
}).catch((err) => console.log("no connecion"));





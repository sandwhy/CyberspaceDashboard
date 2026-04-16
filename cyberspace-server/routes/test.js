const express           = require('express');
const router            = express.Router();

router.get('/', (req,res) =>{
  console.log("hello there");
  res.json('hello there');
});

module.exports = router;
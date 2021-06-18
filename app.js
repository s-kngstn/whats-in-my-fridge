require("dotenv").config();
const express = require("express");
const https = require("https");
const axios = require("axios").default;
const apiKey = process.env.API;
const app = express();

// We need the code below to parse the post request **
app.use(express.urlencoded({ extended: true }));
// Lets express know our CSS static files are stores in the 'Public' file
app.use(express.static("public"));
// Tells express to use ejs as its view engine
app.set("view engine", "ejs");

app.get("/", function (_req, res) {
  res.render("search");
});

app.post("/", function (req, res) {
  let ingredients = req.body.ingredients;
  if (ingredients.includes(" ")) {
    const ingSplit = ingredients.split(" ");
    ingredients = ingSplit.join(",");
  }
  // console.log(ingredients)
  const url = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${apiKey}&ingredients=${ingredients}&number=10`;
  let title;
  let image;
  const ingredientList = [];
  const stepList = [];
  https.get(url, function (response) {
    // console.log(response.statusCode);
    if (response.statusCode === 402) {
      res.render("402");
    } else {
      let ingredientItems = "";
      response.on("data", function (data) {
        ingredientItems += data;
      });

      response.on("end", function () {
        const jsonData = JSON.parse(ingredientItems);
        const recipes = jsonData;
        // console.log(recipes.length);
        if (recipes.length === 0) {
          res.render("notfound");
        } else {
          const random = Math.floor(Math.random() * recipes.length);

          title = recipes[random].title;
          image = recipes[random].image;

          recipes[random].usedIngredients.forEach(function (ingredient) {
            ingredientList.push(ingredient.original);
          });

          recipes[random].missedIngredients.forEach(function (ingredient) {
            ingredientList.push(ingredient.original);
          });

          // GETS YOUR COOKING INSTRUCTIONS (with a secondary API request through axios)//
          function getData() {
            return axios.get(
              `https://api.spoonacular.com/recipes/${recipes[random].id}/analyzedInstructions?apiKey=${apiKey}`
            );
          }
          Promise.all([getData()]).then(function (results) {
            const instructions = results[0];
            const eachStep = instructions.data[0].steps;
            if (
              !instructions ||
              instructions === undefined ||
              instructions === null ||
              instructions === ""
            ) {
              res.render("notfound");
              res.end();
            }
            if (
              !eachStep ||
              eachStep === undefined ||
              eachStep === "" ||
              eachStep === null
            ) {
              res.render("notfound");
              res.end();
            }
            eachStep.forEach(function (steps) {
              // console.log(steps.step);
              stepList.push(steps.step);
            });

            res.render("recipe", {
              title: title,
              image: image,
              ingredientList: ingredientList,
              stepList: stepList,
            });
            res.end();
          });
        }
      });
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log(`Server started on port ${port}`);
});

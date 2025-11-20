const { asyncErrorHandler } = require("../middleware/catchAsyncError");
const user = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const generateKeywords = require("../utils/generatingKeywords");
const publication = require("../models/publicationModel");

const sendToken = require("../utils/jwttoken");
const { sendEmail } = require("../utils/sendEmail.js");
const crypto = require("crypto");
const cloudinary = require("cloudinary");
const cheerio = require("cheerio");
const axios = require("axios");

require("dotenv").config({
  path: "../config/.env",
});
//creating a use
exports.createUser = asyncErrorHandler(async (req, res, next) => {
  const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
    folder: "avatars",
    width: 150,
    crop: "scale",
  });
  // const { name, email, password } = req.body;
  // const u=await user.create({
  //   name,
  //   email,
  //   password,
  //   avatar:{
  //     public_id:myCloud.public_id,
  //     url:myCloud.secure_url
  // }
  // });
  const u = await user.create({
    ...req.body,
    avatar: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });
  sendToken(u, 200, res);
});

//user login

exports.userLogin = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //checing if both email and password are entered
  if (!email || !password) {
    return next(new ErrorHandler("enter both email and password", 400));
  }

  const u = await user.findOne({ email }).select("+password");
  if (!u) {
    return next(new ErrorHandler("no user exist with this credentials", "404"));
  }

  const isPasswordMatched = await u.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("password is incorrect", 401));
  }

  sendToken(u, 200, res);
});

//logout user
exports.logout = asyncErrorHandler(async (req, res, next) => {
  res.clearCookie("token").status(200).json({
    success: true,
    message: "Logged Out",
  });
});

//generating password change token
exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
  const { email } = req.body;
  const u = await user.findOne({ email });
  if (!u) {
    return next(new ErrorHandler("user doesn't exist", 404));
  }
  const resetToken = u.getResetPasswordToken();
  //in getResetPasswordToken  some thing is assigned to model document but not saved so
  await u.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/user/pass_reset/${resetToken}`;
  const message = `Your password reset token is:-\n\n ${resetPasswordUrl}\n\nif you didn't requested for password change neglect this mail`;
  try {
    await sendEmail({
      email,
      subject: "password reset",
      message,
    });
    res.status(200).json({
      success: true,
      message: `email sent to ${email} successfully`,
    });
  } catch (error) {
    u.resetPasswordToken = undefined;
    u.resetPasswordExpire = undefined;
    await u.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset Password
exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
  // creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const u = await user.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!u) {
    return next(
      new ErrorHandler(
        "Reset Password Token is invalid or has been expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not password", 400));
  }

  u.password = req.body.password;
  u.resetPasswordToken = undefined;
  u.resetPasswordExpire = undefined;
  await u.save();

  sendToken(u, 200, res);
});

//get user details

exports.getUserDetails = asyncErrorHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});
//get user details

exports.getUserDetailsG = asyncErrorHandler(async (req, res, next) => {
  const u = await user.find({ name: req.query.name });

  res.status(200).json({
    success: true,
    user: u,
  });
});

//update password
exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
  const u = await user.findById(req.user.id).select("+password");
  const isPasswordMatched = await u.comparePassword(req.body.oldPassword);
  console.log(1);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }
  console.log(2);
  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("old password is incorrect", 400));
  }
  console.log(3);
  u.password = req.body.newPassword;
  await u.save();
  sendToken(u, 200, res);
});
//update password
exports.updatePasswords = asyncErrorHandler(async (req, res, next) => {
  const users = await user.find({});
  for (let i = 0; i < users.length; i++) {
    const u = await user.findById(users[i]._id).select("+password");
    u.password = "user@1234";
    await u.save();
  }
  res.json({ success: true });
});

//update profile
exports.updateProfile = asyncErrorHandler(async (req, res, next) => {
  const newprofile = {
    name: req.body.name,
    email: req.body.email,
  };
  //
  const u = await user.findByIdAndUpdate(req.user.id, newprofile, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    user: u,
  });
});
//get users by department
exports.usersByDepartment = asyncErrorHandler(async (req, res, next) => {
  // let users = await user.find({
  //   department: { $regex: req.query.department, $options: "i" },
  // });
  let users = await user.find({
    department: req.query.department,
  });
  res.status(200).json({
    length: users.length,
    success: true,
    users,
  });
});
//get users by department
exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {
  // let users = await user.find({
  //   department: { $regex: req.query.department, $options: "i" },
  // });
  let users = await user.find({
  });
  res.status(200).json({
    length: users.length,
    success: true,
    users,
  });
});

//update pass(to be deleted later)
exports.temp = asyncErrorHandler(async (req, res) => {
  const u = await user.findOne({ name: "Dr.Gunupudi Rajesh Kumar" });
  u.password = "rajesh sir";
  await u.save();
  res.status(200).json({
    success: true,
  });
});
//scrap the details
exports.scrapDetails = asyncErrorHandler(async (req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  const wait = (n) => new Promise((resolve) => setTimeout(resolve, n));
  let gsUrl = req.user.gsProfile;
  // scrap google scholar
  console.log(`${gsUrl.trim()}&cstart=0&pagesize=1000`);
  let response = await axios.get(`${gsUrl.trim()}&cstart=0&pagesize=1000`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
    },
  });
  // let response = await axios.get(`https://scholar.google.co.in/citations?user=sGJSZ1AAAAAJ&hl=en&cstart=0&pagesize=1000`, {
  //   headers: {
  //     "User-Agent":
  //       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
  //   },
  // });
  let data = response.data;
  let $ = cheerio.load(data);

  let ele = $(".gsc_a_at");
  let len = $(ele).length;
  console.log(len);
  const monthDictionary = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December",
  };
  const top = ["Journal", "Conference", "Book", "Patent office"];
  let publications = [];
  for (let i = 0; i < len; i++) {
    let url = $(ele[i]).attr("href");
    let resp = await axios.get(`https://scholar.google.co.in/${url}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
      },
    });
    let publication = {};
    publication.publicationDetails = "";
    publication.abstract = "";
    let d = resp.data;
    let x = cheerio.load(d);
    publication.nameOfAuthor = req.user.name;
    let e = x(".gsc_oci_title_link");
    if (x(e[0]).attr("href") != "") {
      publication.url = x(e[0]).attr("href");
    } else {
      publication.url = `https://scholar.google.co.in/${url}`;
    }
    publication.title = x(e[0]).text();
    e = x(".gs_scl");
    e.each((idx, ele) => {
      if (
        x(ele).find(".gsc_oci_field").text() == "Authors" ||
        x(ele).find(".gsc_oci_field").text() == "Inventors"
      ) {
        publication.listOfAuthors = x(ele).find(".gsc_oci_value").text();
      } else if (x(ele).find(".gsc_oci_field").text() == "Publication date") {
        let arr = x(ele).find(".gsc_oci_value").text().split("/");
        if (arr.length == 0) {
          publication.dateOfPublication = "1970-01-01";
          publication.month = monthDictionary[1];
          publication.year = "1970";
        } else if (arr.length == 1) {
          publication.dateOfPublication = `${arr[0]}-01-01`;
          publication.month = monthDictionary[1];
          publication.year = arr[0];
        } else if (arr.length == 2) {
          publication.dateOfPublication = `${arr[0]}-${
            Number(arr[1]) < 10 ? `0${arr[1]}` : arr[1]
          }-01`;
          publication.month = monthDictionary[Number(arr[1])];
          publication.year = arr[0];
        } else {
          if (Number(arr[1]) < 10) {
            arr[1] = `0${arr[1]}`;
          }
          if (Number(arr[2]) < 10) {
            arr[2] = `0${arr[2]}`;
          }
          publication.dateOfPublication = arr.join("-");
          publication.month = monthDictionary[Number(arr[1])];
          publication.year = arr[0];
        }
        publication.dateOfPublication = new Date(
          publication.dateOfPublication
        ).getTime();
      } else if (top.includes(x(ele).find(".gsc_oci_field").text())) {
        publication.typeOfPublication = x(ele).find(".gsc_oci_field").text();
        publication.nameOfPublicationPlatform = x(ele)
          .find(".gsc_oci_value")
          .text();
      } else if (
        x(ele).find(".gsc_oci_field").text() == "Pages" ||
        x(ele).find(".gsc_oci_field").text() == "Volume" ||
        x(ele).find(".gsc_oci_field").text() == "Issue" ||
        x(ele).find(".gsc_oci_field").text() == "Publisher"
      ) {
        publication.publicationDetails += `${x(ele)
          .find(".gsc_oci_field")
          .text()}:${x(ele).find(".gsc_oci_value").text()},`;
      } else if (x(ele).find(".gsc_oci_field").text() == "Description") {
        publication.abstract = x(ele).find(".gsc_oci_value").text();
      } else if (x(ele).find(".gsc_oci_field").text() == "Total citations") {
        let y = x(ele).find("a");
        publication.noOfCitations = x(y[0]).text().split(" ")[2];
      }
    });
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    let keywords = await axios.post(
      "http://127.0.0.1:5000/keywords",
      { text: publication.abstract },
      config
    );
    publication.keywords = keywords.data.keywords;
    publications = [...publications, publication];

    console.log(publication);
    await wait(60000);
  }
  // publication.deleteMany({ nameOfAuthor: req.user.name });
  // publication.insertMany(publications);

  res.json({
    success: true,
    publications,
  });
});
//scrap the details
exports.scrapAllPublications = asyncErrorHandler(async (req, res) => {
  let users = await user.find({
    $and: [{ department: "IT" }, { gsProfile: { $ne: "" } }],
  });
  const wait = (n) => new Promise((resolve) => setTimeout(resolve, n));

  for (let j = 0; j < users.length; j++) {
    let gsUrl = users[j].gsProfile;
    // scrap google scholar
    let response = await axios.get(`${gsUrl}&cstart=0&pagesize=1000`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
      },
    });
    // let response = await axios.get(`https://scholar.google.co.in/citations?user=sGJSZ1AAAAAJ&hl=en&cstart=0&pagesize=1000`, {
    //   headers: {
    //     "User-Agent":
    //       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
    //   },
    // });

    let data = response.data;
    let $ = cheerio.load(data);

    let ele = $(".gsc_a_at");
    let len = $(ele).length;
    console.log(len);
    const monthDictionary = {
      1: "January",
      2: "February",
      3: "March",
      4: "April",
      5: "May",
      6: "June",
      7: "July",
      8: "August",
      9: "September",
      10: "October",
      11: "November",
      12: "December",
    };
    const top = ["Journal", "Conference", "Book", "Patent office"];
    let publications = [];
    for (let i = 0; i < len; i++) {
      let url = $(ele[i]).attr("href");
      let resp = await axios.get(`https://scholar.google.co.in/${url}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
        },
      });
      let publication = {};
      publication.publicationDetails = "";
      publication.abstract = "";
      let d = resp.data;
      let x = cheerio.load(d);
      publication.nameOfAuthor = users[j].name;
      publication.noOfCitations = 0;
      publication.typeOfPublication = "Journal";
      let e = x(".gsc_oci_title_link");
      if (!(x(e[0]).attr("href") === undefined)) {
        publication.url = x(e[0]).attr("href");
      } else {
        publication.url = `https://scholar.google.co.in/${url}`;
      }
      e = x("#gsc_oci_title");
      publication.title = x(e[0]).text();
      e = x(".gs_scl");
      e.each((idx, ele) => {
        if (
          x(ele).find(".gsc_oci_field").text() == "Authors" ||
          x(ele).find(".gsc_oci_field").text() == "Inventors"
        ) {
          publication.listOfAuthors = x(ele).find(".gsc_oci_value").text();
        } else if (x(ele).find(".gsc_oci_field").text() == "Publication date") {
          let arr = x(ele).find(".gsc_oci_value").text().split("/");
          if (arr.length == 0) {
            publication.dateOfPublication = "1970-01-01";
            publication.month = monthDictionary[1];
            publication.year = "1970";
          } else if (arr.length == 1) {
            publication.dateOfPublication = `${arr[0]}-01-01`;
            publication.month = monthDictionary[1];
            publication.year = arr[0];
          } else if (arr.length == 2) {
            publication.dateOfPublication = `${arr[0]}-${
              Number(arr[1]) < 10 ? `0${arr[1]}` : arr[1]
            }-01`;
            publication.month = monthDictionary[Number(arr[1])];
            publication.year = arr[0];
          } else {
            if (Number(arr[1]) < 10) {
              arr[1] = `0${arr[1]}`;
            }
            if (Number(arr[2]) < 10) {
              arr[2] = `0${arr[2]}`;
            }
            publication.dateOfPublication = arr.join("-");
            publication.month = monthDictionary[Number(arr[1])];
            publication.year = arr[0];
          }
          publication.dateOfPublication = new Date(
            publication.dateOfPublication
          ).getTime();
        } else if (top.includes(x(ele).find(".gsc_oci_field").text())) {
          publication.typeOfPublication = x(ele).find(".gsc_oci_field").text();
          publication.nameOfPublicationPlatform = x(ele)
            .find(".gsc_oci_value")
            .text();
        } else if (
          x(ele).find(".gsc_oci_field").text() == "Pages" ||
          x(ele).find(".gsc_oci_field").text() == "Volume" ||
          x(ele).find(".gsc_oci_field").text() == "Issue" ||
          x(ele).find(".gsc_oci_field").text() == "Publisher"
        ) {
          publication.publicationDetails += `${x(ele)
            .find(".gsc_oci_field")
            .text()}:${x(ele).find(".gsc_oci_value").text()},`;
        } else if (x(ele).find(".gsc_oci_field").text() == "Description") {
          publication.abstract = x(ele).find(".gsc_oci_value").text();
        } else if (x(ele).find(".gsc_oci_field").text() == "Total citations") {
          let y = x(ele).find("a");
          publication.noOfCitations = x(y[0]).text().split(" ")[2];
        }
      });
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      let keywords = await axios.post(
        "http://127.0.0.1:5000/keywords",
        { text: publication.abstract },
        config
      );
      publication.keywords = keywords.data.keywords;
      publications = [...publications, publication];

      console.log(publication);
      await wait(60000);
    }
  }
  publication.deleteMany({ nameOfAuthor: req.user.name });
  publication.insertMany(publications);

  res.json({
    success: true,
    publications,
  });
});

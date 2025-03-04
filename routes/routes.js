const express = require ('express');
const router = express.Router();
const User = require ('../models/users');
const multer = require ('multer');
const fs = require ('fs');
//image upload

var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './uploads');
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname +"_"+ Date.now() +"" + file.originalname);
    },
});

var upload = multer({
    storage: storage,
}).single('image')

//insert an user into database route

router.post('/add', upload, (req, res) => {
    const user = new User ({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: req.file.filename,
        
    }) 
        user.save().then(()=> {
         req.session.message = {
            type: 'success',
            message: 'User added successfully!',
        };
        res.redirect('/');
       }).catch((err) => {
        res.json({message: err.message, type: 'danger'})
       });
});
// Get all users

router.get("/", async (req, res) => {
    try {
        const users = await User.find().exec();
        res.render('index', {
            title: "Home Page", 
            users: users
        });
    } catch (err) {
        res.json({message: err.message})
    }
});


router.get('/add', (req, res) => {
    res.render("add_user", {title: "Add Users" });
})


// Edit an User route
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);

        if (!user) {
            return res.redirect('/');
        }

        res.render("edit_users", {
            title: "Edit User",
            user: user,
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// Update user route 
router.post("/update/:id", upload, async (req, res) => {
    const id = req.params.id;
    let new_image = req.body.old_image;  // Default to old image

    // Handle image upload and deletion
    if (req.file) {
        new_image = req.file.filename;
        if (req.body.old_image) {
            try {
                fs.unlinkSync(`./uploads/${req.body.old_image}`);
            } catch (err) {
                console.error("Failed to delete old image:", err);
            }
        }
    }

    try {
        // Update user details
        const result = await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_image,
        });

        if (!result) {
            return res.status(404).json({ message: "User not found", type: "danger" });
        }

        // Redirect OR send JSON, not both
        res.redirect("/");  // For browser-based flow
        // OR
        // res.json({ type: "success", message: "User updated successfully!" }); // For API flow
    } catch (err) {
        console.error("Update failed:", err);
        res.status(500).json({ message: err.message, type: "danger" });
    }
});


   
// Delete user route 
router.get("/delete/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const result = await User.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ message: "User not found" });
        }

        // Delete the associated image if it exists
        if (result.image) {
            try {
                fs.unlinkSync('./uploads/' + result.image);
            } catch (err) {
                console.error("Failed to delete user image:", err);
            }
        }

        // Corrected: Use req.session instead of res.session
        req.session.message = {
            type: "info",
            message: "User deleted successfully!",
        };

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;  
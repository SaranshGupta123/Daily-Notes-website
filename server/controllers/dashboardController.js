const Note = require("../models/Notes");
const mongoose = require("mongoose");

/**
 * GET /dashboard
 * Dashboard
 */
exports.dashboard = async (req, res) => {
  let perPage = 12; // Number of notes per page
  let page = req.query.page || 1; // Current page

  const locals = {
    title: "Dashboard",
    description: "Free NodeJS Notes App.",
  };

  try {
    const notes = await Note.aggregate([
      { $sort: { updatedAt: -1 } },
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      {
        $project: {
          title: { $substr: ["$title", 0, 30] }, // Truncate title to 30 characters
          body: { $substr: ["$body", 0, 100] }, // Truncate body to 100 characters
        },
      }
    ])
      .skip(perPage * page - perPage) // Pagination logic
      .limit(perPage) // Limit to perPage items
      .exec();

    const count = await Note.countDocuments({ user: req.user.id }); // Count user-specific notes

    res.render('dashboard/index', {
      userName: req.user.firstName,
      locals,
      notes,
      layout: "../views/layouts/dashboard",
      current: page,
      pages: Math.ceil(count / perPage) // Total pages for pagination
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

/**
 * GET /dashboard/item/:id
 * View Specific Note
 */
exports.dashboardViewNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).where({ user: req.user.id }).lean();

    if (note) {
      res.render("dashboard/view-note", {
        noteID: req.params.id,
        note,
        layout: "../views/layouts/dashboard",
      });
    } else {
      res.status(404).send("Note not found.");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

/**
 * PUT /dashboard/item/:id
 * Update Specific Note
 */
exports.dashboardUpdateNote = async (req, res) => {
  try {
    await Note.findOneAndUpdate(
      { _id: req.params.id },
      { title: req.body.title, body: req.body.body, updatedAt: Date.now() }
    ).where({ user: req.user.id });
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

/**
 * DELETE /dashboard/item-delete/:id
 * Delete Note
 */
exports.dashboardDeleteNote = async (req, res) => {
  try {
    await Note.deleteOne({ _id: req.params.id }).where({ user: req.user.id });
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

/**
 * GET /dashboard/add
 * Add Notes
 */
exports.dashboardAddNote = async (req, res) => {
  res.render("dashboard/add", {
    layout: "../views/layouts/dashboard",
  });
};

/**
 * POST /dashboard/add
 * Add Notes
 */
exports.dashboardAddNoteSubmit = async (req, res) => {
  try {
    req.body.user = req.user.id; // Associate the note with the logged-in user
    await Note.create(req.body); // Create a new note
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

/**
 * GET /dashboard/search
 * Search
 */
exports.dashboardSearch = async (req, res) => {
  try {
    res.render("dashboard/search", {
      searchResults: "",
      layout: "../views/layouts/dashboard",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

/**
 * POST /dashboard/search
 * Search For Notes
 */
exports.dashboardSearchSubmit = async (req, res) => {
  try {
    const searchTerm = req.body.searchTerm;
    const searchNoSpecialChars = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");

    const searchResults = await Note.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChars, "i") } },
        { body: { $regex: new RegExp(searchNoSpecialChars, "i") } },
      ],
    }).where({ user: req.user.id });

    res.render("dashboard/search", {
      searchResults,
      layout: "../views/layouts/dashboard",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

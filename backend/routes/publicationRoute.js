const express = require("express");
const {
  getPublicationsOfUser,
  getPublications,
  getPublicationDetails,
  getPublicationHome,
  getPublicationsAdmin,
  getAdminPublications,
  deletePublication,
  updatePublication,
  deleteAllPublication,
  getPublicationsHome,
  update,
  getIt,
  getPeriodAnalytics,
} = require("../controllers/publicationController");
const { isAuthenticatedUser, authorizedRoles } = require("../middleware/auth");
const router = express.Router();

router
  .route("/user-publications")
  .post(isAuthenticatedUser, getPublicationsOfUser);
router.route("/publications").post(getPublications);
router.route("/publications_analytics").post(getPeriodAnalytics);
router
  .route("/admin/publications")
  .get(isAuthenticatedUser, authorizedRoles("admin"), getPublicationsAdmin);
router
  .route("/admin/delete/:id")
  .delete(isAuthenticatedUser, authorizedRoles("admin"), deletePublication);
router
  .route("/admin/delete-all")
  .delete(
    isAuthenticatedUser,
    authorizedRoles("admin"),
    deleteAllPublication
  );
router
  .route("/admin/update/:id")
  .put(isAuthenticatedUser, authorizedRoles("admin"), updatePublication);
router.route("/publications-for-home").get(getPublicationHome);
router.route("/publicationsCount-for-home").get(getPublicationsHome);
router.route("/:id").get(getPublicationDetails);

module.exports = router;

import express from 'express';
import { 
  createPlan, 
  getPlans, 
  getPlanById, 
  updatePlan, 
  deletePlan, 
  downloadSinglePlanPDF, 
  downloadAllPlansPDF, 
  downloadCategoryPlansPDF, 
  generateShareLink,
  getSharedPlanPDF
} from '../controllers/studentPlanController.js';
import { protect } from '../middlewares/authMiddleware.js';

const studentPlanRouter = express.Router();
const shareRouter = express.Router();

// Protected Student Plan Routes
studentPlanRouter.route('/')
  .post(protect, createPlan)
  .get(protect, getPlans);

studentPlanRouter.route('/pdf/all')
  .get(protect, downloadAllPlansPDF);

studentPlanRouter.route('/pdf/category/:category')
  .get(protect, downloadCategoryPlansPDF);

studentPlanRouter.route('/:id')
  .get(protect, getPlanById)
  .put(protect, updatePlan)
  .delete(protect, deletePlan);

studentPlanRouter.route('/:id/pdf')
  .get(protect, downloadSinglePlanPDF);

studentPlanRouter.route('/:id/share-link')
  .post(protect, generateShareLink);

// Public PDF Share Route
shareRouter.route('/:shareToken')
  .get(getSharedPlanPDF);

export { studentPlanRouter, shareRouter };

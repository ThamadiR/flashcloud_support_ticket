import { Router } from 'express';
import {
  list,
  create,
  getContactsByCompany,
  updateCompany,
  deleteCompany,
} from '../controllers/companiesController';

const router = Router();

router.get('/', list);
router.post('/', create);
router.get('/by-company/:companyId', getContactsByCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

export default router;
